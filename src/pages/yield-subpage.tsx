import React, { useState } from "react";
import { CustomCard } from "@/components/ui/card";
import { DepositView } from "@/components/deposit-view";

interface SelectedAsset {
  asset: string;
  duration: string;
}

interface SelectedStrategy {
  type: "stable" | "incentive";
  asset: string;
  duration: string;
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

const STRATEGY_INFO: StrategyData = {
  stable: {
    USD: {
      description:
        "Stable USD strategy focuses on maintaining consistent returns through low-risk lending protocols.",
      apy: {
        value: "4.12%",
        info: "Annual Percentage Yield based on current market conditions and protocol performance.",
      },
    },
    ETH: {
      description:
        "Stable ETH strategy provides steady returns through diversified staking and lending.",
      apy: {
        value: "5.23%",
        info: "APY includes staking rewards and lending yields, subject to market conditions.",
      },
    },
    BTC: {
      description:
        "Stable BTC strategy generates yield through secure wrapped Bitcoin lending.",
      apy: {
        value: "3.85%",
        info: "APY derived from lending yields across multiple DeFi protocols.",
      },
    },
  },
  incentives: {
    USD: {
      description:
        "Incentivized USD strategy maximizes returns through protocol rewards and yield farming.",
      apy: {
        value: "8.45%",
        info: "Enhanced APY including protocol incentives and bonus rewards.",
      },
    },
    ETH: {
      description:
        "Incentivized ETH strategy combines staking rewards with protocol incentives.",
      apy: {
        value: "9.67%",
        info: "APY includes staking rewards, protocol incentives, and bonus yields.",
      },
    },
    BTC: {
      description:
        "Incentivized BTC strategy leverages DeFi protocols with additional reward mechanisms.",
      apy: {
        value: "7.92%",
        info: "APY includes lending yields and protocol-specific rewards.",
      },
    },
  },
};

const MarketsSubpage = () => {
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(
    null
  );
  const [selectedStrategy, setSelectedStrategy] =
    useState<SelectedStrategy | null>(null);

  const handleDurationSelect = (asset: string, duration: string) => {
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
        apy: STRATEGY_INFO[type === "stable" ? "stable" : "incentives"][asset]
          .apy.value,
      });
    }
  };

  const resetSelection = () => {
    setSelectedAsset(null);
    setSelectedStrategy(null);
  };

  if (selectedStrategy) {
    return (
      <DepositView
        selectedAsset={selectedStrategy.asset}
        duration={selectedStrategy.duration}
        strategy={selectedStrategy.type}
        apy={selectedStrategy.apy}
        onBack={() => setSelectedStrategy(null)}
      />
    );
  }

  if (selectedAsset) {
    const asset = selectedAsset.asset as AssetType;
    return (
      <div className="flex flex-col gap-8 justify-center items-center min-h-screen">
        <h1>Select a asset you want yield on</h1>
        <div className="flex gap-6 items-start">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <CustomCard
                heading={asset}
                imageSrc={`/images/icons/card-${asset.toLowerCase()}.svg`}
                hoverColor={
                  asset === "USD"
                    ? "#B88AF8"
                    : asset === "ETH"
                    ? "#627EEA"
                    : "#F7931A"
                }
                selectedDuration={selectedAsset.duration}
              />
              <button
                onClick={resetSelection}
                className="text-white opacity-60 hover:opacity-100 transition-all duration-200 text-sm text-center"
              >
                Change Asset
              </button>
            </div>
          </div>
          <div className="flex gap-6">
            <div
              onClick={() => handleStrategySelect("stable", asset)}
              className="cursor-pointer"
            >
              <CustomCard
                heading={`Stable ${asset}`}
                imageSrc={`/images/icons/stable-${asset.toLowerCase()}.svg`}
                hoverColor={
                  asset === "USD"
                    ? "#627EEA"
                    : asset === "ETH"
                    ? "#627EEA"
                    : "#F7931A"
                }
                info={STRATEGY_INFO.stable[asset].description}
                apy={STRATEGY_INFO.stable[asset].apy}
                isStrategyCard={true}
              />
            </div>
            <div
              onClick={() => handleStrategySelect("incentive", asset)}
              className="cursor-pointer"
            >
              <CustomCard
                heading={`Incentives ${asset}`}
                imageSrc={`/images/icons/incentives-${asset.toLowerCase()}.svg`}
                hoverColor={
                  asset === "USD"
                    ? "#B88AF8"
                    : asset === "ETH"
                    ? "#627EEA"
                    : "#F7931A"
                }
                info={STRATEGY_INFO.incentives[asset].description}
                apy={STRATEGY_INFO.incentives[asset].apy}
                isStrategyCard={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-[calc(100vh-128px)] flex flex-col gap-6 items-center pt-[8vh] relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/background/earn-page-bg.svg')",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% auto"
      }}
    >
      <h1 className="text-[32px] font-normal">Select a asset you want yield on</h1>
      <div className="flex gap-6 justify-center items-center">
        <CustomCard
          heading="USD"
          imageSrc="/images/icons/card-usd.svg"
          hoverColor="#B88AF8"
          onDurationSelect={(duration) => handleDurationSelect("USD", duration)}
        />
        <CustomCard
          heading="Ethereum"
          imageSrc="/images/icons/card-eth.svg"
          hoverColor="#627EEA"
          onDurationSelect={(duration) => handleDurationSelect("ETH", duration)}
        />
        <CustomCard
          heading="Bitcoin"
          imageSrc="/images/icons/card-btc.svg"
          hoverColor="#F7931A"
          onDurationSelect={(duration) => handleDurationSelect("BTC", duration)}
        />
      </div>
    </div>
  );
};

export default MarketsSubpage;
