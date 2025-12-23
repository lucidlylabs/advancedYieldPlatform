import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
  useTransaction,
  useReadContracts,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import {
  parseEther,
  type Address,
  formatUnits,
  createPublicClient,
  http,
  parseUnits,
  getAddress,
} from "viem";
import { RATE_PROVIDER_ABI } from "../config/abi/rateProvider";
import { useRouter } from "next/router";

type DurationType = "30_DAYS" | "60_DAYS" | "180_DAYS" | "PERPETUAL_DURATION";
type StrategyType = "STABLE" | "INCENTIVE";

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
  katana: ChainConfig;
  description: string;
  apy: string;
  incentives: {
    enabled: boolean;
    points: Array<{
      name: string;
      image: string;
      multiplier: number;
      description?: string;
    }>;
  };
  tvl: string;
  rpc?: string;
  show_cap: boolean;
  filled_cap: string;
  cap_limit: string;
  boringVaultAddress?: string;
  rateProvider: string;
  shareAddress: string;
}

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
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
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Vault ABI for deposit
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "depositAsset", type: "address" },
      { name: "depositAmount", type: "uint256" },
      { name: "minimumMint", type: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    name: "depositAndBridge",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "depositAsset", type: "address" },
      { name: "depositAmount", type: "uint256" },
      { name: "minimumMint", type: "uint256" },
      { name: "to", type: "address" },
      { name: "bridgeWildCard", type: "bytes" },
      { name: "feeToken", type: "address" },
      { name: "maxFee", type: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    name: "previewFee",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "shareAmount", type: "uint96" },
      { name: "to", type: "address" },
      { name: "bridgeWildCard", type: "bytes" },
      { name: "feeToken", type: "address" },
    ],
    outputs: [{ name: "fee", type: "uint256" }],
  },
  {
    name: "totalAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "depositCap",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface DepositViewProps {
  selectedAsset: string;
  duration: DurationType;
  strategy: "stable" | "incentive" | "syHLP";
  apy: string;
  onBack: () => void;
  onReset: () => void;
  strategyKey?: string; // Optional strategy key (e.g., "STABLE", "syHLP", "INCENTIVE")
}

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

// Exchange Rate Component
interface ExchangeRateProps {
  selectedAssetOption?: TokenConfig | null;
  targetChain: string;
  strategyConfig: StrategyConfig;
}

const ExchangeRate: React.FC<ExchangeRateProps> = ({
  selectedAssetOption,
  targetChain,
  strategyConfig,
}) => {
  const [exchangeRate, setExchangeRate] = useState<string>("0.98");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch exchange rate for the selected asset only
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!selectedAssetOption) {
        setExchangeRate("0.98");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Get rate provider address and network config based on selected target chain
        const rateProviderAddress = strategyConfig.rateProvider;

        // Helper function to get chain config based on target chain
        const getChainConfig = (chainName: string) => {
          const normalizedChainName = chainName.toLowerCase();
          switch (normalizedChainName) {
            case "arbitrum":
              return strategyConfig.arbitrum;
            case "ethereum":
              return strategyConfig.ethereum;
            case "katana":
              return strategyConfig.katana;
            case "hyperevm":
              return (strategyConfig as any).hyperEVM;
            case "base":
            default:
              return strategyConfig.base;
          }
        };

        const chainData = getChainConfig(targetChain);
        const { rpcUrl, chain } = {
          rpcUrl: chainData.rpc,
          chain: chainData.chainObject,
        };

        // Create client with fallback RPC endpoints for Base only
        const baseRpcUrls = [
          "https://base.llamarpc.com",
          "https://base.blockpi.network/v1/rpc/public",
          "https://base-mainnet.g.alchemy.com/v2/demo",
          "https://base.meowrpc.com",
        ];

        const client = createPublicClient({
          transport: http(rpcUrl),
          chain,
        });

        // Get rate from rate provider using selected token address with retry logic
        let rate;
        let lastError;

        // Try primary RPC first
        try {
          rate = await client.readContract({
            address: rateProviderAddress as Address,
            abi: RATE_PROVIDER_ABI,
            functionName: "getRateInQuoteSafe",
            args: [selectedAssetOption.contract as Address],
          });
        } catch (error) {
          console.warn("Primary RPC failed, trying fallback RPCs:", error);
          lastError = error;

          // Try fallback RPCs for Base only
          let fallbackUrls: string[] = [];
          if (targetChain === "base") {
            fallbackUrls = baseRpcUrls.slice(1);
          }

          for (const fallbackRpc of fallbackUrls) {
            try {
              const fallbackClient = createPublicClient({
                transport: http(fallbackRpc),
                chain,
              });

              rate = await fallbackClient.readContract({
                address: rateProviderAddress as Address,
                abi: RATE_PROVIDER_ABI,
                functionName: "getRateInQuoteSafe",
                args: [selectedAssetOption.contract as Address],
              });
              console.log(
                `Successfully connected using fallback RPC: ${fallbackRpc}`
              );
              break;
            } catch (fallbackError) {
              console.warn(
                `Fallback RPC ${fallbackRpc} also failed:`,
                fallbackError
              );
              lastError = fallbackError;
            }
          }

          // If all RPCs failed, throw the last error
          if (!rate) {
            throw lastError;
          }
        }

        console.log("Exchange rate debug:", {
          token: selectedAssetOption.name,
          tokenContract: selectedAssetOption.contract,
          rateProviderAddress,
          rawRate: rate.toString(),
          rateLength: rate.toString().length,
          targetChain,
          strategyType: (strategyConfig as any).type,
        });

        // Based on Basescan results:
        // USDC: 1010566 (6 decimals) = 1.010566 USDC per 1 syUSD
        // USDS: 1010566000000000000 (18 decimals) = 1.010566 USDS per 1 syUSD
        // sUSDS: 948812511572256076 (18 decimals) = 0.948812 sUSDS per 1 syUSD

        // The rate is returned in the same decimals as the deposit token
        // Use the deposit token's decimals to format the rate correctly
        const rateFormatted = formatUnits(rate, selectedAssetOption.decimal);
        const rateNumber = parseFloat(rateFormatted);

        // This rate represents: how many deposit tokens = 1 vault share
        // For display, we want: 1 deposit token = X vault shares
        // So exchange rate = 1 / rate
        const exchangeRateNumber = rateNumber > 0 ? 1 / rateNumber : 0;

        // For BTC and ETH, show 6 decimals; for others, show 2 decimals
        const isBtc = selectedAssetOption?.name === "eBTC" || 
                     (strategyConfig as any).type === "btc";
        const isEth = selectedAssetOption?.name === "WETH" || 
                     (strategyConfig as any).type === "eth";
        const useHighPrecision = isBtc || isEth;

        console.log("Rate conversion:", {
          token: selectedAssetOption.name,
          tokenDecimals: selectedAssetOption.decimal,
          rawRate: rate.toString(),
          rateFormatted,
          rateNumber,
          exchangeRate: exchangeRateNumber,
          final: useHighPrecision ? exchangeRateNumber.toFixed(6) : exchangeRateNumber.toFixed(2),
        });

        const exchangeRateFormatted = exchangeRateNumber > 0
          ? (useHighPrecision ? exchangeRateNumber.toFixed(6) : exchangeRateNumber.toFixed(2))
          : (useHighPrecision ? "1.000000" : "1.00");
        setExchangeRate(exchangeRateFormatted);
      } catch (error) {
        console.error(
          `Error fetching rate for ${selectedAssetOption.name}:`,
          error
        );
        setExchangeRate("0.98"); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
  }, [selectedAssetOption, targetChain, strategyConfig]);

  // Don't show anything if no asset is selected
  if (!selectedAssetOption) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-3 px-4 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between w-full max-w-[580px]">
        <div className="flex items-center gap-2">
          <span className="text-[#9C9DA2] text-[14px] font-normal">
            Exchange rate
          </span>
          <Tooltip
            content={`Current exchange rate between ${selectedAssetOption.name} and ${(strategyConfig as any)?.name || (strategyConfig as any)?.displayName || "syUSD"} vault shares`}
            side="bottom"
          >
            <div className="w-4 h-4 rounded-full flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="7" stroke="#9C9DA2" strokeWidth="1" />
                <path
                  d="M8 5v3M8 11h.01"
                  stroke="#9C9DA2"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1e202c] rounded-full px-2 py-1">
            <span className="text-white text-[14px] font-medium">1</span>
            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center">
              <Image
                src={selectedAssetOption.image}
                alt={selectedAssetOption.name}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          </div>
          <span className="text-[#9C9DA2] text-[14px]">=</span>
          <div className="flex items-center gap-2 bg-[#1e202c] rounded-full px-2 py-1">
            <span className="text-white text-[14px] font-medium">
              {isLoading ? "..." : exchangeRate}
            </span>
            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-[#1A1B1E]">
              <Image
                src={
                  (strategyConfig as any).image || 
                  (selectedAssetOption?.name === "eBTC" || (strategyConfig as any).type === "btc"
                    ? "/images/icons/btc-stable.svg" 
                    : (strategyConfig as any).image || "/images/icons/syUSD.svg")
                }
                alt={(strategyConfig as any).name || (strategyConfig as any).displayName || "syUSD"}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DepositView: React.FC<DepositViewProps> = ({
  selectedAsset,
  duration,
  strategy,
  strategyKey,
  apy,
  onBack,
  onReset,
}) => {
  // Format duration for display
  const formatDuration = (duration: string) => {
    if (duration === "PERPETUAL_DURATION") return "Liquid";
    const [number, period] = duration.split("_");
    return `${number} ${period.toLowerCase()}`;
  };
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [isDepositSuccessLocal, setIsDepositSuccessLocal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const [transactionChain, setTransactionChain] = useState<string | null>(null); // Store chain where transaction was executed
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [approvalChain, setApprovalChain] = useState<string | null>(null); // Store chain where approval was executed
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWaitingForSignature, setIsWaitingForSignature] = useState(false);
  const [status, setStatus] = useState<
    "loading" | "waitingForSignature" | "approved" | "idle"
  >("idle");
  const [isMultiChain, setIsMultiChain] = useState<boolean>(false);
  const [bridgeFee, setBridgeFee] = useState<string>("0");
  const [isLoadingFee, setIsLoadingFee] = useState<boolean>(false);
  const { switchChain } = useSwitchChain();
  const { chain } = useAccount(); // Get connected chain info
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(-1);
  const [rawBalance, setRawBalance] = useState<string>("0"); // New state for unformatted balance
  const [sharesToReceive, setSharesToReceive] = useState<string>("0");
  const [usdValue, setUsdValue] = useState<string>("0.00"); // New state for shares calculation
  const [wbtcPrice, setWbtcPrice] = useState<number>(0); // wBTC price in USD
  const [ethPrice, setEthPrice] = useState<number>(0); // ETH price in USD

  // Add state for custom dropdown
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  
  // Get strategy config first to determine default chain
  const strategyConfigs = {
    USD: USD_STRATEGIES,
    BTC: BTC_STRATEGIES,
    ETH: ETH_STRATEGIES,
  };
  const assetStrategies =
    strategyConfigs[selectedAsset as keyof typeof strategyConfigs];
  
  // Determine which strategy config to use
  // If strategyKey is provided, use it directly (e.g., "STABLE", "syHLP")
  // Otherwise, fall back to old logic (stable -> STABLE, incentive -> INCENTIVE)
  let strategyConfigKey: string;
  if (strategyKey) {
    strategyConfigKey = strategyKey;
  } else if (strategy === "stable") {
    strategyConfigKey = "STABLE";
  } else if (strategy === "syHLP") {
    strategyConfigKey = "syHLP";
  } else {
    strategyConfigKey = "INCENTIVE";
  }
  
  const tempStrategyConfig = (assetStrategies as any)?.[duration]?.[
    strategyConfigKey
  ] as StrategyConfig;
  
  // Determine default chain based on strategy - BTC and ETH only have arbitrum
  const getDefaultChain = () => {
    if (selectedAsset === "BTC") {
      return "arbitrum";
    }
    if (selectedAsset === "ETH") {
      return "arbitrum";
    }
    // For USD, check which networks are available
    // Priority: hyperEVM (for syHLP), then base, then others
    if ((tempStrategyConfig as any)?.hyperEVM) return "hyperEVM";
    if (tempStrategyConfig?.base) return "base";
    if (tempStrategyConfig?.arbitrum) return "arbitrum";
    if (tempStrategyConfig?.ethereum) return "ethereum";
    if (tempStrategyConfig?.katana) return "katana";
    return chain?.name.toLowerCase() || "base";
  };
  
  const [targetChain, setTargetChain] = useState<string>(getDefaultChain());

  // Add state for asset selection popup
  const [isAssetPopupOpen, setIsAssetPopupOpen] = useState(false);
  const [assetBalances, setAssetBalances] = useState<{ [key: string]: string }>(
    {}
  );
  const [isLoadingAssetBalances, setIsLoadingAssetBalances] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // receiveChain will mirror targetChain
  const router = useRouter();

  // Now access the specific duration and strategy type (using tempStrategyConfig from above)
  const strategyConfig = tempStrategyConfig;

  // Get the actual APY from prop and extract numeric value
  const actualApy = apy ? apy.replace("%", "") : "0";

  // Helper to extract unique chain configurations based on current strategy
  const getUniqueChainConfigs = useMemo(() => {
    const uniqueChains = new Map<
      string,
      { name: string; network: string; image: string }
    >();

    // Use the current strategy config instead of hardcoded USD
    if (strategyConfig) {
      if (strategyConfig.base && strategyConfig.base.image) {
        uniqueChains.set("base", {
          name: "Base",
          network: "base",
          image: strategyConfig.base.image,
        });
      }
      if (
        strategyConfig.ethereum &&
        strategyConfig.ethereum.image
      ) {
        uniqueChains.set("ethereum", {
          name: "Ethereum",
          network: "ethereum",
          image: strategyConfig.ethereum.image,
        });
      }
      if (
        strategyConfig.arbitrum &&
        strategyConfig.arbitrum.image
      ) {
        uniqueChains.set("arbitrum", {
          name: "Arbitrum",
          network: "arbitrum",
          image: strategyConfig.arbitrum.image,
        });
      }
      if (strategyConfig.katana && strategyConfig.katana.image) {
        uniqueChains.set("katana", {
          name: "Katana",
          network: "katana",
          image: strategyConfig.katana.image,
        });
      }
      if ((strategyConfig as any).hyperEVM && (strategyConfig as any).hyperEVM.image) {
        uniqueChains.set("hyperEVM", {
          name: "HyperEVM",
          network: "hyperEVM",
          image: (strategyConfig as any).hyperEVM.image,
        });
      }
    }

    return Array.from(uniqueChains.values());
  }, [strategyConfig]);

  // Update targetChain when asset or strategy changes to ensure it's valid
  useEffect(() => {
    if (!strategyConfig) return;
    
    // Check if current targetChain is valid for this strategy
    const isValidChain = 
      (targetChain === "arbitrum" && strategyConfig.arbitrum) ||
      (targetChain === "ethereum" && strategyConfig.ethereum) ||
      (targetChain === "katana" && strategyConfig.katana) ||
      (targetChain === "base" && strategyConfig.base) ||
      (targetChain === "hyperEVM" && (strategyConfig as any).hyperEVM);
    
    // If current chain is not valid, switch to a valid one
    if (!isValidChain) {
      if ((selectedAsset === "BTC" || selectedAsset === "ETH") && strategyConfig.arbitrum) {
        setTargetChain("arbitrum");
      } else if ((strategyConfig as any).hyperEVM) {
        setTargetChain("hyperEVM");
      } else if (strategyConfig.base) {
        setTargetChain("base");
      } else if (strategyConfig.arbitrum) {
        setTargetChain("arbitrum");
      } else if (strategyConfig.ethereum) {
        setTargetChain("ethereum");
      } else if (strategyConfig.katana) {
        setTargetChain("katana");
      }
    }

    // Reset isMultiChain when targetChain changes - it will be properly calculated in handleDeposit
    setIsMultiChain(false);
  }, [selectedAsset, strategyConfig, targetChain]);

  // Parse all available deposit assets from strategyConfig, filtered by targetChain
  const assetOptions = useMemo(() => {
    if (!strategyConfig) {
      return [];
    }
    
    switch (targetChain) {
      case "arbitrum":
        return strategyConfig.arbitrum?.tokens || [];
      case "ethereum":
        return strategyConfig.ethereum?.tokens || [];
      case "katana":
        return strategyConfig.katana?.tokens || [];
      case "hyperEVM":
        return (strategyConfig as any).hyperEVM?.tokens || [];
      case "base":
      default:
        return strategyConfig.base?.tokens || [];
    }
  }, [strategyConfig, targetChain]);

  const selectedAssetOption =
    selectedAssetIdx >= 0 ? assetOptions[selectedAssetIdx] : null;

  // Update token contract address and decimals
  const tokenContractAddress = selectedAssetOption?.contract;
  const depositTokenDecimals = selectedAssetOption?.decimal;

  // Function to calculate shares the user will receive
  const calculateSharesToReceive = async (depositAmount: string) => {
    if (
      !depositAmount ||
      parseFloat(depositAmount) <= 0 ||
      !selectedAssetOption
    ) {
      setSharesToReceive("0");
      return;
    }

    try {
      const { rpcUrl, chain: clientChain } = getChainConfig(targetChain);

      // RPC fallback URLs for Base only
      const baseRpcUrls = [
        "https://base.llamarpc.com",
        "https://base.blockpi.network/v1/rpc/public",
        "https://base-mainnet.g.alchemy.com/v2/demo",
        "https://base.meowrpc.com",
      ];

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: clientChain,
      });

      // Get rate provider address from strategy config
      const rateProviderAddress = strategyConfig.rateProvider;
      const depositTokenAddress = selectedAssetOption.contract;

      // Call getRateInQuoteSafe with retry logic
      let rateInQuote;
      let lastError;

      try {
        rateInQuote = await client.readContract({
          address: rateProviderAddress as Address,
          abi: RATE_PROVIDER_ABI,
          functionName: "getRateInQuoteSafe",
          args: [depositTokenAddress as Address],
        });
      } catch (error) {
        console.warn(
          "Primary RPC failed in calculateSharesToReceive, trying fallback RPCs:",
          error
        );
        lastError = error;

        // Try fallback RPCs for Base only
        let fallbackUrls: string[] = [];
        if (targetChain === "base") {
          fallbackUrls = baseRpcUrls.slice(1);
        }

        for (const fallbackRpc of fallbackUrls) {
          try {
            const fallbackClient = createPublicClient({
              transport: http(fallbackRpc),
              chain: clientChain,
            });

            rateInQuote = await fallbackClient.readContract({
              address: rateProviderAddress as Address,
              abi: RATE_PROVIDER_ABI,
              functionName: "getRateInQuoteSafe",
              args: [depositTokenAddress as Address],
            });
            console.log(
              `Successfully connected using fallback RPC: ${fallbackRpc}`
            );
            break;
          } catch (fallbackError) {
            console.warn(
              `Fallback RPC ${fallbackRpc} also failed:`,
              fallbackError
            );
            lastError = fallbackError;
          }
        }

        // If all RPCs failed, throw the last error
        if (!rateInQuote) {
          throw lastError;
        }
      }

      console.log("Rate calculation details:", {
        depositAmount,
        rateInQuote: rateInQuote.toString(),
        depositTokenDecimals,
        rateProviderAddress,
        depositTokenAddress,
      });

      // Convert deposit amount to wei
      const amountInWei = parseUnits(depositAmount, depositTokenDecimals || 18);

      // Calculate shares: user input / (rate / 10^depositTokenDecimals)
      // The rate is in 18 decimals, so we need to account for deposit token decimals
      // For USDC use 10^6, for eBTC use 10^8, for others (USDS, sUSDS) use 10^18
      const shareDecimals = (strategyConfig as any).shareAddress_token_decimal || 18;
      let shares;
      if (selectedAssetOption.name === "USDC") {
        // For USDC, use 10^6
        const scaleMultiplier = BigInt(10 ** 6);
        shares =
          (amountInWei * scaleMultiplier) / BigInt(rateInQuote.toString());
      } else if (selectedAssetOption.name === "eBTC" || selectedAsset === "BTC") {
        // For eBTC, use 10^8 (eBTC has 8 decimals, and syBTC shares also have 8 decimals)
        const scaleMultiplier = BigInt(10 ** 8);
        shares =
          (amountInWei * scaleMultiplier) / BigInt(rateInQuote.toString());
      } else {
        // For USDS, sUSDS, use 10^18
        const scaleMultiplier = BigInt(10 ** 18);
        shares =
          (amountInWei * scaleMultiplier) / BigInt(rateInQuote.toString());
      }

      // Convert shares back to human readable format based on share token decimals
      // For USDC use 6 decimals, for eBTC/BTC use 8 decimals, for others use 18 decimals
      let sharesFormatted;
      if (selectedAssetOption.name === "USDC") {
        sharesFormatted = formatUnits(shares, 6);
      } else if (selectedAssetOption.name === "eBTC" || selectedAsset === "BTC") {
        sharesFormatted = formatUnits(shares, shareDecimals);
      } else {
        sharesFormatted = formatUnits(shares, 18);
      }

      // Format shares to be more readable with proper number formatting
      const sharesNumber = parseFloat(sharesFormatted);
      const formattedShares = sharesNumber.toLocaleString(undefined, {
        minimumFractionDigits: selectedAsset === "BTC" ? 7 : 2,
        maximumFractionDigits: selectedAsset === "BTC" ? 7 : 6,
      });

      setSharesToReceive(sharesFormatted);

      // Calculate USD value
      const sharesForUsd = parseFloat(sharesFormatted); // This is already in human-readable format (e.g., 0.0002154 syBTC)
      // Use 10^6 for USDC, USDT, vbUSDC, and vbUSDT; 10^8 for eBTC/BTC; 10^18 for other tokens
      const rateDecimals =
        selectedAssetOption?.name === "USDC" ||
        selectedAssetOption?.name === "USDT" ||
        selectedAssetOption?.name === "vbUSDC" ||
        selectedAssetOption?.name === "vbUSDT"
          ? 6
          : selectedAssetOption?.name === "eBTC" || selectedAsset === "BTC"
          ? 8
          : 18;
      const rateNumber = parseFloat(formatUnits(rateInQuote, rateDecimals));
      // rateNumber represents: how many wBTC/WETH (or USDC) per 1 syBTC/syETH share
      // For syBTC: shares (syBTC) * rateNumber (wBTC per syBTC) * wbtcPrice (USD per wBTC) = USD value
      // For syETH: shares (syETH) * rateNumber (WETH per syETH) * ethPrice (USD per ETH) = USD value
      // For syUSD: shares (syUSD) * rateNumber (USDC per syUSD) = USD value (since USDC ≈ 1 USD)
      const isBtc = selectedAssetOption?.name === "eBTC" || selectedAsset === "BTC";
      const isEth = selectedAssetOption?.name === "WETH" || selectedAsset === "ETH";
      let usdValueCalculated: number;
      if (isBtc && wbtcPrice > 0) {
        // For syBTC: multiply shares by exchange rate (syBTC to wBTC) and then by wBTC price (wBTC to USD)
        usdValueCalculated = sharesForUsd * rateNumber * wbtcPrice;
      } else if (isEth && ethPrice > 0) {
        // For syETH: multiply shares by exchange rate (syETH to WETH) and then by ETH price (ETH to USD)
        usdValueCalculated = sharesForUsd * rateNumber * ethPrice;
      } else {
        // For syUSD: rateNumber is already in USD terms (USDC per syUSD ≈ USD per syUSD)
        usdValueCalculated = sharesForUsd * rateNumber;
      }
      // For BTC and ETH, show 6 decimals; for others, show 2 decimals
      const formattedUsdValue = (isBtc || isEth)
        ? usdValueCalculated.toFixed(6)
        : usdValueCalculated.toFixed(2);
      setUsdValue(formattedUsdValue);

      console.log("Shares calculation:", {
        amountInWei: amountInWei.toString(),
        rateInQuote: rateInQuote.toString(),
        shares: shares.toString(),
        sharesFormatted,
        rateNumber,
        usdValue: usdValueCalculated,
      });
    } catch (error) {
      console.error("Error calculating shares:", error);
      setSharesToReceive("0");
      setUsdValue("0.00");
    }
  };

  // Fetch wBTC price when BTC strategy is selected
  useEffect(() => {
    const fetchWbtcPrice = async () => {
      if (selectedAsset === "BTC") {
        try {
          const wbtcPriceUrl = (BTC_STRATEGIES.PERPETUAL_DURATION.STABLE as any).wbtcPrice;
          
          if (!wbtcPriceUrl || typeof wbtcPriceUrl !== "string" || !wbtcPriceUrl.startsWith("http")) {
            console.warn("wBTC price URL not available");
            setWbtcPrice(0);
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
        }
      } else {
        setWbtcPrice(0);
      }
    };

    fetchWbtcPrice();
  }, [selectedAsset]);

  // Fetch ETH price when ETH strategy is selected
  useEffect(() => {
    const fetchEthPrice = async () => {
      if (selectedAsset === "ETH") {
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
      } else {
        setEthPrice(0);
      }
    };

    fetchEthPrice();
  }, [selectedAsset]);

  // Effect to recalculate shares when amount or selected asset changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateSharesToReceive(amount);
    } else {
      setSharesToReceive("0");
      setUsdValue("0.00");
    }
  }, [amount, selectedAssetIdx, targetChain, strategyConfig, wbtcPrice, ethPrice]);

  // Calculate deposit cap values from env config
  const showDepositCap = strategyConfig.show_cap;
  const depositCap = useMemo(
    () => ({
      used: strategyConfig.filled_cap || "0",
      total: strategyConfig.cap_limit || "0",
    }),
    [strategyConfig]
  );

  // Calculate remaining space
  const remainingSpace = useMemo(() => {
    const total = parseFloat(depositCap.total.replace(/,/g, ""));
    const used = parseFloat(depositCap.used.replace(/,/g, ""));
    return (total - used).toLocaleString();
  }, [depositCap]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const total = parseFloat(depositCap.total.replace(/,/g, ""));
    const used = parseFloat(depositCap.used.replace(/,/g, ""));
    return (used / total) * 100;
  }, [depositCap]);

  const { address } = useAccount();

  // Vault contract for deposits
  const vaultContractAddress = strategyConfig.contract;

  console.log("Contract Addresses:", {
    tokenContract: tokenContractAddress,
    vaultContract: vaultContractAddress,
    strategy: strategyConfig,
  });

  // Approve token for vault
  const {
    writeContractAsync: approve,
    data: approveData,
    isPending: approveIsPending,
  } = useWriteContract();

  // Get chain ID for the target chain based on strategy config
  const targetChainId = useMemo(() => {
    if (!strategyConfig) return undefined;
    const normalizedChain = targetChain.toLowerCase();
    let chainData;
    switch (normalizedChain) {
      case "arbitrum":
        chainData = strategyConfig.arbitrum;
        break;
      case "ethereum":
        chainData = strategyConfig.ethereum;
        break;
      case "katana":
        chainData = strategyConfig.katana;
        break;
      case "hyperevm":
        chainData = (strategyConfig as any).hyperEVM;
        break;
      case "base":
      default:
        chainData = strategyConfig.base;
        break;
    }
    return chainData?.chainId;
  }, [targetChain, strategyConfig]);

  // Check allowance against the BoringVault contract (which actually pulls the tokens)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenContractAddress as Address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as Address, strategyConfig.boringVaultAddress as Address],
    chainId: targetChainId,
  });

  console.log("Allowance check details:", {
    tokenContract: tokenContractAddress,
    userAddress: address,
    boringVault: strategyConfig.boringVaultAddress,
    allowance: allowance?.toString(),
    hasAllowance: !!allowance,
    amount: amount
      ? parseUnits(amount, depositTokenDecimals || 18).toString()
      : "0",
    needsApproval: amount
      ? BigInt(allowance?.toString() || "0") <
        parseUnits(amount, depositTokenDecimals || 18)
      : false,
    currentAllowanceFormatted: allowance
      ? formatUnits(BigInt(allowance.toString()), depositTokenDecimals || 18)
      : "0",
    requestedAmountFormatted: amount || "0",
  });

  // Watch approve transaction
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useTransaction({
      hash: approvalHash || undefined,
    });

  // Deposit into vault
  const {
    writeContractAsync: deposit,
    data: depositData,
    isPending: depositIsPending,
  } = useWriteContract();

  // Watch deposit transaction
  const {
    isLoading: isWaitingForDeposit,
    isSuccess: isDepositSuccess,
    data: depositTxData,
  } = useTransaction({
    hash: transactionHash || undefined,
  });

  // Add a debug check for the token contract
  useEffect(() => {
    const checkTokenContract = async () => {
      if (!tokenContractAddress || !address) return;

      try {
        const { rpcUrl, chain: targetChainConfig } =
          getChainConfig(targetChain);
        const client = createPublicClient({
          transport: http(rpcUrl),
          chain: targetChainConfig,
        });

        // Try to read basic token info
        const [name, symbol, decimals] = await Promise.all([
          client
            .readContract({
              address: tokenContractAddress as Address,
              abi: ERC20_ABI,
              functionName: "name",
            })
            .catch(() => "Error reading name"),
          client
            .readContract({
              address: tokenContractAddress as Address,
              abi: ERC20_ABI,
              functionName: "symbol",
            })
            .catch(() => "Error reading symbol"),
          client
            .readContract({
              address: tokenContractAddress as Address,
              abi: ERC20_ABI,
              functionName: "decimals",
            })
            .catch(() => "Error reading decimals"),
        ]);

        console.log("Token contract debug info:", {
          address: tokenContractAddress,
          name,
          symbol,
          decimals,
        });
      } catch (error) {
        console.error("Error checking token contract:", error);
      }
    };

    checkTokenContract();
  }, [tokenContractAddress, address, targetChain]);

  // Watch for approval success and update allowance
  useEffect(() => {
    if (isApprovalSuccess && approvalHash) {
      console.log("Approval successful, updating allowance...");
      refetchAllowance();
      setIsApproved(true);
      setIsWaitingForSignature(false);
    }
  }, [isApprovalSuccess, approvalHash, refetchAllowance]);

  // Reset loading states when transactions complete and refresh balance
  useEffect(() => {
    if (!isWaitingForApproval) {
      if (isApprovalSuccess) {
        setIsApproved(true);
        setIsWaitingForSignature(false);
      }
    }
  }, [isWaitingForApproval, isApprovalSuccess]);

  useEffect(() => {
    if (!isWaitingForDeposit && transactionHash) {
      // Only fetch balance after transaction completes (success or failure)
      // Don't reset approval state or form immediately
      fetchBalance();
      // Also refresh asset balances for the popup
      fetchAllAssetBalances();
    }
    // Keep form state until user manually resets
  }, [isWaitingForDeposit, transactionHash]);

  // Watch for deposit success
  useEffect(() => {
    if (isDepositSuccess && transactionHash && !isDepositSuccessLocal) {
      console.log("✅ Deposit transaction confirmed successfully");
      setDepositSuccess(true);
      setIsDepositSuccessLocal(true);
      setIsWaitingForSignature(false);
      setIsDepositing(false);
      // Clear any previous error messages when transaction succeeds
      setErrorMessage(null);
      console.log("Deposit successful!", {
        hash: transactionHash,
        amount,
        token: selectedAssetOption?.name || "Unknown",
      });
      // Don't reset form state - let user see the transaction hash and close manually
      // Form will reset when user clicks "Make Another Deposit"
    }
    // Don't check isError from useTransaction as it can give false positives during pending state
  }, [isDepositSuccess, transactionHash, amount, selectedAssetOption?.name, isDepositSuccessLocal]);

  useEffect(() => {
    if (isLoadingBalance) {
      setStatus("loading");
    } else if (
      isWaitingForSignature ||
      approveIsPending ||
      depositIsPending ||
      isWaitingForApproval ||
      isWaitingForDeposit
    ) {
      setStatus("waitingForSignature");
    } else if (isApproved && !depositIsPending && !isWaitingForDeposit) {
      setStatus("approved");
    } else {
      setStatus("idle");
    }
  }, [
    isLoadingBalance,
    isWaitingForSignature,
    approveIsPending,
    depositIsPending,
    isWaitingForApproval,
    isWaitingForDeposit,
    isApproved,
  ]);

  useEffect(() => {
    console.log("Status changed:", status);
  }, [status]);

  // Add preview fee function
  const previewBridgeFee = async (amount: bigint): Promise<bigint> => {
    if (!address || !amount) return BigInt(0); // Return 0 if prerequisites not met

    setIsLoadingFee(true);
    try {
      // For previewFee, we call the Teller contract on the SOURCE chain (where the deposit originates)
      // to get the fee for bridging TO the destination chain
      const { rpcUrl, chain: clientChain } = getChainConfig(targetChain);
      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: clientChain,
      });

      // Get bridge wildcard for DESTINATION chain (where vault tokens will be received)
      // This tells LayerZero which chain to bridge the tokens TO
      const bridgeWildCard = getBridgeWildCard();

      // Convert amount to uint96 for previewFee
      const shareAmount = amount as unknown as bigint;

      console.log("Previewing bridge fee:", {
        sourceChain: targetChain,
        destinationChain: strategyConfig.network,
        bridgeWildCard,
        amount: shareAmount.toString(),
        contract: vaultContractAddress,
      });

      // Call previewFee function on the source chain's Teller contract
      const fee = await client.readContract({
        address: vaultContractAddress as Address,
        abi: VAULT_ABI,
        functionName: "previewFee",
        args: [
          shareAmount, // shareAmount (uint96)
          address as Address, // to address
          bridgeWildCard, // bridgeWildCard bytes - DESTINATION chain endpoint ID
          "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // feeToken (ETH address)
        ],
      });

      console.log("Bridge fee preview result:", fee.toString());
      return fee as bigint; // Return the fee directly
    } catch (error) {
      console.error("Error previewing bridge fee:", error);
      return BigInt(0); // Return 0 on error
    } finally {
      setIsLoadingFee(false);
    }
  };

  // LayerZero endpoint ID mapping (in hex format, padded to 32 bytes)
  const LAYER_ZERO_ENDPOINT_IDS: { [key: string]: string } = {
    hyperevm: "0x000000000000000000000000000000000000000000000000000000000000769f", // hyperEVM: 30367
    katana: "0x00000000000000000000000000000000000000000000000000000000000076a7", // katana: 30375
    base: "0x00000000000000000000000000000000000000000000000000000000000075e8", // base: 30184
    arbitrum: "0x000000000000000000000000000000000000000000000000000000000000759e", // arbitrum: 30110
    ethereum: "0x0000000000000000000000000000000000000000000000000000000000007595", // ethereum: 30101
  };

  // Helper function to get bridge wildcard based on destination chain
  // LayerZero endpoint IDs:
  // - hyperEVM: 30367 (0x769f)
  // - katana: 30375 (0x76a7)
  // - base: 30184 (0x75e8)
  // - arbitrum: 30110 (0x759e)
  // - ethereum: 30101 (0x7595)
  const getBridgeWildCard = (): `0x${string}` => {
    // Get the destination chain (where vault tokens will be received)
    const destinationChain = (strategyConfig.network || "").toLowerCase();
    
    const endpointId = LAYER_ZERO_ENDPOINT_IDS[destinationChain];
    if (!endpointId) {
      console.warn(`Unknown destination chain: ${destinationChain}, using default (base)`);
      return "0x00000000000000000000000000000000000000000000000000000000000075e8";
    }
    
    console.log(`Bridge wildcard for destination chain ${destinationChain}: ${endpointId}`);
    return endpointId as `0x${string}`;
  };

  // Helper function to get bridge wildcard for source chain (used in previewFee)
  const getBridgeWildCardForSourceChain = (sourceChain: string): `0x${string}` => {
    const normalizedChain = sourceChain.toLowerCase();
    
    const endpointId = LAYER_ZERO_ENDPOINT_IDS[normalizedChain];
    if (!endpointId) {
      console.warn(`Unknown source chain: ${normalizedChain}, using default (base)`);
      return "0x00000000000000000000000000000000000000000000000000000000000075e8";
    }
    
    console.log(`Bridge wildcard for source chain ${normalizedChain}: ${endpointId}`);
    return endpointId as `0x${string}`;
  };

  // Modify handleDeposit function
  const handleDeposit = async () => {
    console.log("Deposit clicked", {
      address,
      amount,
      tokenContract: tokenContractAddress,
      vaultContract: vaultContractAddress,
      strategy,
      duration,
      currentAllowance: allowance?.toString(),
      isApproved,
      isMultiChain,
      targetChain,
    });

    if (!address || !amount || !approve || !deposit) {
      console.log("Missing required fields", {
        hasAddress: !!address,
        hasAmount: !!amount,
        hasApprove: !!approve,
        hasDeposit: !!deposit,
      });
      return;
    }

    try {
      setIsWaitingForSignature(true);
      // Clear any previous error messages and transaction state when starting a new transaction
      setErrorMessage(null);
      // Don't clear transactionHash here - it will be set when the new transaction is sent
      // But clear the success state to allow new transaction tracking
      setIsDepositSuccessLocal(false);
      setDepositSuccess(false);
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error("Invalid amount");
      }

      const roundedAmount =
        Math.round(amountFloat * Math.pow(10, depositTokenDecimals || 18)) /
        Math.pow(10, depositTokenDecimals || 18);
      const amountInWei = parseUnits(
        roundedAmount.toFixed(depositTokenDecimals || 18),
        depositTokenDecimals || 18
      );

      // Determine if multi-chain deposit is needed
      const currentChainId = chain?.id;
      const targetChainConfig = getChainConfig(targetChain);
      const depositChainId = targetChainConfig.chainId;

      // Normalize network name to lowercase for getChainConfig
      const receiveChainName = (strategyConfig.network || "").toLowerCase();
      const receiveChainId = getChainConfig(receiveChainName).chainId;

      // Calculate isMultiChain as a local variable to avoid stale state issues
      const isMultiChainCalculated = depositChainId !== receiveChainId;
      setIsMultiChain(isMultiChainCalculated);

      console.log("Multi-chain check:", {
        depositChainId,
        receiveChainId,
        isMultiChainCalculated,
      });

      // Get rate from rate provider
      const rateProviderAddress = strategyConfig.rateProvider;

      const client = createPublicClient({
        transport: http(targetChainConfig.rpcUrl),
        chain: targetChainConfig.chain,
      });

      // Get rate from rate provider using the deposit token address
      const rate = await client.readContract({
        address: rateProviderAddress as Address,
        abi: RATE_PROVIDER_ABI,
        functionName: "getRateInQuote",
        args: [selectedAssetOption?.contract as Address],
      });

      console.log("Raw rate from contract:", rate.toString());

      // Calculate minimum mint amount in 6 decimals
      const minimumMint = (amountInWei * BigInt(rate)) / BigInt(1e18);
      const minimumMintIn6Decimals = (minimumMint * BigInt(1e6)) / BigInt(1e18);

      console.log("Minimum mint calculation details:", {
        amountInWei: amountInWei.toString(),
        rate: rate.toString(),
        minimumMint: minimumMint.toString(),
        minimumMintIn6Decimals: minimumMintIn6Decimals.toString(),
        minimumMintLength: minimumMintIn6Decimals.toString().length,
      });

      // Approve tokens for the BoringVault contract (which actually pulls the tokens)
      const boringVaultAddress = strategyConfig.boringVaultAddress;
      if (!boringVaultAddress) {
        throw new Error("Boring vault address not configured");
      }

      // Check if we need approval
      const currentAllowance = allowance
        ? BigInt(allowance.toString())
        : BigInt(0);
      const needsApproval = currentAllowance < amountInWei;

      if (allowance === undefined) {
        setErrorMessage(
          "Unable to fetch allowance. Please check your network and try again."
        );
        setIsWaitingForSignature(false);
        return;
      }

      // Step 1: Approve tokens for BoringVault contract if needed
      if (needsApproval && !isApproved && !approveIsPending) {
        console.log("Calling approve function...");
        try {
          const approveTx = await approve({
            address: tokenContractAddress as Address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [boringVaultAddress as Address, amountInWei],
            chainId: depositChainId,
            account: address as Address,
          });

          if (typeof approveTx === "string" && approveTx.startsWith("0x")) {
            setApprovalHash(approveTx as `0x${string}`);
            setApprovalChain(targetChain); // Store the chain where approval was executed
            // Wait for approval transaction to be mined
            await new Promise((resolve) => {
              const checkApproval = setInterval(async () => {
                if (isApprovalSuccess) {
                  clearInterval(checkApproval);
                  setIsWaitingForSignature(false);
                  resolve(true);
                }
              }, 1000);
            });
          }
        } catch (error: any) {
          console.error("Approval transaction failed:", error);
          setErrorMessage("Approval failed");
          if (error.code === 4001) {
            setErrorMessage("Approval cancelled by user.");
          } else {
            setErrorMessage("Approval failed. Please try again.");
          }
          setIsWaitingForSignature(false);
          return;
        }
      }

      // Only proceed with deposit if we have sufficient allowance and no pending approval
      if ((!needsApproval || isApproved) && !approveIsPending) {
        if (isMultiChainCalculated) {
          // Preview bridge fee before proceeding
          const calculatedBridgeFee = await previewBridgeFee(amountInWei);

          console.log("Preview Fee:", formatUnits(calculatedBridgeFee, 18));

          // Get bridge wildcard based on destination chain (where vault tokens will be received)
          const bridgeWildCard = getBridgeWildCard();

          // Convert bridge fee to wei
          const bridgeFeeWei = calculatedBridgeFee;

          // Proceed with multi-chain deposit
          console.log("Sending multi-chain deposit transaction:", {
            contract: vaultContractAddress,
            token: tokenContractAddress,
            amount: amountInWei.toString(),
            minimumMint: "0", // Set minimumMint to 0 for multi-chain
            bridgeWildCard,
            bridgeFee: bridgeFeeWei.toString(),
          });

          try {
            const tx = await deposit({
              address: vaultContractAddress as Address,
              abi: VAULT_ABI,
              functionName: "depositAndBridge",
              args: [
                tokenContractAddress as Address,
                amountInWei,
                BigInt(0), // Set minimumMint to 0 for multi-chain
                address as Address,
                bridgeWildCard,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // ETH address
                bridgeFeeWei, // Use the calculated bridge fee
              ],
              chainId: depositChainId,
              account: address as Address,
              value: bridgeFeeWei, // Include the calculated bridge fee in ETH
            });

            if (tx && typeof tx === "string" && tx.startsWith("0x")) {
              setTransactionHash(tx as `0x${string}`);
              setTransactionChain(targetChain); // Store the chain where transaction was executed
              console.log("Multi-chain deposit transaction sent:", tx);
            } else {
              throw new Error("Invalid transaction response");
            }
          } catch (error: any) {
            setErrorMessage("Multi-chain deposit failed");
            if (error.code === 4001) {
              setErrorMessage("Multi-chain deposit cancelled by user.");
            } else {
              setErrorMessage("Multi-chain deposit failed. Please try again.");
            }
            setIsWaitingForSignature(false);
            return;
          }
        } else {
          // Regular single-chain deposit
          console.log("Sending deposit transaction:", {
            contract: vaultContractAddress,
            token: tokenContractAddress,
            amount: amountInWei.toString(),
            minimumMint: minimumMintIn6Decimals.toString(),
          });

          try {
            const tx = await deposit({
              address: vaultContractAddress as Address,
              abi: VAULT_ABI,
              functionName: "deposit",
              args: [
                tokenContractAddress as Address,
                amountInWei,
                minimumMintIn6Decimals,
              ],
              chainId: depositChainId,
              account: address as Address,
            });

            if (tx && typeof tx === "string" && tx.startsWith("0x")) {
              setTransactionHash(tx as `0x${string}`);
              setTransactionChain(targetChain); // Store the chain where transaction was executed
              console.log("Deposit transaction sent:", tx);
            } else {
              throw new Error("Invalid transaction response");
            }
          } catch (error: any) {
            console.log("error", error);
            if (
              error?.name === "UserRejectedRequestError" ||
              error?.message?.includes("User rejected the request") ||
              error?.cause?.message?.includes(
                "User denied transaction signature"
              )
            ) {
              setErrorMessage("Transaction cancelled by user.");
            } else {
              setErrorMessage("Deposit failed. Please try again.");
            }
            setIsWaitingForSignature(false);
            return;
          }
        }
      } else if (approveIsPending) {
        console.log("Approval is pending, waiting for it to complete.");
        setErrorMessage(
          "Approval is pending. Please complete the approval first."
        );
        setIsWaitingForSignature(true);
      } else {
        console.log("Insufficient allowance, approval needed first");
        setErrorMessage("Please approve the token spending first");
        setIsWaitingForSignature(false);
      }
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setErrorMessage("Transaction failed");
      setIsWaitingForSignature(false);
    }
  };

  // Add effect to preview fee when amount changes (only for cross-chain deposits)
  useEffect(() => {
    // Only preview fee if it's actually a cross-chain deposit
    // Compare targetChain (source) with strategyConfig.network (destination)
    const sourceChain = targetChain.toLowerCase();
    const destinationChain = (strategyConfig?.network || "").toLowerCase();
    const isActuallyMultiChain = sourceChain !== destinationChain;
    
    if (isActuallyMultiChain && amount && parseFloat(amount) > 0) {
      const amountInWei = parseUnits(amount, depositTokenDecimals || 18);
      previewBridgeFee(amountInWei);
    }
  }, [amount, targetChain, strategyConfig?.network]);

  // Helper to get correct RPC and chain config for each chain
  const getChainConfig = (chainName: string) => {
    let chainData;
    const normalizedChainName = chainName.toLowerCase();
    switch (normalizedChainName) {
      case "arbitrum":
        chainData = strategyConfig.arbitrum;
        break;
      case "ethereum":
        chainData = strategyConfig.ethereum;
        break;
      case "katana":
        chainData = strategyConfig.katana;
        break;
      case "hyperevm":
        chainData = (strategyConfig as any).hyperEVM;
        break;
      case "base":
      default:
        chainData = strategyConfig.base;
        break;
    }

    if (
      !chainData ||
      !chainData.rpc ||
      !chainData.chainId ||
      !chainData.chainObject
    ) {
      // Fallback to a default or throw an error if configuration is missing
      console.error(`Missing chain configuration for ${chainName}`);
      return {
        rpcUrl: "https://base.llamarpc.com",
        chainId: 8453,
        chain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: { decimals: 18, name: "Ethereum", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://base.llamarpc.com"] },
            public: { http: ["https://base.llamarpc.com"] },
          },
        },
      };
    }

    return {
      rpcUrl: chainData.rpc,
      chainId: chainData.chainId,
      chain: chainData.chainObject,
    };
  };

  // Add helper function to get explorer URL
  const getExplorerUrl = (chainName: string, txHash: string) => {
    switch (chainName.toLowerCase()) {
      case "ethereum":
        return `https://etherscan.io/tx/${txHash}`;
      case "arbitrum":
        return `https://arbiscan.io/tx/${txHash}`;
      case "katana":
        return `https://explorer.katanarpc.com//tx/${txHash}`;
      case "hyperevm":
        return `https://hyperevmscan.io/tx/${txHash}`;
      case "base":
      default:
        return `https://basescan.org/tx/${txHash}`;
    }
  };

  const fetchBalance = async () => {
    if (!address || !selectedAssetOption) return;

    setIsLoadingBalance(true);
    try {
      // Ensure address is properly checksummed
      const tokenContractAddress = getAddress(selectedAssetOption.contract);
      const walletAddress = getAddress(address);
      const decimals = Number(selectedAssetOption.decimal);
      const { rpcUrl, chain } = getChainConfig(targetChain);

      console.log("Fetching balance:", {
        token: selectedAssetOption?.name || "Unknown",
        contract: tokenContractAddress,
        wallet: walletAddress,
        network: targetChain,
        rpcUrl,
        decimals,
      });

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain,
      });

      const balanceResult = await client.readContract({
        address: tokenContractAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress],
      });

      const unformattedBalance = formatUnits(balanceResult as bigint, decimals);
      setRawBalance(unformattedBalance); // Set rawBalance here

      // For BTC, show 7 decimals; for others, show 2 decimals
      const isBtc = selectedAssetOption?.name === "eBTC" || selectedAsset === "BTC";
      const formattedBalance = Number(unformattedBalance).toLocaleString(
        undefined,
        {
          minimumFractionDigits: isBtc ? 7 : 2,
          maximumFractionDigits: isBtc ? 7 : 2,
        }
      );
      setBalance(formattedBalance);
      console.log("Balance fetched successfully:", {
        token: selectedAssetOption?.name || "Unknown",
        contract: tokenContractAddress,
        wallet: walletAddress,
        rawBalance: balanceResult.toString(),
        formattedBalance: unformattedBalance,
        displayBalance: formattedBalance,
      });
    } catch (error: any) {
      console.error("Error fetching balance:", {
        error: error.message,
        token: selectedAssetOption?.name || "Unknown",
        contract: selectedAssetOption?.contract,
        wallet: address,
        network: targetChain,
        stack: error.stack,
      });
      const isBtc = selectedAssetOption?.name === "eBTC" || selectedAsset === "BTC";
      setBalance(isBtc ? "0.0000000" : "0.00");
      setRawBalance("0"); // Also reset rawBalance on error
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Function to fetch balances for all assets
  const fetchAllAssetBalances = async () => {
    if (!address) return;

    setIsLoadingAssetBalances(true);
    try {
      const { rpcUrl, chain } = getChainConfig(targetChain);
      const client = createPublicClient({
        transport: http(rpcUrl),
        chain,
      });

      const balancePromises = assetOptions.map(async (asset: TokenConfig) => {
        try {
          // Ensure addresses are properly checksummed
          const tokenContractAddress = getAddress(asset.contract);
          const walletAddress = getAddress(address);

          console.log(`Fetching balance for ${asset.name}:`, {
            contract: tokenContractAddress,
            wallet: walletAddress,
            network: targetChain,
          });

          const balanceResult = await client.readContract({
            address: tokenContractAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [walletAddress],
          });

          const unformattedBalance = formatUnits(
            balanceResult as bigint,
            asset.decimal
          );
          // For eBTC, show 6 decimals in asset selection modal; for others, show 2 decimals
          const isBtc = asset.name === "eBTC";
          const formattedBalance = Number(unformattedBalance).toLocaleString(
            undefined,
            {
              minimumFractionDigits: isBtc ? 6 : 2,
              maximumFractionDigits: isBtc ? 6 : 2,
            }
          );

          console.log(`Balance fetched for ${asset.name}:`, {
            rawBalance: balanceResult.toString(),
            formattedBalance: unformattedBalance,
            displayBalance: formattedBalance,
          });

          return {
            name: asset.name,
            balance: formattedBalance,
            rawBalance: unformattedBalance,
          };
        } catch (error: any) {
          console.error(`Error fetching balance for ${asset.name}:`, {
            error: error.message,
            contract: asset.contract,
            wallet: address,
            network: targetChain,
            stack: error.stack,
          });
          return {
            name: asset.name,
            balance: "0.00",
            rawBalance: "0",
          };
        }
      });

      const balances = await Promise.all(balancePromises);
      const balanceMap: { [key: string]: string } = {};

      balances.forEach(({ name, balance }) => {
        balanceMap[name] = balance;
      });

      setAssetBalances(balanceMap);
    } catch (error) {
      console.error("Error fetching all asset balances:", error);
    } finally {
      setIsLoadingAssetBalances(false);
    }
  };

  // Add effect to switch network when target chain changes
  useEffect(() => {
    if (switchChain && targetChain) {
      const { chainId } = getChainConfig(targetChain);
      if (chainId && chain?.id !== chainId) {
        switchChain({ chainId });
      }
    }
  }, [targetChain, switchChain, chain]);

  // Add escape key handler for asset popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isAssetPopupOpen) {
        setIsAssetPopupOpen(false);
      }
    };

    if (isAssetPopupOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isAssetPopupOpen]);

  // Fetch asset balances when popup opens
  useEffect(() => {
    if (isAssetPopupOpen && address) {
      fetchAllAssetBalances();
    }
  }, [isAssetPopupOpen, address, targetChain]);

  // Helper function to get chain ID
  const getChainId = (chainName: string): number | undefined => {
    const { chainId } = getChainConfig(chainName);
    return chainId;
  };

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [
    address,
    selectedAssetIdx,
    selectedAsset,
    duration,
    strategy,
    targetChain,
  ]);

  const handleMaxClick = () => {
    setAmount(rawBalance); // Use rawBalance here
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      // Only allow numbers and one decimal point
      setAmount(value);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden pt-20 sm:pt-20 px-4 sm:px-0">
        {false ? (
          <div className="flex flex-col items-center justify-center h-full pt-12 px-4 sm:px-0">
            <div className="w-full max-w-[580px] bg-[#0D101C] rounded-lg p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-6">
                <svg
                  width="88"
                  height="88"
                  viewBox="0 0 88 88"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M19.0009 18.9998H69.0009V68.9998H19.0009V18.9998Z"
                    fill="white"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M44.0198 0.275391C68.1782 0.275391 87.7701 19.8673 87.7701 44.0257C87.7701 68.184 68.1782 87.7759 44.0198 87.7759C19.8614 87.7759 0.269531 68.184 0.269531 44.0257C0.269531 19.8673 19.8614 0.275391 44.0198 0.275391ZM34.9345 58.2361L24.2234 47.5161C22.3986 45.6902 22.3982 42.7127 24.2234 40.8872C26.0489 39.062 29.0397 39.0734 30.852 40.8872L38.4033 48.4444L57.1883 29.6593C59.0139 27.8337 61.9917 27.8337 63.8169 29.6593C65.6425 31.4845 65.6398 34.4649 63.8169 36.2879L41.7122 58.3926C39.8892 60.2155 36.9088 60.2182 35.0836 58.3926C35.0323 58.3413 34.9828 58.2892 34.9345 58.2361Z"
                    fill="#00BA00"
                  />
                </svg>
              </div>
              <h2 className="text-[#D7E3EF] text-xl sm:text-2xl font-bold mb-2">
                Deposit Success
              </h2>
              <p className="text-[#9C9DA2] mb-6">
                Your deposit has been successfully processed
              </p>
              <div className="bg-[#121521] rounded p-4 mb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={`/images/icons/${
                        selectedAssetOption?.name?.toLowerCase() ||
                        "default_assest"
                      }.svg`}
                      alt={selectedAssetOption?.name || "Asset"}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-[#EDF2F8] text-sm sm:text-base font-semibold">
                      {selectedAssetOption?.name || "Amount"}
                    </span>
                  </div>
                  <span className="text-[#EDF2F8] text-sm sm:text-base font-semibold">
                    {amount} {selectedAssetOption?.name || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                <span className="text-[#9C9DA2] text-sm font-normal">
                  Transaction Hash
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={getExplorerUrl(transactionChain || targetChain, transactionHash || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B88AF8] hover:underline flex items-center gap-1 text-sm font-normal break-all"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 3H21V9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 14L21 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {`${transactionHash?.slice(
                      0,
                      6
                    )}...${transactionHash?.slice(-4)}`}
                  </a>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`cursor-pointer hover:opacity-80 transition-all duration-200 flex-shrink-0 ${
                      isCopied ? "opacity-100" : "opacity-60"
                    }`}
                    onClick={async () => {
                      if (transactionHash) {
                        try {
                          await navigator.clipboard.writeText(transactionHash);
                          setIsCopied(true);
                          setTimeout(() => {
                            setIsCopied(false);
                          }, 2000);
                        } catch (err) {
                          console.error("Failed to copy: ", err);
                        }
                      }
                    }}
                  >
                    <path
                      d="M10.6673 10.1666V12.0333C10.6673 12.78 10.6673 13.1534 10.522 13.4386C10.3942 13.6895 10.1902 13.8934 9.93931 14.0213C9.65409 14.1666 9.28072 14.1666 8.53398 14.1666H3.46732C2.72058 14.1666 2.34721 14.1666 2.062 14.0213C1.81111 13.8934 1.60714 13.6895 1.47931 13.4386C1.33398 13.1534 1.33398 12.78 1.33398 12.0333V6.96659C1.33398 6.21985 1.33398 5.84648 1.47931 5.56126C1.60714 5.31038 1.81111 5.10641 2.062 4.97858C2.34721 4.83325 2.72058 4.83325 3.46732 4.83325H5.33398M7.46732 10.1666H12.534C13.2807 10.1666 13.6541 10.1666 13.9393 10.0213C14.1902 9.89343 14.3942 9.68946 14.522 9.43857C14.6673 9.15336 14.6673 8.77999 14.6673 8.03325V2.96659C14.6673 2.21985 14.6673 1.84648 14.522 1.56126C14.3942 1.31038 14.1902 1.10641 13.9393 0.978577C13.6541 0.833252 13.2807 0.833252 12.534 0.833252H7.46732C6.72058 0.833252 6.34721 0.833252 6.062 0.978577C5.81111 1.10641 5.60714 1.31038 5.47931 1.56126C5.33398 1.84648 5.33398 2.21985 5.33398 2.96659V8.03325C5.33398 8.77999 5.33398 9.15336 5.47931 9.43857C5.60714 9.68946 5.81111 9.89343 6.062 10.0213C6.34721 10.1666 6.72058 10.1666 7.46732 10.1666Z"
                      stroke={isCopied ? "#00D1A0" : "#9C9DA2"}
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <button
              onClick={onReset}
              className="w-full max-w-[580px] py-4 rounded bg-[#B88AF8] text-[#1A1B1E] font-semibold hover:opacity-90 transition-all duration-200 mt-8"
            >
              Make Another Deposit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center w-full">
            <div className="w-full max-w-[280px] md:max-w-[580px]">
              <div className="flex flex-col gap-6">
                {/* Back Arrow - positioned above Exchange Rate */}
                <div className="w-full flex justify-start">
                  <button
                    onClick={onBack}
                    className="flex items-center justify-center w-8 h-8 bg-[#121420] hover:bg-[#1A1B1E] rounded border border-[rgba(255,255,255,0.05)] hover:border-[#B88AF8] transition-all duration-200 group"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#9C9DA2] group-hover:text-[#B88AF8] transition-colors duration-200"
                    >
                      <path
                        d="M19 12H5M12 19L5 12L12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <ExchangeRate
                  selectedAssetOption={selectedAssetOption}
                  targetChain={targetChain}
                  strategyConfig={strategyConfig}
                />

                {/* Two Cards Row */}
                <div className="flex flex-col gap-6 md:flex-row justify-center items-start">
                  <div className="flex flex-col justify-center items-center w-full">
                    {/* Deposit Chain Dropdown */}
                    <div className="w-full max-w-[280px] bg-[#121420] p-4 border-l border-r border-t border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[#9C9DA2] font-inter text-[12px] whitespace-nowrap flex items-center gap-1">
                          Deposit Network
                          <Tooltip
                            content="Select the network you'll be depositing funds from."
                            side="bottom"
                            sideOffset={12}
                          >
                            <div>
                              <InfoIcon />
                            </div>
                          </Tooltip>
                        </label>
                        <div className="relative w-fit">
                          <button
                            onClick={() =>
                              setIsChainDropdownOpen(!isChainDropdownOpen)
                            }
                            className="flex items-center w-fit bg-[#1e202c] text-[#EDF2F8] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88AF8] pr-3 mr-[10px] gap-1"
                          >
                            <div className="flex items-center gap-2">
                              {targetChain && (
                                <img
                                  src={
                                    getUniqueChainConfigs.find(
                                      (c) => c.network === targetChain
                                    )?.image || ""
                                  }
                                  alt={targetChain} // Use network name for alt text
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span className="capitalize text-[12px] whitespace-nowrap">
                                {getUniqueChainConfigs.find(
                                  (c) => c.network === targetChain
                                )?.name || targetChain}
                              </span>
                            </div>
                            <div className="w-[12px] flex-shrink-0"></div>
                            <svg
                              className={`w-4 h-4 transform transition-transform duration-200 ${
                                isChainDropdownOpen ? "rotate-180" : "rotate-0"
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
                          {isChainDropdownOpen && (
                            <div className="absolute z-10 w-full mt-2 bg-[#1F202D] rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[120px]">
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
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Left Card - Deposit Input */}
                    <div className="w-full max-w-[280px] h-[270px] bg-[#0D101C] border-l border-r border-b border-[rgba(255,255,255,0.05)] px-6 pt-6 pb-4 flex flex-col">
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center mt-[8px]">
                          <img
                            src={
                              selectedAssetOption?.image ||
                              "/images/icons/default_assest.svg"
                            }
                            alt={selectedAssetOption?.name || "Default Asset"}
                            className={`w-[56px] h-[56px] ${
                              !selectedAssetOption ? "opacity-15" : ""
                            }`}
                          />
                          <button
                            onClick={() => setIsAssetPopupOpen(true)}
                            className="text-[#EDF2F8] text-center text-[14px] font-semibold leading-normal mt-[8px] hover:text-[#B88AF8] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            {selectedAssetOption
                              ? `Deposit ${selectedAssetOption.name}`
                              : "Choose Asset to Deposit"}
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 9L12 15L18 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <div className="relative group">
                            <span className="text-[#00D1A0] text-center text-[12px] font-normal leading-normal blur-[2px] transition-all duration-300">
                              +0.00 in 1 year
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Input Section */}
                      <div className="mt-8">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 border-b border-[rgba(255,255,255,0.1)] pb-2">
                            <input
                              type="text"
                              value={amount}
                              onChange={handleAmountChange}
                              placeholder="0.00"
                              className="w-full bg-transparent text-[#EDF2F8] text-[24px] font-bold leading-normal outline-none focus:ring-0 border-0"
                            />
                          </div>
                          <button
                            onClick={handleMaxClick}
                            className="text-[#9C9DA2] text-[12px] font-normal hover:text-[#B88AF8] transition-all duration-200 border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 hover:border-[#B88AF8]"
                          >
                            MAX
                          </button>
                        </div>
                        <div className="text-[#9C9DA2] text-[12px] font-normal">
                          Balance: {isLoadingBalance ? "Loading..." : balance}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second Card Container */}
                  <div className="flex flex-col justify-center items-center w-full">
                    {/* Destination Network Dropdown */}
                    <div className="w-full max-w-[280px] bg-[#121420] p-4 border-l border-r border-t border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[#9C9DA2] font-inter text-[12px] whitespace-nowrap flex items-center gap-1">
                          Destination Network
                          <Tooltip
                            content={`This is the network where you'll receive your ${(strategyConfig as any)?.name || (strategyConfig as any)?.displayName || "syUSD"} vault tokens`}
                            side="bottom"
                          >
                            <div>
                              <InfoIcon />
                            </div>
                          </Tooltip>
                        </label>
                        <div className="relative w-fit">
                          <div className="flex items-center justify-between w-fit bg-[#1e202c] text-[#EDF2F8] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88AF8] pr-2">
                            <div className="flex items-center gap-2">
                              {strategyConfig.network && (() => {
                                // Get the network name in lowercase to match the chain config
                                const networkName = strategyConfig.network.toLowerCase();
                                // Find the matching chain config
                                const chainConfig = getUniqueChainConfigs.find(
                                  (c) => c.network === networkName || 
                                         c.name.toLowerCase() === networkName
                                );
                                // Fallback to getting image from strategy config directly
                                const networkImage = chainConfig?.image || 
                                  (networkName === "arbitrum" && (strategyConfig as any).arbitrum?.image) ||
                                  (networkName === "base" && (strategyConfig as any).base?.image) ||
                                  (networkName === "ethereum" && (strategyConfig as any).ethereum?.image) ||
                                  (networkName === "katana" && (strategyConfig as any).katana?.image) ||
                                  (networkName === "hyperEVM" && (strategyConfig as any).hyperEVM?.image) ||
                                  "";
                                
                                return (
                                  <img
                                    src={networkImage}
                                    alt={strategyConfig.network}
                                    className="w-5 h-5 rounded-full"
                                  />
                                );
                              })()}
                              <span className="capitalize text-[12px]">
                                {strategyConfig.network}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Right Card - Strategy Info */}
                    <div className="w-full max-w-[280px] h-[270px] bg-[#0D101C] border-l border-r border-b border-[rgba(255,255,255,0.05)] px-6 pt-6 pb-4 relative flex flex-col">
                      <div className="flex flex-col items-center text-center h-full">
                        <img
                          src={(strategyConfig as any)?.image || `/images/icons/${selectedAsset.toLowerCase()}-${strategy}.svg`}
                          alt={(strategyConfig as any)?.name || strategy}
                          className="w-[56px] h-[56px] cursor-pointer hover:opacity-80 transition-all duration-200 mb-3"
                          onClick={onReset}
                        />
                        <div className="flex flex-col items-center flex-1 justify-start">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center">
                              <div className="text-white font-semibold capitalize flex items-center gap-[10px]">
                                {(strategyConfig as any)?.displayName || (strategyConfig as any)?.name || (selectedAsset === "BTC" ? "Stable BTC" : selectedAsset === "ETH" ? "Stable ETH" : `${strategy} ${selectedAsset}`)}
                                <button
                                  onClick={onBack}
                                  className="text-[#9C9DA2] hover:text-[#B88AF8] transition-all duration-200 cursor-pointer"
                                >
                                  <svg
                                    width="5"
                                    height="10"
                                    viewBox="0 0 5 10"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0.5 9L4.5 5L0.5 1"
                                      stroke="#9C9DA2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-[4px] justify-center">
                              <span className="text-[#9C9DA2]   text-[12px] font-normal leading-normal">
                                {formatDuration(duration)}
                              </span>
                              <svg
                                width="4"
                                height="3"
                                viewBox="0 0 4 3"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect
                                  x="0.5"
                                  width="3"
                                  height="3"
                                  rx="1.5"
                                  fill="white"
                                  fill-opacity="0.5"
                                />
                              </svg>

                              <span className="text-[#9C9DA2]   text-[12px] font-normal leading-normal">
                                APY {actualApy}
                              </span>
                            </div>
                          </div>
                          <div className="mt-8">
                            <div className="text-[#D7E3EF] text-[24px] font-bold leading-normal">
                              {sharesToReceive
                                ? selectedAsset === "BTC" || selectedAsset === "ETH"
                                  ? Number(sharesToReceive).toFixed(7)
                                  : Number(sharesToReceive).toFixed(2)
                                : selectedAsset === "BTC" || selectedAsset === "ETH"
                                ? "0.0000000"
                                : "0.00"}
                            </div>
                            <div className="text-[#9C9DA2] text-[12px] font-normal leading-normal">
                              (${usdValue} USD)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button Section - Below the cards */}
                <div className="w-full flex flex-col gap-4">
                  {/* Dynamic Connect/Deposit Button */}
                  {/* Check if targetChain matches the strategy's native network */}
                  {targetChain !== strategyConfig.network.toLowerCase() && 
                   targetChain.toLowerCase() !== strategyConfig.network.toLowerCase() && (
                    <div className="w-full mt-4 mb-2 p-4 rounded bg-[#2B2320] border border-[#B88AF8]/20 text-[#FFD580] text-sm">
                      <b>Note: </b>
                      In the Portfolio section, deposits from non-
                      <b>{strategyConfig.network}</b> networks may take 5–60
                      minutes to appear. Delay is due to bridge processing and
                      network congestion.
                    </div>
                  )}
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openConnectModal,
                      mounted,
                      authenticationStatus,
                    }) => {
                      const ready =
                        mounted && authenticationStatus !== "loading";
                      const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                          authenticationStatus === "authenticated");

                      const isLoading =
                        approveIsPending ||
                        depositIsPending ||
                        isWaitingForApproval ||
                        isWaitingForDeposit ||
                        isDepositing ||
                        isApproving ||
                        (isLoadingBalance && !isApproved); // Only include balance loading if not approved

                      const hasInsufficientFunds =
                        connected &&
                        amount &&
                        rawBalance &&
                        Number(amount) > Number(rawBalance);

                      const shouldDisable =
                        connected &&
                        !isDepositSuccessLocal && // Allow button to be enabled when showing "Request Another Deposit"
                        (isLoading ||
                          isLoadingBalance ||
                          hasInsufficientFunds ||
                          !amount ||
                          Number(amount) === 0);

                      const buttonText = connected
                        ? !amount || Number(amount) === 0
                          ? "Enter Amount"
                          : hasInsufficientFunds
                          ? "Insufficient Funds"
                          : isWaitingForApproval
                          ? "Waiting for Approval..."
                          : isApproving
                          ? "Approving..."
                          : isWaitingForDeposit
                          ? "Waiting for Confirmation..."
                          : isDepositing
                          ? "Transaction in Progress"
                          : isDepositSuccessLocal
                          ? "Request Another Deposit"
                          : isApproved && !isLoading
                          ? "Approval Done - Click to Deposit"
                          : "Deposit"
                        : "Connect Wallet";

                      const isInactiveState =
                        !isDepositSuccessLocal && // Allow button to be active when showing "Request Another Deposit"
                        (connected &&
                          (hasInsufficientFunds ||
                            !amount ||
                            Number(amount) === 0)) ||
                        shouldDisable;

                      return (
                        <button
                          onClick={
                            connected
                              ? isDepositSuccessLocal
                                ? () => {
                                    // Reset state for another deposit
                                    setTransactionHash(null);
                                    setTransactionChain(null);
                                    setApprovalHash(null);
                                    setApprovalChain(null);
                                    setIsDepositSuccessLocal(false);
                                    setDepositSuccess(false);
                                    setErrorMessage(null);
                                    setIsApproved(false);
                                    setIsApproving(false);
                                    setIsDepositing(false);
                                    setIsWaitingForSignature(false);
                                    setAmount("");
                                    // Refresh allowance check for new deposit
                                    refetchAllowance();
                                  }
                                : !hasInsufficientFunds &&
                                  amount &&
                                  Number(amount) > 0
                                ? handleDeposit
                                : undefined
                              : openConnectModal
                          }
                          disabled={isDepositSuccessLocal ? false : shouldDisable}
                          className={`w-full py-4 mt-6 mb-8 sm:mb-0 rounded font-semibold transition-all duration-200 ${
                            isDepositSuccessLocal || !isInactiveState
                              ? "bg-[#B88AF8] text-[#1A1B1E] hover:opacity-90"
                              : "bg-gray-500 text-white opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {buttonText}
                        </button>
                      );
                    }}
                  </ConnectButton.Custom>

                  {errorMessage && (
                    <div
                      className="mt-2 text-red-500 text-center"
                      style={{
                        borderRadius: "4px",
                        background: "rgba(248, 90, 62, 0.10)",
                        padding: "12px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {errorMessage}
                      {transactionHash && (
                        <a
                          href={getExplorerUrl(transactionChain || targetChain, transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {transactionHash.slice(0, 6)}...
                          {transactionHash.slice(-4)}
                        </a>
                      )}
                    </div>
                  )}
                  {!errorMessage &&
                    transactionHash &&
                    isDepositSuccessLocal && (
                      <div className="flex justify-between items-center mt-4 bg-[rgba(0,209,160,0.1)] rounded-[4px] p-4">
                        <div className="text-[#00D1A0] text-[14px]">
                          Transaction Successful
                        </div>
                        <a
                          href={getExplorerUrl(transactionChain || targetChain, transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00D1A0] text-[14px] underline hover:text-[#00D1A0]/80"
                        >
                          #{transactionHash.substring(0, 8)}...
                        </a>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Asset Selection Popup */}
        {isAssetPopupOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAssetPopupOpen(false)}
          >
            <div
              className="bg-[#080B17] rounded-lg p-6 w-full max-w-[400px] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#EDF2F8] text-lg font-semibold">
                  Select Asset
                </h3>
                <button
                  onClick={() => setIsAssetPopupOpen(false)}
                  className="text-[#9C9DA2] hover:text-[#EDF2F8] transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {assetOptions.map((asset: TokenConfig, idx: number) => (
                  <button
                    key={asset.contract}
                    onClick={() => {
                      setSelectedAssetIdx(idx);
                      setIsAssetPopupOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                      selectedAssetIdx === idx
                        ? "bg-[#B88AF8]/10 border-[#B88AF8] text-[#B88AF8]"
                        : "bg-[#0D101C] border-[rgba(255,255,255,0.1)] text-[#EDF2F8] hover:bg-[#1A1B1E] hover:border-[rgba(255,255,255,0.2)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {asset.image && (
                        <img
                          src={asset.image}
                          alt={asset.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#9C9DA2]">
                        {isLoadingAssetBalances ? (
                          <div className="flex items-center gap-1">
                            <svg
                              className="animate-spin h-3 w-3 text-white"
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
                          </div>
                        ) : (
                          // For BTC and ETH assets, show balance without $ prefix; for others, show USD value
                          asset.name === "eBTC" || asset.name === "wBTC" || asset.name === "WETH"
                            ? `${assetBalances[asset.name] || "0.000000"}`
                            : `$${assetBalances[asset.name] || "0.00"}`
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DepositView;
