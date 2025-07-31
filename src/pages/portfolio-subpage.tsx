import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  useAccount,
  useTransaction,
  useWriteContract,
  useChainId,
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
  getAddress,
} from "viem";
import { useRouter } from "next/router";

const InfoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 640;
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
// } from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { setNonce } from "viem/actions";

interface NetworkConfig {
  tokens: Array<{
    name: string;
    contract: string;
    decimal: number;
    image: string;
  }>;
}

interface TokenConfig {
  name: string;
  contract: string;
  decimal: number;
  image: string;
}

interface ChainConfig {
  tokens: TokenConfig[];
  image?: string; // Add optional image property for chain
  rpc: string;
  chainId: number;
  chainObject: {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      decimals: number;
      name: string;
      symbol: string;
    };
    rpcUrls: {
      default: { http: string[] };
      public: { http: string[] };
    };
  };
}

interface StrategyConfig {
  network: string;
  contract: string;
  base: ChainConfig;
  ethereum: ChainConfig;
  arbitrum: ChainConfig;
  katana: ChainConfig; // <-- Add this line
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc?: string;
  show_cap: boolean;
  filled_cap: string;
  cap_limit: string;
  boringVaultAddress?: string;
  rateProvider: string;
  shareAddress: string;
}

interface BaseStrategyConfig {
  network: string;
  contract: string;
  boringVaultAddress: string;
  solverAddress: string;
  shareAddress: string;
  shareAddress_token_decimal: number;
  rateProvider: string;
  base: NetworkConfig;
  ethereum: NetworkConfig;
  arbitrum: NetworkConfig;
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc: string;
  show_cap: boolean;
  filled_cap: string;
  cap_limit: string;
}

interface IncentiveStrategyConfig {
  network: string;
  comingSoon: boolean;
  contract: string;
  deposit_token: string;
  deposit_token_contract: string;
  tvl: string;
  rpc: string;
  description: string;
  apy: string;
  incentives: string;
}

interface StrategyDuration {
  STABLE: BaseStrategyConfig;
  INCENTIVE: IncentiveStrategyConfig;
}

// Mock data for stacked chart
const chartData = [
  { date: "FEB 24", base: 2, incentive: 1 },
  { date: "FEB 24", base: 2.5, incentive: 0.8 },
  { date: "FEB 24", base: 3, incentive: 1.2 },

  { date: "MAR 24", base: 4, incentive: 1.4 },
  { date: "MAR 24", base: 4.5, incentive: 1.6 },
  { date: "MAR 24", base: 5, incentive: 1.8 },

  { date: "APR 24", base: 6.2, incentive: 2 },
  { date: "APR 24", base: 6.8, incentive: 2.5 },
  { date: "APR 24", base: 7.1, incentive: 2.7 },

  { date: "MAY 24", base: 8.2, incentive: 3 },
  { date: "MAY 24", base: 9.4, incentive: 2.8 },

  { date: "JUN 24", base: 10.2, incentive: 3.4 },
  { date: "JUN 24", base: 10.8, incentive: 3.7 },

  { date: "JUL 24", base: 12, incentive: 4.2 },
  { date: "JUL 24", base: 13, incentive: 4.8 },

  { date: "AUG 24", base: 14.5, incentive: 5.5 },
  { date: "AUG 24", base: 15.5, incentive: 6.2 },

  { date: "SEP 24", base: 18, incentive: 6.8 },
  { date: "SEP 24", base: 19.5, incentive: 7 },

  { date: "OCT 24", base: 21, incentive: 8 },
  { date: "OCT 24", base: 23, incentive: 8.4 },

  { date: "NOV 24", base: 27, incentive: 8.6 },
  { date: "NOV 24", base: 28, incentive: 9 },

  { date: "DEC 24", base: 30, incentive: 9.6 },
  { date: "DEC 24", base: 32, incentive: 10 },

  { date: "JAN 24", base: 34, incentive: 10.4 },
  { date: "JAN 24", base: 36, incentive: 10.9 },
];

// Mock data for the table rows
export const tableData = [
  {
    id: 1,
    name: "Base Yield ETH",
    expiry: "29th March 2025",
    expiresIn: "20 days to Expire",
    apy: "6.64%",
    currentBalance: "$115,447.00",
    change: "+$100.00 (10%)",
    changeColor: "text-green-400",
    period: "+0.00 in 1 year",
    icon: "/icons/eth-icon.svg", // Use appropriate path or emoji
  },
  {
    id: 2,
    name: "Incentive Maxi ETH",
    expiry: "16th February 2025",
    expiresIn: "7 days to Expire",
    apy: "23.43%",
    currentBalance: "$343,504,807.10",
    change: "-$100.00 (10%)",
    changeColor: "text-red-400",
    period: "+0.00 in 1 year",
    icon: "/icons/eth-icon.svg",
  },
];

interface StrategyAsset {
  [key: string]: StrategyDuration;
}

const requests = [
  {
    date: "18th May'25",
    fromAmount: "1,000,000",
    toAmount: "1,004,000",
    canCancel: true,
  },
  {
    date: "19th May'25",
    fromAmount: "100",
    toAmount: "104",
    canCancel: true,
  },
  {
    date: "19th May'25",
    fromAmount: "900",
    toAmount: "909",
    canCancel: true,
  },
  {
    date: "19th May'25",
    fromAmount: "1,092",
    toAmount: "1,200",
    canCancel: true,
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

const strategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
const chainConfigs = {
  base: strategy.base,
  ethereum: strategy.ethereum,
  arbitrum: strategy.arbitrum,
};

const PortfolioSubpage: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
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
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"withdraw" | "request">(
    "withdraw"
  );
  const [requestTab, setRequestTab] = useState<"pending" | "completed">(
    "pending"
  );
  const [amountOut, setAmountOut] = useState<string | null>(null);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  // Add state for custom dropdown
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [depositedChains, setDepositedChains] = useState<string[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [usdApy, setUsdApy] = useState<string | null>(null);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [targetChain, setTargetChain] = useState<string>(
    chain?.name.toLowerCase() || "base"
  );
  const [cancelStatusMap, setCancelStatusMap] = useState<{ [key: string]: "idle" | "cancelling" | "cancelled" }>({});

  const chainId = useChainId();
  const isBase = chainId === 8453;

  const router = useRouter();

  const strategyConfigs = {
    USD: USD_STRATEGIES,
    BTC: BTC_STRATEGIES,
    ETH: ETH_STRATEGIES,
  };

  const getUniqueChainConfigs = useMemo(() => {
    const uniqueChains = new Map<
      string,
      { name: string; network: string; image: string }
    >();

    // Directly access the STABLE strategy within PERPETUAL_DURATION
    const stablePerpetualConfig = USD_STRATEGIES.PERPETUAL_DURATION
      .STABLE as StrategyConfig;

    if (stablePerpetualConfig) {
      if (stablePerpetualConfig.base && stablePerpetualConfig.base.image) {
        uniqueChains.set("base", {
          name: "Base",
          network: "base",
          image: stablePerpetualConfig.base.image,
        });
      }
      if (
        stablePerpetualConfig.ethereum &&
        stablePerpetualConfig.ethereum.image
      ) {
        uniqueChains.set("ethereum", {
          name: "Ethereum",
          network: "ethereum",
          image: stablePerpetualConfig.ethereum.image,
        });
      }
      if (
        stablePerpetualConfig.arbitrum &&
        stablePerpetualConfig.arbitrum.image
      ) {
        uniqueChains.set("arbitrum", {
          name: "Arbitrum",
          network: "arbitrum",
          image: stablePerpetualConfig.arbitrum.image,
        });
      }
      if (stablePerpetualConfig.katana && stablePerpetualConfig.katana.image) {
        uniqueChains.set("katana", {
          name: "Katana",
          network: "katana",
          image: stablePerpetualConfig.katana.image,
        });
      }
    }

    // Optionally, you can add other durations if they also define chain images
    // For example:
    // const stable30DaysConfig = USD_STRATEGIES["30_DAYS"].STABLE as StrategyConfig;
    // if (stable30DaysConfig && stable30DaysConfig.base && stable30DaysConfig.base.image) {
    //   uniqueChains.set("base", { name: "Base", network: "base", image: stable30DaysConfig.base.image });
    // }

    return Array.from(uniqueChains.values());
  }, [USD_STRATEGIES]);

  // Watch deposit transaction
  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } =
    useTransaction({
      hash: transactionHash || undefined,
    });

  useEffect(() => {
      const apyUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.apy;
      if (typeof apyUrl === "string" && apyUrl.startsWith("http")) {
        fetch(apyUrl)
          .then(res => res.json())
          .then(data => {
            const trailingApy = data?.result?.trailing_total_APY;
            if (typeof trailingApy === "number") {
              setUsdApy(`${trailingApy.toFixed(2)}%`);
            }
          })
          .catch(() => setUsdApy(null));
      }
    }, []);

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
        setSelectedStrategy(null);
        setWithdrawAmount("");
      }
    }
  }, [isWaitingForWithdraw, isWithdrawing, isWithdrawSuccess, withdrawTxHash]);

  useEffect(() => {
    if (approvalHash && isApprovalSuccess) {
      setIsApproved(true);
      setIsApproving(false);
      console.log("Approval successful:");
    } else if (approvalHash && !isWaitingForApproval && !isApprovalSuccess) {
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
        strategy.boringVaultAddress ===
          "0x0000000000000000000000000000000000000000"
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

        const formattedBalance = parseFloat(
          formatUnits(balance as bigint, decimals as number)
        );

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
        ...Object.entries(USD_STRATEGIES as unknown as StrategyAsset).flatMap(
          ([duration, strategies]) =>
            Object.entries(strategies as StrategyDuration).map(
              ([type, strategy]) => ({
                ...strategy,
                duration,
                type: type.toLowerCase(),
                asset: "USD",
              })
            )
        ),
        ...Object.entries(BTC_STRATEGIES as unknown as StrategyAsset).flatMap(
          ([duration, strategies]) =>
            Object.entries(strategies as StrategyDuration).map(
              ([type, strategy]) => ({
                ...strategy,
                duration,
                type: type.toLowerCase(),
                asset: "BTC",
              })
            )
        ),
        ...Object.entries(ETH_STRATEGIES as unknown as StrategyAsset).flatMap(
          ([duration, strategies]) =>
            Object.entries(strategies as StrategyDuration).map(
              ([type, strategy]) => ({
                ...strategy,
                duration,
                type: type.toLowerCase(),
                asset: "ETH",
              })
            )
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
    if (!selectedStrategy || !withdrawAmount || !address) return;

    try {
      setIsApproving(true);
      setErrorMessage(null);
      setApprovalHash(null);

      const solverAddress = selectedStrategy.solverAddress as Address;
      const vaultAddress = selectedStrategy.boringVaultAddress as Address;

      console.log("Approval details:", {
        solverAddress,
        vaultAddress,
        address,
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

      if (
        approveTx &&
        typeof approveTx === "string" &&
        approveTx.startsWith("0x")
      ) {
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
    if (!selectedStrategy || !withdrawAmount || !address || !isApproved) return;

    try {
      setIsWithdrawing(true);
      setErrorMessage(null);

      const solverAddress = selectedStrategy.solverAddress as Address;
      const vaultAddress = selectedStrategy.boringVaultAddress as Address;
      const assetOutAddress = assetOptions[selectedAssetIdx].contract as Address;

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
          secondsToDeadline: secondsToDeadline.toString(),
        },
        types: {
          assetOut: typeof assetOutAddress,
          amountOfShares: typeof amountOfShares,
          discount: typeof discount,
          secondsToDeadline: typeof secondsToDeadline,
        },
      });

      const tx = await writeContract({
        address: solverAddress,
        abi: SOLVER_ABI,
        functionName: "requestOnChainWithdraw",
        args: [assetOutAddress, amountOfShares, discount, secondsToDeadline],
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

  const handleCancel = async (requestId : string) => {
    if (!selectedStrategy || !address) return;
    console.log("Cancelling request with ID:", requestId);
  
    try {
      setIsCancelling(true);
      setErrorMessage(null);
      setCancelStatusMap(prev => ({ ...prev, [requestId]: "cancelling" })); 
  
      const solverAddress = selectedStrategy.solverAddress as Address;

      console.log("Cancel details:", {
        solverAddress,
        requestId,
        address,
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

      // Find the complete request data from withdrawRequests using request_id
      const requestToCancel = withdrawRequests.find(
        (req) => req.request_id === requestId
      );

      if (!requestToCancel) {
        throw new Error("Request not found in pending requests");
      }
  
      console.log("Found request to cancel:", requestToCancel);

      const assetOption = assetOptions.find(
        (opt) =>
          opt.contract.toLowerCase() ===
          (requestToCancel.withdraw_asset_address || "").toLowerCase()
      );

      if (!assetOption) {
        throw new Error("Asset not found for this request");
      }

    const request = {
      nonce: BigInt("46"), // uint64
      user: address as `0x${string}`, // address
      assetOut: requestToCancel.withdraw_asset_address as `0x${string}`, // address
      amountOfShares: BigInt(requestToCancel.amount_of_shares || 0), // uint128
      amountOfAssets: BigInt(requestToCancel.amount_of_assets || 0), // uint128
      creationTime: Number(requestToCancel.creation_time || 0), // uint40
      secondsToMaturity: Number(requestToCancel.seconds_to_maturity || 60), // uint24 - might need to be fetched from contract
      secondsToDeadline: 3600, // uint24 - might need to be fetched from contract
    };
      
      console.log("Debug - Cancel contract call parameters:", {
        functionName: "cancelOnChainWithdraw",
        contractAddress: solverAddress,
        request: {
          nonce: request.nonce.toString(),
          user: request.user,
          assetOut: request.assetOut,
          amountOfShares: request.amountOfShares.toString(),
          amountOfAssets: request.amountOfAssets.toString(),
          creationTime: request.creationTime,
          secondsToMaturity: request.secondsToMaturity,
          secondsToDeadline: request.secondsToDeadline,
        },
      });
          const cancelTx = await writeContract({
            address: solverAddress,
            abi: SOLVER_ABI,
            functionName: "cancelOnChainWithdraw",
            args: [request],
            chainId: 8453,
            account: address,
          });

          if (cancelTx && typeof cancelTx === "string" && cancelTx.startsWith("0x")) {
            console.log("Cancel transaction submitted:", cancelTx);
            setCancelStatusMap(prev => ({ ...prev, [requestId]: "cancelled" }));

            // Refresh the requests after successful cancellation
            setTimeout(() => {
              fetchWithdrawRequests("", address);
            }, 2000);
          } else {
            throw new Error("Failed to get cancel transaction hash");
          }
        } catch (error: any) {
          console.error("Cancel failed:", error);
          setCancelStatusMap(prev => ({ ...prev, [requestId]: "idle" }));
          if (error.code === 4001) {
            setErrorMessage("Cancel cancelled by user.");
          } else {
            setErrorMessage(error.message || "Cancel transaction failed");
          }
        } finally {
          setIsCancelling(false);
        }
  };

  // Handler for row clicks
  const handleStrategySelect = (strategy: any) => {
    console.log("strategy",strategy)
    if (isMobile()) {
        router.push({
          pathname: `/portfolio/${strategy.contract}`,
          query: { 
            strategy: strategy.contract,
            asset: strategy.asset,
            balance: strategy.balance,
            duration: strategy.duration,
            type: strategy.type,
            apy: strategy.apy,
            solverAddress: strategy.solverAddress,
            boringVaultAddress: strategy.boringVaultAddress,
            // tvl: strategy.tvl,
            // baseApy: strategy.baseYield,
            // contractAddress: strategy.contractAddress || "",
            // network: strategy.network || ""
          },
        });
    } else {
        setSelectedStrategy(strategy);
        setWithdrawAmount(strategy.balance.toString());
    }
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

  // const CustomXAxisTick = ({ x, y, payload, index, data }) => {
  //   const currentLabel = payload.value;
  //   const prevLabel = index > 0 ? data[index - 1]?.date : null;
  
  //   const showLabel = currentLabel !== prevLabel;
  
  //   return showLabel ? (
  //     <text x={x} y={y + 15} fill="#9C9DA2" fontSize={6}>
  //       {currentLabel}
  //     </text>
  //   ) : null;
  // };

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
        console.log("Missing required data:", {
          address,
          strategy,
          chainConfigs,
        });
        return;
      }
      console.log("Fetching deposits with:", {
        address,
        strategy,
        chainConfigs,
      });

      const depositedOn = await getDepositedChainsViem({
        userAddress: address as Address,
        strategy,
        chainConfigs,
      });

      setDepositedChains(depositedOn);
      console.log("Deposited on:", depositedOn);
    };
    fetchDeposits();
  }, [address, strategy, chainConfigs]);

  useEffect(() => {
    const fetchAmountOut = async () => {
      if (!selectedStrategy || !withdrawAmount) return;

      try {
        const solverAddress = selectedStrategy.solverAddress as Address;
        const vaultAddress = selectedStrategy.boringVaultAddress as Address;
        const selectedAssetAddress = getAddress(
          assetOptions[selectedAssetIdx].contract
        );
        console.log("rpc", selectedStrategy.rpc);
        console.log("solverAddress", solverAddress);
        console.log("vaultAddress", vaultAddress);

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

        //Get decimals of the vault
        const decimals = (await client.readContract({
          address: vaultAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })) as number;

        //Convert withdrawAmount to uint128 (BigInt)
        const shares = parseUnits(withdrawAmount, decimals);
        const discount = 0;

        //Call the previewAssetsOut
        const result = await client.readContract({
          address: solverAddress as Address,
          abi: SOLVER_ABI,
          functionName: "previewAssetsOut",
          args: [selectedAssetAddress, shares, discount],
        });

        setAmountOut(result.toString());
      } catch (err) {
        console.error("Error reading previewAssetsOut:", err);
        setAmountOut(null);
      }
    };

    fetchAmountOut();
  }, [selectedStrategy, withdrawAmount]);

  const fetchWithdrawRequests = async (
    vaultAddress: string,
    userAddress: string
  ) => {
    setIsLoadingRequests(true);
    try {
      const response = await fetch(
        `https://api.lucidly.finance/services/queueData?vaultAddress=0x279CAD277447965AF3d24a78197aad1B02a2c589&userAddress=${userAddress}`
      );
      const data = await response.json();
      console.log("response:" ,response)
      setWithdrawRequests(data.result?.PENDING || []);
      setCompletedRequests(data.result?.FULFILLED || []);
      console.log("API response:", data);
    } catch (error) {
      setWithdrawRequests([]);
      setCompletedRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (address) {
      console.log("withdrwaimg")
      fetchWithdrawRequests("", address);
    }
  }, [address]);

  useEffect(() => {
    console.log("Fetched withdraw requests:", withdrawRequests);
  }, [withdrawRequests]);

  // Call cacheQueueData API when withdrawal is successful
  useEffect(() => {
    if (isWithdrawSuccess && withdrawTxHash && address) {
      const vaultAddress = "0x279CAD277447965AF3d24a78197aad1B02a2c589";
      const apiUrl = `https://api.lucidly.finance/services/cacheQueueData?vaultAddress=${vaultAddress}&userAddress=${address}`;
      fetch(apiUrl, { method: "GET" })
        .then((res) => res.json())
        .then((data) => {
          console.log("cacheQueueData API called after withdraw success:", data);
        })
        .catch((err) => {
          console.error("Error calling cacheQueueData API:", err);
        });
    }
  }, [isWithdrawSuccess, withdrawTxHash, address]);

  return (
    <div className="flex flex-col min-h-screen text-white">
      {/* Top Section - Portfolio Value, PNL, and Wallet */}
      <div className="flex flex-col sm:flex-row w-full py-4 items-center justify-between px-8 bg-[#0D101C] border-b border-[rgba(255,255,255,0.1)]">
        <div>
          <div className="flex gap-32">
            <div className="flex flex-col">
              <div className="text-[#9C9DA2]   text-[14px] font-normal leading-[16px]">
                Portfolio
              </div>
              <div className="text-[#D7E3EF]   text-[24px] font-semibold leading-normal mt-1">
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
              <div className="text-[#9C9DA2]   text-[14px] font-normal leading-[16px]">
                PNL
              </div>
              <div className="text-[#00D1A0]   text-[16px] font-normal leading-normal mt-3">
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
        <div className="flex flex-col w-full sm:w-auto justify-center items-center gap-2 py-[10px] px-4 rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
            Wallet Address
          </div>
          <div className="text-[#D7E3EF] font-mono opacity-80 text-xs sm:text-md">
            {isConnected ? address : "Not connected"}
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1">
        {/* Left Side - Assets Table */}
        <div className="w-full sm:w-1/2 border-r border-[rgba(255,255,255,0.1)] pt-8 px-4 sm:pl-8">
          <div className="mb-6">
            <div className="text-[rgba(255,255,255,0.70)]   text-[16px] font-bold uppercase">
              Total Portfolio Value
            </div>
          </div>

          {/* Graph */}
          {/* <div className="w-full h-[350px] rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap={1} 
                barGap={0}
              >
                <CartesianGrid vertical={false} stroke="#1F1F2B" />
                <XAxis
                  dataKey="date"
                  stroke="#9C9DA2"
                  fontSize={8}
                  tickMargin={4}
                  interval={2}
                  tick={(props) => <CustomXAxisTick {...props} data={chartData} />}
                />
                <YAxis
                  orientation="right"
                  stroke="#9C9DA2"
                  tickFormatter={(value) => `$${value}`}
                  domain={[0, 100]}
                  fontSize={12}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1A2F", border: "none", color: "#fff" }}
                  labelStyle={{ color: "#9C9DA2" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Value"]}
                />
                <Bar dataKey="base" stackId="a" fill="#00E8C2" radius={[2, 2, 0, 0]} />
                <Bar dataKey="incentive" stackId="a" fill="#7155FF" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div> */}
                
{/* Column Headers */}
<div className="grid grid-cols-5 sm:pl-4 sm:pr-6 py-2 border-b border-[rgba(255,255,255,0.15)]">
  <div className="flex justify-start text-[#9C9DA2] text-[14px] font-medium">
    Available Yields
  </div>
  <div className="flex justify-end text-[#9C9DA2]   text-[14px] font-medium  items-center">
    Deposited on
    <svg
      className="ml-1"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.6">
        <path d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  </div>
  <div className="flex justify-center text-[#9C9DA2]   text-[14px] font-medium items-center">
    Expiry
    <svg
      className="ml-1"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.6">
        <path d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  </div>
  <div className="flex justify-center text-[#9C9DA2] text-[14px] font-medium items-center">
    Base APY
    <svg
      className="ml-1"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.6">
        <path d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  </div>
  <div className="flex justify-end text-[#9C9DA2]   text-[14px] font-medium items-center">
    Current Balance
    <svg
      className="ml-1"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.6">
        <path d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
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
                  className={`grid grid-cols-5 items-center py-4 pl-4 pr-6 relative ${
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Image
                      src={`/images/icons/${strategy.asset.toLowerCase()}-${
                        strategy.type === "stable" ? "stable" : "incentive"
                      }.svg`}
                      alt={strategy.asset}
                      width={32}
                      height={32}
                    />
                    <div>
                      <div className="text-[#EDF2F8] text-[12px] font-normal leading-normal">
                        {strategy.type === "stable" ? "sy" : "Incentive Maxi"}
                        {strategy.asset}
                      </div>
                      <div className="text-[#00D1A0] text-[12px] font-normal">
                        +
                        {(
                          (strategy.balance *
                            parseFloat(usdApy?.replace("%", "") || "0")) /
                          100
                        ).toFixed(2)}{" "}
                        in 1 year
                      </div>
                    </div>
                  </div>

                  {/* Deposited On */}
                  {depositedChains.length === 0 ? (
                    <div className="flex flex-col items-center justify-end">
                      <div className="text-[#EDF2F8] text-[12px] font-normal leading-normal">-</div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {depositedChains.map((chainKey) => {
                        const chain = chainIconMap[chainKey];
                        if (!chain) return null;

                        return (
                          <TooltipProvider key={chainKey}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="transition-transform duration-300 hover:scale-110">
                                  <Image
                                    src={chain.src}
                                    alt={chain.label}
                                    width={24}
                                    height={24}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs" side="top">
                                {chain.label}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  )}

                  {/* Expiry */}
                  <div className="flex flex-col items-center justify-end">
                    <div className="text-[#EDF2F8]   text-[12px] font-normal leading-normal">
                      {strategy.duration === "PERPETUAL_DURATION"
                        ? "No Expiry"
                        : "29th March 2025"}
                    </div>
                    <div className="text-[#9C9DA2]   text-[12px] font-normal leading-normal">
                      {strategy.duration === "PERPETUAL_DURATION"
                        ? "Perpetual"
                        : "20 days to Expire"}
                    </div>
                  </div>

                  {/* APY */}
                  <div className="text-[#EDF2F8]   text-[12px] font-normal leading-normal flex items-center justify-center">
                    {usdApy}
                  </div>

                  {/* Balance */}
                  <div className="flex flex-col text-right">
                    <div className="text-[#EDF2F8]   text-[12px] font-normal leading-normal">
                      ${strategy.balance.toFixed(2)}
                    </div>
                    <div
                      className={`${
                        parseFloat(usdApy?.replace("%", "") || "0") >= 0
                          ? "text-[#00D1A0]"
                          : "text-[#EF4444]"
                      }   text-[12px] font-normal leading-normal`}
                    >
                      $
                      {(
                        (strategy.balance *
                          parseFloat(usdApy?.replace("%", "") || "0")) /
                        100
                      ).toFixed(2)}{" "}
                      ({usdApy})
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
        <div className="w-1/2 p-8 hidden sm:block">
          {selectedStrategy ? (
            <div className="flex flex-col h-full rounded-lg p-6">
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
                    {/* Withdrawing assets from dropdown */}
                    <div className="flex flex-row justify-between items-center bg-[#121420] rounded-sm p-2 border border-[rgba(255,255,255,0.05)] mb-4">
                      {/* Label */}
                      <label className="text-[#9C9DA2] font-inter text-[12px] block pl-2">
                        Withdrawing assets from
                      </label>

                      {/* Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                          className="flex items-center justify-between w-full bg-[#1e202c] text-[#EDF2F8] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88AF8]"
                        >
                          <div className="flex items-center gap-2">
                            {targetChain && (
                              <img
                                src={
                                  getUniqueChainConfigs.find((c) => c.network === targetChain)?.image || ""
                                }
                                alt={targetChain}
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="capitalize text-[12px]">{targetChain}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="ml-1">
                                    <InfoIcon />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs max-w-[240px]" side="top">
                                To reduce bridging risks and ensure accurate yield tracking, deposits and withdrawals are limited to the Base network.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {/* Dropdown arrow */}
                          {/* <svg
                            className={`w-4 h-4 transform transition-transform duration-200 ${
                              isChainDropdownOpen ? "rotate-180" : "rotate-0"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg> */}
                        </button>

                        {/* Dropdown options */}
                        {/* {isChainDropdownOpen && (
                          <div className="absolute z-10 w-full mt-2 bg-[#1F202D] rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {getUniqueChainConfigs.map((chainOption) => (
                              <button
                                key={chainOption.network}
                                onClick={() => {
                                  setTargetChain(chainOption.network);
                                  setIsChainDropdownOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-[#EDF2F8] hover:bg-[#1A1B1E]"
                              >
                                <img
                                  src={chainOption.image}
                                  alt={chainOption.name}
                                  className="w-5 h-5 mr-2 rounded-full"
                                />
                                {chainOption.name}
                              </button>
                            ))}
                          </div>
                        )} */}
                      </div>
                    </div>


                    {/* Header with strategy info and balance */}
                    <div className="flex items-end justify-between p-4  bg-[rgba(255,255,255,0.02)] mb-6 border-b border-[rgba(255,255,255,0.15)]">
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
                      <div className="text-[#9C9DA2] text-right   text-[12px] font-normal leading-normal">
                        Balance:{" "}
                        <span className="text-[#D7E3EF] text-[12px] font-semibold leading-normal">
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
                          {formatUnits(
                            amountOut ? BigInt(amountOut) : BigInt(0),
                            6
                          )}{" "}
                        </div>
                        {assetOptions.length > 1 && (
                          <div className="">
                            <div className="relative w-full">
                              <button
                                onClick={() =>
                                  setIsAssetDropdownOpen(!isAssetDropdownOpen)
                                }
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
                                  <span>
                                    {assetOptions[selectedAssetIdx].name}
                                  </span>
                                </div>
                                <svg
                                  className={`w-4 h-4 transform transition-transform duration-200 ${
                                    isAssetDropdownOpen
                                      ? "rotate-180"
                                      : "rotate-0"
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
                          : "bg-[#B88AF8] text-[#080B17] hover:bg-[#9F6EE9] transition-colors"
                      }
                      ${
                        isBase
                          ? ""
                          : "bg-[#383941] text-[#9C9DA2] cursor-not-allowed hover:!bg-[#383941]"
                      }
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
                      ) : isWithdrawSuccess ? (
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
                          href={`https://basescan.org/tx/${withdrawTxHash}`}
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
                    <div className="text-[#9C9DA2] text-[14px] rounded-[4px] bg-[rgba(255,255,255,0.02)] p-[24px]">
                      <strong className="text-white">Note:</strong> By initiating a withdrawal, your
                      vault shares ({strategy.name}) will be converted into the
                      underlying asset based on the latest market rates, which
                      may fluctuate slightly; once the request is submitted,
                      please allow up to 24 hours for the funds to be received,
                      as processing times can vary depending on network
                      conditions—there's no need to panic if the assets don't
                      arrive immediately.
                    </div>
                  </div>
                </>
              )}

              {activeTab === "request" && (
                <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
                  {/* Segmented Control Tabs */}
                  <div className="mb-4 flex justify-start">
                    <div className="relative bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[6px] flex w-[158px]">
                      <button
                        className={`w-[71px] px-3 py-1.5 text-[12px] font-normal leading-[16px] transition-all duration-200 border rounded-l-[6px] rounded-r-[0px] flex items-center justify-center ${
                          requestTab === "pending"
                            ? "bg-[rgba(184,138,248,0.15)] text-[#D7E3EF] shadow-sm border-[rgba(184,138,248,0.5)]"
                            : "text-[#9C9DA2] hover:text-[#D7E3EF] border-transparent"
                        }`}
                        onClick={() => setRequestTab("pending")}
                      >
                        Pending
                      </button>
                      <button
                        className={`w-[87px] px-3 py-1.5 text-[12px] font-normal leading-[16px] transition-all duration-200 border rounded-l-[0px] rounded-r-[6px] flex items-center justify-center ${
                          requestTab === "completed"
                            ? "bg-[rgba(184,138,248,0.15)] text-[#D7E3EF] shadow-sm border-[rgba(184,138,248,0.5)]"
                            : "text-[#9C9DA2] hover:text-[#D7E3EF] border-transparent"
                        }`}
                        onClick={() => setRequestTab("completed")}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  {/* Requests List */}
                  {requestTab === "pending" && (
                    <div className="space-y-4">
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
                              className="bg-[rgba(255,255,255,0.02)] rounded-[4px] py-4 px-6 flex justify-between items-center"
                            >
                              <div className="flex items-center justify-between w-full">
                                {/* Calendar Icon + Date */}
                                <div className="flex items-center text-[#D7E3EF] text-[12px] gap-1">
                                  <button
                                    className="text-[#D7E3EF] hover:text-white transition-colors cursor-pointer"
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
                                <div className="flex items-center justify-center gap-2 flex-1">
                                  {/* Shares pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-[#D7E3EF] text-[12px] font-normal">
                                    {(Number(req.amount_of_shares) / 1e6).toFixed(2)}
                                    </span>
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
                                        width={24}
                                        height={24}
                                        className="cursor-pointer"
                                      />
                                    </a>
                                  </div>
                                  {/* Arrow */}
                                  <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0.832031 6H14.1654M14.1654 6L9.16536 1M14.1654 6L9.16536 11" stroke="#9C9DA2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                  {/* Assets pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-white text-[12px] font-normal">
                                      {(Number(req.amount_of_assets) / Math.pow(10, assetDecimals)).toFixed(2)}
                                    </span>
                                    <Image
                                      src={assetImage}
                                      alt="Assets"
                                      width={24}
                                      height={24}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Cancel Button */}
                              {cancelStatusMap[req.request_id] === "cancelling" ? (
                                <span className="text-gray-400 text-[13px] font-medium">Cancelling...</span>
                              ) : cancelStatusMap[req.request_id] === "cancelled" ? (
                                <span className="text-green-500 text-[13px] font-medium">Request Cancelled</span>
                              ) : (
                                <button
                                  onClick={() => handleCancel(req.request_id)}
                                  className="text-[#F87171] text-[12px] font-medium hover:underline whitespace-nowrap"
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {requestTab === "completed" && (
                    <div className="space-y-4">
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
                              className="bg-[rgba(255,255,255,0.02)] rounded-[4px] py-4 px-6 flex justify-between items-center"
                            >
                              <div className="flex items-center justify-between w-full">
                                {/* Calendar Icon + Date */}
                                <div className="flex items-center text-[#D7E3EF] text-[12px] gap-1">
                                  <button
                                    className="text-[#D7E3EF] hover:text-white transition-colors cursor-pointer"
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

                                {/* Amounts row (aligned to the right) */}
                                <div className="flex items-center justify-end gap-2">
                                  {/* Shares pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-[#D7E3EF] text-[12px] font-normal">
                                    {(Number(req.amount_of_shares) / 1e6).toFixed(2)}
                                    </span>
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
                                        width={24}
                                        height={24}
                                        className="cursor-pointer"
                                      />
                                    </a>
                                  </div>
                                  {/* Arrow */}
                                  <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0.832031 6H14.1654M14.1654 6L9.16536 1M14.1654 6L9.16536 11" stroke="#9C9DA2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                  {/* Assets pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-white text-[12px] font-normal">
                                      {(Number(req.amount_of_assets) / Math.pow(10, assetDecimals)).toFixed(2)}
                                    </span>
                                    <Image
                                      src={assetImage}
                                      alt="Assets"
                                      width={24}
                                      height={24}
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
                <p className="text-[#9C9DA2]   text-[14px] font-normal leading-[16px]">
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
