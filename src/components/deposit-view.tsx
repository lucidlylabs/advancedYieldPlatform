import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
  useTransaction,
  useReadContracts,
  useSwitchChain,
} from "wagmi";
import { USD_STRATEGIES, BTC_STRATEGIES, ETH_STRATEGIES } from "../config/env";
import {
  parseEther,
  type Address,
  formatUnits,
  createPublicClient,
  http,
  parseUnits,
} from "viem";

type DurationType = "30_DAYS" | "60_DAYS" | "180_DAYS" | "PERPETUAL_DURATION";
type StrategyType = "STABLE" | "INCENTIVE";

interface StrategyConfig {
  network: string;
  contract: string;
  deposit_token: string;
  deposit_contract: string;
  deposit_token_contract?: string; // Optional field for backward compatibility
  deposit_token_image?: string; // Optional field for deposit token image
  deposit_token_decimal?: number; // Optional field for deposit token decimal
  // Add support for multiple deposit tokens
  deposit_token_2?: string;
  deposit_token_contract_2?: string;
  deposit_token_image_2?: string;
  deposit_token_2_decimal?: number;
  deposit_token_3?: string;
  deposit_token_contract_3?: string;
  deposit_token_image_3?: string;
  deposit_token_3_decimal?: number;
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc?: string; // Optional field for backward compatibility
  show_cap: boolean;
  filled_cap: string;
  cap_limit: string;
  boringVaultAddress?: string; // Optional field for boring vault address
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
  strategy: "stable" | "incentive";
  apy: string;
  onBack: () => void;
  onReset: () => void;
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

const formatDuration = (duration: string) => {
  if (duration === "PERPETUAL_DURATION") return "Perpetual";
  const [number, period] = duration.split("_");
  return `${number} ${period.toLowerCase()}`;
};

const DepositView: React.FC<DepositViewProps> = ({
  selectedAsset,
  duration,
  strategy,
  apy,
  onBack,
  onReset,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.03");
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isWaitingForSignature, setIsWaitingForSignature] = useState(false);
  const [status, setStatus] = useState<
    | "loading"
    | "waitingForSignature"
    | "processing"
    | "approved"
    | "depositing"
    | "idle"
  >("idle");
  const [isMultiChain, setIsMultiChain] = useState<boolean>(false);
  const [bridgeFee, setBridgeFee] = useState<string>("0");
  const [isLoadingFee, setIsLoadingFee] = useState<boolean>(false);
  const [targetChain, setTargetChain] = useState<string>("arbitrum"); // Default target chain
  const { switchChain } = useSwitchChain();

  // Get strategy config based on asset type
  const strategyConfigs = {
    USD: USD_STRATEGIES,
    BTC: BTC_STRATEGIES,
    ETH: ETH_STRATEGIES,
  };

  // Explicitly access the strategies for the selected asset first
  const assetStrategies =
    strategyConfigs[selectedAsset as keyof typeof strategyConfigs];

  // Now access the specific duration and strategy type
  const strategyConfig = (assetStrategies as any)[duration][ // Cast assetStrategies to any for indexing
    strategy === "stable" ? "STABLE" : "INCENTIVE"
  ] as StrategyConfig;

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

  // Get deposit token name, image, and decimals (only if defined in config)
  const depositToken = strategyConfig.deposit_token;
  const depositTokenImage = strategyConfig.deposit_token_image;
  const depositTokenDecimals = strategyConfig.deposit_token_decimal || 6;

  // USDC token contract for approvals
  const tokenContractAddress =
    strategyConfig.deposit_token_contract || strategyConfig.deposit_contract;
  // Vault contract for deposits
  const vaultContractAddress = strategyConfig.contract;

  console.log("Contract Addresses:", {
    tokenContract: tokenContractAddress,
    vaultContract: vaultContractAddress,
    strategy: strategyConfig,
  });

  // Approve token for vault
  const { writeContractAsync: approve, data: approveData } = useWriteContract();

  // Check allowance against vault contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenContractAddress as Address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as Address, strategyConfig.boringVaultAddress as Address],
  });

  console.log("Allowance check details:", {
    tokenContract: tokenContractAddress,
    userAddress: address,
    boringVault: strategyConfig.boringVaultAddress,
    allowance: allowance?.toString(),
    hasAllowance: !!allowance,
    amount: amount ? parseUnits(amount, depositTokenDecimals).toString() : "0",
    needsApproval: amount
      ? BigInt(allowance?.toString() || "0") <
        parseUnits(amount, depositTokenDecimals)
      : false,
    currentAllowanceFormatted: allowance
      ? formatUnits(BigInt(allowance.toString()), depositTokenDecimals)
      : "0",
    requestedAmountFormatted: amount || "0",
  });

  // Watch approve transaction
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
    useTransaction({
      hash: approvalHash || undefined,
    });

  // Deposit into vault
  const { writeContractAsync: deposit, data: depositData } = useWriteContract();

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
        const client = createPublicClient({
          transport: http(strategyConfig.rpc || "https://base.llamarpc.com"),
          chain: {
            id: 8453,
            name: "Base",
            network: "base",
            nativeCurrency: {
              decimals: 18,
              name: "Ethereum",
              symbol: "ETH",
            },
            rpcUrls: {
              default: {
                http: [strategyConfig.rpc || "https://base.llamarpc.com"],
              },
              public: {
                http: [strategyConfig.rpc || "https://base.llamarpc.com"],
              },
            },
          },
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
  }, [tokenContractAddress, address, strategyConfig.rpc]);

  // Watch for approval success and update allowance
  useEffect(() => {
    if (isApprovalSuccess && approvalHash) {
      console.log("Approval successful, updating allowance...");
      refetchAllowance();
      setIsApproving(false);
      setIsApproved(true);
      // Automatically trigger deposit after approval
      handleDeposit();
    }
  }, [isApprovalSuccess, approvalHash, refetchAllowance]);

  // Reset loading states when transactions complete and refresh balance
  useEffect(() => {
    if (!isWaitingForApproval && isApproving) {
      if (isApprovalSuccess) {
        setIsApproved(true);
        setIsApproving(false);
        // Automatically trigger deposit after approval
        handleDeposit();
      } else {
        setIsApproving(false);
      }
    }
  }, [isWaitingForApproval, isApproving, isApprovalSuccess]);

  useEffect(() => {
    if (!isWaitingForDeposit && isDepositing) {
      setIsDepositing(false);
      setIsApproved(false);
      fetchBalance();
    }
  }, [isWaitingForDeposit, isDepositing]);

  // Watch for deposit success
  useEffect(() => {
    if (isDepositSuccess && transactionHash) {
      setDepositSuccess(true);
      console.log("Deposit successful!", {
        hash: transactionHash,
        amount,
        token: depositToken,
      });
    }
  }, [isDepositSuccess, transactionHash, amount, depositToken]);

  useEffect(() => {
    const checkApproval = async () => {
      setIsCheckingApproval(true);
      try {
        // Perform the approval check logic here
        // Ensure this doesn't set isApproving to true
      } catch (error) {
        console.error("Error checking approval:", error);
      } finally {
        setIsCheckingApproval(false);
      }
    };

    checkApproval();
  }, []);

  useEffect(() => {
    console.log("isDepositing changed:", isDepositing);
  }, [isDepositing]);

  useEffect(() => {
    console.log("isWaitingForDeposit changed:", isWaitingForDeposit);
  }, [isWaitingForDeposit]);

  useEffect(() => {
    if (isLoadingBalance) {
      setStatus("loading");
    } else if (isWaitingForSignature) {
      setStatus("waitingForSignature");
    } else if (isApproving && (!isApprovalSuccess || isWaitingForApproval)) {
      setStatus("processing");
    } else if (isApproved && !isDepositing && !isWaitingForDeposit) {
      setStatus("approved");
    } else if (isDepositing && isWaitingForDeposit) {
      setStatus("depositing");
    } else {
      setStatus("idle");
    }
  }, [
    isLoadingBalance,
    isWaitingForSignature,
    isApproving,
    isApprovalSuccess,
    isApproved,
    isDepositing,
    isWaitingForDeposit,
  ]);

  useEffect(() => {
    console.log("Status changed:", status);
  }, [status]);

  // Add preview fee function
  const previewBridgeFee = async (amount: bigint) => {
    if (!address || !amount || !isMultiChain) return;

    setIsLoadingFee(true);
    try {
      const client = createPublicClient({
        transport: http(strategyConfig.rpc || "https://base.llamarpc.com"),
        chain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: {
            decimals: 18,
            name: "Ethereum",
            symbol: "ETH",
          },
          rpcUrls: {
            default: {
              http: [strategyConfig.rpc || "https://base.llamarpc.com"],
            },
            public: {
              http: [strategyConfig.rpc || "https://base.llamarpc.com"],
            },
          },
        },
      });

      // Get bridge wildcard based on target chain
      const bridgeWildCard = getBridgeWildCard(targetChain);

      // Convert amount to uint96 for previewFee
      const shareAmount = amount as unknown as bigint;

      // Call previewFee function with exact parameters from your example
      const fee = await client.readContract({
        address: vaultContractAddress as Address,
        abi: VAULT_ABI,
        functionName: "previewFee",
        args: [
          shareAmount, // shareAmount (uint96)
          address as Address, // to address
          bridgeWildCard, // bridgeWildCard bytes
          "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // feeToken (ETH address)
        ],
      });

      console.log("Bridge fee calculation:", {
        shareAmount: shareAmount.toString(),
        to: address,
        bridgeWildCard,
        feeToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        calculatedFee: fee.toString(),
      });

      setBridgeFee(formatUnits(fee as bigint, 18));
    } catch (error) {
      console.error("Error previewing bridge fee:", error);
      setBridgeFee("0");
    } finally {
      setIsLoadingFee(false);
    }
  };

  // Helper function to get bridge wildcard
  const getBridgeWildCard = (chain: string): `0x${string}` => {
    switch (chain) {
      case "arbitrum":
        return "0x000000000000000000000000000000000000000000000000000000000000759e";
      case "optimism":
        return "0x000000000000000000000000000000000000000000000000000000000000759f";
      case "ethereum":
        return "0x000000000000000000000000000000000000000000000000000000000000759d";
      default:
        return "0x000000000000000000000000000000000000000000000000000000000000759e";
    }
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
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error("Invalid amount");
      }

      const roundedAmount =
        Math.round(amountFloat * Math.pow(10, depositTokenDecimals)) /
        Math.pow(10, depositTokenDecimals);
      const amountInWei = parseUnits(
        roundedAmount.toFixed(depositTokenDecimals),
        depositTokenDecimals
      );

      // First approve USDS for the boring vault
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

      // Step 1: Approve USDS for boring vault if needed
      if (needsApproval && !isApproved && !isApproving) {
        console.log("Calling approve function...");
        setIsApproving(true);
        try {
          const approveTx = await approve({
            address: tokenContractAddress as Address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [boringVaultAddress as Address, amountInWei],
            chainId: 8453,
            account: address as Address,
          });

          if (typeof approveTx === "string" && approveTx.startsWith("0x")) {
            setApprovalHash(approveTx as `0x${string}`);
          }
        } catch (error: any) {
          console.error("Approval transaction failed:", error);
          setIsApproving(false);
          setErrorMessage(error.message || "Approval failed");
        }
        setIsWaitingForSignature(false);
        return;
      }

      // If we're already approving, don't proceed with deposit
      if (isApproving) {
        setIsWaitingForSignature(false);
        return;
      }

      // Only proceed with deposit if we have sufficient allowance
      if (!needsApproval || isApproved) {
        setIsDepositing(true);

        // Calculate minimum mint amount based on slippage
        const slippageAmount =
          (amountInWei * BigInt(Math.floor(parseFloat(slippage) * 10000))) /
          BigInt(10000);
        // const minimumMint = amountInWei - slippageAmount;
        const minimumMint = amountInWei - slippageAmount;

        if (isMultiChain) {
          // Preview bridge fee before proceeding
          await previewBridgeFee(amountInWei);

          // Get bridge wildcard
          const bridgeWildCard = getBridgeWildCard(targetChain);

          // Convert bridge fee to wei
          const bridgeFeeWei = parseEther(bridgeFee);

          // Proceed with multi-chain deposit
          console.log("Sending multi-chain deposit transaction:", {
            contract: vaultContractAddress,
            token: tokenContractAddress,
            amount: amountInWei.toString(),
            minimumMint: "0", // Set minimumMint to 0 for multi-chain
            bridgeWildCard,
            bridgeFee: bridgeFeeWei.toString(),
          });

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
            chainId: 8453,
            account: address as Address,
            value: bridgeFeeWei, // Include the calculated bridge fee in ETH
          });

          if (tx && typeof tx === "string" && tx.startsWith("0x")) {
            setTransactionHash(tx as `0x${string}`);
          }
        } else {
          // Regular single-chain deposit
          console.log("Sending deposit transaction:", {
            contract: vaultContractAddress,
            token: tokenContractAddress,
            amount: amountInWei.toString(),
            minimumMint: minimumMint.toString(),
          });

          const tx = await deposit({
            address: vaultContractAddress as Address,
            abi: VAULT_ABI,
            functionName: "deposit",
            args: [tokenContractAddress as Address, amountInWei, minimumMint],
            chainId: 8453,
            account: address as Address,
          });

          if (tx && typeof tx === "string" && tx.startsWith("0x")) {
            setTransactionHash(tx as `0x${string}`);
          }
        }
      } else {
        console.log("Insufficient allowance, approval needed first");
        setErrorMessage("Please approve the token spending first");
      }
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setIsApproving(false);
      setIsDepositing(false);
      setErrorMessage(error.message || "Transaction failed");
    } finally {
      setIsWaitingForSignature(false);
    }
  };

  // Add effect to preview fee when amount changes
  useEffect(() => {
    if (isMultiChain && amount) {
      const amountInWei = parseUnits(amount, depositTokenDecimals);
      previewBridgeFee(amountInWei);
    }
  }, [amount, isMultiChain, targetChain]);

  const fetchBalance = async () => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      const tokenContractAddress = selectedAssetOption.contract as Address;
      const decimals = Number(selectedAssetOption.decimals);
      const rpcUrl = "https://base.llamarpc.com";

      const client = createPublicClient({
        transport: http(rpcUrl),
        chain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: {
            decimals: 18,
            name: "Ethereum",
            symbol: "ETH",
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
          },
        },
      });

      const balanceResult = await client.readContract({
        address: tokenContractAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      });

      const formattedBalance = Number(formatUnits(balanceResult as bigint, decimals)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // --- Asset selection state ---
  // Parse all available deposit assets from strategyConfig
  const assetOptions = useMemo(() => {
    const options = [];
    if (strategyConfig.deposit_token && strategyConfig.deposit_token_contract) {
      options.push({
        name: strategyConfig.deposit_token,
        contract: strategyConfig.deposit_token_contract,
        image: strategyConfig.deposit_token_image,
        decimals: strategyConfig.deposit_token_decimal,
      });
    }
    if (
      strategyConfig.deposit_token_2 &&
      strategyConfig.deposit_token_contract_2
    ) {
      options.push({
        name: strategyConfig.deposit_token_2,
        contract: strategyConfig.deposit_token_contract_2,
        image: strategyConfig.deposit_token_image_2,
        decimals: strategyConfig.deposit_token_2_decimal,
      });
    }
    if (
      strategyConfig.deposit_token_3 &&
      strategyConfig.deposit_token_contract_3
    ) {
      options.push({
        name: strategyConfig.deposit_token_3,
        contract: strategyConfig.deposit_token_contract_3,
        image: strategyConfig.deposit_token_image_3,
        decimals: strategyConfig.deposit_token_3_decimal,
      });
    }
    return options;
  }, [strategyConfig]);

  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  const selectedAssetOption = assetOptions[selectedAssetIdx] || assetOptions[0];

  // Add effect to switch network when target chain changes
  useEffect(() => {
    if (switchChain) {
      if (isMultiChain && targetChain) {
        const chainId = getChainId(targetChain);
        if (chainId) {
          switchChain({ chainId });
        }
      } else if (!isMultiChain) {
        // Always switch to Base when multi-chain is off
        switchChain({ chainId: 8453 });
      }
    }
  }, [targetChain, isMultiChain, switchChain]);

  // Helper function to get chain ID
  const getChainId = (chain: string): number | undefined => {
    switch (chain) {
      case "arbitrum":
        return 42161;
      case "optimism":
        return 10;
      case "ethereum":
        return 1;
      default:
        return undefined;
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, selectedAssetIdx, selectedAsset, duration, strategy]);

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      // Only allow numbers and one decimal point
      setAmount(value);
    }
  };

  return (
    <div className="h-[calc(100vh-128px)] relative overflow-hidden">
      {depositSuccess ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-[580px] bg-[#0D101C] rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#00D1A0] rounded-full flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-[#D7E3EF] text-2xl font-semibold mb-2">
              Deposit Success
            </h2>
            <p className="text-[#9C9DA2] mb-6">
              Your deposit has been successfully processed
            </p>
            <div className="bg-[#121521] rounded p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#9C9DA2]">Transaction Hash</span>
                <a
                  href={`https://basescan.org/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B88AF8] hover:underline flex items-center gap-1"
                >
                  {`${transactionHash?.slice(0, 6)}...${transactionHash?.slice(
                    -4
                  )}`}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9C9DA2]">Amount</span>
                <span className="text-[#D7E3EF]">
                  {amount} {selectedAssetOption.name}
                </span>
              </div>
            </div>
            <button
              onClick={onReset}
              className="w-full py-4 rounded bg-[#B88AF8] text-[#1A1B1E] font-semibold hover:opacity-90 transition-all duration-200"
            >
              Make Another Deposit
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 items-center pt-[calc(8vh+38px)]">
          <div className="w-[580px] h-[459px] flex-shrink-0">
            <div className="flex gap-6 justify-center items-center">
              {/* Left Card - Deposit Input */}
              <div className="w-[280px] h-[311px] bg-[#0D101C] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6 flex flex-col">
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center mt-[20px]">
                    {selectedAssetOption.image && (
                      <img
                        src={selectedAssetOption.image}
                        alt={selectedAssetOption.name}
                        className="w-[56px] h-[56px]"
                      />
                    )}
                    <span className="text-[#EDF2F8] text-center font-inter text-[14px] font-semibold leading-normal mt-[16px]">
                      Deposit {selectedAssetOption.name}
                    </span>
                    <span className="text-[#00D1A0] text-center font-inter text-[12px] font-normal leading-normal">
                      +0.00 in 1 year
                    </span>
                  </div>
                </div>
                {/* --- Asset Dropdown & Multi-chain Toggle --- */}
                {assetOptions.length > 1 && (
                  <div className="mt-4">
                    <label className="text-[#9C9DA2] font-inter text-[12px] block mb-2">
                      Select Asset
                    </label>
                    <select
                      value={selectedAssetIdx}
                      onChange={(e) =>
                        setSelectedAssetIdx(Number(e.target.value))
                      }
                      className="w-full bg-[#1A1B1E] text-[#EDF2F8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88AF8]"
                    >
                      {assetOptions.map((opt, idx) => (
                        <option value={idx} key={opt.contract}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Multi-chain Toggle (always shown) */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[#9C9DA2] font-inter text-[12px]">
                    Multi-chain Deposit
                  </span>
                  <button
                    onClick={() => setIsMultiChain(!isMultiChain)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isMultiChain ? "bg-[#B88AF8]" : "bg-[#1A1B1E]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isMultiChain ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {/* Target Chain Selection - Only shown when multi-chain is enabled */}
                {isMultiChain && (
                  <div className="mt-4">
                    <label className="text-[#9C9DA2] font-inter text-[12px] block mb-2">
                      Target Chain
                    </label>
                    <select
                      value={targetChain}
                      onChange={(e) => setTargetChain(e.target.value)}
                      className="w-full bg-[#1A1B1E] text-[#EDF2F8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88AF8]"
                    >
                      <option value="arbitrum">Arbitrum</option>

                      <option value="ethereum">Ethereum</option>
                    </select>
                  </div>
                )}
                {/* --- End Asset Dropdown & Multi-chain Toggle --- */}
                <div className="mt-auto flex flex-col gap-[1px]">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="w-[calc(100%-70px)] bg-transparent text-[#EDF2F8] font-inter text-[24px] font-bold leading-normal outline-none focus:ring-0 border-0 border-b border-[rgba(255,255,255,0.19)]"
                    />
                    <button
                      onClick={handleMaxClick}
                      className="absolute right-0 flex justify-center items-center px-[8px] py-[4px] gap-[10px] rounded-[4px] border border-[rgba(255,255,255,0.30)] bg-transparent hover:opacity-80 transition-all duration-200"
                    >
                      <span className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-normal">
                        MAX
                      </span>
                    </button>
                  </div>
                  <div className="mt-[12px]">
                    <span className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-normal">
                      Balance:{" "}
                      {isLoadingBalance ? (
                        <span className="inline-flex items-center gap-1">
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
                          <span className="text-white">Loading...</span>
                        </span>
                      ) : (
                        <span className="text-white">{balance}</span>
                      )}
                    </span>
                  </div>
                  {/* Bridge Fee Display */}
                  {isMultiChain && (
                    <div className="mt-[12px] flex flex-col gap-2">
                      <span className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-normal">
                        Bridge Fee:{" "}
                        {isLoadingFee ? (
                          <span className="inline-flex items-center gap-1">
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
                            <span className="text-white">Loading...</span>
                          </span>
                        ) : (
                          <span className="text-white">{bridgeFee} ETH</span>
                        )}
                      </span>
                      <div className="bg-[#1A1B1E] rounded p-2 border border-[#B88AF8]/20">
                        <div className="flex items-start gap-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#B88AF8] mt-0.5 flex-shrink-0"
                          >
                            <path
                              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-[#9C9DA2] font-inter text-[12px] leading-normal">
                            You need to have enough ETH in your wallet to cover
                            the bridge fee. The fee will be paid in ETH along
                            with your deposit.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Card - Strategy Info */}
              <div className="w-[280px] h-[311px] bg-[#0D101C] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6 relative flex flex-col">
                {/* Background gradient effect - top */}
                <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent rounded-t-[4px] pointer-events-none"></div>

                {/* Background blur effect - bottom */}
                <div className="absolute -bottom-[100px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-white/[0.05] blur-[25px] pointer-events-none"></div>

                {/* Asset Info */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <h3 className="text-[32px] text-[#D7E3EF] font-inter font-medium leading-normal mb-[8px] mt-[12px]">
                    {selectedAsset}
                  </h3>
                  <div
                    onClick={onReset}
                    className="text-[16px] text-[#9C9DA2] font-inter font-normal leading-normal underline decoration-solid underline-offset-auto mb-[25px] cursor-pointer hover:text-[#9C9DA2]/80 transition-all duration-200"
                  >
                    {formatDuration(duration)}
                  </div>
                  <div
                    onClick={onReset}
                    className="text-[#B88AF8] cursor-pointer font-inter text-[12px] font-light leading-normal hover:opacity-80 transition-all duration-200"
                  >
                    Change Asset →
                  </div>
                </div>

                {/* Strategy Info - Positioned at bottom */}
                <div className="mt-auto w-full p-3 bg-[#121521] rounded-[4px] border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                    <img
                      src={`/images/icons/${selectedAsset.toLowerCase()}-${strategy}.svg`}
                      alt={strategy}
                      className="w-[32px] h-[32px] ml-[4px] mr-[12px] my-auto cursor-pointer hover:opacity-80 transition-all duration-200"
                      onClick={onReset}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-semibold capitalize">
                          {strategy} {selectedAsset}
                        </div>
                        <img
                          src="/images/icons/select-icon.svg"
                          alt="select"
                          className="w-[16px] h-[16px] flex-shrink-0 cursor-pointer ml-auto hover:opacity-80 transition-all duration-200"
                          onClick={onBack}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-[4px]">
                        <span className="text-[#9C9DA2] font-inter text-[12px] font-normal leading-normal">
                          APY {apy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Cap Progress Bar - Only shown if show_cap is true */}
            {showDepositCap && (
              <div className="w-full mt-6 mb-4 p-4 rounded-[4px] bg-[rgba(255,255,255,0.02)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#EDF2F8] font-inter text-[14px] font-medium">
                    ${remainingSpace} Remaining
                  </span>
                  <span className="text-[#9C9DA2] font-inter text-[14px]">
                    Limited Space: ${depositCap.used}/${depositCap.total}
                  </span>
                </div>
                <div className="w-full h-[6px] bg-[#1A1B1E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A63D3] rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Connect/Deposit Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openConnectModal,
                mounted,
                authenticationStatus,
              }) => {
                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === "authenticated");

                const isLoading =
                  (isApproving && isWaitingForApproval) ||
                  (isDepositing && isWaitingForDeposit);

                const buttonText = connected
                  ? status === "loading"
                    ? "Loading..."
                    : status === "waitingForSignature"
                    ? "Waiting for Signature..."
                    : status === "processing"
                    ? "Processing..."
                    : status === "approved"
                    ? "Approval Done - Click to Deposit"
                    : status === "depositing"
                    ? "Depositing..."
                    : "Deposit"
                  : "Connect Wallet";

                return (
                  <button
                    onClick={connected ? handleDeposit : openConnectModal}
                    disabled={isLoading || isLoadingBalance}
                    className="w-full py-4 mt-6 rounded bg-[#B88AF8] text-[#1A1B1E] font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50"
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
                    href={`https://sonicscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {transactionHash.slice(0, 6)}...{transactionHash.slice(-4)}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositView;
