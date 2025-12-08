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

// Unallocated cash addresses - these will be combined into one entry
const UNALLOCATED_CASH_ADDRESSES = new Set([
  // Base
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC (Base)
  "0x820c137fa70c8691f0e44dc420a5e53c168921dc", // USDS (Base)
  "0x5875eee11cf8398102fdad704c9e96607675467a", // sUSDS (Base)
  // Ethereum
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC (Ethereum)
  "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT (Ethereum)
  "0xdc035d45d973e3ec169d2276ddab16f1e407384f", // USDS (Ethereum)
  // Arbitrum
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // USDC (Arbitrum)
  "0x6491c05a82219b8d1479057361ff1654749b876b", // USDS (Arbitrum)
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT0 (Arbitrum)
  // Katana
  "0x203a662b0bd271a6ed5a60edfbd04bfce608fd36", // vbUSDC (Katana)
  "0x62d6a123e8d19d06d68cf0d2294f9a3a0362c6b3", // vbUSDS (Katana)
  "0x2dca96907fde857dd3d816880a0df407eeb2d2f2", // vbUSDT (Katana)
]);

function isUnallocatedCash(address: string): boolean {
  return UNALLOCATED_CASH_ADDRESSES.has(address.toLowerCase());
}

const UNALLOCATED_CASH_KEY = "UNALLOCATED_CASH";

// Create a consistent color mapping function based on strategy addresses
// This ensures the same strategy gets the same color across all charts regardless of API order
const createAddressBasedColorMap = (strategies: {address: string, name: string}[]): Record<string, string> => {
  // Sort by address to ensure consistent ordering across all charts
  const sortedStrategies = [...strategies].sort((a, b) => a.address.localeCompare(b.address));
  const colorMap: Record<string, string> = {};
  const usedColors = new Set<string>();
  
  // Helper function to hash an address to a color index
  const hashAddress = (address: string): number => {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = ((hash << 5) - hash) + address.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  sortedStrategies.forEach((strategy) => {
    const strategyAddr = strategy.address.toLowerCase();
    
    // For "UNALLOCATED_CASH" strategy, use a specific gray color
    if (strategy.name === "Unallocated Cash" || strategy.address === "UNALLOCATED_CASH") {
      const grayColor = "#9CA3AF"; // gray-400
      colorMap[strategy.address] = grayColor;
      colorMap[strategy.name] = grayColor;
      usedColors.add(grayColor);
      return;
    }
    
    // Hash the address to get a consistent color index
    const colorIndex = hashAddress(strategyAddr) % colors.length;
    let color = colors[colorIndex];
    
    // If color is already used, find next available color
    let attempts = 0;
    while (usedColors.has(color) && attempts < colors.length * 2) {
      // Try the next color
      const nextColorIndex = (hashAddress(strategyAddr) + attempts) % colors.length;
      color = colors[nextColorIndex];
      attempts++;
    }
    
    // If still no unique color after trying, use a darker/lighter variant
    if (usedColors.has(color)) {
      color = "#" + Math.floor(Math.random()*16777215).toString(16);
    }
    
    usedColors.add(color);
    
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
  strategyType?: "USD" | "BTC" | "ETH" | "HLP";
}

export default function AllocationChart({ strategyType = "USD" }: AllocationChartProps) {
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

        // For syBTC and syHLP, if no endpoint is available, return empty data
        if (strategyType === "BTC" || strategyType === "HLP") {
          const strategyName = strategyType === "BTC" ? "syBTC" : "syHLP";
          console.log(`${strategyName} allocation data not available`);
          setData([]);
          setKeys([]);
          setSelectedKeys(new Set());
          setLoading(false);
          setInitialLoading(false);
          return;
        }

        console.log("Fetching allocation data...");
        const response = await fetch(
          "https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/allocation/daily-allocation"
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
        if (filteredData.length > 0 && strategyType === "USD") {
          const allStrategyAddresses = new Set<string>();
          
          // Collect all unique strategy addresses from all data points
          filteredData.forEach((dataPoint: ChartDataPoint) => {
            if (dataPoint.strategies && Array.isArray(dataPoint.strategies)) {
              dataPoint.strategies.forEach((strategy: Strategy) => {
                allStrategyAddresses.add(strategy.strategy);
              });
            }
          });
          
          const allExtractedKeys = Array.from(allStrategyAddresses);
          
          // Separate unallocated cash strategies from other strategies
          const unallocatedCashKeys: string[] = [];
          const otherKeys: string[] = [];
          
          allExtractedKeys.forEach((key) => {
            if (isUnallocatedCash(key)) {
              unallocatedCashKeys.push(key);
            } else {
              otherKeys.push(key);
            }
          });
          
          // Create combined keys list: UNALLOCATED_CASH + other strategies
          const extractedKeys = unallocatedCashKeys.length > 0 
            ? [UNALLOCATED_CASH_KEY, ...otherKeys]
            : otherKeys;
          
          console.log("Extracted strategy addresses from all dates:", allExtractedKeys);
          console.log("Unallocated cash addresses:", unallocatedCashKeys);
          console.log("Combined keys:", extractedKeys);
          console.log("Strategy names from config:", extractedKeys.map((addr: string) => addr === UNALLOCATED_CASH_KEY ? "Unallocated Cash" : getStrategyDisplayName(addr)));
          
          // Create address-based color mapping for consistent colors across charts
          // For the special UNALLOCATED_CASH entry, create a virtual entry
          const strategiesWithAddresses = extractedKeys.map((address: string) => {
            if (address === UNALLOCATED_CASH_KEY) {
              // For unallocated cash, use a combination key
              return {
                address: UNALLOCATED_CASH_KEY.toLowerCase(),
                name: "Unallocated Cash"
              };
            }
            return {
              address: address.toLowerCase(), // Normalize address
              name: getStrategyDisplayName(address)
            };
          });
          
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
  }, [initialLoading, strategyType]);

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

    // Track unallocated cash separately
    let unallocatedAllocation = 0;
    let unallocatedTvl = 0;

    // Initialize all strategies with 0 allocation and 0 TVL
    keys.forEach((strategyKey) => {
      transformed[strategyKey] = 0; // 0% allocation
      transformed[`${strategyKey}_tvl`] = 0; // $0 TVL
    });

    // Override with actual values for strategies present in this data point
    if (item.strategies && Array.isArray(item.strategies)) {
      item.strategies.forEach((strategy: Strategy) => {
        if (isUnallocatedCash(strategy.strategy)) {
          // Combine unallocated cash strategies
          unallocatedAllocation += strategy.allocationPercentage / 100;
          unallocatedTvl += strategy.tvl;
        } else {
          // Keep original address as key for data consistency
          transformed[strategy.strategy] = strategy.allocationPercentage / 100; // Convert percentage to decimal
          transformed[`${strategy.strategy}_tvl`] = strategy.tvl;
        }
      });
      
      // Set the combined unallocated cash values if there are any
      if (keys.includes(UNALLOCATED_CASH_KEY)) {
        transformed[UNALLOCATED_CASH_KEY] = unallocatedAllocation;
        transformed[`${UNALLOCATED_CASH_KEY}_tvl`] = unallocatedTvl;
      }
    }

    return transformed;
  });

  // Always include all data - don't filter based on selectedKeys
  // We'll use opacity to show/hide instead
  const filteredData = transformedData;

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
              margin={{ top: 10, right: 20, left: -25, bottom: 20 }}
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
              cursor={{ stroke: '#666', strokeWidth: 1 }}
              wrapperStyle={{ outline: 'none' }}
              contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
              content={({ active, payload, label }) => {
                // Filter out strategies with TVL < $1
                const filteredPayload = payload?.filter(item => {
                  // Check if this is the combined unallocated cash entry
                  if (item.name === "Unallocated Cash") {
                    const tvlKey = `${UNALLOCATED_CASH_KEY}_tvl`;
                    const tvlValue = item.payload[tvlKey];
                    if (tvlValue !== undefined && tvlValue !== null) {
                      const numValue = Number(tvlValue);
                      return !isNaN(numValue) && numValue >= 1;
                    }
                  }
                  
                  // Find the original address for this display name
                  const originalAddress = keys.find(key => {
                    if (key === UNALLOCATED_CASH_KEY) {
                      return item.name === "Unallocated Cash";
                    }
                    return getStrategyDisplayName(key) === item.name;
                  });
                  if (originalAddress) {
                    const tvlKey = `${originalAddress}_tvl`;
                    const tvlValue = item.payload[tvlKey];
                    if (tvlValue !== undefined && tvlValue !== null) {
                      const numValue = Number(tvlValue);
                      return !isNaN(numValue) && numValue >= 1; // Filter by TVL >= $1
                    }
                  }
                  return false;
                }) || [];
                
                if (!active || filteredPayload.length === 0) return null;
                
                return (
                  <CommonTooltip
                    active={active}
                    payload={filteredPayload}
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
                      // Handle unallocated cash
                      if (item.name === "Unallocated Cash") {
                        const tvlKey = `${UNALLOCATED_CASH_KEY}_tvl`;
                        const tvlValue = item.payload[tvlKey];
                        if (tvlValue !== undefined && tvlValue !== null) {
                          const numValue = Number(tvlValue);
                          if (!isNaN(numValue) && numValue > 0) {
                            return numValue >= 1000
                              ? `$${(numValue / 1000).toFixed(1)}K`
                              : `$${numValue.toFixed(0)}`;
                          }
                        }
                      }
                      
                      // Find the original address for this display name
                      const originalAddress = keys.find(key => {
                        if (key === UNALLOCATED_CASH_KEY) {
                          return item.name === "Unallocated Cash";
                        }
                        return getStrategyDisplayName(key) === item.name;
                      });
                      if (originalAddress) {
                        const tvlKey = `${originalAddress}_tvl`;
                        const tvlValue = item.payload[tvlKey];
                        if (tvlValue !== undefined && tvlValue !== null) {
                          const numValue = Number(tvlValue);
                          if (!isNaN(numValue) && numValue > 0) {
                            return numValue >= 1000
                              ? `$${(numValue / 1000).toFixed(1)}K`
                              : `$${numValue.toFixed(0)}`;
                          }
                        }
                      }
                      return "$0";
                    }}
                    // Use strategy names in tooltip - show full names without truncation
                    nameFormatter={(name) => {
                      if (name === "Unallocated Cash") {
                        return "Unallocated Cash";
                      }
                      const displayName = getStrategyDisplayName(name);
                      // Always return the full display name, never truncate
                      return displayName;
                    }}
                  />
                );
              }}
              labelFormatter={(label: string) => label}
            />
            {keys
              .map((key) => {
                const isSelected = selectedKeys.has(key);
                const strategyName = key === UNALLOCATED_CASH_KEY 
                  ? "Unallocated Cash" 
                  : getStrategyDisplayName(key);
                const finalStrategyName = strategyName !== key ? strategyName : `${key.slice(0, 6)}...${key.slice(-4)}`;
                // Use address-based color mapping for consistency across charts
                const strategyColor = strategyColorMap[key.toLowerCase()] || strategyColorMap[strategyName] || colors[0];
                
                console.log(`Rendering Area for key: ${key}, name: ${strategyName}, finalName: ${finalStrategyName}, color: ${strategyColor}, isSelected: ${isSelected}`);
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={strategyColor}
                    fill={strategyColor}
                    fillOpacity={isSelected ? 0.8 : 0.2}
                    strokeOpacity={isSelected ? 1 : 0.3}
                    name={finalStrategyName}
                  />
                );
              })}
                      </AreaChart>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center">
              {strategyType === "BTC" || strategyType === "HLP" ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-gray-400 text-sm">Allocation data not available for {strategyType === "BTC" ? "syBTC" : "syHLP"}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-gray-400 text-sm">Chart data loading...</div>
                  <div className="text-xs text-gray-500">Filtered data length: {filteredData.length}</div>
                  <div className="text-xs text-gray-500">Selected keys: {Array.from(selectedKeys).join(', ')}</div>
                </div>
              )}
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
            {keys
              .filter((key) => {
                // Only show strategies that have TVL >= $1 in the current data
                // Check the most recent data point (first item after reverse)
                const mostRecentData = filteredData[0];
                if (!mostRecentData) return false;
                
                // Handle unallocated cash specially
                if (key === UNALLOCATED_CASH_KEY) {
                  const tvlKey = `${UNALLOCATED_CASH_KEY}_tvl`;
                  const tvlValue = mostRecentData[tvlKey];
                  if (tvlValue !== undefined && tvlValue !== null) {
                    const numValue = Number(tvlValue);
                    return !isNaN(numValue) && numValue >= 1;
                  }
                  return false;
                }
                
                const tvlKey = `${key}_tvl`;
                const tvlValue = mostRecentData[tvlKey];
                if (tvlValue !== undefined && tvlValue !== null) {
                  const numValue = Number(tvlValue);
                  return !isNaN(numValue) && numValue >= 1; // Filter by TVL >= $1
                }
                return false;
              })
              .map((key) => {
                const isSelected = selectedKeys.has(key);
                // Convert address to strategy name for display, fallback to truncated address
                const displayName = key === UNALLOCATED_CASH_KEY 
                  ? "Unallocated Cash" 
                  : getStrategyDisplayName(key);
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
