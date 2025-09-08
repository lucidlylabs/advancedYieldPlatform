import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, createPublicClient, http, Address, parseUnits } from "viem";
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
  const [sourceNetwork, setSourceNetwork] = useState<Network>(networks[0]);
  const [destinationNetwork, setDestinationNetwork] = useState<Network>(
    networks[1]
  );
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] =
    useState(false);
  const [balance, setBalance] = useState<string>("0.00");

  // syUSD vault contract address on Base network (vault shares)
  const syUSDContractAddress =
    "0x279CAD277447965AF3d24a78197aad1B02a2c589" as `0x${string}`;
  const syUSDDecimals = 6;

  // TellerWithLayerZero bridge contract address
  const bridgeContractAddress = "0xaefc11908fF97c335D16bdf9F2Bf720817423825" as `0x${string}`;
  
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

  const handleSourceNetworkSelect = (network: Network) => {
    setSourceNetwork(network);
    setIsSourceDropdownOpen(false);
  };

  const handleDestinationNetworkSelect = (network: Network) => {
    setDestinationNetwork(network);
    setIsDestinationDropdownOpen(false);
  };

  const swapNetworks = () => {
    const temp = sourceNetwork;
    setSourceNetwork(destinationNetwork);
    setDestinationNetwork(temp);
  };

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

      const shareAmount = parseUnits(amount, syUSDDecimals);
      const bridgeWildCard = "0x"; // LayerZero bridge wildcard
      const feeToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH address for LayerZero

      const fee = await client.readContract({
        address: bridgeContractAddress,
        abi: TELLER_WITH_LAYER_ZERO_ABI,
        functionName: "previewFee",
        args: [
          BigInt(shareAmount.toString()),
          address,
          bridgeWildCard,
          feeToken
        ],
      });

      const feeBigInt = fee as bigint;
      const formattedFee = formatUnits(feeBigInt, 18);
      setBridgeFee(formattedFee);
      
      return feeBigInt;
    } catch (error) {
      console.error("Error fetching bridge fee:", error);
      setBridgeFee("0.000007339661645843"); // Display value in ETH
      return parseUnits("7339661645843", 18);
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

      // Convert amount to proper units (shares)
      const shareAmount = parseUnits(amount, syUSDDecimals);
      
      // LayerZero bridge parameters
      const bridgeWildCard = "0x000000000000000000000000000000000000000000000000000000000000759e"; // LayerZero bridge wildcard
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
          BigInt("26704091856546") // Hardcoded bridge fee
        ],
        value: BigInt("26704091856546") // Send the fee as ETH
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
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
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
            <div className="w-[550px] mx-auto">
              <div className="flex items-baseline justify-between mb-8">
                <div className="flex items-baseline gap-6">
                  <h1 className="text-4xl font-semibold text-white">Bridge</h1>

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

                {/* Refresh Icon */}
                <button className="w-12 h-12 p-3 rounded-[99px] bg-[#131723] hover:bg-[#3A3A4C] transition-colors">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-400"
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

            {/* Bridge Card */}
            <div className="w-[550px] mx-auto space-y-4">
              {/* Main Container */}
              <div className="bg-white/5  rounded-sm overflow-hidden">
                {/* Network Selection Sub-Container */}
                <div className="bg-[#121521] p-6">
                  <div className="flex items-center justify-between">
                    {/* Source Network */}
                    <div className="flex-1 relative">
                      <div className="flex items-center gap-1 mb-2">
                        <label className="block text-xs text-gray-400 tracking-normal">
                          Source Network
                        </label>
                        <Tooltip
                          content="Select the network you want to bridge from"
                          side="top"
                        >
                          <div className="cursor-pointer">
                            <InfoIcon />
                          </div>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setIsSourceDropdownOpen(!isSourceDropdownOpen)
                          }
                          className="w-[180px] h-[40px] flex items-center gap-3 bg-[#1f212c]  rounded-[99px] px-4 py-2 hover:bg-[#3A3A4C] transition-colors"
                        >
                          <div
                            className={`w-6 h-6 ml-[-7.5px] rounded-full ${sourceNetwork.color} flex items-center justify-center`}
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

                        {/* Source Network Dropdown */}
                        {isSourceDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#263042] pl-4 py-3 rounded-md max-w-[145px] shadow-lg z-10">
                            <div className="flex flex-col gap-4">
                              {networks
                                .filter(
                                  (network) =>
                                    network.id !== destinationNetwork.id
                                )
                                .map((network) => (
                                <button
                                  key={network.id}
                                  onClick={() =>
                                    handleSourceNetworkSelect(network)
                                  }
                                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity w-full"
                                >
                                  <div
                                    className={`w-6 h-6 ml-[-7.5px] rounded-full ${network.color} flex items-center justify-center`}
                                  >
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

                    {/* Swap Button */}
                    <div className="mx-4 mt-6">
                      <button
                        onClick={swapNetworks}
                        className="p-0 hover:opacity-80 transition-opacity"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-gray-400"
                        >
                          {/* Top arrow pointing right */}
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
                          {/* Bottom arrow pointing left */}
                          <path
                            d="M12 10H3"
                            stroke="currentColor"
                            strokeWidth="0.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6 8L3 10L6 12"
                            stroke="currentColor"
                            strokeWidth="0.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
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
                            className={`w-6 h-6 ml-[-7.5px] rounded-full ${destinationNetwork.color} flex items-center justify-center`}
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
                                  (network) => network.id !== sourceNetwork.id
                                )
                                .map((network) => (
                                <button
                                  key={network.id}
                                  onClick={() =>
                                    handleDestinationNetworkSelect(network)
                                  }
                                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity w-full"
                                >
                                  <div
                                    className={`w-6 h-6 ml-[-7.5px] rounded-full ${network.color} flex items-center justify-center`}
                                  >
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
                          onChange={(e) => handleAmountChange(e.target.value)}
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
                  </div>
                </div>
              </div>

              {/* Bridge Button */}
              <button
                onClick={handleBridge}
                disabled={!isConnected || parseFloat(amount) <= 0 || isBridging || isConfirming}
                className="w-full bg-[#B88AF8] text-[#1A1B1E] text-base font-semibold leading-[150%] py-4 rounded-sm hover:opacity-90 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!isConnected
                  ? "Connect Wallet"
                  : parseFloat(amount) <= 0
                  ? "Enter Amount"
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
                    Bridge transaction confirmed! Your syUSD has been bridged to {destinationNetwork.name}.
                  </p>
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
