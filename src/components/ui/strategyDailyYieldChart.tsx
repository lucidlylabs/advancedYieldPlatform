// components/StrategyDailyYieldChart.tsx
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

interface RawYield {
  date: string;
  strategy: string; // strategy address
  network: string;
  yield: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

const STRATEGY_NAME_MAP: Record<string, string> = {
  "0x2fa924e8474726dec250eead84f4f34e063acdcc": "PT-sUSDF/USDC SiloV2 (7.5x)",
  "0xa32ba04a547e1c6419d3fcf5bbdb7461b3d19bb1": "PT-iUSD/USDC Morpho (4x)",
  "0xd0bc4920f1b43882b334354ffab23c9e9637b89e": "gauntlet Frontier USDC",
  "0x1ed0a3d7562066c228a0bb3fed738182f03abd01": "RLP/USDC Morpho"
};

const normalizeAddress = (address: string): string => {
  return address.replace(/^ethereum_/i, '').toLowerCase();
};

export default function StrategyDailyYieldChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://localhost:3001/api/strategy/daily-yield');
        const json = await res.json();
  
        const raw: RawYield[] = json.data;
  
        const grouped: Record<string, ChartDataPoint> = {};
        const strategyNames = new Set<string>();

        raw.forEach(({ date, strategy, network, yield: y }) => {
          const d = dayjs(date).format('MMM DD');
          const normalizedStrategy = normalizeAddress(strategy);
          const strategyName = STRATEGY_NAME_MAP[normalizedStrategy] || `${network}_${strategy}`;
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
        
        setData(chartData);
        setKeys(uniqueKeys);
        setSelectedKeys(new Set(uniqueKeys)); // select all initially
      } catch (err) {
        console.error('Error loading chart data:', err);
      } finally {
        setLoading(false);
      }
    }
  
    fetchData();
  }, []);

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

  const filteredData = data.map(item => {
    const filtered: ChartDataPoint = { date: item.date };
    Object.keys(item).forEach(k => {
      if (k === 'date' || selectedKeys.has(k)) {
        filtered[k] = item[k];
      }
    });
    return filtered;
  });

  if (loading) return <div>Loading yield data...</div>;

  const colors = [
    '#4F46E5', '#22C55E', '#F59E0B', '#EF4444',
    '#06B6D4', '#A855F7', '#E11D48', '#0EA5E9',
    '#F97316', '#84CC16'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border shadow-md p-3 rounded text-sm">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ color: item.fill }}>
              {item.name}: <span className="font-medium">{item.value.toFixed(4)} YLD</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full overflow-auto h-[80vh]">
      <h2 className="text-xl font-semibold mb-4">Strategy Daily Yield</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(val) => `${val.toFixed(2)}`} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          {keys.filter(k => selectedKeys.has(k)).map((key, idx) => (
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

      {/* Custom legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {keys.map((key, idx) => {
          const isSelected = selectedKeys.has(key);
          return (
            <div
              key={key}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleLegendClick(key)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isSelected ? colors[idx % colors.length] : '#666666'
                }}
              />
              <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                {isSelected ? key : `${key} (deselected)`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
