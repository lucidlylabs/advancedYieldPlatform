import React from 'react';
import Image from 'next/image';

const PortfolioSubpage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen text-white">
      {/* Top Section - Portfolio Value, PNL, and Wallet */}
      <div className="w-full h-[124px] flex items-center px-8 bg-[#0D101C] border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex-1">
          <div className="flex items-baseline gap-8">
            <div>
              <div className="text-[#9C9DA2] text-sm mb-2">Portfolio</div>
              <div className="text-[32px] font-semibold text-[#D7E3EF]">$12,456.89</div>
            </div>
            <div>
              <div className="text-[#9C9DA2] text-sm mb-2">PNL</div>
              <div className="text-[32px] font-semibold text-[#22C55E]">$1,653 (15%)</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[#9C9DA2] text-sm">Wallet Address</div>
          <div className="bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded text-[#D7E3EF] font-mono">
            0xebae51b5d9063b5149c1d4bf59d70723798ac703
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1">
        {/* Left Side - Assets */}
        <div className="w-1/2 border-r border-[rgba(255,255,255,0.1)] p-8">
          <div className="mb-6">
            <h2 className="text-[#D7E3EF] text-xl font-semibold mb-2">Your Assets</h2>
            <p className="text-[#9C9DA2] text-sm">Review your available balances and current positions</p>
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
                  <div className="text-[#D7E3EF] font-semibold">Base Yield ETH</div>
                  <div className="text-[#9C9DA2] text-sm">+0.00 in 1 year</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[#D7E3EF]">$115,447.00</div>
                <div className="text-[#22C55E]">$100.00 (10%)</div>
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
                  <div className="text-[#D7E3EF] font-semibold">Incentive Maxi ETH</div>
                  <div className="text-[#9C9DA2] text-sm">+0.00 in 1 year</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[#D7E3EF]">$343,504,807.10</div>
                <div className="text-[#EF4444]">-$100.00 (10%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="w-1/2 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-8">
                <Image
                  src="/images/background/yields-page-bg.svg"
                  alt="Select Asset"
                  width={188}
                  height={140}
                />
              </div>
              <h2 className="text-[#D7E3EF] text-xl font-semibold mb-2">
                Select a Yield Option to withdraw
              </h2>
              <p className="text-[#9C9DA2] text-sm">
                Review your available balances, current rates, and withdrawal<br />
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
