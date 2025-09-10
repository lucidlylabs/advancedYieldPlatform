import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  formatUnits,
  createPublicClient,
  http,
  Address,
  parseUnits,
} from "viem";
import { base } from "wagmi/chains";
import { Header } from "../components/ui/header";
import { Navigation } from "../components/ui/navigation";
import { Tooltip } from "../components/ui/tooltip";
import { ERC20_ABI } from "../config/abi/erc20";
import { TELLER_WITH_LAYER_ZERO_ABI } from "../config/abi/TellerWithLayerZero";

interface Network {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const networks: Network[] = [
  {
    id: "base",
    name: "Base",
    icon: "/images/logo/base.svg",
    color: "bg-blue-500",
  },
  {
    id: "katana",
    name: "Katana",
    icon: "/images/logo/katana.svg",
    color: "bg-yellow-500",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "/images/logo/arb.svg",
    color: "bg-purple-500",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/images/logo/eth.svg",
    color: "bg-gray-500",
  },
];

// LayerZero Chain IDs (in hex format) for each network
const networkChainIDs: { [key: string]: string } = {
  base: "0x00000000000000000000000000000000000000000000000000000000000075e8", // Base Mainnet
  katana: "0x00000000000000000000000000000000000000000000000000000000000076a7", // Katana
  arbitrum:
    "0x000000000000000000000000000000000000000000000000000000000000759e", // Arbitrum One
  ethereum:
    "0x0000000000000000000000000000000000000000000000000000000000007595", // Ethereum Mainnet
};

// Function to get bridgeWildCard for a network
const getBridgeWildCard = (networkId: string): string => {
  const chainId = networkChainIDs[networkId.toLowerCase()];
  if (!chainId) {
    console.warn(`Unknown network ID: ${networkId}, using default`);
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
  console.log(`Bridge wildcard for ${networkId}: ${chainId}`);
  return chainId;
};

// Function to check if a destination chain is supported
const isDestinationChainSupported = (networkId: string): boolean => {
  // For now, we'll assume all chains in our mapping are potentially supported
  // In a real implementation, you might want to check against a whitelist
  // or make a contract call to verify chain support
  return networkChainIDs.hasOwnProperty(networkId.toLowerCase());
};

// InfoIcon component
const InfoIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-400"
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

const BridgePage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<string>("0.00");
  // Hardcode Base as source network
  const sourceNetwork = networks[0]; // Base as hardcoded source
  const [destinationNetwork, setDestinationNetwork] = useState<Network>(
    networks[1] // Katana as default destination
  );
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] =
    useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock transaction history data
  const [transactionHistory, setTransactionHistory] = useState([
    {
      id: 1,
      token: "syUSD",
      amount: "369.00",
      from: "Base",
      to: "Katana",
      time: "1 min",
      status: "Completed",
      txHash: "0x1234567890abcdef1234567890abcdef12345678",
    },
    {
      id: 2,
      token: "syETH",
      amount: "13,921.00",
      from: "Base",
      to: "Katana",
      time: "1 day ago",
      status: "Completed",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    },
    {
      id: 3,
      token: "syUSD",
      amount: "23,129.12",
      from: "Base",
      to: "Katana",
      time: "01st July'25",
      status: "Completed",
      txHash: "0x567890abcdef1234567890abcdef1234567890ab",
    },
    {
      id: 4,
      token: "SYBTC",
      amount: "21.00",
      from: "Base",
      to: "Katana",
      time: "12th June'25",
      status: "Completed",
      txHash: "0x90abcdef1234567890abcdef1234567890abcdef",
    },
    {
      id: 5,
      token: "syUSD",
      amount: "1,239.12",
      from: "Base",
      to: "Katana",
      time: "8th June'25",
      status: "Completed",
      txHash: "0xdef1234567890abcdef1234567890abcdef12345",
    },
  ]);

  // syUSD vault contract address on Base network (vault shares)
  const syUSDContractAddress =
    "0x279CAD277447965AF3d24a78197aad1B02a2c589" as `0x${string}`;
  const syUSDDecimals = 6;

  // TellerWithLayerZero bridge contract address
  const bridgeContractAddress =
    "0xaefc11908fF97c335D16bdf9F2Bf720817423825" as `0x${string}`;

  // Bridge state
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeFee, setBridgeFee] = useState<string>("0");

  // Fetch syUSD balance from Base network with RPC fallback
  const fetchSyUSDBalance = async () => {
    console.log("fetchSyUSDBalance called with:", { address, isConnected });

    if (!address || !isConnected) {
      console.log("No address or not connected, setting balance to 0.00");
      setBalance("0.00");
      return;
    }

    // RPC fallback URLs for Base network
    const baseRpcUrls = [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
      "https://base-mainnet.g.alchemy.com/v2/demo",
      "https://base.blockpi.network/v1/rpc/public",
    ];

    let lastError;

    for (const rpcUrl of baseRpcUrls) {
      try {
        console.log(`Trying RPC: ${rpcUrl}`);

        const client = createPublicClient({
          transport: http(rpcUrl),
          chain: base,
        });

        const balance = await client.readContract({
          address: syUSDContractAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        });

        const formattedBalance = Number(
          formatUnits(balance as bigint, syUSDDecimals)
        );

        console.log("syUSD Balance Debug:", {
          rawBalance: balance.toString(),
          rawBalanceBigInt: balance,
          formattedBalance,
          contractAddress: syUSDContractAddress,
          userAddress: address,
          rpcUrl,
          decimals: syUSDDecimals,
        });

        // Show full balance without decimal formatting
        const displayBalance = formattedBalance.toString();

        console.log("Setting balance to:", displayBalance);
        setBalance(displayBalance);
        return; // Success, exit the function
      } catch (error) {
        console.warn(`RPC ${rpcUrl} failed:`, error);
        lastError = error;
        continue; // Try next RPC
      }
    }

    // If all RPCs failed
    console.error("All RPC endpoints failed:", lastError);
    setBalance("0.00");
  };

  // Fetch balance when wallet connects or address changes
  useEffect(() => {
    console.log(
      "useEffect triggered - address:",
      address,
      "isConnected:",
      isConnected
    );
    fetchSyUSDBalance();
  }, [address, isConnected]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleMaxClick = () => {
    setAmount(balance.replace(/,/g, ""));
  };

  const handleDestinationNetworkSelect = (network: Network) => {
    setDestinationNetwork(network);
    setIsDestinationDropdownOpen(false);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Toggle transaction history
    setShowTransactionHistory(!showTransactionHistory);

    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Refresh balance
    await fetchSyUSDBalance();

    setIsRefreshing(false);
  };

  // Remove swap functionality since source is hardcoded to Base

  // Fetch bridge fee from contract
  const fetchBridgeFee = async () => {
    if (!address || !isConnected || parseFloat(amount) <= 0) {
      setBridgeFee("0");
      return BigInt(0);
    }

    try {
      const client = createPublicClient({
        transport: http("https://mainnet.base.org"),
        chain: base,
      });

      // Convert amount to proper units (shares) - amount is in 10^6 terms
      const shareAmount = parseUnits(amount, syUSDDecimals);
      // LayerZero bridge wildcard for the specific destination chain
      const bridgeWildCard = getBridgeWildCard(
        destinationNetwork.id
      ) as `0x${string}`;
      const feeToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH address for LayerZero

      const fee = await client.readContract({
        address: bridgeContractAddress,
        abi: TELLER_WITH_LAYER_ZERO_ABI,
        functionName: "previewFee",
        args: [
          BigInt(shareAmount.toString()) as bigint, // Ensure it's properly cast as uint96
          address as `0x${string}`, // to address (connected wallet)
          bridgeWildCard as `0x${string}`, // LayerZero bridge wildcard
          feeToken as `0x${string}`, // fee token address
        ],
      });

      const feeBigInt = fee as bigint;
      const formattedFee = formatUnits(feeBigInt, 18);
      setBridgeFee(formattedFee);

      return feeBigInt;
    } catch (error) {
      console.error("Error fetching bridge fee:", error);

      // Handle specific LayerZero chain errors
      if (error instanceof Error) {
        if (error.message.includes("LayerZeroTeller__MessagesNotAllowedTo")) {
          const chainId = error.message.match(/\((\d+)\)/)?.[1];
          const chainName = Object.keys(networkChainIDs).find((key) => {
            const hexChainId = networkChainIDs[key];
            const decimalChainId = parseInt(hexChainId.slice(-8), 16); // Extract last 8 hex chars and convert to decimal
            return decimalChainId === parseInt(chainId || "0");
          });
          setBridgeError(
            `Bridge to ${
              chainName || "this network"
            } is not currently supported. Please select a different destination network.`
          );
          setBridgeFee("0");
          return BigInt(0);
        }

        if (error.message.includes("LayerZeroTeller__MessagesNotAllowedFrom")) {
          setBridgeError(
            "Bridge from this network is not currently supported."
          );
          setBridgeFee("0");
          return BigInt(0);
        }
      }

      // Fallback for other errors
      setBridgeError("Unable to fetch bridge fee. Please try again.");
      setBridgeFee("0");
      return BigInt(0);
    }
  };

  // Fetch bridge fee when amount changes
  useEffect(() => {
    if (address && isConnected && parseFloat(amount) > 0) {
      fetchBridgeFee();
    } else {
      setBridgeFee("0");
    }
  }, [amount, address, isConnected]);

  // Bridge function using TellerWithLayerZero
  const handleBridge = async () => {
    if (!address || !isConnected || parseFloat(amount) <= 0) {
      return;
    }

    try {
      setIsBridging(true);
      setBridgeError(null);

      // Convert amount to proper units (shares) - amount is in 10^6 terms
      const shareAmount = parseUnits(amount, syUSDDecimals);

      // LayerZero bridge parameters
      const bridgeWildCard = getBridgeWildCard(
        destinationNetwork.id
      ) as `0x${string}`; // Dynamic bridge wildcard based on destination
      const feeToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH address for LayerZero

      // Fetch the actual bridge fee from contract
      const maxFee = await fetchBridgeFee();

      // Call the bridge function
      writeContract({
        address: bridgeContractAddress,
        abi: TELLER_WITH_LAYER_ZERO_ABI,
        functionName: "bridge",
        args: [
          BigInt(shareAmount.toString()),
          address, // to address
          bridgeWildCard,
          feeToken,
          maxFee, // Use the actual fee from previewFee
        ],
        value: maxFee, // Send the actual fee as ETH
      });
    } catch (error) {
      console.error("Bridge error:", error);
      setBridgeError("Failed to initiate bridge transaction");
      setIsBridging(false);
    }
  };

  // Write contract hook
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      setIsBridging(false);
      setAmount("0.00");
      // Refresh balance after successful bridge
      fetchSyUSDBalance();
    }
  }, [isConfirmed]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setBridgeError(writeError.message);
      setIsBridging(false);
    }
  }, [writeError]);

  return (
    <div className="min-h-screen flex flex-col pt-[52px]">
      <Header onNavigateToDeposit={() => {}}>
        <Navigation currentPage="bridge" />
      </Header>
      <main className="flex-1 overflow-y-auto mt-24">
        <div className="w-full px-24 py-12">
          {/* Header Section */}
          <div className="mb-16">
            {/* Header with Bridge, syUSD and Refresh Icon */}
            {showTransactionHistory ? (
              <div className="flex gap-6 justify-center mb-8">
                <div className="w-[550px]">
                  <div className="flex items-baseline gap-6">
                    <h1 className="text-4xl font-semibold text-white">
                      Bridge
                    </h1>

                    {/* Token Selector */}
                    <div className="flex items-center gap-2 bg-[#131723] p-2 rounded-[99px]">
                      <Image
                        src="/images/icons/syUSD.svg"
                        alt="syUSD"
                        width={32}
                        height={32}
                        className="w-[32px] h-[32px]"
                      />
                      <span className="text-white font-semibold text-base">
                        syUSD
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Refresh Icon aligned with transaction history */}
                <div className="w-[550px] flex justify-end items-baseline">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-12 h-12 p-3 rounded-[99px] bg-[#131723] hover:bg-[#3A3A4C] transition-colors disabled:opacity-50"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`text-gray-400 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    >
                      <path
                        d="M3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10Z"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <path
                        d="M10 6V10L13 13"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-8">
                <div className="w-[550px] flex items-baseline justify-between">
                  <div className="flex items-baseline gap-6">
                    <h1 className="text-4xl font-semibold text-white">
                      Bridge
                    </h1>

                    {/* Token Selector */}
                    <div className="flex items-center gap-2 bg-[#131723] p-2 rounded-[99px]">
                      <Image
                        src="/images/icons/syUSD.svg"
                        alt="syUSD"
                        width={32}
                        height={32}
                        className="w-[32px] h-[32px]"
                      />
                      <span className="text-white font-semibold text-base">
                        syUSD
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Refresh Icon at the right edge of bridge container */}
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-12 h-12 p-3 rounded-[99px] bg-[#131723] hover:bg-[#3A3A4C] transition-colors disabled:opacity-50"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`text-gray-400 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    >
                      <path
                        d="M3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10Z"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <path
                        d="M10 6V10L13 13"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Bridge Card and Transaction History Container */}
            <div
              className={
                showTransactionHistory
                  ? "flex gap-6 justify-center"
                  : "flex justify-center"
              }
            >
              <div className="w-[550px]">
                {/* Bridge Card */}
                <div className="space-y-4">
                  {/* Main Container */}
                  <div className="bg-white/5 rounded-sm overflow-hidden">
                    {/* Network Selection Sub-Container */}
                    <div className="bg-[#121521] p-6">
                      <div className="flex items-center justify-between">
                        {/* Source Network - Display Only */}
                        <div className="flex-1 relative">
                          <div className="flex items-center gap-1 mb-2">
                            <label className="block text-xs text-gray-400 tracking-normal">
                              Source Network
                            </label>
                            <Tooltip
                              content="Bridge from Base network"
                              side="top"
                            >
                              <div className="cursor-pointer">
                                <InfoIcon />
                              </div>
                            </Tooltip>
                          </div>
                          <div className="w-[180px] h-[40px] flex items-center gap-3 bg-[#1f212c] rounded-[99px] px-4 py-2">
                            <div
                              className={`w-6 h-6 ml-[-7.5px]  flex items-center justify-center`}
                            >
                              <Image
                                src={sourceNetwork.icon}
                                alt={sourceNetwork.name}
                                width={24}
                                height={24}
                              />
                            </div>
                            <span className="text-white text-base font-semibold">
                              {sourceNetwork.name}
                            </span>
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <div className="mx-4 mt-6">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-gray-400"
                          >
                            <path
                              d="M3 5H12"
                              stroke="currentColor"
                              strokeWidth="0.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9 3L12 5L9 7"
                              stroke="currentColor"
                              strokeWidth="0.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Destination Network */}
                        <div className="flex-1 relative">
                          <div className="flex justify-end">
                            <div className="w-[180px]">
                              <div className="flex items-center gap-1 mb-2">
                                <label className="block text-xs text-gray-400 tracking-normal">
                                  Destination Network
                                </label>
                                <Tooltip
                                  content="Select the network you want to bridge to"
                                  side="top"
                                >
                                  <div className="cursor-pointer">
                                    <InfoIcon />
                                  </div>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                          <div className="relative flex justify-end">
                            <button
                              onClick={() =>
                                setIsDestinationDropdownOpen(
                                  !isDestinationDropdownOpen
                                )
                              }
                              className="w-[180px] h-[40px] flex items-center gap-3 bg-[#1f212c]  rounded-[99px] px-4 py-2 hover:bg-[#3A3A4C] transition-colors"
                            >
                              <div
                                className={`w-6 h-6 ml-[-7.5px]  flex items-center justify-center`}
                              >
                                <Image
                                  src={destinationNetwork.icon}
                                  alt={destinationNetwork.name}
                                  width={24}
                                  height={24}
                                />
                              </div>
                              <span className="text-white text-base font-semibold">
                                {destinationNetwork.name}
                              </span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-gray-400 ml-auto"
                              >
                                <path
                                  d="M4 6L8 10L12 6"
                                  stroke="currentColor"
                                  strokeWidth="1"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            {/* Destination Network Dropdown */}
                            {isDestinationDropdownOpen && (
                              <div className="absolute top-full left-12 right-0 mt-2 bg-[#263042] pl-4 py-3 rounded-md max-w-[145px] shadow-lg z-10">
                                <div className="flex flex-col gap-4">
                                  {networks
                                    .filter(
                                      (network) => network.id !== "base" // Exclude Base since it's the source
                                    )
                                    .map((network) => (
                                      <button
                                        key={network.id}
                                        onClick={() =>
                                          handleDestinationNetworkSelect(
                                            network
                                          )
                                        }
                                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity w-full"
                                      >
                                        <div className="w-6 h-6 ml-[-7.5px] flex items-center justify-center">
                                          <Image
                                            src={network.icon}
                                            alt={network.name}
                                            width={24}
                                            height={24}
                                          />
                                        </div>
                                        <span className="text-[#9C9DA2] text-sm font-normal">
                                          {network.name}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Balance Sub-Container */}
                    <div className="bg-[#0d101c] p-8">
                      {/* Amount Input */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) =>
                                handleAmountChange(e.target.value)
                              }
                              placeholder="0.00"
                              className="w-full bg-transparent border-0 border-b border-[rgba(255,255,255,0.1)] p-1 text-white text-2xl font-bold focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <button
                            onClick={handleMaxClick}
                            className="w-[43px] h-[23px] bg-transparent border border-[rgba(156,157,162,0.3)] text-[#9C9DA2] text-xs font-normal rounded transition-colors hover:opacity-80"
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      {/* Balance and Bridge Fee */}
                      <div className="mt-0.5 p-0 space-y-1">
                        <p className="text-xs text-gray-400 font-normal">
                          Balance:{" "}
                          <span className="text-white font-normal">
                            {balance} syUSD
                          </span>
                        </p>
                        {parseFloat(amount) > 0 && (
                          <p className="text-xs text-gray-400 font-normal">
                            Bridge Fee:{" "}
                            <span className="text-white font-normal">
                              {parseFloat(bridgeFee).toFixed(6)} ETH
                            </span>
                          </p>
                        )}
                        {!isDestinationChainSupported(
                          destinationNetwork.id
                        ) && (
                          <p className="text-xs text-yellow-400 font-normal">
                            ⚠️ Bridge to {destinationNetwork.name} is not
                            currently supported
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bridge Button */}
                  <button
                    onClick={handleBridge}
                    disabled={
                      !isConnected ||
                      parseFloat(amount) <= 0 ||
                      isBridging ||
                      isConfirming ||
                      !isDestinationChainSupported(destinationNetwork.id)
                    }
                    className="w-full bg-[#B88AF8] text-[#1A1B1E] text-base font-semibold leading-[150%] py-4 rounded-sm hover:opacity-90 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!isConnected
                      ? "Connect Wallet"
                      : parseFloat(amount) <= 0
                      ? "Enter Amount"
                      : !isDestinationChainSupported(destinationNetwork.id)
                      ? `Bridge to ${destinationNetwork.name} Not Supported`
                      : isBridging || isConfirming
                      ? "Bridging..."
                      : "Bridge syUSD"}
                  </button>

                  {/* Bridge Error Display */}
                  {bridgeError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <p className="text-red-400 text-sm">{bridgeError}</p>
                    </div>
                  )}

                  {/* Bridge Success Display */}
                  {isConfirmed && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                      <p className="text-green-400 text-sm">
                        Bridge transaction confirmed! Your syUSD has been
                        bridged to {destinationNetwork.name}.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction History Container - only when showTransactionHistory is true */}
              {showTransactionHistory && (
                <div className="w-[550px]  rounded overflow-hidden">
                  <div className="bg-[#0d101c] px-6 py-6">
                    <div className="mb-3">
                      <h3 className="text-[#9C9DA2] text-xs font-normal">
                        Transaction History
                      </h3>
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {transactionHistory.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-3 px-4 bg-[#121520] rounded-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center">
                              <Image
                                src="/images/icons/syUSD.svg"
                                alt="syUSD"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                              />
                            </div>
                            <div>
                              <div className="text-white text-sm font-semibold">
                                {tx.token}
                              </div>
                              <div className="text-gray-400 text-xs flex items-center gap-2">
                                <span>{tx.from}</span>
                                <span>→</span>
                                <span>{tx.to}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <div className="text-white text-sm font-semibold">
                                {tx.amount}
                              </div>
                              <div className="text-gray-400 text-xs flex items-center gap-2">
                                <span>{tx.time}</span>
                                <span>•</span>
                                <span>{tx.status}</span>
                              </div>
                            </div>
                            <a
                              href={`https://basescan.org/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BridgePage;
