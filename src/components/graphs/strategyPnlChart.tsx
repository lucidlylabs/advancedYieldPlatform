import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
  Line,
  Area,
} from "recharts";

interface PnlDataPoint {
  date: string;
  totalPnl: number;
  strategies: {
    strategy: string;
    network: string;
    pnl: number;
    pnlPercentage: number;
    aum: number;
    previousAum: number;
    contributionToTotalGrowth: number;
    attributionToTotalReturn: number;
    pnlAsPercentageOfTotalTVL: number;
    contributionToTotalAPY: number;
    weightedContributionToTotalAPY: number;
  }[];
}

interface ChartDataPoint {
  date: string;
  baseApy?: number | null;
  [key: string]: string | number | null | undefined;
}

interface StrategyPnlChartProps {
  // No props needed
}

// Strategy name mapping
const STRATEGY_NAME_MAP: Record<string, string> = {
  "0x2fa924e8474726dec250eead84f4f34e063acdcc": "PT-sUSDF/USDC SiloV2 (7.5x)",
  "0xa32ba04a547e1c6419d3fcf5bbdb7461b3d19bb1": "PT-iUSD/USDC Morpho (4x)",
  "0xd0bc4920f1b43882b334354ffab23c9e9637b89e": "gauntlet Frontier USDC",
  "0x1ed0a3d7562066c228a0bb3fed738182f03abd01": "RLP/USDC Morpho",
  "0x79857afb972e43c7049ae3c63274fc5ef3b815bb": "sUSDe/USDC AaveV3 (7x)",
  "0x56b3c60b4ea708a6fda0955b81df52148e96813a": "sUSDe",
  "0x34a06c87817ec6683bc1788dbc9aa4038900ea14": "Strategy 7",
  "0x914f1e34cd70c1d59392e577d58fc2ddaaedaf86": "Strategy 8",
};

const normalizeAddress = (address: string): string => {
  return address.toLowerCase();
};

const COLORS = [
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

export default function StrategyPnlChart({}: StrategyPnlChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [allStrategies, setAllStrategies] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching PNL data for period: ${period}`);

        const response = await fetch(`http://localhost:3001/api/strategy-pnl/daily`);

        if (!response.ok) {
          console.error("API responded with status:", response.status);
          throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw PNL data:", rawData);

        if (!rawData.success || !rawData.data) {
          throw new Error("Invalid API response format");
        }

        const pnlData: PnlDataPoint[] = rawData.data;

        console.log("Raw PNL data dates:", pnlData.map(d => d.date));
        console.log("Raw data count:", pnlData.length);

        // Show all data except August 26th specifically
        const filteredData = pnlData.filter((dayData) => {
          // Try multiple ways to check for August 26th
          const originalDate = dayData.date;
          const dateObj = new Date(originalDate);
          
          // Check if it's August 26th in any format
          const isAugust26 = (
            originalDate.includes('2025-08-26') ||
            originalDate.includes('08-26') ||
            originalDate.includes('Aug 26') ||
            (dateObj.getFullYear() === 2025 && dateObj.getMonth() === 7 && dateObj.getDate() === 26)
          );
          
          return !isAugust26;
        });

        // Get all unique strategies
        const allStrategies = new Set<string>();
        filteredData.forEach((dayData) => {
          dayData.strategies.forEach((strategy) => {
            const normalizedAddress = normalizeAddress(strategy.strategy);
            const strategyName = STRATEGY_NAME_MAP[normalizedAddress] || 
              `${strategy.network}_${strategy.strategy.slice(0, 8)}...`;
            allStrategies.add(strategyName);
          });
        });

        const strategyList = Array.from(allStrategies);
        setAllStrategies(strategyList);
        setSelectedStrategies(new Set(strategyList));

        // Sort filtered data by date (earliest first)
        filteredData.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        console.log("Filtered PNL data dates:", filteredData.map(d => d.date));
        console.log("Date range:", filteredData[0]?.date, "to", filteredData[filteredData.length - 1]?.date);

        // Process data for Recharts
        const chartData: ChartDataPoint[] = filteredData.map((dayData) => {
          const date = new Date(dayData.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          const chartPoint: ChartDataPoint = { date };

          // Add each strategy's PNL to the data point
          strategyList.forEach((strategyName) => {
            const strategy = dayData.strategies.find((s) => {
              const normalizedAddress = normalizeAddress(s.strategy);
              const name = STRATEGY_NAME_MAP[normalizedAddress] || 
                `${s.network}_${s.strategy.slice(0, 8)}...`;
              return name === strategyName;
            });
            chartPoint[strategyName] = strategy ? (strategy.weightedContributionToTotalAPY * 100) : 0; // Convert to percentage for display
          });

          return chartPoint;
        });

        // Fetch Base APY data to overlay
        try {
          const apyResponse = await fetch(`http://localhost:3001/api/strategy-pnl/daily-base-apy`);
          if (apyResponse.ok) {
            const apyData = await apyResponse.json();
            console.log("Base APY data:", apyData);
            
            // Add Base APY to chart data
            const enhancedChartData = chartData.map((chartPoint) => {
              // Find matching APY data by date
              const matchingApyData = apyData.data.find((apy: any) => {
                const apyDate = new Date(apy.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return apyDate === chartPoint.date;
              });
              
              return {
                ...chartPoint,
                baseApy: matchingApyData ? (matchingApyData.dailyBaseAPY * 100) : null, // Convert to percentage
              };
            });
            
            setData(enhancedChartData);
          } else {
            setData(chartData);
          }
        } catch (apyErr) {
          console.error("Error loading Base APY data:", apyErr);
          setData(chartData);
        }
      } catch (err) {
        console.error("Error loading PNL data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const handleStrategyClick = (strategy: string) => {
    setSelectedStrategies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(strategy)) {
        newSet.delete(strategy);
      } else {
        newSet.add(strategy);
      }
      return newSet;
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
            <div className="space-y-2">
              {payload
                .filter((item: any) => item.value !== 0 && item.dataKey !== 'baseApy')
                .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
                .map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      {item.dataKey}
                    </span>
                    <span className={`text-sm font-semibold text-right ${
                      item.value >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
                    </span>
                  </div>
                ))}
              
              {/* Show Base APY if available */}
              {payload.find((item: any) => item.dataKey === 'baseApy' && item.value) && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white"
                      style={{ 
                        backgroundColor: "#FFFFFF", 
                        boxShadow: "0 0 8px #FFFFFF, 0 0 12px #FFFFFF" 
                      }}
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      Base APY
                    </span>
                    <span className="text-sm font-semibold text-right text-white" 
                          style={{ textShadow: "0 0 8px #FFFFFF" }}>
                      {payload.find((item: any) => item.dataKey === 'baseApy')?.value.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
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
              Loading PNL data...
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
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Neon glow effect for Base APY line */}
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => `${val.toFixed(1)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
            
            {/* Render areas for each strategy with stacking */}
            {allStrategies
              .filter((strategy) => selectedStrategies.has(strategy))
              .map((strategy, index) => (
                <Area
                  key={strategy}
                  type="linear"
                  dataKey={strategy}
                  stackId="pnl"
                  stroke={COLORS[allStrategies.indexOf(strategy) % COLORS.length]}
                  fill={COLORS[allStrategies.indexOf(strategy) % COLORS.length]}
                  fillOpacity={0.6}
                  strokeWidth={1}
                  name={strategy}
                />
              ))}

            {/* Base APY line overlay */}
            <Line
              type="linear"
              dataKey="baseApy"
              stroke="#FFFFFF"
              strokeWidth={3}
              dot={false}
              name="Base APY"
              connectNulls={false}
              filter="url(#neonGlow)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Selection Buttons */}
      {allStrategies.length > 0 && (
        <div className="w-full mt-6">
          <div
            className="grid grid-cols-4 gap-6 justify-items-start"
            style={{
              width: "100%",
              marginLeft: "24px",
              marginRight: "24px",
            }}
          >
            {allStrategies.map((strategy, index) => {
              const isSelected = selectedStrategies.has(strategy);
              const buttonColor = COLORS[index % COLORS.length];
              
              return (
                <div
                  key={strategy}
                  className="flex items-start gap-3 cursor-pointer transition-opacity duration-200 w-full"
                  onClick={() => handleStrategyClick(strategy)}
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
                    {strategy}
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
