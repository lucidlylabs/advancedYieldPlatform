export const USD_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USDC.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      deposit_token_image: "/images/icons/usdc.svg",
      description: "Perpetual stable USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "None",
      cap_limit: "0", // Replace with actual cap limit
      filled_cap: "0", // Replace with actual filled cap
      show_cap: true,
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
    INCENTIVE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USDC.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "Perpetual incentivized USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "0.0% in SONIC tokens", // Replace with actual incentive rate
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
  },
  "30_DAYS": {
    STABLE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USD.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "30-day stable USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "-",
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
    INCENTIVE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USD.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "30-day incentivized USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "0.0% in SONIC tokens", // Replace with actual incentive rate
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
  },
  "60_DAYS": {
    STABLE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USD.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "60-day stable USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "-",
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
    INCENTIVE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USD.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "60-day incentivized USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "0.0% in SONIC tokens", // Replace with actual incentive rate
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
  },
  "180_DAYS": {
    STABLE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USD.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "180-day stable USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "-",
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
    INCENTIVE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000", // Replace with actual contract address
      deposit_token: "USD.e",
      deposit_token_contract: "0x0000000000000000000000000000000000000000", // Replace with actual token contract
      description: "180-day incentivized USD strategy on Sonic network",
      apy: "0.0%", // Replace with actual APY
      incentives: "0.0% in SONIC tokens", // Replace with actual incentive rate
      tvl: "0", // Replace with actual TVL
      rpc: "https://rpc.example.com", // Replace with actual RPC endpoint
    },
  },
};

export const BTC_STRATEGIES = {};

export const ETH_STRATEGIES = {}; 