import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { MarketsTable } from "@/components/ui/markets-table";
import { YieldDetailsView } from "@/components/yield-details-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

type AssetType = "ALL" | "USD" | "ETH" | "BTC";

interface MarketItem {
  id: number;
  name: string;
  type: string;
  baseYield: string;
  incentives: string[];
  tvl: string;
  description?: string;
  riskLevel?: string;
  network?: string;
  contractAddress?: string;
}

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
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

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
        description:
          "Provides a stable yield through diversified ETH lending protocols with lower risk exposure.",
        riskLevel: "Low",
        network: "Ethereum",
        contractAddress: "0x82...2d",
      },
      {
        id: 2,
        name: "Incentive Maxi ETH",
        type: "eth",
        baseYield: "23.43%",
        incentives: ["eth"],
        tvl: "$1,403.72",
        description:
          "Higher yield strategy combining ETH staking with protocol incentives and token rewards.",
        riskLevel: "Medium",
        network: "Ethereum",
        contractAddress: "0x74...5e",
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
        description:
          "Generates consistent returns through secure BTC lending across multiple platforms.",
        riskLevel: "Low",
        network: "Bitcoin",
        contractAddress: "0x91...3f",
      },
      {
        id: 4,
        name: "Incentive Maxi BTC",
        type: "btc",
        baseYield: "10.00%",
        incentives: ["btc"],
        tvl: "$450.00",
        description:
          "Maximizes BTC yield through a combination of lending and liquidity provision with token incentives.",
        riskLevel: "Medium",
        network: "Bitcoin",
        contractAddress: "0x47...8a",
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
        description:
          "Conservative stablecoin strategy focused on capital preservation with consistent returns.",
        riskLevel: "Very Low",
        network: "Ethereum",
        contractAddress: "0x33...9c",
      },
      {
        id: 6,
        name: "Incentives USD",
        type: "usd",
        baseYield: "15.20%",
        incentives: ["usdc"],
        tvl: "$320.00",
        description:
          "Enhanced stablecoin yield through protocol incentives and optimized position management.",
        riskLevel: "Low",
        network: "Ethereum",
        contractAddress: "0x59...4d",
      },
    ],
  };

  // Fill the "ALL" category
  marketData.ALL = [...marketData.ETH, ...marketData.BTC, ...marketData.USD];

  // Handler for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handler for row clicks
  const handleRowClick = (item: MarketItem) => {
    setSelectedItem(item);
  };

  // Get sorted data
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

      if (valueA && valueB) {
        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Calculate the selected item's position in the current list
  const getSelectedItemPosition = () => {
    if (!selectedItem) return 0;
    const currentData = getSortedData();
    return currentData.findIndex((item) => item.id === selectedItem.id);
  };

  return (
    <div className="flex min-h-screen text-white">
      {/* Left side - 50% */}
      <div className="w-[757px] flex flex-col items-start gap-2">
        <div className="w-[757px] h-[124px] flex flex-col justify-center items-start gap-[10px] flex-shrink-0 relative">
          <div 
            className="absolute inset-0 bg-[url('/images/background/earn-page-heading-bg.svg')] bg-no-repeat bg-cover"
            style={{ height: '100%' }}
          />
          <div className="relative z-10 flex flex-col items-start gap-[10px] pl-[25px]">
            <div className="text-[#D7E3EF] font-inter text-[16px] font-semibold leading-[20px]">
              Explore Yields
            </div>
            <p className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-[20px]">
              Maximize your investment returns and diversify your portfolio. <br />
              Unlock higher earnings with smart yield strategies.
            </p>
          </div>
        </div>

        {/* Asset Selection */}
        <div className="flex">
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

        {/* Market Table */}
        <MarketsTable
          data={getSortedData()}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={handleRowClick}
          selectedItemId={selectedItem?.id}
        />
      </div>

      {/* Divider */}
      <div className="w-[1px] relative">
        {selectedItem ? (
          <>
            {/* Top part of divider */}
            <div
              className="absolute w-[1px] bg-[rgba(255,255,255,0.1)]"
              style={{
                top: 0,
                height: `${240 + getSelectedItemPosition() * 64}px`, // 240px header + table header, 64px row height
              }}
            />
            {/* Bottom part of divider */}
            <div
              className="absolute w-[1px] bg-[rgba(255,255,255,0.1)]"
              style={{
                top: `${240 + (getSelectedItemPosition() + 1) * 64}px`,
                bottom: 0,
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 w-[1px] bg-[rgba(255,255,255,0.1)]" />
        )}
      </div>

      {/* Right side - 50% */}
      <div className="w-1/2">
        {selectedItem ? (
          <YieldDetailsView
            name={selectedItem.name}
            tvl={selectedItem.tvl}
            baseApy={selectedItem.baseYield}
            contractAddress={selectedItem.contractAddress}
            network={selectedItem.network}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md text-center flex flex-col items-center justify-center">
              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src="/images/background/yields-page-bg.svg"
                    alt="Yields Background"
                    width={188}
                    height={140}
                    priority
                  />
                </div>
              </div>
              <h2 className="text-[20px] font-semibold text-[#D7E3EF] font-inter leading-normal mt-8">
                Select a Yield Option to View Details
              </h2>
              <p className="text-[#9C9DA2] text-center font-inter text-[14px] font-normal leading-[19.2px] mt-2">
                Discover key insights, performance metrics, and <br />
                potential returns for each yield source.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketsSubpage;
