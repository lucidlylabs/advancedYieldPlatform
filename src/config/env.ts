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
            isWithdrawable: true,
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
        rpc: "https://arb1.arbitrum.io/rpc",
        chainId: 42161,
        chainObject: {
          id: 42161,
          name: "Arbitrum",
          network: "arbitrum",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://arb1.arbitrum.io/rpc"] },
            public: { http: ["https://arb1.arbitrum.io/rpc"] },
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
          // {
          //   name: "Ethena Sats",
          //   image: "/images/icons/syUSD/ethena.svg",
          //   multiplier: 1,
          //   description:
          //     "Points earned through protocol fund allocation strategies",
          // },
          {
            name: "Resolv Points",
            image: "/images/icons/syUSD/resolv.svg",
            multiplier: 1,
            description:
              "Points earned through protocol fund allocation strategies",
          },
          // {
          //   name: "XPL Rewards",
          //   image: "/images/icons/syUSD/XPL.png",
          //   multiplier: 1,
          //   description:
          //     "Points earned through protocol fund allocation strategies",
          // },
        ],
      },

      description: "Perpetual syUSD strategy on base network",
      apy: "https://j3zbikckse.execute-api.ap-south-1.amazonaws.com/prod/api/base-apy/today-7d-ma",
      cap_limit: "",
      filled_cap: "",
      show_cap: true,
      tvl: "https://api.lucidly.finance/services/aum_data?vaultName=syUSD",
      withdraw_request:
        "https://api.lucidly.finance/services/queueData?vaultAddress=0x279CAD277447965AF3d24a78197aad1B02a2c589&userAddress=",
      rpc: "https://base.llamarpc.com",
    },
    syHLP: {
      name: "syHLP",
      displayName: "Stable Yield HLP",
      type: "usd",
      network: "HyperEVM",
      contract: "0xabbA9E382f9b14441E60B9E68559e3a22762dFb6",
      boringVaultAddress: "0x592B45AeaeaaA75D58FD097a7254bA3F56125904",
      solverAddress: "0x9B299494Cd9bb88ecdFeA2a43C4b91391fB02275",
      shareAddress: "0x592B45AeaeaaA75D58FD097a7254bA3F56125904",
      shareAddress_token_decimal: 6,
      rateProvider: "0x98C0B9042C6142F3cBc5bed58a7BF412752737b5",
      image: "/images/icons/syHLP.svg",

      hyperEVM: {
        image: "/images/networks/hyperEVM.svg",
        rpc: "https://rpc.hypurrscan.io",
        chainId: 999,
        chainObject: {
          id: 999,
          name: "HyperEVM",
          network: "hyperEVM",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://rpc.hypurrscan.io", "https://hyperliquid.drpc.org"] },
            public: { http: ["https://rpc.hypurrscan.io", "https://hyperliquid.drpc.org"] },
          },
          blockExplorers: {
            default: { name: "HyperEVMScan", url: "https://hyperevmscan.io" },
          },
        },
        tokens: [
          {
            name: "USDT0",
            contract: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
            decimal: 6,
            image: "/images/icons/usdt0.png",
            isWithdrawable: true,
          },
        ],
      },
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
        ],
      },

      incentives: {
        enabled: false,
        points: [],
      },

      description: "",
      apy: "",
      cap_limit: "",
      filled_cap: "",
      show_cap: false,
      tvl: "https://api.lucidly.finance/services/aum_data?vaultName=syHLP",
      withdraw_request: "",
      rpc: "",
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

export const ETH_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      name: "syETH",
      displayName: "Stable Yield ETH",
      type: "eth",
      network: "Base",
      contract: "", // TODO: Add contract address
      boringVaultAddress: "", // TODO: Add vault address
      solverAddress: "", // TODO: Add solver address
      shareAddress: "", // TODO: Add share address
      shareAddress_token_decimal: 18,
      rateProvider: "", // TODO: Add rate provider address
      image: "/images/icons/syETH.svg",

      // Base Network Configuration
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
            name: "WETH",
            contract: "", // TODO: Add WETH contract address
            decimal: 18,
            image: "/images/icons/weth.svg",
            isWithdrawable: true,
          },
        ],
      },

      // No incentives for syETH (can be configured later)
      incentives: {
        enabled: false,
        points: [],
      },

      description: "Perpetual syETH strategy on Base network",
      apy: "", // TODO: Add APY endpoint
      cap_limit: "0",
      filled_cap: "0",
      show_cap: false,
      tvl: "https://api.lucidly.finance/services/aum_data?vaultName=syETH",
      ethPrice: "https://api.lucidly.finance/services/currency_rates?assetName=ETH",
      withdraw_request: "", // TODO: Add withdraw request endpoint
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

export const BTC_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      name: "syBTC",
      displayName: "Stable Yield BTC",
      type: "btc",
      network: "Arbitrum",
      contract: "0xdE4FD4DD35F78389CDaCF111D7Ba31A31A61b2a7", // drone-0
      boringVaultAddress: "0xC0D48269f8d6E427B0637F5e0695De11C8E75F6c", // vault_address
      solverAddress: "0x2f2e71bdd62f87FCF8d19d234CA3bd903848D3a5", // QueueSolver
      shareAddress: "0xC0D48269f8d6E427B0637F5e0695De11C8E75F6c", // vault_address (same as boringVaultAddress)
      shareAddress_token_decimal: 8, // decimals
      rateProvider: "0xDda6274D69F464172CC7F52194d16FF27ec0D5A6", // accountant_address
      image: "/images/icons/btc-stable.svg", // Using btc-stable.svg since syBTC.svg doesn't exist      // Arbitrum Network Configuration
      arbitrum: {
        image: "/images/logo/arb.svg",
        rpc: "https://arb1.arbitrum.io/rpc", // Arbitrum mainnet RPC
        chainId: 42161,
        chainObject: {
          id: 42161,
          name: "Arbitrum One",
          network: "arbitrum",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: {
            default: { http: ["https://arb1.arbitrum.io/rpc"] },
            public: { http: ["https://arb1.arbitrum.io/rpc"] },
          },
        },
        tokens: [
          {
            name: "wBTC",
            contract: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // eBTC on Arbitrum One
            decimal: 8,
            image: "/images/icons/wbtc.png", // Using wbtc icon for eBTC (or update to ebtc icon if available)
            isWithdrawable: true,
          },
        ],
      },

      // No incentives for syBTC
      incentives: {
        enabled: false,
        points: [],
      },

      description: "Perpetual syBTC strategy on Arbitrum network",
      apy: "", // Graph data not available for syBTC
      cap_limit: "0", // No cap limit
      filled_cap: "0",
      show_cap: false,
      tvl: "https://api.lucidly.finance/services/aum_data?vaultName=syBTC",
      wbtcPrice:
        "https://api.lucidly.finance/services/currency_rates?assetName=BTC",
      withdraw_request: "", // Graph data not available for syBTC
      rpc: "https://arb1.arbitrum.io/rpc",
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

// Strategy address to name mapping configuration for charts and UI
export const STRATEGY_NAMES: { [address: string]: string } = {
  // Stable USD Strategy Names - Using the actual full addresses from your API

  // Main strategies based on your allocation chart - using full addresses from API response
  "0x2fA924E8474726DEc250Eead84f4f34E063AcDCC": "PT-sUSDF/USDC SiloV2 (7.5x)",
  "0xa32BA04A547e1c6419D3fcF5Bbdb7461B3d19BB1": "PT-iUSD/USDC Morpho (4x)",
  "0xd0bc4920F1B43882b334354FfAb23c9E9637b89E": "Gauntlet Frontier USDC",
  "0x914f1e34Cd70C1d59392E577d58FC2dDAAEdAf86": "USR",
  "0x79857aFB972E43c7049aE3c63274FC5eF3B815bb": "sUSDe/USDC AaveV3 (7x)",
  "0x1ed0A3d7562066C228A0bb3FED738182F03aBD01": "RLP/USDC Morpho (4x)",
  "0x34a06c87817EC6683Bc1788dBC9AA4038900Ea14": "RLP",
  "0x56B3C60B4Ea708A6FDA0955B81dF52148E96813A": "sUSDe",
  "0x2f6679945c215729608f9896F081D2aF42B39B45": "Fluid USDT0",
  "0xd484c3501b7478bc9d52fb7455139c8b3141a911": "syrupUSDC/USDC Morpho (5x)",
  "0x2F45b61B90B821EFDb4525F89162cfd857ef51fD": "USDT0",
  "0x24a56bdA1e697Dc5b9802770DE476D509f02Ff8e": "WsUSR",
  "0x511E17508b60A464704Dbccbc1E402C35A715bc5": "siUSD/USDC Morpho (10x)",

  // syBTC Strategy Names
  "0x692A1752542259BCdE867bb17a06307FE78374c4": "syBTC Drone",
  "0xC0D48269f8d6E427B0637F5e0695De11C8E75F6c": "syBTC Vault",
  "0xD2e11B3E6f88bF1712cEAAE558D030da0c970F79": "syBTC Queue Solver",
  "0xDda6274D69F464172CC7F52194d16FF27ec0D5A6": "syBTC Accountant",

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
