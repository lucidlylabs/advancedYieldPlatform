import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  useAccount,
  useTransaction,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import { ERC20_ABI } from "../config/abi/erc20";
import { SOLVER_ABI } from "../config/abi/solver";
import {
  type Address,
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
} from "viem";

interface StrategyConfig {
  network: string;
  contract: string;
  deposit_token: string;
  deposit_token_contract: string;
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc: string;
}

type DurationType = "30_DAYS" | "60_DAYS" | "180_DAYS" | "PERPETUAL_DURATION";
type StrategyType = "STABLE" | "INCENTIVE";

type StrategyDuration = {
  [K in StrategyType]: StrategyConfig;
}

type StrategyAsset = {
  [K in DurationType]?: StrategyDuration;
}

const PortfolioSubpage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [strategiesWithBalance, setStrategiesWithBalance] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}` | null>(
    null
  );
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Watch deposit transaction
  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } =
    useTransaction({
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
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useTransaction({
      hash: approvalHash || undefined,
    });

  // Watch withdraw transaction
  const { isLoading: isWaitingForWithdraw, isSuccess: isWithdrawSuccess } =
    useTransaction({
      hash: withdrawTxHash || undefined,
    });

  useEffect(() => {
    if (!isWaitingForWithdraw && isWithdrawing) {
      setIsWithdrawing(false);
      if (isWithdrawSuccess && withdrawTxHash) {
        // Handle successful withdrawal
        // Refresh balances with loading state
        setIsRefreshingBalance(true);
        checkAllBalances()
          .then(() => {
            setIsRefreshingBalance(false);
          })
          .catch((error) => {
            console.error("Error refreshing balances:", error);
            setIsRefreshingBalance(false);
          });
        setSelectedStrategy(null);
        setWithdrawAmount("");
      }
    }
  }, [isWaitingForWithdraw, isWithdrawing, isWithdrawSuccess, withdrawTxHash]);

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
      // Validate boring vault address
      if (
        !strategy.boringVaultAddress ||
        strategy.boringVaultAddress === "0x0000000000000000000000000000000000000000"
      ) {
        console.warn("Invalid boring vault address for strategy:", strategy);
        return 0;
      }

      console.log("Checking balance for boring vault:", strategy.boringVaultAddress);
      console.log("Using address:", address);
      console.log("Using RPC:", strategy.rpc);

      const client = createPublicClient({
        transport: http(strategy.rpc),
        chain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: [strategy.rpc] },
            public: { http: [strategy.rpc] },
          },
        },
      });

      try {
        const [balance, decimals] = await Promise.all([
          client.readContract({
            address: strategy.boringVaultAddress as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as Address],
          }),
          client.readContract({
            address: strategy.boringVaultAddress as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          }),
        ]);

        console.log("Raw balance:", balance);
        console.log("Decimals:", decimals);
        
        const formattedBalance = parseFloat(formatUnits(balance as bigint, decimals as number));
        console.log("Formatted balance:", formattedBalance);
        
        return formattedBalance;
      } catch (error) {
        console.error("Error reading boring vault:", error);
        return 0;
      }
    } catch (error) {
      console.error("Error checking balance for strategy:", strategy, error);
      return 0;
    }
  };

  const checkAllBalances = async () => {
    if (!address) return;

    try {
      setIsRefreshingBalance(true);
      const allStrategies = [
        ...Object.entries(USD_STRATEGIES as StrategyAsset).flatMap(([duration, strategies]) =>
          Object.entries(strategies as StrategyDuration).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "USD"
          }))
        ),
        ...Object.entries(BTC_STRATEGIES as StrategyAsset).flatMap(([duration, strategies]) =>
          Object.entries(strategies as StrategyDuration).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "BTC"
          }))
        ),
        ...Object.entries(ETH_STRATEGIES as StrategyAsset).flatMap(([duration, strategies]) =>
          Object.entries(strategies as StrategyDuration).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "ETH"
          }))
        ),
      ];

      // Filter out strategies with invalid contract addresses
      const validStrategies = allStrategies.filter(
        (strategy) =>
          strategy.contract &&
          strategy.contract !== "0x0000000000000000000000000000000000000000"
      );

      console.log("Valid strategies to check:", validStrategies);

      if (validStrategies.length === 0) {
        console.warn(
          "No valid strategies found with proper contract addresses"
        );
        setStrategiesWithBalance([]);
        return;
      }

      const strategiesWithBalances = await Promise.all(
        validStrategies.map(async (strategy) => {
          const balance = await checkStrategyBalance(strategy);
          console.log(`Balance for ${strategy.contract}:`, balance);
          return { ...strategy, balance };
        })
      );

      console.log("Strategies with balances:", strategiesWithBalances);

      setStrategiesWithBalance(
        strategiesWithBalances.filter((s) => s.balance > 0)
      );
    } catch (error) {
      console.error("Error checking all balances:", error);
      throw error;
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Check balances for all strategies
  useEffect(() => {
    checkAllBalances();
  }, [address]);

  // Use wagmi's useWriteContract hook
  const { writeContractAsync: writeContract } = useWriteContract();

  const handleApprove = async () => {
    if (!selectedStrategy || !withdrawAmount || !address) return;

    try {
      setIsApproving(true);
      setErrorMessage(null);

      const solverAddress = selectedStrategy.solverAddress as Address;
      const vaultAddress = selectedStrategy.boringVaultAddress as Address;

      console.log("Approval details:", {
        solverAddress,
        vaultAddress,
        address
      });

      const client = createPublicClient({
        transport: http(selectedStrategy.rpc),
        chain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: ["https://mainnet.base.org"] },
            public: { http: ["https://mainnet.base.org"] },
          },
        },
      });

      // Get decimals from vault
      const decimals = (await client.readContract({
        address: vaultAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;

      const sharesAmount = parseUnits(withdrawAmount, decimals);

      console.log("Requesting approval for amount:", sharesAmount.toString());

      // Approve the solver to spend the vault tokens
      const approveTx = await writeContract({
        address: vaultAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [solverAddress, sharesAmount],
        chainId: 8453,
        account: address,
      });

      if (approveTx && typeof approveTx === "string" && approveTx.startsWith("0x")) {
        console.log("Approval transaction submitted:", approveTx);
        setApprovalHash(approveTx as `0x${string}`);
        
        // Wait for approval transaction to complete
        const { isSuccess: isApprovalSuccess } = await useTransaction({
          hash: approveTx as `0x${string}`,
        });

        if (isApprovalSuccess) {
          setIsApproved(true);
          console.log("Approval successful");
        } else {
          throw new Error("Approval failed");
        }
      } else {
        throw new Error("Failed to get approval transaction hash");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      setErrorMessage("Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedStrategy || !withdrawAmount || !address || !isApproved) return;

    try {
      setIsWithdrawing(true);
      setErrorMessage(null);

      const solverAddress = selectedStrategy.solverAddress as Address;
      const vaultAddress = selectedStrategy.boringVaultAddress as Address;
      const assetOutAddress = "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc" as Address;

      const client = createPublicClient({
        transport: http(selectedStrategy.rpc),
        chain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: ["https://mainnet.base.org"] },
            public: { http: ["https://mainnet.base.org"] },
          },
        },
      });

      // Get decimals from vault contract
      const decimals = (await client.readContract({
        address: vaultAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;

      const sharesAmount = parseUnits(withdrawAmount, decimals);
      // Convert to uint128
      const amountOfShares = BigInt(sharesAmount.toString());
      const discount = 100; // uint16 - hardcoded
      const secondsToDeadline = 3600; // uint24 - hardcoded (1 hour)

      console.log("Debug - Contract call parameters:", {
        functionName: "requestOnChainWithdraw",
        contractAddress: solverAddress,
        args: {
          assetOut: assetOutAddress,
          amountOfShares: amountOfShares.toString(),
          discount: discount.toString(),
          secondsToDeadline: secondsToDeadline.toString()
        },
        types: {
          assetOut: typeof assetOutAddress,
          amountOfShares: typeof amountOfShares,
          discount: typeof discount,
          secondsToDeadline: typeof secondsToDeadline
        }
      });

      const tx = await writeContract({
        address: solverAddress,
        abi: SOLVER_ABI,
        functionName: "requestOnChainWithdraw",
        args: [
          assetOutAddress,
          amountOfShares,
          discount,
          secondsToDeadline
        ],
        chainId: 8453,
        account: address,
      });

      if (tx && typeof tx === "string" && tx.startsWith("0x")) {
        console.log("Withdrawal transaction submitted:", tx);
        setWithdrawTxHash(tx as `0x${string}`);
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error) {
      console.error("Contract call failed:", error);
      setErrorMessage("Transaction failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleStrategySelect = (strategy: any) => {
    setSelectedStrategy(strategy);
    setWithdrawAmount(strategy.balance.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (selectedStrategy) {
      const amount = (selectedStrategy.balance * percentage).toFixed(6);
      setWithdrawAmount(amount);
    }
  };

  const handleMaxClick = () => {
    if (selectedStrategy) {
      setWithdrawAmount(selectedStrategy.balance.toString());
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
                {isRefreshingBalance ? (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Refreshing...</span>
                  </span>
                ) : (
                  `$${strategiesWithBalance
                    .reduce((sum, s) => sum + s.balance, 0)
                    .toFixed(2)}`
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
                PNL
              </div>
              <div className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal mt-3">
                {strategiesWithBalance
                  .reduce(
                    (sum, s) =>
                      sum +
                      (s.balance * parseFloat(s.apy?.replace("%", "") || "0")) /
                        100,
                    0
                  )
                  .toFixed(2)}
                (
                {strategiesWithBalance.length > 0
                  ? "" +
                    (
                      strategiesWithBalance.reduce(
                        (sum, s) =>
                          sum + parseFloat(s.apy?.replace("%", "") || "0"),
                        0
                      ) / strategiesWithBalance.length
                    ).toFixed(1) +
                    "%"
                  : "0%"}
                )
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-end gap-2 py-[10px] px-4 rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
            Wallet Address
          </div>
          <div className="text-[#D7E3EF] font-mono opacity-80">
            {isConnected ? address : "Not connected"}
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1">
        {/* Left Side - Assets Table */}
        <div className="w-1/2 border-r border-[rgba(255,255,255,0.1)] pt-8 pl-8">
          <div className="mb-6">
            <div className="text-[rgba(255,255,255,0.70)] font-inter text-[16px] font-bold uppercase">
              Total Portfolio Value
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 pl-4 pr-6 py-2 border-b border-[rgba(255,255,255,0.15)]">
            <div className="text-[#9C9DA2] font-inter text-[14px] font-medium col-span-4">
              Available Yields
            </div>
            <div className="text-[#9C9DA2] font-inter text-[14px] font-medium flex items-center col-span-3">
              Expiry
              <svg
                className="ml-1"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 10.667L4 6.66699H12L8 10.667Z" fill="#9C9DA2" />
              </svg>
            </div>
            <div className="text-[#9C9DA2] font-inter text-[14px] font-medium flex items-center col-span-2">
              Base APY
              <svg
                className="ml-1"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 10.667L4 6.66699H12L8 10.667Z" fill="#9C9DA2" />
              </svg>
            </div>
            <div className="text-[#9C9DA2] font-inter text-[14px] font-medium flex items-center justify-end col-span-3">
              Current Balance
              <svg
                className="ml-1"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 10.667L4 6.66699H12L8 10.667Z" fill="#9C9DA2" />
              </svg>
            </div>
          </div>

          {/* Strategy Rows */}
          <div className="flex flex-col max-h-[calc(100vh-280px)] overflow-y-auto">
            {isRefreshingBalance ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Image
                  src="/images/background/loader.gif"
                  alt="Loading..."
                  width={200}
                  height={200}
                />
                <div className="text-[#9C9DA2] mt-4">
                  Loading your portfolio...
                </div>
              </div>
            ) : strategiesWithBalance.length > 0 ? (
              strategiesWithBalance.map((strategy, index) => (
                <div
                  key={`${strategy.asset}-${strategy.duration}-${strategy.type}`}
                  className={`grid grid-cols-12 items-center py-4 pl-4 pr-6 relative ${
                    index % 2 === 0
                      ? "bg-transparent"
                      : strategy.type === "stable"
                      ? "bg-[#0D101C]"
                      : "bg-[#090C17]"
                  } cursor-pointer transition-colors group`}
                  onClick={() => handleStrategySelect(strategy)}
                >
                  <div
                    className={`absolute left-0 top-0 h-full w-[15%] bg-gradient-to-r from-[rgba(0,209,160,0.15)] to-[rgba(153,153,153,0)] opacity-0 group-hover:opacity-100 ${
                      selectedStrategy?.contract === strategy.contract
                        ? "opacity-100"
                        : ""
                    }`}
                  ></div>
                  <div
                    className={`absolute right-0 top-0 h-full w-[15%] bg-gradient-to-l from-[rgba(0,209,160,0.15)] to-[rgba(153,153,153,0)] opacity-0 group-hover:opacity-100 ${
                      selectedStrategy?.contract === strategy.contract
                        ? "opacity-100"
                        : ""
                    }`}
                  ></div>
                  {/* Strategy Name */}
                  <div className="flex items-center gap-4 col-span-4">
                    <Image
                      src={`/images/icons/${strategy.asset.toLowerCase()}-${
                        strategy.type === "stable" ? "stable" : "incentive"
                      }.svg`}
                      alt={strategy.asset}
                      width={32}
                      height={32}
                    />
                    <div>
                      <div className="text-[#EDF2F8] font-inter text-[12px] font-normal leading-normal">
                        {strategy.type === "stable"
                          ? "Base Yield"
                          : "Incentive Maxi"}{" "}
                        {strategy.asset}
                      </div>
                      <div className="text-[#00D1A0] font-inter text-[12px] font-normal">
                        +
                        {(
                          (strategy.balance *
                            parseFloat(strategy.apy?.replace("%", "") || "0")) /
                          100
                        ).toFixed(2)}{" "}
                        in 1 year
                      </div>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div className="flex flex-col col-span-3">
                    <div className="text-[#EDF2F8] font-inter text-[12px] font-normal leading-normal">
                      {strategy.duration === "PERPETUAL_DURATION"
                        ? "No Expiry"
                        : "29th March 2025"}
                    </div>
                    <div className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-normal">
                      {strategy.duration === "PERPETUAL_DURATION"
                        ? "Perpetual"
                        : "20 days to Expire"}
                    </div>
                  </div>

                  {/* APY */}
                  <div className="text-[#EDF2F8] font-inter text-[12px] font-normal leading-normal col-span-2 flex items-center justify-center">
                    {strategy.apy}
                  </div>

                  {/* Balance */}
                  <div className="flex flex-col items-end col-span-3">
                    <div className="text-[#EDF2F8] font-inter text-[12px] font-normal leading-normal">
                      ${strategy.balance.toFixed(2)}
                    </div>
                    <div
                      className={`${
                        parseFloat(strategy.apy?.replace("%", "") || "0") >= 0
                          ? "text-[#00D1A0]"
                          : "text-[#EF4444]"
                      } font-inter text-[12px] font-normal leading-normal`}
                    >
                      $
                      {(
                        (strategy.balance *
                          parseFloat(strategy.apy?.replace("%", "") || "0")) /
                        100
                      ).toFixed(2)}{" "}
                      ({strategy.apy})
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[#9C9DA2]">
                No assets found in your portfolio. Deposit assets to get
                started.
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Withdraw Form or Info */}
        <div className="w-1/2 p-8">
          {selectedStrategy ? (
            <div className="flex flex-col h-full rounded-lg p-6">
              <h1 className="text-[#D7E3EF] font-inter text-[20px] font-semibold leading-normal mb-4">
                Withdraw
              </h1>

              <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
                {/* Header with strategy info and balance */}
                <div className="flex items-center justify-between p-4  bg-[rgba(255,255,255,0.02)] mb-6 border-b border-[rgba(255,255,255,0.15)]">
                  <div className="flex items-center gap-4">
                    <Image
                      src={`/images/icons/${selectedStrategy.asset.toLowerCase()}-${
                        selectedStrategy.type === "stable"
                          ? "stable"
                          : "incentive"
                      }.svg`}
                      alt={selectedStrategy.asset}
                      width={40}
                      height={40}
                    />
                    <div>
                      <div className="text-white font-semibold">
                        {selectedStrategy.type === "stable"
                          ? "Base Yield"
                          : "Incentive Maxi"}{" "}
                        {selectedStrategy.asset}
                      </div>
                      <div className="text-[#00D1A0] text-[14px]">
                        +0.00 in 1 year
                      </div>
                    </div>
                  </div>
                  <div className="text-[#9C9DA2] text-right font-inter text-[12px] font-normal leading-normal">
                    Balance:{" "}
                    <span className="text-[#D7E3EF] font-inter text-[12px] font-semibold leading-normal">
                      {selectedStrategy.balance.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Input field and percentage buttons in same row */}
                <div className="flex items-center gap-4 mb-6">
                  {/* Input field on the left with no borders */}
                  <div className="flex-grow ">
                    <div>
                      <input
                        type="text"
                        className="bg-transparent w-full border-none text-[20px] text-white font-medium outline-none"
                        value={withdrawAmount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Percentage buttons on the right */}
                  <div className="flex gap-2">
                    <button
                      className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2] font-inter text-[12px] font-normal"
                      onClick={() => handlePercentageClick(0.25)}
                    >
                      25%
                    </button>
                    <button
                      className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2] font-inter text-[12px] font-normal"
                      onClick={() => handlePercentageClick(0.5)}
                    >
                      50%
                    </button>
                    <button
                      className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2] font-inter text-[12px] font-normal"
                      onClick={() => handlePercentageClick(0.75)}
                    >
                      75%
                    </button>
                    <button
                      className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2] font-inter text-[12px] font-normal"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="flex justify-between py-4 mb-6 rounded-[4px] bg-[rgba(255,255,255,0.02)] px-6 items-center">
                  <div className="text-[#EDF2F8] font-inter text-[12px] font-normal leading-normal">
                    You Will Receive
                  </div>
                  <div className="text-[#EDF2F8] font-inter text-[16px] font-medium leading-normal">
                    {parseFloat(withdrawAmount || "0").toFixed(2)}{" "}
                    {selectedStrategy.asset}
                  </div>
                </div>

                <button
                  className={`w-full py-4 rounded-[4px] border border-[rgba(255,255,255,0.30)] flex justify-center items-center gap-[10px] text-center text-[16px] font-semibold ${
                    isWithdrawing || isApproving
                      ? "bg-[#2D2F3D] text-[#9C9DA2] cursor-not-allowed"
                      : "bg-[#B88AF8] text-[#080B17] hover:bg-[#9F6EE9] transition-colors"
                  }`}
                  onClick={isApproved ? handleWithdraw : handleApprove}
                  disabled={
                    isWithdrawing ||
                    isApproving ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > selectedStrategy.balance
                  }
                >
                  {isApproving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#9C9DA2]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Approving...
                    </>
                  ) : isWithdrawing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#9C9DA2]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Transaction in Progress
                    </>
                  ) : isApproved ? (
                    "Withdraw"
                  ) : (
                    "Approve"
                  )}
                </button>
                {errorMessage && (
                  <div className="flex justify-between items-center mt-4 bg-[rgba(239,68,68,0.1)] rounded-[4px] p-4">
                    <div className="text-[#EF4444] font-inter text-[14px]">
                      Transaction Failed
                    </div>
                    <div className="text-[#EF4444] font-inter text-[14px] underline">
                      #
                      {withdrawTxHash
                        ? withdrawTxHash.substring(0, 8) + "..."
                        : ""}
                    </div>
                  </div>
                )}
                {!errorMessage && withdrawTxHash && isWithdrawSuccess && (
                  <div className="flex justify-between items-center mt-4 bg-[rgba(0,209,160,0.1)] rounded-[4px] p-4">
                    <div className="text-[#00D1A0] font-inter text-[14px]">
                      Transaction Successful
                    </div>
                    <a
                      href={`https://sonicscan.org/tx/${withdrawTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D1A0] font-inter text-[14px] underline hover:text-[#00D1A0]/80"
                    >
                      #{withdrawTxHash.substring(0, 8)}...
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <div className="text-[#D7E3EF] text-[14px] rounded-[4px] bg-[rgba(255,255,255,0.02)] p-[24px]">
                  <strong>Note:</strong> By withdrawing, your vault shares will
                  be converted into the underlying asset, subject to the current
                  market rates. Withdrawal amounts are calculated based on the
                  latest market rates and may vary slightly due to price
                  fluctuations.
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioSubpage;
