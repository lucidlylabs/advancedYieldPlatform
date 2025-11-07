import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { Header } from "../components/ui/header";
import { Navigation } from "../components/ui/navigation";
import { useHeaderHeight } from "../contexts/BannerContext";
import { createPublicClient, formatUnits, http, type Address } from "viem";
import { USD_STRATEGIES } from "../config/env";
import { ERC20_ABI } from "../config/abi/erc20";

interface LeaderboardEntry {
  rank: number;
  address: string;
  percentage: number;
  rewardsEarned: number;
  tokenType: string;
  rewardsFormatted: string;
}

const LEADERBOARD_API_URL =
  "https://ow5g1cjqsd.execute-api.ap-south-1.amazonaws.com/dev/api/leaderboard/leaderboard";
const USER_LEADERBOARD_API_URL =
  "https://ow5g1cjqsd.execute-api.ap-south-1.amazonaws.com/dev/api/leaderboard/user";

const syUsdStrategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE;
const syUsdDecimals = syUsdStrategy?.shareAddress_token_decimal ?? 6;

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 3,
  }).format(value);

const fetchUserSyUsdBalance = async (
  userAddress: Address
): Promise<number | null> => {
  try {
    if (!syUsdStrategy?.base?.rpc || !syUsdStrategy?.shareAddress) {
      return null;
    }

    const client = createPublicClient({
      transport: http(syUsdStrategy.base.rpc),
      chain: syUsdStrategy.base.chainObject,
    });

    const balance = await client.readContract({
      address: syUsdStrategy.shareAddress as Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });

    const formatted = parseFloat(formatUnits(balance as bigint, syUsdDecimals));

    return Number.isFinite(formatted) ? formatted : null;
  } catch (err) {
    console.error("Failed to fetch user syUSD balance:", err);
    return null;
  }
};

const LeaderboardPage: React.FC = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const headerHeight = useHeaderHeight();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchLeaderboardData();
  }, [address]);

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: "25" });
      if (address) {
        params.append("address", address);
      }

      const response = await fetch(`${LEADERBOARD_API_URL}?${params.toString()}`);
      const data = await response.json();

      if (!data?.success) {
        setError(data?.message || "Failed to fetch leaderboard data");
        setLeaderboardData([]);
        return;
      }

      let leaderboard: LeaderboardEntry[] = Array.isArray(data?.data?.leaderboard)
        ? data.data.leaderboard
        : [];

      if (address) {
        const normalizedAddress = address.toLowerCase();
        const hasUserEntry = leaderboard.some(
          (entry) => entry.address.toLowerCase() === normalizedAddress
        );

        if (!hasUserEntry) {
          let userEntry: LeaderboardEntry | null = null;

          try {
            const userResponse = await fetch(
              `${USER_LEADERBOARD_API_URL}?address=${address}`
            );
            const userData = await userResponse.json();

            if (userResponse.ok && userData?.success) {
              const maybeEntry = userData?.data?.leaderboard?.[0] ?? userData?.data;
              if (maybeEntry?.address) {
                const rewardsEarnedNumber = Number(maybeEntry.rewardsEarned ?? 0);
                userEntry = {
                  rank:
                    typeof maybeEntry.rank === "number" && !Number.isNaN(maybeEntry.rank)
                      ? maybeEntry.rank
                      : 21,
                  address: maybeEntry.address,
                  percentage: Number(maybeEntry.percentage ?? 0),
                  rewardsEarned: rewardsEarnedNumber,
                  tokenType: maybeEntry.tokenType ?? syUsdStrategy?.name ?? "syUSD",
                  rewardsFormatted:
                    typeof maybeEntry.rewardsFormatted === "string"
                      ? maybeEntry.rewardsFormatted
                      : formatCompactNumber(rewardsEarnedNumber),
                };
              }
            }
          } catch (userFetchError) {
            console.warn("Could not fetch user leaderboard entry:", userFetchError);
          }

          if (!userEntry) {
            const balance = await fetchUserSyUsdBalance(address as Address);
            if (balance && balance > 0) {
              userEntry = {
                rank: 21,
                address,
                percentage: 0,
                rewardsEarned: balance,
                tokenType: syUsdStrategy?.name || "syUSD",
                rewardsFormatted: formatCompactNumber(balance),
              };
            }
          }

          if (userEntry) {
            const leaderboardWithUser = [...leaderboard, userEntry];
            leaderboard = leaderboardWithUser;
          }
        }
      }

      setLeaderboardData(leaderboard);
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error fetching leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayLeaderboard = (): LeaderboardEntry[] => {
    if (!leaderboardData.length) return [];

    // Find user's position in the full leaderboard
    const userEntry = leaderboardData.find(
      (entry) => entry.address.toLowerCase() === address?.toLowerCase()
    );

    // If we have less than 21 entries, return all
    if (leaderboardData.length <= 21) {
      return leaderboardData;
    }

    // If user not connected, show top 21
    if (!userEntry) {
      // If user is connected but not in leaderboard data, they likely have 0 points
      if (isConnected && address) {
        const top20 = leaderboardData.slice(0, 20);
        const zeroPointsEntry = {
          rank: -2, // Special marker for 0 points user
          address: address,
          percentage: 0,
          rewardsEarned: 0,
          tokenType: "",
          rewardsFormatted: "0",
        };
        return [...top20, zeroPointsEntry];
      }
      return leaderboardData.slice(0, 21);
    }

    // Edge Case 1: User has 0 points - add as special entry
    if (userEntry.rewardsEarned === 0) {
      const top20 = leaderboardData.slice(0, 20);
      const zeroPointsEntry = {
        ...userEntry,
        rank: -2, // Special marker for 0 points user
      };
      return [...top20, zeroPointsEntry];
    }

    // Edge Case 2: User is ranked 4-20 - show them at actual position, show up to rank 21 to include them
    if (userEntry.rank >= 4 && userEntry.rank <= 20) {
      return leaderboardData.slice(0, 21);
    }

    // Edge Case 3: User is after rank 20 - show top 20 + user at position 21
    if (userEntry.rank > 20) {
      const top20 = leaderboardData.slice(0, 20);
      const userEntryHidden = {
        ...userEntry,
        rank: -1, // Special marker to show only "YOU"
      };
      return [...top20, userEntryHidden];
    }

    // Edge Case 4: User is in top 3 - show normal top 21
    return leaderboardData.slice(0, 21);
  };

  const isUserEntry = (entry: LeaderboardEntry): boolean => {
    if (!isConnected || !address) return false;

    // Check if this entry belongs to the connected user
    return entry.address.toLowerCase() === address.toLowerCase();
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "";
    }
  };

  const getRankStyle = (rank: number): string => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/15 to-yellow-600/2 border-gray-400/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-500/15 to-amber-600/2 border-gray-400/30";
      default:
        return "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)]";
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingTop: `${headerHeight}px` }}>
      <Header onNavigateToDeposit={() => {}}>
        <Navigation 
          currentPage="leaderboard" 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </Header>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-12 py-12">
          {/* Header Section */}
          <div className="mb-16">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="flex items-start gap-6">
                  <h1 className="text-3xl font-bold text-white mt-2">
                    Lucidly Drops
                  </h1>
                  {/* <div className="flex items-center gap-2 border border-[#1a4fd4] px-1  rounded-sm">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center p-1">
                      <Image
                        src="/images/icons/syUSD.svg"
                        alt="syUSD"
                        width={16}
                        height={16}
                        className="w-8 h-8"
                      />
                    </div>
                    <span className="text-white text-sm font-medium text-[#1a4fd4]">
                      syUSD
                    </span>
                  </div> */}
                </div>
                <p className="text-[#9C9DA2]">Earn rewards by holding syUSD </p>
              </div>
            </div>
          </div>

          {/* Top 3 Winners */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getDisplayLeaderboard()
                .slice(0, 3)
                .map((entry) => (
                  <div
                    key={entry.rank}
                    className={`relative px-4 py-6 rounded border ${getRankStyle(
                      entry.rank
                    )}`}
                  >
                    {/* Badge for connected wallet if ranked 1-23 */}
                                         {isUserEntry(entry) &&
                       entry.rank >= 1 &&
                       entry.rank <= 23 && (
                         <div className="absolute -top-8 -right-6">
                           <Image
                             src="/images/icons/badge.svg"
                             alt="Badge"
                             width={64}
                             height={64}
                             className="w-16 h-16"
                           />
                         </div>
                       )}

                    <div className="flex items-center gap-4">
                      {/* Medal Icon */}
                      <div className="text-3xl">{getRankIcon(entry.rank)}</div>

                      {/* Address with Avatar */}
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-white font-mono text-sm">
                          {entry.address.slice(0, 6)}...
                          {entry.address.slice(-4)}
                        </span>
                      </div>

                      {/* Rewards */}
                      <div className="text-right">
                        <div className="text-white font-semibold text-lg">
                          {entry.rewardsFormatted}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Full Width Leaderboard Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 border-2 border-[#B88AF8] border-t-transparent rounded-full"></div>
                <span className="text-[#9C9DA2]">Loading leaderboard...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <span className="text-red-400">{error}</span>
                <button
                  onClick={fetchLeaderboardData}
                  className="px-4 py-2 bg-[#B88AF8] text-white rounded-lg hover:bg-[#9F6EE9] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Ranks 4-12 */}
              <div className="space-y-2">
                {getDisplayLeaderboard()
                  .slice(3, 12)
                  .map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.address}`}
                      className={`relative flex items-center justify-between p-4 rounded border transition-colors ${
                        isUserEntry(entry)
                          ? "bg-gradient-to-r from-green-400/20 to-green-400/0 border-gray-400/30 hover:bg-green-400/20 py-3"
                          : "border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)]"
                      }`}
                    >
                      {/* Badge for connected wallet if ranked 1-23 */}
                                             {isUserEntry(entry) &&
                         entry.rank >= 1 &&
                         entry.rank <= 23 && (
                           <div className="absolute -top-8 -right-6">
                             <Image
                               src="/images/icons/badge.svg"
                               alt="Badge"
                               width={56}
                               height={56}
                               className="w-14 h-14"
                             />
                           </div>
                         )}
                      <div className="flex items-center gap-4">
                        {entry.rank === -1 ? (
                          <span className="text-white text-md py-1 rounded font-medium">
                            YOU
                          </span>
                        ) : entry.rank === -2 ? (
                          <span className="text-white text-md py-1 rounded font-medium">
                            YOU
                          </span>
                        ) : (
                          <>
                            <span className="text-white font-medium w-4 text-center">
                              {entry.rank}
                            </span>
                            {isUserEntry(entry) && (
                              <span className="text-white text-md py-1 rounded font-medium">
                                YOU
                              </span>
                            )}
                          </>
                        )}
                        <span className="text-white font-mono text-sm">
                          {entry.address.slice(0, 6)}...
                          {entry.address.slice(-4)}
                        </span>
                      </div>
                      <div className="text-white font-medium">
                        {entry.rank === -2
                          ? "No deposits yet"
                          : entry.rewardsFormatted}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Right Column - Ranks 13-21 */}
              <div className="space-y-2">
                {getDisplayLeaderboard()
                  .slice(12, 21)
                  .map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.address}`}
                      className={`relative flex items-center justify-between p-4 rounded border transition-colors ${
                        isUserEntry(entry)
                          ? "bg-gradient-to-r from-green-400/20 to-green-400/0 border-gray-400/30 hover:bg-green-400/20 py-3"
                          : "border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)]"
                      }`}
                    >
                      {/* Badge for connected wallet if ranked 1-23 */}
                                             {isUserEntry(entry) &&
                         entry.rank >= 1 &&
                         entry.rank <= 23 && (
                           <div className="absolute -top-8 -right-6">
                             <Image
                               src="/images/icons/badge.svg"
                               alt="Badge"
                               width={56}
                               height={56}
                               className="w-14 h-14"
                             />
                           </div>
                         )}
                      <div className="flex items-center gap-4">
                        {entry.rank === -1 ? (
                          <span className="text-white text-md py-1 rounded font-medium">
                            YOU
                          </span>
                        ) : entry.rank === -2 ? (
                          <span className="text-white text-md py-1 rounded font-medium">
                            YOU
                          </span>
                        ) : (
                          <>
                            <span className="text-white font-medium w-4 text-center">
                              {entry.rank}
                            </span>
                            {isUserEntry(entry) && (
                              <span className="text-white text-md py-1 rounded font-medium">
                                YOU
                              </span>
                            )}
                          </>
                        )}
                        <span className="text-white font-mono text-sm">
                          {entry.address.slice(0, 6)}...
                          {entry.address.slice(-4)}
                        </span>
                      </div>
                      <div className="text-white font-medium">
                        {entry.rank === -2
                          ? "No deposits yet"
                          : entry.rewardsFormatted}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;

// Disable static generation since this page uses client-side only features
export async function getServerSideProps() {
  return {
    props: {},
  };
}
