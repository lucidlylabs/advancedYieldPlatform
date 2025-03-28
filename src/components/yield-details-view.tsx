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
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.6396 7.02527H12.0181V5.02527H19.0181V12.0253H17.0181V8.47528L12.1042 13.3892L10.6899 11.975L15.6396 7.02527Z"
      fill="currentColor"
    />
    <path d="M5 19H16V13H14V17H7V10H11V8H5V19Z" fill="currentColor" />
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
      "flex items-center gap-2 py-2 px-4 border-b-2 transition-colors",
      active
        ? "border-purple-400 text-white"
        : "border-transparent text-gray-400 hover:text-gray-300"
    )}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
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
      <h2 className="text-xl font-semibold my-6">
        TOTAL DEPOSITS IN {name.toUpperCase()}
      </h2>

      {/* Toggle buttons */}
      <div className="inline-flex rounded-md overflow-hidden border border-gray-700 mb-6">
        <button className="bg-[#2D2F3D] text-white px-4 py-2">
          Total Deposits
        </button>
        <button className="bg-transparent text-gray-400 px-4 py-2 hover:bg-gray-800">
          Allocation
        </button>
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
      <h2 className="text-xl font-semibold my-6">BASE APY HISTORY</h2>

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
      <h2 className="text-xl font-semibold my-6">INCENTIVE REWARDS</h2>

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
            <div className="text-gray-400 text-sm">~$75.00 USD</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{name}</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-white opacity-60 hover:opacity-100 transition-all duration-200">
                  <InfoIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Yield strategy details for {name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded transition-colors">
          Deposit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 border-b border-gray-700 pb-6">
        <div>
          <div className="text-gray-400 text-sm mb-1">TVL</div>
          <div className="text-xl font-semibold">{tvl}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1 flex items-center gap-1">
            Base APY
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-white opacity-60 hover:opacity-100 transition-all duration-200">
                    <InfoIcon />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Annual Percentage Yield excluding additional incentives</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl font-semibold">{baseApy}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1">Contract Address</div>
          <div className="text-xl font-semibold flex items-center gap-1">
            {contractAddress}
            <button className="text-gray-400 hover:text-white transition-colors">
              <ExternalLinkIcon />
            </button>
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1">Network</div>
          <div className="text-xl font-semibold">{network}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mt-6">
        <Tab
          label="Deposits"
          icon={
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">
              D
            </div>
          }
          active={activeTab === "deposits"}
          onClick={() => setActiveTab("deposits")}
        />
        <Tab
          label="Base APY"
          icon={
            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center text-xs">
              A
            </div>
          }
          active={activeTab === "baseApy"}
          onClick={() => setActiveTab("baseApy")}
        />
        <Tab
          label="Incentives"
          icon={
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
              I
            </div>
          }
          active={activeTab === "incentives"}
          onClick={() => setActiveTab("incentives")}
        />
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === "deposits" && renderDepositsTab()}
        {activeTab === "baseApy" && renderBaseApyTab()}
        {activeTab === "incentives" && renderIncentivesTab()}
      </div>
    </div>
  );
};

export { YieldDetailsView };
