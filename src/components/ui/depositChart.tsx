import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  import { useEffect, useState } from "react";
  
  const formatAddress = (addr: string) =>
    addr.slice(0, 6) + "..." + addr.slice(-4);

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
          <BarChart data={data}>
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
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1C1D2A", border: "none" }}
              labelStyle={{ color: "#A3A3A3" }}
              formatter={(value) => [`$${value}`, ""]} 
            />
            {data.length > 0 && (() => {
              const allKeys = Array.from(
                new Set(
                  data.flatMap((item) => Object.keys(item).filter((key) => key !== "date"))
                )
              );

              const colors = {
                [allKeys[0]]: "#7B5FFF", 
                [allKeys[1]]: "#5CD6FF", 
                [allKeys[2]]: "#C3F34A", 
              };

              return allKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={colors[key] || "#8884d8"} 
                />
              ));
            })()}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    );
  }