import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
  } from "recharts";
  import { useEffect, useState } from "react";

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

  async function fetchData(): Promise<ChartDataItem[]> {
    try {
      const res = await fetch("http://localhost:3001/api/syUSD/daily-deposits");
      const rawData = await res.json();
  
      const result: ChartDataItem[] = [];
  
      for (const date in rawData) {
        const entry = rawData[date];
        const formatted: ChartDataItem = {
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
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
  
    useEffect(() => {
      fetchData().then(setData);
    }, []);
  
    return (
      <div className="p-6 rounded-xl text-white w-full">
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...data].reverse()}
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
                orientation="right" 
                tick={{ fill: "#A3A3A3", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => {
                  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                  return `$${val}`;
                }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1C1D2A", border: "none" }}
                labelStyle={{ color: "#A3A3A3" }}
                formatter={(value: number) => {
                  if (value >= 1000) return [`$${(value / 1000).toFixed(1)}K`, ""];
                  return [`$${value}`, ""];
                }}
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
    
                  return allKeys.map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={colors[key] || "#8884d8"}
                      radius={[2, 2, 0, 0]} 
                    />
                  ));
                })()}
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: 12 , marginTop: 16 }}
                formatter={(shortAddr: string) =>
                  tokenAddressMap[shortToFullAddress[shortAddr]] || shortAddr
                }
              />
            </BarChart>

          </ResponsiveContainer>
        </div>
      </div>    
    );
  }