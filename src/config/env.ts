export const USD_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      name: "syUSD",
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
            name: "1.5x boost Liquidity Land",
            image: "/images/icons/syUSD/liquidity_land.png",
            multiplier: 1.0,
          },
          {
            name: "Ethena Sats",
            image: "/images/icons/syUSD/ethena.svg",
            description: "Earn loyalty points for long-term staking",
            multiplier: 1,
          },
          {
            name: "Resolv Points",
            image: "/images/icons/syUSD/resolv.svg",
            description: "Earn referral points for bringing new users",
            multiplier: 2.0,
          },
        ],
      },

      description: "Perpetual syUSD strategy on base network",
      apy: "https://api.lucidly.finance/services/getAPY?units=7d&poolAddress=0x279CAD277447965AF3d24a78197aad1B02a2c589",
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

export const BTC_STRATEGIES = {};

export const ETH_STRATEGIES = {};
