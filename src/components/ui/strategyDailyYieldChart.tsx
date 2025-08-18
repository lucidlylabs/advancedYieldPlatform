// components/StrategyDailyYieldChart.tsx
import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend, Area
} from 'recharts';
import dayjs from 'dayjs';
import { USD_STRATEGIES } from '../../config/env';

interface RawYield {
  date: string;
  strategy: string;
  network: string;
  yield: number;
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
  "0x56b3c60b4ea708a6fda0955b81df52148e96813a": "sUSDe"
};

const normalizeAddress = (address: string): string => {
  return address.replace(/^ethereum_/i, '').toLowerCase();
};

const COLORS = [
  '#4F46E5', '#22C55E', '#F59E0B', '#EF4444',
  '#06B6D4', '#A855F7', '#E11D48', '#0EA5E9',
  '#F97316', '#84CC16'
];

export default function StrategyDailyYieldChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [showCumulative, setShowCumulative] = useState(true);
  const [showPercentages, setShowPercentages] = useState(false);
  const [tvlData, setTvlData] = useState<TVLData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Only show loading on initial load, not on period changes
        if (data.length === 0) {
          setLoading(true);
        }
        
        // Fetch yield data
        const res = await fetch(`http://localhost:3001/api/strategy/yield?period=${period}`);
        const json = await res.json();
        console.log('Fetched yield data:', json);
        const raw: RawYield[] = json.data;
        
        const grouped: Record<string, ChartDataPoint> = {};
        const strategyNames = new Set<string>();

        raw.forEach(({ date, strategy, network, yield: y }) => {
          // Format differently for weekly/monthly
          const d =
            period === 'weekly'
              ? `Week of ${dayjs(date).startOf('week').format('MMM DD')}`
              : period === 'monthly'
              ? dayjs(date).format('MMM YYYY')
              : dayjs(date).format('MMM DD');

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

          (grouped[d][strategyName] as number) += y;
        });

        const chartData = Object.values(grouped);
        const uniqueKeys = Array.from(strategyNames);
        console.log('Chart data:', chartData);
        
        // Sort chartData by date for proper cumulative calculation
        chartData.sort((a, b) => {
          const dateA = period === 'weekly' 
            ? dayjs(a.date.replace('Week of ', '')).valueOf()
            : period === 'monthly'
            ? dayjs(a.date).valueOf()
            : dayjs(a.date).valueOf();
          const dateB = period === 'weekly'
            ? dayjs(b.date.replace('Week of ', '')).valueOf()
            : period === 'monthly'
            ? dayjs(b.date).valueOf()
            : dayjs(b.date).valueOf();
          return dateA - dateB;
        });

        // Calculate cumulative data
        const cumulativeData: CumulativeDataPoint[] = [];
        const runningTotals: Record<string, number> = {};
        
        // Initialize running totals
        uniqueKeys.forEach(key => {
          runningTotals[key] = 0;
        });
        
        chartData.forEach(dataPoint => {
          const cumulativePoint: CumulativeDataPoint = { date: dataPoint.date };
          
          uniqueKeys.forEach(key => {
            const dailyValue = (dataPoint[key] as number) || 0;
            runningTotals[key] += dailyValue;
            cumulativePoint[`${key}_cumulative`] = runningTotals[key];
          });
          
          cumulativeData.push(cumulativePoint);
        });
        
        // Create a stable color mapping for each strategy
        const newColorMap: Record<string, string> = {};
        uniqueKeys.forEach((key, index) => {
          newColorMap[key] = COLORS[index % COLORS.length];
        });
        
        setData(chartData);
        setCumulativeData(cumulativeData);
        setKeys(uniqueKeys);
        setColorMap(newColorMap);
        setSelectedKeys(new Set(uniqueKeys)); // select all initially
        
        // Fetch TVL data from config API after chart data is ready
        const tvlUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.tvl;
        let tvlRaw: TVLData[] = [];
        
        if (typeof tvlUrl === "string" && tvlUrl.startsWith("http")) {
          try {
            const tvlRes = await fetch(tvlUrl);
            const tvlJson = await tvlRes.json();
            console.log('Fetched TVL data:', tvlJson);
            
            // Handle the API response format - it returns a single TVL value
            if (typeof tvlJson.result === "number") {
              // For now, we'll use a constant TVL value since the API returns current TVL
              // In a real implementation, you might need historical TVL data
              const currentTvl = tvlJson.result;
              
              // Create TVL data for the chart period
              // Since we don't have historical TVL, we'll use the current TVL for all dates
              const chartDates = chartData.map(item => item.date);
              tvlRaw = chartDates.map(date => ({
                date,
                tvl: currentTvl
              }));
            }
          } catch (error) {
            console.error('Error fetching TVL data:', error);
            // Fallback to a default TVL value
            const defaultTvl = 1000000; // $1M default
            const chartDates = chartData.map(item => item.date);
            tvlRaw = chartDates.map(date => ({
              date,
              tvl: defaultTvl
            }));
          }
        }
        
        setTvlData(tvlRaw);
        

      } catch (err) {
        console.error('Error loading chart data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]); // refetch when period changes

  // Calculate percentage data based on daily yield changes and TVL
  const calculatePercentageData = (chartData: ChartDataPoint[]): ChartDataPoint[] => {
    if (!showPercentages || tvlData.length === 0) return chartData;
    
    const percentageData: ChartDataPoint[] = [];
    
    chartData.forEach((dataPoint, index) => {
      const percentagePoint: ChartDataPoint = { date: dataPoint.date };
      
      if (index === 0) {
        // First day: no previous day to compare, so percentage is 0
        keys.forEach(key => {
          percentagePoint[key] = 0;
        });
      } else {
        const previousDataPoint = chartData[index - 1];
        const currentDate = dataPoint.date;
        const previousDate = previousDataPoint.date;
        
        // Find TVL for current date
        const currentTvl = tvlData.find(t => t.date === currentDate)?.tvl || 1;
        
        keys.forEach(key => {
          const currentYield = (dataPoint[key] as number) || 0;
          const previousYield = (previousDataPoint[key] as number) || 0;
          
          // Calculate daily yield change: (yield on day 2 - yield on day 1) / Total TVL * 100
          const yieldChange = currentYield - previousYield;
          const percentage = (yieldChange / currentTvl) * 100;
          percentagePoint[key] = percentage;
        });
      }
      
      percentageData.push(percentagePoint);
    });
    
    return percentageData;
  };

  const handleLegendClick = (key: string) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Calculate percentage data if needed
  const percentageData = calculatePercentageData(data);
  
  // Use percentage data or regular data based on toggle
  const chartDataToUse = showPercentages ? percentageData : data;
  
  // Combine data and cumulative data for the chart
  const combinedData = chartDataToUse.map((item, index) => {
    const combined = { ...item };
    // Always include cumulative data for the cumulative line
    if (cumulativeData[index]) {
      Object.keys(cumulativeData[index]).forEach(key => {
        if (key !== 'date') {
          combined[key] = cumulativeData[index][key];
        }
      });
    }
    return combined;
  });

  // Calculate combined cumulative data with total
  const combinedCumulativeData = combinedData.map((item, index) => {
    const combined = { ...item };
    let totalCumulative = 0;
    
    // Always calculate cumulative values for the cumulative line
    keys.forEach(key => {
      const cumulativeValue = (cumulativeData[index][`${key}_cumulative`] as number) || 0;
      combined[`${key}_cumulative`] = cumulativeValue;
      totalCumulative += cumulativeValue;
    });
    combined.total_cumulative = totalCumulative;
    
    return combined;
  });

  const filteredData = combinedCumulativeData.map(item => {
    const filtered: any = { date: item.date };
    
    // Always include cumulative line data
    Object.keys(item).forEach(k => {
      if (k === 'date') {
        filtered[k] = item[k];
      } else if (k === 'total_cumulative') {
        // Include total cumulative line
        filtered[k] = item[k];
      } else if (k.endsWith('_cumulative')) {
        // Include individual cumulative data for tooltip breakdown
        const baseKey = k.replace('_cumulative', '');
        if (selectedKeys.has(baseKey)) {
          filtered[k] = item[k];
        }
      } else if (selectedKeys.has(k)) {
        // Include regular bar data
        filtered[k] = item[k];
      }
    });
    
    return filtered;
  });

  if (loading) {
    return (
      <div className="w-full mt-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[rgba(255,255,255,0.70)] text-[16px] font-extrabold">
            STRATEGY YIELD
          </h2>
          <div className="flex gap-4 items-center">
            <div className="flex gap-1 items-center">
              <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">Daily</div>
              <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">Weekly</div>
              <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">Monthly</div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-10 h-6 rounded-full bg-gray-600">
                  <div className="w-4 h-4 bg-white rounded-full mt-1 ml-1"></div>
                </div>
                <span className="text-gray-300">Show as %</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-10 h-6 rounded-full bg-gray-600">
                  <div className="w-4 h-4 bg-white rounded-full mt-1 ml-1"></div>
                </div>
                <span className="text-gray-300">Show Cumulative</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">Loading yield data...</p>
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentDataPoint = filteredData.find((item: any) => item.date === label);
      const dailyYields = keys.filter(key => selectedKeys.has(key)).map(key => ({
        name: key,
        value: (currentDataPoint?.[key] as number) || 0,
        color: colorMap[key]
      }));
      const totalDailyYield = dailyYields.reduce((sum, item) => sum + item.value, 0);
      
      if (showPercentages) {
        // Percentage mode tooltip - simplified without strategy breakdown
        const totalCumulative = payload.find((item: any) => item.dataKey === 'total_cumulative');
        return (
          <div className="bg-[#1C1D2A] border-none p-3 rounded text-sm">
            <p className="text-gray-400 mb-1">{label}</p>
            
            {totalCumulative && (
              <div className="mb-2">
                <p className="text-white font-medium text-base">
                  Total Cumulative: <span className="text-blue-400">${totalCumulative.value.toFixed(2)}</span>
                </p>
              </div>
            )}
            
            <div className="mb-2">
              <p className="text-gray-400 text-xs mb-1">
                {period.charAt(0).toUpperCase() + period.slice(1)} Yield Change: {totalDailyYield.toFixed(4)}%
              </p>
              {dailyYields.map((item, idx) => (
                <p key={idx} style={{ color: item.color }} className="my-0.5 text-xs">
                  {item.name}: <span className="font-medium">{item.value.toFixed(4)}%</span>
                  <span className="text-gray-400 ml-1">({((item.value / totalDailyYield) * 100).toFixed(1)}% of total)</span>
                </p>
              ))}
            </div>
          </div>
        );
      } else {
        // Normal mode tooltip (cumulative + bars)
        const totalCumulative = payload.find((item: any) => item.dataKey === 'total_cumulative');
        const cumulativeBreakdown = payload.filter((item: any) => 
          typeof item.dataKey === 'string' && item.dataKey.endsWith('_cumulative') && item.dataKey !== 'total_cumulative'
        );
      
              return (
          <div className="bg-[#1C1D2A] border-none p-3 rounded text-sm">
            <p className="text-gray-400 mb-1">{label}</p>
            
            {totalCumulative && (
              <div className="mb-2">
                <p className="text-white font-medium text-base">
                  Total Cumulative: <span className="text-blue-400">${totalCumulative.value.toFixed(2)}</span>
                </p>
              </div>
            )}
            
            {dailyYields.length > 0 && (
              <div className="mb-2">
                <p className="text-gray-400 text-xs mb-1">
                  {period.charAt(0).toUpperCase() + period.slice(1)} Yield: ${totalDailyYield.toFixed(4)}
                </p>
                {dailyYields.map((item, idx) => {
                  const percentage = totalDailyYield !== 0 ? ((item.value / Math.abs(totalDailyYield)) * 100) : 0;
                  return (
                    <p key={idx} style={{ color: item.color }} className="my-0.5 text-xs">
                      {item.name}: <span className="font-medium">${item.value.toFixed(4)}</span>
                      <span className="text-gray-400 ml-1">({percentage.toFixed(1)}%)</span>
                    </p>
                  );
                })}
              </div>
            )}
            
            {cumulativeBreakdown.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-1 border-t border-gray-600 pt-1">Cumulative Breakdown:</p>
                {cumulativeBreakdown.map((item: any, idx: number) => {
                  const assetName = typeof item.dataKey === 'string' ? item.dataKey.replace('_cumulative', '') : '';
                  const percentage = totalCumulative ? ((item.value / Math.abs(totalCumulative.value)) * 100) : 0;
                  return (
                    <p key={idx} style={{ color: item.stroke }} className="my-0.5 text-xs">
                      {assetName}: <span className="text-white font-medium">${item.value.toFixed(2)}</span>
                      <span className="text-gray-400 ml-1">({percentage.toFixed(1)}%)</span>
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="w-full mt-2">
      <div className="flex items-center justify-between mb-6">
      <h2 className="text-[rgba(255,255,255,0.70)] text-[16px] font-extrabold ">
        STRATEGY YIELD
      </h2>
      <div className="flex gap-4 items-center">
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showPercentages}
                  onChange={(e) => setShowPercentages(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-all duration-300 ease-in-out shadow-inner ${
                  showPercentages ? 'bg-[#7B5FFF]' : 'bg-[#2A2A3C]'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out transform shadow-md ${
                    showPercentages ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </div>
              <span className="text-gray-300 font-medium">Show as %</span>
            </label>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showCumulative}
                  onChange={(e) => setShowCumulative(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-all duration-300 ease-in-out shadow-inner ${
                  showCumulative ? 'bg-[#7B5FFF]' : 'bg-[#2A2A3C]'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out transform shadow-md ${
                    showCumulative ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </div>
              <span className="text-gray-300 font-medium">Show Cumulative</span>
            </label>
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

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          {/* Background fill for negative area */}
          <defs>
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
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
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#9CA3AF' }} 
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis 
            yAxisId="left" 
            tickFormatter={(val) => {
              if (Math.abs(val) >= 1000) {
                return `$${(val / 1000).toFixed(0)}k`;
              }
              return `$${val.toFixed(0)}`;
            }} 
            tick={{ fontSize: 12, fill: '#9CA3AF' }} 
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={(val) => {
              if (showPercentages) {
                return `${val.toFixed(1)}%`;
              }
              if (Math.abs(val) >= 1000) {
                return `$${(val / 1000).toFixed(0)}k`;
              }
              return `$${val.toFixed(0)}`;
            }} 
            tick={{ fontSize: 12, fill: '#9CA3AF' }} 
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bars for daily/period yields */}
          {keys.filter(k => selectedKeys.has(k)).map((key) => (
            <Bar
              key={key}
              yAxisId="right"
              dataKey={key}
              stackId="a"
              fill={colorMap[key]}
              name={key}
            />
          ))}
          
          {/* Single combined cumulative line */}
          {showCumulative && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_cumulative"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={false}
              name="Total Cumulative Yield"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6">
        {keys.map((key) => {
          const isSelected = selectedKeys.has(key);
          return (
            <div
              key={key}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleLegendClick(key)}
            >
              <div
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: isSelected ? colorMap[key] : '#666666'
                }}
              />
              <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                {key}
              </span>
            </div>
          );
        })}
        
        {/* Total cumulative line indicator */}
        {showCumulative && (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-1 rounded"
              style={{
                backgroundColor: '#3B82F6'
              }}
            />
            <span className="text-xs text-white">Total Cumulative</span>
          </div>
        )}
      </div>
    </div>
  );
}