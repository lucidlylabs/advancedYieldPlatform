import React, { useState, useEffect } from "react";
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
} from "wagmi";
import { USD_STRATEGIES } from "../config/env";
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
  description: string;
  apy: string;
  incentives: string;
  tvl: string;
  rpc?: string; // Optional field for backward compatibility
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
] as const;

// Vault ABI for deposit
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
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
  const [number, period] = duration.split('_');
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
  const { address } = useAccount();

  // Get strategy config
  const strategyConfig = USD_STRATEGIES[
    duration as keyof typeof USD_STRATEGIES
  ][strategy === "stable" ? "STABLE" : "INCENTIVE"] as StrategyConfig;
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

  // Watch approve transaction
  const { isLoading: isWaitingForApproval } = useTransaction({
    hash: approveData,
  });

  // Deposit into vault
  const { writeContractAsync: deposit, data: depositData } = useWriteContract();

  // Watch deposit transaction
  const { isLoading: isWaitingForDeposit } = useTransaction({
    hash: depositData,
  });

  // Check allowance against vault contract
  const { data: allowance } = useReadContract({
    address: tokenContractAddress as Address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as Address, vaultContractAddress as Address],
  });

  console.log("Contract States:", {
    allowance: allowance?.toString(),
    approveData,
    depositData,
    isApproving,
    isWaitingForApproval,
    isDepositing,
    isWaitingForDeposit,
    tokenContract: tokenContractAddress,
    vaultContract: vaultContractAddress,
  });

  const handleDeposit = async () => {
    console.log("Deposit clicked", {
      address,
      amount,
      tokenContract: tokenContractAddress,
      vaultContract: vaultContractAddress,
      strategy,
      duration,
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
      // Convert amount to 6 decimals for USDC using parseUnits and ensure it's properly formatted
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error("Invalid amount");
      }

      // Round to 6 decimal places to avoid precision issues
      const roundedAmount = Math.round(amountFloat * 1_000_000) / 1_000_000;
      const amountInWei = parseUnits(roundedAmount.toFixed(6), 6);

      console.log("Amount conversion:", {
        original: amount,
        rounded: roundedAmount,
        inWei: amountInWei.toString(),
        hex: `0x${amountInWei.toString(16).padStart(64, "0")}`,
        decimals: 6,
      });

      // Check if approval is needed
      const currentAllowance = allowance
        ? BigInt(allowance.toString())
        : BigInt(0);
      console.log("Current Allowance:", currentAllowance.toString());

      if (currentAllowance < amountInWei) {
        console.log("Approval needed. Sending approve transaction...", {
          tokenContract: tokenContractAddress,
          spender: vaultContractAddress,
          amount: amountInWei.toString(),
          amountHex: `0x${amountInWei.toString(16)}`,
        });
        setIsApproving(true);
        await approve({
          address: tokenContractAddress as Address, // USDC contract for approval
          abi: ERC20_ABI,
          functionName: "approve",
          args: [vaultContractAddress as Address, amountInWei],
          chainId: 146, // Sonic network
        });
      } else {
        console.log("Sufficient allowance exists, proceeding with deposit", {
          vaultContract: vaultContractAddress,
          amount: amountInWei.toString(),
          amountHex: `0x${amountInWei.toString(16)}`,
          receiver: address,
        });
        setIsDepositing(true);

        // Create a public client to check balance before deposit
        const strategyConfig = USD_STRATEGIES[
          duration as keyof typeof USD_STRATEGIES
        ][strategy === "stable" ? "STABLE" : "INCENTIVE"] as StrategyConfig;
        const rpcUrl = strategyConfig.rpc || "https://rpc.soniclabs.com";

        const client = createPublicClient({
          transport: http(rpcUrl),
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
              default: { http: [rpcUrl] },
              public: { http: [rpcUrl] },
            },
          },
        });

        // Check token balance before deposit
        const balance = await client.readContract({
          address: tokenContractAddress as Address, // USDC contract for balance check
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        });

        console.log("Current token balance:", {
          balance: balance.toString(),
          required: amountInWei.toString(),
          balanceHex: `0x${balance.toString(16)}`,
          requiredHex: `0x${amountInWei.toString(16)}`,
        });

        if (balance < amountInWei) {
          throw new Error("Insufficient token balance for deposit");
        }

        // Check minimum deposit amount (if we can get it from the contract)
        try {
          const minDeposit = await client.readContract({
            address: vaultContractAddress as Address, // Vault contract for min deposit check
            abi: [
              ...VAULT_ABI,
              {
                name: "minDeposit",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [{ name: "", type: "uint256" }],
              },
            ],
            functionName: "minDeposit",
          });

          if (minDeposit && amountInWei < minDeposit) {
            throw new Error(
              `Minimum deposit amount is ${formatUnits(minDeposit, 6)} USDC`
            );
          }
        } catch (error) {
          console.log("Could not check minimum deposit amount:", error);
        }

        // Proceed with deposit using the vault contract
        console.log("Sending deposit transaction to vault contract:", {
          contract: vaultContractAddress,
          amount: amountInWei.toString(),
          receiver: address,
        });

        await deposit({
          address: vaultContractAddress as Address, // Using vault contract for deposit
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [amountInWei, address as Address],
          chainId: 146,
          account: address as Address,
        });
      }
    } catch (error: any) {
      console.error("Transaction failed:", {
        error,
        message: error.message,
        details: error.details,
        data: error.data,
        tokenContract: tokenContractAddress,
        vaultContract: vaultContractAddress,
      });
      setIsApproving(false);
      setIsDepositing(false);

      // Show user-friendly error message
      if (error.message.includes("insufficient")) {
        alert("Insufficient balance to complete the deposit");
      } else if (error.message.includes("reverted")) {
        alert(
          "Transaction failed. The amount might be below the minimum deposit requirement. Please try a larger amount."
        );
      } else if (error.message.includes("chain")) {
        alert("Please make sure you are connected to the Sonic network");
      } else if (error.message.includes("minimum deposit")) {
        alert(error.message);
      } else {
        alert("Failed to complete deposit. Please try again.");
      }
    }
  };

  const fetchBalance = async () => {
    if (!address || selectedAsset !== "USD") return;

    setIsLoadingBalance(true);
    try {
      const strategyConfig = USD_STRATEGIES[
        duration as keyof typeof USD_STRATEGIES
      ][strategy === "stable" ? "STABLE" : "INCENTIVE"] as StrategyConfig;

      // Use deposit_token_contract instead of deposit_contract
      const tokenContractAddress =
        strategyConfig.deposit_token_contract ||
        strategyConfig.deposit_contract;
      // Validate contract address
      if (
        !tokenContractAddress ||
        tokenContractAddress === "0x0000000000000000000000000000000000000000"
      ) {
        console.warn("Invalid token contract address for", duration, strategy);
        setBalance("0.00");
        return;
      }

      // Use the RPC from the strategy config or fallback to a default
      const rpcUrl = strategyConfig.rpc || "https://rpc.soniclabs.com";
      console.log("Using RPC:", rpcUrl);
      console.log("Token contract:", tokenContractAddress);

      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      const [balanceResult, decimalsResult] = await Promise.all([
        client.readContract({
          address: tokenContractAddress as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        }),
        client.readContract({
          address: tokenContractAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
      ]);

      const formattedBalance = formatUnits(
        balanceResult as bigint,
        decimalsResult as number
      );
      console.log("Balance fetched:", formattedBalance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Reset loading states when transactions complete and refresh balance
  useEffect(() => {
    if (!isWaitingForApproval) {
      setIsApproving(false);
      fetchBalance(); // Refresh balance after approval
    }
    if (!isWaitingForDeposit) {
      setIsDepositing(false);
      fetchBalance(); // Refresh balance after deposit
    }
  }, [isWaitingForApproval, isWaitingForDeposit]);

  // Initial balance fetch
  useEffect(() => {
    fetchBalance();
  }, [address, selectedAsset, duration, strategy]);

  const depositToken =
    selectedAsset === "USD"
      ? USD_STRATEGIES[duration as keyof typeof USD_STRATEGIES][
          strategy === "stable" ? "STABLE" : "INCENTIVE"
        ]["deposit_token"]
      : selectedAsset;

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

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSlippage(value);
    }
  };

  return (
    <div className="h-[calc(100vh-128px)] relative overflow-hidden">
      <div className="flex flex-col gap-6 items-center pt-[calc(8vh+38px)]">
        <div className="w-[580px] h-[459px] flex-shrink-0">
          <div className="flex gap-6 justify-center items-center">
            {/* Left Card - Deposit Input */}
            <div className="w-[280px] h-[311px] bg-[#0D101C] rounded-[4px] border border-[rgba(255,255,255,0.05)] p-6 flex flex-col">
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center mt-[20px]">
                  <img
                    src={`/images/icons/card-${selectedAsset.toLowerCase()}.svg`}
                    alt={selectedAsset}
                    className="w-[56px] h-[56px]"
                  />
                  <span className="text-[#EDF2F8] text-center font-inter text-[14px] font-semibold leading-normal mt-[16px]">
                    Deposit {depositToken}
                  </span>
                  <span className="text-[#00D1A0] text-center font-inter text-[12px] font-normal leading-normal">
                    +0.00 in 1 year
                  </span>
                </div>
              </div>

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
                    className="w-[32px] h-[32px] ml-[4px] mr-[12px] my-auto"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold capitalize">
                        {strategy} {selectedAsset}
                      </div>
                      <img
                        src="/images/icons/select-icon.svg"
                        alt="select"
                        className="w-[16px] h-[16px] flex-shrink-0 cursor-pointer ml-auto"
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
                isApproving ||
                isWaitingForApproval ||
                isDepositing ||
                isWaitingForDeposit;
              const buttonText =
                isApproving || isWaitingForApproval
                  ? "Approving..."
                  : isDepositing || isWaitingForDeposit
                  ? "Depositing..."
                  : connected
                  ? "Deposit"
                  : "Connect Wallet";

              return (
                <button
                  onClick={connected ? handleDeposit : openConnectModal}
                  disabled={isLoading}
                  className="w-full py-4 mt-6 rounded bg-[#B88AF8] text-[#1A1B1E] font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50"
                >
                  {buttonText}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  );
};

export default DepositView;
