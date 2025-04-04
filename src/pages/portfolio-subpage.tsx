import React from "react";
import Image from "next/image";

const PortfolioSubpage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen text-white">
      {/* Top Section - Portfolio Value, PNL, and Wallet */}
      <div className="w-full h-[124px] flex items-center px-8 bg-[#0D101C] border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex-1">
          <div className="flex gap-32">
            <div className="flex flex-col">
              <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                Portfolio
              </div>
              <div className="text-[#D7E3EF] font-inter text-[24px] font-semibold leading-normal mt-1">
                $12,456.89
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                PNL
              </div>
              <div className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal mt-1">
                1653(15%)
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded text-[#D7E3EF] font-mono">
            <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
              Wallet Address
            </div>
            0xebae51b5d9063b5149c1d4bf59d70723798ac703
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1">
        {/* Left Side - Assets */}
        <div className="w-1/2 border-r border-[rgba(255,255,255,0.1)] p-8">
          <div className="mb-6">
            <h2 className="text-[#D7E3EF] text-xl font-semibold mb-2">
              Your Assets
            </h2>
            <p className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
              Review your available balances and current positions
            </p>
          </div>

          {/* Asset List */}
          <div className="space-y-4">
            {/* Base Yield ETH */}
            <div className="bg-[#0D101C] rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <Image
                  src="/images/icons/eth-stable.svg"
                  alt="ETH"
                  width={32}
                  height={32}
                />
                <div>
                  <div className="text-[#D7E3EF] font-semibold">
                    Base Yield ETH
                  </div>
                  <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                    +0.00 in 1 year
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[#D7E3EF] font-inter text-[24px] font-semibold leading-normal">
                  $115,447.00
                </div>
                <div className="flex items-baseline">
                  <span className="text-[#22C55E] font-inter text-[24px] font-semibold leading-normal">
                    $100.00
                  </span>
                  <span className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal ml-1">
                    (10%)
                  </span>
                </div>
              </div>
            </div>

            {/* Incentive Maxi ETH */}
            <div className="bg-[#0D101C] rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <Image
                  src="/images/icons/eth-incentive.svg"
                  alt="ETH"
                  width={32}
                  height={32}
                />
                <div>
                  <div className="text-[#D7E3EF] font-semibold">
                    Incentive Maxi ETH
                  </div>
                  <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                    +0.00 in 1 year
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[#D7E3EF] font-inter text-[24px] font-semibold leading-normal">
                  $343,504,807.10
                </div>
                <div className="flex items-baseline">
                  <span className="text-[#EF4444] font-inter text-[24px] font-semibold leading-normal">
                    -$100.00
                  </span>
                  <span className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal ml-1">
                    (10%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="w-1/2 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <Image
                  src="/images/icons/withdraw-bg.svg"
                  alt="Select Asset"
                  width={188}
                  height={140}
                />
              </div>
              <h2 className="text-[#D7E3EF] text-xl font-semibold mb-2">
                Select a Yield Option to withdraw
              </h2>
              <p className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                Review your available balances, current rates, and withdrawal
                <br />
                options for each yield source.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSubpage;
