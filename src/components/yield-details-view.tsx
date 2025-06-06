import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define types
interface YieldDetailsViewProps {
  name: string;
  tvl: string;
  baseApy: string;
  contractAddress?: string;
  network?: string;
}

// Helper components
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

// Tab component for switching between views
interface TabProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, icon, active, onClick }) => (
  <button
    className={cn(
      "flex items-center gap-2 px-4 pt-6 pb-4 border-b-2 transition-colors",
      active
        ? "border-white text-white"
        : "border-transparent text-gray-400 hover:text-gray-300"
    )}
    onClick={onClick}
  >
    {icon}
    <span className="text-white text-right font-inter text-[12px] font-normal leading-[16px]">{label}</span>
  </button>
);

// Main component
const YieldDetailsView: React.FC<YieldDetailsViewProps> = ({
  name,
  tvl,
  baseApy,
  contractAddress = "0x82...2d",
  network = "Ethereum",
}) => {
  const [activeTab, setActiveTab] = useState<
    "deposits" | "baseApy" | "incentives"
  >("deposits");

  // Mock data for the chart
  const chartData = [
    { month: "FEB 24", value: 20 },
    { month: "MAR 24", value: 15 },
    { month: "APR 24", value: 25 },
    { month: "MAY 24", value: 30 },
    { month: "JUN 24", value: 28 },
    { month: "JUL 24", value: 18 },
    { month: "AUG 24", value: 32 },
    { month: "SEP 24", value: 24 },
    { month: "OCT 24", value: 26 },
    { month: "NOV 24", value: 30 },
    { month: "DEC 24", value: 24 },
    { month: "JAN 24", value: 28 },
  ];

  // Sub-components for each tab
  const renderDepositsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[rgba(255,255,255,0.70)] font-inter text-[16px] font-bold">
          TOTAL DEPOSITS IN {name.toUpperCase()}
        </h2>

        {/* Toggle buttons */}
        <div className="inline-flex border border-gray-700 rounded-md">
          <button className="text-[#D7E3EF] font-inter text-[12px] font-normal leading-[16px] px-4 py-2 rounded-[6px_0px_0px_6px] border border-[rgba(184,138,248,0.50)] bg-[rgba(184,138,248,0.15)]">
            Total Deposits
          </button>
          <button className="text-[#D7E3EF] font-inter text-[12px] font-normal leading-[16px] px-4 py-2 hover:text-white transition-colors">
            Allocation
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64 relative">
        {/* Y-axis labels */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-right text-xs text-gray-400">
          <span>$100M</span>
          <span>$80M</span>
          <span>$60M</span>
          <span>$40M</span>
          <span>$20M</span>
          <span>$0</span>
        </div>

        {/* Chart bars */}
        <div className="flex justify-between items-end h-full pr-12">
          {chartData.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-4/5 bg-blue-500 mb-1"
                style={{ height: `${month.value * 2}px` }}
              ></div>
              <div
                className="w-4/5 bg-teal-300 mb-1"
                style={{ height: `${month.value * 1.5}px` }}
              ></div>
              <div
                className="w-4/5 bg-yellow-300 mb-1"
                style={{ height: `${month.value}px` }}
              ></div>
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between pr-12 mt-2 text-xs text-gray-400">
          {chartData.map((month, index) => (
            <div key={index} className="flex-1 text-center">
              {month.month}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBaseApyTab = () => (
    <div>
      <h2 className="text-[rgba(255,255,255,0.70)] font-inter text-[16px] font-bold my-6">
        BASE APY HISTORY
      </h2>

      {/* APY History Chart (simplified for example) */}
      <div className="w-full h-64 bg-gray-800 rounded-md flex items-end">
        <div className="w-full flex items-end justify-between p-4">
          {[15, 18, 22, 25, 20, 24, 28, 30, 27, 25, 27, 25].map((val, i) => (
            <div
              key={i}
              className="w-2 bg-purple-500 rounded-t"
              style={{ height: `${val * 2}px` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIncentivesTab = () => (
    <div>
      <h2 className="text-[rgba(255,255,255,0.70)] font-inter text-[16px] font-bold my-6">
        INCENTIVE REWARDS
      </h2>

      <div className="bg-gray-800 rounded-md p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L12 9.5M12 2L6 5M12 2L18 5M12 22L12 15M12 22L6 19M12 22L18 19"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-medium">ETH Rewards</span>
            </div>
            <div className="text-2xl font-bold mb-1">0.25 ETH</div>
            <div className="text-gray-400 text-sm">~$625.00 USD</div>
          </div>

          <div className="border border-gray-700 rounded-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2V22M17 5H9.5C7.567 5 6 6.567 6 8.5C6 10.433 7.567 12 9.5 12H14.5C16.433 12 18 13.567 18 15.5C18 17.433 16.433 19 14.5 19H7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-medium">Platform Token</span>
            </div>
            <div className="text-2xl font-bold mb-1">150 LCY</div>
            <div className="text-gray-400 text-sm">$75 USD</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center pl-0">
          <div className="inline-flex items-center pl-0">
            <h1 className="text-[20px] font-semibold text-[#D7E3EF] font-inter leading-normal inline-flex items-center pl-0 mt-4">
              {name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-[#B88AF8] hover:bg-[#9F6EE9] text-[#080B17] flex items-center gap-[8px] px-[16px] py-[6px] rounded-[4px] transition-colors font-inter text-[14px] font-normal leading-normal">
            Deposit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-2 gap-y-4 border-b border-[#2D2F3D] py-4 text-sm font-inter text-white sm:flex sm:items-center sm:justify-between sm:py-0 sm:px-0 sm:gap-0 sm:border-gray-700">
        {/* TVL */}
        <div className="flex flex-col items-start justify-center px-4 border-r border-[#2D2F3D]">
          <div className="text-[#9C9DA2] text-xs font-normal">TVL</div>
          <div className="mt-1 font-semibold">{tvl}</div>
        </div>

        {/* Base APY */}
        <div className="flex flex-col items-start justify-center px-4">
          <div className="text-[#9C9DA2] text-xs font-normal">Base APY</div>
          <div className="mt-1 font-semibold">{baseApy}</div>
        </div>

        {/* Contract Address */}
        <div className="flex flex-col items-start justify-center px-4 border-r border-[#2D2F3D]">
          <div className="text-[#9C9DA2] text-xs font-normal">Contract Address</div>
          <div className="mt-1 font-semibold flex items-center gap-1">
            {contractAddress}
            <button className="text-[#9C9DA2] hover:text-white transition-colors">
              <ExternalLinkIcon />
            </button>
          </div>
        </div>

        {/* Network */}
        <div className="flex flex-col items-start justify-center px-4">
          <div className="text-[#9C9DA2] text-xs font-normal">Network</div>
          <div className="mt-1 font-semibold">{network}</div>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex border-b border-gray-700 pl-0">
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
      </div>

      {/* Content */}
      <div className="mt-2 pl-0">
        {activeTab === "deposits" && renderDepositsTab()}
        {activeTab === "baseApy" && renderBaseApyTab()}
        {activeTab === "incentives" && renderIncentivesTab()}
      </div>
    </div>
  );
};

export { YieldDetailsView };
