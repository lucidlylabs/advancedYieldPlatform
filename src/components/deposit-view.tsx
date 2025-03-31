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
      <div className="flex flex-col gap-6 items-center pt-[calc(8vh+38px)]">
        <div className="w-[580px] h-[459px] flex-shrink-0">
          <div className="flex gap-6 justify-center items-center">
            {/* Left Card - Deposit Input */}
            <div className="w-[280px] h-[311px] bg-[#0D101C] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6">
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
            <div className="w-[280px] h-[311px] bg-[#0D101C] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6 relative flex flex-col">
              {/* Background gradient effect - top */}
              <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent rounded-t-[4px] pointer-events-none"></div>

              {/* Background blur effect - bottom */}
              <div className="absolute -bottom-[100px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-white/[0.05] blur-[25px] pointer-events-none"></div>

              {/* Asset Info */}
              <div className="flex flex-col items-center text-center relative z-10">
                <h3 className="text-[32px] text-[#D7E3EF] font-inter font-medium leading-normal mb-[8px] mt-[12px]">
                  {selectedAsset}
                </h3>
                <div 
                  onClick={onReset}
                  className="text-[16px] text-[#9C9DA2] font-inter font-normal leading-normal underline decoration-solid underline-offset-auto mb-[25px] cursor-pointer hover:text-[#9C9DA2]/80 transition-all duration-200"
                >
                  {duration}
                </div>
                <div
                  onClick={onReset}
                  className="text-[#B88AF8] cursor-pointer font-inter text-[12px] font-light leading-normal hover:opacity-80 transition-all duration-200"
                >
                  Change Asset →
                </div>
              </div>

              {/* Strategy Info - Positioned at bottom */}
              <div className="mt-auto w-full p-3 bg-[#121521] rounded-[4px] border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <img
                    src={`/images/icons/${selectedAsset.toLowerCase()}-${strategy}.svg`}
                    alt={strategy}
                    className="w-[32px] h-[32px] ml-[4px] mr-[12px] my-auto"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold capitalize">
                        {strategy} {selectedAsset}
                      </div>
                      <img
                        src="/images/icons/select-icon.svg"
                        alt="select"
                        className="w-[16px] h-[16px] flex-shrink-0 cursor-pointer ml-auto"
                        onClick={onBack}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-[4px]">
                      <span className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-normal">
                        APY {apy}
                      </span>
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
