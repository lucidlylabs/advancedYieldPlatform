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
import { CommonTooltip } from "../ui/tooltip";

const tokenAddressMap: Record<string, string> = {
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "USDC",
  "0x820c137fa70c8691f0e44dc420a5e53c168921dc": "USDS",
  "0x5875eEE11Cf8398102FdAd704C9E96607675467a": "sUSDS",
};

const formatAddress = (addr: string) =>
  addr.slice(0, 6) + "..." + addr.slice(-4);

const shortToFullAddress: Record<string, string> = Object.fromEntries(
  Object.entries(tokenAddressMap).map(([full, name]) => [
    formatAddress(full),
    full,
  ])
);

type ChartDataItem = {
  date: string;
  [shortAddress: string]: number | string;
};

type CumulativeDataItem = {
  date: string;
  totalCumulative: number;
};

async function fetchData(
  period: "daily" | "weekly" | "monthly",
  strategyType: "USD" | "BTC" | "ETH" = "USD"
): Promise<ChartDataItem[]> {
  try {
    // For syBTC, if no endpoint is available, return empty data
    if (strategyType === "BTC") {
      console.log("syBTC deposit data not available");
      return [];
    }

    console.log(`Fetching deposit data for period: ${period}, strategy: ${strategyType}`);
    const strategyName = strategyType === "USD" ? "syUSD" : strategyType === "BTC" ? "syBTC" : "syETH";
    const apiUrl = `https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/${strategyName}/deposits?period=${period}`;
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
    console.error("API failed with error:", err);
    throw err; // Re-throw to be handled by the caller
  }
}

interface DepositBarChartProps {
  strategyType?: "USD" | "BTC" | "ETH";
}

export default function TotalDepositsChart({ strategyType = "USD" }: DepositBarChartProps) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeDataItem[]>(
    []
  );
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only show loading on initial load
        if (initialLoading) {
          setLoading(true);
        }
        const rawData = await fetchData(period, strategyType);
        setData(rawData);

        // Calculate cumulative data for all assets combined
        if (rawData.length > 0) {
          // Sort data chronologically for proper cumulative calculation
          const sortedData = [...rawData].sort((a, b) => {
            const dateA =
              period === "weekly"
                ? dayjs(a.date.replace("Week of ", "")).valueOf()
                : period === "monthly"
                ? dayjs(a.date).valueOf()
                : dayjs(a.date).valueOf();
            const dateB =
              period === "weekly"
                ? dayjs(b.date.replace("Week of ", "")).valueOf()
                : period === "monthly"
                ? dayjs(b.date).valueOf()
                : dayjs(b.date).valueOf();
            return dateA - dateB;
          });

          const allKeys = Array.from(
            new Set(
              sortedData.flatMap((item) =>
                Object.keys(item).filter((key) => key !== "date")
              )
            )
          );

          let runningTotal = 0;
          const cumulativeData: CumulativeDataItem[] = [];

          sortedData.forEach((dataPoint) => {
            // Sum all assets for this period
            let periodTotal = 0;
            allKeys.forEach((key) => {
              const periodValue = (dataPoint[key] as number) || 0;
              periodTotal += periodValue;
            });

            // Add to running total
            runningTotal += periodTotal;

            cumulativeData.push({
              date: dataPoint.date,
              totalCumulative: runningTotal,
            });
          });

          setCumulativeData(cumulativeData);
        } else {
          // If no data, set empty cumulative data
          setCumulativeData([]);
        }
      } catch (error) {
        console.error("Error loading deposit data:", error);
        // Set empty data on error
        setData([]);
        setCumulativeData([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    loadData();
  }, [period, initialLoading, strategyType]); // refetch when period or strategy changes

  if (initialLoading && loading) {
    return (
      <div className="rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
        <div className="w-full h-[300px] px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-400 text-sm">Loading deposit data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state for syBTC
  if (strategyType === "BTC" && (data.length === 0 || cumulativeData.length === 0)) {
    return (
      <div className="pt-2 pl-6 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
        <div className="w-full h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm">Deposit data not available for syBTC</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-6 rounded-xl text-white w-full max-h-[600px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mb-12 [&_svg]:outline-none [&_svg]:border-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-0">
      <div className="w-full h-[300px] focus:outline-none focus:ring-0 focus:border-0 relative">
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="focus:outline-none focus:ring-0 focus:border-0"
        >
          <AreaChart
            data={cumulativeData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            style={{ outline: "none", border: "none" }}
            className="focus:outline-none focus:ring-0 focus:border-0"
          >
            <defs>
              <linearGradient
                id="colorTotalCumulative"
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
              label={{
                value: "Time",
                position: "bottom",
                offset: 0,
                style: { fill: "#A3A3A3", fontSize: 12 },
              }}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => {
                if (val >= 1000000) {
                  return `$${(val / 1000000).toFixed(1)}M`;
                } else if (val >= 1000) {
                  return `$${(val / 1000).toFixed(0)}k`;
                } else {
                  return `$${val}`;
                }
              }}
              label={{
                value: "TVL in Dollars",
                angle: -90,
                position: "left",
                offset: 0,
                style: { fill: "#A3A3A3", fontSize: 12 },
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <CommonTooltip
                  active={active}
                  payload={payload}
                  label={String(label)}
                  title={String(label)}
                  showTotal={false}
                  showColoredCircles={false}
                  customContent={
                    active && payload && payload.length ? (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 flex-1">
                            Total Cumulative Deposits:
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            ${Number(payload[0].value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ) : null
                  }
                />
              )}
              labelFormatter={(label: string) => label}
            />
            <Area
              type="monotone"
              dataKey="totalCumulative"
              stroke="#7B5FFF"
              strokeWidth={2}
              fill="url(#colorTotalCumulative)"
              name="Total Cumulative Deposits"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
