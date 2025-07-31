import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
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

export default function PortfolioChart({ userAddress }: { userAddress: string }) {
  const [data, setData] = useState<PortfolioEntry[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/portfolio?userAddress=${userAddress}`);
        const json = await res.json();

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
      }
    }
    fetchData();
  }, [userAddress]);

  return (
    <div className="w-full h-96"> 
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis orientation="right" domain={[0, 'auto']} />
          <Tooltip />
          <Bar dataKey="value" fill="#00E5FF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
