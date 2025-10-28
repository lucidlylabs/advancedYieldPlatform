import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  useAccount,
  useTransaction,
  useWriteContract,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import { ERC20_ABI } from "../config/abi/erc20";
import { SOLVER_ABI } from "../config/abi/solver";
import { RATE_PROVIDER_ABI } from "../config/abi/rateProvider";
import {
  type Address,
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
  getAddress,
} from "viem";
import { useRouter } from "next/router";
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from "../components/ui/header";
import { Navigation } from "../components/ui/navigation";
import { useHeaderHeight } from "../contexts/BannerContext";
import UserActivity from "../components/UserActivity";

const InfoIcon = () => (
  <svg
    width="12"
    height="12"
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

// More reliable mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
// } from "recharts";
import { Tooltip } from "@/components/ui/tooltip";
import PortfolioChart from "@/components/graphs/portfolioChart";

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

interface StrategyAsset {
  [key: string]: StrategyDuration;
}

// Add interface for strategy with balance
interface StrategyWithBalance {
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
  duration: string;
  type: string;
  asset: string;
  balance: number;
}

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
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Asset options based on chain
const getWithdrawableAssets = (chain: string) => {
  if (chain === "ethereum") {
    return [
      {
        name: "USDC",
        contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        image: "/images/icons/usdc.svg",
        decimal: 6,
        isWithdrawable: true,
      },
    ];
  } else {
    // Base (default)
    return [
      {
        name: "USDC",
        contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        image: "/images/icons/usdc.svg",
        decimal: 6,
        isWithdrawable: true,
      },
    ];
  }
};

// Helper function to find asset by contract address across all chains
const findAssetByAddress = (address: string) => {
  // Check Base chain
  const baseAssets = getWithdrawableAssets("base");
  const baseAsset = baseAssets.find(
    (asset) => asset.contract.toLowerCase() === address.toLowerCase()
  );
  if (baseAsset) return baseAsset;

  // Check Ethereum chain
  const ethereumAssets = getWithdrawableAssets("ethereum");
  const ethereumAsset = ethereumAssets.find(
    (asset) => asset.contract.toLowerCase() === address.toLowerCase()
  );
  if (ethereumAsset) return ethereumAsset;

  return null;
};

const strategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
const chainConfigs = {
  base: strategy.base,
  ethereum: strategy.ethereum,
  arbitrum: strategy.arbitrum,
};

const PortfolioSubpage: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const isMobileDevice = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDuration = (duration: string) => {
    if (duration === "PERPETUAL_DURATION") return "Liquid";
    const [number, period] = duration.split("_");
    return `${number} ${period.toLowerCase()}`;
  };
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [strategiesWithBalance, setStrategiesWithBalance] = useState<
    StrategyWithBalance[]
  >([]);
  const [
    strategiesWithWithdrawableBalance,
    setStrategiesWithWithdrawableBalance,
  ] = useState<StrategyWithBalance[]>([]);
  const [selectedStrategy, setSelectedStrategy] =
    useState<StrategyWithBalance | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}` | null>(
    null
  );
  const [isWithdrawSuccessLocal, setIsWithdrawSuccessLocal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "withdraw" | "request" | "activity"
  >("activity");
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
  const [targetChain, setTargetChain] = useState<string>("ethereum");
  // Get withdrawable assets based on target chain
  const withdrawableAssets = useMemo(
    () => getWithdrawableAssets(targetChain),
    [targetChain]
  );

  // Reset selected asset index when chain changes
  useEffect(() => {
    setSelectedAssetIdx(0);
  }, [targetChain]);

  // Debug: Log withdrawableAssets changes
  useEffect(() => {
    console.log("🔄 withdrawableAssets updated:", {
      targetChain,
      withdrawableAssets,
      assetContract: withdrawableAssets?.[0]?.contract,
    });
  }, [withdrawableAssets, targetChain]);

  // Get Ethereum-only balance for selected strategy (for withdrawal display)
  const selectedStrategyEthereumBalance = useMemo(() => {
    if (!selectedStrategy) return 0;
    const ethereumStrategy = strategiesWithWithdrawableBalance.find(
      (s) => s.contract === selectedStrategy.contract
    );
    return ethereumStrategy?.balance || 0;
  }, [selectedStrategy, strategiesWithWithdrawableBalance]);

  const [cancelStatusMap, setCancelStatusMap] = useState<{
    [key: string]: "idle" | "cancelling" | "cancelled";
  }>({});
  const [pnlData, setPnlData] = useState<{
    value: number;
    percentage: number;
    isProfitable: boolean;
  } | null>(null);
  const [isLoadingPnl, setIsLoadingPnl] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const chainId = useChainId();
  const isEthereum = chainId === 1; // Check if wallet is on Ethereum network
  const { switchChain } = useSwitchChain();

  const router = useRouter() as any;

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
      .STABLE as unknown as StrategyConfig;

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

    // Filter to only show Ethereum for withdrawal (contracts deployed on Ethereum)
    return Array.from(uniqueChains.values()).filter(
      (chain) => chain.network === "ethereum"
    );
  }, [USD_STRATEGIES]);

  // Watch deposit transaction
  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } =
    useTransaction({
      hash: transactionHash || undefined,
    });

  // Fetch exchange rate for syUSD to USD conversion
  const fetchExchangeRate = async () => {
    setIsLoadingExchangeRate(true);
    try {
      // Use USDC as the quote token for USD conversion
      const usdcContract = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const strategyConfig = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
      const rateProviderAddress = strategyConfig.rateProvider;

      // Base RPC URLs with fallbacks
      const baseRpcUrls = [
        "https://base.llamarpc.com",
        "https://base.blockpi.network/v1/rpc/public",
        "https://base-mainnet.g.alchemy.com/v2/demo",
        "https://base.meowrpc.com",
      ];

      let rate;
      let lastError;

      // Try each RPC URL until one works
      for (const rpcUrl of baseRpcUrls) {
        try {
          const client = createPublicClient({
            transport: http(rpcUrl),
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
                default: { http: [rpcUrl] },
                public: { http: [rpcUrl] },
              },
            },
          });

          rate = await client.readContract({
            address: rateProviderAddress as Address,
            abi: RATE_PROVIDER_ABI,
            functionName: "getRateInQuoteSafe",
            args: [usdcContract as Address],
          });

          console.log(
            `Successfully fetched exchange rate using RPC: ${rpcUrl}`
          );
          break;
        } catch (error) {
          console.warn(`RPC ${rpcUrl} failed:`, error);
          lastError = error;
        }
      }

      if (!rate) {
        throw lastError || new Error("All RPC endpoints failed");
      }

      console.log("Exchange rate debug:", {
        rawRate: rate.toString(),
        rateLength: rate.toString().length,
      });

      // USDC has 6 decimals, so format accordingly
      // The rate represents how much USDC you get for 1 syUSD
      const rateFormatted = formatUnits(rate as bigint, 6);
      const rateNumber = parseFloat(rateFormatted);

      console.log(
        "Exchange rate formatted:",
        rateFormatted,
        "Rate number:",
        rateNumber
      );

      // Since 1 syUSD = rateNumber USDC, and 1 USDC ≈ 1 USD
      // The exchange rate for syUSD to USD is approximately the same
      setExchangeRate(rateNumber);
      console.log(
        "🔥 EXCHANGE RATE FETCHED SUCCESSFULLY:",
        rateNumber,
        "USD per syUSD"
      );
      console.log("🔥 Raw rate from contract:", rate.toString());
      console.log("🔥 Formatted rate:", rateFormatted);
    } catch (error) {
      console.error("🔥 ERROR FETCHING EXCHANGE RATE:", error);
      // Fallback to 1.0 if exchange rate fetch fails
      setExchangeRate(1.0);
      console.log("🔥 USING FALLBACK EXCHANGE RATE: 1.0");
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  // Fetch PnL data
  const fetchPnlData = async (userAddress: string) => {
    if (!userAddress) return;

    setIsLoadingPnl(true);
    try {
      console.log(`Fetching PnL data for address: ${userAddress}`);
      const response = await fetch(
        `http://localhost:3001/api/pnl/${userAddress}`
      );

      console.log("PnL API Response status:", response.status);
      console.log(
        "PnL API Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log("=== FULL PnL API RESPONSE ===");
      console.log(JSON.stringify(data, null, 2));
      console.log("=== END PnL API RESPONSE ===");

      if (data.success && data.data && data.data.pnl) {
        console.log("PnL data received:", data.data.pnl);
        setPnlData(data.data.pnl);
      } else {
        console.error("Failed to fetch PnL data:", data.message);
        console.error("Full PnL error response:", data);
        setPnlData(null);
      }
    } catch (error) {
      console.error("Error fetching PnL data:", error);
      setPnlData(null);
    } finally {
      setIsLoadingPnl(false);
    }
  };

  useEffect(() => {
    const apyUrl = USD_STRATEGIES.PERPETUAL_DURATION.STABLE.apy;
    if (typeof apyUrl === "string" && apyUrl.startsWith("http")) {
      fetch(apyUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const trailingApy = data?.result?.trailing_total_APY;
          if (typeof trailingApy === "number") {
            setUsdApy(`${trailingApy.toFixed(2)}%`);
          } else {
            console.warn("Unexpected APY data structure:", data);
            setUsdApy("N/A");
          }
        })
        .catch((error) => {
          console.error("Error fetching APY:", error);
          setUsdApy("N/A");
        });
    } else if (typeof apyUrl === "string" && !apyUrl.startsWith("http")) {
      // If apyUrl is not a URL, use it directly (fallback value)
      setUsdApy(apyUrl);
    }
  }, []);

  // Fetch exchange rate on component mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Fetch PnL when address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchPnlData(address);
    }
  }, [address, isConnected]);

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
  const {
    isLoading: isWaitingForApproval,
    isSuccess: isApprovalSuccess,
    isError: isApprovalError,
  } = useTransaction({
    hash: approvalHash || undefined,
  });

  // Watch withdraw transaction
  const {
    isLoading: isWaitingForWithdraw,
    isSuccess: isWithdrawSuccess,
    isError: isWithdrawError,
  } = useTransaction({
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
    if (withdrawTxHash && isWithdrawSuccess && !isWithdrawSuccessLocal) {
      // Handle successful withdrawal
      console.log("✅ Withdraw transaction confirmed successfully");
      setIsWithdrawing(false);
      setIsWithdrawSuccessLocal(true);
      // Refresh balances with loading state (but don't reset the form state)
      setIsRefreshingBalance(true);
      Promise.all([checkAllBalances(), checkAllWithdrawableBalances()])
        .then(() => {
          setIsRefreshingBalance(false);
        })
        .catch((error) => {
          console.error("Error refreshing balances:", error);
          setErrorMessage("Failed to refresh balances.");
          setIsRefreshingBalance(false);
        });
      // Don't reset form state - let user see the transaction hash and close manually
      // setSelectedStrategy(null);
      // setWithdrawAmount("");
      // setWithdrawTxHash(null);
    }
    // Keep loading until transaction completes - don't set isWithdrawing to false prematurely
    // Don't check isError from useTransaction as it can give false positives during pending state
  }, [withdrawTxHash, isWithdrawSuccess, isWithdrawSuccessLocal]);

  useEffect(() => {
    if (approvalHash && isApprovalSuccess) {
      console.log("✅ Approval confirmed successfully");
      setIsApproved(true);
      setIsApproving(false);
      // Don't reset approvalHash - let user see it was successful
      // setApprovalHash(null);
    }
    // Don't check isError from useTransaction as it can give false positives during pending state
    // Error will be shown from the catch block in handleApprove
  }, [approvalHash, isApprovalSuccess]);

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

  // Helper function to add delay between requests
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Function to check balance for a strategy across all networks (withdrawable balance)
  const checkWithdrawableBalance = async (
    strategy: any,
    delayMs: number = 0
  ) => {
    if (!address || !strategy.boringVaultAddress) return 0;

    // Add delay to prevent rate limiting
    if (delayMs > 0) {
      await delay(delayMs);
    }

    let totalBalance = 0;
    // Only check Ethereum balance for withdrawals (contracts are on Ethereum)
    const networks = ["ethereum"];

    for (const networkKey of networks) {
      const networkConfig = strategy[networkKey];

      // Skip if network config doesn't exist
      if (!networkConfig || !networkConfig.rpc || !networkConfig.chainId) {
        console.log(`Skipping ${networkKey} - no config`);
        continue;
      }

      try {
        const client = createPublicClient({
          transport: http(networkConfig.rpc),
          chain: {
            id: networkConfig.chainId,
            name: networkConfig.chainObject.name,
            network: networkConfig.chainObject.network,
            nativeCurrency: networkConfig.chainObject.nativeCurrency,
            rpcUrls: networkConfig.chainObject.rpcUrls,
          },
        });

        // Add small delay between contract calls to prevent rate limiting
        await delay(100);

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

        const formattedBalance = parseFloat(
          formatUnits(balance as bigint, decimals as number)
        );

        console.log(`${networkKey} balance: ${formattedBalance}`);
        totalBalance += formattedBalance;
      } catch (error) {
        console.error(`Error checking ${networkKey} balance:`, error);
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes("429")) {
          console.warn(
            `Rate limited on ${networkKey}, waiting before retry...`
          );
          await delay(2000); // Wait 2 seconds before continuing
        }
        // Continue to next network instead of failing completely
      }
    }

    console.log(`Total withdrawable balance: ${totalBalance}`);
    return totalBalance;
  };

  const checkAllWithdrawableBalances = async () => {
    if (!address) return;

    try {
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

      // Filter strategies that have boringVaultAddress (required for balance checking)
      const validStrategies = allStrategies.filter(
        (strategy) => strategy.boringVaultAddress && !strategy.comingSoon
      );

      // Process strategies sequentially to prevent rate limiting
      const balances: StrategyWithBalance[] = [];
      for (let i = 0; i < validStrategies.length; i++) {
        const strategy = validStrategies[i];
        const delayMs = i * 500; // Add 500ms delay between each strategy
        const balance = await checkWithdrawableBalance(strategy, delayMs);
        balances.push({ ...strategy, balance } as StrategyWithBalance);
      }
      setStrategiesWithWithdrawableBalance(
        balances.filter((s) => s.balance > 0)
      );
    } catch (error) {
      console.error("Error checking withdrawable balances:", error);
      if (error instanceof Error && error.message.includes("429")) {
        setErrorMessage("Rate limited. Please wait a moment and try again.");
      } else {
        setErrorMessage("Failed to fetch withdrawable balances.");
      }
    } finally {
      // Don't set refreshing to false here, let the main function handle it
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
          return { ...strategy, balance } as StrategyWithBalance;
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
    if (!address) return;

    setIsRefreshingBalance(true);
    Promise.all([checkAllBalances(), checkAllWithdrawableBalances()])
      .then(() => {
        setIsRefreshingBalance(false);
      })
      .catch((error) => {
        console.error("Error loading balances:", error);
        setErrorMessage("Failed to load balances.");
        setIsRefreshingBalance(false);
      });
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

      // Get chain configuration based on target chain
      const chainConfig =
        chainConfigs[targetChain as keyof typeof chainConfigs];
      const chainId = chainConfig?.chainId || 1;
      const rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;

      console.log("Approval details:", {
        solverAddress,
        vaultAddress,
        address,
        chainId,
        targetChain,
      });

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: chainConfig?.chainObject || {
          id: chainId,
          name: "Ethereum",
          network: "ethereum",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
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
        chainId: chainId,
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
      const assetOutAddress = withdrawableAssets[selectedAssetIdx]
        .contract as Address;

      console.log("=== WITHDRAW DEBUG ===");
      console.log("targetChain:", targetChain);
      console.log("withdrawableAssets:", withdrawableAssets);
      console.log("assetOutAddress:", assetOutAddress);
      console.log("selectedAssetIdx:", selectedAssetIdx);

      // Get chain configuration based on target chain
      const chainConfig =
        chainConfigs[targetChain as keyof typeof chainConfigs];
      const chainId = chainConfig?.chainId || 1;
      const rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: chainConfig?.chainObject || {
          id: chainId,
          name: "Ethereum",
          network: "ethereum",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
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
      const discount = 0; // uint16 - hardcoded
      const secondsToDeadline = 432000; // uint24 - hardcoded (5 days)

      console.log("Debug - Contract call parameters:", {
        functionName: "requestOnChainWithdraw",
        contractAddress: solverAddress,
        chainId: chainId,
        targetChain: targetChain,
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
        chainId: chainId,
        account: address,
      });

      if (tx && typeof tx === "string" && tx.startsWith("0x")) {
        console.log("Withdrawal transaction submitted:", tx);
        setWithdrawTxHash(tx as `0x${string}`);
        // Keep isWithdrawing = true until transaction is confirmed
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      if (error.code === 4001) {
        setErrorMessage("Withdrawal cancelled by user.");
      } else {
        setErrorMessage(
          error.message || "Withdrawal failed. Please try again."
        );
      }
      setIsWithdrawing(false); // Only set to false on actual error
    }
    // Don't set isWithdrawing to false in finally - wait for transaction confirmation
  };

  const handleCancel = async (requestId: string) => {
    if (!selectedStrategy || !address) return;
    console.log("Cancelling request with ID:", requestId);

    try {
      setIsCancelling(true);
      setErrorMessage(null);
      setCancelStatusMap((prev) => ({ ...prev, [requestId]: "cancelling" }));

      const solverAddress = selectedStrategy.solverAddress as Address;

      // Get chain configuration based on target chain
      const chainConfig =
        chainConfigs[targetChain as keyof typeof chainConfigs];
      const chainId = chainConfig?.chainId || 1;
      const rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;

      console.log("Cancel details:", {
        solverAddress,
        requestId,
        address,
        chainId,
        targetChain,
      });

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: chainConfig?.chainObject || {
          id: chainId,
          name: "Ethereum",
          network: "ethereum",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
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

      // USDC addresses for different chains
      const usdcAddresses = {
        base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      };

      const assetContract = (
        requestToCancel.withdraw_asset_address || ""
      ).toLowerCase();
      const isValidAsset = Object.values(usdcAddresses).some(
        (addr) => addr.toLowerCase() === assetContract
      );

      if (!isValidAsset) {
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
        chainId: chainId,
        account: address,
      });

      if (
        cancelTx &&
        typeof cancelTx === "string" &&
        cancelTx.startsWith("0x")
      ) {
        console.log("Cancel transaction submitted:", cancelTx);
        setCancelStatusMap((prev) => ({ ...prev, [requestId]: "cancelled" }));

        // Refresh the requests after successful cancellation
        setTimeout(() => {
          fetchWithdrawRequests("", address);
        }, 2000);
      } else {
        throw new Error("Failed to get cancel transaction hash");
      }
    } catch (error: any) {
      console.error("Cancel failed:", error);
      setCancelStatusMap((prev) => ({ ...prev, [requestId]: "idle" }));
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
  const handleStrategySelect = (strategy: StrategyWithBalance) => {
    console.log("strategy", strategy);

    // Check if we're on mobile
    if (isMobileDevice) {
      // Mobile: Navigate to detail page
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
          rpc: strategy.rpc,
        },
      });
    } else {
      // Desktop: Set selected strategy and show withdrawal tab
      setSelectedStrategy(strategy);
      setActiveTab("withdraw");
      // Reset withdrawal amount when selecting a new strategy
      setWithdrawAmount("");
    }
  };

  // Auto-populate withdrawal form when strategy is selected on desktop
  useEffect(() => {
    if (selectedStrategy && !isMobileDevice) {
      console.log(
        "Auto-populating withdrawal form for strategy:",
        selectedStrategy
      );

      // Keep target chain as Ethereum for withdrawals (don't auto-change based on strategy)
      // const targetNetwork = selectedStrategy.network || "base";
      // setTargetChain(targetNetwork);
      console.log(
        "Selected strategy network:",
        selectedStrategy.network,
        "but keeping targetChain as:",
        targetChain
      );

      // Find the corresponding asset in withdrawableAssets
      const matchingAsset = withdrawableAssets.find(
        (asset) => asset.contract === selectedStrategy.contract
      );
      if (matchingAsset) {
        const assetIndex = withdrawableAssets.findIndex(
          (asset) => asset.contract === selectedStrategy.contract
        );
        setSelectedAssetIdx(assetIndex);
        console.log("Found matching asset at index:", assetIndex);
      } else {
        console.log(
          "No matching asset found for contract:",
          selectedStrategy.contract
        );
      }
    }
  }, [selectedStrategy, withdrawableAssets, targetChain, isMobileDevice]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (selectedStrategy) {
      const amount = (selectedStrategyEthereumBalance * percentage).toFixed(2);
      setWithdrawAmount(amount);
    }
  };

  const handleMaxClick = () => {
    if (selectedStrategy) {
      setWithdrawAmount(selectedStrategyEthereumBalance.toString());
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
          withdrawableAssets[selectedAssetIdx].contract
        );

        // Get chain configuration based on target chain
        const chainConfig =
          chainConfigs[targetChain as keyof typeof chainConfigs];
        const chainId = chainConfig?.chainId || 1;
        const rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;

        console.log("rpc", rpcUrl);
        console.log("solverAddress", solverAddress);
        console.log("vaultAddress", vaultAddress);
        console.log("targetChain", targetChain);
        console.log("chainId", chainId);

        const client = createPublicClient({
          transport: http(rpcUrl),
          chain: chainConfig?.chainObject || {
            id: chainId,
            name: "Base",
            network: "base",
            nativeCurrency: {
              decimals: 18,
              name: "Ether",
              symbol: "ETH",
            },
            rpcUrls: {
              default: { http: [rpcUrl] },
              public: { http: [rpcUrl] },
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
  }, [
    selectedStrategy,
    withdrawAmount,
    targetChain,
    withdrawableAssets,
    selectedAssetIdx,
  ]);

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
      console.log("response:", response);
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
      console.log("withdrwaimg");
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
          console.log(
            "cacheQueueData API called after withdraw success:",
            data
          );
          console.log(
            "cacheQueueData API called after withdraw success:",
            data
          );
        })
        .catch((err) => {
          console.error("Error calling cacheQueueData API:", err);
        });
    }
  }, [isWithdrawSuccess, withdrawTxHash, address]);

  const headerHeight = useHeaderHeight();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ paddingTop: `${headerHeight}px` }}
    >
      <Header onNavigateToDeposit={() => {}}>
        <Navigation
          currentPage="portfolio"
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </Header>
      <main className="flex-1 overflow-y-auto">
        {/* Top Section - Portfolio Value, PNL, and Wallet */}
        <div className="flex flex-col sm:flex-row w-full py-6 sm:py-10 items-center justify-between px-4 sm:px-8 bg-[#0D101C] border-b border-[rgba(255,255,255,0.1)]">
          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-0">
              <div className="flex flex-col items-center sm:items-start">
                <div className="text-[#9C9DA2] text-[14px] font-normal leading-[16px]">
                  Portfolio
                </div>
                <div className="text-[#D7E3EF] text-[20px] sm:text-[24px] font-semibold leading-normal mt-1">
                  {isRefreshingBalance || isLoadingExchangeRate || !isClient ? (
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>
                        {isLoadingExchangeRate
                          ? "Loading rates..."
                          : "Refreshing..."}
                      </span>
                    </span>
                  ) : strategiesWithBalance.length > 0 ? (
                    (() => {
                      const totalBalance = strategiesWithBalance.reduce(
                        (sum, s) => {
                          console.log(
                            "🔥 Portfolio Balance Calc (All Networks):",
                            s.balance,
                            "* exchange rate:",
                            exchangeRate,
                            "=",
                            s.balance * exchangeRate
                          );
                          return sum + s.balance * exchangeRate;
                        },
                        0
                      );
                      console.log(
                        "🔥 Total Portfolio USD Value (All Networks):",
                        totalBalance
                      );
                      return `$${totalBalance.toFixed(2)}`;
                    })()
                  ) : (
                    "$0.00"
                  )}
                </div>
              </div>
              {/* Vertical Divider */}
              <div className="w-px bg-[rgba(217,217,217,0.05)] self-stretch mx-4 sm:mx-8 hidden sm:block"></div>
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2 text-[#9C9DA2] text-[14px] font-normal leading-[16px]">
                  Withdrawable{" "}
                  <Tooltip content="Withdrawals are only active on Ethereum Network. To redeem assets from other networks, first bridge them to Ethereum." side="bottom">
                    <button type="button" className="cursor-help">
                      <InfoIcon />
                    </button>
                  </Tooltip>
                </div>
                <div className="text-[#D7E3EF] text-[20px] sm:text-[24px] font-semibold leading-normal mt-1">
                  {isRefreshingBalance || isLoadingExchangeRate || !isClient ? (
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
                          d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>
                        {isLoadingExchangeRate
                          ? "Loading rates..."
                          : "Refreshing..."}
                      </span>
                    </span>
                  ) : strategiesWithWithdrawableBalance.length > 0 ? (
                    (() => {
                      const totalBalance =
                        strategiesWithWithdrawableBalance.reduce((sum, s) => {
                          console.log(
                            "🔥 Withdrawable Balance Calc (Ethereum Only):",
                            s.balance,
                            "* exchange rate:",
                            exchangeRate,
                            "=",
                            s.balance * exchangeRate
                          );
                          return sum + s.balance * exchangeRate;
                        }, 0);
                      console.log(
                        "🔥 Total Withdrawable USD Value (Ethereum Only):",
                        totalBalance
                      );
                      return `$${totalBalance.toFixed(2)}`;
                    })()
                  ) : (
                    "$0.00"
                  )}
                </div>
              </div>
              {/* Vertical Divider */}
              <div className="w-px bg-[rgba(217,217,217,0.05)] self-stretch mx-4 sm:mx-8 hidden sm:block"></div>
              <div className="flex flex-col items-center sm:items-start">
                <div className="text-[#9C9DA2] text-[14px] font-normal leading-[16px]">
                  PNL
                </div>
                <div
                  className={`text-[16px] font-normal leading-normal mt-1 sm:mt-3 ${
                    isLoadingPnl
                      ? "text-[#9C9DA2]" // Gray when loading
                      : !address
                      ? "text-[#9C9DA2]" // Gray when no wallet connected
                      : pnlData?.isProfitable
                      ? "text-[#00D1A0]" // Green when profitable
                      : "text-[#EF4444]" // Red when not profitable
                  }`}
                >
                  {isLoadingPnl ? (
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="animate-spin h-4 w-4 text-[#9C9DA2]"
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
                      <span>Loading...</span>
                    </span>
                  ) : isClient && pnlData ? (
                    `${pnlData.isProfitable ? "+" : ""}$${Math.abs(
                      pnlData.value
                    ).toFixed(4)} (${
                      pnlData.isProfitable ? "+" : ""
                    }${pnlData.percentage.toFixed(2)}%)`
                  ) : isClient && !address ? (
                    "---"
                  ) : (
                    "$0.0000 (0.00%)"
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full sm:w-auto justify-center items-center sm:items-end gap-2 py-[10px] px-4 rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] mt-4 sm:mt-0">
            <div className="text-[#9C9DA2] font-inter text-[14px] font-normal leading-[16px]">
              Wallet Address
            </div>
            <div className="text-[#D7E3EF] font-mono opacity-80 text-[12px] sm:text-[14px] font-normal text-center sm:text-left">
              {!isClient
                ? "Loading..."
                : isConnected
                ? address
                : "Not connected"}
            </div>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex flex-1">
          {/* Left Side - Assets Table */}
          <div className="w-full sm:w-1/2 border-r border-[rgba(255,255,255,0.1)] sm:border-r pt-8 pl-6 pr-6 sm:pl-8 sm:pr-0 overflow-y-auto pb-36">
            {/* <PortfolioChart userAddress={address ?? ""} /> */}
            <div className="mt-8">
              <div className="mb-6">
                <div className="text-[rgba(255,255,255,0.70)] text-[16px] font-bold uppercase">
                  Total Portfolio Value
                </div>
              </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-5 pl-4 pr-4 sm:pl-4 sm:pr-6 py-2 border-b border-[rgba(255,255,255,0.15)]">
              <div className="flex justify-start text-[#9C9DA2] text-[12px] font-normal">
                Available Yields
              </div>
              <div className="flex justify-end text-[#9C9DA2] text-[12px] font-normal items-center">
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
                    <path
                      d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>
              <div className="flex justify-end text-[#9C9DA2] text-[12px] font-normal items-center">
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
                    <path
                      d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>
              <div className="flex justify-end text-[#9C9DA2] text-[12px] font-normal items-center">
                Base APY
                <Tooltip content="7 Day trailing" side="top">
                  <svg
                    className="ml-1 cursor-pointer"
                    width="12"
                    height="12"
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.9987 6.66659V4.99992M4.9987 3.33325H5.00286M9.16536 4.99992C9.16536 7.30111 7.29988 9.16659 4.9987 9.16659C2.69751 9.16659 0.832031 7.30111 0.832031 4.99992C0.832031 2.69873 2.69751 0.833252 4.9987 0.833252C7.29988 0.833252 9.16536 2.69873 9.16536 4.99992Z"
                      stroke="#9C9DA2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Tooltip>
                <svg
                  className="ml-1"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g opacity="0.6">
                    <path
                      d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>
              <div className="flex justify-end text-[#9C9DA2] text-[12px] font-normal items-center">
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
                    <path
                      d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
                    className={`grid grid-cols-5 items-center py-4 pl-4 pr-4 sm:pr-6 relative ${
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
                    <div className="flex items-center gap-4">
                      <Image
                        src={`/images/icons/${strategy.asset.toLowerCase()}-${
                          strategy.type === "stable" ? "stable" : "incentive"
                        }.svg`}
                        alt={strategy.asset}
                        width={32}
                        height={32}
                      />
                      <div>
                        <div className="text-[#EDF2F8]   text-[12px] font-normal leading-normal">
                          {strategy.type === "stable" ? "sy" : "Incentive Maxi"}
                          {strategy.asset}
                        </div>
                        <div className="text-[#00D1A0]   text-[12px] font-normal">
                          +
                          {isClient
                            ? (() => {
                                // Use the correct APY value for calculations
                                let apyToUse = strategy.apy;
                                if (
                                  strategy.asset === "USD" &&
                                  strategy.type === "stable"
                                ) {
                                  apyToUse = usdApy || strategy.apy;
                                }

                                const apyValue = parseFloat(
                                  apyToUse?.replace("%", "") || "0"
                                );
                                if (isNaN(apyValue)) return "0.00";
                                return (
                                  (strategy.balance * exchangeRate * apyValue) /
                                  100
                                ).toFixed(2);
                              })()
                            : "0.00"}{" "}
                          in 1 year
                        </div>
                      </div>
                    </div>

                    {/* Deposited on */}
                    <div className="flex justify-end text-[#EDF2F8] text-[12px] font-normal">
                      {depositedChains.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {depositedChains.map((chain, idx) => (
                            <div key={chain} className="flex items-center">
                              <img
                                src={
                                  chainIconMap[chain]?.src ||
                                  "/images/logo/base.svg"
                                }
                                alt={chain}
                                className="w-4 h-4 rounded-full"
                              />
                              {idx < depositedChains.length - 1 && (
                                <span className="mx-1">,</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>

                    {/* Expiry */}
                    <div className="flex justify-end text-[#EDF2F8] text-[12px] font-normal">
                      {strategy.duration === "PERPETUAL_DURATION"
                        ? "Liquid"
                        : formatDuration(strategy.duration)}
                    </div>

                    {/* Base APY */}
                    <div className="flex justify-end text-[#EDF2F8] text-[12px] font-normal">
                      {(() => {
                        // For USD strategies, use the fetched APY data
                        if (
                          strategy.asset === "USD" &&
                          strategy.type === "stable"
                        ) {
                          return usdApy || "N/A";
                        }
                        // For other strategies, use the strategy APY or fallback
                        return strategy.apy || "N/A";
                      })()}
                    </div>

                    {/* Current Balance */}
                    <div className="flex justify-end text-[#EDF2F8] text-[12px] font-normal">
                      {isClient
                        ? `$${(strategy.balance * exchangeRate).toFixed(2)}`
                        : "$0.00"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-[#9C9DA2] text-center">
                    <div className="text-lg font-medium mb-2">
                      No yields found
                    </div>
                    <div className="text-sm">
                      Start depositing to see your yields here
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Global Tabs */}
          <div className="w-1/2 p-8 hidden sm:block overflow-auto h-[80vh]">
            <div className="flex flex-col h-full rounded-lg p-6 mb-56">
              <div className="flex gap-4 mb-6 border-b border-[rgba(255,255,255,0.15)]">
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className={`px-2 py-2 pb-4 text-[12px] font-normal leading-[16px] transition-colors relative ${
                    activeTab === "withdraw" ? "text-white" : "text-[#9C9DA2]"
                  }`}
                >
                  Withdraw
                  {activeTab === "withdraw" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("request")}
                  className={`px-2 py-2 pb-4 text-[12px] font-normal leading-[16px] transition-colors relative ${
                    activeTab === "request" ? "text-white" : "text-[#9C9DA2]"
                  }`}
                >
                  Requests
                  {activeTab === "request" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`px-2 py-2 pb-4 text-[12px] font-normal leading-[16px] transition-colors relative ${
                    activeTab === "activity" ? "text-white" : "text-[#9C9DA2]"
                  }`}
                >
                  Your Activity
                  {activeTab === "activity" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"></div>
                  )}
                </button>
              </div>
              {activeTab === "withdraw" && (
                <>
                  {selectedStrategy ? (
                    <>
                      <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
                        {/* Withdrawing assets from dropdown */}
                        <div className="flex flex-row justify-between items-center bg-[#B88AF8] bg-opacity-5 rounded-sm p-[6px] mb-4">
                          {/* Label */}
                          <label className="text-[#9C9DA2] font-inter text-[12px] block pl-2 pt-1">
                            Withdrawing assets from
                          </label>

                          {/* Network Display - Ethereum only */}
                          <div className="relative" key={targetChain}>
                            <div className="flex items-center justify-between w-full text-[#EDF2F8] rounded-md px-3 py-1 text-sm border border-[rgba(255,255,255,0.05)] opacity-50 cursor-not-allowed">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const chainOption =
                                    getUniqueChainConfigs.find(
                                      (c) => c.network === targetChain
                                    ) || getUniqueChainConfigs[0];
                                  console.log(
                                    "Current targetChain:",
                                    targetChain
                                  );
                                  console.log(
                                    "Found chainOption:",
                                    chainOption
                                  );
                                  return (
                                    <>
                                      <img
                                        key={targetChain}
                                        src={
                                          chainOption?.image ||
                                          "/images/logo/base.svg"
                                        }
                                        alt={chainOption?.name || "Base"}
                                        className="w-5 h-5 rounded-full"
                                        onError={(e) => {
                                          console.log(
                                            "Image failed to load for chain:",
                                            targetChain
                                          );
                                          e.currentTarget.src =
                                            "/images/logo/base.svg";
                                        }}
                                      />
                                      <span
                                        key={`text-${targetChain}`}
                                        className="text-[12px]"
                                      >
                                        {chainOption?.name || "Base"}
                                      </span>
                                    </>
                                  );
                                })()}
                                <Tooltip
                                  content="Withdrawals are available on Ethereum network."
                                  side="top"
                                >
                                  <div className="ml-1">
                                    <InfoIcon />
                                  </div>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Dropdown hidden - Ethereum only */}
                            {false && (
                              <div className="absolute z-10 w-full mt-2 bg-[#1F202D] rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {getUniqueChainConfigs.map((chainOption) => {
                                  const isSelected =
                                    targetChain === chainOption.network;
                                  return (
                                    <button
                                      key={chainOption.network}
                                      onClick={() => {
                                        setTargetChain(chainOption.network);
                                        setIsChainDropdownOpen(false);
                                      }}
                                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-[#1A1B1E] ${
                                        isSelected
                                          ? "bg-[#1A1B1E] text-white"
                                          : "text-[#EDF2F8]"
                                      }`}
                                    >
                                      <img
                                        src={chainOption.image}
                                        alt={chainOption.name}
                                        className="w-5 h-5 mr-2 rounded-full"
                                      />
                                      {chainOption.name}
                                      {isSelected && (
                                        <svg
                                          className="ml-auto w-4 h-4"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Header with strategy info and balance */}
                        <div className="flex items-end justify-between p-4 rounded-tl-[4px] rounded-tr-[4px] bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.15)]">
                          <div className="flex items-start gap-4">
                            <Image
                              src={`/images/icons/${selectedStrategy.asset.toLowerCase()}-${
                                selectedStrategy.type === "stable"
                                  ? "stable"
                                  : "incentive"
                              }.svg`}
                              alt={selectedStrategy.asset}
                              width={35}
                              height={35}
                            />
                            <div>
                              <div className="text-white font-semibold text-[12px]">
                                {selectedStrategy.type === "stable"
                                  ? "Stable Yield"
                                  : "Incentive Maxi"}{" "}
                                {selectedStrategy.asset}
                              </div>
                              <div className="text-[#00D1A0] text-[12px]">
                                +0.00 in 1 year
                              </div>
                            </div>
                            <div className="text-gray-400 text-[12px] -ml-1">
                              {formatDuration("PERPETUAL_DURATION")}
                            </div>
                          </div>
                          <div className="text-[#9C9DA2] text-right   text-[12px] font-normal leading-normal">
                            Balance (Ethereum):{" "}
                            <span className="text-[#D7E3EF] text-[12px] font-semibold leading-normal">
                              $
                              {(
                                selectedStrategyEthereumBalance * exchangeRate
                              ).toFixed(2)}{" "}
                              ({selectedStrategyEthereumBalance.toFixed(2)}{" "}
                              syUSD)
                            </span>
                          </div>
                        </div>

                        {/* Input field and percentage buttons in same row */}
                        <div className="flex items-center gap-4 mb-3 p-4 rounded-bl-[4px] rounded-br-[4px] bg-[rgba(255,255,255,0.02)]">
                          {/* Input field on the left with no borders */}
                          <div className="flex-grow ">
                            <div>
                              <input
                                type="text"
                                className="bg-transparent w-full border-none text-[20px] text-white font-medium outline-none"
                                value={withdrawAmount}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                style={{
                                  color: withdrawAmount ? "#ffffff" : "#9C9DA2",
                                  fontSize: "20px",
                                  fontWeight: "500",
                                }}
                              />
                            </div>
                          </div>

                          {/* Percentage buttons on the right */}
                          <div className="flex gap-2">
                            <button
                              className="bg-[#121521] rounded-[4px] border border-[rgba(156,157,162,0.3)] py-0.5 px-1.5 text-[#9C9DA2] text-[12px] font-normal w-[41px]"
                              onClick={() => handlePercentageClick(0.25)}
                            >
                              25%
                            </button>
                            <button
                              className="bg-[#121521] rounded-[4px] border border-[rgba(156,157,162,0.3)] py-0.5 px-1.5 text-[#9C9DA2] text-[12px] font-normal w-[41px]"
                              onClick={() => handlePercentageClick(0.5)}
                            >
                              50%
                            </button>
                            <button
                              className="bg-[#121521] rounded-[4px] border border-[rgba(156,157,162,0.3)] py-0.5 px-1.5 text-[#9C9DA2] text-[12px] font-normal w-[41px]"
                              onClick={() => handlePercentageClick(0.75)}
                            >
                              75%
                            </button>
                            <button
                              className="bg-[#121521] rounded-[4px] border border-[rgba(156,157,162,0.3)] py-0.5 px-1.5 text-[#9C9DA2] text-[12px] font-normal w-[41px]"
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
                            <div className="text-[#EDF2F8] text-[16px] font-medium leading-normal flex items-center gap-2">
                              {Number(
                                formatUnits(
                                  amountOut ? BigInt(amountOut) : BigInt(0),
                                  6
                                )
                              ).toFixed(2)}{" "}
                              {withdrawableAssets[selectedAssetIdx]?.name ||
                                "USDC"}
                            </div>
                            {false && (
                              <div className="">
                                <div className="relative w-full">
                                  <button
                                    onClick={() =>
                                      setIsAssetDropdownOpen(
                                        !isAssetDropdownOpen
                                      )
                                    }
                                    className="flex items-center justify-between w-full bg-[#131520] text-[#EDF2F8] rounded px-3 py-2 text-sm focus:outline-none border border-[rgba(255,255,255,0.19)]"
                                  >
                                    <div className="flex items-center gap-2">
                                      {withdrawableAssets[selectedAssetIdx]
                                        ?.image && (
                                        <img
                                          src={
                                            withdrawableAssets[selectedAssetIdx]
                                              .image
                                          }
                                          alt={
                                            withdrawableAssets[selectedAssetIdx]
                                              .name
                                          }
                                          className="w-5 h-5 rounded-full"
                                        />
                                      )}
                                      <span className="text-[12px] font-semibold">
                                        {
                                          withdrawableAssets[selectedAssetIdx]
                                            .name
                                        }
                                      </span>
                                    </div>
                                    <svg
                                      className={`w-4 h-4 transform transition-transform duration-200 ml-1 ${
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
                                      {withdrawableAssets.map((opt, idx) => (
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
                                              className="w-5 h-5 mr-2 ml-2 rounded-full"
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
                            !isEthereum
                              ? "bg-[#383941] text-black hover:bg-[#4a4d56] transition-colors cursor-pointer"
                              : isWithdrawing || isApproving
                              ? "bg-[#2D2F3D] text-[#9C9DA2] cursor-not-allowed"
                              : "bg-[#B88AF8] text-[#080B17] hover:bg-[#9F6EE9] transition-colors"
                          }`}
                          onClick={async () => {
                            if (!isEthereum) {
                              // Switch to Ethereum network
                              try {
                                console.log("Attempting to switch to Ethereum network...");
                                await switchChain({ chainId: 1 });
                                console.log("Successfully switched to Ethereum network");
                              } catch (error) {
                                console.error("Failed to switch network:", error);
                                setErrorMessage("Please switch to Ethereum network manually in your wallet");
                              }
                            } else if (isWithdrawSuccessLocal) {
                              // Reset state for another withdrawal
                              setWithdrawTxHash(null);
                              setIsWithdrawSuccessLocal(false);
                              setErrorMessage("");
                              setIsApproved(false);
                              setWithdrawAmount("");
                            } else if (isApproved) {
                              handleWithdraw();
                            } else {
                              handleApprove();
                            }
                          }}
                          disabled={
                            isEthereum && (
                              isWithdrawing ||
                              isApproving ||
                              !!(isWaitingForWithdraw && withdrawTxHash) ||
                              !!(isWaitingForApproval && approvalHash) ||
                              !withdrawAmount ||
                              parseFloat(withdrawAmount) <= 0 ||
                              (isWithdrawSuccessLocal
                                ? false
                                : parseFloat(withdrawAmount) >
                                  selectedStrategyEthereumBalance)
                            )
                          }
                        >
                          {(isWaitingForApproval && approvalHash) ? (
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
                              <span className={!isEthereum ? "text-black" : ""}>Waiting for Approval...</span>
                            </>
                          ) : (isApproving && approvalHash) ? (
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
                              <span className={!isEthereum ? "text-black" : ""}>Approving...</span>
                            </>
                          ) : (isWaitingForWithdraw && withdrawTxHash) ? (
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
                              <span className={!isEthereum ? "text-black" : ""}>Waiting for Confirmation...</span>
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
                              <span className={!isEthereum ? "text-black" : ""}>Transaction in Progress</span>
                            </>
                          ) : isWithdrawSuccessLocal ? (
                            "Request Another Withdraw"
                          ) : isApproved ? (
                            "Approved - Click to Withdraw"
                          ) : !isEthereum ? (
                            "Switch to Ethereum Network"
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
                        {!errorMessage &&
                          withdrawTxHash &&
                          isWithdrawSuccessLocal && (
                            <div className="flex justify-between items-center mt-4 bg-[rgba(0,209,160,0.1)] rounded-[4px] p-4">
                              <div className="text-[#00D1A0]   text-[14px]">
                                Transaction Successful
                              </div>
                              <a
                                href={`https://etherscan.io/tx/${withdrawTxHash}`}
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
                        <div className="text-[#9C9DA2] text-[12px] rounded-[4px] bg-[rgba(255,255,255,0.02)] p-[24px]">
                          <strong className="text-white">Note:</strong> By
                          initiating a withdrawal, your vault shares will be
                          converted into the underlying asset based on the
                          latest market rates, which may fluctuate slightly;
                          once the request is submitted,
                          <span className="text-white font-bold">
                            {" "}
                            please allow up to 24 hours
                          </span>{" "}
                          for the funds to be received, as processing times can
                          vary depending on network conditions—there's no need
                          to panic if the assets don't arrive immediately.
                        </div>
                      </div>
                    </>
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
                        <p className="text-[#9C9DA2] text-[14px] font-normal leading-[16px]">
                          Review your available balances, current rates, and
                          withdrawal
                          <br />
                          options for each yield source.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "request" && (
                <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
                  {/* Segmented Control Tabs */}
                  <div className="mb-4 flex justify-start">
                    <div className="relative bg-transparent rounded-[6px] flex w-[158px]">
                      <button
                        className={`w-[71px] px-3 py-1.5 text-[12px] font-normal leading-[16px] transition-all duration-200 rounded-l-[6px] rounded-r-[0px] flex items-center justify-center ${
                          requestTab === "pending"
                            ? "bg-[rgba(184,138,248,0.15)] text-[#D7E3EF] shadow-sm border-l border-t border-b border-r border-[rgba(184,138,248,0.5)]"
                            : "text-[#9C9DA2] hover:text-[#D7E3EF] border-l border-t border-b border-[rgba(255,255,255,0.2)]"
                        }`}
                        onClick={() => setRequestTab("pending")}
                      >
                        Pending
                      </button>
                      <button
                        className={`w-[87px] px-3 py-1.5 text-[12px] font-normal leading-[16px] transition-all duration-200 rounded-l-[0px] rounded-r-[6px] flex items-center justify-center ${
                          requestTab === "completed"
                            ? "bg-[rgba(184,138,248,0.15)] text-[#D7E3EF] shadow-sm border-l border-t border-b border-r border-[rgba(184,138,248,0.5)]"
                            : "text-[#9C9DA2] hover:text-[#D7E3EF] border-r border-t border-b border-[rgba(255,255,255,0.2)]"
                        }`}
                        onClick={() => setRequestTab("completed")}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  {/* Requests List */}
                  {requestTab === "pending" && (
                    <div className="space-y-2">
                      {isLoadingRequests ? (
                        <div>Loading...</div>
                      ) : withdrawRequests.length === 0 ? (
                        <div>No pending requests found.</div>
                      ) : (
                        withdrawRequests.map((req, idx) => {
                          const assetOption = findAssetByAddress(
                            req.withdraw_asset_address || ""
                          );
                          const assetImage = assetOption
                            ? assetOption.image
                            : "/images/icons/susd-stable.svg";
                          const assetDecimals = assetOption
                            ? assetOption.decimal
                            : 18;

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
                                          `https://etherscan.io/tx/${req.transaction_hash}`,
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
                                    ? new Date(
                                        req.creation_time * 1000
                                      ).toLocaleDateString()
                                    : "-"}
                                </div>

                                {/* Amounts row (same as completed) */}
                                <div className="flex items-center justify-center gap-2 flex-1">
                                  {/* Shares pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-[#D7E3EF] text-[12px] font-normal">
                                      {(
                                        Number(req.amount_of_shares) / 1e6
                                      ).toFixed(2)}
                                    </span>
                                    <a
                                      href={
                                        req.transaction_hash
                                          ? `https://etherscan.io/tx/${req.transaction_hash}`
                                          : undefined
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      tabIndex={req.transaction_hash ? 0 : -1}
                                      style={{
                                        pointerEvents: req.transaction_hash
                                          ? "auto"
                                          : "none",
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
                                  <svg
                                    width="15"
                                    height="12"
                                    viewBox="0 0 15 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0.832031 6H14.1654M14.1654 6L9.16536 1M14.1654 6L9.16536 11"
                                      stroke="#9C9DA2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg>
                                  {/* Assets pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-white text-[12px] font-normal">
                                      {(
                                        Number(req.amount_of_assets) /
                                        Math.pow(10, assetDecimals)
                                      ).toFixed(2)}
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
                              {/* {cancelStatusMap[req.request_id] ===
                              "cancelling" ? (
                                <span className="text-gray-400 text-[13px] font-medium">
                                  Cancelling...
                                </span>
                              ) : cancelStatusMap[req.request_id] ===
                                "cancelled" ? (
                                <span className="text-green-500 text-[13px] font-medium">
                                  Request Cancelled
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleCancel(req.request_id)}
                                  className="text-[#F85A3E] text-[12px] font-medium hover:underline whitespace-nowrap"
                                >
                                  Cancel Requests
                                </button>
                              )} */}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {requestTab === "completed" && (
                    <div className="space-y-2">
                      {isLoadingRequests ? (
                        <div>Loading...</div>
                      ) : completedRequests.length === 0 ? (
                        <div>No completed requests found.</div>
                      ) : (
                        completedRequests.map((req, idx) => {
                          const assetOption = findAssetByAddress(
                            req.withdraw_asset_address || ""
                          );
                          const assetImage = assetOption
                            ? assetOption.image
                            : "/images/icons/susd-stable.svg";
                          const assetDecimals = assetOption
                            ? assetOption.decimal
                            : 18;
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
                                          `https://etherscan.io/tx/${req.transaction_hash}`,
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
                                    ? new Date(
                                        req.creation_time * 1000
                                      ).toLocaleDateString()
                                    : "-"}
                                </div>

                                {/* Amounts row (aligned to the right) */}
                                <div className="flex items-center justify-end gap-2">
                                  {/* Shares pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-[#D7E3EF] text-[12px] font-normal">
                                      {(
                                        Number(req.amount_of_shares) / 1e6
                                      ).toFixed(2)}
                                    </span>
                                    <a
                                      href={
                                        req.transaction_hash
                                          ? `https://etherscan.io/tx/${req.transaction_hash}`
                                          : undefined
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      tabIndex={req.transaction_hash ? 0 : -1}
                                      style={{
                                        pointerEvents: req.transaction_hash
                                          ? "auto"
                                          : "none",
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
                                  <svg
                                    width="15"
                                    height="12"
                                    viewBox="0 0 15 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0.832031 6H14.1654M14.1654 6L9.16536 1M14.1654 6L9.16536 11"
                                      stroke="#9C9DA2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg>
                                  {/* Assets pill */}
                                  <div className="flex items-center justify-end gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-2 py-1">
                                    <span className="text-white text-[12px] font-normal">
                                      {(
                                        Number(req.amount_of_assets) /
                                        Math.pow(10, assetDecimals)
                                      ).toFixed(2)}
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

              {activeTab === "activity" && (
                <div className="rounded-[4px] bg-[rgba(255,255,255,0.02)] p-6">
                  <UserActivity />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortfolioSubpage;

// Disable static generation since this page uses client-side only features
export async function getServerSideProps() {
  return {
    props: {},
  };
}
