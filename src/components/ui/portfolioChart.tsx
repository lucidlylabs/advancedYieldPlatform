import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const dummyData = [
  { date: "Feb 24", eth: 10, usd: 5 },
  { date: "Mar 24", eth: 14, usd: 6 },
  { date: "Apr 24", eth: 18, usd: 7 },
  { date: "May 24", eth: 22, usd: 9 },
  { date: "Jun 24", eth: 25, usd: 11 },
  { date: "Jul 24", eth: 30, usd: 13 },
  { date: "Aug 24", eth: 35, usd: 15 },
];

export default function PortfolioChart() {
  return (
    <div className="w-full h-[400px] bg-[#0b0f1a] p-4 rounded-xl shadow-lg mb-12">
      <h2 className="text-white text-xl font-semibold mb-4">Total Portfolio Value</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dummyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" />
          <XAxis dataKey="date" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
          <Bar dataKey="usd" stackId="a" fill="#06b6d4" />
          <Bar dataKey="eth" stackId="a" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
