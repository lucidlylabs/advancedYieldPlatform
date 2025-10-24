import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import { CommonTooltip } from '../ui/tooltip';

interface PortfolioEntry {
  timestamp: string;
  value: number;
}

interface BalanceHistoryEntry {
  date: string;
  totalBalance: number;
  totalUsdValue: number;
  exchangeRate: number;
  chainBreakdown: {
    base: number;
    ethereum: number;
    arbitrum: number;
    katana: number;
  };
  chainUsdBreakdown: {
    base: number;
    ethereum: number;
    arbitrum: number;
    katana: number;
  };
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  wallet: string;
  summary: {
    totalRecords: number;
    firstRecordDate: string;
    lastRecordDate: string;
    currentBalance: number;
    currentUsdValue: number | null;
    maxBalance: number;
    minBalance: number;
    balanceChange: number;
    balanceChangePercent: string;
    usdValueChange: number | null;
    usdValueChangePercent: string | null;
  };
  balanceHistory: BalanceHistoryEntry[];
}

// Empty state component with graph visualization
const EmptyPortfolioState = () => {
  // Create empty data points for visualization
  const emptyData = Array.from({ length: 7 }, (_, i) => ({
    timestamp: `Day ${i + 1}`,
    value: 0,
  }));

  return (
    <div className="flex flex-col mb-5 p-4">
      <div className="text-[#9C9DA2] text-[16px] font-bold uppercase mb-4">
        TOTAL PORTFOLIO VALUE
      </div>    
      <div style={{ width: '650px', height: '340px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={emptyData} 
            margin={{ top: 10, right: -30, left: -20, bottom: 20 }}
            style={{ outline: "none", border: "none" }}
            className="focus:outline-none focus:ring-0 focus:border-0"
          >
            <defs>
              <linearGradient id="colorEmptyPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9C9DA2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9C9DA2" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value === 0 ? '$0' : ''}
              tickCount={3}
            />
            <Area 
              type="monotone"
              dataKey="value" 
              stroke="#9C9DA2"
              strokeWidth={2}
              fill="url(#colorEmptyPortfolio)"
              name="Portfolio Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
};

export default function PortfolioChart({ userAddress }: { userAddress: string }) {
  const [data, setData] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/user-balance-history/${userAddress}`);
        const json: ApiResponse = await res.json();
        console.log('balance history data', json);

        if (json.success && Array.isArray(json.balanceHistory)) {
          const sortedData = json.balanceHistory
            .sort((a: BalanceHistoryEntry, b: BalanceHistoryEntry) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );

          // Check for gaps in the data and fill with zeros
          const filledData = [];
          for (let i = 0; i < sortedData.length - 1; i++) {
            filledData.push({
              timestamp: dayjs(sortedData[i].date).format('MMM DD'),
              value: sortedData[i].totalUsdValue,
            });
            
            const currentDate = dayjs(sortedData[i].date);
            const nextDate = dayjs(sortedData[i + 1].date);
            const daysDiff = nextDate.diff(currentDate, 'day');
            
            // If gap > 1 day, fill with zeros
            if (daysDiff > 1) {
              for (let j = 1; j < daysDiff; j++) {
                filledData.push({
                  timestamp: currentDate.add(j, 'day').format('MMM DD'),
                  value: 0
                });
              }
            }
          }

          // Add the last record
          if (sortedData.length > 0) {
            filledData.push({
              timestamp: dayjs(sortedData[sortedData.length - 1].date).format('MMM DD'),
              value: sortedData[sortedData.length - 1].totalUsdValue,
            });
          }

          // Add 2 days of padding before the first value with zero values
          const paddedData = [];
          if (filledData.length > 0) {
            const firstDate = dayjs(sortedData[0].date);
            
            // Add 2 days before with zero values
            paddedData.push({
              timestamp: firstDate.subtract(2, 'day').format('MMM DD'),
              value: 0
            });
            paddedData.push({
              timestamp: firstDate.subtract(1, 'day').format('MMM DD'), 
              value: 0
            });
          }
          
          const finalData = [...paddedData, ...filledData];
          setData(finalData);
          console.log('complete balance history with gap filling', finalData);
        } else {
          console.warn('Invalid response or balanceHistory is not an array', json);
          setData([]); // fallback to empty
        }
      } catch (error) {
        console.error('Error fetching balance history:', error);
        setData([]); // fallback to empty
      } finally {
        setIsLoading(false);
      }
    }
    
    if (userAddress) {
      fetchData();
    } else {
      setIsLoading(false);
      setData([]);
    }
  }, [userAddress]);

  // Show empty state if no data or if all values are zero
  const hasData = data.length > 0 && data.some(entry => entry.value > 0);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-[#9C9DA2] text-[14px]">Loading...</div>
      </div>
    );
  }

  if (!hasData) {
    return <EmptyPortfolioState />;
  }

  return (
    <div className="flex flex-col text-white mb-5 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
      <div className="text-[#9C9DA2] text-[16px] font-bold uppercase mb-4">
        TOTAL PORTFOLIO VALUE
      </div>
      <div style={{ width: '700px', height: '340px' }} className="focus:outline-none focus:ring-0 focus:border-0 relative">
        <ResponsiveContainer 
          width="100%" 
          height="100%"
          className="focus:outline-none focus:ring-0 focus:border-0"
        >
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: -30, left: -20, bottom: 20 }}
            style={{ outline: "none", border: "none" }}
            className="focus:outline-none focus:ring-0 focus:border-0"
          >
            <defs>
              <linearGradient id="colorPortfolioValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B5FFF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7B5FFF" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              orientation="right"
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, (dataMax) => dataMax * 1.1]}
              tickCount={8}
              tickFormatter={(value) => {
                if (value === 0) {
                  return '';
                }
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}k`;
                } else {
                  return `$${value}`;
                }
              }}
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 flex-1">
                            Portfolio Value:
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            ${payload[0].value?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : null
                  }
                />
              )}
              labelFormatter={(label: string) => label}
            />
            <Area 
              type="monotone"
              dataKey="value" 
              stroke="#7B5FFF"
              strokeWidth={2}
              fill="url(#colorPortfolioValue)"
              name="Portfolio Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
