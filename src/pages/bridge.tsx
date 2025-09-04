import React, { useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Header } from "../components/ui/header";
import { Navigation } from "../components/ui/navigation";

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

const BridgePage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<string>("0.00");
  const [sourceNetwork, setSourceNetwork] = useState<Network>(networks[0]);
  const [destinationNetwork, setDestinationNetwork] = useState<Network>(networks[1]);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
  const [balance] = useState<string>("115,447.00");

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleMaxClick = () => {
    setAmount(balance);
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

  return (
    <div className="min-h-screen flex flex-col pt-[52px]">
      <Header onNavigateToDeposit={() => {}}>
        <Navigation currentPage="bridge" />
      </Header>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-12 py-12">
          {/* Header Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Bridge</h1>
              
              {/* Token Selector */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#2A2A3C] px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)]">
                  <Image
                    src="/images/icons/syUSD.svg"
                    alt="syUSD"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-white font-medium">syUSD</span>
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
                
                {/* Refresh Icon */}
                <button className="p-2 rounded-lg bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] hover:bg-[#3A3A4C] transition-colors">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-400"
                  >
                    <path
                      d="M1 4V10H7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19 16V10H13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16.5 7.5C16.1667 6.16667 15.5 5 14.5 4C13.5 3 12.1667 2.33333 10.5 2C8.83333 1.66667 7 2 5 3C3 4 1.66667 5.66667 1 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.5 12.5C3.83333 13.8333 4.5 15 5.5 16C6.5 17 7.83333 17.6667 9.5 18C11.1667 18.3333 13 18 15 17C17 16 18.3333 14.3333 19 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Bridge Card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1A1A2E] border border-[rgba(255,255,255,0.1)] rounded-xl p-8">
              {/* Network Selection */}
              <div className="flex items-center justify-between mb-8">
                {/* Source Network */}
                <div className="flex-1 relative">
                  <label className="block text-sm text-gray-400 mb-2">Source Network</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                      className="w-full flex items-center gap-3 bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 hover:bg-[#3A3A4C] transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full ${sourceNetwork.color} flex items-center justify-center`}>
                        <Image
                          src={sourceNetwork.icon}
                          alt={sourceNetwork.name}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      </div>
                      <span className="text-white font-medium">{sourceNetwork.name}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400 ml-auto"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    
                    {/* Source Network Dropdown */}
                    {isSourceDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg z-10">
                        {networks.map((network) => (
                          <button
                            key={network.id}
                            onClick={() => handleSourceNetworkSelect(network)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#3A3A4C] transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className={`w-8 h-8 rounded-full ${network.color} flex items-center justify-center`}>
                              <Image
                                src={network.icon}
                                alt={network.name}
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                            </div>
                            <span className="text-white font-medium">{network.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="mx-4 mt-6">
                  <button
                    onClick={swapNetworks}
                    className="p-3 rounded-full bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] hover:bg-[#3A3A4C] transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-gray-400"
                    >
                      <path
                        d="M7 4L3 8L7 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 16L17 12L13 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Destination Network */}
                <div className="flex-1 relative">
                  <label className="block text-sm text-gray-400 mb-2">Destination Network</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsDestinationDropdownOpen(!isDestinationDropdownOpen)}
                      className="w-full flex items-center gap-3 bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 hover:bg-[#3A3A4C] transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full ${destinationNetwork.color} flex items-center justify-center`}>
                        <Image
                          src={destinationNetwork.icon}
                          alt={destinationNetwork.name}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      </div>
                      <span className="text-white font-medium">{destinationNetwork.name}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400 ml-auto"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    
                    {/* Destination Network Dropdown */}
                    {isDestinationDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg z-10">
                        {networks.map((network) => (
                          <button
                            key={network.id}
                            onClick={() => handleDestinationNetworkSelect(network)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#3A3A4C] transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className={`w-8 h-8 rounded-full ${network.color} flex items-center justify-center`}>
                              <Image
                                src={network.icon}
                                alt={network.name}
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                            </div>
                            <span className="text-white font-medium">{network.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#2A2A3C] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleMaxClick}
                    className="px-4 py-3 bg-[#7B5FFF] text-white font-medium rounded-lg hover:bg-[#6B4FEF] transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <p className="text-sm text-gray-400">
                  Balance: <span className="text-white font-medium">{balance} syUSD</span>
                </p>
              </div>

              {/* Wait Time */}
              <div className="mb-8">
                <p className="text-sm text-gray-400">
                  Wait Time: <span className="text-white font-medium">~60 mins to 48 hrs</span>
                </p>
              </div>

              {/* Action Button */}
              <button
                disabled={!isConnected || parseFloat(amount) <= 0}
                className="w-full bg-[#7B5FFF] text-white font-medium py-4 rounded-lg hover:bg-[#6B4FEF] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!isConnected ? "Connect Wallet" : parseFloat(amount) <= 0 ? "Enter Amount" : "Bridge syUSD"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BridgePage;
