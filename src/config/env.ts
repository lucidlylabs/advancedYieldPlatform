export const USD_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      name: "syUSD",
      displayName: "Stable Yield USD",
      type: "usd",
      network: "Base",
      contract: "0xaefc11908fF97c335D16bdf9F2Bf720817423825",
      boringVaultAddress: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
      solverAddress: "0xF632c10b19f2a0451cD4A653fC9ca0c15eA1040b",
      shareAddress: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
      shareAddress_token_decimal: 6,
      rateProvider: "0x03D9a9cE13D16C7cFCE564f41bd7E85E5cde8Da6",
      image: "/images/icons/syUSD.svg",

      base: {
        image: "/images/logo/base.svg",
        rpc: "https://base.llamarpc.com",
        chainId: 8453,
        chainObject: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: { decimals: 18, name: "Ethereum", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://base.llamarpc.com"] },
            public: { http: ["https://base.llamarpc.com"] },
          },
        },
        tokens: [
          {
            name: "USDC",
            contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            decimal: 6,
            image: "/images/icons/usdc.svg",
          },
          {
            name: "USDS",
            contract: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
            decimal: 18,
            image: "/images/icons/usds.svg",
          },
          {
            name: "sUSDS",
            contract: "0x5875eEE11Cf8398102FdAd704C9E96607675467a",
            decimal: 18,
            image: "/images/icons/sUSDS.svg",
          },
        ],
      },

      // Ethereum Mainnet Configuration
      ethereum: {
        image: "/images/icons/eth-stable.svg",
        rpc: "https://eth.llamarpc.com",
        chainId: 1,
        chainObject: {
          id: 1,
          name: "Ethereum",
          network: "ethereum",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://eth.llamarpc.com"] },
            public: { http: ["https://eth.llamarpc.com"] },
          },
        },
        tokens: [
          {
            name: "USDC",
            contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            decimal: 6,
            image: "/images/icons/usdc.svg",
          },
          {
            name: "USDT",
            contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            decimal: 6,
            image: "/images/icons/usdt.svg",
          },
          {
            name: "USDS",
            contract: "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
            decimal: 18,
            image: "/images/icons/usds.svg",
          },
        ],
      },

      // Arbitrum Configuration
      arbitrum: {
        image: "/images/logo/arb.svg",
        rpc: "https://arbitrum.drpc.org",
        chainId: 42161,
        chainObject: {
          id: 42161,
          name: "Arbitrum",
          network: "arbitrum",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://arbitrum.drpc.org"] },
            public: { http: ["https://arbitrum.drpc.org"] },
          },
        },
        tokens: [
          {
            name: "USDC",
            contract: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            decimal: 6,
            image: "/images/icons/usdc.svg",
          },
          {
            name: "USDS",
            contract: "0x6491c05A82219b8D1479057361ff1654749b876b",
            decimal: 18,
            image: "/images/icons/USDS.svg",
          },
        ],
      },

      // Katana Configuration
      katana: {
        image: "/images/logo/katana.svg",
        rpc: "https://rpc.katana.network",
        chainId: 747474,
        chainObject: {
          id: 747474,
          name: "Katana",
          network: "katana",
          nativeCurrency: { decimals: 18, name: "ETH", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://rpc.katana.network"] },
            public: { http: ["https://rpc.katana.network"] },
          },
        },
        tokens: [
          {
            name: "vbUSDC",
            contract: "0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36", // TODO: Replace with real address
            decimal: 6,
            image: "/images/icons/usdc.svg",
          },
          {
            name: "vbUSDS",
            contract: "0x62D6A123E8D19d06d68cf0d2294F9A3A0362c6b3", // TODO: Replace with real address
            decimal: 18,
            image: "/images/icons/USDS.svg",
          },
          {
            name: "vbUSDT",
            contract: "0x2DCa96907fde857dd3D816880A0df407eeB2D2F2", // Native ETH (use zero address)
            decimal: 6,
            image: "/images/icons/usdt.svg",
          },
        ],
      },

      // Incentives Configuration
      incentives: {
        enabled: true,
        points: [
          {
            name: "Liquidity Land",
            image: "/images/icons/syUSD/liquidity_land.png",
            multiplier: 1.5,
            description:
              "Earn 1.5x Lucildy Drops  as bonus for Liquidity Land users ",
            link: "https://app.liquidity.land/project/Lucidly",
          },
          {
            name: "Ethena Sats",
            image: "/images/icons/syUSD/ethena.svg",
            multiplier: 1,
            description:
              "Points earned through protocol fund allocation strategies",
          },
          {
            name: "Resolv Points",
            image: "/images/icons/syUSD/resolv.svg",
            multiplier: 1,
            description:
              "Points earned through protocol fund allocation strategies",
          },
        ],
      },

      description: "Perpetual syUSD strategy on base network",
      apy: "https://api.lucidly.finance/services/getAPY?units=7d&poolAddress=0x279CAD277447965AF3d24a78197aad1B02a2c589",
      fallbackApy: "4.50%",
      cap_limit: "1,000,000",
      filled_cap: "800,000",
      show_cap: true,
      tvl: "https://api.lucidly.finance/services/aum_data?vaultName=syUSD",
      withdraw_request:
        "https://api.lucidly.finance/services/queueData?vaultAddress=0x279CAD277447965AF3d24a78197aad1B02a2c589&userAddress=",
      rpc: "https://base.llamarpc.com",
    },
    INCENTIVE: {
      network: "",
      comingSoon: true,
      contract: "",
      deposit_token: "",
      deposit_token_contract: "",
      tvl: "",
      rpc: "",
      description: "",
      apy: "",
    },
  },
};

export const ETH_STRATEGIES = {};

// Strategy address to name mapping configuration for charts and UI
export const STRATEGY_NAMES: { [address: string]: string } = {
  // Stable USD Strategy Names - Using the actual full addresses from your API

  // Main strategies based on your allocation chart - these are placeholder mappings
  // You need to replace these with the actual full addresses from your API response
  "0x2fA9...cDCC": "PT-sUSDF/USDC SiloV2 (7.5x)",
  "0xa32B...9BB1": "PT-iUSD/USDC Morpho (4x)",
  "0xd0bc...b89E": "Gauntlet Frontier USDC",
  "0x914f...Af86": "USR",
  "0x7985...15bb": "sUSDe/USDC AaveV3 (7x)",
  "0x1ed0...BD01": "RLP/USDC Morpho (4x)",
  "0x34a0...Ea14": "RLP",
  "0x56B3...813A": "sUSDe",
  "0x24a56bdA1e697Dc5b9802770DE476D509f02Ff8e": "WsUSR",

  // Add more strategy mappings as needed
  // "0x1234567890abcdef1234567890abcdef12345678": "Strategy Name Here",
};

// Helper function to get strategy name by address
export function getStrategyName(address: string): string {
  return STRATEGY_NAMES[address] || address;
}

// Helper function to get display name (truncated if no mapping exists)
export function getStrategyDisplayName(address: string): string {
  // First try exact match
  const exactName = getStrategyName(address);
  if (exactName !== address) {
    return exactName;
  }

  // If no exact match, try partial matching with truncated addresses
  const truncatedAddress =
    address.length > 10
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;

  const partialName = STRATEGY_NAMES[truncatedAddress];
  if (partialName) {
    return partialName;
  }

  // If no mapping exists, return truncated address
  return truncatedAddress;
}

// Helper function to check if an address has a name mapping
export function hasStrategyName(address: string): boolean {
  return STRATEGY_NAMES.hasOwnProperty(address);
}
