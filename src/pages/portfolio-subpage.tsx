import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount, useTransaction } from "wagmi";

const PortfolioSubpage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Watch deposit transaction
  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } = useTransaction({
    hash: transactionHash || undefined,
  });

  // Watch for deposit completion
  useEffect(() => {
    if (!isWaitingForDeposit && isDepositing) {
      setIsDepositing(false);
      setIsApproved(false);
      if (isDepositSuccess && transactionHash) {
        setDepositSuccess(true);
      }
    }
  }, [isWaitingForDeposit, isDepositing, isDepositSuccess, transactionHash]);

  // Watch approval transaction
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } = useTransaction({
    hash: approvalHash || undefined,
  });

  useEffect(() => {
    if (!isWaitingForApproval && isApproving) {
      if (isApprovalSuccess) {
        setIsApproved(true);
        setIsApproving(false);
        // Automatically trigger deposit after approval
        // handleDeposit(); // This line is commented out as it's causing an error due to undefined function
      } else {
        setIsApproving(false);
      }
    }
  }, [isWaitingForApproval, isApproving, isApprovalSuccess]);

  const approveTx = async () => {
    // Implement the approve function
    // This is a placeholder and should be replaced with the actual implementation
    // For now, we'll just set a temporary approval hash
    const approveTx = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    if (typeof approveTx === 'string' && approveTx.startsWith('0x')) {
      setApprovalHash(approveTx as `0x${string}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      {/* Top Section - Portfolio Value, PNL, and Wallet */}
      <div className="w-full h-[124px] flex items-center justify-between px-8 bg-[#0D101C] border-b border-[rgba(255,255,255,0.1)]">
        <div>
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
        <div className="flex flex-col justify-center items-end gap-2 py-[10px] px-4 rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
            Wallet Address
          </div>
          <div className="text-[#D7E3EF] font-mono opacity-20">
            {isConnected ? address : "Not connected"}
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
