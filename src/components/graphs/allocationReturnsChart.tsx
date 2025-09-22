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
import { getStrategyDisplayName } from "../../config/env";

interface AllocationDataPoint {
  date: string;
  totalAum: number;
  totalWeightedContribution: number;
  strategyCount: number;
  strategies: {
    strategy: string;
    network: string;
    aum: number;
    previousAum: number;
    aumPerShare: number;
    previousAumPerShare: number;
    dailyApyPercentage: number;
    aumWeightPercentage: number;
    weightedContributionPercentage: number;
  }[];
}

interface ChartDataPoint {
  date: string;
  baseApy?: number | null;
  [key: string]: string | number | null | undefined;
}

interface AllocationReturnsChartProps {
  // No props needed
}

// Create a consistent color mapping function based on strategy addresses
// This ensures the same strategy gets the same color across all charts regardless of API order
const createAddressBasedColorMap = (strategies: {address: string, name: string}[]): Record<string, string> => {
  // Sort by address to ensure consistent ordering across all charts
  const sortedStrategies = [...strategies].sort((a, b) => a.address.localeCompare(b.address));
  const colorMap: Record<string, string> = {};
  
  // Strategy addresses for color swapping
  const rlpMorphoAddress = "0x1ed0a3d7562066c228a0bb3fed738182f03abd01"; // RLP/USDC Morpho
  const sUsdeUsdcAddress = "0x79857afb972e43c7049ae3c63274fc5ef3b815bb"; // sUSDe/USDC AaveV3
  const ptSusdfAddress = "0x2fa924e8474726dec250eead84f4f34e063acdcc"; // PT-sUSDF/USDC
  const rlpAddress = "0x34a06c87817ec6683bc1788dbc9aa4038900ea14"; // RLP (assumed full address)
  const ptIusdAddress = "0xa32ba04a547e1c6419d3fcf5bbdb7461b3d19bb1"; // PT-iUSD/USDC Morpho
  const gauntletAddress = "0xd0bc4920f1b43882b334354ffab23c9e9637b89e"; // Gauntlet Frontier USDC
  const usrAddress = "0x914f1e34cd70c1d59392e577d58fc2ddaaedaf86"; // USR
  
  sortedStrategies.forEach((strategy, index) => {
    let color = COLORS[index % COLORS.length];
    const strategyAddr = strategy.address.toLowerCase();
    
    // Color swaps and custom colors:
    // 1. RLP gets custom yellow color (swapped from sUSDe/USDC AaveV3)
    if (strategyAddr === rlpAddress.toLowerCase()) {
      color = "#fde047"; // Yellow color for RLP
    }
    // 2. RLP/USDC Morpho gets custom teal color
    else if (strategyAddr === rlpMorphoAddress.toLowerCase()) {
      color = "#0d9488"; // Teal color for RLP/USDC Morpho
    }
    // 3. sUSDe/USDC AaveV3 gets custom magenta color (swapped from RLP)
    else if (strategyAddr === sUsdeUsdcAddress.toLowerCase()) {
      color = "#FF00FF"; // Magenta color for sUSDe/USDC AaveV3
    }
    // 4. PT-sUSDF/USDC gets USR's original color (blue)
    else if (strategyAddr === ptSusdfAddress.toLowerCase()) {
      const usrIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === usrAddress.toLowerCase());
      color = usrIndex >= 0 ? COLORS[usrIndex % COLORS.length] : color;
    }
    // 5. USR gets PT-sUSDF's original color
    else if (strategyAddr === usrAddress.toLowerCase()) {
      const ptSusdfIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === ptSusdfAddress.toLowerCase());
      color = ptSusdfIndex >= 0 ? COLORS[ptSusdfIndex % COLORS.length] : color;
    }
    // 4. PT-iUSD/USDC Morpho gets Gauntlet's color
    else if (strategyAddr === ptIusdAddress.toLowerCase()) {
      const gauntletIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === gauntletAddress.toLowerCase());
      color = gauntletIndex >= 0 ? COLORS[gauntletIndex % COLORS.length] : color;
    }
    // 5. Gauntlet gets PT-iUSD's color
    else if (strategyAddr === gauntletAddress.toLowerCase()) {
      const ptIusdIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === ptIusdAddress.toLowerCase());
      color = ptIusdIndex >= 0 ? COLORS[ptIusdIndex % COLORS.length] : color;
    }
    
    // Map both address and name to the color
    colorMap[strategy.address] = color;
    colorMap[strategy.name] = color;
  });
  
  return colorMap;
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

export default function AllocationReturnsChart({}: AllocationReturnsChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [allStrategies, setAllStrategies] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  const [strategyColorMap, setStrategyColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching Allocation Returns data for period: ${period}`);

        const response = await fetch(`https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/allocation-returns/daily`);

        if (!response.ok) {
          console.error("API responded with status:", response.status);
          throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw Allocation Returns data:", rawData);

        if (!rawData.success || !rawData.data) {
          throw new Error("Invalid API response format");
        }

        const allocationData: AllocationDataPoint[] = rawData.data;

        console.log("Raw Allocation data dates:", allocationData.map(d => d.date));
        console.log("Raw data count:", allocationData.length);

        // No date filtering - show all data
        const filteredData = allocationData;

        // Get all unique strategies with both address and display name
        const strategyMap = new Map<string, {address: string, name: string}>();
        filteredData.forEach((dayData) => {
          dayData.strategies.forEach((strategy) => {
            const strategyName = getStrategyDisplayName(strategy.strategy);
            const address = strategy.strategy.toLowerCase(); // Normalize address
            strategyMap.set(address, { address, name: strategyName });
          });
        });

        // Convert to arrays for consistent processing
        const strategiesWithAddresses = Array.from(strategyMap.values());
        const strategyList = strategiesWithAddresses.map(s => s.name).sort();
        
        setAllStrategies(strategyList);
        setSelectedStrategies(new Set(strategyList));
        
        // Create address-based color mapping for consistent colors across charts
        const colorMap = createAddressBasedColorMap(strategiesWithAddresses);
        setStrategyColorMap(colorMap);

        // Sort filtered data by date (earliest first)
        filteredData.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        console.log("All Allocation data dates (no filtering):", filteredData.map(d => d.date));
        console.log("Date range:", filteredData[0]?.date, "to", filteredData[filteredData.length - 1]?.date);

        // Debug: Check sample strategy values
        if (filteredData.length > 0) {
          const sampleData = filteredData[filteredData.length - 1]; // Last day
          console.log("Sample allocation data (last day):", sampleData);
          if (sampleData.strategies) {
            console.log("Sample strategy data:");
            sampleData.strategies.forEach((strategy: any) => {
              console.log(`  ${strategy.strategy.slice(0, 8)}...: weightedContributionPercentage = ${strategy.weightedContributionPercentage}`);
            });
          }
        }

        // Process data for Recharts - use API data directly without any calculations
        const chartData: ChartDataPoint[] = filteredData.map((dayData) => {
          const date = new Date(dayData.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          const chartPoint: ChartDataPoint = { date };

          // Use the weightedContributionPercentage directly from the API (multiply by 100 for display)
          strategyList.forEach((strategyName) => {
            const strategy = dayData.strategies.find((s) => {
              const name = getStrategyDisplayName(s.strategy);
              return name === strategyName;
            });

            // Use the API's weightedContributionPercentage directly - no frontend calculations
            chartPoint[strategyName] = strategy ? (strategy.weightedContributionPercentage * 100) : 0;
          });

          return chartPoint;
        });

        // Fetch Base APY data to overlay
        try {
          const apyResponse = await fetch(`https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/strategy-pnl/daily-base-apy`);
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
        console.error("Error loading Allocation Returns data:", err);
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
              
              {/* Show Base APY if available - purple color */}
              {payload.find((item: any) => item.dataKey === 'baseApy' && item.value) && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: "#7B5FFF", 
                        border: "2px solid #7B5FFF"
                      }}
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      Base APY
                    </span>
                    <span className="text-sm font-semibold text-right" 
                          style={{ color: "#7B5FFF" }}>
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
              Loading Allocation Returns data...
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
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Daily
          </button>
          <button
            disabled
            className="px-2 py-1 rounded text-xs bg-[#2A2A3C] text-gray-500 cursor-not-allowed opacity-50"
          >
            Weekly
          </button>
          <button
            disabled
            className="px-2 py-1 rounded text-xs bg-[#2A2A3C] text-gray-500 cursor-not-allowed opacity-50"
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
              .map((strategy) => {
                // Use consistent color mapping: same strategy gets same color across all charts
                const strategyColor = strategyColorMap[strategy] || COLORS[0];
                
                return (
                  <Area
                    key={strategy}
                    type="linear"
                    dataKey={strategy}
                    stackId="allocation"
                    stroke={strategyColor}
                    fill={strategyColor}
                    fillOpacity={0.6}
                    strokeWidth={1}
                    name={strategy}
                  />
                );
              })}

            {/* Base APY line overlay - purple color */}
            <Line
              type="linear"
              dataKey="baseApy"
              stroke="#7B5FFF"
              strokeWidth={3}
              dot={false}
              name="Base APY"
              connectNulls={false}
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
            {allStrategies.map((strategy) => {
              const isSelected = selectedStrategies.has(strategy);
              // Use consistent color mapping: same strategy gets same color across all charts
              const buttonColor = strategyColorMap[strategy] || COLORS[0];
              
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
