// components/StrategyDailyYieldChart.tsx
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, ResponsiveContainer
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

export default function StrategyDailyYieldChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://localhost:3001/api/strategy/daily-yield');
        const json = await res.json();

        const raw: RawYield[] = json.data;

        // Group by date
        const grouped: Record<string, ChartDataPoint> = {};

        raw.forEach(({ date, strategy, network, yield: y }) => {
          const d = dayjs(date).format('MMM DD');
          const key = `${network}_${strategy}`;

          if (!grouped[d]) {
            grouped[d] = { date: d };
          }

          if (!grouped[d][key]) {
            grouped[d][key] = 0;
          }

          (grouped[d][key] as number) += y;
        });

        const chartData = Object.values(grouped);
        const uniqueKeys = Array.from(
          new Set(raw.map(r => `${r.network}_${r.strategy}`))
        );
        console.log('Chart data:', chartData);

        setData(chartData);
        setKeys(uniqueKeys);
      } catch (err) {
        console.error('Error loading chart data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading yield data...</div>;

  const colors = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#00c49f',
    '#0088fe',
    '#ff8042',
    '#a28fe6',
    '#f66',
    '#2f9e44'
  ];

  return (
    <div className="w-full h-[300px]">
      <h2 className="text-xl font-semibold mb-4">Strategy Daily Yield</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            tickFormatter={(val) => `${val.toFixed(2)} YLD`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toFixed(4),
              name
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          {/* <Legend /> */}
          {keys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={colors[idx % colors.length]}
              name={key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
