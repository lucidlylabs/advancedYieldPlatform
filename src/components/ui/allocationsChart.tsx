import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import dayjs from 'dayjs';

interface StrategyAllocation {
  strategy: string;
  network: string;
  tvl: number;
  allocationPercentage: number;
}

interface DailyAllocation {
  date: string;
  totalTvl: number;
  strategies: StrategyAllocation[];
}

interface ChartDataPoint {
  date: string;
  [strategyKey: string]: string | number;
  [strategyKeyTvl: string]: string | number;
}

const STRATEGY_NAME_MAP: Record<string, string> = {
  "0x2fa924e8474726dec250eead84f4f34e063acdcc": "PT-sUSDF/USDC SiloV2",
  "0xa32ba04a547e1c6419d3fcf5bbdb7461b3d19bb1": "PT-iUSD/USDC Morpho",
  "0x1ed0a3d7562066c228a0bb3fed738182f03abd01": "RLP/USDC Morpho",
  "0xd0bc4920f1b43882b334354ffab23c9e9637b89e": "Gauntlet Frontier USDC",
  "0x34a06c87817ec6683bc1788dbc9aa4038900ea14": "Strategy 5",
  "0x914f1e34cd70c1d59392e577d58fc2ddaaedaf86": "Strategy 6"
};

const normalizeAddress = (address: string): string => {
  return address.toLowerCase();
};

export default function AllocationChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://localhost:3001/api/allocation/daily-allocation');
        const json = await res.json();
  
        const raw: DailyAllocation[] = json.data;
  
        const grouped: Record<string, ChartDataPoint> = {};
        const strategyNames = new Set<string>();

        raw.forEach(({ date, strategies }) => {
          const d = dayjs(date).format('MMM DD');
          
          if (!grouped[d]) {
            grouped[d] = { date: d };
          }
          
          strategies.forEach(({ strategy, allocationPercentage, tvl }) => {
            const normalizedStrategy = normalizeAddress(strategy);
            const strategyName = STRATEGY_NAME_MAP[normalizedStrategy] || `Strategy ${strategy.slice(0, 6)}`;
            strategyNames.add(strategyName);
            
            grouped[d][strategyName] = allocationPercentage;
            grouped[d][`${strategyName}_tvl`] = tvl;
          });
        });
  
        const chartData = Object.values(grouped);
        const uniqueKeys = Array.from(strategyNames);
        
        setData(chartData);
        setKeys(uniqueKeys);
        setSelectedKeys(new Set(uniqueKeys)); // select all initially
      } catch (err) {
        console.error('Error loading allocation data:', err);
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
        // Also include the corresponding TVL value
        if (selectedKeys.has(k)) {
          const tvlKey = `${k}_tvl`;
          if (item[tvlKey] !== undefined) {
            filtered[tvlKey] = item[tvlKey];
          }
        }
      }
    });
    return filtered;
  });

  if (loading) return <div className="p-6 rounded-xl text-white w-full">Loading allocation data...</div>;

  const colors = [
    '#7B5FFF', // violet
    '#5CD6FF', // cyan
    '#C3F34A', // lime
    '#FF6B6B', // red
    '#4ECDC4', // teal
    '#45B7D1', // blue
    '#96CEB4', // green
    '#FFEAA7', // yellow
    '#DDA0DD', // plum
    '#98D8C8'  // mint
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: "#1C1D2A",
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px"
        }}>
          <p style={{ color: "#A3A3A3", margin: "0 0 4px 0" }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            const strategyName = entry.name;
            const percentage = entry.value;
            const tvlKey = `${strategyName}_tvl`;
            const tvlValue = entry.payload[tvlKey];
            
            let formattedTvl = "N/A";
            if (tvlValue !== undefined && tvlValue !== null) {
              const numValue = Number(tvlValue);
              if (!isNaN(numValue)) {
                formattedTvl = numValue >= 1000 ? `$${(numValue / 1000).toFixed(1)}K` : `$${numValue.toFixed(0)}`;
              }
            }
            
            return (
              <p key={index} style={{ color: entry.fill, margin: "2px 0" }}>
                {`${strategyName}: ${percentage.toFixed(2)}% (${formattedTvl})`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-xl text-white w-full">
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={[...filteredData].reverse()}
            margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
            stackOffset="expand"
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
              orientation="right" 
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              labelFormatter={(label: string) => label}
            />
            {keys.filter(k => selectedKeys.has(k)).map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.8}
                name={key}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom legend */}
      {data.length > 0 && (
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
                    backgroundColor: isSelected ? colors[idx % colors.length] : "#666666"
                  }}
                />
                <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {isSelected ? key : `${key} (deselected)`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}