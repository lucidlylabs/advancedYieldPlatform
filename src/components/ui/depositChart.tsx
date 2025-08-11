import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
  } from "recharts";
  import { useEffect, useState } from "react";
  import dayjs from 'dayjs';

  const tokenAddressMap: Record<string, string> = {
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "USDC",
    "0x820c137fa70c8691f0e44dc420a5e53c168921dc": "USDS",
    "0x5875eEE11Cf8398102FdAd704C9E96607675467a": "sUSDS",
  };
  
  const formatAddress = (addr: string) =>
    addr.slice(0, 6) + "..." + addr.slice(-4);

  const shortToFullAddress: Record<string, string> = Object.fromEntries(
    Object.entries(tokenAddressMap).map(([full, name]) => [formatAddress(full), full])
  );

  type ChartDataItem = {
    date: string;
    [shortAddress: string]: number | string; 
  };

  type CumulativeDataItem = {
    date: string;
    [key: string]: number | string;
  };



  async function fetchData(period: 'daily' | 'weekly' | 'monthly'): Promise<ChartDataItem[]> {
    try {
      const res = await fetch(`http://localhost:3001/api/syUSD/deposits?period=${period}`);
      const rawData = await res.json();
  
      const result: ChartDataItem[] = [];
  
      for (const date in rawData) {
        const entry = rawData[date];
        
        // Format date based on period
        let formattedDate: string;
        if (period === 'weekly') {
          formattedDate = `Week of ${dayjs(date).startOf('week').format('MMM DD')}`;
        } else if (period === 'monthly') {
          formattedDate = dayjs(date).format('MMM YYYY');
        } else {
          formattedDate = dayjs(date).format('MMM DD');
        }
        
        const formatted: ChartDataItem = {
          date: formattedDate,
        };
  
        for (const addr in entry) {
          const shortAddr = formatAddress(addr);
          formatted[shortAddr] = entry[addr];
        }
  
        result.push(formatted);
      }
      console.log("Formatted data:", result);
      return result;
    } catch (err) {
      console.warn("API failed");
      return []; 
    }
  }
  
  export default function TotalDepositsChart() {
    const [data, setData] = useState<ChartDataItem[]>([]);
    const [cumulativeData, setCumulativeData] = useState<CumulativeDataItem[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [showCumulative, setShowCumulative] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
      fetchData(period).then(rawData => {
        setData(rawData);
        
        // Calculate cumulative data
        if (rawData.length > 0) {
          // Sort data chronologically for proper cumulative calculation
          const sortedData = [...rawData].sort((a, b) => {
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
          
          const allKeys = Array.from(
            new Set(
              sortedData.flatMap((item) =>
                Object.keys(item).filter((key) => key !== "date")
              )
            )
          );
          
          const runningTotals: Record<string, number> = {};
          allKeys.forEach(key => {
            runningTotals[key] = 0;
          });
          
          const cumulativeData: CumulativeDataItem[] = [];
          
          sortedData.forEach(dataPoint => {
            const cumulativePoint: CumulativeDataItem = { date: dataPoint.date };
            
            allKeys.forEach(key => {
              const periodValue = (dataPoint[key] as number) || 0;
              runningTotals[key] += periodValue;
              cumulativePoint[`${key}_cumulative`] = runningTotals[key];
            });
            
            cumulativeData.push(cumulativePoint);
          });
          
          setCumulativeData(cumulativeData);
        }
      });
    }, [period]); // refetch when period changes

    // Initialize selected assets when data is loaded
    useEffect(() => {
      if (data.length > 0) {
        const allKeys = Array.from(
          new Set(
            data.flatMap((item) =>
              Object.keys(item).filter((key) => key !== "date")
            )
          )
        );
        setSelectedAssets(new Set(allKeys));
      }
    }, [data]);

    const handleLegendClick = (entry: any) => {
      const assetKey = entry.dataKey;
      setSelectedAssets(prev => {
        const newSet = new Set(prev);
        if (newSet.has(assetKey)) {
          newSet.delete(assetKey);
        } else {
          newSet.add(assetKey);
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

    // Filter data based on selected assets
    const filteredData = combinedData.map(item => {
      const filtered: any = { date: item.date };
      Object.keys(item).forEach(key => {
        if (key === 'date') {
          filtered[key] = item[key];
        } else if (key.endsWith('_cumulative')) {
          // Include cumulative data if the base asset is selected and cumulative is enabled
          const baseKey = key.replace('_cumulative', '');
          if (selectedAssets.has(baseKey) && showCumulative) {
            filtered[key] = item[key];
          }
        } else if (selectedAssets.has(key)) {
          // Include regular bar data
          filtered[key] = item[key];
        }
      });
      return filtered;
    });

    // Custom tooltip content component
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        // Separate period deposits from cumulative deposits
        const periodData = payload.filter((item: any) => !item.dataKey.endsWith('_cumulative'));
        const cumulativeData = payload.filter((item: any) => item.dataKey.endsWith('_cumulative'));
        
        return (
          <div className="bg-[#1C1D2A] border-none p-3 rounded text-sm">
            <p className="text-gray-400 mb-1">{label}</p>
            
            {periodData.length > 0 && (
              <>
                <p className="text-gray-400 text-xs my-1">
                  {period.charAt(0).toUpperCase() + period.slice(1)} Deposits:
                </p>
                {periodData.map((entry: any, index: number) => {
                  const assetName = tokenAddressMap[shortToFullAddress[entry.dataKey]] || entry.dataKey;
                  const value = entry.value;
                  const formattedValue = value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`;
                  return (
                    <p key={index} style={{ color: entry.color }} className="my-0.5">
                      {`${assetName} ${formattedValue}`}
                    </p>
                  );
                })}
              </>
            )}
            
            {cumulativeData.length > 0 && (
              <>
                <p className="text-gray-400 text-xs my-1 border-t border-gray-600 pt-1">Total Cumulative:</p>
                {cumulativeData.map((entry: any, index: number) => {
                  const baseKey = entry.dataKey.replace('_cumulative', '');
                  const assetName = tokenAddressMap[shortToFullAddress[baseKey]] || baseKey;
                  const value = entry.value;
                  const formattedValue = value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`;
                  return (
                    <p key={index} style={{ color: entry.stroke }} className="my-0.5">
                      {`${assetName} ${formattedValue}`}
                    </p>
                  );
                })}
              </>
            )}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="p-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Total Deposits</h2>
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
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={[...filteredData].reverse()}
              margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2A2A3C"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#A3A3A3", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                orientation="right" 
                tick={{ fill: "#A3A3A3", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => {
                  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                  return `$${val}`;
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="left"
                tick={{ fill: "#A3A3A3", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => {
                  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                  return `$${val}`;
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                labelFormatter={(label: string) => label}
              />
              {data.length > 0 &&
                (() => {
                  const allKeys = Array.from(
                    new Set(
                      data.flatMap((item) =>
                        Object.keys(item).filter((key) => key !== "date")
                      )
                    )
                  );
    
                  const colors = {
                    [allKeys[0]]: "#7B5FFF", // violet
                    [allKeys[1]]: "#5CD6FF", // cyan
                    [allKeys[2]]: "#C3F34A", // lime
                  };
    
                  return (
                    <>
                      {/* Bars for daily deposits */}
                      {allKeys
                        .filter(key => selectedAssets.has(key))
                        .map((key) => (
                          <Bar
                            key={key}
                            yAxisId="left"
                            dataKey={key}
                            stackId="a"
                            fill={colors[key] || "#8884d8"}
                            radius={[2, 2, 0, 0]} 
                          />
                        ))}
                      
                      {/* Lines for cumulative deposits */}
                      {showCumulative && allKeys
                        .filter(key => selectedAssets.has(key))
                        .map((key) => (
                          <Line
                            key={`${key}_cumulative`}
                            yAxisId="right"
                            type="monotone"
                            dataKey={`${key}_cumulative`}
                            stroke={colors[key] || "#8884d8"}
                            strokeWidth={2}
                            dot={false}
                            name={`${tokenAddressMap[shortToFullAddress[key]] || key} (Cumulative)`}
                          />
                        ))}
                    </>
                  );
                })()}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom legend to show all assets */}
        {data.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            {(() => {
              const allKeys = Array.from(
                new Set(
                  data.flatMap((item) =>
                    Object.keys(item).filter((key) => key !== "date")
                  )
                )
              );
              const colors = {
                [allKeys[0]]: "#7B5FFF", // violet
                [allKeys[1]]: "#5CD6FF", // cyan
                [allKeys[2]]: "#C3F34A", // lime
              };
              return allKeys.map(key => {
                const isSelected = selectedAssets.has(key);
                const assetName = tokenAddressMap[shortToFullAddress[key]] || key;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handleLegendClick({ dataKey: key })}
                  >
                    <div className="flex items-center gap-1">
                      {/* Bar indicator */}
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: isSelected ? colors[key] || "#8884d8" : "#666666"
                        }}
                      />
                      {/* Line indicator (when cumulative is shown) */}
                      {showCumulative && isSelected && (
                        <div
                          className="w-4 h-0.5"
                          style={{
                            backgroundColor: colors[key] || "#8884d8"
                          }}
                        />
                      )}
                    </div>
                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                      {isSelected ? assetName : `${assetName} (deselected)`}
                      {showCumulative && isSelected && (
                        <span className="text-gray-400"> (bar + line)</span>
                      )}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>    
    );
  }