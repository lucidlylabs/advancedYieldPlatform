import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { YieldDetailsView } from "@/components/yield-details-view";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import {
  type Address,
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
  getAddress,
} from "viem";
import {
  useAccount,
  useTransaction,
  useWriteContract,
  useChainId,
} from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../../config/env";
import { ERC20_ABI } from "../../config/abi/erc20";
import { SOLVER_ABI } from "../../config/abi/solver";

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

const assetOptions = [
  {
    name: "USDC",
    contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    image: "/images/icons/usdc.svg",
    decimal: 6,
  },
  {
    name: "USDS",
    contract: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
    image: "/images/icons/usds.svg",
    decimal: 18,
  },
  {
    name: "sUSDS",
    contract: "0x5875eEE11Cf8398102FdAd704C9E96607675467a",
    image: "/images/icons/sUSDS.svg",
    decimal: 18,
  },
];

const ExternalLinkIcon = () => (
  <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
  >
      <path
          d="M12.25 5.75L12.25 2.25M12.25 2.25H8.75M12.25 2.25L7.58333 6.91667M5.83333 3.41667H4.55C3.56991 3.41667 3.07986 3.41667 2.70552 3.60741C2.37623 3.77518 2.10852 4.0429 1.94074 4.37218C1.75 4.74653 1.75 5.23657 1.75 6.21667V9.95C1.75 10.9301 1.75 11.4201 1.94074 11.7945C2.10852 12.1238 2.37623 12.3915 2.70552 12.5593C3.07986 12.75 3.56991 12.75 4.55 12.75H8.28333C9.26342 12.75 9.75347 12.75 10.1278 12.5593C10.4571 12.3915 10.7248 12.1238 10.8926 11.7945C11.0833 11.4201 11.0833 10.9301 11.0833 9.95V8.66667"
          stroke="#9C9DA2"
          strokeLinecap="round"
          strokeLinejoin="round"
      />
  </svg>
);

const strategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
console.log("Strategy Config:", strategy);
const chainConfigs = {
  base: {
    rpc: "https://mainnet.base.org",
    chainId: 8453,
    image: "/images/logo/base.svg",
    chainObject: { tokens: strategy.base.tokens } 
  },
  ethereum: {
    rpc: "https://ethereum.llamarpc.com",
    chainId: 1,
    image: "/images/logo/eth.svg",
    chainObject: { tokens: strategy.ethereum.tokens }
  },
  arbitrum: {
    rpc: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    image: "/images/logo/arb.svg",
    chainObject: { tokens: strategy.arbitrum.tokens }
  },
};
console.log("chain configs:", chainConfigs);

const PortfolioDetailedPage = () => {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { contract ,asset ,type ,balance ,duration , solverAddress, boringVaultAddress , rpc } = router.query;

  const [depositSuccess, setDepositSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [strategiesWithBalance, setStrategiesWithBalance] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}` | null>(
    null
  );
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"withdraw" | "request">("withdraw");
  const [requestTab, setRequestTab] = useState<"pending" | "completed">("pending");
  const [amountOut, setAmountOut] = useState<string | null>(null);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  // Add state for custom dropdown
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [depositedChains, setDepositedChains] = useState<string[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);

  const chainId = useChainId();
  const isBase = chainId === 8453;

  // Initialize `withdrawAmount` from query param
  useEffect(() => {
    if (router.query.balance && typeof router.query.balance === "string") {
      setWithdrawAmount(router.query.balance.toString());
    }
  }, [router.query.balance]);

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

  const chainIconMap: Record<string, { src: string; label: string }> = {
      ethereum: {
        src: "/images/logo/eth.svg",
        label: "Ethereum",
      },
      base: {
        src: "/images/logo/base.svg",
        label: "Base",
      },
      arbitrum: {
        src: "/images/logo/arb.svg",
        label: "Arbitrum",
      },
    };

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
            // console.error("Error refreshing balances:", error);
            setErrorMessage("Failed to refresh balances.");
            setIsRefreshingBalance(false);
          });
        setWithdrawAmount("");
      }
    }
  }, [isWaitingForWithdraw, isWithdrawing, isWithdrawSuccess, withdrawTxHash]);

  useEffect(() => {
      if (approvalHash && isApprovalSuccess) {
        setIsApproved(true);
        setIsApproving(false);
        console.log("Approval successful:");
      } else if(approvalHash && !isWaitingForApproval && !isApprovalSuccess) {
        setErrorMessage("Approval transaction failed");
        setIsApproving(false);
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
        console.log(`Checking chain balance: ${balance}`);
        
        const formattedBalance = parseFloat(formatUnits(balance as bigint, decimals as number));
        
        return formattedBalance;
      } catch (error) {
        // console.error("Error reading boring vault:", error);
        setErrorMessage("Failed to read vault balance.");
        return 0;
      }
    } catch (error) {
      // console.error("Error checking balance for strategy:", strategy, error);
      setErrorMessage("Failed to check strategy balance.");
      return 0;
    }
  };

  const checkAllBalances = async () => {
    if (!address) return;

    try {
      setIsRefreshingBalance(true);
      const allStrategies = [
        ...Object.entries(USD_STRATEGIES as unknown as StrategyAsset).flatMap(([duration, strategies]) =>
          Object.entries(strategies as StrategyDuration).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "USD"
          }))
        ),
        ...Object.entries(BTC_STRATEGIES as unknown as StrategyAsset).flatMap(([duration, strategies]) =>
          Object.entries(strategies as StrategyDuration).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "BTC"
          }))
        ),
        ...Object.entries(ETH_STRATEGIES as unknown as StrategyAsset).flatMap(([duration, strategies]) =>
          Object.entries(strategies as StrategyDuration).map(([type, strategy]) => ({
            ...strategy,
            duration,
            type: type.toLowerCase(),
            asset: "ETH"
          }))
        ),
      ];

      const balances = await Promise.all(
        allStrategies.map(async (strategy) => {
          const balance = await checkStrategyBalance(strategy);
          return { ...strategy, balance };
        })
      );
      setStrategiesWithBalance(balances.filter((s) => s.balance > 0));
    } catch (error) {
      // console.error("Error checking all balances:", error);
      setErrorMessage("Failed to fetch all balances.");
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
    if (!contract || !withdrawAmount || !address) return;
  
    try {
      setIsApproving(true);
      setErrorMessage(null);
      setApprovalHash(null); 
    
      console.log("Approval details:", {
        solverAddress,
        boringVaultAddress,
        address
      });
  
      const client = createPublicClient({
        transport: http(Array.isArray(rpc) ? rpc[0] : rpc || "https://base.llamarpc.com"),
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
        address: boringVaultAddress as Address,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;
  
      const sharesAmount = parseUnits(withdrawAmount, decimals);
  
      console.log("Requesting approval for amount:", sharesAmount.toString());
  
      // Approve the solver to spend the vault tokens
      const approveTx = await writeContract({
        address: boringVaultAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [solverAddress as `0x${string}`, sharesAmount],
        chainId: 8453,
        account: address,
      });
  
      if (approveTx && typeof approveTx === "string" && approveTx.startsWith("0x")) {
        setApprovalHash(approveTx as `0x${string}`);
        console.log("Approval transaction submitted:", approveTx);
      } else {
        throw new Error("Failed to get approval transaction hash");
      }
    } catch (error: any) {
      console.error("Approval failed:", error);
      if (error.code === 4001) {
        setErrorMessage("Approval cancelled by user.");
      } else {
        setErrorMessage(error.message || "Approval transaction failed");
      }
      setIsApproving(false); 
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount || !address || !isApproved) return;

    try {
      setIsWithdrawing(true);
      setErrorMessage(null);
      const assetOutAddress = "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc" as Address;

      const client = createPublicClient({
        transport: http(Array.isArray(rpc) ? rpc[0] : rpc || "https://base.llamarpc.com"),
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
        address: boringVaultAddress as Address,
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
        address: solverAddress as Address,
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
    } catch (error: any) {
      if (error.code === 4001) {
        setErrorMessage("Withdrawal cancelled by user.");
      } else {
        setErrorMessage("Withdrawal failed. Please try again.");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (contract) {
      const amount = balance !== undefined ? (Number(balance) * percentage).toFixed(6) : "0.000000";
      setWithdrawAmount(amount);
    }
  };

  const handleMaxClick = () => {
    if (contract) {
      if (balance !== undefined) {
        setWithdrawAmount(balance.toString());
      }
    }
  };

  const getDepositedChainsViem = async ({
    userAddress,
    strategy,
    chainConfigs,
  }: {
    userAddress: Address;
    strategy: any;
    chainConfigs: Record<
      string,
      {
        rpc: string;
        chainId: number;
        image: string;
        chainObject: any;
      }
    >;
  }): Promise<string[]> => {
    const depositedChains: string[] = [];
  
    for (const [chainKey, chain] of Object.entries(chainConfigs)) {
      try {
        const client = createPublicClient({
          transport: http(chain.rpc),
          chain: chain.chainObject,
        });
  
        const decimals = strategy.shareAddress_token_decimal ?? 18;
  
        const balance = await client.readContract({
          address: strategy.shareAddress as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [userAddress],
        });
  
        const formatted = Number(formatUnits(balance as bigint, decimals));
        
        console.log(`[${chainKey}] Balance: ${formatted}`);

        if (formatted > 0) {
          depositedChains.push(chainKey);
        }
      } catch (err) {
        console.error(`Error on ${chainKey}:`, err);
      }
    }
  
    return depositedChains;
  };

  useEffect(() => {
    const fetchDeposits = async () => {   
       if (!address || !strategy || !chainConfigs) {
      console.log("Missing required data:", { address, strategy, chainConfigs });
      return;
      }  
      console.log("Fetching deposits with:", { address, strategy, chainConfigs });

      const depositedOn = await getDepositedChainsViem({
        userAddress: address as Address,
        strategy,
        chainConfigs,
      });
  
      setDepositedChains(depositedOn);
      console.log("Deposited on:", depositedOn);  
    };
    fetchDeposits();
  }, [address,strategy,chainConfigs]);

  useEffect(() => {
    const fetchAmountOut = async () => {
      if (!router.isReady || !contract || !withdrawAmount) return;
  
      try {
        const normalizedRpc = Array.isArray(rpc) ? rpc[0] : (rpc as string || "https://base.llamarpc.com");
        console.log("🧪 Debug fetchAmountOut");
        console.log("contract:", contract);
        console.log("withdrawAmount:", withdrawAmount);
        console.log("solverAddress:", solverAddress);
        console.log("boringVaultAddress:", boringVaultAddress);
        console.log("rpc:", normalizedRpc);

        const selectedAssetAddress = getAddress(assetOptions[selectedAssetIdx].contract);

        const client = createPublicClient({
          transport: http(normalizedRpc),
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

        //Get decimals of the vault
        const decimals = (await client.readContract({
          address: boringVaultAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })) as number;
  
        //Convert withdrawAmount to uint128 (BigInt)
        const shares = parseUnits(withdrawAmount, decimals); 
        const discount = 0;
  
        //Call the previewAssetsOut
        const result = (await client.readContract({
          address: solverAddress as Address,
          abi: SOLVER_ABI,
          functionName: "previewAssetsOut",
          args: [
            selectedAssetAddress,
            shares,
            discount,
          ],
        }));
  
        setAmountOut(result.toString());
      } catch (err) {
        console.error("Error reading previewAssetsOut:", err);
        setAmountOut(null);
      }
    };
  
    fetchAmountOut();
  }, [router.isReady, contract, withdrawAmount]);


  return (
    <>
      <button className="text-lg text-white" onClick={() => router.back()}>
      <ArrowLeft className="absolute top-4 left-4" />
      </button>
      <div className="py-4 mt-4 px-4">
        <div className="flex flex-col h-full rounded-lg">
          <div className="flex gap-4 mb-6 border-b border-[rgba(255,255,255,0.15)]">
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`px-4 py-2 text-[14px] font-semibold transition-colors ${
                activeTab === "withdraw"
                  ? "text-white border-b-2 border-[#B88AF8]"
                  : "text-[#9C9DA2]"
              }`}
            >
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab("request")}
              className={`px-4 py-2 text-[14px] font-semibold transition-colors ${
                activeTab === "request"
                  ? "text-white border-b-2 border-[#B88AF8]"
                  : "text-[#9C9DA2]"
              }`}
            >
              Request
            </button>
          </div>
          {activeTab === "withdraw" && (
            <>
            <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
            {/* Header with strategy info and balance */}
            <div className="flex items-center justify-between p-4  bg-[rgba(255,255,255,0.02)] mb-6 border-b border-[rgba(255,255,255,0.15)]">
              <div className="flex items-center gap-4">
                <Image
                  src={`/images/icons/${typeof asset === "string" ? asset.toLowerCase() : ""}-${
                      type === "stable"
                      ? "stable"
                      : "incentive"
                  }.svg`}
                  alt={typeof asset === "string" ? asset : ""}
                  width={40}
                  height={40}
                />
                <div>
                  <div className="text-white font-semibold">
                    {type === "stable"
                      ? "Base Yield"
                      : "Incentive Maxi"}{" "}
                    {asset}
                  </div>
                  <div className="text-[#00D1A0] text-[14px]">
                    +0.00 in 1 year
                  </div>
                </div>
              </div>
              <div className="text-[#9C9DA2] text-right   text-[12px] font-normal leading-normal">
                Balance:{" "}
                <span className="text-[#D7E3EF] text-[12px] font-semibold leading-normal">
                  {typeof balance === "string" ? parseFloat(balance).toFixed(4) : ""}
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
                  className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2]   text-[12px] font-normal"
                  onClick={() => handlePercentageClick(0.25)}
                >
                  25%
                </button>
                <button
                  className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2]   text-[12px] font-normal"
                  onClick={() => handlePercentageClick(0.5)}
                >
                  50%
                </button>
                <button
                  className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2]   text-[12px] font-normal"
                  onClick={() => handlePercentageClick(0.75)}
                >
                  75%
                </button>
                <button
                  className="bg-[#0F111A] rounded-lg border border-[#1E2337] py-1 px-2 text-[#9C9DA2]   text-[12px] font-normal"
                  onClick={handleMaxClick}
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex justify-between py-4 mb-6 rounded-[4px] bg-[rgba(255,255,255,0.02)] px-6 items-center">
              <div className="text-[#EDF2F8]   text-[12px] font-normal leading-normal">
                You Will Receive
              </div>
              <div className="flex justify-end items-center gap-4">
                <div className="text-[#EDF2F8] text-[16px] font-medium leading-normal">
                  {formatUnits(amountOut ? BigInt(amountOut) : BigInt(0), 6)}{" "}
                </div>
                {assetOptions.length > 1 && (
                  <div className="">
                    <div className="relative w-full">
                      <button
                        onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                        className="flex items-center justify-between w-full bg-[#0D101C] text-[#EDF2F8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88AF8] border border-[rgba(255,255,255,0.19)]"
                      >
                        <div className="flex items-center gap-2">
                          {assetOptions[selectedAssetIdx]?.image && (
                            <img
                              src={assetOptions[selectedAssetIdx].image}
                              alt={assetOptions[selectedAssetIdx].name}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span>{assetOptions[selectedAssetIdx].name}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-200 ${
                            isAssetDropdownOpen ? "rotate-180" : "rotate-0"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>

                      {isAssetDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-[#1F202D] rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {assetOptions.map((opt, idx) => (
                            <button
                              key={opt.contract}
                              onClick={() => {
                                setSelectedAssetIdx(idx);
                                setIsAssetDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-[#EDF2F8] hover:bg-[#1A1B1E]"
                            >
                              {opt.image && (
                                <img
                                  src={opt.image}
                                  alt={opt.name}
                                  className="w-5 h-5 mr-2 rounded-full"
                                />
                              )}
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              className={`w-full py-4 rounded-[4px] border border-[rgba(255,255,255,0.30)] flex justify-center items-center gap-[10px] text-center text-[16px] font-semibold ${
                isWithdrawing || isApproving
                  ? "bg-[#2D2F3D] text-[#9C9DA2] cursor-not-allowed"
                  : "bg-[#B88AF8] text-[#080B17] hover:bg-[#9F6EE9] transition-colors"}
                  ${isBase ? "" : "bg-[#383941] text-[#9C9DA2] cursor-not-allowed hover:!bg-[#383941]"}
              }`}
              onClick={isApproved ? handleWithdraw : handleApprove}
              disabled={
                isWithdrawing ||
                isApproving ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                balance !== undefined && parseFloat(withdrawAmount) > Number(balance)
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

              ) : isWithdrawSuccess ?(
                "Request Another Withdraw"
              ) : isApproved ? (
                "Approved - Click to Withdraw"
              ) : !isBase ? (
                "Switch Network to Base"
              ) : (
                "Request Withdraw"
              )}
            </button>
            {errorMessage && (
              <div className="flex justify-between items-center mt-4 bg-[rgba(239,68,68,0.1)] rounded-[4px] p-4">
                <div className="text-[#EF4444]   text-[14px]">
                  {errorMessage}
                </div>
                <div className="text-[#EF4444]   text-[14px] underline">
                  #
                  {withdrawTxHash
                    ? withdrawTxHash.substring(0, 8) + "..."
                    : ""}
                </div>
              </div>
            )}
            {!errorMessage && withdrawTxHash && isWithdrawSuccess && (
              <div className="flex justify-between items-center mt-4 bg-[rgba(0,209,160,0.1)] rounded-[4px] p-4">
                <div className="text-[#00D1A0]   text-[14px]">
                  Transaction Successful
                </div>
                <a
                  href={`https://sonicscan.org/tx/${withdrawTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00D1A0]   text-[14px] underline hover:text-[#00D1A0]/80"
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
            </>
          )}

          {activeTab === "request" && (
            <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
            {/* Tabs */}
            <div className="mb-4 flex gap-6 border-b border-[#1A1B1E]">
              <button
                className={`py-2 text-[14px] font-medium ${
                  requestTab === "pending"
                    ? "text-white border-b-2 border-[#B88AF8]"
                    : "text-[#9C9DA2]"
                }`}
                onClick={() => setRequestTab("pending")}
              >
                Pending
              </button>
              <button
                className={`py-2 text-[14px] font-medium ${
                  requestTab === "completed"
                    ? "text-white border-b-2 border-[#B88AF8]"
                    : "text-[#9C9DA2]"
                }`}
                onClick={() => setRequestTab("completed")}
              >
                Completed
              </button>
            </div>

                  {/* Requests List */}
                  {requestTab === "pending" && (
                    <div className="space-y-4 text-white">
                      {isLoadingRequests ? (
                        <div>Loading...</div>
                      ) : withdrawRequests.length === 0 ? (
                        <div>No pending requests found.</div>
                      ) : (
                        withdrawRequests.map((req, idx) => {
                          const assetOption = assetOptions.find(
                            (opt) =>
                              opt.contract.toLowerCase() ===
                              (req.withdraw_asset_address || "").toLowerCase()
                          );
                          const assetImage = assetOption
                            ? assetOption.image
                            : "/images/icons/susd-stable.svg";
                          const assetDecimals = assetOption ? assetOption.decimal : 18;
                          return (
                            <div
                              key={req.request_id || idx}
                              className="bg-[rgba(255,255,255,0.02)] rounded-lg p-4 flex justify-between items-center"
                            >
                              <div className="flex items-center gap-4">
                                {/* Calendar Icon + Date */}
                                <div className="flex items-center text-[#9C9DA2] text-[13px] gap-1">
                                  <button
                                    className="text-[#9C9DA2] hover:text-white transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (req.transaction_hash) {
                                        window.open(
                                          `https://basescan.org/tx/${req.transaction_hash}`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      }
                                    }}
                                    type="button"
                                  >
                                    <ExternalLinkIcon />
                                  </button>
                                  {req.creation_time
                                    ? new Date(req.creation_time * 1000).toLocaleDateString()
                                    : "-"}
                                </div>

                                {/* Amounts row (same as completed) */}
                                <div className="flex items-center gap-2">
                                  {/* Shares pill */}
                                  <div className="flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-2">
                                    <a
                                      href={
                                        req.transaction_hash
                                          ? `https://basescan.org/tx/${req.transaction_hash}`
                                          : undefined
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      tabIndex={req.transaction_hash ? 0 : -1}
                                      style={{
                                        pointerEvents: req.transaction_hash ? "auto" : "none",
                                      }}
                                    >
                                      <Image
                                        src="/images/icons/syUSD.svg"
                                        alt="Shares"
                                        width={32}
                                        height={32}
                                        className="cursor-pointer"
                                      />
                                    </a>
                                    <span className="text-white text-sm font-medium">
                                    {(Number(req.amount_of_shares) / 1e6).toFixed(2)}
                                    </span>
                                  </div>
                                  {/* Arrow */}
                                  <span className="text-[#9C9DA2] text-sm">→</span>
                                  {/* Assets pill */}
                                  <div className="flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-2">
                                    <span className="text-white text-sm font-medium">
                                      {(Number(req.amount_of_assets) / Math.pow(10, assetDecimals)).toFixed(2)}
                                    </span>
                                    <Image
                                      src={assetImage}
                                      alt="Assets"
                                      width={32}
                                      height={32}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Cancel Button */}
                              {/* <button className="text-[#F87171] text-[13px] font-medium hover:underline">
                                Cancel Request
                              </button> */}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {requestTab === "completed" && (
                    <div className="space-y-4 text-white">
                      {isLoadingRequests ? (
                        <div>Loading...</div>
                      ) : completedRequests.length === 0 ? (
                        <div>No completed requests found.</div>
                      ) : (
                        completedRequests.map((req, idx) => {
                          const assetOption = assetOptions.find(
                            (opt) =>
                              opt.contract.toLowerCase() ===
                              (req.withdraw_asset_address || "").toLowerCase()
                          );
                          const assetImage = assetOption
                            ? assetOption.image
                            : "/images/icons/susd-stable.svg";
                          const assetDecimals = assetOption ? assetOption.decimal : 18;
                          return (
                            <div
                              key={req.request_id || idx}
                              className="bg-[rgba(255,255,255,0.02)] rounded-lg p-4 flex justify-between items-center"
                            >
                              <div className="flex items-center gap-4">
                                {/* Calendar Icon + Date */}
                                <div className="flex items-center text-[#9C9DA2] text-[13px] gap-1">
                                  <button
                                    className="text-[#9C9DA2] hover:text-white transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (req.transaction_hash) {
                                        window.open(
                                          `https://basescan.org/tx/${req.transaction_hash}`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      }
                                    }}
                                    type="button"
                                  >
                                    <ExternalLinkIcon />
                                  </button>
                                  {req.creation_time
                                    ? new Date(req.creation_time * 1000).toLocaleDateString()
                                    : "-"}
                                </div>

                                {/* Amounts row (same as completed) */}
                                <div className="flex items-center gap-2">
                                  {/* Shares pill */}
                                  <div className="flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-2">
                                    <a
                                      href={
                                        req.transaction_hash
                                          ? `https://basescan.org/tx/${req.transaction_hash}`
                                          : undefined
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      tabIndex={req.transaction_hash ? 0 : -1}
                                      style={{
                                        pointerEvents: req.transaction_hash ? "auto" : "none",
                                      }}
                                    >
                                      <Image
                                        src="/images/icons/syUSD.svg"
                                        alt="Shares"
                                        width={32}
                                        height={32}
                                        className="cursor-pointer"
                                      />
                                    </a>
                                    <span className="text-white text-sm font-medium">
                                    {(Number(req.amount_of_shares) / 1e6).toFixed(2)}
                                    </span>
                                  </div>
                                  {/* Arrow */}
                                  <span className="text-[#9C9DA2] text-sm">→</span>
                                  {/* Assets pill */}
                                  <div className="flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-2">
                                    <span className="text-white text-sm font-medium">
                                      {(Number(req.amount_of_assets) / Math.pow(10, assetDecimals)).toFixed(2)}
                                    </span>
                                    <Image
                                      src={assetImage}
                                      alt="Assets"
                                      width={32}
                                      height={32}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default PortfolioDetailedPage;