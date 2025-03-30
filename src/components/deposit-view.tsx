import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface DepositViewProps {
  selectedAsset: string;
  duration: string;
  strategy: "stable" | "incentive";
  apy: string;
  onBack: () => void;
  onReset: () => void;
}

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

const DepositView: React.FC<DepositViewProps> = ({
  selectedAsset,
  duration,
  strategy,
  apy,
  onBack,
  onReset,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const balance = "0.00"; // This would come from your wallet connection

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      // Only allow numbers and one decimal point
      setAmount(value);
    }
  };

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSlippage(value);
    }
  };

  return (
    <div className="h-[calc(100vh-128px)] relative overflow-hidden">
      <div className="flex flex-col gap-6 items-center pt-[8vh]">
        <div className="w-[580px] h-[459px] flex-shrink-0">
          <div className="flex gap-6 justify-center items-center">
            {/* Left Card - Deposit Input */}
            <div className="w-[280px] h-[311px] bg-[rgba(255,255,255,0.02)] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <img
                    src={`/images/icons/card-${selectedAsset.toLowerCase()}.svg`}
                    alt={selectedAsset}
                    className="w-6 h-6"
                  />
                  <span className="text-white font-semibold">
                    {selectedAsset}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full bg-transparent text-4xl text-white border-none outline-none focus:ring-0 font-semibold"
                  />
                  <button
                    onClick={handleMaxClick}
                    className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-[rgba(255,255,255,0.1)] text-white text-sm hover:bg-[rgba(255,255,255,0.15)] transition-all duration-200"
                  >
                    MAX
                  </button>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[rgba(255,255,255,0.6)]">
                    Balance: {balance}
                  </span>
                  <span className="text-[#4CAF50]">+0.00 in 1 year</span>
                </div>
              </div>
            </div>

            {/* Right Card - Strategy Info */}
            <div className="w-[280px] h-[311px] bg-[rgba(255,255,255,0.02)] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6">
              <div className="flex flex-col gap-4">
                {/* Asset Info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-3xl font-semibold text-white">
                      {selectedAsset}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div
                      onClick={onReset}
                      className="text-[rgba(255,255,255,0.6)] cursor-pointer decoration-[rgba(255,255,255,0.3)] hover:decoration-[rgba(255,255,255,0.6)] underline underline-offset-4 transition-all duration-200"
                    >
                      {duration}
                    </div>
                    <div
                      onClick={onReset}
                      className="text-[#B88AF8] cursor-pointer font-inter text-xs font-light"
                    >
                      Change Asset
                    </div>
                  </div>
                </div>

                {/* Strategy Info */}
                <div className="flex items-center gap-3 p-4 bg-[rgba(255,255,255,0.02)] rounded-[4px] border border-[rgba(255,255,255,0.05)]">
                  <img
                    src={`/images/icons/${selectedAsset.toLowerCase()}-${strategy}.svg`}
                    alt={strategy}
                    className="w-10 h-10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-semibold capitalize">
                        {strategy} {selectedAsset}
                      </div>
                      <img
                        src="/images/icons/select-icon.svg"
                        alt="select"
                        className="w-4 h-4 cursor-pointer"
                        onClick={onBack}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgba(255,255,255,0.6)]">APY</span>
                      <span className="text-white font-semibold">{apy}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-white opacity-60 hover:opacity-100 transition-all duration-200">
                              <InfoIcon />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Annual Percentage Yield based on current market
                              conditions
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Connect/Deposit Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openConnectModal,
              mounted,
              authenticationStatus,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <button
                  onClick={connected ? undefined : openConnectModal}
                  className="w-full py-4 mt-6 rounded bg-[#B88AF8] text-[#1A1B1E] font-semibold hover:opacity-90 transition-all duration-200"
                >
                  {connected ? `Deposit` : `Connect Wallet`}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  );
};

export { DepositView };
