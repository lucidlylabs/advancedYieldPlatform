export const USD_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      network: "base",
      contract: "0xaefc11908fF97c335D16bdf9F2Bf720817423825",
      boringVaultAddress: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
      solverAddress:"0x1d82e9bCc8F325caBBca6E6A3B287fE586536805",
      shareAddress:"0x279CAD277447965AF3d24a78197aad1B02a2c589",
      deposit_token: "USDS",
      deposit_token_contract: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
      deposit_token_decimal: 18,
      deposit_token_image: "/images/icons/usdc.svg",
      deposit_token_2: "USDS",
      deposit_token_contract_2: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
      deposit_token_image_2: "/images/icons/usdc.svg",
      deposit_token_3: "sUSDS",
      deposit_token_contract_3: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
      deposit_token_image_3: "/images/icons/usdc.svg",
      description: "Perpetual stable USD strategy on Sonic network",
      apy: "4.5%",
      incentives: "None",
      cap_limit: "1,000,000",
      filled_cap: "800,000",
      show_cap: true,
      tvl: "5000000",
      rpc: "https://base.llamarpc.com",
    },
    INCENTIVE: {
      network: "Sonic",
      contract: "0x2F7397FD7D49E5b636eF44503771B17EDEd67620",
      boringVaultAddress: "0xB964ca354A074fBf05765DaC640e01799c9E7f9E",
      deposit_token: "USDS",
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
