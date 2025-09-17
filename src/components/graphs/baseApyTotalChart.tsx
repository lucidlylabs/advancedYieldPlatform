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

interface ChartDataPoint {
  date: string;
  totalApy: number;
}

interface BaseApyTotalChartProps {
  // No props needed
}

export default function BaseApyTotalChart({}: BaseApyTotalChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching base APY total data for period: ${period}`);

        const response = await fetch(`http://localhost:3001/api/apy/exchange-rates-apy-simple?period=${period}`);

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
          console.error("API responded with status:", response.status);
          console.error("Response text:", await response.text());
          throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw base APY total data:", rawData);
        console.log("Raw data type:", typeof rawData);
        console.log("Raw data keys:", Object.keys(rawData));

        // Process the data - API returns array directly
        let processedData = rawData;
        console.log("Processed data:", processedData);

        // Ensure we have an array
        if (!Array.isArray(processedData)) {
          console.warn(
            "API returned non-array data, converting to array:",
            processedData
          );
          processedData = [processedData];
        }

        console.log(
          "Final processed data before transformation:",
          processedData
        );

        // Transform data for the chart - API has date and annualizedAPY fields
        const transformedData = processedData.map(
          (item: any, index: number) => {
            console.log(`Processing item ${index}:`, item);

            let dateStr = "";
            let apyValue = 0;

            try {
              // Use the date field from API response
              const dateField = item.date;
              if (dateField) {
                const date = new Date(dateField);
                if (!isNaN(date.getTime())) {
                  // Format date based on period
                  if (period === "weekly") {
                    dateStr = `Week of ${date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`;
                  } else if (period === "monthly") {
                    dateStr = date.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    });
                  } else {
                    // Daily format
                    dateStr = date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }
                } else {
                  console.warn(`Invalid date for item ${index}:`, dateField);
                  dateStr = `Item ${index}`;
                }
              } else {
                console.warn(`No date field found for item ${index}:`, item);
                dateStr = `Item ${index}`;
              }

              // Use the annualizedAPY field from API response
              apyValue = item.annualizedAPY || 0;
              if (typeof apyValue === "string") {
                apyValue = parseFloat(apyValue) || 0;
              }

              console.log(
                `Item ${index} transformed: date="${dateStr}", apy=${apyValue}`
              );
            } catch (error) {
              console.error(`Error processing item ${index}:`, error, item);
              dateStr = `Item ${index}`;
              apyValue = 0;
            }

            return {
              date: dateStr,
              totalApy: apyValue,
            };
          }
        );

        console.log("Final transformed data:", transformedData);

        // Filter out invalid data points
        const validData = transformedData.filter(
          (item: any) =>
            item.date && item.totalApy !== undefined && !isNaN(item.totalApy)
        );

        console.log("Valid data for chart:", validData);
        setData(validData);
      } catch (err) {
        console.error("Error loading base APY total data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Custom tooltip content component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = `${value.toFixed(2)}%`;

      return (
        <div className="rounded-lg shadow-lg overflow-hidden border border-gray-200 relative z-50">
          {/* Header - Darker grey background */}
          <div className="bg-gray-300 border-b border-gray-400 px-4 py-3">
            <div className="text-sm font-semibold text-gray-700">
              {label}
            </div>
          </div>
          
          {/* Content - Light grey background */}
          <div className="bg-gray-100 px-4 py-3 relative z-50">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 flex-1">
                Total APY:
              </span>
              <span className="text-sm font-semibold text-gray-700 text-right">
                {formattedValue}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 chart-container">
        <div className="w-full h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">
              Loading base APY total data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 chart-container">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-white"></div>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "daily"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "weekly"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "monthly"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="70%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            style={{
              outline: "none",
              border: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          >
            <defs>
              <linearGradient id="colorTotalApy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B5FFF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7B5FFF" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Time",
                position: "bottom",
                offset: 10,
                style: { fill: "#A3A3A3", fontSize: 14, fontWeight: "500" },
              }}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => `${val.toFixed(2)}%`}
              label={{
                value: "Total APY (%)",
                angle: -90,
                position: "left",
                offset: 15,
                style: { fill: "#A3A3A3", fontSize: 14, fontWeight: "500" },
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              labelFormatter={(label: string) => label}
            />
            <Area
              type="monotone"
              dataKey="totalApy"
              stroke="#7B5FFF"
              strokeWidth={2}
              fill="url(#colorTotalApy)"
              name="Total APY"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}