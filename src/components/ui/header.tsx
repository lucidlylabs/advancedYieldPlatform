import React from "react";
import { useBanner } from "../../contexts/BannerContext";

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
  currentDeposit?: number; // in thousands (e.g., 800 for 800k)
  maxDeposit?: number; // in thousands (e.g., 1000 for 1M)
  onDepositClick?: () => void; // Callback for deposit button click
  onNavigateToDeposit?: (params: {
    asset: string;
    duration: string;
    strategy: string;
  }) => void;
}

export function Header({
  className,
  children,
  currentDeposit = 1000,
  maxDeposit = 1000,
  onDepositClick,
  onNavigateToDeposit,
  ...props
}: HeaderProps) {
  const { isBannerVisible, hideBanner } = useBanner();

  const handleDepositClick = () => {
    if (onNavigateToDeposit) {
      onNavigateToDeposit({
        asset: "USD",
        duration: "PERPETUAL_DURATION",
        strategy: "stable",
      });
    }
  };

  const handleReadMoreClick = () => {
    window.open("https://docs.lucidly.finance/lucidly-drops", "_blank");
  };

  const formatNumber = (num: number) => {
    return num >= 1000 ? `${num / 1000}M` : `${num}k`;
  };

  const progressPercentage = Math.min((currentDeposit / maxDeposit) * 100, 100);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] flex flex-col w-full ${className}`}
      {...props}
    >
      {isBannerVisible && (
        <div className="w-full min-h-[36px] sm:h-[40px] flex-shrink-0 bg-[#0E0C1E] text-white px-3 sm:px-4 py-1 sm:py-0 relative flex items-center justify-center z-[60] pr-10 sm:pr-4">
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-2 w-full max-w-full">
            <img
              src="/images/icons/usd-stable.svg"
              alt="USD Stable"
              className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 self-center"
            />
            <span className="text-[rgba(215,227,239,0.6)] font-inter text-[11px] sm:text-[12px] font-normal leading-[14px] tracking-[0.33px] text-center flex-shrink flex-grow-0">
              <span className="block sm:inline">Join the Merkl Campaign — Start </span>
              <span className="block sm:inline">
                Collecting{" "}
                <span className="font-semibold text-[#D7E3EF]">
                  Lucidly Drops Today
                </span>
              </span>
            </span>
            <button
              onClick={handleReadMoreClick}
              className="flex text-[#B88AF8] font-inter text-[11px] sm:text-[12px] font-normal leading-[14px] items-center justify-center gap-1 hover:opacity-80 transition-opacity whitespace-nowrap flex-shrink-0 self-center"
            >
              <span className="hidden sm:inline">Read More</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className="w-3 h-3 sm:w-4 sm:h-4"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="#B88AF8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B88AF8] bg-opacity-10">
            <div
              className="absolute top-0 left-0 h-full bg-[#B88AF8]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <button
            className="absolute right-2 sm:right-2 top-2 sm:top-2 h-7 w-7 sm:h-6 sm:w-6 p-0 flex items-center justify-center text-[#B88AF8] hover:bg-[rgba(184,138,248,0.10)] rounded active:bg-[rgba(184,138,248,0.20)] transition-colors"
            onClick={hideBanner}
            aria-label="Close banner"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sm:w-4 sm:h-4"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <div className={`flex items-center justify-between py-2 sm:py-0 px-6 bg-[#080B17] text-white border-b border-[rgba(255,255,255,0.1)] backdrop-blur-sm ${isBannerVisible ? 'mt-0' : 'mt-0'}`}>
        {children}
      </div>
    </div>
  );
}
