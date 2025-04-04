import React, { useState } from "react";
import { CustomCard } from "@/components/ui/card";
import { DepositView } from "@/components/deposit-view";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";

type DurationType = "30_DAYS" | "60_DAYS" | "180_DAYS" | "PERPETUAL_DURATION";
type StrategyType = "STABLE" | "INCENTIVE";

interface StrategyConfig {
  network: string;
  contract: string;
  deposit_token: string;
  deposit_token_contract: string;
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc: string;
}

interface StrategyDuration {
  STABLE: StrategyConfig;
  INCENTIVE: StrategyConfig;
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
}

interface StrategyData {
  stable: Record<AssetType, StrategyInfo>;
  incentives: Record<AssetType, StrategyInfo>;
}

const getStrategyInfo = (duration: DurationType): StrategyData => {
  const getAssetStrategies = (asset: AssetType) => {
    const strategies: StrategyAsset = {
      USD: USD_STRATEGIES,
      BTC: BTC_STRATEGIES,
      ETH: ETH_STRATEGIES,
    }[asset];

    // Use the duration as is since it matches the keys in env.ts
    const durationKey = duration;
    const strategy = strategies[durationKey];

    if (!strategy) {
      console.error(`No strategy found for ${asset} with duration ${durationKey}`);
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
      },
    };
  };

  return {
    stable: {
      USD: getAssetStrategies("USD").stable,
      BTC: getAssetStrategies("BTC").stable,
      ETH: getAssetStrategies("ETH").stable,
    },
    incentives: {
      USD: getAssetStrategies("USD").incentives,
      BTC: getAssetStrategies("BTC").incentives,
      ETH: getAssetStrategies("ETH").incentives,
    },
  };
};

const MarketsSubpage = () => {
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(
    null
  );
  const [selectedStrategy, setSelectedStrategy] =
    useState<SelectedStrategy | null>(null);

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

  return (
    <div
      className="h-[calc(100vh-128px)] relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/background/earn-page-bg.svg')",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% auto",
      }}
    >
      {selectedStrategy ? (
        <DepositView
          selectedAsset={selectedStrategy.asset}
          duration={selectedStrategy.duration}
          strategy={selectedStrategy.type}
          apy={selectedStrategy.apy}
          onBack={() => setSelectedStrategy(null)}
          onReset={handleReset}
        />
      ) : selectedAsset ? (
        <div className="flex flex-col gap-6 items-center pt-[8vh]">
          <h1 className="text-[32px] font-normal">Select a yield source</h1>
          <div className="flex gap-6 justify-center items-center">
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
              className="h-[311px]"
            />
            <div className="flex items-center justify-center gap-6 rounded-[4px] bg-[rgba(255,255,255,0.02)] w-[555px] h-[311px] p-6">
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
                  heading={`Stable ${selectedAsset.asset}`}
                  imageSrc={`/images/icons/${(
                    selectedAsset.asset as AssetType
                  ).toLowerCase()}-stable.svg`}
                  info={
                    getStrategyInfo(selectedAsset.duration).stable[
                      selectedAsset.asset as AssetType
                    ].description
                  }
                  apy={
                    getStrategyInfo(selectedAsset.duration).stable[
                      selectedAsset.asset as AssetType
                    ].apy
                  }
                  isStrategyCard={true}
                  disableHover={true}
                />
              </div>
              <div
                onClick={() =>
                  handleStrategySelect(
                    "incentive",
                    selectedAsset.asset as AssetType
                  )
                }
                className="cursor-pointer"
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
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 items-center pt-[8vh]">
          <h1 className="text-[32px] font-normal">
            Select a asset you want yield on
          </h1>
          <div className="flex gap-6 justify-center items-center">
            <CustomCard
              heading="USD"
              imageSrc="/images/icons/card-usd.svg"
              hoverColor="#B88AF8"
              onDurationSelect={(duration: DurationType) =>
                handleDurationSelect("USD", duration)
              }
            />
            <CustomCard
              heading="Ethereum"
              imageSrc="/images/icons/card-eth.svg"
              hoverColor="#627EEA"
              onDurationSelect={(duration: DurationType) =>
                handleDurationSelect("ETH", duration)
              }
            />
            <CustomCard
              heading="Bitcoin"
              imageSrc="/images/icons/card-btc.svg"
              hoverColor="#F7931A"
              onDurationSelect={(duration: DurationType) =>
                handleDurationSelect("BTC", duration)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketsSubpage;
