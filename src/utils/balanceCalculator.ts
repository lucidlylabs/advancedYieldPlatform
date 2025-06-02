import { ethers } from 'ethers';
import { USD_STRATEGIES } from '../config/env';

interface TokenBalance {
  chain: string;
  token: string;
  balance: number;
  usdValue: number;
}

interface ChainConfig {
  tokens: {
    name: string;
    contract: string;
    decimal: number;
    image: string;
  }[];
  rpc: string;
}

interface StrategyConfig {
  network: string;
  contract: string;
  boringVaultAddress: string;
  solverAddress: string;
  shareAddress: string;
  shareAddress_token_decimal: number;
  base: ChainConfig;
  ethereum: ChainConfig;
  arbitrum: ChainConfig;
  description: string;
  apy: string;
  incentives: string;
  cap_limit: string;
  filled_cap: string;
  show_cap: boolean;
  tvl: string;
  rpc: string;
}

// Cache for providers to avoid creating new ones for each request
const providerCache: { [key: string]: ethers.JsonRpcProvider } = {};

function getProvider(rpcUrl: string): ethers.JsonRpcProvider {
  if (!providerCache[rpcUrl]) {
    providerCache[rpcUrl] = new ethers.JsonRpcProvider(rpcUrl);
  }
  return providerCache[rpcUrl];
}

export async function calculateTotalBalanceInUSD(
  address: string,
  provider: ethers.Provider
): Promise<number> {
  const balances: TokenBalance[] = [];
  const strategy = USD_STRATEGIES.PERPETUAL_DURATION.STABLE as StrategyConfig;

  // Check each chain configuration
  const chains = ['base', 'ethereum', 'arbitrum'] as const;
  
  for (const chain of chains) {
    const chainConfig = strategy[chain];
    if (!chainConfig?.tokens) continue;

    const chainProvider = getProvider(chainConfig.rpc);
    
    for (const token of chainConfig.tokens) {
      try {
        const tokenContract = new ethers.Contract(
          token.contract,
          ['function balanceOf(address) view returns (uint256)'],
          chainProvider
        );

        const balance = await tokenContract.balanceOf(address);
        const formattedBalance = Number(ethers.formatUnits(balance, token.decimal));
        
        // For stablecoins, we assume 1:1 USD value
        const usdValue = formattedBalance;
        
        balances.push({
          chain,
          token: token.name,
          balance: formattedBalance,
          usdValue
        });
      } catch (error) {
        console.error(`Error fetching balance for ${token.name} on ${chain}:`, error);
      }
    }
  }

  // Calculate total USD value
  const totalUSDValue = balances.reduce((sum, token) => sum + token.usdValue, 0);
  
  return totalUSDValue;
}

// Function to update filled_cap in env.ts
export async function updateFilledCap(
  address: string,
  provider: ethers.Provider
): Promise<void> {
  const totalBalance = await calculateTotalBalanceInUSD(address, provider);
  const formattedBalance = totalBalance.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  // Update the filled_cap in the configuration
  USD_STRATEGIES.PERPETUAL_DURATION.STABLE.filled_cap = formattedBalance;
}

// Function to get real-time filled cap value
export async function getRealTimeFilledCap(
  address: string,
  provider: ethers.Provider
): Promise<string> {
  const totalBalance = await calculateTotalBalanceInUSD(address, provider);
  return totalBalance.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Function to get real-time filled cap value with caching
let lastFetchedTime = 0;
let cachedFilledCap: string | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function getCachedFilledCap(
  address: string,
  provider: ethers.Provider
): Promise<string> {
  const now = Date.now();
  
  // Return cached value if it's still valid
  if (cachedFilledCap && (now - lastFetchedTime) < CACHE_DURATION) {
    return cachedFilledCap;
  }
  
  // Fetch new value
  const newValue = await getRealTimeFilledCap(address, provider);
  cachedFilledCap = newValue;
  lastFetchedTime = now;
  
  return newValue;
}

let updateInterval: NodeJS.Timeout | null = null;

// Function to start periodic updates of filled_cap
export function startFilledCapUpdates(
  address: string,
  provider: ethers.Provider,
  intervalMs: number = 30000 // Default to 30 seconds
): void {
  // Clear any existing interval
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Initial update
  updateFilledCap(address, provider).catch(console.error);

  // Set up periodic updates
  updateInterval = setInterval(async () => {
    try {
      await updateFilledCap(address, provider);
    } catch (error) {
      console.error('Error updating filled_cap:', error);
    }
  }, intervalMs);
}

// Function to stop periodic updates
export function stopFilledCapUpdates(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
} 