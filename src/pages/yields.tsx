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
import { USD_STRATEGIES, ETH_STRATEGIES, BTC_STRATEGIES } from "@/config/env";
import DepositView from "../components/deposit-view";
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from "../components/ui/header";

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 640;

type AssetType = "All" | "USD" | "ETH" | "BTC";

interface MarketItem {
  id: number;
  name: string;
  ticker: string;
  type: string;
  baseYield: string;
  incentives: Array<{ image: string; name: string; link: string }>;
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

  // Market data state
  const [marketData, setMarketData] = useState<Record<AssetType, MarketItem[]>>({
    All: [],
    ETH: [],
    BTC: [],
    USD: [],
  });
  
  const router = useRouter();

  // Update market data when usdApy or usdTvl changes
  useEffect(() => {
    const newMarketData: Record<AssetType, MarketItem[]> = {
      All: [],
      ETH: [], // Empty for now - no ETH strategies available yet
      BTC: [], // Empty for now - no BTC strategies available yet
      USD: [
        {
          id: 5,
          name: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.displayName,
          ticker: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.name, // syUSD
          type: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.type,
          baseYield: usdApy || USD_STRATEGIES.PERPETUAL_DURATION.STABLE.fallbackApy,
          incentives: (() => {
            const incentives = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.incentives;
            console.log('Raw incentives config:', incentives);
            
            if (!incentives?.enabled || !incentives.points || incentives.points.length === 0) {
              console.log('No incentives enabled or no points');
              return [];
            }
            
            // Return objects with image, name, and link for tooltips and navigation
            const incentiveData = incentives.points.map(point => ({
              image: point.image,
              name: point.name,
              link: point.link || "#" // Use link from config or fallback to "#"
            }));
            console.log('Incentive data:', incentiveData);
            return incentiveData;
          })(),
          tvl: usdTvl || USD_STRATEGIES.PERPETUAL_DURATION.STABLE.tvl,
          description: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.description,
          riskLevel: "Very Low",
          network: USD_STRATEGIES.PERPETUAL_DURATION.STABLE.network,
          contractAddress:
            USD_STRATEGIES.PERPETUAL_DURATION.STABLE.boringVaultAddress,
        },
      ],
    };

    // Fill the "ALL" category
    newMarketData.All = [...newMarketData.ETH, ...newMarketData.BTC, ...newMarketData.USD];
    
    setMarketData(newMarketData);
  }, [usdApy, usdTvl]);

  // Fetch TVL for USD strategy if it's a URL
  useEffect(() => {
    const tvlUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.tvl;
    if (typeof tvlUrl === "string" && tvlUrl.startsWith("http")) {
      fetch(tvlUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
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
          } else {
            console.warn('Unexpected TVL data structure:', data);
            setUsdTvl("N/A");
          }
        })
        .catch((error) => {
          console.error('Error fetching TVL:', error);
          setUsdTvl("N/A");
        });
    } else if (typeof tvlUrl === "string" && !tvlUrl.startsWith("http")) {
      // If tvlUrl is not a URL, use it directly (fallback value)
      setUsdTvl(tvlUrl);
    }
  }, []);

  useEffect(() => {
    const apyUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.apy;
    if (typeof apyUrl === "string" && apyUrl.startsWith("http")) {
      fetch(apyUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const trailingApy = data?.result?.trailing_total_APY;
          if (typeof trailingApy === "number") {
            setUsdApy(`${trailingApy.toFixed(2)}%`);
          } else {
            console.warn('Unexpected APY data structure:', data);
            setUsdApy("N/A");
          }
        })
        .catch((error) => {
          console.error('Error fetching APY:', error);
          setUsdApy(USD_STRATEGIES.PERPETUAL_DURATION.STABLE.fallbackApy || "N/A");
        });
    } else if (typeof apyUrl === "string" && !apyUrl.startsWith("http")) {
      // If apyUrl is not a URL, use it directly (fallback value)
      setUsdApy(apyUrl);
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
        // Handle cases where baseYield might be "N/A" or fallback values
        const aValue = a.baseYield === "N/A" ? 0 : parseFloat(a.baseYield.replace("%", ""));
        const bValue = b.baseYield === "N/A" ? 0 : parseFloat(b.baseYield.replace("%", ""));
        valueA = isNaN(aValue) ? 0 : aValue;
        valueB = isNaN(bValue) ? 0 : bValue;
      } else if (sortColumn === "tvl") {
        // Handle cases where tvl might be "N/A" or fallback values
        const aValue = a.tvl === "N/A" ? 0 : parseFloat(a.tvl.replace("$", "").replace(",", ""));
        const bValue = b.tvl === "N/A" ? 0 : parseFloat(b.tvl.replace("$", "").replace(",", ""));
        valueA = isNaN(aValue) ? 0 : aValue;
        valueB = isNaN(bValue) ? 0 : bValue;
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
    <div className="min-h-screen flex flex-col pt-[52px]">
      <Header onNavigateToDeposit={() => {}}>
        <div className="flex items-center justify-between w-full px-4 sm:px-0">
          <div className="flex items-stretch h-full">
            <div className="flex items-center">
              <div
                className="cursor-pointer"
                onClick={() => {
                  router.push("/");
                }}
              >
                <Image
                  src="/images/logo/logo-desktop.svg"
                  alt="Lucidity Logo"
                  width={80}
                  height={16}
                  priority
                />
              </div>
            </div>
            <div className="w-[1px] bg-[rgba(255,255,255,0.1)] ml-4 hidden sm:block"></div>
            <nav className="hidden md:flex">
              <div className="relative flex">
                <button
                  className="px-8 py-[18px] text-sm transition-colors relative text-[#9C9DA2] hover:text-gray-300"
                  onClick={() => router.push('/earn')}
                >
                  Earn
                </button>
                <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>
                <button
                  className="px-8 py-[18px] text-sm transition-colors relative text-white"
                  onClick={() => router.push('/yields')}
                >
                  Yields
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                </button>
                <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>
                <button
                  className="px-8 py-[18px] text-sm transition-colors relative text-[#9C9DA2] hover:text-gray-300"
                  onClick={() => router.push('/portfolio')}
                >
                  Portfolio
                </button>
              </div>
            </nav>
          </div>
          <div className="flex flex-row gap-2">
            <CustomConnectButton />
          </div>
        </div>
      </Header>
      <main className="flex-1 overflow-y-auto">
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
            <div className="flex min-h-screen text-white overflow-y-auto mt-8 sm:mt-0">
          {/* Left side - 50% */}
          <div className="w-full flex flex-col relative">
            <div className="w-full h-[124px] flex flex-col justify-center items-start relative pl-4 sm:pl-[32px]">
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
            <div className="px-4 sm:px-[32px] mt-[16px]">
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
            <div className="px-4 sm:px-0">
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

          <div className="w-[1px] bg-[rgba(255,255,255,0.1)] hidden sm:block" />

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
        </>
      </main>
    </div>
  );
};

export default MarketsSubpage;
