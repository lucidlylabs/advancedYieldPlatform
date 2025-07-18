import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  import { useEffect, useState } from "react";
  
  const mockData = [
    {
      date: "Feb 24",
      A: 32,
      B: 24,
      C: 20,
      D: 12,
      E: 8,
    },
    {
      date: "Mar 24",
      A: 18,
      B: 30,
      C: 16,
      D: 25,
      E: 10,
    },
    {
      date: "Apr 24",
      A: 28,
      B: 18,
      C: 22,
      D: 20,
      E: 16,
    },
    {
      date: "May 24",
      A: 40,
      B: 32,
      C: 20,
      D: 15,
      E: 12,
    },
    {
      date: "Jun 24",
      A: 30,
      B: 20,
      C: 28,
      D: 18,
      E: 14,
    },
    {
      date: "Jul 24",
      A: 20,
      B: 10,
      C: 18,
      D: 14,
      E: 12,
    },
    {
      date: "Aug 24",
      A: 26,
      B: 22,
      C: 30,
      D: 18,
      E: 20,
    },
    {
      date: "Sep 24",
      A: 50,
      B: 40,
      C: 32,
      D: 25,
      E: 10,
    },
    {
      date: "Oct 24",
      A: 22,
      B: 16,
      C: 14,
      D: 12,
      E: 10,
    },
    {
      date: "Nov 24",
      A: 35,
      B: 30,
      C: 20,
      D: 22,
      E: 18,
    },
    {
      date: "Dec 24",
      A: 45,
      B: 38,
      C: 32,
      D: 28,
      E: 20,
    },
    {
      date: "Jan 24",
      A: 40,
      B: 30,
      C: 28,
      D: 22,
      E: 16,
    },
  ];
  
  async function fetchData() {
    try {
      const res = await fetch("/api/deposits");
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("API failed, using mock data.");
      return mockData;
    }
  }
  
  export default function TotalDepositsChart() {
    const [data, setData] = useState<typeof mockData>([]);
  
    useEffect(() => {
      fetchData().then(setData);
    }, []);
  
    return (
      <div className="p-6 rounded-xl text-white w-full shadow-xl">
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
                tickFormatter={(val) => `$${val}M`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1C1D2A", border: "none" }}
                labelStyle={{ color: "#A3A3A3" }}
                formatter={(value) => [`$${value}M`, ""]}
              />
              <Bar dataKey="A" stackId="a" fill="#7B5FFF"  />
              <Bar dataKey="B" stackId="a" fill="#5CD6FF"  />
              <Bar dataKey="C" stackId="a" fill="#C3F34A"  />   
              <Bar dataKey="D" stackId="a" fill="#E874FF"  />
              <Bar dataKey="E" stackId="a" fill="#FFD24C" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  