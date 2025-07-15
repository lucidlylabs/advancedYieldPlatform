import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  bitgetWallet,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { base, mainnet, sepolia, Chain, arbitrum } from "wagmi/chains";
import { createConfig, http } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'YOUR_PROJECT_ID';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        rainbowWallet,
        bitgetWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'Advanced Yield Platform',
    projectId,
  }
);

// Katana custom chain definition
export const katana: Chain = {
  id: 747474,
  name: "Katana",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://rpc.katana.network"] },
    public: { http: ["https://rpc.katana.network"] },
  },
  blockExplorers: {
    default: { name: "Katana Explorer", url: "https://explorer.katanarpc.com/" },
  },
  testnet: false,
  iconUrl: "/images/logo/katana.svg", // <-- Add this line
  iconBackground: "#fff",             // <-- Optional: set a background color
};

export const config = createConfig({
  connectors,
  chains: [mainnet, base, arbitrum, katana],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [katana.id]: http("https://rpc.katana.network"),
  },
  ssr: true,
});
