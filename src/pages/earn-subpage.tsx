import React, { useState, useEffect } from "react";
import { CustomCard } from "@/components/ui/card";
import DepositView from "@/components/deposit-view";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import { useRouter } from "next/router";

type DurationType = "30_DAYS" | "60_DAYS" | "180_DAYS" | "PERPETUAL_DURATION";
type StrategyType = "STABLE" | "INCENTIVE";

interface TokenConfig {
  name: string;
  contract: string;
  decimal: number;
  image: string;
}

interface NetworkConfig {
  tokens: Array<{
    name: string;
    contract: string;
    decimal: number;
    image: string;
  }>;
  rpc: string;
}

interface BaseStrategyConfig {
  network: string;
  contract: string;
  boringVaultAddress: string;
  solverAddress: string;
  shareAddress: string;
  shareAddress_token_decimal: number;
  rateProvider: string;
  base: NetworkConfig;
  ethereum: NetworkConfig;
  arbitrum: NetworkConfig;
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc: string;
  show_cap: boolean;
  filled_cap: string;
  cap_limit: string;
}

interface IncentiveStrategyConfig {
  network: string;
  comingSoon: boolean;
  contract: string;
  deposit_token: string;
  deposit_token_contract: string;
  tvl: string;
  rpc: string;
  description: string;
  apy: string;
  incentives: string;
}

interface StrategyDuration {
  STABLE: BaseStrategyConfig;
  INCENTIVE: IncentiveStrategyConfig;
}

interface StrategyAsset {
  [key: string]: StrategyDuration;
}

interface SelectedAsset {
  asset: string;
  duration: DurationType;
}

interface SelectedStrategy {
  type: "stable" | "incentive";
  asset: string;
  duration: DurationType;
  apy: string;
}

type AssetType = "USD" | "ETH" | "BTC";

interface StrategyInfo {
  description: string;
  apy: {
    value: string;
    info: string;
  };
  comingSoon?: boolean;
}

interface StrategyData {
  stable: Record<AssetType, StrategyInfo>;
  incentives: Record<AssetType, StrategyInfo>;
}

interface YieldSubpageProps {
  depositParams?: {
    asset: string;
    duration: string;
    strategy: string;
  } | null;
}

const getStrategyInfo = (duration: DurationType): StrategyData => {
  const getAssetStrategies = (asset: AssetType) => {
    const strategies: Record<
      AssetType,
      Partial<Record<DurationType, StrategyDuration>>
    > = {
      USD: USD_STRATEGIES as unknown as Partial<
        Record<DurationType, StrategyDuration>
      >,
      BTC: BTC_STRATEGIES as unknown as Partial<
        Record<DurationType, StrategyDuration>
      >,
      ETH: ETH_STRATEGIES as unknown as Partial<
        Record<DurationType, StrategyDuration>
      >,
    };

    const strategy = strategies[asset][duration];

    if (!strategy) {
      // console.error(
      //   `No strategy found for ${asset} with duration ${duration}`
      // );
      return {
        stable: {
          description: "Strategy not available",
          apy: {
            value: "0%",
            info: "-",
          },
        },
        incentives: {
          description: "Strategy not available",
          apy: {
            value: "0%",
            info: "-",
          },
          comingSoon: true,
        },
      };
    }

    return {
      stable: {
        description: strategy.STABLE.description,
        apy: {
          value: strategy.STABLE.apy,
          info: strategy.STABLE.incentives,
        },
      },
      incentives: {
        description: strategy.INCENTIVE.description,
        apy: {
          value: strategy.INCENTIVE.apy,
          info: strategy.INCENTIVE.incentives,
        },
        comingSoon: strategy.INCENTIVE.comingSoon,
      },
    };
  };

  return {
    stable: {
      USD: getAssetStrategies("USD").stable,
      ETH: getAssetStrategies("ETH").stable,
      BTC: getAssetStrategies("BTC").stable,
    },
    incentives: {
      USD: getAssetStrategies("USD").incentives,
      ETH: getAssetStrategies("ETH").incentives,
      BTC: getAssetStrategies("BTC").incentives,
    },
  };
};

const YieldSubpage: React.FC<YieldSubpageProps> = ({ depositParams }) => {
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(
    null
  );
  const [selectedStrategy, setSelectedStrategy] =
    useState<SelectedStrategy | null>(null);
  const [usdApy, setUsdApy] = useState<string | null>(null);

  const router = useRouter();

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

  useEffect(() => {
    if (depositParams) {
      const apy = getStrategyInfo(depositParams.duration as DurationType)[
        depositParams.strategy === "stable" ? "stable" : "incentives"
      ][depositParams.asset as AssetType].apy.value;

      setSelectedAsset({
        asset: depositParams.asset,
        duration: depositParams.duration as DurationType,
      });

      setSelectedStrategy({
        type: depositParams.strategy as "stable" | "incentive",
        asset: depositParams.asset,
        duration: depositParams.duration as DurationType,
        apy,
      });
    }
  }, [depositParams]);

  const handleDurationSelect = (asset: string, duration: DurationType) => {
    setSelectedAsset({ asset, duration });
  };

  const handleStrategySelect = (
    type: "stable" | "incentive",
    asset: AssetType
  ) => {
    if (selectedAsset) {
      setSelectedStrategy({
        type,
        asset: selectedAsset.asset,
        duration: selectedAsset.duration,
        apy: getStrategyInfo(selectedAsset.duration)[
          type === "stable" ? "stable" : "incentives"
        ][asset].apy.value,
      });
    }
  };

  const handleReset = () => {
    setSelectedAsset(null);
    setSelectedStrategy(null);
  };

  console.log("Selected Strategy:", selectedStrategy);

  // Always render the main content, assuming verification is handled by parent
  return (
    <div
      className="min-h-[calc(100vh)] relative w-full"
      style={{
        backgroundImage: "url('/images/background/earn-page-bg.svg')",
        backgroundPosition: "center bottom -50px",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% auto",
        backgroundAttachment: "fixed",
      }}
    >
      {selectedStrategy ? (
        <DepositView
          selectedAsset={selectedStrategy.asset}
          duration={selectedStrategy.duration}
          strategy={selectedStrategy.type}
          apy={usdApy || "--"}
          onBack={() => setSelectedStrategy(null)}
          onReset={handleReset}
        />
      ) : selectedAsset ? (
        <div className="flex flex-col gap-6 items-center pt-[8vh]">
          <h1 className="text-[20px] sm:text-[40px] font-bold">
            Select a Yield Source
          </h1>
          <div className="flex flex-col items-center">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch">
              <div className="flex-shrink-0 w-[264px]">
                <CustomCard
                  heading={selectedAsset.asset as AssetType}
                  imageSrc={`/images/icons/card-${(
                    selectedAsset.asset as AssetType
                  ).toLowerCase()}.svg`}
                  hoverColor={
                    selectedAsset.asset === "USD"
                      ? "#B88AF8"
                      : selectedAsset.asset === "ETH"
                      ? "#627EEA"
                      : "#F7931A"
                  }
                  selectedDuration={selectedAsset.duration}
                  onReset={handleReset}
                  disableHover={true}
                  className="w-[300px] h-[311px]"
                />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
                <div
                  onClick={() =>
                    handleStrategySelect(
                      "stable",
                      selectedAsset.asset as AssetType
                    )
                  }
                  className="cursor-pointer"
                >
                  <CustomCard
                    heading={
                      selectedAsset.asset === "USD"
                        ? USD_STRATEGIES.PERPETUAL_DURATION.STABLE.name
                        : `${selectedAsset.asset} Strategy`
                    }
                    imageSrc={`/images/icons/${(
                      selectedAsset.asset as AssetType
                    ).toLowerCase()}-stable.svg`}
                    info={
                      getStrategyInfo(selectedAsset.duration).stable[
                        selectedAsset.asset as AssetType
                      ].description
                    }
                    apy={{ value: usdApy || "--", info: "-" }}
                    isStrategyCard={true}
                    selectedDuration={selectedAsset.duration}
                    onReset={handleReset}
                    disableHover={true}
                  />
                </div>
                <div
                  {...(getStrategyInfo(selectedAsset.duration).incentives[
                    selectedAsset.asset as AssetType
                  ].comingSoon
                    ? {}
                    : {
                        onClick: () =>
                          handleStrategySelect(
                            "incentive",
                            selectedAsset.asset as AssetType
                          ),
                      })}
                  className={
                    "group " +
                    (getStrategyInfo(selectedAsset.duration).incentives[
                      selectedAsset.asset as AssetType
                    ].comingSoon
                      ? "pointer-events-none opacity-60"
                      : "cursor-pointer")
                  }
                >
                  <CustomCard
                    heading={`Incentives ${selectedAsset.asset}`}
                    imageSrc={`/images/icons/${(
                      selectedAsset.asset as AssetType
                    ).toLowerCase()}-incentive.svg`}
                    info={
                      getStrategyInfo(selectedAsset.duration).incentives[
                        selectedAsset.asset as AssetType
                      ].description
                    }
                    apy={
                      getStrategyInfo(selectedAsset.duration).incentives[
                        selectedAsset.asset as AssetType
                      ].apy
                    }
                    isStrategyCard={true}
                    disableHover={true}
                    onReset={handleReset}
                    selectedDuration={selectedAsset.duration}
                    isComingSoon={
                      getStrategyInfo(selectedAsset.duration).incentives[
                        selectedAsset.asset as AssetType
                      ].comingSoon === true
                    }
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="px-4 py-2 bg-[rgba(255,255,255,0.02)] text-[#B8B8BC] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors mt-2.5 self-start"
            >
              Previous
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 items-center pt-[8vh]">
          <h1 className="text-[20px] font-[619px] sm:text-[40px]">
            Select an asset you want yield on
          </h1>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <CustomCard
              heading="USD"
              imageSrc="/images/icons/card-usd.svg"
              hoverColor="#B88AF8"
              onDurationSelect={(duration: DurationType) =>
                handleDurationSelect("USD", duration)
              }
              availableDurations={["PERPETUAL_DURATION"]}
              className="w-[300px] h-[311px]"
            />
            <CustomCard
              heading="ETH"
              imageSrc="/images/icons/card-eth.svg"
              imageAlt="Ethereum semi-circle"
              hoverColor="#627EEA"
              onDurationSelect={(duration: DurationType) =>
                handleDurationSelect("ETH", duration)
              }
              isComingSoon={true}
              className="w-[300px] h-[311px]"
            />
            <CustomCard
              heading="BTC"
              imageSrc="/images/icons/card-btc.svg"
              imageAlt="Bitcoin semi-circle"
              hoverColor="#F7931A"
              onDurationSelect={(duration: DurationType) =>
                handleDurationSelect("BTC", duration)
              }
              isComingSoon={true}
              className="w-[300px] h-[311px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default YieldSubpage;
