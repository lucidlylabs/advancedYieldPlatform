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
    isWithdrawable?: boolean;
  }>;
  image?: string;
  rpc?: string;
  chainId?: number;
  chainObject?: any;
}

interface TokenConfig {
  name: string;
  contract: string;
  decimal: number;
  image: string;
  isWithdrawable?: boolean;
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
  katana?: NetworkConfig;
  hyperEVM?: NetworkConfig; // Add hyperEVM support
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
  image?: string; // Strategy icon/image
  name?: string; // Strategy name (e.g., "syUSD", "syHLP")
  displayName?: string; // Display name
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

// Asset options based on chain and strategy
const getWithdrawableAssets = (chain: string, strategy?: StrategyWithBalance | null) => {
  // If strategy is provided, use its network config
  if (strategy) {
    // Handle hyperEVM chain (maps to hyperEVM in strategy config)
    const chainKey = chain === "hyperEVM" ? "hyperEVM" : chain;
    const chainConfig = (strategy as any)[chainKey] as NetworkConfig | undefined;
    if (chainConfig && chainConfig.tokens) {
      return chainConfig.tokens
        .filter((token) => token.isWithdrawable)
        .map((token) => ({
          name: token.name,
          contract: token.contract,
          image: token.image,
          decimal: token.decimal,
          isWithdrawable: true,
        }));
    }
  }

  // Fallback to default behavior for backward compatibility
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
  } else if (chain === "arbitrum") {
    return [
      {
        name: "wBTC",
        contract: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        image: "/images/icons/wbtc.png",
        decimal: 8,
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

// Helper function to get chain configs for a strategy
const getChainConfigs = (strategy: StrategyWithBalance | null): Record<string, any> => {
  if (!strategy) return {};
  
  // ALWAYS check for syHLP FIRST - it's a special case
  const isSyHLP = (strategy as any).name === "syHLP" || (strategy as any).hyperEVM;
  
  // For syHLP, return both hyperEVM and katana configs
  if (isSyHLP) {
    const configs: Record<string, any> = {};
    if ((strategy as any).hyperEVM) {
      configs.hyperliquid = (strategy as any).hyperEVM;
    }
    if (strategy.katana) {
      configs.katana = strategy.katana;
    }
    return configs;
  }
  
  const configs: Record<string, any> = {};
  
  if (strategy.base) {
    configs.base = strategy.base;
  }
  
  if (strategy.ethereum) {
    configs.ethereum = strategy.ethereum;
  }
  
  if (strategy.arbitrum) {
    configs.arbitrum = strategy.arbitrum;
  }
  
  if (strategy.katana) {
    configs.katana = strategy.katana;
  }
  
  if ((strategy as any).hyperEVM) {
    configs.hyperliquid = (strategy as any).hyperEVM;
  }
  
  return configs;
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
  const [isLoadingAmountOut, setIsLoadingAmountOut] = useState(false);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  // Add state for custom dropdown
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [depositedChains, setDepositedChains] = useState<string[]>([]);
  // Store deposited chains per strategy (keyed by strategy contract address)
  const [depositedChainsPerStrategy, setDepositedChainsPerStrategy] = useState<Record<string, string[]>>({});
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [usdApy, setUsdApy] = useState<string | null>(null);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  // Initialize targetChain - will be set when strategy is selected
  // Don't default to "base" to avoid unnecessary chain switches, especially for syHLP
  const [targetChain, setTargetChain] = useState<string>("");
  
  // Helper function to safely set targetChain - prevents syHLP from going to wrong chain
  const setTargetChainSafe = (chain: string, strategy: any) => {
    const isSyHLP = (strategy as any)?.name === "syHLP" || (strategy as any)?.hyperEVM;
    if (isSyHLP && chain !== "hyperEVM") {
      console.warn("⚠️ Attempted to set wrong chain for syHLP. Forcing hyperEVM.");
      setTargetChain("hyperEVM");
    } else {
      setTargetChain(chain);
    }
  };
  const [selectedStrategyNetworkBalance, setSelectedStrategyNetworkBalance] = useState<number>(0);
  const [isLoadingNetworkBalance, setIsLoadingNetworkBalance] = useState(false);
  
  // Helper function to get explorer URL based on chain
  const getExplorerUrl = (chainName: string, txHash: string) => {
    switch (chainName.toLowerCase()) {
      case "ethereum":
        return `https://etherscan.io/tx/${txHash}`;
      case "arbitrum":
        return `https://arbiscan.io/tx/${txHash}`;
      case "katana":
        return `https://explorer.katanarpc.com/tx/${txHash}`;
      case "hyperEVM":
        return `https://hyperevmscan.io/tx/${txHash}`;
      case "base":
      default:
        return `https://basescan.org/tx/${txHash}`;
    }
  };
  
  // Get chain configs for selected strategy
  const chainConfigs = useMemo(
    () => getChainConfigs(selectedStrategy),
    [selectedStrategy]
  );

  // Get withdrawable assets based on target chain and selected strategy
  const withdrawableAssets = useMemo(
    () => getWithdrawableAssets(targetChain, selectedStrategy),
    [targetChain, selectedStrategy]
  );

  // Reset selected asset index and withdraw amount when chain changes
  // Only reset approval when strategy changes, not when targetChain changes
  // This prevents resetting approval when user manually switches chains for the same strategy
  useEffect(() => {
    setSelectedAssetIdx(0);
    setWithdrawAmount(""); // Reset withdrawal amount when changing networks
    setIsApproved(false); // Reset approval state when strategy changes
    setApprovalHash(null); // Reset approval hash when strategy changes
  }, [selectedStrategy]);
  
  // Set default target chain based on strategy when strategy changes
  useEffect(() => {
    if (selectedStrategy) {
      // ALWAYS check for syHLP FIRST - it's a special case even though it's USD asset
      const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
      
      if (isSyHLP) {
        console.log("🔵 useEffect: syHLP detected - setting targetChain to hyperEVM");
        setTargetChain("hyperEVM"); // syHLP is only on HyperEVM - NEVER use Base
      } else if (selectedStrategy.asset === "BTC") {
        setTargetChain("arbitrum");
      } else if (selectedStrategy.asset === "ETH") {
        console.log("🔵 useEffect: syETH detected - setting targetChain to arbitrum");
        setTargetChain("arbitrum"); // syETH is only on Arbitrum
      } else if (selectedStrategy.asset === "USD") {
        // This is syUSD (not syHLP)
        console.log("🔵 useEffect: syUSD detected - setting targetChain to base");
        setTargetChain("base"); // Default to base for USD (syUSD)
      }
    }
  }, [selectedStrategy]);

  // Debug: Log withdrawableAssets changes
  useEffect(() => {
    console.log("🔄 withdrawableAssets updated:", {
      targetChain,
      withdrawableAssets,
      assetContract: withdrawableAssets?.[0]?.contract,
    });
  }, [withdrawableAssets, targetChain]);

  // Fetch balance for selected strategy on the selected network
  useEffect(() => {
    const fetchNetworkSpecificBalance = async () => {
      if (!selectedStrategy || !address) {
        setSelectedStrategyNetworkBalance(0);
        return;
      }

      setIsLoadingNetworkBalance(true);
      try {
        // Get chain configs dynamically
        const configs = getChainConfigs(selectedStrategy);
        const chainConfig = configs[targetChain as keyof typeof configs];
        
        if (!chainConfig) {
          console.error(`No chain config found for: ${targetChain} on strategy ${selectedStrategy.asset}`);
          setSelectedStrategyNetworkBalance(0);
          setIsLoadingNetworkBalance(false);
          return;
        }

        const client = createPublicClient({
          transport: http(chainConfig.rpc),
          chain: {
            id: chainConfig.chainId,
            name: chainConfig.chainObject.name,
            network: chainConfig.chainObject.network,
            nativeCurrency: chainConfig.chainObject.nativeCurrency,
            rpcUrls: chainConfig.chainObject.rpcUrls,
          },
        });

        const [balance, decimals] = await Promise.all([
          client.readContract({
            address: selectedStrategy.boringVaultAddress as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as Address],
          }),
          client.readContract({
            address: selectedStrategy.boringVaultAddress as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          }),
        ]);

        const formattedBalance = parseFloat(formatUnits(balance as bigint, decimals as number));
        console.log(`${targetChain} specific balance for ${selectedStrategy.contract}:`, formattedBalance);
        setSelectedStrategyNetworkBalance(formattedBalance);
      } catch (error) {
        console.error(`Error fetching ${targetChain} balance:`, error);
        setSelectedStrategyNetworkBalance(0);
      } finally {
        setIsLoadingNetworkBalance(false);
      }
    };

    fetchNetworkSpecificBalance();
  }, [selectedStrategy, targetChain, address, isWithdrawSuccessLocal]);

  // Keep legacy variable for compatibility
  const selectedStrategyEthereumBalance = selectedStrategyNetworkBalance;

  const [cancelStatusMap, setCancelStatusMap] = useState<{
    [key: string]: "idle" | "cancelling" | "cancelled";
  }>({});
  // PNL temporarily commented out
  // const [pnlData, setPnlData] = useState<{
  //   value: number;
  //   percentage: number;
  //   isProfitable: boolean;
  // } | null>(null);
  // const [isLoadingPnl, setIsLoadingPnl] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
  // Store exchange rates per strategy (keyed by contract address)
  const [exchangeRatesPerStrategy, setExchangeRatesPerStrategy] = useState<Record<string, number>>({});
  const [wbtcPrice, setWbtcPrice] = useState<number>(0);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [isLoadingWbtcPrice, setIsLoadingWbtcPrice] = useState(false);
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

    if (selectedStrategy) {
      // Get chains from selected strategy
      if (selectedStrategy.base && selectedStrategy.base.image) {
        uniqueChains.set("base", {
          name: "Base",
          network: "base",
          image: selectedStrategy.base.image,
        });
      }
      if (selectedStrategy.ethereum && selectedStrategy.ethereum.image) {
        uniqueChains.set("ethereum", {
          name: "Ethereum",
          network: "ethereum",
          image: selectedStrategy.ethereum.image,
        });
      }
      if (selectedStrategy.arbitrum && selectedStrategy.arbitrum.image) {
        uniqueChains.set("arbitrum", {
          name: "Arbitrum",
          network: "arbitrum",
          image: selectedStrategy.arbitrum.image,
        });
      }
      if (selectedStrategy.katana && selectedStrategy.katana.image) {
        uniqueChains.set("katana", {
          name: "Katana",
          network: "katana",
          image: selectedStrategy.katana.image,
        });
      }
      if ((selectedStrategy as any).hyperEVM && (selectedStrategy as any).hyperEVM.image) {
        uniqueChains.set("hyperEVM", {
          name: "HyperEVM",
          network: "hyperEVM",
          image: (selectedStrategy as any).hyperEVM.image,
        });
      }
    }

    // Filter chains based on strategy type
    // syUSD: Base and Ethereum
    // syBTC: Arbitrum only
    // syHLP: HyperEVM only
    // Others: All available chains
    const filteredChains = Array.from(uniqueChains.values());
    
    if (selectedStrategy) {
      // ALWAYS check for syHLP FIRST - it's a special case even though it's USD asset
      const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
      
      if (isSyHLP) {
        return filteredChains.filter((chain) => chain.network === "hyperEVM");
      } else if (selectedStrategy.asset === "BTC") {
        return filteredChains.filter((chain) => chain.network === "arbitrum");
      } else if (selectedStrategy.asset === "ETH") {
        return filteredChains.filter((chain) => chain.network === "arbitrum");
      } else if (selectedStrategy.asset === "USD") {
        // This is syUSD (not syHLP)
        return filteredChains.filter(
          (chain) => chain.network === "base" || chain.network === "ethereum"
        );
      }
    }
    
    return filteredChains;
  }, [selectedStrategy]);

  // Watch deposit transaction
  const { isLoading: isWaitingForDeposit, isSuccess: isDepositSuccess } =
    useTransaction({
      hash: transactionHash || undefined,
    });

  // Fetch exchange rate for a specific strategy (returns the rate)
  const fetchExchangeRateForStrategy = async (strategy: StrategyWithBalance): Promise<number> => {
    try {
      if (!strategy || !strategy.rateProvider) {
        console.log(`No rate provider for strategy ${strategy.contract}, using fallback rate 1.0`);
        return 1.0;
      }

      // Get quote token based on strategy asset type
      let quoteTokenContract: string;
      let quoteTokenDecimals: number;
      
      // Check if it's syHLP - it uses USDT0 on HyperEVM, not USDC on Base
      if ((strategy as any).name === "syHLP" || (strategy as any).hyperEVM) {
        // syHLP uses USDT0 on HyperEVM
        const hyperEVMConfig = (strategy as any).hyperEVM;
        if (hyperEVMConfig?.tokens && hyperEVMConfig.tokens.length > 0) {
          // Get the first withdrawable token (USDT0)
          const withdrawableToken = hyperEVMConfig.tokens.find((t: any) => t.isWithdrawable) || hyperEVMConfig.tokens[0];
          quoteTokenContract = withdrawableToken.contract;
          quoteTokenDecimals = withdrawableToken.decimal || 6;
          console.log("🔥 syHLP: Using USDT0 as quote token:", {
            contract: quoteTokenContract,
            decimals: quoteTokenDecimals,
            tokenName: withdrawableToken.name,
          });
        } else {
          // Fallback to USDT0 address if tokens not found
          quoteTokenContract = "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb";
          quoteTokenDecimals = 6;
          console.log("🔥 syHLP: Using fallback USDT0 address:", quoteTokenContract);
        }
      } else if (strategy.asset === "USD") {
        // For syUSD and other USD strategies, use USDC on Base
        quoteTokenContract = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        quoteTokenDecimals = 6;
      } else if (strategy.asset === "BTC") {
        // For BTC strategies, use wBTC on Arbitrum
        quoteTokenContract = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
        quoteTokenDecimals = 8;
      } else if (strategy.asset === "ETH") {
        // For ETH strategies, use WETH on Arbitrum
        quoteTokenContract = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        quoteTokenDecimals = 18;
      } else {
        // Fallback
        quoteTokenContract = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        quoteTokenDecimals = 6;
      }

      const rateProviderAddress = strategy.rateProvider;

      // Get RPC URL based on strategy network
      let rpcUrl: string;
      let chainId: number;
      let chainName: string;
      
      if (strategy.asset === "BTC") {
        // syBTC is on Arbitrum
        rpcUrl = (strategy.arbitrum as any)?.rpc || "https://arb1.arbitrum.io/rpc";
        chainId = 42161;
        chainName = "Arbitrum One";
      } else if (strategy.asset === "ETH") {
        // syETH is on Arbitrum
        rpcUrl = (strategy.arbitrum as any)?.rpc || "https://arb1.arbitrum.io/rpc";
        chainId = 42161;
        chainName = "Arbitrum One";
      } else if ((strategy as any).name === "syHLP" || (strategy as any).hyperEVM) {
        // syHLP is on HyperEVM
        rpcUrl = ((strategy as any).hyperEVM as any)?.rpc || "https://rpc.hypurrscan.io";
        chainId = 999;
        chainName = "HyperEVM";
      } else {
        // syUSD is on Base (default)
        rpcUrl = (strategy.base as any)?.rpc || "https://base.llamarpc.com";
        chainId = 8453;
        chainName = "Base";
      }

      // RPC URLs with fallbacks
      const rpcUrls = [
        rpcUrl,
        ...(strategy.asset === "BTC" || strategy.asset === "ETH"
          ? ["https://arb1.arbitrum.io/rpc"]
          : (strategy as any).name === "syHLP" || (strategy as any).hyperEVM
          ? ["https://hyperliquid.drpc.org"] // HyperEVM fallback
          : [
              "https://base.llamarpc.com",
              "https://base-rpc.publicnode.com",
              "https://base.blockpi.network/v1/rpc/public",
              "https://base-mainnet.g.alchemy.com/v2/demo",
              "https://base.meowrpc.com",
            ]),
      ];

      let rate;
      let lastError;

      // Try each RPC URL until one works
      for (const rpc of rpcUrls) {
        try {
          // Get chain object based on strategy
          let chainObject: any;
          if ((strategy as any).name === "syHLP" || (strategy as any).hyperEVM) {
            chainObject = ((strategy as any).hyperEVM as any)?.chainObject || {
              id: 999,
          name: "HyperEVM",
          network: "hyperEVM",
              nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
              rpcUrls: {
                default: { http: [rpc] },
                public: { http: [rpc] },
              },
            };
          } else if (strategy.asset === "BTC" || strategy.asset === "ETH") {
            chainObject = (strategy.arbitrum as any)?.chainObject || {
              id: 42161,
              name: "Arbitrum One",
              network: "arbitrum",
              nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
              rpcUrls: {
                default: { http: [rpc] },
                public: { http: [rpc] },
              },
            };
          } else {
            chainObject = (strategy.base as any)?.chainObject || {
              id: 8453,
              name: "Base",
              network: "base",
              nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
              rpcUrls: {
                default: { http: [rpc] },
                public: { http: [rpc] },
              },
            };
          }

          const client = createPublicClient({
            transport: http(rpc),
            chain: chainObject,
          });

          console.log("🔥 Calling getRateInQuoteSafe with:", {
            rateProviderAddress,
            quoteTokenContract,
            chainId,
            chainName,
            rpc,
            strategyName: (strategy as any).name,
            strategyAsset: strategy.asset,
          });

          rate = await client.readContract({
            address: rateProviderAddress as Address,
            abi: RATE_PROVIDER_ABI,
            functionName: "getRateInQuoteSafe",
            args: [quoteTokenContract as Address],
          });

          console.log(
            `✅ Successfully fetched exchange rate using RPC: ${rpc}`,
            `Rate: ${rate.toString()}`
          );
          break;
        } catch (error) {
          console.warn(`RPC ${rpc} failed:`, error);
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

      // Format rate based on quote token decimals
      // The rate represents how much quote token you get for 1 share token
      const rateFormatted = formatUnits(rate as bigint, quoteTokenDecimals);
      const rateNumber = parseFloat(rateFormatted);

      console.log(
        "Exchange rate formatted:",
        rateFormatted,
        "Rate number:",
        rateNumber
      );

      // Since 1 syUSD = rateNumber USDC, and 1 USDC ≈ 1 USD
      // The exchange rate for syUSD to USD is approximately the same
      console.log(
        "🔥 EXCHANGE RATE FETCHED SUCCESSFULLY:",
        rateNumber,
        `${strategy.asset === "BTC" ? "wBTC" : strategy.asset === "ETH" ? "WETH" : "USD"} per ${strategy.asset === "USD" ? "syUSD" : strategy.asset === "ETH" ? "syETH" : "syBTC"}`,
        `for strategy ${strategy.contract}`
      );
      console.log("🔥 Raw rate from contract:", rate.toString());
      console.log("🔥 Formatted rate:", rateFormatted);
      return rateNumber;
    } catch (error) {
      console.error(`🔥 ERROR FETCHING EXCHANGE RATE for ${strategy.contract}:`, error);
      // Fallback to 1.0 if exchange rate fetch fails
      console.log("🔥 USING FALLBACK EXCHANGE RATE: 1.0");
      return 1.0;
    }
  };

  // Fetch exchange rate for strategy to underlying asset conversion (for selected strategy)
  const fetchExchangeRate = async (strategy?: StrategyWithBalance | null) => {
    setIsLoadingExchangeRate(true);
    try {
      // Use the selected strategy or default to first strategy with balance
      const strategyToUse = strategy || strategiesWithBalance[0];
      
      if (!strategyToUse || !strategyToUse.rateProvider) {
        console.log("No strategy or rate provider available, using fallback rate 1.0");
        setExchangeRate(1.0);
        setIsLoadingExchangeRate(false);
        return;
      }

      const rateNumber = await fetchExchangeRateForStrategy(strategyToUse);
      setExchangeRate(rateNumber);
    } catch (error) {
      console.error("🔥 ERROR in fetchExchangeRate:", error);
      setExchangeRate(1.0);
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  // Fetch exchange rates for all strategies
  const fetchAllExchangeRates = async () => {
    if (strategiesWithBalance.length === 0) return;
    
    setIsLoadingExchangeRate(true);
    try {
      const rates: Record<string, number> = {};
      
      // Fetch rates for all strategies in parallel
      await Promise.all(
        strategiesWithBalance.map(async (strategy) => {
          const rate = await fetchExchangeRateForStrategy(strategy);
          rates[strategy.contract] = rate;
        })
      );
      
      setExchangeRatesPerStrategy(rates);
      console.log("🔥 All exchange rates fetched:", rates);
    } catch (error) {
      console.error("🔥 ERROR fetching all exchange rates:", error);
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  // PNL temporarily commented out
  // // Fetch PnL data
  // const fetchPnlData = async (userAddress: string) => {
  //   if (!userAddress) return;

  //   setIsLoadingPnl(true);
  //   try {
  //     console.log(`Fetching PnL data for address: ${userAddress}`);
  //     const response = await fetch(
  //       `http://localhost:3001/api/pnl/${userAddress}`
  //     );

  //     console.log("PnL API Response status:", response.status);
  //     console.log(
  //       "PnL API Response headers:",
  //       Object.fromEntries(response.headers.entries())
  //     );

  //     const data = await response.json();
  //     console.log("=== FULL PnL API RESPONSE ===");
  //     console.log(JSON.stringify(data, null, 2));
  //     console.log("=== END PnL API RESPONSE ===");

  //     if (data.success && data.data && data.data.pnl) {
  //       console.log("PnL data received:", data.data.pnl);
  //       setPnlData(data.data.pnl);
  //     } else {
  //       console.error("Failed to fetch PnL data:", data.message);
  //       console.error("Full PnL error response:", data);
  //       setPnlData(null);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching PnL data:", error);
  //     setPnlData(null);
  //   } finally {
  //     setIsLoadingPnl(false);
  //   }
  // };

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

  // Function to fetch wBTC price
  const fetchWbtcPrice = async () => {
    setIsLoadingWbtcPrice(true);
    try {
      const wbtcPriceUrl = (BTC_STRATEGIES.PERPETUAL_DURATION.STABLE as any).wbtcPrice;
      
      if (!wbtcPriceUrl || typeof wbtcPriceUrl !== "string" || !wbtcPriceUrl.startsWith("http")) {
        console.warn("wBTC price URL not available");
        setWbtcPrice(0);
        setIsLoadingWbtcPrice(false);
        return;
      }

      const response = await fetch(wbtcPriceUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle both string and number formats: {"result":"91477.81"} or {"result":91477.81}
      const price = data?.result || data?.price || data?.rate;
      
      if (typeof price === "number") {
        setWbtcPrice(price);
      } else if (typeof price === "string") {
        const parsedPrice = parseFloat(price);
        if (!isNaN(parsedPrice) && isFinite(parsedPrice)) {
          setWbtcPrice(parsedPrice);
        } else {
          console.error(`Failed to parse wBTC price: ${price}`);
          setWbtcPrice(0);
        }
      } else {
        console.error('Unexpected wBTC price data structure:', data);
        setWbtcPrice(0);
      }
    } catch (error) {
      console.error('Error fetching wBTC price:', error);
      setWbtcPrice(0);
    } finally {
      setIsLoadingWbtcPrice(false);
    }
  };

  // Fetch exchange rate when strategies with balance change or selected strategy changes
  useEffect(() => {
    if (strategiesWithBalance.length > 0 || selectedStrategy) {
      fetchExchangeRate(selectedStrategy);
    }
  }, [strategiesWithBalance, selectedStrategy]);

  // Fetch wBTC price when strategies with balance change (always fetch if any BTC strategy exists)
  useEffect(() => {
    // Always fetch wBTC price if there are any BTC strategies, regardless of selection
    const hasBtcStrategy = strategiesWithBalance.some(s => s.asset === "BTC");
    if (hasBtcStrategy) {
      fetchWbtcPrice();
    } else {
      setWbtcPrice(0);
    }
  }, [strategiesWithBalance]);

  // Function to fetch ETH price
  const fetchEthPrice = async () => {
    try {
      const ethPriceUrl = (ETH_STRATEGIES.PERPETUAL_DURATION.STABLE as any).ethPrice;
      
      if (!ethPriceUrl || typeof ethPriceUrl !== "string" || !ethPriceUrl.startsWith("http")) {
        console.warn("ETH price URL not available");
        setEthPrice(0);
        return;
      }

      const response = await fetch(ethPriceUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle both string and number formats: {"result":"3500.00"} or {"result":3500.00}
      const price = data?.result || data?.price || data?.rate;
      
      if (typeof price === "number") {
        setEthPrice(price);
      } else if (typeof price === "string") {
        const parsedPrice = parseFloat(price);
        if (!isNaN(parsedPrice) && isFinite(parsedPrice)) {
          setEthPrice(parsedPrice);
        } else {
          console.error(`Failed to parse ETH price: ${price}`);
          setEthPrice(0);
        }
      } else {
        console.error('Unexpected ETH price data structure:', data);
        setEthPrice(0);
      }
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      setEthPrice(0);
    }
  };

  // Fetch ETH price when strategies with balance change (always fetch if any ETH strategy exists)
  useEffect(() => {
    // Always fetch ETH price if there are any ETH strategies, regardless of selection
    const hasEthStrategy = strategiesWithBalance.some(s => s.asset === "ETH");
    if (hasEthStrategy) {
      fetchEthPrice();
    } else {
      setEthPrice(0);
    }
  }, [strategiesWithBalance]);

  // PNL temporarily commented out
  // // Fetch PnL when address changes
  // useEffect(() => {
  //   if (address && isConnected) {
  //     fetchPnlData(address);
  //   }
  // }, [address, isConnected]);

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
    hyperliquid: {
      src: "/images/networks/hyperEVM.svg",
      label: "HyperEVM",
    },
    hyperEVM: {
      src: "/images/networks/hyperEVM.svg",
      label: "HyperEVM",
    },
  };

  useEffect(() => {
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    if (withdrawTxHash && isWithdrawSuccess && !isWithdrawSuccessLocal && address) {
      // Handle successful withdrawal
      console.log("✅ Withdraw transaction confirmed successfully");
      setIsWithdrawing(false);
      setIsWithdrawSuccessLocal(true);

      const refreshAfterWithdraw = async () => {
        try {
          setIsRefreshingBalance(true);
          await Promise.all([checkAllBalances(), checkAllWithdrawableBalances()]);
        } catch (error) {
          console.error("Error refreshing balances:", error);
          setErrorMessage("Failed to refresh balances.");
        } finally {
          setIsRefreshingBalance(false);
        }

        // Give the indexer a moment to update, then refresh queued requests
        refreshTimeout = setTimeout(() => {
          fetchWithdrawRequests("", address);
        }, 1500);
      };

      refreshAfterWithdraw();
      // Don't reset form state - let user see the transaction hash and close manually
      // setSelectedStrategy(null);
      // setWithdrawAmount("");
      // setWithdrawTxHash(null);
    }
    // Keep loading until transaction completes - don't set isWithdrawing to false prematurely
    // Don't check isError from useTransaction as it can give false positives during pending state
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [withdrawTxHash, isWithdrawSuccess, isWithdrawSuccessLocal, address]);

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

  // Additional check: verify on-chain allowance when approval hash exists but isApproved is false
  // This handles cases where the transaction succeeded but the hook didn't detect it
  useEffect(() => {
    const verifyAllowanceOnChain = async () => {
      if (!approvalHash || isApproved || !selectedStrategy || !withdrawAmount || !address) return;
      
      try {
        const shareTokenAddress = (selectedStrategy.shareAddress || selectedStrategy.boringVaultAddress) as Address;
        const solverAddress = selectedStrategy.solverAddress as Address;
        
        // Determine chain config
        const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
        let rpcUrl: string;
        let targetChainId: number;
        
        if (isSyHLP) {
          rpcUrl = (selectedStrategy as any).hyperEVM?.rpc || "https://rpc.hypurrscan.io";
          targetChainId = (selectedStrategy as any).hyperEVM?.chainId || 999;
        } else {
          const chainConfig = chainConfigs[targetChain as keyof typeof chainConfigs];
          rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;
          targetChainId = chainConfig?.chainId || 8453;
        }
        
        const client = createPublicClient({
          transport: http(rpcUrl),
          chain: { id: targetChainId, name: "Chain", network: "chain", nativeCurrency: { decimals: 18, name: "ETH", symbol: "ETH" }, rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } } },
        });
        
        const decimals = selectedStrategy.shareAddress_token_decimal || 18;
        const sharesAmount = parseUnits(withdrawAmount, decimals);
        
        const allowance = await client.readContract({
          address: shareTokenAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address as Address, solverAddress],
        }) as bigint;
        
        console.log("🔍 On-chain allowance verification:", {
          allowance: allowance.toString(),
          required: sharesAmount.toString(),
          isSufficient: allowance >= sharesAmount,
        });
        
        if (allowance >= sharesAmount) {
          console.log("✅ On-chain allowance is sufficient, setting isApproved to true");
          setIsApproved(true);
          setIsApproving(false);
        }
      } catch (error) {
        console.error("Error verifying on-chain allowance:", error);
      }
    };
    
    // Delay the check to give the transaction time to be indexed
    const timeoutId = setTimeout(verifyAllowanceOnChain, 3000);
    return () => clearTimeout(timeoutId);
  }, [approvalHash, isApproved, selectedStrategy, withdrawAmount, address, targetChain]);

  // Helper function to add delay between requests
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Function to check balance for a strategy across all networks
  const checkStrategyBalance = async (strategy: any) => {
    // Use shareAddress if available, otherwise fallback to boringVaultAddress
    const vaultAddress = strategy.shareAddress || strategy.boringVaultAddress;
    
    if (!address || !vaultAddress) {
      console.warn("Missing address or vault address:", { 
        address, 
        vaultAddress, 
        strategy: (strategy as any).name,
        shareAddress: strategy.shareAddress,
        boringVaultAddress: strategy.boringVaultAddress,
      });
      return 0;
    }

    try {
      // Validate vault address
      if (
        !vaultAddress ||
        vaultAddress === "0x0000000000000000000000000000000000000000"
      ) {
        console.warn("Invalid vault address for strategy:", { 
          strategy: (strategy as any).name, 
          vaultAddress 
        });
        return 0;
      }

      // Ensure addresses are properly checksummed
      const checksummedVaultAddress = getAddress(vaultAddress);
      const checksummedUserAddress = getAddress(address);

      let totalBalance = 0;
      // Determine which networks to check based on strategy
      let networks: string[];
      if (strategy.asset === "BTC") {
        networks = ["arbitrum"];
      } else if (strategy.asset === "ETH") {
        networks = ["arbitrum"]; // syETH is only on Arbitrum
      } else if ((strategy as any).name === "syHLP" || (strategy as any).hyperEVM) {
        networks = ["hyperEVM"]; // syHLP is only on HyperEVM
      } else {
        networks = ["base", "ethereum", "arbitrum", "katana"]; // syUSD and other USD strategies check Base, Ethereum, Arbitrum, and Katana
      }

      console.log(`🔍 Checking balance for ${(strategy as any).name || strategy.contract} on networks:`, networks, {
        strategyName: (strategy as any).name,
        strategyContract: strategy.contract,
        vaultAddress,
        shareAddress: strategy.shareAddress,
        boringVaultAddress: strategy.boringVaultAddress,
        userAddress: address,
        checksummedUserAddress: checksummedUserAddress,
        checksummedVaultAddress: checksummedVaultAddress,
        asset: strategy.asset,
        type: strategy.type,
        hasBaseConfig: !!(strategy as any).base,
        hasEthereumConfig: !!(strategy as any).ethereum,
        hasArbitrumConfig: !!(strategy as any).arbitrum,
        hasKatanaConfig: !!(strategy as any).katana,
      });

      for (const networkKey of networks) {
        // Handle hyperEVM -> hyperEVM mapping
        const configKey = networkKey === "hyperEVM" ? "hyperEVM" : networkKey;
        const networkConfig = (strategy as any)[configKey];

        // Skip if network config doesn't exist
        if (!networkConfig || !networkConfig.rpc || !networkConfig.chainId) {
          console.warn(`⏭️ Skipping ${networkKey} - no config`, {
            networkKey,
            configKey,
            hasConfig: !!networkConfig,
            hasRpc: !!networkConfig?.rpc,
            hasChainId: !!networkConfig?.chainId,
            strategyName: (strategy as any).name,
            strategyKeys: Object.keys(strategy),
          });
          continue;
        }

        try {
          // Use RPC URLs from chainObject if available, otherwise use single RPC
          const rpcUrls = networkConfig.chainObject?.rpcUrls?.default?.http || 
                         networkConfig.chainObject?.rpcUrls?.public?.http || 
                         [networkConfig.rpc];
          
          let lastError: Error | null = null;
          let balance: bigint | null = null;
          let decimals: number | null = null;
          
          // Try each RPC URL until one works
          for (const rpcUrl of rpcUrls) {
            try {
              const client = createPublicClient({
                transport: http(rpcUrl),
                chain: {
                  id: networkConfig.chainId,
                  name: networkConfig.chainObject.name,
                  network: networkConfig.chainObject.network,
                  nativeCurrency: networkConfig.chainObject.nativeCurrency,
                  rpcUrls: {
                    default: { http: rpcUrls },
                    public: { http: rpcUrls },
                  },
                },
              });

              // Add small delay between contract calls to prevent rate limiting
              await delay(100);

              // Use shareAddress_token_decimal if available, otherwise fetch decimals
              if (strategy.shareAddress_token_decimal) {
                decimals = strategy.shareAddress_token_decimal;
                console.log(`Using shareAddress_token_decimal: ${decimals} for ${networkKey}`);
              } else {
                decimals = await client.readContract({
                  address: checksummedVaultAddress,
                  abi: ERC20_ABI,
                  functionName: "decimals",
                }) as number;
              }

              balance = await client.readContract({
                address: checksummedVaultAddress,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [checksummedUserAddress],
              }) as bigint;
              
              // Success! Break out of RPC loop
              break;
            } catch (rpcError) {
              lastError = rpcError instanceof Error ? rpcError : new Error(String(rpcError));
              console.warn(`RPC ${rpcUrl} failed for ${networkKey}, trying next...`, rpcError);
              // Continue to next RPC URL
            }
          }
          
          // If all RPCs failed, log error but don't throw - continue to next network
          if (balance === null || decimals === null) {
            const errorMsg = lastError?.message || `All RPC endpoints failed for ${networkKey}`;
            console.error(`❌ Failed to fetch balance from ${networkKey}:`, {
              network: networkKey,
              strategy: (strategy as any).name || strategy.contract,
              error: errorMsg,
              rpcUrls: rpcUrls,
              vaultAddress: checksummedVaultAddress,
              userAddress: checksummedUserAddress,
            });
            // Continue to next network instead of throwing
            continue;
          }

          const formattedBalance = parseFloat(
            formatUnits(balance as bigint, decimals)
          );

          // Ensure we handle very small balances correctly (not rounded to 0)
          // Use a more precise check - even very small balances should be counted
          const balanceToAdd = isNaN(formattedBalance) || formattedBalance < 0 ? 0 : formattedBalance;
          
          // Log if balance is very small but not zero to help debug
          if (balanceToAdd > 0 && balanceToAdd < 0.000001) {
            console.log(`⚠️ Very small balance detected on ${networkKey}: ${balanceToAdd}`, {
              rawBalance: balance.toString(),
              decimals,
              formattedBalance,
            });
          }

          console.log(`✅ ${networkKey} balance for ${(strategy as any).name || strategy.asset}: ${balanceToAdd}`, {
            network: networkKey,
            strategy: (strategy as any).name || strategy.contract,
            rawBalance: balance.toString(),
            rawBalanceBigInt: balance,
            decimals,
            formattedBalance: balanceToAdd,
            vaultAddress: checksummedVaultAddress,
            shareAddress: strategy.shareAddress,
            boringVaultAddress: strategy.boringVaultAddress,
            userAddress: checksummedUserAddress,
            isNaN: isNaN(formattedBalance),
            rpc: networkConfig.rpc,
            rpcUrls: rpcUrls,
          });
          totalBalance += balanceToAdd;
        } catch (error) {
          const errorDetails = {
            network: networkKey,
            strategy: (strategy as any).name || strategy.contract,
            vaultAddress: checksummedVaultAddress,
            shareAddress: strategy.shareAddress,
            boringVaultAddress: strategy.boringVaultAddress,
            userAddress: checksummedUserAddress,
            rpc: networkConfig?.rpc,
            rpcUrls: networkConfig?.chainObject?.rpcUrls?.default?.http || [networkConfig?.rpc],
            chainId: networkConfig?.chainId,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          };
          console.error(`❌ Error checking ${networkKey} balance for ${(strategy as any).name || strategy.asset}:`, errorDetails);
          
          // Check if it's a rate limit error
          if (error instanceof Error && (error.message.includes("429") || error.message.includes("rate limit"))) {
            console.warn(
              `Rate limited on ${networkKey}, waiting before retry...`
            );
            await delay(2000); // Wait 2 seconds before continuing
          }
          // Continue to next network instead of failing completely - don't let one network failure stop the whole check
        }
      }

      console.log(`📊 Total portfolio balance for ${(strategy as any).name || strategy.asset}: ${totalBalance}`, {
        strategy: (strategy as any).name || strategy.contract,
        asset: strategy.asset,
        type: strategy.type,
        totalBalance,
        networksChecked: networks,
        vaultAddress,
        userAddress: address,
        isGreaterThanZero: totalBalance > 0,
      });
      
      return totalBalance;
    } catch (error) {
      console.error("Error checking strategy balance:", { 
        strategy: (strategy as any).name || strategy.contract,
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage("Failed to check strategy balance.");
      return 0;
    }
  };

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
    // Determine which networks to check based on strategy asset
    let networks: string[];
    if (strategy.asset === "BTC") {
      // syBTC is only on Arbitrum
      networks = ["arbitrum"];
    } else if (strategy.asset === "ETH") {
      // syETH is only on Arbitrum
      networks = ["arbitrum"];
    } else if ((strategy as any).name === "syHLP" || (strategy as any).hyperEVM) {
      // syHLP is only on HyperEVM
      networks = ["hyperEVM"];
    } else if (strategy.asset === "USD") {
      // syUSD is on Base, Ethereum, Arbitrum, and Katana
      networks = ["base", "ethereum", "arbitrum", "katana"];
    } else {
      // Default: check all available networks
      networks = ["base", "ethereum", "arbitrum"];
    }

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
            Object.entries(strategies as StrategyDuration)
              .filter(([type]) => type !== "INCENTIVE") // Skip INCENTIVE config
              .map(
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
            Object.entries(strategies as StrategyDuration)
              .filter(([type]) => type !== "INCENTIVE") // Skip INCENTIVE config
              .map(
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
            Object.entries(strategies as StrategyDuration)
              .filter(([type]) => type !== "INCENTIVE") // Skip INCENTIVE config
              .map(
                ([type, strategy]) => ({
                  ...strategy,
                  duration,
                  type: type.toLowerCase(),
                  asset: "ETH",
                })
              )
        ),
      ];

      // Process strategies sequentially to prevent rate limiting
      const balances: StrategyWithBalance[] = [];
      const depositedChainsMap: Record<string, string[]> = {};
      
      for (let i = 0; i < allStrategies.length; i++) {
        const strategy = allStrategies[i];
        const balance = await checkStrategyBalance(strategy);
        
        // Only fetch deposited chains for strategies with balance
        if (balance > 0) {
          try {
            const configs = getChainConfigs(strategy as StrategyWithBalance);
            if (Object.keys(configs).length > 0) {
              console.log(`Fetching deposited chains for ${strategy.asset} strategy:`, {
                contract: strategy.contract,
                shareAddress: strategy.shareAddress,
                boringVaultAddress: strategy.boringVaultAddress,
                configs: Object.keys(configs),
              });
              
              const depositedOn = await getDepositedChainsViem({
                userAddress: address as Address,
                strategy: strategy,
                chainConfigs: configs as Record<string, {
                  rpc: string;
                  chainId: number;
                  image: string;
                  chainObject: any;
                }>,
              });
              
              console.log(`Deposited chains for ${strategy.contract}:`, depositedOn);
              depositedChainsMap[strategy.contract] = depositedOn;
            } else {
              console.warn(`No chain configs found for strategy ${strategy.contract}`);
              depositedChainsMap[strategy.contract] = [];
            }
          } catch (error) {
            console.error(`Error fetching deposited chains for ${strategy.contract}:`, error);
            depositedChainsMap[strategy.contract] = [];
          }
        } else {
          // Even if balance is 0, initialize empty array
          depositedChainsMap[strategy.contract] = [];
        }
        
        balances.push({ ...strategy, balance } as StrategyWithBalance);
      }
      
      // Filter to only show strategies with balance > 0
      // Use a small threshold to account for floating point precision issues
      const MIN_BALANCE_THRESHOLD = 0.000001;
      const filteredBalances = balances.filter((s) => {
        const hasBalance = s.balance > MIN_BALANCE_THRESHOLD;
        if (!hasBalance) {
          console.log(`Filtering out ${(s as any).name || s.contract} - balance is ${s.balance} (below threshold ${MIN_BALANCE_THRESHOLD})`);
        }
        return hasBalance;
      });
      
      setStrategiesWithBalance(filteredBalances);
      setDepositedChainsPerStrategy(depositedChainsMap);
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
  const { switchChain: switchChainHook } = useSwitchChain();
  const currentChainId = useChainId();

  const handleApprove = async () => {
    if (!selectedStrategy || !withdrawAmount || !address) return;

    try {
      setIsApproving(true);
      setErrorMessage(null);
      setApprovalHash(null);

      const solverAddress = selectedStrategy.solverAddress as Address;
      // Use shareAddress for approval (the actual token being transferred), fallback to boringVaultAddress
      const shareTokenAddress = (selectedStrategy.shareAddress || selectedStrategy.boringVaultAddress) as Address;

      // Get chain configuration based on target chain
      // ALWAYS check for syHLP FIRST - it's a special case
      const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
      let targetChainId: number;
      let rpcUrl: string;
      let chainObject: any;
      
      if (isSyHLP || (targetChain === "hyperEVM" && (selectedStrategy as any).hyperEVM)) {
        // syHLP always uses HyperEVM
        targetChainId = (selectedStrategy as any).hyperEVM.chainId || 999;
        rpcUrl = (selectedStrategy as any).hyperEVM.rpc || "https://rpc.hypurrscan.io";
        chainObject = (selectedStrategy as any).hyperEVM.chainObject;
        console.log("🔵 syHLP detected - using HyperEVM config:", { targetChainId, rpcUrl });
      } else {
        const chainConfig = chainConfigs[targetChain as keyof typeof chainConfigs];
        targetChainId = chainConfig?.chainId || (targetChain === "arbitrum" ? 42161 : targetChain === "ethereum" ? 1 : 8453);
        rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;
        chainObject = chainConfig?.chainObject;
      }

      console.log("Approval details:", {
        solverAddress,
        shareTokenAddress,
        address,
        targetChainId,
        currentChainId: currentChainId,
        targetChain,
        rpcUrl,
      });

      // Check if user is on the correct chain, if not, switch
      if (currentChainId !== targetChainId) {
        console.log(`⚠️ Chain mismatch detected. Current: ${currentChainId}, Required: ${targetChainId}`);
        console.log(`Switching from chain ${currentChainId} to chain ${targetChainId} for approval`);
        try {
          await switchChainHook({ chainId: targetChainId });
          // Wait longer for the chain switch to complete and propagate
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Chain switch initiated. Please wait for wallet confirmation.`);
        } catch (switchError: any) {
          console.error("Failed to switch chain:", switchError);
          if (switchError.code === 4001) {
            setErrorMessage("Chain switch cancelled by user.");
          } else {
            const chainName = targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "ethereum" ? "Ethereum" : "Base";
            setErrorMessage(`Please switch to ${chainName} network (Chain ID: ${targetChainId}) in your wallet manually and try again.`);
          }
          setIsApproving(false);
          return;
        }
      } else {
        console.log(`✅ Already on correct chain: ${targetChainId}`);
      }

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: chainObject || {
          id: targetChainId,
          name: targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum One" : targetChain === "ethereum" ? "Ethereum" : "Base",
          network: targetChain,
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

      // Get decimals from share token
      const decimals = (await client.readContract({
        address: shareTokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;

      const sharesAmount = parseUnits(withdrawAmount, decimals);

      console.log("Requesting approval for amount:", {
        amount: sharesAmount.toString(),
        amountFormatted: formatUnits(sharesAmount, decimals),
        decimals,
        withdrawAmount,
      });

      // Approve the solver to spend the share tokens
      const approveTx = await writeContract({
        address: shareTokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [solverAddress, sharesAmount],
        chainId: targetChainId,
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
      // Use shareAddress for token operations (the actual token being transferred), fallback to boringVaultAddress
      const shareTokenAddress = (selectedStrategy.shareAddress || selectedStrategy.boringVaultAddress) as Address;
      const assetOutAddress = withdrawableAssets[selectedAssetIdx]
        .contract as Address;

      console.log("=== WITHDRAW DEBUG ===");
      console.log("targetChain:", targetChain);
      console.log("withdrawableAssets:", withdrawableAssets);
      console.log("assetOutAddress:", assetOutAddress);
      console.log("selectedAssetIdx:", selectedAssetIdx);

      // Get chain configuration based on target chain
      // ALWAYS check for syHLP FIRST - it's a special case
      const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
      let targetChainId: number;
      let rpcUrl: string;
      let chainObject: any;
      
      if (isSyHLP || (targetChain === "hyperEVM" && (selectedStrategy as any).hyperEVM)) {
        // syHLP always uses HyperEVM
        targetChainId = (selectedStrategy as any).hyperEVM.chainId || 999;
        rpcUrl = (selectedStrategy as any).hyperEVM.rpc || "https://rpc.hypurrscan.io";
        chainObject = (selectedStrategy as any).hyperEVM.chainObject;
        console.log("🔵 syHLP detected - using HyperEVM config:", { targetChainId, rpcUrl });
      } else {
        const chainConfig = chainConfigs[targetChain as keyof typeof chainConfigs];
        targetChainId = chainConfig?.chainId || (targetChain === "arbitrum" ? 42161 : targetChain === "ethereum" ? 1 : 8453);
        rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;
        chainObject = chainConfig?.chainObject;
      }

      console.log("Withdraw targetChainId:", targetChainId);
      console.log("Withdraw currentChainId:", currentChainId);
      console.log("Withdraw rpcUrl:", rpcUrl);

      // Check if user is on the correct chain, if not, switch
      if (currentChainId !== targetChainId) {
        console.log(`⚠️ Chain mismatch detected. Current: ${currentChainId}, Required: ${targetChainId}`);
        console.log(`Switching from chain ${currentChainId} to chain ${targetChainId} for withdrawal`);
        try {
          await switchChainHook({ chainId: targetChainId });
          // Wait longer for the chain switch to complete and propagate
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Chain switch initiated. Please wait for wallet confirmation.`);
        } catch (switchError: any) {
          console.error("Failed to switch chain:", switchError);
          if (switchError.code === 4001) {
            setErrorMessage("Chain switch cancelled by user.");
          } else {
            const chainName = targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "ethereum" ? "Ethereum" : "Base";
            setErrorMessage(`Please switch to ${chainName} network (Chain ID: ${targetChainId}) in your wallet manually and try again.`);
          }
          setIsWithdrawing(false);
          return;
        }
      } else {
        console.log(`✅ Already on correct chain: ${targetChainId}`);
      }

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: chainObject || {
          id: targetChainId,
          name: targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum One" : targetChain === "ethereum" ? "Ethereum" : "Base",
          network: targetChain,
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

      // Get decimals from share token contract
      const decimals = (await client.readContract({
        address: shareTokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;

      const sharesAmount = parseUnits(withdrawAmount, decimals);
      // Convert to uint128
      const amountOfShares = BigInt(sharesAmount.toString());
      const discount = 0; // uint16 - hardcoded
      const secondsToDeadline = 432000; // uint24 - hardcoded (5 days)
      
      console.log("🔍 Withdrawal amount calculation:", {
        withdrawAmount,
        decimals,
        sharesAmount: sharesAmount.toString(),
        amountOfShares: amountOfShares.toString(),
        amountOfSharesFormatted: formatUnits(amountOfShares, decimals),
        shareTokenAddress,
      });

      // Check if the solver contract is paused
      console.log("🔍 Checking if solver contract is paused...");
      try {
        const isPaused = await client.readContract({
          address: solverAddress,
          abi: SOLVER_ABI,
          functionName: "isPaused",
        }) as boolean;
        
        if (isPaused) {
          const errorMsg = "Withdrawals are currently paused. Please try again later.";
          console.error(errorMsg);
          setErrorMessage(errorMsg);
          setIsWithdrawing(false);
          return;
        }
        console.log("✅ Solver contract is not paused");
      } catch (error) {
        console.warn("Could not check paused state (function might not exist):", error);
        // Continue if we can't check paused state
      }

      // Verify approval before attempting withdrawal
      console.log("🔍 Verifying approval before withdrawal...");
      console.log("Checking allowance on:", {
        shareTokenAddress,
        userAddress: address,
        solverAddress,
        chainId: targetChainId,
        network: targetChain,
      });
      
      const allowance = await client.readContract({
        address: shareTokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address as Address, solverAddress],
      }) as bigint;

      console.log("Approval check:", {
        allowance: allowance.toString(),
        required: amountOfShares.toString(),
        allowanceFormatted: formatUnits(allowance, decimals),
        requiredFormatted: withdrawAmount,
        isSufficient: allowance >= amountOfShares,
        difference: (allowance - amountOfShares).toString(),
        differenceFormatted: formatUnits(allowance - amountOfShares, decimals),
      });

      if (allowance < amountOfShares) {
        const errorMsg = `Insufficient approval. Approved: ${formatUnits(allowance, decimals)}, Required: ${withdrawAmount}. Please approve again. Make sure you're on the correct network (${targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "ethereum" ? "Ethereum" : "Base"}).`;
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        setIsApproved(false); // Reset approval state
        setIsWithdrawing(false);
        return;
      }
      
      // Double-check: Verify the approval is actually sufficient with a small buffer
      // Some contracts require exact amounts, but we want to be safe
      if (allowance === BigInt(0)) {
        const errorMsg = `No approval found. Please approve the withdrawal first. Make sure you're on the correct network (${targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "ethereum" ? "Ethereum" : "Base"}).`;
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        setIsApproved(false);
        setIsWithdrawing(false);
        return;
      }

      console.log("✅ Approval verified. Proceeding with withdrawal...");

      // Check user's balance before attempting withdrawal
      const userBalance = await client.readContract({
        address: vaultAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      }) as bigint;

      console.log("Balance check:", {
        userBalance: userBalance.toString(),
        required: amountOfShares.toString(),
        userBalanceFormatted: formatUnits(userBalance, decimals),
        requiredFormatted: withdrawAmount,
        isSufficient: userBalance >= amountOfShares,
      });

      if (userBalance < amountOfShares) {
        const errorMsg = `Insufficient balance. You have: ${formatUnits(userBalance, decimals)}, Required: ${withdrawAmount}.`;
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        setIsWithdrawing(false);
        return;
      }

      // Final verification: Re-check allowance right before transaction
      console.log("🔍 Final approval verification before transaction...");
      console.log("Verification details:", {
        vaultAddress,
        userAddress: address,
        solverAddress,
        chainId: targetChainId,
        network: targetChain,
        amountOfShares: amountOfShares.toString(),
        amountOfSharesFormatted: formatUnits(amountOfShares, decimals),
      });
      
      const finalAllowance = await client.readContract({
        address: vaultAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address as Address, solverAddress],
      }) as bigint;
      
      console.log("Final allowance check:", {
        allowance: finalAllowance.toString(),
        required: amountOfShares.toString(),
        allowanceFormatted: formatUnits(finalAllowance, decimals),
        requiredFormatted: formatUnits(amountOfShares, decimals),
        isSufficient: finalAllowance >= amountOfShares,
        exactMatch: finalAllowance === amountOfShares,
        difference: finalAllowance >= amountOfShares ? (finalAllowance - amountOfShares).toString() : "INSUFFICIENT",
      });
      
      if (finalAllowance < amountOfShares) {
        const errorMsg = `Approval insufficient at transaction time. Approved: ${formatUnits(finalAllowance, decimals)}, Required: ${formatUnits(amountOfShares, decimals)}. Please approve again and wait for confirmation.`;
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        setIsApproved(false);
        setIsWithdrawing(false);
        return;
      }
      
      // If allowance is exactly equal, that should be fine
      // If allowance is greater, that's also fine
      // The issue might be elsewhere
      if (finalAllowance === amountOfShares) {
        console.log("✅ Approval amount exactly matches withdrawal amount");
      } else {
        console.log(`✅ Approval amount (${formatUnits(finalAllowance, decimals)}) is greater than withdrawal amount (${formatUnits(amountOfShares, decimals)})`);
      }

      // Simulate the transaction first to catch any revert reasons
      try {
        console.log("🔍 Simulating transaction to check for revert reasons...");
        await client.simulateContract({
          address: solverAddress,
          abi: SOLVER_ABI,
          functionName: "requestOnChainWithdraw",
          args: [assetOutAddress, amountOfShares, discount, secondsToDeadline],
          account: address as Address,
        });
        console.log("✅ Transaction simulation successful");
      } catch (simulateError: any) {
        console.error("❌ Transaction simulation failed:", simulateError);
        let errorMessage = "Transaction would fail. ";
        
        // Check for TRANSFER_FROM_FAILED specifically
        if (simulateError?.shortMessage?.includes("TRANSFER_FROM_FAILED") || 
            simulateError?.message?.includes("TRANSFER_FROM_FAILED") ||
            simulateError?.cause?.reason === "TRANSFER_FROM_FAILED") {
          errorMessage = "Transfer failed - the contract cannot transfer tokens from your address. ";
          errorMessage += `\n\nCurrent allowance: ${formatUnits(finalAllowance, decimals)} ${(selectedStrategy as any)?.name === "syHLP" ? "syHLP" : "syUSD"}`;
          errorMessage += `\nRequired amount: ${withdrawAmount} ${(selectedStrategy as any)?.name === "syHLP" ? "syHLP" : "syUSD"}`;
          errorMessage += `\nNetwork: ${targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "ethereum" ? "Ethereum" : "Base"}`;
          errorMessage += `\n\nPossible causes:`;
          errorMessage += `\n1. Approval was set on a different network - make sure you approved on ${targetChain === "hyperEVM" ? "HyperEVM (Chain ID: 999)" : targetChain === "arbitrum" ? "Arbitrum (Chain ID: 42161)" : targetChain === "ethereum" ? "Ethereum (Chain ID: 1)" : "Base (Chain ID: 8453)"}`;
          errorMessage += `\n2. Approval amount doesn't match - you approved ${formatUnits(finalAllowance, decimals)}, but trying to withdraw ${withdrawAmount}`;
          errorMessage += `\n3. Approval transaction not confirmed yet - wait for approval to be confirmed before withdrawing`;
          errorMessage += `\n\nPlease check the approval transaction and ensure it was confirmed on the correct network.`;
        } else if (simulateError?.cause?.data) {
          errorMessage += `Reason: ${simulateError.cause.data}`;
        } else if (simulateError?.message) {
          errorMessage += simulateError.message;
        } else if (simulateError?.shortMessage) {
          errorMessage += simulateError.shortMessage;
        } else {
          errorMessage += "Unknown error. Please check your balance and approval.";
        }
        
        setErrorMessage(errorMessage);
        setIsWithdrawing(false);
        return;
      }

      console.log("Debug - Contract call parameters:", {
        functionName: "requestOnChainWithdraw",
        contractAddress: solverAddress,
        chainId: targetChainId,
        targetChain: targetChain,
        currentChainId: currentChainId,
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
        approval: {
          allowance: allowance.toString(),
          required: amountOfShares.toString(),
        },
        balance: {
          userBalance: userBalance.toString(),
          required: amountOfShares.toString(),
        },
      });

      const tx = await writeContract({
        address: solverAddress,
        abi: SOLVER_ABI,
        functionName: "requestOnChainWithdraw",
        args: [assetOutAddress, amountOfShares, discount, secondsToDeadline],
        chainId: targetChainId,
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
      console.error("Error details:", {
        message: error.message,
        shortMessage: error.shortMessage,
        cause: error.cause,
        data: error.data,
        code: error.code,
        name: error.name,
      });
      
      if (error.code === 4001) {
        setErrorMessage("Withdrawal cancelled by user.");
      } else {
        // Try to extract a more detailed error message
        let errorMessage = "Withdrawal failed. ";
        
        // Check for revert reason in various error formats
        if (error?.shortMessage) {
          errorMessage += error.shortMessage;
        } else if (error?.cause?.data) {
          // Try to decode the revert reason
          const revertData = error.cause.data;
          if (typeof revertData === 'string' && revertData.startsWith('0x')) {
            // Try to extract readable error from hex data
            errorMessage += `Contract reverted: ${revertData.substring(0, 20)}...`;
          } else {
            errorMessage += String(revertData);
          }
        } else if (error?.cause?.message) {
          errorMessage += error.cause.message;
        } else if (error?.message) {
          errorMessage += error.message;
        } else {
          errorMessage += "Unknown error. Please check your balance, approval, and try again.";
        }
        
        setErrorMessage(errorMessage);
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
      // ALWAYS check for syHLP FIRST - it's a special case
      const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
      let targetChainId: number;
      let rpcUrl: string;
      let chainObject: any;
      
      if (isSyHLP || (targetChain === "hyperEVM" && (selectedStrategy as any).hyperEVM)) {
        // syHLP always uses HyperEVM
        targetChainId = (selectedStrategy as any).hyperEVM.chainId || 999;
        rpcUrl = (selectedStrategy as any).hyperEVM.rpc || "https://rpc.hypurrscan.io";
        chainObject = (selectedStrategy as any).hyperEVM.chainObject;
        console.log("🔵 syHLP detected - using HyperEVM config:", { targetChainId, rpcUrl });
      } else {
        const chainConfig = chainConfigs[targetChain as keyof typeof chainConfigs];
        targetChainId = chainConfig?.chainId || (targetChain === "arbitrum" ? 42161 : targetChain === "ethereum" ? 1 : 8453);
        rpcUrl = chainConfig?.rpc || selectedStrategy.rpc;
        chainObject = chainConfig?.chainObject;
      }

      // Check if user is on the correct chain, if not, switch
      if (currentChainId !== targetChainId) {
        console.log(`Switching from chain ${currentChainId} to chain ${targetChainId} for cancel`);
        try {
          await switchChainHook({ chainId: targetChainId });
          // Wait a bit for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          console.error("Failed to switch chain:", switchError);
          if (switchError.code === 4001) {
            setErrorMessage("Chain switch cancelled by user.");
          } else {
            const chainName = targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "ethereum" ? "Ethereum" : "Base";
            setErrorMessage(`Please switch to ${chainName} network (Chain ID: ${targetChainId}) in your wallet`);
          }
          setIsCancelling(false);
          return;
        }
      }

      console.log("Cancel details:", {
        solverAddress,
        requestId,
        address,
        targetChainId,
        currentChainId,
        targetChain,
        rpcUrl,
      });

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: chainObject || {
          id: targetChainId,
          name: targetChain === "hyperEVM" ? "HyperEVM" : targetChain === "arbitrum" ? "Arbitrum One" : targetChain === "ethereum" ? "Ethereum" : "Base",
          network: targetChain,
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
        chainId: targetChainId,
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
      
      // ALWAYS check for syHLP FIRST - it's a special case even though it's USD asset
      const isSyHLP = (strategy as any).name === "syHLP" || (strategy as any).hyperEVM;
      if (isSyHLP) {
        console.log("🔵 Setting targetChain to hyperliquid for syHLP");
        setTargetChain("hyperEVM"); // syHLP is only on HyperEVM
      } else if (strategy.asset === "BTC") {
        setTargetChain("arbitrum"); // syBTC is only on Arbitrum
      } else if (strategy.asset === "ETH") {
        console.log("🔵 Setting targetChain to arbitrum for syETH");
        setTargetChain("arbitrum"); // syETH is only on Arbitrum
      } else if (strategy.asset === "USD") {
        // This is syUSD (not syHLP)
        console.log("🔵 Setting targetChain to base for syUSD");
        setTargetChain("base"); // syUSD defaults to Base
      }
    }
  };

  // Auto-populate withdrawal form when strategy is selected on desktop
  useEffect(() => {
    if (selectedStrategy && !isMobileDevice) {
      console.log(
        "Auto-populating withdrawal form for strategy:",
        selectedStrategy
      );

      // ALWAYS check for syHLP FIRST - it's a special case even though it's USD asset
      const isSyHLP = (selectedStrategy as any).name === "syHLP" || (selectedStrategy as any).hyperEVM;
      let expectedChain: string;
      
      if (isSyHLP) {
        expectedChain = "hyperEVM";
      } else if (selectedStrategy.asset === "BTC") {
        expectedChain = "arbitrum";
      } else if (selectedStrategy.asset === "ETH") {
        expectedChain = "arbitrum"; // syETH is only on Arbitrum
      } else if (selectedStrategy.asset === "USD") {
        // This is syUSD (not syHLP)
        expectedChain = "base";
      } else {
        expectedChain = "base"; // fallback
      }
      
      // Always set targetChain when strategy changes to prevent defaulting to wrong chain
      // This ensures syHLP immediately goes to hyperliquid without going through base
      if (targetChain !== expectedChain || !targetChain) {
        setTargetChain(expectedChain);
        console.log(
          "🔵 Setting targetChain to:",
          expectedChain,
          "for strategy:",
          (selectedStrategy as any).name || selectedStrategy.asset,
          "isSyHLP:",
          isSyHLP,
          "(previous targetChain was:",
          targetChain,
          ")"
        );
      }
      
      console.log(
        "Selected strategy network:",
        selectedStrategy.network,
        "targetChain:",
        targetChain,
        "expectedChain:",
        expectedChain
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
  }, [selectedStrategy, withdrawableAssets, isMobileDevice]); // Removed targetChain from deps to prevent loops

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (selectedStrategy) {
      const calculatedAmount = selectedStrategyEthereumBalance * percentage;
      
      // For syBTC and syETH, use 6 decimal places for display
      // For syUSD (6 decimals), 6 decimal places
      const decimals = selectedStrategy.shareAddress_token_decimal || 18;
      const decimalPlaces = selectedStrategy.asset === "BTC" || selectedStrategy.asset === "ETH" ? 6 : decimals === 6 ? 6 : 2;
      
      // Format with appropriate decimal places, but remove trailing zeros
      const amount = calculatedAmount.toFixed(decimalPlaces).replace(/\.?0+$/, '');
      setWithdrawAmount(amount);
      
      console.log("Percentage click:", {
        percentage,
        balance: selectedStrategyEthereumBalance,
        calculatedAmount,
        formattedAmount: amount,
        decimals,
      });
    }
  };

  const handleMaxClick = () => {
    if (selectedStrategy) {
      const decimals = selectedStrategy.shareAddress_token_decimal || 18;
      // Use 6 decimal places for display: BTC (8 decimals), ETH (18 decimals), USD (6 decimals)
      const decimalPlaces = selectedStrategy.asset === "BTC" || selectedStrategy.asset === "ETH" ? 6 : decimals === 6 ? 6 : 2;
      const amount = selectedStrategyEthereumBalance.toFixed(decimalPlaces).replace(/\.?0+$/, '');
      setWithdrawAmount(amount);
      
      console.log("Max click:", {
        balance: selectedStrategyEthereumBalance,
        formattedAmount: amount,
        decimals,
      });
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

    // Use shareAddress (vault token address) to check balances
    const vaultAddress = strategy.shareAddress || strategy.boringVaultAddress;
    if (!vaultAddress) {
      console.error("No shareAddress or boringVaultAddress found for strategy");
      return [];
    }

    console.log(`Checking deposited chains for vault: ${vaultAddress}`);

    for (const [chainKey, chain] of Object.entries(chainConfigs)) {
      try {
        const client = createPublicClient({
          transport: http(chain.rpc),
          chain: chain.chainObject,
        });

        const decimals = strategy.shareAddress_token_decimal ?? 18;

        const balance = await client.readContract({
          address: vaultAddress as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [userAddress],
        });

        const formatted = Number(formatUnits(balance as bigint, decimals));

        console.log(`[${chainKey}] Balance for ${vaultAddress}: ${formatted}`);

        if (formatted > 0) {
          depositedChains.push(chainKey);
          console.log(`Found deposit on ${chainKey}`);
        }
      } catch (err) {
        console.error(`Error checking balance on ${chainKey}:`, err);
        // Continue to next chain instead of failing completely
      }
    }

    console.log(`Total deposited chains found: ${depositedChains.join(", ")}`);
    return depositedChains;
  };

  useEffect(() => {
    const fetchDeposits = async () => {
      if (!address || !selectedStrategy) {
        console.log("Missing required data:", {
          address,
          selectedStrategy,
        });
        return;
      }
      
      const configs = getChainConfigs(selectedStrategy);
      if (Object.keys(configs).length === 0) {
        return;
      }
      
      console.log("Fetching deposits with:", {
        address,
        selectedStrategy,
        chainConfigs: configs,
      });

      const depositedOn = await getDepositedChainsViem({
        userAddress: address as Address,
        strategy: selectedStrategy,
        chainConfigs: configs as Record<string, {
          rpc: string;
          chainId: number;
          image: string;
          chainObject: any;
        }>,
      });

      setDepositedChains(depositedOn);
      console.log("Deposited on:", depositedOn);
    };
    fetchDeposits();
  }, [address, selectedStrategy]);

  useEffect(() => {
    const fetchAmountOut = async () => {
      if (!selectedStrategy || !withdrawAmount) {
        setAmountOut(null);
        setIsLoadingAmountOut(false);
        return;
      }

      setIsLoadingAmountOut(true);
      setAmountOut(null); // Reset to show loading

      try {
        const solverAddress = selectedStrategy.solverAddress as Address;
        const vaultAddress = selectedStrategy.boringVaultAddress as Address;
        
        // Ensure we have a valid asset selected
        if (!withdrawableAssets || withdrawableAssets.length === 0) {
          console.error("No withdrawable assets available for this strategy/chain");
          setAmountOut(null);
          setIsLoadingAmountOut(false);
          return;
        }
        
        // For syBTC, ensure we're using wBTC on Arbitrum
        let selectedAsset = withdrawableAssets[selectedAssetIdx] || withdrawableAssets[0];
        
        // Validate asset matches strategy requirements
        if (selectedStrategy.asset === "BTC" && targetChain === "arbitrum") {
          // Ensure we're using wBTC
          const wbtcAsset = withdrawableAssets.find(asset => 
            asset.name === "wBTC" || 
            asset.contract.toLowerCase() === "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f".toLowerCase()
          );
          if (wbtcAsset) {
            selectedAsset = wbtcAsset;
          }
        }
        
        // Validate asset matches strategy requirements for ETH
        if (selectedStrategy.asset === "ETH" && targetChain === "arbitrum") {
          // Ensure we're using WETH
          const wethAsset = withdrawableAssets.find(asset => 
            asset.name === "WETH" || 
            asset.contract.toLowerCase() === "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
          );
          if (wethAsset) {
            selectedAsset = wethAsset;
          }
        }
        
        const selectedAssetAddress = getAddress(selectedAsset.contract);

        // Get chain configuration based on target chain - use strategy's chain config directly
        // Handle hyperliquid -> hyperEVM mapping
        const configKey = targetChain === "hyperEVM" ? "hyperEVM" : targetChain;
        const strategyChainConfig = (selectedStrategy as any)[configKey] as any;
        const chainId = strategyChainConfig?.chainId || 
          (targetChain === "arbitrum" ? 42161 : 
           targetChain === "ethereum" ? 1 : 
           targetChain === "hyperEVM" ? 999 : 8453);
        const rpcUrl = strategyChainConfig?.rpc || selectedStrategy.rpc;

        console.log("=== PREVIEW ASSETS OUT DEBUG ===");
        console.log("selectedStrategy.asset:", selectedStrategy.asset);
        console.log("targetChain:", targetChain);
        console.log("selectedAsset:", selectedAsset);
        console.log("selectedAssetAddress:", selectedAssetAddress);
        console.log("rpc", rpcUrl);
        console.log("solverAddress", solverAddress);
        console.log("vaultAddress", vaultAddress);
        console.log("chainId", chainId);

        // Get chain object from strategy config or create default
        const chainObject = strategyChainConfig?.chainObject || {
          id: chainId,
          name: targetChain === "arbitrum" ? "Arbitrum One" : 
                targetChain === "ethereum" ? "Ethereum" : 
                targetChain === "hyperEVM" ? "HyperEVM" : "Base",
          network: targetChain,
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
          },
        };

        const client = createPublicClient({
          transport: http(rpcUrl),
          chain: chainObject,
        });

        // Use strategy's configured decimals (more reliable than fetching from contract)
        // For syBTC: 8 decimals, for syUSD: 6 decimals
        const strategyDecimals = selectedStrategy.shareAddress_token_decimal || 18;
        
        // Also fetch from contract to verify (but use strategy config as primary)
        let contractDecimals: number;
        try {
          contractDecimals = (await client.readContract({
            address: vaultAddress as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          })) as number;
          
          // Log if there's a mismatch (shouldn't happen, but good to know)
          if (contractDecimals !== strategyDecimals) {
            console.warn(`Decimals mismatch: strategy config says ${strategyDecimals}, contract says ${contractDecimals}. Using strategy config.`);
          }
        } catch (error) {
          console.warn("Could not fetch decimals from contract, using strategy config:", error);
          contractDecimals = strategyDecimals;
        }
        
        // Use strategy decimals as primary source
        const decimals = strategyDecimals;

        // Validate withdraw amount
        const withdrawAmountNum = parseFloat(withdrawAmount);
        if (isNaN(withdrawAmountNum) || withdrawAmountNum <= 0) {
          console.error("Invalid withdraw amount:", withdrawAmount);
          setAmountOut(null);
          setIsLoadingAmountOut(false);
          return;
        }

        //Convert withdrawAmount to uint128 (BigInt)
        const shares = parseUnits(withdrawAmount, decimals);
        
        // Check if shares amount is too small (less than 1 in smallest unit)
        if (shares === BigInt(0)) {
          console.error("Shares amount is zero after conversion");
          setAmountOut(null);
          setIsLoadingAmountOut(false);
          return;
        }
        
        // For syBTC with 8 decimals, check if amount is reasonable
        // Minimum might be 0.00000001 (1 in smallest unit)
        if (selectedStrategy.asset === "BTC" && shares < BigInt(1)) {
          console.warn("Amount might be too small for syBTC. Minimum is 0.00000001 syBTC");
        }
        
        // For syETH with 18 decimals, check if amount is reasonable
        if (selectedStrategy.asset === "ETH" && shares < BigInt(1)) {
          console.warn("Amount might be too small for syETH");
        }

        const discount = 0;

        console.log("=== PREVIEW ASSETS OUT CALL ===");
        console.log("solverAddress:", solverAddress);
        console.log("selectedAssetAddress:", selectedAssetAddress);
        console.log("shares (raw):", shares.toString());
        console.log("shares (formatted):", formatUnits(shares, decimals));
        console.log("decimals:", decimals);
        console.log("discount:", discount);

        //Call the previewAssetsOut
        try {
          const result = await client.readContract({
            address: solverAddress as Address,
            abi: SOLVER_ABI,
            functionName: "previewAssetsOut",
            args: [selectedAssetAddress, shares, discount],
          });

          console.log("previewAssetsOut result:", result.toString());
          setAmountOut(result.toString());
        } catch (error: any) {
          console.error("Error calling previewAssetsOut:", error);
          console.error("Error details:", {
            solverAddress,
            selectedAssetAddress,
            shares: shares.toString(),
            discount,
            withdrawAmount,
            decimals,
            strategyAsset: selectedStrategy.asset,
            targetChain,
          });
          
          // If the error is about the contract reverting, it might be:
          // 1. Amount too small
          // 2. Asset not whitelisted
          // 3. Invalid parameters
          if (error.message?.includes("revert") || error.message?.includes("execution reverted")) {
            console.error("Contract reverted - possible reasons:");
            console.error("- Amount might be too small (minimum not met)");
            console.error("- Asset address might not be whitelisted");
            console.error("- Invalid contract state");
          }
          
          setAmountOut(null);
        }
      } catch (err) {
        console.error("Error reading previewAssetsOut:", err);
        setAmountOut(null);
      } finally {
        setIsLoadingAmountOut(false);
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
      // Use provided vault address or fallback to syUSD vault
      const vaultAddr = vaultAddress || "0x279CAD277447965AF3d24a78197aad1B02a2c589";
      const response = await fetch(
        `https://api.lucidly.finance/services/queueData?vaultAddress=${vaultAddr}&userAddress=${userAddress}`
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
      // Use selected strategy's vault address if available, otherwise use syUSD default
      const vaultAddress = selectedStrategy?.boringVaultAddress || "";
      fetchWithdrawRequests(vaultAddress, address);
    }
  }, [address, selectedStrategy]);

  useEffect(() => {
    console.log("Fetched withdraw requests:", withdrawRequests);
  }, [withdrawRequests]);

  // Call cacheQueueData API when withdrawal is successful
  useEffect(() => {
    if (isWithdrawSuccess && withdrawTxHash && address && selectedStrategy) {
      const vaultAddress = selectedStrategy.boringVaultAddress || "0x279CAD277447965AF3d24a78197aad1B02a2c589";
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
  }, [isWithdrawSuccess, withdrawTxHash, address, selectedStrategy]);

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
                          // Get the exchange rate for this specific strategy
                          const strategyRate = exchangeRatesPerStrategy[s.contract] || 1.0;
                          
                          // For syBTC: multiply by exchangeRate (syBTC to wBTC) and then by wBTC price (wBTC to USD)
                          // For syETH: multiply by exchangeRate (syETH to WETH) and then by ETH price (ETH to USD)
                          // For syUSD: exchangeRate is already in USD terms
                          let usdValue: number;
                          if (s.asset === "BTC") {
                            // Always try to convert syBTC to USD, even if wBTC price is 0 (will show 0 but still include in calculation)
                            if (wbtcPrice > 0) {
                              usdValue = s.balance * strategyRate * wbtcPrice;
                              console.log(
                                "🔥 Portfolio Balance Calc (syBTC):",
                                s.balance,
                                "syBTC *",
                                strategyRate,
                                "wBTC *",
                                wbtcPrice,
                                "USD =",
                                usdValue
                              );
                            } else {
                              // If wBTC price not loaded, use 0 for now (will update when price loads)
                              usdValue = 0;
                              console.log(
                                "🔥 Portfolio Balance Calc (syBTC): wBTC price not loaded yet, using 0"
                              );
                            }
                          } else if (s.asset === "ETH") {
                            // Always try to convert syETH to USD
                            if (ethPrice > 0) {
                              usdValue = s.balance * strategyRate * ethPrice;
                              console.log(
                                "🔥 Portfolio Balance Calc (syETH):",
                                s.balance,
                                "syETH *",
                                strategyRate,
                                "WETH *",
                                ethPrice,
                                "USD =",
                                usdValue
                              );
                            } else {
                              // If ETH price not loaded, use 0 for now (will update when price loads)
                              usdValue = 0;
                              console.log(
                                "🔥 Portfolio Balance Calc (syETH): ETH price not loaded yet, using 0"
                              );
                            }
                          } else {
                            // For syUSD/syHLP: exchangeRate is already in USD terms
                            const strategyName = (s as any).name === "syHLP" || (s as any).hyperEVM ? "syHLP" : "syUSD";
                            usdValue = s.balance * strategyRate;
                            console.log(
                              `🔥 Portfolio Balance Calc (${strategyName}):`,
                              s.balance,
                              `${strategyName} *`,
                              strategyRate,
                              "USD =",
                              usdValue
                            );
                          }
                          return sum + usdValue;
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
                  <Tooltip 
                    content={
                      strategiesWithWithdrawableBalance.some(s => s.asset === "BTC") && 
                      strategiesWithWithdrawableBalance.some(s => s.asset === "USD")
                        ? (
                          <div>
                            <strong>syUSD</strong> withdrawals are on Base and Ethereum.<br />
                            <strong>syBTC</strong> withdrawals are on Arbitrum.
                          </div>
                        )
                        : strategiesWithWithdrawableBalance.some(s => s.asset === "BTC")
                        ? <div><strong>syBTC</strong> withdrawals are on Arbitrum.</div>
                        : <div><strong>syUSD</strong> withdrawals are on Base and Ethereum.</div>
                    }
                    side="bottom"
                  >
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
                          // Get the exchange rate for this specific strategy
                          const strategyRate = exchangeRatesPerStrategy[s.contract] || 1.0;
                          
                          // For syBTC: multiply by exchangeRate (syBTC to wBTC) and then by wBTC price (wBTC to USD)
                          // For syETH: multiply by exchangeRate (syETH to WETH) and then by ETH price (ETH to USD)
                          // For syUSD: exchangeRate is already in USD terms
                          let usdValue: number;
                          if (s.asset === "BTC") {
                            // Always try to convert syBTC to USD, even if wBTC price is 0 (will show 0 but still include in calculation)
                            if (wbtcPrice > 0) {
                              usdValue = s.balance * strategyRate * wbtcPrice;
                              console.log(
                                "🔥 Withdrawable Balance Calc (syBTC):",
                                s.balance,
                                "syBTC *",
                                strategyRate,
                                "wBTC *",
                                wbtcPrice,
                                "USD =",
                                usdValue
                              );
                            } else {
                              // If wBTC price not loaded, use 0 for now (will update when price loads)
                              usdValue = 0;
                              console.log(
                                "🔥 Withdrawable Balance Calc (syBTC): wBTC price not loaded yet, using 0"
                              );
                            }
                          } else if (s.asset === "ETH") {
                            // Always try to convert syETH to USD
                            if (ethPrice > 0) {
                              usdValue = s.balance * strategyRate * ethPrice;
                              console.log(
                                "🔥 Withdrawable Balance Calc (syETH):",
                                s.balance,
                                "syETH *",
                                strategyRate,
                                "WETH *",
                                ethPrice,
                                "USD =",
                                usdValue
                              );
                            } else {
                              // If ETH price not loaded, use 0 for now (will update when price loads)
                              usdValue = 0;
                              console.log(
                                "🔥 Withdrawable Balance Calc (syETH): ETH price not loaded yet, using 0"
                              );
                            }
                          } else {
                            // For syUSD/syHLP: exchangeRate is already in USD terms
                            const strategyName = (s as any).name === "syHLP" || (s as any).hyperEVM ? "syHLP" : "syUSD";
                            usdValue = s.balance * strategyRate;
                            console.log(
                              `🔥 Withdrawable Balance Calc (${strategyName}):`,
                              s.balance,
                              `${strategyName} *`,
                              strategyRate,
                              "USD =",
                              usdValue
                            );
                          }
                          return sum + usdValue;
                        }, 0);
                      console.log(
                        "🔥 Total Withdrawable USD Value:",
                        totalBalance
                      );
                      return `$${totalBalance.toFixed(2)}`;
                    })()
                  ) : (
                    "$0.00"
                  )}
                </div>
              </div>
              {/* PNL temporarily commented out */}
              {/* Vertical Divider */}
              {/* <div className="w-px bg-[rgba(217,217,217,0.05)] self-stretch mx-4 sm:mx-8 hidden sm:block"></div>
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
              </div> */}
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
                        src={strategy.image || `/images/icons/${strategy.asset.toLowerCase()}-${
                          strategy.type === "stable" ? "stable" : "incentive"
                        }.svg`}
                        alt={strategy.asset}
                        width={32}
                        height={32}
                      />
                      <div className="min-w-[140px]">
                        <div className="text-[#EDF2F8]   text-[12px] font-normal leading-normal whitespace-nowrap">
                          {(strategy as any).displayName || (strategy as any).name || 
                            (strategy.type === "stable" ? "Stable Yield " : "Incentive Maxi ") + strategy.asset}
                        </div>
                        <div className="text-[#9C9DA2]   text-[12px] font-normal leading-normal">
                          {(strategy as any).name || 
                            (strategy.type === "stable" ? "sy" : "Incentive Maxi") + strategy.asset}
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
                      {(() => {
                        // Get deposited chains for this specific strategy
                        const strategyDepositedChains = depositedChainsPerStrategy[strategy.contract] || [];
                        console.log(`Displaying deposited chains for ${strategy.contract} (${strategy.asset}):`, {
                          contract: strategy.contract,
                          chains: strategyDepositedChains,
                          allDepositedChains: depositedChainsPerStrategy,
                        });
                        return strategyDepositedChains.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {strategyDepositedChains.map((chain, idx) => {
                              // Normalize chain key for hyperEVM
                              const normalizedChain = chain === "hyperEVM" ? "hyperEVM" : chain;
                              const chainInfo = chainIconMap[normalizedChain] || chainIconMap[chain] || { src: "/images/logo/base.svg", label: chain };
                              
                              return (
                                <div key={chain} className="flex items-center gap-1">
                                  <img
                                    src={chainInfo.src}
                                    alt={chainInfo.label}
                                    className="w-4 h-4 rounded-full"
                                    onError={(e) => {
                                      console.warn(`Failed to load icon for chain: ${chain}, normalized: ${normalizedChain}`);
                                      e.currentTarget.src = "/images/logo/base.svg";
                                    }}
                                  />
                                  {idx < strategyDepositedChains.length - 1 && (
                                    <span className="mx-1">,</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          "-"
                        );
                      })()}
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
                          return usdApy || "---";
                        }
                        // For other strategies, use the strategy APY or fallback
                        // If apy is empty string, show "---"
                        return strategy.apy && strategy.apy.trim() !== "" ? strategy.apy : "---";
                      })()}
                    </div>

                    {/* Current Balance */}
                    <div className="flex justify-end text-[#EDF2F8] text-[12px] font-normal">
                      {isClient
                        ? (() => {
                            // Get the exchange rate for this specific strategy
                            const strategyRate = exchangeRatesPerStrategy[strategy.contract] || 1.0;
                            
                            // For syBTC: multiply by exchangeRate (syBTC to wBTC) and then by wBTC price (wBTC to USD) to show USD value
                            // For syETH: multiply by exchangeRate (syETH to WETH) and then by ETH price (ETH to USD) to show USD value
                            // For syUSD: exchangeRate is already in USD terms
                            if (strategy.asset === "BTC" && wbtcPrice > 0) {
                              const usdValue = strategy.balance * strategyRate * wbtcPrice;
                              return `$${usdValue.toFixed(2)}`;
                            } else if (strategy.asset === "BTC") {
                              // If wBTC price not loaded yet, show wBTC amount with 6 decimals (without "wBTC" text)
                              const wbtcAmount = strategy.balance * strategyRate;
                              return `${wbtcAmount.toFixed(6)}`;
                            } else if (strategy.asset === "ETH" && ethPrice > 0) {
                              const usdValue = strategy.balance * strategyRate * ethPrice;
                              return `$${usdValue.toFixed(2)}`;
                            } else if (strategy.asset === "ETH") {
                              // If ETH price not loaded yet, show ETH amount with 6 decimals
                              const ethAmount = strategy.balance * strategyRate;
                              return `${ethAmount.toFixed(6)}`;
                            } else {
                              // For syUSD, show USD value with 2 decimals
                              return `$${(strategy.balance * strategyRate).toFixed(2)}`;
                            }
                          })()
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

                          {/* Network Display */}
                          <div className="relative" key={targetChain}>
                            <button
                              type="button"
                              onClick={() =>
                                setIsChainDropdownOpen(!isChainDropdownOpen)
                              }
                              className="flex items-center justify-between w-full text-[#EDF2F8] rounded-md px-3 py-1 text-sm border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  // Find the chain option that matches targetChain
                                  let chainOption = getUniqueChainConfigs.find(
                                    (c) => c.network === targetChain
                                  );
                                  
                                  // If not found, use the first available chain (should be the only one for syHLP)
                                  // But also update targetChain if it doesn't match any available chain
                                  if (!chainOption && getUniqueChainConfigs.length > 0) {
                                    chainOption = getUniqueChainConfigs[0];
                                    // Update targetChain to match the first available chain if current targetChain is invalid
                                    if (targetChain !== chainOption.network) {
                                      console.log(`Updating targetChain from ${targetChain} to ${chainOption.network}`);
                                      setTargetChain(chainOption.network);
                                    }
                                  }
                                  
                                  // If still no chain option, provide a fallback (shouldn't happen)
                                  if (!chainOption) {
                                    console.warn("No chain option found for targetChain:", targetChain, "Available chains:", getUniqueChainConfigs);
                                    return null;
                                  }
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
                                  content="Select the network to withdraw from."
                                  side="top"
                                >
                                  <div className="ml-2 mr-2">
                                    <InfoIcon />
                                  </div>
                                </Tooltip>
                              </div>
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  isChainDropdownOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            {/* Dropdown menu */}
                            {isChainDropdownOpen && (
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

                        {/* Close dropdown when clicking outside */}
                        {isChainDropdownOpen && (
                          <div
                            className="fixed inset-0 z-5"
                            onClick={() => setIsChainDropdownOpen(false)}
                          />
                        )}

                        {/* Header with strategy info and balance */}
                        <div className="flex items-end justify-between p-4 rounded-tl-[4px] rounded-tr-[4px] bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.15)]">
                          <div className="flex items-start gap-4">
                            <Image
                              src={selectedStrategy.image || `/images/icons/${selectedStrategy.asset.toLowerCase()}-${
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
                                {(selectedStrategy as any).displayName || (selectedStrategy as any).name || 
                                  (selectedStrategy.type === "stable"
                                    ? "Stable Yield"
                                    : "Incentive Maxi") + " " + selectedStrategy.asset}
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
                            Balance ({targetChain === "ethereum" ? "Ethereum" : targetChain === "arbitrum" ? "Arbitrum" : targetChain === "hyperEVM" ? "HyperEVM" : "Base"}):{" "}
                            <span className="text-[#D7E3EF] text-[12px] font-semibold leading-normal">
                              {isLoadingNetworkBalance || (selectedStrategy?.asset === "BTC" && isLoadingWbtcPrice) || (selectedStrategy?.asset === "ETH" && ethPrice === 0) ? (
                                <span className="inline-flex items-center gap-1">
                                  <svg
                                    className="animate-spin h-3 w-3 text-[#9C9DA2]"
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
                                  Loading...
                                </span>
                              ) : (
                                <>
                                  $
                                  {(() => {
                                    // For syBTC: multiply by exchangeRate (syBTC to wBTC) and then by wBTC price (wBTC to USD)
                                    // For syETH: multiply by exchangeRate (syETH to WETH) and then by ETH price (ETH to USD)
                                    // For syUSD: exchangeRate is already in USD terms
                                    if (selectedStrategy?.asset === "BTC" && wbtcPrice > 0) {
                                      const usdValue = selectedStrategyEthereumBalance * exchangeRate * wbtcPrice;
                                      return usdValue.toFixed(2);
                                    } else if (selectedStrategy?.asset === "ETH" && ethPrice > 0) {
                                      const usdValue = selectedStrategyEthereumBalance * exchangeRate * ethPrice;
                                      return usdValue.toFixed(2);
                                    } else {
                                      return (selectedStrategyEthereumBalance * exchangeRate).toFixed(
                                        selectedStrategy?.asset === "BTC" || selectedStrategy?.asset === "ETH" ? 6 : 2
                                      );
                                    }
                                  })()}{" "}
                                  ({selectedStrategyEthereumBalance.toFixed(
                                    selectedStrategy?.asset === "BTC" || selectedStrategy?.asset === "ETH" ? 6 : 2
                                  )}{" "}
                                  {(() => {
                                    // Check if it's syHLP
                                    const isSyHLP = (selectedStrategy as any)?.name === "syHLP" || (selectedStrategy as any)?.hyperEVM;
                                    if (selectedStrategy?.asset === "BTC") {
                                      return "syBTC";
                                    } else if (selectedStrategy?.asset === "ETH") {
                                      return "syETH";
                                    } else if (isSyHLP) {
                                      return "syHLP";
                                    } else {
                                      return "syUSD";
                                    }
                                  })()})
                                </>
                              )}
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
                              {isLoadingAmountOut ? (
                                <span className="inline-flex items-center gap-2">
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
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  <span className="text-[#9C9DA2]">Calculating...</span>
                                </span>
                              ) : withdrawAmount && amountOut ? (
                                <>
                                  {(() => {
                                    const assetName = withdrawableAssets[selectedAssetIdx]?.name || (selectedStrategy?.asset === "BTC" ? "wBTC" : selectedStrategy?.asset === "ETH" ? "WETH" : "USDC");
                                    const isBTC = assetName === "wBTC" || selectedStrategy?.asset === "BTC";
                                    const isETH = assetName === "WETH" || selectedStrategy?.asset === "ETH";
                                    const decimalPlaces = (isBTC || isETH) ? 6 : 2;
                                    return (
                                      <>
                                        {Number(
                                          formatUnits(
                                            BigInt(amountOut),
                                            withdrawableAssets[selectedAssetIdx]?.decimal || 6
                                          )
                                        ).toFixed(decimalPlaces)}{" "}
                                        {assetName}
                                      </>
                                    );
                                  })()}
                                </>
                              ) : withdrawAmount ? (
                                <span className="text-[#9C9DA2]">
                                  {(() => {
                                    const assetName = withdrawableAssets[selectedAssetIdx]?.name || (selectedStrategy?.asset === "BTC" ? "wBTC" : selectedStrategy?.asset === "ETH" ? "WETH" : "USDC");
                                    const isBTC = assetName === "wBTC" || selectedStrategy?.asset === "BTC";
                                    const isETH = assetName === "WETH" || selectedStrategy?.asset === "ETH";
                                    return (isBTC || isETH) ? `0.000000 ${assetName}` : `0.00 ${assetName}`;
                                  })()}
                                </span>
                              ) : (
                                <span className="text-[#9C9DA2]">-</span>
                              )}
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
                            (targetChain === "ethereum" && chainId !== 1) || 
                            (targetChain === "base" && chainId !== 8453) ||
                            (targetChain === "arbitrum" && chainId !== 42161)
                              ? "bg-[#383941] text-black hover:bg-[#4a4d56] transition-colors cursor-pointer"
                              : isWithdrawing || isApproving
                              ? "bg-[#2D2F3D] text-[#9C9DA2] cursor-not-allowed"
                              : "bg-[#B88AF8] text-[#080B17] hover:bg-[#9F6EE9] transition-colors"
                          }`}
                          onClick={async () => {
                            const targetChainId = 
                              targetChain === "ethereum" ? 1 :
                              targetChain === "arbitrum" ? 42161 :
                              8453; // base
                            const isOnCorrectNetwork = chainId === targetChainId;
                            
                            if (!isOnCorrectNetwork) {
                              // Switch to the target network
                              try {
                                const chainName = 
                                  targetChain === "ethereum" ? "Ethereum" :
                                  targetChain === "arbitrum" ? "Arbitrum" :
                                  "Base";
                                console.log(`Attempting to switch to ${chainName} network...`);
                                await switchChain({ chainId: targetChainId });
                                console.log(`Successfully switched to ${chainName} network`);
                              } catch (error) {
                                console.error("Failed to switch network:", error);
                                const chainName = 
                                  targetChain === "ethereum" ? "Ethereum" :
                                  targetChain === "arbitrum" ? "Arbitrum" :
                                  "Base";
                                setErrorMessage(`Please switch to ${chainName} network manually in your wallet`);
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
                            ((targetChain === "ethereum" && chainId === 1) || 
                             (targetChain === "base" && chainId === 8453) ||
                             (targetChain === "arbitrum" && chainId === 42161)) && (
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
                              <span >Waiting for Approval...</span>
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
                              <span >Approving...</span>
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
                              <span >Waiting for Confirmation...</span>
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
                              <span >Transaction in Progress</span>
                            </>
                          ) : isWithdrawSuccessLocal ? (
                            "Request Another Withdraw"
                          ) : isApproved ? (
                            "Approved - Click to Withdraw"
                          ) : (targetChain === "ethereum" && chainId !== 1) || 
                               (targetChain === "base" && chainId !== 8453) ||
                               (targetChain === "arbitrum" && chainId !== 42161) ? (
                            `Switch to ${
                              targetChain === "ethereum" ? "Ethereum" :
                              targetChain === "arbitrum" ? "Arbitrum" :
                              "Base"
                            } Network`
                          ) : (
                            "Request Withdraw"
                          )}
                        </button>
                        {errorMessage && (
                          <div className="flex justify-between items-center mt-4 bg-[rgba(239,68,68,0.1)] rounded-[4px] p-4">
                            <div className="text-[#EF4444]   text-[14px]">
                              Transaction Failed
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
                                href={getExplorerUrl(targetChain, withdrawTxHash)}
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
                          initiating a withdrawal on the selected network (Base or Ethereum), your vault shares will be
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
                                          getExplorerUrl(targetChain, req.transaction_hash),
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
                                          ? getExplorerUrl(targetChain, req.transaction_hash)
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
                                          getExplorerUrl(targetChain, req.transaction_hash),
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
                                          ? getExplorerUrl(targetChain, req.transaction_hash)
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
