import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, mainnet, sepolia, Chain, arbitrum } from "wagmi/chains";

const sonic: Chain = {
  id: 146, // Sonic mainnet chain ID (0x92)
  name: "Sonic",
  nativeCurrency: {
    name: "Sonic",
    symbol: "S",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.soniclabs.com"] },
    public: { http: ["https://rpc.soniclabs.com"] },
  },
  blockExplorers: {
    default: {
      name: "Sonic Explorer",
      url: "https://explorer.sonic.oasys.games",
    },
  },
  testnet: false,
};

export const config = getDefaultConfig({
  appName: "Advanced Yield Platform",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [
    mainnet,
    base,
    sonic,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [sepolia] : []),
  ],
  ssr: true,
});
