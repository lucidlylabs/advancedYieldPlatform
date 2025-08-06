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

  // Custom tooltip content component
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
            const assetName = tokenAddressMap[shortToFullAddress[entry.dataKey]] || entry.dataKey;
            const value = entry.value;
            const formattedValue = value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`;
            return (
              <p key={index} style={{ color: entry.color, margin: "2px 0" }}>
                {`${assetName} ${formattedValue}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
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
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

    useEffect(() => {
      fetchData().then(setData);
    }, []);

    // Initialize selected assets when data is loaded
    useEffect(() => {
      if (data.length > 0) {
        const allKeys = Array.from(
          new Set(
            data.flatMap((item) =>
              Object.keys(item).filter((key) => key !== "date")
            )
          )
        );
        setSelectedAssets(new Set(allKeys));
      }
    }, [data]);

    const handleLegendClick = (entry: any) => {
      const assetKey = entry.dataKey;
      setSelectedAssets(prev => {
        const newSet = new Set(prev);
        if (newSet.has(assetKey)) {
          newSet.delete(assetKey);
        } else {
          newSet.add(assetKey);
        }
        return newSet;
      });
    };

    // Filter data based on selected assets
    const filteredData = data.map(item => {
      const filtered: ChartDataItem = { date: item.date };
      Object.keys(item).forEach(key => {
        if (key === 'date' || selectedAssets.has(key)) {
          filtered[key] = item[key];
        }
      });
      return filtered;
    });
  
    return (
      <div className="p-6 rounded-xl text-white w-full">
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...filteredData].reverse()}
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
                content={<CustomTooltip />}
                labelFormatter={(label: string) => label}
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
    
                  // Only show selected assets in the chart
                  return allKeys
                    .filter(key => selectedAssets.has(key))
                    .map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="a"
                        fill={colors[key] || "#8884d8"}
                        radius={[2, 2, 0, 0]} 
                      />
                    ));
                })()}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom legend to show all assets */}
        {data.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            {(() => {
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
              return allKeys.map(key => {
                const isSelected = selectedAssets.has(key);
                const assetName = tokenAddressMap[shortToFullAddress[key]] || key;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handleLegendClick({ dataKey: key })}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: isSelected ? colors[key] || "#8884d8" : "#666666"
                      }}
                    />
                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                      {isSelected ? assetName : `${assetName} (deselected)`}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>    
    );
  }