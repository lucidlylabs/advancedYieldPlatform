import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

type ChartDataItem = {
  date: string;
  totalApy: number;
};

async function fetchData(
  period: "daily" | "weekly" | "monthly"
): Promise<ChartDataItem[]> {
  try {
    console.log(`Fetching base APY data for period: ${period}`);
    const apiUrl = `http://localhost:3001/api/syUSD/base-apy?period=${period}`;
    console.log(`API URL: ${apiUrl}`);
    
    const res = await fetch(apiUrl);
    console.log(`API response status: ${res.status}`);
    
    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`);
    }
    
    const rawData = await res.json();
    console.log("Raw API response:", rawData);

    const result: ChartDataItem[] = [];

    for (const date in rawData) {
      const entry = rawData[date];

      // Format date based on period
      let formattedDate: string;
      if (period === "weekly") {
        formattedDate = `Week of ${dayjs(date)
          .startOf("week")
          .format("MMM DD")}`;
      } else if (period === "monthly") {
        formattedDate = dayjs(date).format("MMM YYYY");
      } else {
        formattedDate = dayjs(date).format("MMM DD");
      }

      const formatted: ChartDataItem = {
        date: formattedDate,
        totalApy: entry.totalApy || entry.apy || 0,
      };

      result.push(formatted);
    }
    console.log("Formatted data:", result);
    return result;
  } catch (err) {
    console.error("API failed with error:", err);
    throw err; // Re-throw to be handled by the caller
  }
}

interface BaseApyTotalChartProps {
  // No props needed
}

export default function BaseApyTotalChart({}: BaseApyTotalChartProps) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rawData = await fetchData(period);
        setData(rawData);
      } catch (error) {
        console.error("Error loading base APY data:", error);
        // Set empty data on error
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]); // refetch when period changes

  // Custom tooltip content component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = `${value.toFixed(2)}%`;

      return (
        <div className="bg-[#1C1D2A] border-none p-3 rounded text-sm">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="text-gray-400 text-xs my-1">
            Total Base APY:
          </p>
          <p className="text-white my-0.5">{formattedValue}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 focus:border-0">
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-1 items-center">
            <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">Daily</div>
            <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">Weekly</div>
            <div className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">Monthly</div>
          </div>
        </div>
        
        <div className="w-full h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">Loading base APY data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 focus:border-0">
      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "daily"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "weekly"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              period === "monthly"
                ? "bg-[#7B5FFF] text-white"
                : "bg-[#2A2A3C] text-gray-400 hover:bg-[#3A3A4C]"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="w-full h-[300px] focus:outline-none focus:ring-0 focus:border-0">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none focus:ring-0 focus:border-0">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            style={{ outline: 'none', border: 'none' }}
            className="focus:outline-none focus:ring-0 focus:border-0"
          >
            <defs>
              <linearGradient
                id="colorTotalApy"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#7B5FFF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7B5FFF" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Date", position: "bottom", offset: 0, style: { fill: "#A3A3A3", fontSize: 12 } }}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => `${val.toFixed(1)}%`}
              label={{ value: "Base APY (%)", angle: -90, position: "left", offset: 0, style: { fill: "#A3A3A3", fontSize: 12 } }}
            />
            <Tooltip
              content={<CustomTooltip />}
              labelFormatter={(label: string) => label}
            />
            <Area
              type="monotone"
              dataKey="totalApy"
              stroke="#7B5FFF"
              strokeWidth={2}
              fill="url(#colorTotalApy)"
              name="Total Base APY"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
