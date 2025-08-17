// components/StrategyDailyYieldChart.tsx
import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import dayjs from 'dayjs';

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

const STRATEGY_NAME_MAP: Record<string, string> = {
  "0x2fa924e8474726dec250eead84f4f34e063acdcc": "PT-sUSDF/USDC SiloV2 (7.5x)",
  "0xa32ba04a547e1c6419d3fcf5bbdb7461b3d19bb1": "PT-iUSD/USDC Morpho (4x)",
  "0xd0bc4920f1b43882b334354ffab23c9e9637b89e": "Gauntlet Frontier USDC",
  "0x1ed0a3d7562066c228a0bb3fed738182f03abd01": "RLP/USDC Morpho",
  "0x79857afb972e43c7049ae3c63274fc5ef3b815bb": "SUSD/USDC AaveV3 (7x)",
  "0x56b3c60b4ea708a6fda0955b81df52148e96813a": "SUSDe"
};

const normalizeAddress = (address: string): string => {
  return address.replace(/^ethereum_/i, '').toLowerCase();
};

const COLORS = [
  '#3B82F6', // Blue for RLP/USDC Morpho
  '#F59E0B', // Orange for PT-sUSDF/USDC SiloV2
  '#22C55E', // Green for SUSDe
  '#EF4444', // Red for SUSD/USDC AaveV3
  '#A855F7', // Purple for PT-iUSD/USDC Morpho
  '#10B981'  // Light Green for Gauntlet Frontier USDC
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
  const [showAsPercentage, setShowAsPercentage] = useState(false);
  const [tvl, setTvl] = useState<number>(0);
  const [overallYieldData, setOverallYieldData] = useState<ChartDataPoint[]>([]);

  // Fetch TVL data
  const fetchTVL = async () => {
    try {
      const response = await fetch('https://api.lucidly.finance/services/aum_data?vaultName=syUSD');
      const data = await response.json();
      console.log('TVL API response:', data);
      
      // Try different possible field names for TVL
      const tvlValue = parseFloat(data.tvl || data.value || data.amount || data.aum || data.totalValue || '0');
      setTvl(tvlValue);
      console.log('TVL fetched:', tvlValue);
      
      // If TVL is still 0, use a reasonable default for testing
      if (tvlValue === 0) {
        console.log('TVL is 0, using default value for testing');
        setTvl(1000000); // $1M default for testing
      }
    } catch (error) {
      console.error('Error fetching TVL:', error);
      // Fallback to a reasonable default if API fails
      setTvl(1000000); // $1M default
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Only show loading on initial load, not on period changes
        if (data.length === 0) {
          setLoading(true);
        }
        
        // Fetch TVL first and wait for it
        await fetchTVL();
        
        const res = await fetch(`http://localhost:3001/api/strategy/yield?period=${period}`);
        const json = await res.json();
        console.log('Fetched yield data:', json);
        const raw: RawYield[] = json.data;
        
        // Debug: Check if we have any yield data
        console.log('Raw yield data length:', raw.length);
        if (raw.length > 0) {
          console.log('Sample yield entry:', raw[0]);
          console.log('Sample yield value:', raw[0].yield);
        }
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
        console.log('Current TVL value:', tvl);
        
        // Sort chartData by date for proper cumulative calculation
        chartData.sort((a, b) => {
          const dateA = period === 'weekly' 
            ? dayjs(a.date.replace('Week of ', '')).valueOf()
            : period === 'monthly'
            ? dayjs(a.date).valueOf()
            : dayjs(a.date).valueOf();
          const dateB = period === 'weekly'
            ? dayjs(b.date.replace('Week of ', '')).valueOf()
            : dayjs(b.date).valueOf();
          return dateA - dateB;
        });

        // Get the current TVL value for calculation
        const currentTvl = tvl || 1000000; // Use current TVL or fallback
        
        // Calculate overall yield percentage over TVL
        const overallData: ChartDataPoint[] = chartData.map(dataPoint => {
          const totalDailyYield = uniqueKeys.reduce((sum, key) => {
            return sum + ((dataPoint[key] as number) || 0);
          }, 0);
          
          const yieldPercentage = currentTvl > 0 ? (totalDailyYield / currentTvl) * 100 : 0;
          
          console.log(`Date: ${dataPoint.date}, Total Yield: ${totalDailyYield}, TVL: ${currentTvl}, Percentage: ${yieldPercentage}%`);
          
          return {
            overallYieldPercentage: yieldPercentage,
            totalDailyYield: totalDailyYield,
            // Keep individual strategy data for tooltip
            ...dataPoint
          };
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
        setOverallYieldData(overallData);
        setCumulativeData(cumulativeData);
        setKeys(uniqueKeys);
        setColorMap(newColorMap);
        setSelectedKeys(new Set(uniqueKeys)); // select all initially
      } catch (err) {
        console.error('Error loading chart data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period, tvl]); // refetch when period or TVL changes

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

  // Combine data and cumulative data for the chart
  const combinedData = data.map((item, index) => {
    const combined = { ...item };
    if (cumulativeData[index]) {
      Object.keys(cumulativeData[index]).forEach(key => {
        if (key !== 'date') {
          combined[key] = cumulativeData[index][key];
        }
      });
    }
    return combined;
  });

  // Use overall yield data when showing as percentage, otherwise use individual strategy data
  const chartDataToUse = showAsPercentage ? overallYieldData : combinedData;

  const filteredData = chartDataToUse.map(item => {
    const filtered: any = { date: item.date };
    
    if (showAsPercentage) {
      // When showing as percentage, only show overall yield percentage
      filtered.overallYieldPercentage = item.overallYieldPercentage;
      filtered.totalDailyYield = item.totalDailyYield;
    } else {
      // Calculate total for percentage calculation
      const totalYield = Object.keys(item)
        .filter(k => k !== 'date' && !k.endsWith('_cumulative') && selectedKeys.has(k))
        .reduce((sum, k) => sum + ((item[k] as number) || 0), 0);
      
      Object.keys(item).forEach(k => {
        if (k === 'date') {
          filtered[k] = item[k];
        } else if (k.endsWith('_cumulative')) {
          // Include cumulative data if the base strategy is selected and cumulative is enabled
          const baseKey = k.replace('_cumulative', '');
          if (selectedKeys.has(baseKey) && showCumulative) {
            filtered[k] = item[k];
          }
        } else if (selectedKeys.has(k)) {
          // Include regular bar data
          filtered[k] = item[k];
        }
      });
    }
    return filtered;
  });

  if (loading) return (
    <div className="w-full p-6 rounded-xl text-white">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B5FFF] mx-auto mb-4"></div>
          <p className="text-[#9C9DA2]">Loading yield data...</p>
        </div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (showAsPercentage) {
        // When showing as percentage, show overall yield percentage and strategy breakdown
        const overallData = payload.find((item: any) => item.dataKey === 'overallYieldPercentage');
        const totalYieldData = payload.find((item: any) => item.dataKey === 'totalDailyYield');
        
        // Find the corresponding data point to get individual strategy breakdown
        const dataPoint = filteredData.find((item: any) => item.date === label);
        
        return (
          <div className="bg-[#1C1D2A] border border-[rgba(255,255,255,0.1)] p-3 rounded text-sm shadow-lg">
            <p className="text-[#9C9DA2] mb-2 font-medium">{label}</p>
            
            {overallData && (
              <p className="text-[#7B5FFF] text-sm mb-2 font-semibold">
                Overall Yield: {overallData.value.toFixed(2)}%
              </p>
            )}
            
            {totalYieldData && (
              <p className="text-[#9C9DA2] text-xs mb-2 border-b border-[rgba(255,255,255,0.1)] pb-1">
                Total Daily Yield: {totalYieldData.value.toFixed(4)} YLD
              </p>
            )}
            
            {dataPoint && (
              <>
                <p className="text-[#9C9DA2] text-xs my-2">Strategy Breakdown:</p>
                {keys.filter(key => selectedKeys.has(key)).map((key) => {
                  const value = (dataPoint[key] as number) || 0;
                  const percentage = tvl > 0 ? (value / tvl) * 100 : 0;
                  return (
                    <p key={key} style={{ color: colorMap[key] }} className="my-1 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorMap[key] }}></div>
                      <span className="text-white">{key}:</span>
                      <span className="font-semibold">
                        {percentage.toFixed(2)}% ({value.toFixed(4)} YLD)
                      </span>
                    </p>
                  );
                })}
              </>
            )}
          </div>
        );
      } else {
        // Original tooltip for individual strategy view
        const periodData = payload.filter((item: any) => !item.dataKey.endsWith('_cumulative'));
        const cumulativeData = payload.filter((item: any) => item.dataKey.endsWith('_cumulative'));
        
        const totalPeriodYield = periodData.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
        
        return (
          <div className="bg-[#1C1D2A] border border-[rgba(255,255,255,0.1)] p-3 rounded text-sm shadow-lg">
            <p className="text-[#9C9DA2] mb-2 font-medium">{label}</p>
            
            {periodData.length > 0 && (
              <>
                <p className="text-[#9C9DA2] text-xs mb-2 border-b border-[rgba(255,255,255,0.1)] pb-1">
                  {period.charAt(0).toUpperCase() + period.slice(1)} Yield: {totalPeriodYield.toFixed(4)}
                </p>
                {periodData.map((item: any, idx: number) => (
                  <p key={idx} style={{ color: item.fill }} className="my-1 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.fill }}></div>
                    <span className="text-white">{item.name}:</span>
                    <span className="font-semibold">
                      {`${item.value.toFixed(4)} YLD`}
                    </span>
                  </p>
                ))}
              </>
            )}
            
            {cumulativeData.length > 0 && (
              <>
                <p className="text-[#9C9DA2] text-xs my-2 border-t border-[rgba(255,255,255,0.1)] pt-2">Cumulative:</p>
                {cumulativeData.map((item: any, idx: number) => (
                  <p key={idx} style={{ color: item.stroke }} className="my-1 flex items-center gap-2">
                    <div className="w-4 h-0.5" style={{ backgroundColor: item.stroke }}></div>
                    <span className="text-white">{item.name.replace(' (Cumulative)', '')}:</span>
                    <span className="font-semibold">{item.value.toFixed(2)} YLD</span>
                  </p>
                ))}
              </>
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="w-full p-6 rounded-xl text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#D7E3EF]">STRATEGY YIELD</h2>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-[#9C9DA2]">
            <input
              type="checkbox"
              checked={showCumulative}
              onChange={(e) => setShowCumulative(e.target.checked)}
              className="rounded border-[rgba(255,255,255,0.2)] bg-[#1F202D] text-[#7B5FFF] focus:ring-[#7B5FFF]"
            />
            Show Cumulative
          </label>
          <label className="flex items-center gap-2 text-sm text-[#9C9DA2]">
            <input
              type="checkbox"
              checked={showAsPercentage}
              onChange={(e) => setShowAsPercentage(e.target.checked)}
              className="rounded border-[rgba(255,255,255,0.2)] bg-[#1F202D] text-[#7B5FFF] focus:ring-[#7B5FFF]"
            />
            Show as %
          </label>
          <div className="flex border border-[rgba(255,255,255,0.1)] rounded-md overflow-hidden">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as 'daily' | 'weekly' | 'monthly')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#7B5FFF] text-white'
                    : 'bg-transparent text-[#9C9DA2] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: "#A3A3A3", fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left" 
            tickFormatter={(val) => showAsPercentage ? `${val.toFixed(2)}%` : `${val.toFixed(2)}`} 
            tick={{ fill: "#A3A3A3", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={(val) => `${val.toFixed(0)}`} 
            tick={{ fill: "#A3A3A3", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {showAsPercentage ? (
            // Show overall yield percentage as a single line
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="overallYieldPercentage"
              stroke="#7B5FFF"
              strokeWidth={3}
              dot={false}
              name="Overall Yield %"
            />
          ) : (
            <>
              {/* Bars for daily/period yields */}
              {keys.filter(k => selectedKeys.has(k)).map((key) => (
                <Bar
                  key={key}
                  yAxisId="left"
                  dataKey={key}
                  stackId="a"
                  fill={colorMap[key]}
                  name={key}
                  radius={[2, 2, 0, 0]}
                />
              ))}
              
              {/* Lines for cumulative yields */}
              {showCumulative && keys.filter(k => selectedKeys.has(k)).map((key) => (
                <Line
                  key={`${key}_cumulative`}
                  yAxisId="right"
                  type="monotone"
                  dataKey={`${key}_cumulative`}
                  stroke={colorMap[key]}
                  strokeWidth={2}
                  dot={false}
                  name={`${key} (Cumulative)`}
                />
              ))}
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      {showAsPercentage ? (
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <div className="flex items-center gap-2 p-2 rounded">
            <div className="w-4 h-0.5 bg-[#7B5FFF]"></div>
            <span className="text-xs text-white">
              Overall Yield % (Daily Yield / TVL)
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {keys.map((key) => {
            const isSelected = selectedKeys.has(key);
            return (
              <div
                key={key}
                className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                onClick={() => handleLegendClick(key)}
              >
                <div className="flex items-center gap-1">
                  {/* Bar indicator */}
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: isSelected ? colorMap[key] : '#666666'
                    }}
                  />
                  {/* Line indicator (when cumulative is shown) */}
                  {showCumulative && isSelected && (
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundColor: colorMap[key]
                      }}
                    />
                  )}
                </div>
                <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {isSelected ? key : `${key} (deselected)`}
                  {showCumulative && isSelected && (
                    <span className="text-gray-400"> (bar + line)</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
