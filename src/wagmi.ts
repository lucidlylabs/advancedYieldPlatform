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

export const config = createConfig({
  connectors,
  chains: [mainnet, base, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});
