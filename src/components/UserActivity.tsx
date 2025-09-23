import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";

interface Transaction {
  id: number;
  type: "deposit" | "withdrawal" | "bridge";
  amount: string;
  asset: string;
  assetName: string;
  transactionHash: string;
  timestamp: string;
  network: string;
  vaultAddress?: string;
  shareAmount?: string;
  requestId?: string;
  status?: string;
  sourceNetwork?: string;
  destinationNetwork?: string;
  bridgeSender?: string;
  bridgeReceiver?: string;
  // New backend fields
  fromAmount?: string;
  toAmount?: string;
  fromAsset?: {
    address: string;
    name: string;
    symbol: string;
    icon: string;
  };
  toAsset?: {
    address: string | null;
    name: string;
    symbol: string;
    icon: string;
  };
}

interface UserActivityData {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalBridges: number;
    totalTransactions: number;
  };
}

interface AssetIcons {
  [key: string]: string;
}

const assetIcons: AssetIcons = {
  USDC: "/images/icons/usdc.svg",
  USDS: "/images/icons/usds.svg",
  sUSDS: "/images/icons/sUSDS.svg",
  syUSD: "/images/icons/syUSD.svg",
  ETH: "/images/icons/eth-stable.svg",
  BTC: "/images/icons/btc-stable.svg",
};

const networkIcons: AssetIcons = {
  // Main networks
  base: "/images/logo/base.svg",
  ethereum: "/images/logo/eth.svg",
  arbitrum: "/images/logo/arb.svg",
  katana: "/images/logo/katana.svg",
  
  // Bridge chain IDs - destination chains (each should have different icons)
  "30101": "/images/logo/base.svg",        // Destination chain 1
  "30110": "/images/logo/eth.svg",         // Destination chain 2  
  "30375": "/images/logo/arb.svg",         // Destination chain 3
  
  // API response mappings
  "chain-30101": "/images/logo/katana.svg",
  "chain-null": "/images/logo/base.svg",
  sonic: "/images/logo/katana.svg",
  
  // Fallbacks
  optimism: "/images/logo/base.svg",
  bsc: "/images/logo/base.svg",
  polygon: "/images/logo/base.svg",
  fantom: "/images/logo/base.svg",
  avalanche: "/images/logo/base.svg",
};

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

const UserActivity: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [activityData, setActivityData] = useState<UserActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (address && isConnected) {
      fetchUserActivity(address, currentPage);
    }
  }, [address, isConnected, currentPage]);

  const fetchUserActivity = async (userAddress: string, page: number = 1) => {
    setLoading(true);
    try {
      console.log(`Fetching user activity for address: ${userAddress}, page: ${page}`);
      const response = await fetch(`http://localhost:3001/api/user-activity/${userAddress}?page=${page}`);
      
      console.log("API Response status:", response.status);
      console.log("API Response headers:", Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log("=== FULL API RESPONSE ===");
      console.log(JSON.stringify(data, null, 2));
      console.log("=== END API RESPONSE ===");
      
      if (data.success) {
        console.log("User activity data received:", data.data);
        // Log transaction details for debugging
        if (data.data.transactions) {
          console.log(`Found ${data.data.transactions.length} transactions`);
          data.data.transactions.forEach((tx: Transaction, index: number) => {
            console.log(`Transaction ${index}:`, {
              id: tx.id,
              type: tx.type,
              amount: tx.amount,
              fromAmount: tx.fromAmount,
              toAmount: tx.toAmount,
              assetName: tx.assetName,
              fromAsset: tx.fromAsset,
              toAsset: tx.toAsset,
              timestamp: tx.timestamp,
              network: tx.network,
              transactionHash: tx.transactionHash
            });
          });
        } else {
          console.log("No transactions found in response");
        }
        setActivityData(data.data);
      } else {
        console.error("Failed to fetch user activity:", data.message);
        console.error("Full error response:", data);
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "2-digit"
    });
  };

  const formatAmount = (amount: string | undefined, assetName: string | undefined) => {
    const name = assetName || "";
    if (amount === undefined || amount === null) {
      return `0.00 ${name}`;
    }

    const numAmount = Number(amount);
    if (!isFinite(numAmount) || isNaN(numAmount)) {
      return `0.00 ${name}`;
    }

    if (numAmount === 0) {
      return `0.00 ${name}`;
    }

    // Show more precision for very small non-zero values
    // < 0.01 -> up to 6 decimals, < 1 -> 4 decimals, otherwise 2 decimals
    const formatted = numAmount < 0.01
      ? numAmount.toFixed(6)
      : numAmount < 1
        ? numAmount.toFixed(4)
        : numAmount.toFixed(2);

    // Trim trailing zeros while keeping at least two decimals for readability
    const trimmed = formatted.replace(/\.?(0+)$/,"");
    const ensureMinimumTwoDecimals = (val: string) => {
      if (!val.includes('.')) return `${val}.00`;
      const [i, d] = val.split('.');
      if ((d ?? '').length >= 2) return val;
      return `${i}.${(d ?? '').padEnd(2,'0')}`;
    };

    return `${ensureMinimumTwoDecimals(trimmed)} ${name}`;
  };

  // Helper function to get the correct amount for display
  const getTransactionAmount = (transaction: Transaction) => {
    // Prefer fromAmount for source; fallback to amount; finally use toAmount if others missing
    return transaction.fromAmount || transaction.amount || transaction.toAmount || "0";
  };

  // Helper function to get the correct asset name for display  
  const getTransactionAssetName = (transaction: Transaction) => {
    // Prefer source asset; fallback to provided assetName; finally use destination asset
    return (
      transaction.fromAsset?.symbol ||
      transaction.fromAsset?.name ||
      transaction.assetName ||
      transaction.toAsset?.symbol ||
      transaction.toAsset?.name ||
      ""
    );
  };

  // Helper function to get the asset icon
  const getAssetIcon = (transaction: Transaction) => {
    const assetName = getTransactionAssetName(transaction);
    return assetIcons[assetName] || "/images/icons/default_assest.svg";
  };

  const getTransactionUrl = (hash: string, network: string) => {
    const baseUrls: { [key: string]: string } = {
      base: "https://basescan.org/tx/",
      ethereum: "https://etherscan.io/tx/",
      arbitrum: "https://arbiscan.io/tx/",
    };
    return baseUrls[network] + hash;
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handlePreviousPage = () => {
    if (activityData?.pagination.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (activityData?.pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-[#9C9DA2] text-center">
          <div className="text-lg font-medium mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-[#9C9DA2] text-center">
          <div className="text-lg font-medium mb-2">Connect your wallet to view activity</div>
          <div className="text-sm">Your transaction history will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Activity Content */}
      <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-400 text-sm">Loading your activity...</p>
            </div>
          ) : !activityData || activityData.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-[#9C9DA2] text-center">
                <div className="text-lg font-medium mb-2">No activity found</div>
                <div className="text-sm">Your transaction history will appear here</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Activity Summary */}
              {activityData.summary && (
                <div className="mb-6 p-4 rounded-[4px] bg-[rgba(255,255,255,0.05)]">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-[#9C9DA2] text-[12px] mb-1">Deposits</div>
                      <div className="text-white text-[16px] font-semibold">{activityData.summary.totalDeposits}</div>
                    </div>
                    <div>
                      <div className="text-[#9C9DA2] text-[12px] mb-1">Withdrawals</div>
                      <div className="text-white text-[16px] font-semibold">{activityData.summary.totalWithdrawals}</div>
                    </div>
                    <div>
                      <div className="text-[#9C9DA2] text-[12px] mb-1">Bridges</div>
                      <div className="text-white text-[16px] font-semibold">{activityData.summary.totalBridges}</div>
                    </div>
                    <div>
                      <div className="text-[#9C9DA2] text-[12px] mb-1">Total</div>
                      <div className="text-white text-[16px] font-semibold">{activityData.summary.totalTransactions}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction List */}
              {activityData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-[rgba(255,255,255,0.02)] rounded-[4px] py-4 px-6 grid grid-cols-12 items-center gap-4"
                >
                  {/* Left side - Date and external link */}
                  <div className="col-span-3 flex items-center gap-3">
                    <button
                      className="text-[#D7E3EF] hover:text-white transition-colors cursor-pointer"
                      onClick={() => {
                        if (transaction.transactionHash) {
                          window.open(
                            getTransactionUrl(transaction.transactionHash, transaction.network),
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }
                      }}
                      type="button"
                    >
                      <ExternalLinkIcon />
                    </button>
                    <div className="text-[#D7E3EF] text-[12px]">
                      {formatDate(transaction.timestamp)}
                    </div>
                  </div>

                  {/* Center - Transaction type */}
                  <div className="col-span-2 flex justify-center">
                    <div className="text-white text-[12px] font-medium">
                      {capitalizeFirstLetter(transaction.type)}
                    </div>
                  </div>

                    {/* Right side - Amount with tokens/networks */}
                    <div className="col-span-7 flex items-center justify-end gap-4">
                      {transaction.type === "bridge" ? (
                        // Bridge transaction: Source Network -> Destination Network
                        <>
                          {/* Source Network - Show network logo and coin name as text */}
                          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-1">
                            <Image
                              src={networkIcons[transaction.sourceNetwork || ""] || networkIcons[transaction.network || ""] || "/images/logo/base.svg"}
                              alt={transaction.sourceNetwork || transaction.network || "Source"}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            <span className="text-[#D7E3EF] text-[12px] font-normal">
                              {formatAmount(getTransactionAmount(transaction), getTransactionAssetName(transaction))}
                            </span>
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          {/* Destination Network - Show network logo and coin name as text */}
                          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-1">
                            <Image
                              src={networkIcons[transaction.destinationNetwork || ""] || networkIcons[transaction.network || ""] || "/images/logo/katana.svg"}
                              alt={transaction.destinationNetwork || transaction.network || "Destination"}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            <span className="text-white text-[12px] font-normal">
                              {transaction.toAsset ? 
                                formatAmount(transaction.toAmount || getTransactionAmount(transaction), transaction.toAsset.symbol || transaction.toAsset.name) :
                                formatAmount(getTransactionAmount(transaction), getTransactionAssetName(transaction))
                              }
                            </span>
                          </div>
                        </>
                      ) : (
                        // Regular transaction: Network -> Network (with coin names as text)
                        <>
                          {/* Source Network - Show network logo and coin name as text */}
                          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-1">
                            <Image
                              src={networkIcons[transaction.network] || "/images/logo/base.svg"}
                              alt={transaction.network}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            <span className="text-[#D7E3EF] text-[12px] font-normal">
                              {formatAmount(getTransactionAmount(transaction), getTransactionAssetName(transaction))}
                            </span>
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          {/* Destination Network - Show network logo and coin name as text */}
                          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-1">
                            <Image
                              src={transaction.type === "withdrawal" ? "/images/logo/base.svg" : (networkIcons[transaction.network] || "/images/logo/base.svg")}
                              alt={transaction.network}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            <span className="text-white text-[12px] font-normal">
                              {transaction.toAsset ? 
                                formatAmount(transaction.toAmount || getTransactionAmount(transaction), transaction.toAsset.symbol || transaction.toAsset.name) :
                                formatAmount(getTransactionAmount(transaction), getTransactionAssetName(transaction))
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                </div>
              ))}

              {/* Pagination */}
              {activityData.pagination && activityData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!activityData.pagination.hasPrevPage}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-colors ${
                      activityData.pagination.hasPrevPage
                        ? 'text-white bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] cursor-pointer'
                        : 'text-[#9C9DA2] bg-[rgba(255,255,255,0.05)] cursor-not-allowed'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Previous
                  </button>
                  
                  <div className="text-[#9C9DA2] text-[12px] px-4">
                    Page {currentPage} of {activityData.pagination.totalPages}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={!activityData.pagination.hasNextPage}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-colors ${
                      activityData.pagination.hasNextPage
                        ? 'text-white bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] cursor-pointer'
                        : 'text-[#9C9DA2] bg-[rgba(255,255,255,0.05)] cursor-not-allowed'
                    }`}
                  >
                    Next
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default UserActivity;
