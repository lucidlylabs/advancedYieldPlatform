import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
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
    totalCumulative: number;
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
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      fetchData(period).then(rawData => {
        setData(rawData);
        
        // Calculate cumulative data for all assets combined
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
          
          let runningTotal = 0;
          const cumulativeData: CumulativeDataItem[] = [];
          
          sortedData.forEach(dataPoint => {
            // Sum all assets for this period
            let periodTotal = 0;
            allKeys.forEach(key => {
              const periodValue = (dataPoint[key] as number) || 0;
              periodTotal += periodValue;
            });
            
            // Add to running total
            runningTotal += periodTotal;
            
            cumulativeData.push({
              date: dataPoint.date,
              totalCumulative: runningTotal
            });
          });
          
          setCumulativeData(cumulativeData);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }, [period]); // refetch when period changes

    // Custom tooltip content component
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const value = payload[0].value;
        const formattedValue = value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`;
        
        return (
          <div className="bg-[#1C1D2A] border-none p-3 rounded text-sm">
            <p className="text-gray-400 mb-1">{label}</p>
            <p className="text-gray-400 text-xs my-1">Total Cumulative Deposits:</p>
            <p className="text-white my-0.5">
              {formattedValue}
            </p>
          </div>
        );
      }
      return null;
    };

    if (loading) return (
      <div className="p-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B5FFF] mx-auto mb-4"></div>
            <p className="text-[#9C9DA2]">Loading deposit data...</p>
          </div>
        </div>
      </div>
    );

    return (
      <div className="p-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Total Cumulative Deposits</h2>
          <div className="flex gap-2 items-center">
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
            <AreaChart
              data={cumulativeData}
              margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotalCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B5FFF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7B5FFF" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="totalCumulative"
                stroke="#7B5FFF"
                strokeWidth={2}
                fill="url(#colorTotalCumulative)"
                name="Total Cumulative Deposits"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>    
    );
  }