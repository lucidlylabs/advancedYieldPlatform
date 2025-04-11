import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount, useTransaction, useReadContract } from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import { type Address, createPublicClient, http, formatUnits } from "viem";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

const PortfolioSubpage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [strategiesWithBalance, setStrategiesWithBalance] = useState<any[]>([]);

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
      } else {
        setIsApproving(false);
      }
    }
  }, [isWaitingForApproval, isApproving, isApprovalSuccess]);

  // Function to check balance for a strategy
  const checkStrategyBalance = async (strategy: any) => {
    if (!address) return 0;

    try {
      const client = createPublicClient({
        transport: http(strategy.rpc),
        chain: {
          id: 146,
          name: "Sonic",
          network: "sonic",
          nativeCurrency: {
            decimals: 18,
            name: "Sonic",
            symbol: "S",
          },
          rpcUrls: {
            default: { http: [strategy.rpc] },
            public: { http: [strategy.rpc] },
          },
        },
      });

      const [balance, decimals] = await Promise.all([
        client.readContract({
          address: strategy.contract as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        }),
        client.readContract({
          address: strategy.contract as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
      ]);

      return parseFloat(formatUnits(balance as bigint, decimals as number));
    } catch (error) {
      console.error("Error checking balance:", error);
      return 0;
    }
  };

  // Check balances for all strategies
  useEffect(() => {
    const checkAllBalances = async () => {
      if (!address) return;

      const allStrategies = [
        ...Object.entries(USD_STRATEGIES).flatMap(([duration, strategies]) =>
          Object.entries(strategies).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "USD",
          }))
        ),
        ...Object.entries(BTC_STRATEGIES).flatMap(([duration, strategies]) =>
          Object.entries(strategies).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "BTC",
          }))
        ),
        ...Object.entries(ETH_STRATEGIES).flatMap(([duration, strategies]) =>
          Object.entries(strategies).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "ETH",
          }))
        ),
      ];

      const strategiesWithBalances = await Promise.all(
        allStrategies.map(async (strategy) => {
          const balance = await checkStrategyBalance(strategy);
          return { ...strategy, balance };
        })
      );

      setStrategiesWithBalance(strategiesWithBalances.filter((s) => s.balance > 0));
    };

    checkAllBalances();
  }, [address]);

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
                ${strategiesWithBalance.reduce((sum, s) => sum + s.balance, 0).toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                PNL
              </div>
              <div className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal mt-1">
                {strategiesWithBalance.reduce((sum, s) => sum + (s.balance * 0.1), 0).toFixed(2)}(10%)
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
            {strategiesWithBalance.map((strategy) => (
              <div key={`${strategy.asset}-${strategy.duration}-${strategy.type}`} className="bg-[#0D101C] rounded-lg p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Image
                    src={`/images/icons/${strategy.asset.toLowerCase()}-${strategy.type === 'stable' ? 'stable' : 'incentive'}.svg`}
                    alt={strategy.asset}
                    width={32}
                    height={32}
                  />
                  <div>
                    <div className="text-[#D7E3EF] font-semibold">
                      {strategy.asset} {strategy.type === 'stable' ? 'Stable' : 'Incentive'} {strategy.duration.replace('_', ' ')}
                    </div>
                    <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                      +{strategy.balance * 0.1} in 1 year
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[#D7E3EF] font-inter text-[24px] font-semibold leading-normal">
                    ${strategy.balance.toFixed(2)}
                  </div>
                  <div className="flex items-baseline">
                    <span className={`text-[${strategy.balance * 0.1 >= 0 ? '#22C55E' : '#EF4444'}] font-inter text-[24px] font-semibold leading-normal`}>
                      ${(strategy.balance * 0.1).toFixed(2)}
                    </span>
                    <span className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal ml-1">
                      (10%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
