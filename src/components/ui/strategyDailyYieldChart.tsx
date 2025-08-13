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
  const [showAsPercentage, setShowAsPercentage] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Only show loading on initial load, not on period changes
        if (data.length === 0) {
          setLoading(true);
        }
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
      } catch (err) {
        console.error('Error loading chart data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]); // refetch when period changes

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

  const filteredData = combinedData.map(item => {
    const filtered: any = { date: item.date };
    
    // Calculate total for percentage calculation
    const totalYield = showAsPercentage ? 
      Object.keys(item)
        .filter(k => k !== 'date' && !k.endsWith('_cumulative') && selectedKeys.has(k))
        .reduce((sum, k) => sum + ((item[k] as number) || 0), 0) : 0;
    
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
        // Include regular bar data - convert to percentage if toggle is on
        if (showAsPercentage && totalYield !== 0) {
          const value = (item[k] as number) || 0;
          filtered[k] = (value / totalYield) * 100;
        } else {
          filtered[k] = item[k];
        }
      }
    });
    return filtered;
  });

  if (loading) return <div>Loading yield data...</div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Separate period yields from cumulative yields
      const periodData = payload.filter((item: any) => !item.dataKey.endsWith('_cumulative'));
      const cumulativeData = payload.filter((item: any) => item.dataKey.endsWith('_cumulative'));
      
      const totalPeriodYield = periodData.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
      
      return (
        <div className="bg-[#1C1D2A] border-none p-3 rounded text-sm">
          <p className="text-gray-400 mb-1">{label}</p>
          
          {periodData.length > 0 && (
            <>
              {!showAsPercentage && (
                <p className="text-gray-400 text-xs my-1">
                  {period.charAt(0).toUpperCase() + period.slice(1)} Yield: {totalPeriodYield.toFixed(4)}
                </p>
              )}
              {periodData.map((item: any, idx: number) => (
                <p key={idx} style={{ color: item.fill }} className="my-0.5">
                  {item.name}: <span className="font-medium">
                    {showAsPercentage ? `${item.value.toFixed(1)}%` : `${item.value.toFixed(4)} YLD`}
                  </span>
                </p>
              ))}
            </>
          )}
          
          {cumulativeData.length > 0 && (
            <>
              <p className="text-gray-400 text-xs my-1 border-t border-gray-600 pt-1">Cumulative:</p>
              {cumulativeData.map((item: any, idx: number) => (
                <p key={idx} style={{ color: item.stroke }} className="my-0.5">
                  {item.name}: <span className="font-medium">{item.value.toFixed(2)} YLD</span>
                </p>
              ))}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Strategy Yield</h2>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCumulative}
              onChange={(e) => setShowCumulative(e.target.checked)}
              className="rounded"
            />
            Show Cumulative
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAsPercentage}
              onChange={(e) => setShowAsPercentage(e.target.checked)}
              className="rounded"
            />
            Show as %
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-1 m-2 rounded text-sm bg-[#1F202D]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tickFormatter={(val) => showAsPercentage ? `${val.toFixed(1)}%` : `${val.toFixed(2)}`} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val.toFixed(0)}`} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bars for daily/period yields */}
          {keys.filter(k => selectedKeys.has(k)).map((key) => (
            <Bar
              key={key}
              yAxisId="left"
              dataKey={key}
              stackId="a"
              fill={colorMap[key]}
              name={key}
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
        </ComposedChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {keys.map((key) => {
          const isSelected = selectedKeys.has(key);
          return (
            <div
              key={key}
              className="flex items-center gap-2 cursor-pointer"
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
    </div>
  );
}
