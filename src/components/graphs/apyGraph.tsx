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
  weeklyAPY: number;
  annualizedAPY: number;
}

import { USD_STRATEGIES, BTC_STRATEGIES } from "../../config/env";

interface BaseApyGraphProps {
  vaultAddress?: string;
  strategyType?: "USD" | "BTC" | "ETH" | "HLP";
}

export default function BaseApyGraph({ vaultAddress = "0x279CAD277447965AF3d24a78197aad1B02a2c589", strategyType = "USD" }: BaseApyGraphProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if APY endpoint is available for this strategy
        // For syHLP, treat like syBTC (no data available)
        if (strategyType === "HLP") {
          console.log("syHLP APY data not available");
          setData([]);
          setLoading(false);
          return;
        }
        
        const strategy = strategyType === "BTC" 
          ? BTC_STRATEGIES.PERPETUAL_DURATION.STABLE 
          : USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
        
        if (!strategy.apy || strategy.apy === "") {
          console.log(`APY data not available for ${strategyType}`);
          setData([]);
          setLoading(false);
          return;
        }

        console.log(`Fetching base APY data for vault: ${vaultAddress}, period: ${period}, strategy: ${strategyType}`);

        const response = await fetch(`https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/base-apy?period=${period}`);

        console.log("Response status:", response.status);

        if (!response.ok) {
          console.error("API responded with status:", response.status);
          console.error("Response text:", await response.text());
          throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw base APY data:", rawData);

        // Extract the data array from the API response
        let processedData = rawData.data || [];

        // Ensure we have an array
        if (!Array.isArray(processedData)) {
          console.warn(
            "API returned non-array data, converting to array:",
            processedData
          );
          processedData = [processedData];
        }

        console.log("Processed data before transformation:", processedData);

        // Filter data from August 1st onwards first, then transform
        const august1st2024 = new Date('2024-08-01');
        const filteredByDate = processedData.filter((item: any) => {
          try {
            if (item.date) {
              const itemDate = new Date(item.date);
              return !isNaN(itemDate.getTime()) && itemDate >= august1st2024;
            }
          } catch (error) {
            console.warn(`Error parsing date for filtering:`, error);
          }
          return false;
        });

        console.log(`Filtered from ${processedData.length} to ${filteredByDate.length} data points (August 1st onwards)`);

        // Transform the filtered data for the chart
        const transformedData = filteredByDate.map(
          (item: any, index: number) => {
            console.log(`Processing item ${index}:`, item);

            let dateStr = "";
            let weeklyApy = 0;
            let annualizedApy = 0;

            try {
              // Use the date field from API response
              const dateField = item.date;
              if (dateField) {
                const date = new Date(dateField);
                if (!isNaN(date.getTime())) {
                  // Format date consistently - just show the actual date
                  dateStr = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  });
                } else {
                  console.warn(`Invalid date for item ${index}:`, dateField);
                  dateStr = `Item ${index}`;
                }
              } else {
                console.warn(`No date field found for item ${index}:`, item);
                dateStr = `Item ${index}`;
              }

              // Use the weeklyAPY and annualizedAPY fields from API response
              weeklyApy = item.weeklyAPY || 0;
              annualizedApy = item.annualizedAPY || 0;
              
              if (typeof weeklyApy === "string") {
                weeklyApy = parseFloat(weeklyApy) || 0;
              }
              
              if (typeof annualizedApy === "string") {
                annualizedApy = parseFloat(annualizedApy) || 0;
              }

              console.log(
                `Item ${index} transformed: date="${dateStr}", weeklyAPY=${weeklyApy}, annualizedAPY=${annualizedApy}`
              );
            } catch (error) {
              console.error(`Error processing item ${index}:`, error, item);
              dateStr = `Item ${index}`;
              weeklyApy = 0;
              annualizedApy = 0;
            }

            return {
              date: dateStr,
              weeklyAPY: weeklyApy,
              annualizedAPY: annualizedApy,
            };
          }
        );

        console.log("Final transformed data:", transformedData);

        // Filter out any remaining invalid data points
        const validData = transformedData.filter(
          (item: any) =>
            item.date && 
            item.weeklyAPY !== undefined && 
            item.annualizedAPY !== undefined && 
            !isNaN(item.weeklyAPY) && 
            !isNaN(item.annualizedAPY)
        );

        console.log("Valid data for chart (from August 1st onwards):", validData);
        console.log(`Filtered from ${transformedData.length} to ${validData.length} data points`);
        setData(validData);
      } catch (err) {
        console.error("Error loading base APY data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, vaultAddress, strategyType]);

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
              Loading base APY data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state for syBTC and syHLP when no data
  if ((strategyType === "BTC" || strategyType === "HLP") && data.length === 0) {
    const strategyName = strategyType === "BTC" ? "syBTC" : "syHLP";
    return (
      <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 chart-container">
        <div className="w-full h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm">APY data not available for {strategyName}</p>
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
              <linearGradient id="colorAnnualizedApy" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="annualizedAPY"
              stroke="#7B5FFF"
              strokeWidth={2}
              fill="url(#colorAnnualizedApy)"
              name="Total APY"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
