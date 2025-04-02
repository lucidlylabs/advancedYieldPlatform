export const USD_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000",
      deposit_token: "USD.e",
      deposit_token_contract: "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      description: "Perpetual stable USD strategy on Sonic network",
      apy: "4.5%",
      incentives: "-",
      tvl: "5000000",
      rpc: "https://rpc.soniclabs.com",
    },
    INCENTIVE: {
      network: "Sonic",
      contract: "0x0000000000000000000000000000000000000000",
      deposit_token: "USD.e",
      deposit_token_contract: "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      description: "Perpetual incentivized USD strategy on Sonic network",
      apy: "7.5%",
      incentives: "2.0% in SONIC tokens",
      tvl: "6000000",
      rpc: "https://rpc.soniclabs.com",
    },
  },
};

export const BTC_STRATEGIES = {};

export const ETH_STRATEGIES = {};
