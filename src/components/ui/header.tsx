import React, { useState } from "react";

interface HeaderProps {
    className?: string;
    children?: React.ReactNode;
    currentDeposit?: number; // in thousands (e.g., 800 for 800k)
    maxDeposit?: number; // in thousands (e.g., 1000 for 1M)
    onDepositClick?: () => void; // Callback for deposit button click
    onNavigateToDeposit?: (params: { asset: string; duration: string; strategy: string }) => void;
}

export function Header({
    className,
    children,
    currentDeposit = 100,
    maxDeposit = 1000,
    onDepositClick,
    onNavigateToDeposit,
    ...props
}: HeaderProps) {
    const [shouldShowBanner, setShouldShowBanner] = useState(false);

    const handleDepositClick = () => {
        if (onNavigateToDeposit) {
            onNavigateToDeposit({
                asset: "USD",
                duration: "PERPETUAL_DURATION",
                strategy: "stable"
            });
        }
    };

    const formatNumber = (num: number) => {
        return num >= 1000 ? `${num / 1000}M` : `${num}k`;
    };

    const progressPercentage = Math.min((currentDeposit / maxDeposit) * 100, 100);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex flex-col w-full ${className}`} {...props}>
      {shouldShowBanner && (
        <div
          className="w-full h-[40px] flex-shrink-0 bg-[rgba(53,22,95,0.10)] text-amber-100 px-4 relative flex items-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center text-center text-sm gap-2 w-full">
            <span className="text-[rgba(215,227,239,0.6)] font-inter text-[12px] font-normal leading-[14px] tracking-[0.33px] flex items-center gap-2">
              <img
                src="/images/icons/usd-stable.svg"
                alt="USD Stable"
                className="w-4 h-4"
              />
              Deposit cap for Perpetual Stable USD{" "}
              <span className="font-semibold text-[#D7E3EF]">
                ${formatNumber(currentDeposit)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#D7E3EF]">
                ${formatNumber(maxDeposit)}
              </span>
            </span>
            <span>
              <button
                onClick={handleDepositClick}
                className="text-[#B88AF8] font-inter text-[12px] font-normal leading-[14px] flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                Deposit Now
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="#B88AF8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B88AF8] bg-opacity-10">
            <div 
              className="absolute top-0 left-0 h-full bg-[#B88AF8]" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <button
            className="absolute right-2 top-2 h-6 w-6 p-0 flex items-center justify-center text-[#B88AF8] hover:bg-[rgba(184,138,248,0.10)] rounded"
            onClick={() => setShouldShowBanner(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between py-2 sm:py-0 px-6 bg-[#080B17] text-white border-b border-[rgba(255,255,255,0.1)] backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
