import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
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
    <div className="w-full h-96 flex flex-col bg-[rgba(255,255,255,0.01)] p-4">    
      <div className="text-[#9C9DA2] text-[16px] font-bold uppercase mb-4">
        TOTAL PORTFOLIO VALUE
      </div>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={emptyData} 
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            style={{ outline: "none", border: "none" }}
            className="focus:outline-none focus:ring-0 focus:border-0"
            barCategoryGap="1%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value === 0 ? '$0' : ''}
              tickCount={3}
            />
            <Bar 
              dataKey="value" 
              fill="#9C9DA2"
              name="Portfolio Value"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
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
          const sorted = json.balanceHistory
            .sort((a: BalanceHistoryEntry, b: BalanceHistoryEntry) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((entry: BalanceHistoryEntry) => ({
              timestamp: dayjs(entry.date).format('MMM DD'),
              value: entry.totalUsdValue,
            }));

          setData(sorted);
          console.log('sorted balance history', sorted);
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
    <div className="w-full h-96 pt-2 pb-6 rounded-xl text-white [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0"> 
      <div className="w-full h-[300px] focus:outline-none focus:ring-0 focus:border-0 relative">
        <ResponsiveContainer 
          width="100%" 
          height="100%"
          className="focus:outline-none focus:ring-0 focus:border-0"
        >
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            style={{ outline: "none", border: "none" }}
            className="focus:outline-none focus:ring-0 focus:border-0"
            barCategoryGap="1%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Date",
                position: "bottom",
                offset: 0,
                style: { fill: "#A3A3A3", fontSize: 12 },
              }}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}k`;
                } else {
                  return `$${value}`;
                }
              }}
              label={{
                value: "Portfolio Value",
                angle: -90,
                position: "left",
                offset: 0,
                style: { fill: "#A3A3A3", fontSize: 12 },
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
            <Bar 
              dataKey="value" 
              fill="#7B5FFF"
              name="Portfolio Value"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
