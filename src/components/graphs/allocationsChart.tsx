import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CommonTooltip } from "../ui/tooltip";
import { getStrategyDisplayName } from "../../config/env";

interface Strategy {
  strategy: string;
  network: string;
  tvl: number;
  allocationPercentage: number;
}

interface ChartDataPoint {
  date: string;
  totalTvl: number;
  strategies: Strategy[];
  [key: string]: string | number | Strategy[];
}

interface AllocationChartProps {
  // Add any props if needed, e.g., for filtering
}

export default function AllocationChart({}: AllocationChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only show loading on initial load
        if (initialLoading) {
          setLoading(true);
        }

        console.log("Fetching allocation data...");
        const response = await fetch(
          "https://ow5g1cjqsd.execute-api.ap-south-1.amazonaws.com/dev/api/allocation/daily-allocation"
        );

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
          console.error("API responded with status:", response.status);
          console.error("Response text:", await response.text());
          throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw allocation data:", rawData);

        // Extract the data array from the API response
        let processedData = rawData.data || rawData;

        // Ensure we have an array
        if (!Array.isArray(processedData)) {
          console.warn(
            "API returned non-array data, converting to array:",
            processedData
          );
          processedData = [processedData];
        }

        console.log("Processed allocation data:", processedData);
        setData(processedData);

        // Extract strategy addresses from the first data point
        if (processedData.length > 0 && processedData[0].strategies) {
          const firstEntry = processedData[0];
          const extractedKeys = firstEntry.strategies.map(
            (strategy: Strategy) => strategy.strategy
          );
          console.log("Extracted strategy addresses:", extractedKeys);
          console.log("Strategy names from config:", extractedKeys.map((addr: string) => getStrategyDisplayName(addr)));
          setKeys(extractedKeys);
          setSelectedKeys(new Set(extractedKeys));
        }
      } catch (err) {
        console.error("Error loading allocation data:", err);
        // Set empty data on error
        setData([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [initialLoading]);

  const handleLegendClick = (key: string) => {
    setSelectedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Transform data for the chart - flatten strategies into individual properties
  const transformedData = data.map((item) => {
    const transformed: any = {
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      totalTvl: item.totalTvl,
    };

    if (item.strategies && Array.isArray(item.strategies)) {
      item.strategies.forEach((strategy: Strategy) => {
        // Keep original address as key for data consistency
        transformed[strategy.strategy] = strategy.allocationPercentage / 100; // Convert percentage to decimal
        transformed[`${strategy.strategy}_tvl`] = strategy.tvl;
      });
    }

    return transformed;
  });

  const filteredData = transformedData.map((item) => {
    const filtered: any = { date: item.date, totalTvl: item.totalTvl };
    Object.keys(item).forEach((k) => {
      if (k === "date" || k === "totalTvl" || selectedKeys.has(k)) {
        filtered[k] = item[k];
        // Also include the corresponding TVL value
        if (selectedKeys.has(k)) {
          const tvlKey = `${k}_tvl`;
          if (item[tvlKey] !== undefined) {
            filtered[tvlKey] = item[tvlKey];
          }
        }
      }
    });
    return filtered;
  });

  // Debug logging
  console.log("Selected keys:", Array.from(selectedKeys));
  console.log("Filtered data keys:", filteredData.length > 0 ? Object.keys(filteredData[0]) : []);
  console.log("Transformed data keys:", transformedData.length > 0 ? Object.keys(transformedData[0]) : []);

  if (initialLoading && loading) {
    return (
      <div className="rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
        <div className="w-full h-[300px] px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">Loading allocations data...</p>
          </div>
        </div>
      </div>
    );
  }

  const colors = [
    "#7B5FFF", // violet
    "#5CD6FF", // cyan
    "#C3F34A", // lime
    "#FF6B6B", // red
    "#4ECDC4", // teal
    "#45B7D1", // blue
    "#96CEB4", // green
    "#FFEAA7", // yellow
    "#DDA0DD", // plum
    "#98D8C8", // mint
  ];

  return (
    <div className="pb-6 rounded-xl text-white w-full max-h-[600px] mb-12 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
            <div className="w-full h-[345px] focus:outline-none focus:ring-0 focus:border-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="focus:outline-none focus:ring-0 focus:border-0"
        >
          {filteredData.length > 0 ? (
            <AreaChart
              data={[...filteredData].reverse()}
              margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
              stackOffset="expand"
              style={{ outline: "none", border: "none" }}
              className="focus:outline-none focus:ring-0 focus:border-0"
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              orientation="left"
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <CommonTooltip
                  active={active}
                  payload={payload}
                  label={String(label)}
                  title={String(label)}
                  showTotal={true}
                  totalLabel="Total"
                  valueFormatter={(value) => `${(value * 100).toFixed(2)}%`}
                  totalFormatter={(value) => {
                    const totalTvl = payload?.[0]?.payload?.totalTvl || 0;
                    return totalTvl >= 1000
                      ? `$${(totalTvl / 1000).toFixed(1)}K`
                      : `$${totalTvl.toFixed(0)}`;
                  }}
                  showColoredCircles={true}
                  monetaryValueFormatter={(item) => {
                    // The item.name is now the strategy name, but we need the original address to get TVL
                    // We need to find the original address that corresponds to this strategy name
                    const strategyAddress = keys.find(key => getStrategyDisplayName(key) === item.name);
                    
                    if (strategyAddress) {
                      const tvlKey = `${strategyAddress}_tvl`;
                      const tvlValue = item.payload[tvlKey];
                      
                      if (tvlValue !== undefined && tvlValue !== null) {
                        const numValue = Number(tvlValue);
                        if (!isNaN(numValue)) {
                          return numValue >= 1000
                            ? `$${(numValue / 1000).toFixed(1)}K`
                            : `$${numValue.toFixed(0)}`;
                        }
                      }
                    }
                    
                    // Fallback: try to get TVL from the item payload directly
                    const directTvlValue = item.payload?.tvl || item.payload?.value;
                    if (directTvlValue !== undefined && directTvlValue !== null) {
                      const numValue = Number(directTvlValue);
                      if (!isNaN(numValue)) {
                        return numValue >= 1000
                          ? `$${(numValue / 1000).toFixed(1)}K`
                          : `$${numValue.toFixed(0)}`;
                      }
                    }
                    
                    return "$0";
                  }}
                  // Use strategy names in tooltip
                  nameFormatter={(name) => getStrategyDisplayName(name)}
                />
              )}
              labelFormatter={(label: string) => label}
            />
            {keys
              .filter((k) => selectedKeys.has(k))
              .map((key, idx) => {
                console.log(`Rendering Area for key: ${key}, name: ${getStrategyDisplayName(key)}`);
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.8}
                    name={getStrategyDisplayName(key)}
                  />
                );
              })}
                      </AreaChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div>Chart data loading...</div>
              <div className="text-xs mt-2">Filtered data length: {filteredData.length}</div>
              <div className="text-xs">Selected keys: {Array.from(selectedKeys).join(', ')}</div>
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      {data.length > 0 && (
        <div className="w-full mt-6">
          <div
            className="grid grid-cols-4 gap-6 justify-items-start"
            style={{
              width: "100%",
              marginLeft: "24px",
              marginRight: "24px",
            }}
          >
            {keys.map((key, idx) => {
              const isSelected = selectedKeys.has(key);
              // Convert address to strategy name for display
              const displayName = getStrategyDisplayName(key);
              const buttonColor = colors[idx % colors.length];
              
              console.log(`Legend item - key: ${key}, displayName: ${displayName}, isSelected: ${isSelected}`);

              return (
                <div
                  key={key}
                  className="flex items-start gap-3 cursor-pointer transition-opacity duration-200 w-full"
                  onClick={() => handleLegendClick(key)}
                  style={{
                    opacity: isSelected ? 1 : 0.5,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: buttonColor,
                    }}
                  />
                  <span
                    className={`text-xs font-medium leading-tight ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                    style={{
                      wordBreak: "break-word",
                      maxWidth: "120px",
                    }}
                  >
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
