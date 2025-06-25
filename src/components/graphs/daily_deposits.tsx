import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface DailyDepositsProps {
  endpoint: string;
}

// Helper to generate colors
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d88884', '#b884d8', '#d884b8',
];

const DailyDeposits: React.FC<DailyDepositsProps> = ({ endpoint }) => {
  const [data, setData] = useState<any[]>([]);
  const [assetKeys, setAssetKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((apiData) => {
        // Transform API data
        const dates = Object.keys(apiData).sort();
        const allAssetKeys = new Set<string>();
        const chartData = dates.map(date => {
          const entry = { date } as any;
          const assets = apiData[date];
          Object.keys(assets).forEach(asset => {
            entry[asset] = Number(assets[asset]);
            allAssetKeys.add(asset);
          });
          return entry;
        });
        setData(chartData);
        setAssetKeys(Array.from(allAssetKeys));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [endpoint]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {assetKeys.map((key, idx) => (
          <Bar key={key} dataKey={key} stackId="a" fill={COLORS[idx % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyDeposits;
