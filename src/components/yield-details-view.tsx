import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import Image from "next/image";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import DepositView from "./deposit-view";
import { USD_STRATEGIES, ETH_STRATEGIES, BTC_STRATEGIES } from "../config/env";
import { IncentiveRewards } from "./ui/IncentiveRewards";
import { FAQs, type FAQItemProps } from "./ui/FAQs";
import DepositBarChart from "./graphs/depositChart";
import AllocationChart from "./graphs/allocationsChart";
import StrategyDailyYieldChart from "./graphs/strategyDailyYieldChart";
import BaseApyTotalChart from "./graphs/baseApyTotalChart";

interface MarketItem {
  id: number;
  name: string;
  type: string;
  baseYield: string;
  incentives: Array<{ image: string; name: string; link: string }>;
  tvl: string;
  description?: string;
  riskLevel?: string;
  network?: string;
  contractAddress?: string;
}

// Define types
interface YieldDetailsViewProps {
  name: string;
  tvl: string;
  baseApy: string;
  contractAddress?: string;
  network?: string;
  data: MarketItem[];
  onOpenDepositView: () => void;
}

// Helper components
const InfoIcon = () => (
  <svg
    width="12"
    height="12"
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

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="15"
    viewBox="0 0 14 15"
    fill="none"
  >
    <path
      d="M12.25 5.75L12.25 2.25M12.25 2.25H8.75M12.25 2.25L7.58333 6.91667M5.83333 3.41667H4.55C3.56991 3.41667 3.07986 3.41667 2.70552 3.60741C2.37623 3.77518 2.10852 4.0429 1.94074 4.37218C1.75 4.74653 1.75 5.23657 1.75 6.21667V9.95C1.75 10.9301 1.75 11.4201 1.94074 11.7945C2.10852 12.1238 2.37623 12.3915 2.70552 12.5593C3.07986 12.75 3.56991 12.75 4.55 12.75H8.28333C9.26342 12.75 9.75347 12.75 10.1278 12.5593C10.4571 12.3915 10.7248 12.1238 10.8926 11.7945C11.0833 11.4201 11.0833 10.9301 11.0833 9.95V8.66667"
      stroke="#9C9DA2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface TabProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, icon, active, onClick }) => (
  <button
    className={cn(
      "flex items-center gap-2 px-4 pt-6 pb-4 border-b transition-colors",
      active
        ? "border-white text-white border-b-[0.75px]"
        : "border-transparent text-gray-400 hover:text-gray-300"
    )}
    onClick={onClick}
  >
    {icon}
    <span className="text-white text-right  text-[12px] font-normal leading-[16px]">
      {label}
    </span>
  </button>
);

const YieldDetailsView: React.FC<YieldDetailsViewProps> = ({
  name,
  tvl,
  baseApy,
  contractAddress = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.boringVaultAddress,
  network = "Ethereum",
  data,
  onOpenDepositView,
}) => {
  const [activeTab, setActiveTab] = useState<
    "deposits" | "baseApy" | "incentives" | "faqs"
  >("deposits");
  const [activeDepositTab, setActiveDepositTab] = useState<
    "deposits" | "allocation"
  >("deposits");
  const [activeBaseApyTab, setActiveBaseApyTab] = useState<
    "totalApy" | "bySource"
  >("totalApy");

  const [userDeposits, setUserDeposits] = useState<string>("0.00");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get connected wallet address
  const { address, isConnected } = useAccount();

  // Read user's syUSD token balance (vault shares)
  const { data: userSyUSDTokens } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Format user's syUSD token amount (same method as portfolio)
  useEffect(() => {
    if (userSyUSDTokens && typeof userSyUSDTokens === "bigint") {
      // Use same method as portfolio.tsx
      const decimals =
        USD_STRATEGIES.PERPETUAL_DURATION.STABLE.shareAddress_token_decimal ??
        6;
      const formatted = Number(formatUnits(userSyUSDTokens, decimals));
      setUserDeposits(formatted.toFixed(2));
    } else if (!isConnected) {
      setUserDeposits("0.00");
    }
  }, [userSyUSDTokens, isConnected]);

  // FAQ data
  const faqItems: FAQItemProps[] = [
    {
      question: "What is syUSD?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore."
    },
    {
      question: "Difference b/w syAssets and ryAssets.",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Is is secure?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Security is our top priority with multiple audits and safety measures in place."
    },
    {
      question: "How are fixed yield positions created?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Fixed yield positions are created through smart contract mechanisms that lock in rates."
    },
    {
      question: "Where is the yield coming from?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Yield is generated through various DeFi strategies and protocols."
    },
    {
      question: "Who is the curator?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The curator is responsible for managing and optimizing the yield strategies."
    }
  ];

  // Sub-components for each tab

  const renderDepositsTab = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3 mt-4">
        <h2 className="text-[rgba(255,255,255,0.70)] text-[16px] font-extrabold ">
          Total deposits in {name}
        </h2>

        {/* Toggle buttons */}
        <div className="flex overflow-hidden border border-[rgba(184,138,248,0.2)] rounded-md">
          <button
            className={`px-3 py-1.5 w-28 text-xs transition-colors duration-150 ${
              activeDepositTab === "deposits"
                ? "bg-[rgba(184,138,248,0.1)] text-white"
                : "bg-transparent text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveDepositTab("deposits")}
          >
            Total Deposits
          </button>
          <button
            className={`px-3 py-1.5 w-28 text-xs transition-colors duration-150 ${
              activeDepositTab === "allocation"
                ? "bg-[rgba(184,138,248,0.1)] text-white"
                : "bg-transparent text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveDepositTab("allocation")}
          >
            Allocation
          </button>
        </div>
      </div>

      {activeDepositTab === "deposits" && (
        <div className="h-[800px] overflow-y-auto pb-2">
          <DepositBarChart />
        </div>
      )}

      {activeDepositTab === "allocation" && (
        <div className="overflow-y-auto pb-2">
          <AllocationChart />
        </div>
      )}
    </div>
  );

  const renderBaseApyTab = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3 mt-4">
        <h2 className="text-[rgba(255,255,255,0.70)] text-[16px] font-extrabold ">
         Base APY History
        </h2>

        {/* Toggle buttons */}
        <div className="flex overflow-hidden border border-[rgba(184,138,248,0.2)] rounded-md">
          <button
            className={`px-3 py-1.5 w-28 text-xs transition-colors duration-150 ${
              activeBaseApyTab === "totalApy"
                ? "bg-[rgba(184,138,248,0.1)] text-white"
                : "bg-transparent text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveBaseApyTab("totalApy")}
          >
            Total APY
          </button>
          <button
            className={`px-3 py-1.5 w-28 text-xs transition-colors duration-150 ${
              activeBaseApyTab === "bySource"
                ? "bg-[rgba(184,138,248,0.1)] text-white"
                : "bg-transparent text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveBaseApyTab("bySource")}
          >
            By Source
          </button>
        </div>
      </div>

      {activeBaseApyTab === "totalApy" && (
        <div className="h-[800px] overflow-y-auto pb-2">
          <BaseApyTotalChart />
        </div>
      )}

      {activeBaseApyTab === "bySource" && (
        <div className="h-[800px] overflow-y-auto pb-2">
          <StrategyDailyYieldChart />
        </div>
      )}
    </div>
  );

  const renderIncentivesTab = () => (
    <IncentiveRewards strategyName={name} className="w-full" />
  );

  const renderFAQsTab = () => (
    <div className="w-full mt-6">
      <FAQs items={faqItems} className="w-full max-w-4xl" />
    </div>
  );

  return (
    <>
      {/* {showDepositView ? (
            <DepositView
            selectedAsset="USD"
            duration="PERPETUAL_DURATION"
            strategy="stable"
            apy="4.5%"
            onBack={() => setShowDepositView(false)}
            onReset={() => setShowDepositView(false)}
            />
        ):( */}
      <div className="w-full pl-0 sm:pl-4 mt-2 sm:mt-10 px-4 sm:px-0">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-2 gap-4">
          <div className="flex items-center pl-0 w-full lg:w-auto">
            <div className="inline-flex items-center gap-[8px] pl-0">
              <div className="flex items-baseline gap-2">
                <h1 className="text-[18px] sm:text-[20px] font-semibold text-[#D7E3EF] leading-none">
                  {name}
                </h1>

                <Tooltip content="syUSD is a synthetic USD stablecoin that provides yield through various DeFi strategies" side="top">
                  <div className="flex items-center">
                    <svg
                      width="14"
                      height="13"
                      viewBox="0 0 14 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.99935 8.83341V6.50008M6.99935 4.16675H7.00518M12.8327 6.50008C12.8327 9.72174 10.221 12.3334 6.99935 12.3334C3.77769 12.3334 1.16602 9.72174 1.16602 6.50008C1.16602 3.27842 3.77769 0.666748 6.99935 0.666748C10.221 0.666748 12.8327 3.27842 12.8327 6.50008Z"
                        stroke="#9C9DA2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Simple Your Deposits - Right Side */}
          <div className="flex items-center gap-3">
            {/* Only show holdings component if user has actual holdings */}
            {isClient && isConnected && userDeposits !== "0.00" && (
              <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-[4px] px-2 py-1.5">
                <span className="text-[#9C9DA2] text-[12px]">Your Holdings:</span>
                <span className="text-white text-[14px] font-medium">
                  {userDeposits}
                </span>
                {/* Circular icon next to deposit amount */}
                <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
                  <Image
                    src="/images/icons/syUSD.svg"
                    alt="syUSD"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button className="text-white border border-[rgba(255,255,255,0.1)] rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors cursor-default">
                Liquid
              </button>
              <button
                className="bg-[#B88AF8] hover:bg-[#9F6EE9] text-[#080B17] flex items-center gap-[8px] px-[16px] py-[6px] rounded-[4px] transition-colors text-[14px] font-normal leading-normal"
                onClick={onOpenDepositView}
              >
                Deposit
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 sm:gap-x-8 gap-y-4 border-b border-gray-700 pb-4 text-sm text-white overflow-x-auto">
          {/* TVL */}
          <div className="flex flex-col justify-center items-start relative pr-4 sm:pr-6 h-[35px] gap-[10px] after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-[35px] after:bg-gray-700 min-w-[80px]">
            <div className="text-[#9C9DA2] text-xs leading-none">TVL</div>
            <div className="font-semibold text-sm leading-none">{tvl}</div>
          </div>

          {/* Base APY */}
          <div className="flex flex-col justify-center items-start relative pr-4 sm:pr-6 h-[35px] gap-[10px] after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-[35px] after:bg-gray-700 min-w-[80px]">
            <div className="text-[#9C9DA2] text-xs leading-none flex items-center gap-1">
              Base APY
              <Tooltip content="7d moving average" side="top">
                <div className="cursor-pointer">
                  <InfoIcon />
                </div>
              </Tooltip>
            </div>
            <div className="font-semibold text-sm leading-none">{baseApy}</div>
          </div>

          {/* Content */}
          {/* <div className="mt-2 pl-0">
                {activeTab === "deposits" && (
                  <DailyDeposits endpoint="http://localhost:3001/api/syUSD/daily-deposits" />
                )}
                {activeTab === "baseApy" && renderBaseApyTab()}
                {activeTab === "incentives" && renderIncentivesTab()}
          </div> */}
          {/* Contract Address */}
          <div className="flex flex-col justify-center items-start relative pr-4 sm:pr-6 h-[35px] gap-[10px] after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-[35px] after:bg-gray-700 min-w-[120px] sm:min-w-[140px]">
            <div className="text-[#9C9DA2] text-xs leading-none">
              Contract Address
            </div>
            <div className="font-semibold text-sm leading-none flex items-center gap-1">
              {contractAddress
                ? `${contractAddress.slice(0, 4)}...${contractAddress.slice(
                    -4
                  )}`
                : "N/A"}
              <a
                href={`https://basescan.org/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9C9DA2] hover:text-white transition-colors"
              >
                <ExternalLinkIcon />
              </a>
            </div>
          </div>

          {/* Network */}
          <div className="flex flex-col justify-center items-start h-[40px] gap-[5px] min-w-[80px]">
            <div className="text-[#9C9DA2] text-xs leading-none">Network</div>
            <div className="relative mt-0 text-[14px] flex items-center cursor-pointer group">
              {(
                [
                  USD_STRATEGIES.PERPETUAL_DURATION.STABLE.base,
                  USD_STRATEGIES.PERPETUAL_DURATION.STABLE.ethereum,
                  USD_STRATEGIES.PERPETUAL_DURATION.STABLE.arbitrum,
                  USD_STRATEGIES.PERPETUAL_DURATION.STABLE.katana,
                ] as const
              )
                .filter(Boolean)
                .map((networkConfig, index) => (
                  <Tooltip key={networkConfig.chainObject.name} content={networkConfig.chainObject.name} side="top">
                    <div
                      className={cn(
                        "relative z-10 transition-transform duration-300 hover:scale-110",
                        index > 0 && "-ml-2"
                      )}
                    >
                      <Image
                        src={networkConfig.image}
                        alt={networkConfig.chainObject.name}
                        width={24}
                        height={24}
                      />
                    </div>
                  </Tooltip>
                ))}
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-700 pl-0 overflow-x-auto">
          <Tab
            label="Deposits"
            icon={
              <img
                src="/images/icons/yields-page-detailed-deposit.svg"
                alt="Deposits"
                width={16}
                height={16}
              />
            }
            active={activeTab === "deposits"}
            onClick={() => setActiveTab("deposits")}
          />
          <Tab
            label="Base APY"
            icon={
              <img
                src="/images/icons/yields-page-detailed-baseapy.svg"
                alt="Base APY"
                width={16}
                height={16}
              />
            }
            active={activeTab === "baseApy"}
            onClick={() => setActiveTab("baseApy")}
          />
          <Tab
            label="Incentives"
            icon={
              <img
                src="/images/icons/yields-page-detailed-incentive.svg"
                alt="Incentives"
                width={16}
                height={16}
              />
            }
            active={activeTab === "incentives"}
            onClick={() => setActiveTab("incentives")}
          />
          {/* <Tab
            label="FAQs"
            icon={
              <img
                src="/images/icons/faqs.svg"
                alt="Incentives"
                width={16}
                height={16}
              />
            }
            active={activeTab === "faqs"}
            onClick={() => setActiveTab("faqs")}
          /> */}
        </div>

        {/* Content */}
        <div className="mt-2 pl-0">
          {activeTab === "deposits" && renderDepositsTab()}
          {activeTab === "baseApy" && renderBaseApyTab()}
          {activeTab === "incentives" && renderIncentivesTab()}
          {activeTab === "faqs" && renderFAQsTab()}
        </div>
      </div>
      {/* )} */}
    </>
  );
};

export { YieldDetailsView };
