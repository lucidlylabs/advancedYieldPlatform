import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';

interface PortfolioEntry {
  timestamp: string;
  value: number;
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
          <LineChart data={emptyData} margin={{ top: 20, right: -24, left: 4, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="timestamp" 
              axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 0 }}
              tickLine={false}
              tick={false}            
            />
            <YAxis
              orientation="right"
              domain={[-10, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9C9DA2', fontSize: 14 }}
              tickFormatter={(value) => value === 0 ? '$0' : ''}
              tickCount={3}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#9C9DA2" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
  
        {/* Shadow from center to extreme bottom */}
        <div className="absolute top-36 left-1 right-9 bottom-14 
          bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent 
          pointer-events-none"></div>
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
        const res = await fetch(`http://localhost:3001/api/portfolio-value?userAddress=${userAddress}`);
        const json = await res.json();
        console.log('portfolioData', json.portfolioData);

        if (Array.isArray(json.portfolioData)) {
          const sorted = json.portfolioData
            .sort((a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            .map((entry: any) => ({
              timestamp: dayjs(entry.timestamp).format('MMM DD'),
              value: entry.value,
            }));

          setData(sorted);
          console.log('sorted', sorted);
        } else {
          console.warn('portfolioData is not an array', json.portfolioData);
          setData([]); // fallback to empty
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
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
    <div className="w-full h-96"> 
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis
              orientation="right"
              domain={[0, 'auto']}
              tickFormatter={(value) => {
                const normalized = value / 1e6;
                return `$${(normalized / 1_000_000).toFixed(2)}`;
              }}
            />
          <Legend />
          <Tooltip />
          <Bar dataKey="value" fill="#00E5FF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
