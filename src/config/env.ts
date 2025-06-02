export const USD_STRATEGIES = {
  PERPETUAL_DURATION: {
    STABLE: {
      network: "base",
      contract: "0xaefc11908fF97c335D16bdf9F2Bf720817423825",
      boringVaultAddress: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
      solverAddress: "0xF632c10b19f2a0451cD4A653fC9ca0c15eA1040b",
      shareAddress: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
      shareAddress_token_decimal: 6,
      deposit_token: "USDC",
      deposit_token_contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      deposit_token_decimal: 6,
      deposit_token_image: "/images/icons/usdc.svg",
      deposit_token_2: "USDS",
      deposit_token_2_decimal: 18,
      deposit_token_contract_2: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
      deposit_token_image_2: "/images/icons/usds.svg",
      deposit_token_3: "sUSDS",
      deposit_token_3_decimal: 18,
      deposit_token_contract_3: "0x5875eEE11Cf8398102FdAd704C9E96607675467a",
      deposit_token_image_3: "/images/icons/sUSDS.svg",
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
      network: "",
      comingSoon: true,
      contract: "",
      deposit_token: "",
      deposit_token_contract: "",
      tvl: "",
      rpc: "",
      description: "",
      apy: "",
      incentives: "",
    },
  },
};

export const BTC_STRATEGIES = {};

export const ETH_STRATEGIES = {};
