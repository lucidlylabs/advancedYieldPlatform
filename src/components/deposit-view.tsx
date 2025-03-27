import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DepositViewProps {
  selectedAsset: string;
  duration: string;
  strategy: "stable" | "incentive";
  apy: string;
  onBack: () => void;
}

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DepositView: React.FC<DepositViewProps> = ({
  selectedAsset,
  duration,
  strategy,
  apy,
  onBack,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const balance = "0.00"; // This would come from your wallet connection

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { // Only allow numbers and one decimal point
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
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        {/* Left Card - Deposit Input */}
        <div className="w-[264px] bg-[rgba(255,255,255,0.02)] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={onBack}
              className="text-white opacity-60 hover:opacity-100 transition-all duration-200 flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img src={`/images/icons/card-${selectedAsset.toLowerCase()}.svg`} alt={selectedAsset} className="w-6 h-6" />
              <span className="text-white font-semibold">{selectedAsset}</span>
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
              <span className="text-[rgba(255,255,255,0.6)]">Balance: {balance}</span>
              <span className="text-[#4CAF50]">+0.00 in 1 year</span>
            </div>
          </div>
        </div>

        {/* Right Card - Strategy Info */}
        <div className="w-[264px] bg-[rgba(255,255,255,0.02)] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-3xl font-semibold text-white mb-1">{selectedAsset}</h3>
              <div className="text-[rgba(255,255,255,0.6)]">{duration}</div>
            </div>

            <div className="flex items-center gap-2">
              <img src={`/images/icons/${strategy}-${selectedAsset.toLowerCase()}.svg`} alt={strategy} className="w-8 h-8" />
              <div>
                <div className="text-white font-semibold capitalize">{strategy} {selectedAsset}</div>
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
                        <p>Annual Percentage Yield based on current market conditions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Slippage & Deposit */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-white">Slippage</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-white opacity-60 hover:opacity-100 transition-all duration-200">
                  <InfoIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Maximum price impact you're willing to accept for this transaction</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={slippage}
              onChange={handleSlippageChange}
              className="w-16 bg-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-white text-sm border-none outline-none focus:ring-1 focus:ring-[rgba(255,255,255,0.2)]"
            />
            <span className="text-white">%</span>
          </div>
        </div>

        <button 
          className="w-full py-4 rounded bg-[#B88AF8] text-[#1A1B1E] font-semibold hover:opacity-90 transition-all duration-200"
        >
          Connect Wallet to Yield {apy}
        </button>
      </div>
    </div>
  );
};

export { DepositView }; 