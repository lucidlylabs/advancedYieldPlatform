import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { Header } from "../components/ui/header";
import { Navigation } from "../components/ui/navigation";

interface LeaderboardEntry {
  rank: number;
  address: string;
  percentage: number;
  rewardsEarned: number;
  tokenType: string;
  rewardsFormatted: string;
}



const LeaderboardPage: React.FC = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/leaderboard/leaderboard?limit=25');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.data.leaderboard);
      } else {
        setError(data.message || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayLeaderboard = (): LeaderboardEntry[] => {
    if (!leaderboardData.length) return [];
    
    // Find user's position in the full leaderboard
    const userEntry = leaderboardData.find(entry => 
      entry.address.toLowerCase() === address?.toLowerCase()
    );
    
    // If we have less than 21 entries, return all
    if (leaderboardData.length <= 21) {
      return leaderboardData;
    }
    
    // If user is in top 21 or not connected, show top 21
    if (!userEntry || userEntry.rank <= 21) {
      return leaderboardData.slice(0, 21);
    }
    
    // If user is below rank 21, show top 20 + user at position 21 (hide their rank, show only "YOU")
    const top20 = leaderboardData.slice(0, 20);
    const userEntryHidden = {
      ...userEntry,
      rank: -1 // Special marker to hide rank and show only "YOU"
    };
    
    return [...top20, userEntryHidden];
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
    <div className="min-h-screen flex flex-col pt-[52px]">
      <Header onNavigateToDeposit={() => {}}>
        <Navigation currentPage="leaderboard" />
      </Header>
      
      <main className="flex-1 overflow-y-auto bg-[#0A0B0F]">
        <div className="w-full px-12 py-12">
          {/* Header Section */}
          <div className="mb-16">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="flex items-start gap-6">
                  <h1 className="text-3xl font-bold text-white">LucidlyDrops</h1>
                  <div className="flex items-center gap-2 border border-[#1a4fd4] px-1  rounded-sm">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center p-1">
                      <Image 
                        src="/images/icons/syUSD.svg" 
                        alt="syUSD" 
                        width={16} 
                        height={16}
                        className="w-8 h-8"
                      />
                    </div>
                    <span className="text-white text-sm font-medium text-[#1a4fd4]">syUSD</span>
                  </div>
                </div>
                <p className="text-[#9C9DA2]">Earn rewards by holding syUSD-syUSD or by staking it in a supported contract</p>
              </div>
            </div>
          </div>

          {/* Top 3 Winners */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getDisplayLeaderboard().slice(0, 3).map((entry) => (
                <div key={entry.rank} className={`relative px-4 py-6 rounded border ${getRankStyle(entry.rank)}`}>
                  <div className="flex items-center gap-4">
                    {/* Medal Icon */}
                    <div className="text-3xl">{getRankIcon(entry.rank)}</div>
                    
                    {/* Address with Avatar */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#B88AF8] to-[#9F6EE9] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {entry.address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-mono text-sm">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
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
                {getDisplayLeaderboard().slice(3, 12).map((entry) => (
                  <div 
                    key={`${entry.rank}-${entry.address}`}
                    className={`flex items-center justify-between p-4 rounded border transition-colors ${
                      isUserEntry(entry) 
                        ? "bg-gradient-to-r from-green-400/20 to-green-400/0 border-gray-400/30 hover:bg-green-400/20 py-3" 
                        : "border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {entry.rank === -1 ? (
                        <span className="text-white text-md py-1 rounded font-medium">
                          YOU
                        </span>
                      ) : (
                        <>
                          <span className="text-white font-medium w-4 text-center">{entry.rank}</span>
                          {isUserEntry(entry) && (
                            <span className="text-white text-md py-1 rounded font-medium">
                              YOU
                            </span>
                          )}
                        </>
                      )}
                      <span className="text-white font-mono text-sm">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </span>
                    </div>
                    <div className="text-white font-medium">
                      {entry.rewardsFormatted}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column - Ranks 13-21 */}
              <div className="space-y-2">
                {getDisplayLeaderboard().slice(12, 21).map((entry) => (
                  <div 
                    key={`${entry.rank}-${entry.address}`}
                    className={`flex items-center justify-between p-4 rounded border transition-colors ${
                      isUserEntry(entry) 
                        ? "bg-gradient-to-r from-green-400/20 to-green-400/0 border-gray-400/30 hover:bg-green-400/20 py-3" 
                        : "border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {entry.rank === -1 ? (
                        <span className="text-white text-md py-1 rounded font-medium">
                          YOU
                        </span>
                      ) : (
                        <>
                          <span className="text-white font-medium w-4 text-center">{entry.rank}</span>
                          {isUserEntry(entry) && (
                            <span className="text-white text-md py-1 rounded font-medium">
                              YOU
                            </span>
                          )}
                        </>
                      )}
                      <span className="text-white font-mono text-sm">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </span>
                    </div>
                    <div className="text-white font-medium">
                      {entry.rewardsFormatted}
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