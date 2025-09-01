// components/StrategyDailyYieldChart.tsx
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import dayjs from "dayjs";
import { USD_STRATEGIES } from "../../config/env";
import CommonTooltip from "../ui/CommonTooltip";

interface RawYield {
  date: string;
  strategy: string;
  network: string;
  yield: number;
  yieldDollars: number;
  yieldPercentage: number;
  dailyYieldRatio: number;
  avgDailyYield7d: number;
  annualizedYield7d: number;
  aum: number;
  previousAum: number;
  aumPerShare: number;
  previousAumPerShare: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface CumulativeDataPoint {
  date: string;
  [key: string]: string | number;
}

interface TVLData {
  date: string;
  tvl: number;
}

const STRATEGY_NAME_MAP: Record<string, string> = {
  "0x2fa924e8474726dec250eead84f4f34e063acdcc": "PT-sUSDF/USDC SiloV2 (7.5x)",
  "0xa32ba04a547e1c6419d3fcf5bbdb7461b3d19bb1": "PT-iUSD/USDC Morpho (4x)",
  "0xd0bc4920f1b43882b334354ffab23c9e9637b89e": "gauntlet Frontier USDC",
  "0x1ed0a3d7562066c228a0bb3fed738182f03abd01": "RLP/USDC Morpho",
  "0x79857afb972e43c7049ae3c63274fc5ef3b815bb": "sUSDe/USDC AaveV3 (7x)",
  "0x56b3c60b4ea708a6fda0955b81df52148e96813a": "sUSDe",
};

const normalizeAddress = (address: string): string => {
  return address.replace(/^ethereum_/i, "").toLowerCase();
};

const COLORS = [
  "#E91E63",
  "#2B66FF",
  "#AB47BC",
  "#FF9A43",
  "#00BCD4",
  "#16D768",
];

export default function StrategyDailyYieldChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [showPercentages, setShowPercentages] = useState(true);
  const [showCumulative, setShowCumulative] = useState(true);
  const [tvlData, setTvlData] = useState<TVLData[]>([]);
  const [rawData, setRawData] = useState<RawYield[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Only show loading on initial load
        if (initialLoading) {
          setLoading(true);
        }

        // Fetch yield data
        const res = await fetch(
          `https://ow5g1cjqsd.execute-api.ap-south-1.amazonaws.com/dev/api/strategy/yield?period=${period}`
        );
        const json = await res.json();
        console.log("Fetched yield data:", json);
        const raw: RawYield[] = json.data;
        setRawData(raw); // Store raw data for percentage calculations

        const grouped: Record<string, ChartDataPoint> = {};
        const strategyNames = new Set<string>();

        raw.forEach(
          ({ date, strategy, network, yieldPercentage, yieldDollars }) => {
            // Format differently for weekly/monthly
            const d =
              period === "weekly"
                ? `Week of ${dayjs(date).startOf("week").format("MMM DD")}`
                : period === "monthly"
                ? dayjs(date).format("MMM YYYY")
                : dayjs(date).format("MMM DD");

            const normalizedStrategy = normalizeAddress(strategy);
            const strategyName =
              STRATEGY_NAME_MAP[normalizedStrategy] || `${network}_${strategy}`;
            strategyNames.add(strategyName);

            if (!grouped[d]) {
              grouped[d] = { date: d };
            }

            if (!grouped[d][strategyName]) {
              grouped[d][strategyName] = 0;
            }

            // Use the yield value directly (this will be yieldDollars from API)
            (grouped[d][strategyName] as number) += yieldDollars || 0;
          }
        );

        const chartData = Object.values(grouped);
        const uniqueKeys = Array.from(strategyNames);

        // Get all possible strategies from the raw data to maintain consistency
        const allStrategies = new Set<string>();
        raw.forEach(({ strategy, network }) => {
          const normalizedStrategy = normalizeAddress(strategy);
          const strategyName =
            STRATEGY_NAME_MAP[normalizedStrategy] || `${network}_${strategy}`;
          allStrategies.add(strategyName);
        });

        console.log("Chart data:", chartData);

        // Sort chartData by date
        chartData.sort((a, b) => {
          const dateA =
            period === "weekly"
              ? dayjs(a.date.replace("Week of ", "")).valueOf()
              : period === "monthly"
              ? dayjs(a.date).valueOf()
              : dayjs(a.date).valueOf();
          const dateB =
            period === "weekly"
              ? dayjs(b.date.replace("Week of ", "")).valueOf()
              : period === "monthly"
              ? dayjs(b.date).valueOf()
              : dayjs(b.date).valueOf();
          return dateA - dateB;
        });

        // Create a stable color mapping for each strategy
        const newColorMap: Record<string, string> = {};
        uniqueKeys.forEach((key, index) => {
          newColorMap[key] = COLORS[index % COLORS.length];
        });

        setData(chartData);

        // Maintain consistent color mapping across all periods
        if (Object.keys(colorMap).length === 0) {
          // Only create color map on initial load
          const newColorMap: Record<string, string> = {};
          Array.from(allStrategies).forEach((key, index) => {
            newColorMap[key] = COLORS[index % COLORS.length];
          });
          setColorMap(newColorMap);
        }

        // Keep all strategies in keys, but track which ones have data for current period
        setKeys(Array.from(allStrategies));

        // Only set selectedStrategy if it's not already set or if the current selection is not in the new keys
        if (!selectedStrategy || !uniqueKeys.includes(selectedStrategy)) {
          setSelectedStrategy(uniqueKeys[0] || "");
        }

        console.log(
          "Period changed to:",
          period,
          "Selected strategy:",
          selectedStrategy,
          "Available keys:",
          uniqueKeys
        );
        console.log("Chart data sample:", chartData.slice(0, 2));
        setSelectedKeys(new Set(uniqueKeys)); // select all strategies initially for dollar view

        // Fetch TVL data from config API after chart data is ready
        const tvlUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.tvl;
        let tvlRaw: TVLData[] = [];

        if (typeof tvlUrl === "string" && tvlUrl.startsWith("http")) {
          try {
            const tvlRes = await fetch(tvlUrl);
            const tvlJson = await tvlRes.json();
            console.log("Fetched TVL data:", tvlJson);

            // Handle the API response format - it returns a single TVL value
            if (typeof tvlJson.result === "number") {
              // For now, we'll use a constant TVL value since the API returns current TVL
              // In a real implementation, you might need historical TVL data
              const currentTvl = tvlJson.result;

              // Create TVL data for the chart period
              // Since we don't have historical TVL, we'll use the current TVL for all dates
              const chartDates = chartData.map((item) => item.date);
              tvlRaw = chartDates.map((date) => ({
                date,
                tvl: currentTvl,
              }));
            }
          } catch (error) {
            console.error("Error fetching TVL data:", error);
            // Fallback to a default TVL value
            const defaultTvl = 1000000; // $1M default
            const chartDates = chartData.map((item) => item.date);
            tvlRaw = chartDates.map((date) => ({
              date,
              tvl: defaultTvl,
            }));
          }
        }

        setTvlData(tvlRaw);
      } catch (err) {
        console.error("Error loading chart data:", err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    }

    fetchData();
  }, [period]); // refetch when period changes

  // Since we're always showing percentages now, we can simplify this
  const calculatePercentageData = (
    chartData: ChartDataPoint[]
  ): ChartDataPoint[] => {
    return chartData; // Data is already in percentage format
  };

  const handleStrategySelect = (strategy: string) => {
    setSelectedStrategy(strategy);
  };

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

  // Process data based on view type
  const processedData = data.map((item) => {
    const processed: any = { date: item.date };

    keys.forEach((key) => {
      if (showPercentages) {
        // For percentage view, we need to calculate from raw data
        const rawItem = rawData.find((r) => {
          const normalizedStrategy = normalizeAddress(r.strategy);
          const strategyName =
            STRATEGY_NAME_MAP[normalizedStrategy] ||
            `${r.network}_${r.strategy}`;

          // Match date format based on period
          const dateMatch =
            period === "weekly"
              ? dayjs(r.date).startOf("week").format("MMM DD") ===
                item.date.replace("Week of ", "")
              : period === "monthly"
              ? dayjs(r.date).format("MMM YYYY") === item.date
              : dayjs(r.date).format("MMM DD") === item.date;

          return strategyName === key && dateMatch;
        });
        // Cap extreme annualized yield values to make them more practical
        const annualizedYield = rawItem?.annualizedYield7d || 0;
        // Cap at 1000% APY to filter out unrealistic values from early/volatile periods
        processed[key] = Math.min(annualizedYield, 1000);
      } else {
        // For dollar view, calculate from raw data using yieldDollars
        const rawItem = rawData.find((r) => {
          const normalizedStrategy = normalizeAddress(r.strategy);
          const strategyName =
            STRATEGY_NAME_MAP[normalizedStrategy] ||
            `${r.network}_${r.strategy}`;

          // Match date format based on period
          const dateMatch =
            period === "weekly"
              ? dayjs(r.date).startOf("week").format("MMM DD") ===
                item.date.replace("Week of ", "")
              : period === "monthly"
              ? dayjs(r.date).format("MMM YYYY") === item.date
              : dayjs(r.date).format("MMM DD") === item.date;

          return strategyName === key && dateMatch;
        });
        processed[key] = rawItem?.yieldDollars || 0;
      }
    });

    return processed;
  });

  // Calculate cumulative data for dollar view (all strategies)
  const cumulativeData = processedData.map((item, index) => {
    const cumulative: any = { date: item.date };

    // Calculate cumulative for all strategies
    keys.forEach((key) => {
      if (index === 0) {
        cumulative[`${key}_cumulative`] = item[key] || 0;
      } else {
        // Calculate cumulative by summing all previous values
        let runningTotal = 0;
        for (let i = 0; i <= index; i++) {
          runningTotal += (processedData[i][key] as number) || 0;
        }
        cumulative[`${key}_cumulative`] = runningTotal;
      }
    });

    // Calculate total cumulative
    let totalCumulative = 0;
    keys.forEach((key) => {
      totalCumulative += cumulative[`${key}_cumulative`] || 0;
    });
    cumulative.total_cumulative = totalCumulative;

    return cumulative;
  });

  // Use the data based on view type
  const filteredData = processedData.map((item) => {
    const filtered: any = { date: item.date };

    // Include only the selected strategy bar data for both percentage and dollar view
    if (selectedStrategy && item[selectedStrategy] !== undefined) {
      filtered[selectedStrategy] = item[selectedStrategy];
    }

    // Include cumulative line if enabled and not showing percentages
    if (!showPercentages && showCumulative) {
      const index = processedData.findIndex((d) => d.date === item.date);
      if (index !== -1) {
        filtered.total_cumulative = cumulativeData[index].total_cumulative;
      }
    }

    return filtered;
  });

  if (initialLoading && loading) {
    return (
      <div className="rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
        <div className="w-full h-[300px] px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">Loading yield data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-6 rounded-xl text-white w-full max-h-[600px] mb-12 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-white"></div>
        <div className="flex gap-4 items-center">
          {/* Main toggle: Percentage vs Yield Values */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                showPercentages ? "text-[#ffffff]" : "text-gray-400"
              }`}
            >
              Annualized %
            </span>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={!showPercentages}
                  onChange={(e) => setShowPercentages(!e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-5 rounded-full transition-all duration-300 ease-in-out shadow-inner ${
                    !showPercentages ? "bg-[#7B5FFF]" : "bg-[#2A2A3C]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out transform shadow-md ${
                      !showPercentages ? "translate-x-6" : "translate-x-0.5"
                    } mt-0.5`}
                  ></div>
                </div>
              </div>
            </label>
            <span
              className={`text-sm font-medium ${
                !showPercentages ? "text-[#ffffff]" : "text-gray-400"
              }`}
            >
              Yield Values
            </span>
          </div>

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
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={320}>
            {showPercentages ? (
              // Area Chart for Percentage view
              <AreaChart
                data={filteredData}
                margin={{ top: 10, right: 0, left: -20, bottom: 20 }}
              >
                <defs>
                  {/* Gradient for the selected strategy area */}
                  <linearGradient
                    id="strategyGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={colorMap[selectedStrategy] || "#7B5FFF"}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={colorMap[selectedStrategy] || "#7B5FFF"}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={{ stroke: "#374151" }}
                />
                <YAxis
                  tickFormatter={(val) => `${val.toFixed(1)}`}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={{ stroke: "#374151" }}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CommonTooltip
                      active={active}
                      payload={payload}
                      label={String(label)}
                      title={String(label)}
                      showTotal={false}
                      showColoredCircles={false}
                      customContent={
                        active && payload && payload.length ? (
                          <div className="space-y-2 mb-3">
                            {payload.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <span className="text-sm text-gray-600 flex-1">
                                  {item.name}
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                  {`${item.value.toFixed(2)}% APY`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                  )}
                />

                {/* Single strategy area for percentage view */}
                {selectedStrategy && (
                  <Area
                    key={selectedStrategy}
                    type="monotone"
                    dataKey={selectedStrategy}
                    stroke={colorMap[selectedStrategy] || "#7B5FFF"}
                    strokeWidth={2}
                    fill="url(#strategyGradient)"
                    name={selectedStrategy}
                  />
                )}
              </AreaChart>
            ) : (
              // Composed Chart (Bar + Line) for Yield Values view
              <ComposedChart
                data={filteredData}
                margin={{ top: 20, right: -20, left: -30, bottom: 20 }}
              >
                <defs>
                  {/* Background fill for negative area */}
                  <linearGradient
                    id="negativeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.1} />
                    <stop
                      offset="100%"
                      stopColor="#EF4444"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                {/* Negative area background */}
                <Area
                  type="monotone"
                  dataKey={() => 0}
                  stroke="none"
                  fill="url(#negativeGradient)"
                  yAxisId="right"
                />

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={{ stroke: "#374151" }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000) {
                      return `$${(val / 1000).toFixed(0)}k`;
                    }
                    return `$${val.toFixed(0)}`;
                  }}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={{ stroke: "#374151" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000) {
                      return `$${(val / 1000).toFixed(0)}k`;
                    }
                    return `$${val.toFixed(0)}`;
                  }}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={{ stroke: "#374151" }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0)
                      return null;

                    // Find the strategy data (bar) and cumulative data (line)
                    const strategyData = payload.find(
                      (item: any) => item.dataKey === selectedStrategy
                    );
                    const cumulativeData = payload.find(
                      (item: any) => item.dataKey === "total_cumulative"
                    );

                    return (
                      <div className="rounded-lg shadow-lg overflow-hidden border border-gray-200 relative z-50">
                        {/* Header - Darker grey background */}
                        <div className="bg-gray-300 border-b border-gray-400 px-4 py-3">
                          <div className="text-sm font-semibold text-gray-700">
                            {String(label)}
                          </div>
                        </div>

                        {/* Content - Light grey background */}
                        <div className="bg-gray-100 px-4 py-3 relative z-50">
                          <div className="space-y-2 mb-3">
                            {/* Strategy daily yield */}
                            {strategyData && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 flex-1">
                                  {strategyData.name}
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                  {Math.abs(strategyData.value) >= 1000
                                    ? `$${(strategyData.value / 1000).toFixed(
                                        1
                                      )}K`
                                    : `$${strategyData.value.toFixed(2)}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer - Same darker grey as header */}
                        {cumulativeData && (
                          <div className="bg-gray-300 border-t border-gray-400 px-4 py-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">
                                Total Cumulative
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                {Math.abs(cumulativeData.value) >= 1000
                                  ? `$${(cumulativeData.value / 1000).toFixed(
                                      1
                                    )}K`
                                  : `$${cumulativeData.value.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                {/* Single strategy bar for yield values view */}
                {selectedStrategy && (
                  <Bar
                    key={selectedStrategy}
                    yAxisId="right"
                    dataKey={selectedStrategy}
                    fill={colorMap[selectedStrategy] || "#7B5FFF"}
                    name={selectedStrategy}
                  />
                )}

                {/* Cumulative line for yield values view */}
                {showCumulative && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_cumulative"
                    stroke="#7B5FFF"
                    strokeWidth={1.5}
                    dot={false}
                    name="Total Cumulative Yield"
                  />
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Strategy selector - moved to bottom */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {keys.map((key, index) => {
              // Check if this strategy has data for the current period
              const hasData = data.some(
                (item) => item[key] !== undefined && item[key] !== 0
              );
              const isSelected = selectedStrategy === key;
              const strategyColor =
                colorMap[key] || COLORS[index % COLORS.length];

              return (
                <button
                  key={key}
                  className={`px-3 py-2 rounded text-xs transition-colors ${
                    isSelected
                      ? "text-white"
                      : hasData
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? strategyColor
                      : hasData
                      ? "#2A2A3C"
                      : "#1A1A2C",
                    border: isSelected
                      ? `2px solid ${strategyColor}`
                      : "2px solid transparent",
                  }}
                  onClick={() => hasData && handleStrategySelect(key)}
                  disabled={!hasData}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-4">
            {/* Cumulative toggle for yield values view */}
            {!showPercentages && (
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showCumulative}
                    onChange={(e) => setShowCumulative(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-8 h-4 rounded-full transition-all duration-300 ease-in-out shadow-inner ${
                      showCumulative ? "bg-[#7B5FFF]" : "bg-[#2A2A3C]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ease-in-out transform shadow-md ${
                        showCumulative ? "translate-x-4" : "translate-x-0"
                      } mt-0`}
                    ></div>
                  </div>
                </div>
                <span className="text-gray-300 font-medium">
                  Show Cumulative
                </span>
              </label>
            )}

            {/* Cumulative line indicator for dollar view */}
            {!showPercentages && showCumulative && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-1 rounded"
                  style={{
                    backgroundColor: "#7B5FFF",
                  }}
                />
                <span className="text-xs text-white">Total Cumulative</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
