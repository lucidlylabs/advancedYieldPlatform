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
    const getAssetDetails = () => {
        switch (asset) {
            case "ALL":
                return {
                    icon: "/images/icons/selector-all.svg",
                };
            case "USD":
                return {
                    icon: "/images/icons/selector-usd.svg",
                };
            case "ETH":
                return {
                    icon: "/images/icons/selector-eth.svg",
                };
            case "BTC":
                return {
                    icon: "/images/icons/selector-btc.svg",
                };
        }
    };

    const { icon } = getAssetDetails() || {};

    return (
        <button
            className={cn(
                "flex items-center gap-[4px] py-2 pb-[8px] transition-all duration-200 mr-[24px] last:mr-0 relative",
                activeAsset === asset ? "opacity-100" : "opacity-50",
                "hover:opacity-100"
            )}
            onClick={() => onClick(asset)}
        >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden">
                <Image
                    src={icon}
                    alt={`${asset} icon`}
                    width={16}
                    height={16}
                    className="object-contain rounded-full"
                />
            </div>
            <span className="text-white text-[12px] font-normal leading-[16px]">
                {asset}
            </span>
            {activeAsset === asset && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white" />
            )}
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
    ETH: [],
    BTC: [],
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
      }
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
            <div className="w-[757px] flex flex-col relative">
                <div className="w-[757px] h-[124px] flex flex-col justify-center items-start relative pl-[32px]">
                    <div
                        className="absolute inset-0 bg-[url('/images/background/earn-page-heading-bg.svg')] bg-no-repeat bg-cover"
                        style={{ height: "100%" }}
                    />
                    <div className="relative z-10 flex flex-col items-start gap-[10px]">
                        <div className="text-[#D7E3EF] text-[18px] font-semibold leading-[20px]">
                            Explore Yields
                        </div>
                        <p className="text-[#9C9DA2] text-[15px] font-normal leading-[20px]">
                            Farm Everything. Here.
                        </p>
                    </div>
                </div>

                <div className="pl-[32px] mt-[16px]">
                    <div className="flex border-b-[0.5px] text-[14px] border-[rgba(255,255,255,0.15)] pr-6">
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
                </div>

                <div>
                    <MarketsTable
                        data={getSortedData()}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        onRowClick={handleRowClick}
                        selectedItemId={selectedItem?.id}
                    />
                </div>
                {selectedItem && (
                    <div
                        className="absolute right-0 w-[1px] h-[60px] bg-[#0E1117]"
                        style={{
                            top: `${124 +
                                48 +
                                getSortedData().findIndex(
                                    (item) => item.id === selectedItem.id
                                ) *
                                60 +
                                60
                                }px`,
                        }}
                    />
                )}
            </div>

            <div className="w-[1px] bg-[rgba(255,255,255,0.1)]" />

            <div className="w-1/2 ml-[30px]">
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
                            <h2 className="text-[20px] font-semibold text-[#D7E3EF]  leading-normal mt-8">
                                Select a Yield Option to View Details
                            </h2>
                            <p className="text-[#9C9DA2] text-center text-[14px] font-normal leading-[19.2px] mt-2">
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
