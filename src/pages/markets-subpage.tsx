import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AssetType = "ALL" | "USD" | "ETH" | "BTC";

interface MarketItem {
  id: number;
  name: string;
  type: string;
  baseYield: string;
  incentives: string[];
  tvl: string;
}

// InfoIcon component for tooltips
const InfoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Asset Button Component
const AssetButton: React.FC<{
  asset: AssetType;
  activeAsset: AssetType;
  onClick: (asset: AssetType) => void;
}> = ({ asset, activeAsset, onClick }) => {
  const getIcon = () => {
    switch (asset) {
      case "ALL":
        return "⚪";
      case "USD":
        return "💲";
      case "ETH":
        return "🔷";
      case "BTC":
        return "🟠";
      default:
        return "⚪";
    }
  };

  return (
    <button
      className={cn(
        "rounded-full px-4 py-2 flex items-center gap-2",
        activeAsset === asset ? "bg-blue-600" : "bg-gray-800"
      )}
      onClick={() => onClick(asset)}
    >
      <span>{getIcon()}</span>
      {asset}
    </button>
  );
};

const MarketsSubpage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>("ALL");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Market data
  const marketData: Record<AssetType, MarketItem[]> = {
    ALL: [],
    ETH: [
      {
        id: 1,
        name: "Base Yield ETH",
        type: "eth",
        baseYield: "6.64%",
        incentives: ["eth", "usdc"],
        tvl: "$1,016.96",
      },
      {
        id: 2,
        name: "Incentive Maxi ETH",
        type: "eth",
        baseYield: "23.43%",
        incentives: ["eth"],
        tvl: "$1,403.72",
      },
    ],
    BTC: [
      {
        id: 3,
        name: "Base Yield BTC",
        type: "btc",
        baseYield: "6.64%",
        incentives: ["btc", "usdc"],
        tvl: "$1,016.96",
      },
      {
        id: 4,
        name: "Incentive Maxi BTC",
        type: "btc",
        baseYield: "10.00%",
        incentives: ["btc"],
        tvl: "$450.00",
      },
    ],
    USD: [
      {
        id: 5,
        name: "Stable USD",
        type: "usd",
        baseYield: "25.00%",
        incentives: ["usdc"],
        tvl: "$1,403.72",
      },
      {
        id: 6,
        name: "Incentives USD",
        type: "usd",
        baseYield: "15.20%",
        incentives: ["usdc"],
        tvl: "$320.00",
      },
    ],
  };

  // Fill the "ALL" category
  marketData.ALL = [...marketData.ETH, ...marketData.BTC, ...marketData.USD];

  // Function to get icon based on asset type
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "eth":
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            🔷
          </div>
        );
      case "btc":
        return (
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            🟠
          </div>
        );
      case "usd":
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
            💲
          </div>
        );
      default:
        return null;
    }
  };

  // Incentive icon component
  const IncentiveIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "eth":
        return (
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
            🔷
          </div>
        );
      case "btc":
        return (
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
            🟠
          </div>
        );
      case "usdc":
        return (
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
            💲
          </div>
        );
      default:
        return null;
    }
  };

  // Handler for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort the data based on the selected column and direction
  const getSortedData = () => {
    const dataToSort = [...marketData[selectedAsset]];

    if (!sortColumn) return dataToSort;

    return dataToSort.sort((a, b) => {
      let valueA, valueB;

      if (sortColumn === "baseYield") {
        valueA = parseFloat(a.baseYield);
        valueB = parseFloat(b.baseYield);
      } else if (sortColumn === "tvl") {
        valueA = parseFloat(a.tvl.replace("$", "").replace(",", ""));
        valueB = parseFloat(b.tvl.replace("$", "").replace(",", ""));
      } else if (sortColumn === "name") {
        valueA = a.name;
        valueB = b.name;
      } else {
        valueA = a[sortColumn as keyof MarketItem];
        valueB = b[sortColumn as keyof MarketItem];
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Left side - 50% */}
      <div className="w-1/2 p-8">
        <h1 className="text-3xl font-bold mb-2">Explore Yields</h1>
        <p className="text-gray-400 mb-6">
          Maximize your investment returns and diversify your portfolio. Unlock
          higher earnings with smart yield strategies.
        </p>

        {/* Asset Selection */}
        <div className="flex space-x-4 mb-8">
          <AssetButton
            asset="ALL"
            activeAsset={selectedAsset}
            onClick={setSelectedAsset}
          />
          <AssetButton
            asset="USD"
            activeAsset={selectedAsset}
            onClick={setSelectedAsset}
          />
          <AssetButton
            asset="ETH"
            activeAsset={selectedAsset}
            onClick={setSelectedAsset}
          />
          <AssetButton
            asset="BTC"
            activeAsset={selectedAsset}
            onClick={setSelectedAsset}
          />
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-4 py-4 border-b border-gray-700 text-gray-400 text-sm">
          <div
            className="cursor-pointer flex items-center"
            onClick={() => handleSort("name")}
          >
            Available Yields
            {sortColumn === "name" && (
              <span className="ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </div>
          <div
            className="cursor-pointer flex items-center"
            onClick={() => handleSort("baseYield")}
          >
            Base APY
            {sortColumn === "baseYield" && (
              <span className="ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </div>
          <div>Incentives</div>
          <div
            className="cursor-pointer flex items-center"
            onClick={() => handleSort("tvl")}
          >
            TVL
            {sortColumn === "tvl" && (
              <span className="ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-4 mt-4">
          {getSortedData().map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-4 items-center py-4 border-b border-gray-800 hover:bg-gray-800 rounded-md cursor-pointer transition duration-200"
            >
              <div className="flex items-center">
                {getAssetIcon(item.type)}
                <span>{item.name}</span>
              </div>
              <div>{item.baseYield}</div>
              <div className="flex">
                {item.incentives.map((incentive, index) => (
                  <div key={index} className="mr-1">
                    <IncentiveIcon type={incentive} />
                  </div>
                ))}
              </div>
              <div>{item.tvl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - 50% */}
      <div className="w-1/2 bg-gray-800 p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <img
              src="/api/placeholder/400/300"
              alt="Yield Options Illustration"
              className="mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Select a Yield Option to View Details
          </h2>
          <p className="text-gray-400">
            Discover key insights, performance metrics, and potential returns
            for each yield source.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketsSubpage;
