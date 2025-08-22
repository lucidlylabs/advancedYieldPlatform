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
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        console.log("Fetching allocation data...");
        const response = await fetch(
          "http://localhost:3001/api/allocation/daily-allocation"
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
          setKeys(extractedKeys);
          setSelectedKeys(new Set(extractedKeys));
        }
      } catch (err) {
        console.error("Error loading allocation data:", err);
        // Set empty data on error
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading)
    return (
      <div className="p-6 rounded-xl text-white w-full">
        Loading allocation data...
      </div>
    );

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#1C1D2A",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
          }}
        >
          <p style={{ color: "#A3A3A3", margin: "0 0 4px 0" }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            const strategyAddress = entry.name;
            const percentage = entry.value * 100; // Convert back to percentage
            const tvlKey = `${strategyAddress}_tvl`;
            const tvlValue = entry.payload[tvlKey];

            let formattedTvl = "N/A";
            if (tvlValue !== undefined && tvlValue !== null) {
              const numValue = Number(tvlValue);
              if (!isNaN(numValue)) {
                formattedTvl =
                  numValue >= 1000
                    ? `$${(numValue / 1000).toFixed(1)}K`
                    : `$${numValue.toFixed(0)}`;
              }
            }

            // Truncate long addresses for display
            const displayName =
              strategyAddress.length > 10
                ? `${strategyAddress.slice(0, 6)}...${strategyAddress.slice(
                    -4
                  )}`
                : strategyAddress;

            return (
              <p key={index} style={{ color: entry.fill, margin: "2px 0" }}>
                {`${displayName}: ${percentage.toFixed(2)}% (${formattedTvl})`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl text-white w-full max-w-none mb-8 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
      <div className="w-full h-[400px] focus:outline-none focus:ring-0 focus:border-0">
        <ResponsiveContainer width="100%" height="70%" className="focus:outline-none focus:ring-0 focus:border-0">
                      <AreaChart
              data={[...filteredData].reverse()}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              stackOffset="expand"
              style={{ outline: 'none', border: 'none' }}
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
              content={<CustomTooltip />}
              labelFormatter={(label: string) => label}
            />
            {keys
              .filter((k) => selectedKeys.has(k))
              .map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.8}
                  name={key}
                />
              ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      {data.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {keys.map((key, idx) => {
            const isSelected = selectedKeys.has(key);
            // Truncate long addresses for display
            const displayName =
              key.length > 10 ? `${key.slice(0, 6)}...${key.slice(-4)}` : key;

            return (
              <div
                key={key}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleLegendClick(key)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: isSelected
                      ? colors[idx % colors.length]
                      : "#666666",
                  }}
                />
                <span
                  className={`text-xs ${
                    isSelected ? "text-white" : "text-gray-500"
                  }`}
                >
                  {isSelected ? displayName : `${displayName} (deselected)`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
