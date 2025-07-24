import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const shareHoldingsMock = [
  { date: "Feb 24", shares: 100 },
  { date: "Mar 24", shares: 120 },
  { date: "Apr 24", shares: 130 },
  { date: "May 24", shares: 150 },
  { date: "Jun 24", shares: 160 },
  { date: "Jul 24", shares: 170 },
  { date: "Aug 24", shares: 180 },
];

export default function PortfolioChart() {
  const [portfolioData, setPortfolioData] = useState<{ date: string; usd: number; shares: number }[]>([]);

  const fetchHoldingsFromGraphQL = async () => {
    const res = await axios.post("http://localhost:42069/graphql", {
      query: `
        query {
          dailyBalances(id: "2025-07-21-base") {
            id
            date
            chain
            netChange
            cumulative
          }
        }
      `,
    });
    console.log("GraphQL response:", res);
  
    return res.data.data.userHoldings;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000); 
    return date.toLocaleString("en-US", { month: "short", year: "2-digit" }); 
  };

  useEffect(() => {
    const fetchPricesAndCompute = async () => {
      try {
        const res = await axios.get(
          "https://api.lucidly.finance/services/exchange_rates?vaultAddress=0x279CAD277447965AF3d24a78197aad1B02a2c589"
        );

        const latestPrice = parseFloat(res.data.result); 
        console.log("Fetched priceInUsd:", latestPrice);

        const holdings = await fetchHoldingsFromGraphQL();

         const combined = holdings.map((entry: any) => ({
          date: formatDate(Number(entry.timestamp)),
          usd: Number((parseFloat(entry.amount) * latestPrice).toFixed(2)),
          shares: parseFloat(entry.amount),
        }));

        setPortfolioData(combined);
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    };

    fetchPricesAndCompute();
  }, []);

  return (
    <div className="w-full h-[400px] bg-[#0b0f1a] p-4 rounded-xl shadow-lg mb-12">
      <h2 className="text-white text-xl font-semibold mb-4">Total Portfolio Value</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={portfolioData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" />
          <XAxis dataKey="date" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
          <Bar dataKey="usd" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
