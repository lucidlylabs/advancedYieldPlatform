import React from "react";
import Image from "next/image";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "@/config/env";

interface IncentivePoint {
  name: string;
  image: string;
  multiplier?: number;
  description?: string;
  link?: string;
}

interface StrategyIncentives {
  enabled: boolean;
  points: IncentivePoint[];
}

interface IncentiveRewardsProps {
  strategyName?: string;
  strategyType?: "USD" | "BTC" | "ETH";
  className?: string;
}

const IncentiveRewards: React.FC<IncentiveRewardsProps> = ({
  strategyName = "syUSD",
  strategyType,
  className = "",
}) => {
  // Auto-detect strategy type based on strategy name if not provided
  const detectStrategyType = (name: string): "USD" | "BTC" | "ETH" => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("btc") || lowerName.includes("bitcoin")) {
      return "BTC";
    } else if (lowerName.includes("eth") || lowerName.includes("ethereum")) {
      return "ETH";
    } else {
      return "USD";
    }
  };

  // Get incentives from the environment configuration based on strategy type
  const getStrategyIncentives = (): StrategyIncentives | null => {
    try {
      const detectedType = strategyType || detectStrategyType(strategyName);
      let strategy;

      switch (detectedType) {
        case "USD":
          strategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
          break;
        case "BTC":
          // BTC strategies are empty for now, return null
          return null;
        case "ETH":
          // ETH strategies are empty for now, return null
          return null;
        default:
          strategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
      }

      if (strategy?.incentives && strategy.incentives.enabled) {
        return strategy.incentives;
      }

      return null;
    } catch (error) {
      console.error("Error fetching strategy incentives:", error);
      return null;
    }
  };

  const incentives = getStrategyIncentives();

  if (!incentives || !incentives.points || incentives.points.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex justify-between items-center mb-3 mt-5">
          <h2 className="text-[rgba(255,255,255,0.70)] text-[16px] font-extrabold">
            Incentive Rewards
          </h2>
        </div>

        <div className="h-[800px] overflow-y-auto pb-2">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg text-gray-400 mb-2">
                No Incentives Available
              </h3>
              <p className="text-sm text-gray-500">
                This strategy doesn't have any active incentive programs at the
                moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-[rgba(255,255,255,0.70)] text-[16px] font-extrabold">
          Incentive Rewards
        </h2>
      </div>

      <div className=" overflow-y-auto">
        <div className="grid gap-4">
          {incentives.points.map((point, index) => (
            <div
              key={index}
              className="bg-[rgba(255,255,255,0.02)] rounded-lg p-[16px] transition-all duration-200"
            >
              <div className="flex items-start gap-4 ">
                {/* Left side: Icon, Heading, and Description */}
                <div className="flex-1 space-y-2">
                  {/* First line: Logo and Heading */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <Image
                        src={point.image}
                        alt={point.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-[#D7E3EF] text-base font-normal">
                      {point.name}
                    </h3>
                  </div>

                  {/* Second line: Description */}
                  {point.description && (
                    <div className="">
                      <p className="text-sm text-[#9C9DA2]">
                        {point.description}
                      </p>
                    </div>
                  )}
                </div>

                                  {/* Right side: Multiplier Info and Action Button */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className="text-[#9C9DA2] text-xs text-right">
                      {point.multiplier && point.multiplier > 1
                        ? `${point.multiplier}x Multiplier `
                        : "1x Multiplier "}
                    </span>
                    
                    {/* Action Button */}
                    {point.link && point.link !== "#" && (
                      <a
                        href={point.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-[rgba(0,209,160,0.1)] text-[#00D1A0] text-xs font-medium rounded-md border border-[rgba(0,209,160,0.2)] hover:bg-[rgba(0,209,160,0.15)] transition-colors duration-200 hover:text-[#00D1A0]"
                      >
                        View
                        <svg
                          className="ml-1 w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { IncentiveRewards };
