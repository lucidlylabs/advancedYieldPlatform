import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, mainnet, sepolia, Chain, arbitrum } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Advanced Yield Platform",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [mainnet, base, arbitrum],
  ssr: true,
});
