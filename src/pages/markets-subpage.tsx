import React, { useState, useEffect } from "react";
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
import { useRouter } from "next/router";
import { USD_STRATEGIES } from "@/config/env";
import DepositView from "../components/deposit-view";

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 640;

type AssetType = "All" | "USD" | "ETH" | "BTC";

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
  disabled?: boolean;
}> = ({ asset, activeAsset, onClick, disabled = false }) => {
  const getAssetDetails = () => {
    switch (asset) {
      case "All":
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
        "flex items-center gap-[2px] py-2 px-2 pb-[8px] transition-all duration-200 relative",
        activeAsset === asset ? "opacity-100" : "opacity-50",
        "hover:opacity-100",
        disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer"
      )}
      onClick={() => {
        if (!disabled) onClick(asset);
      }}
    >
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden mb-2">
        <Image
          src={icon}
          alt={`${asset} icon`}
          width={16}
          height={16}
          className="object-contain rounded-full"
        />
      </div>
      <span className="text-white font-inter text-[12px] font-normal leading-[16px] mb-2">
        {asset}
      </span>
      {activeAsset === asset && (
        <div className="absolute bottom-[-1px] left-0 right-0 h-[0.5px] bg-white" />
      )}
    </button>
  );
};

const MarketsSubpage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>("All");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [showDepositView, setShowDepositView] = useState(false);
  const [usdTvl, setUsdTvl] = useState<string | null>(null);
  const [usdApy, setUsdApy] = useState<string | null>(null);

  // Market data
  const marketData: Record<AssetType, MarketItem[]> = {
    All: [],
    ETH: [],
    BTC: [],
    USD: [
      {
        id: 5,
        name: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.name,
        type: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.type,
        baseYield: usdApy
          ? usdApy
          : USD_STRATEGIES.PERPETUAL_DURATION.STABLE.apy,
        incentives: [USD_STRATEGIES.PERPETUAL_DURATION.STABLE.incentives],
        tvl: usdTvl ? usdTvl : USD_STRATEGIES.PERPETUAL_DURATION.STABLE.tvl,
        description: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.description,
        riskLevel: "Very Low",
        network: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.network,
        contractAddress:
          USD_STRATEGIES.PERPETUAL_DURATION.STABLE.boringVaultAddress,
      },
    ],
  };
  const router = useRouter();

  // Fill the "ALL" category
  marketData.All = [...marketData.ETH, ...marketData.BTC, ...marketData.USD];

  // Fetch TVL for USD strategy if it's a URL
  useEffect(() => {
    const tvlUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.tvl;
    if (typeof tvlUrl === "string" && tvlUrl.startsWith("http")) {
      fetch(tvlUrl)
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.result === "number") {
            setUsdTvl(
              data.result.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
              })
            );
          }
        })
        .catch(() => setUsdTvl(null));
    }
  }, []);

  useEffect(() => {
    const apyUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.apy;
    if (typeof apyUrl === "string" && apyUrl.startsWith("http")) {
      fetch(apyUrl)
        .then((res) => res.json())
        .then((data) => {
          const trailingApy = data?.result?.trailing_total_APY;
          if (typeof trailingApy === "number") {
            setUsdApy(`${trailingApy.toFixed(2)}%`);
          }
        })
        .catch(() => setUsdApy(null));
    }
  }, []);

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
    console.log("Row clicked:", item);
    if (isMobile()) {
      const sortedData = getSortedData();
      router.push({
        pathname: `/yield/${item.id}`,
        query: {
          name: item.name,
          tvl: item.tvl,
          baseApy: item.baseYield,
          contractAddress: item.contractAddress || "",
          network: item.network || "",
          data: encodeURIComponent(JSON.stringify(sortedData)),
        },
      });
    } else {
      setSelectedItem(item);
    }
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

  function handleOpenDepositView() {
    setShowDepositView(true);
  }

  function handleCloseDepositView() {
    setShowDepositView(false);
  }

  return (
    <>
      {showDepositView ? (
        <DepositView
          selectedAsset="USD"
          duration="PERPETUAL_DURATION"
          strategy="stable"
          apy="4.5%"
          onBack={() => setShowDepositView(false)}
          onReset={() => setShowDepositView(false)}
        />
      ) : (
        <div className="flex min-h-screen text-white">
          {/* Left side - 50% */}
          <div className="w-full flex flex-col relative">
            <div className="w-full h-[124px] flex flex-col justify-center items-start relative pl-[32px]">
              <div
                className="absolute inset-0 bg-[url('/images/background/earn-page-heading-bg.svg')] bg-no-repeat bg-cover"
                style={{ height: "100%" }}
              />
              <div className="relative z-10 flex flex-col items-start gap-[10px]">
                <div className="text-[#D7E3EF] font-inter text-[16px] font-semibold leading-[20px]">
                  Explore Yields
                </div>
                <p className="text-[#9C9DA2] font-inter text-[12px] font-regular leading-[20px]">
                  Farm everything here
                </p>
              </div>
            </div>

            {/* Asset Selection */}
            <div className="px-[32px] mt-[16px]">
              <div className="grid grid-cols-4 gap-3 sm:flex sm:pr-6">
                <AssetButton
                  asset="All"
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
                  disabled
                />
                <AssetButton
                  asset="BTC"
                  activeAsset={selectedAsset}
                  onClick={setSelectedAsset}
                  disabled
                />
              </div>
            </div>

            {/* Market Table */}
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
          </div>

          <div className="w-[1px] bg-[rgba(255,255,255,0.1)]" />

          {/* Right side - 50% */}
          <div className="w-full hidden sm:block pr-6">
            {selectedItem ? (
              <YieldDetailsView
                name={selectedItem.name}
                tvl={selectedItem.tvl}
                baseApy={selectedItem.baseYield}
                contractAddress={selectedItem.contractAddress}
                network={selectedItem.network}
                data={getSortedData()}
                onOpenDepositView={handleOpenDepositView}
                // hasRealData={false}
                // fullContractAddress={USD_STRATEGIES.PERPETUAL_DURATION.STABLE.boringVaultAddress}
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
      )}
      ;
    </>
  );
};

export default MarketsSubpage;
