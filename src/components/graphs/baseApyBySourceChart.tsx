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
  apy: number;
  allocationPercentage: number;
}

interface ChartDataPoint {
  date: string;
  totalApy: number;
  strategies: Strategy[];
  [key: string]: string | number | Strategy[];
}

interface BaseApyBySourceChartProps {
  // Add any props if needed, e.g., for filtering
}

export default function BaseApyBySourceChart({}: BaseApyBySourceChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        console.log(`Fetching base APY by source data for period: ${period}`);
        const response = await fetch(
          `https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/syUSD/base-apy-by-source?period=${period}`
        );

        console.log("Response status hosted allocation apy :", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
          console.error("API responded with status:", response.status);
          console.error("Response text:", await response.text());
          throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw base APY by source data:", rawData);

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

        // Use all data without filtering any dates
        const filteredData = processedData;

        console.log("All base APY by source data (no date filtering):", filteredData);
        setData(filteredData);

        // Extract strategy addresses from the first data point
        if (filteredData.length > 0 && filteredData[0].strategies) {
          const firstEntry = filteredData[0];
          const extractedKeys = firstEntry.strategies.map(
            (strategy: Strategy) => strategy.strategy
          );
          setKeys(extractedKeys);
          setSelectedKeys(new Set(extractedKeys));
        }
      } catch (err) {
        console.error("Error loading base APY by source data:", err);
        // Set empty data on error
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

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
      totalApy: item.totalApy,
    };

    if (item.strategies && Array.isArray(item.strategies)) {
      item.strategies.forEach((strategy: Strategy) => {
        transformed[strategy.strategy] = strategy.apy; // APY value
        transformed[`${strategy.strategy}_allocation`] =
          strategy.allocationPercentage / 100; // Convert percentage to decimal
      });
    }

    return transformed;
  });

  const filteredData = transformedData.map((item) => {
    const filtered: any = { date: item.date, totalApy: item.totalApy };
    Object.keys(item).forEach((k) => {
      if (k === "date" || k === "totalApy" || selectedKeys.has(k)) {
        filtered[k] = item[k];
        // Also include the corresponding allocation value
        if (selectedKeys.has(k)) {
          const allocationKey = `${k}_allocation`;
          if (item[allocationKey] !== undefined) {
            filtered[allocationKey] = item[allocationKey];
          }
        }
      }
    });
    return filtered;
  });

  if (loading)
    return (
      <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 chart-container">
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-1 items-center">
            <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">
              Daily
            </div>
            <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">
              Weekly
            </div>
            <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">
              Monthly
            </div>
          </div>
        </div>

        <div className="w-full h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">
              Loading base APY by source data...
            </p>
          </div>
        </div>
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
            const apy = entry.value;
            const allocationKey = `${strategyAddress}_allocation`;
            const allocationValue = entry.payload[allocationKey];

            let formattedAllocation = "N/A";
            if (allocationValue !== undefined && allocationValue !== null) {
              const numValue = Number(allocationValue);
              if (!isNaN(numValue)) {
                formattedAllocation = `${(numValue * 100).toFixed(2)}%`;
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
                {`${displayName}: ${apy.toFixed(2)}% (${formattedAllocation})`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 chart-container">
      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "daily"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "weekly"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "monthly"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="70%">
          <AreaChart
            data={[...filteredData].reverse()}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            stackOffset="expand"
            style={{
              outline: "none",
              border: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
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
        <div className="w-full mt-6">
          <div
            className="grid grid-cols-auto-fit gap-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginLeft: "24px",
              marginRight: "24px",
            }}
          >
            {keys.map((key, idx) => {
              const isSelected = selectedKeys.has(key);
              // Truncate long addresses for display
              const displayName =
                key.length > 10 ? `${key.slice(0, 6)}...${key.slice(-4)}` : key;

              return (
                <div
                  key={key}
                  className="flex items-center gap-6 cursor-pointer px-3 py-2 rounded bg-[#2A2A3C] hover:bg-[#3A3A4C] transition-colors"
                  onClick={() => handleLegendClick(key)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 ml-6"
                    style={{
                      backgroundColor: isSelected
                        ? colors[idx % colors.length]
                        : "#666666",
                    }}
                  />
                  <span
                    className={`text-xs whitespace-nowrap  ${
                      isSelected ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {isSelected ? displayName : `${displayName} (deselected)`}
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
