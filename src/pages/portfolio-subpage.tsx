import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  useAccount,
  useTransaction,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import {
  type Address,
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
} from "viem";

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

const VAULT_ABI = [
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "redeem",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
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
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [strategiesWithBalance, setStrategiesWithBalance] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}` | null>(
    null
  );
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

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
      // Validate contract address
      if (
        !strategy.contract ||
        strategy.contract === "0x0000000000000000000000000000000000000000"
      ) {
        console.warn("Invalid contract address for strategy:", strategy);
        return 0;
      }

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
      console.error("Error checking balance for strategy:", strategy, error);
      return 0;
    }
  };

  const checkAllBalances = async () => {
    if (!address) return;

    try {
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

      // Filter out strategies with invalid contract addresses
      const validStrategies = allStrategies.filter(
        (strategy) =>
          strategy.contract &&
          strategy.contract !== "0x0000000000000000000000000000000000000000"
      );

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
          return { ...strategy, balance };
        })
      );

      setStrategiesWithBalance(
        strategiesWithBalances.filter((s) => s.balance > 0)
      );
    } catch (error) {
      console.error("Error checking all balances:", error);
      throw error;
    }
  };

  // Check balances for all strategies
  useEffect(() => {
    checkAllBalances();
  }, [address]);

  // Use wagmi's useWriteContract hook
  const { writeContractAsync: writeContract } = useWriteContract();

  const handleWithdraw = async () => {
    if (!selectedStrategy || !withdrawAmount || !address) return;

    try {
      setIsWithdrawing(true);

      // Get the contract address from the selected strategy
      const contractAddress = selectedStrategy.contract as Address;

      // Create a client to interact with the contract
      const client = createPublicClient({
        transport: http(selectedStrategy.rpc),
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
            default: { http: [selectedStrategy.rpc] },
            public: { http: [selectedStrategy.rpc] },
          },
        },
      });

      // Get the decimals from the contract
      const decimals = (await client.readContract({
        address: contractAddress,
        abi: VAULT_ABI,
        functionName: "decimals",
      })) as number;

      console.log(`Contract decimals: ${decimals}`);

      // Parse the withdraw amount with proper decimals
      const sharesAmount = parseUnits(withdrawAmount, decimals);

      console.log("Withdrawing from contract:", {
        contract: contractAddress,
        shares: sharesAmount.toString(),
        receiver: address,
        owner: address,
        decimals,
      });

      try {
        // Call the redeem function on the contract
        const tx = await writeContract({
          address: contractAddress,
          abi: VAULT_ABI,
          functionName: "redeem",
          args: [sharesAmount, address, address],
          chainId: 146, // Sonic chain ID
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
        setIsWithdrawing(false);
        // Show error to user
        alert("Withdrawal failed. Please try again.");
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      setIsWithdrawing(false);
      alert("Error preparing withdrawal. Please try again.");
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

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSlippage(value);
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
              <div className="text-[#00D1A0] font-inter text-[16px] font-normal leading-normal mt-1">
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
          <div className="text-[#D7E3EF] font-mono opacity-20">
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
            {strategiesWithBalance.length > 0 ? (
              strategiesWithBalance.map((strategy, index) => (
                <div
                  key={`${strategy.asset}-${strategy.duration}-${strategy.type}`}
                  className={`grid grid-cols-12 items-center py-4 pl-4 pr-6 relative ${
                    index % 2 === 0 ? "bg-transparent" : strategy.type === "stable" ? "bg-[#0D101C]" : "bg-[#090C17]"
                  } cursor-pointer transition-colors group`}
                  onClick={() => handleStrategySelect(strategy)}
                >
                  <div
                    className={`absolute left-0 top-0 h-full w-1/4 bg-gradient-to-r from-[rgba(0,209,160,0.15)] to-[rgba(153,153,153,0)] opacity-0 group-hover:opacity-100 ${
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
                    isWithdrawing
                      ? "bg-[#2D2F3D] text-[#9C9DA2] cursor-not-allowed"
                      : "bg-[#B88AF8] text-[#080B17] hover:bg-[#9F6EE9] transition-colors"
                  }`}
                  onClick={handleWithdraw}
                  disabled={
                    isWithdrawing ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > selectedStrategy.balance
                  }
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>

              {isWithdrawing && (
                <div className="mt-4 bg-[#13161F] rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="text-[#9C9DA2]">Transaction InProgress</div>
                    <div className="text-[#B88AF8]">
                      #
                      {withdrawTxHash
                        ? withdrawTxHash.substring(0, 8) + "..."
                        : ""}
                    </div>
                  </div>
                  {/* Progress indicator */}
                  <div className="w-full h-1 bg-[#2D2F3D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#B88AF8] animate-pulse"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <div className="text-[#9C9DA2] text-[14px] rounded-[4px] bg-[rgba(255,255,255,0.02)] p-[24px]">
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
