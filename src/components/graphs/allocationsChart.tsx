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
    let color = colors[index % colors.length];
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
      color = usrIndex >= 0 ? colors[usrIndex % colors.length] : color;
    }
    // 5. USR gets PT-sUSDF's original color
    else if (strategyAddr === usrAddress.toLowerCase()) {
      const ptSusdfIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === ptSusdfAddress.toLowerCase());
      color = ptSusdfIndex >= 0 ? colors[ptSusdfIndex % colors.length] : color;
    }
    // 4. PT-iUSD/USDC Morpho gets Gauntlet's color
    else if (strategyAddr === ptIusdAddress.toLowerCase()) {
      const gauntletIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === gauntletAddress.toLowerCase());
      color = gauntletIndex >= 0 ? colors[gauntletIndex % colors.length] : color;
    }
    // 5. Gauntlet gets PT-iUSD's color
    else if (strategyAddr === gauntletAddress.toLowerCase()) {
      const ptIusdIndex = sortedStrategies.findIndex(s => s.address.toLowerCase() === ptIusdAddress.toLowerCase());
      color = ptIusdIndex >= 0 ? colors[ptIusdIndex % colors.length] : color;
    }
    
    // Map both address and name to the color
    colorMap[strategy.address] = color;
    colorMap[strategy.name] = color;
  });
  
  return colorMap;
};

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
  const [strategyColorMap, setStrategyColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only show loading on initial load
        if (initialLoading) {
          setLoading(true);
        }

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

        // Use all data without filtering any dates
        const filteredData = processedData;

        console.log("All allocation data (no date filtering):", filteredData);
        console.log("Date range:", {
          first: filteredData[0]?.date,
          last: filteredData[filteredData.length - 1]?.date,
          total: filteredData.length
        });
        setData(filteredData);

        // Extract strategy addresses from ALL dates, not just the first one
        if (filteredData.length > 0) {
          const allStrategyAddresses = new Set<string>();
          
          // Collect all unique strategy addresses from all data points
          filteredData.forEach((dataPoint: ChartDataPoint) => {
            if (dataPoint.strategies && Array.isArray(dataPoint.strategies)) {
              dataPoint.strategies.forEach((strategy: Strategy) => {
                allStrategyAddresses.add(strategy.strategy);
              });
            }
          });
          
          const extractedKeys = Array.from(allStrategyAddresses);
          console.log("Extracted strategy addresses from all dates:", extractedKeys);
          console.log("Strategy names from config:", extractedKeys.map((addr: string) => getStrategyDisplayName(addr)));
          
          // Create address-based color mapping for consistent colors across charts
          const strategiesWithAddresses = extractedKeys.map((address: string) => ({
            address: address.toLowerCase(), // Normalize address
            name: getStrategyDisplayName(address)
          }));
          
          const colorMap = createAddressBasedColorMap(strategiesWithAddresses);
          setStrategyColorMap(colorMap);
          
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
        year: "2-digit",
      }),
      totalTvl: item.totalTvl,
    };

    // Initialize all strategies with 0 allocation and 0 TVL
    keys.forEach((strategyKey) => {
      transformed[strategyKey] = 0; // 0% allocation
      transformed[`${strategyKey}_tvl`] = 0; // $0 TVL
    });

    // Override with actual values for strategies present in this data point
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
  console.log("Transformed data dates:", transformedData.map(d => d.date));
  console.log("Chart data length:", transformedData.length);

  if (initialLoading && loading) {
    return (
      <div className="rounded-xl text-white w-full max-h-[600px] [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
        <div className="w-full h-[300px] px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">Loading allocations data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-12 overflow-x-hidden" style={{ overflowY: 'visible' }}>
      <div className="pb-6 rounded-xl text-white w-full max-h-[600px] [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0" style={{ overflow: 'visible' }}>
        <div className="w-full h-[345px] focus:outline-none focus:ring-0 focus:border-0" style={{ overflow: 'visible' }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="focus:outline-none focus:ring-0 focus:border-0"
          style={{ overflow: 'visible' }}
        >
          {filteredData.length > 0 ? (
            <AreaChart
              data={[...filteredData].reverse()}
              margin={{ top: 10, right: 0, left: -25, bottom: 20 }}
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
                  // Use strategy names in tooltip, fallback to address if no name
                  nameFormatter={(name) => {
                    const displayName = getStrategyDisplayName(name);
                    return displayName !== name ? displayName : `${name.slice(0, 6)}...${name.slice(-4)}`;
                  }}
                />
              )}
              labelFormatter={(label: string) => label}
            />
            {keys
              .filter((k) => selectedKeys.has(k))
              .map((key) => {
                const strategyName = getStrategyDisplayName(key);
                const finalStrategyName = strategyName !== key ? strategyName : `${key.slice(0, 6)}...${key.slice(-4)}`;
                // Use address-based color mapping for consistency across charts
                const strategyColor = strategyColorMap[key.toLowerCase()] || strategyColorMap[strategyName] || colors[0];
                
                console.log(`Rendering Area for key: ${key}, name: ${strategyName}, finalName: ${finalStrategyName}, color: ${strategyColor}`);
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={strategyColor}
                    fill={strategyColor}
                    fillOpacity={0.8}
                    name={finalStrategyName}
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
            {keys.map((key) => {
              const isSelected = selectedKeys.has(key);
              // Convert address to strategy name for display, fallback to truncated address
              const displayName = getStrategyDisplayName(key);
              const finalDisplayName = displayName !== key ? displayName : `${key.slice(0, 6)}...${key.slice(-4)}`;
              // Use address-based color mapping for consistency across charts
              const buttonColor = strategyColorMap[key.toLowerCase()] || strategyColorMap[displayName] || colors[0];
              
              console.log(`Legend item - key: ${key}, displayName: ${displayName}, finalDisplayName: ${finalDisplayName}, isSelected: ${isSelected}, color: ${buttonColor}`);

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
                    {finalDisplayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
