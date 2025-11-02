import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import { ErrorBoundary } from 'react-error-boundary';
import { Inter } from 'next/font/google';
import { BannerProvider } from '../contexts/BannerContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
import Head from 'next/head';

const client = new QueryClient();

function ErrorFallback({ error }: { error: Error }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong:</h2>
            <pre className="text-sm text-gray-600">{error.message}</pre>
        </div>
    );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider>
            <BannerProvider>
              <Head>
                <link rel="icon" type="image/png" href="/images/logo/Logomark_200_200.png" />
                <title>Lucidly Finance - Advanced Yield Platform</title>
                <meta property="og:title" content="Lucidly Finance - Advanced Yield Platform" />
                <meta property="og:description" content="Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance." />
                <meta property="og:image" content="https://app.lucidly.finance/images/icons/thumbnail.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="Lucidly Finance - Advanced Yield Platform for DeFi" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Lucidly Finance - Advanced Yield Platform" />
                <meta name="twitter:description" content="Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance." />
                <meta name="twitter:image" content="https://app.lucidly.finance/images/icons/thumbnail.png" />
                <meta name="twitter:creator" content="@LucidlyFinance" />
                <meta name="fc:miniapp" content={JSON.stringify({
                  version: 'next',
                  imageUrl: 'https://app.lucidly.finance/images/logo/Dark_Logomark_200_200.png',
                  button: {
                    title: 'Launch Lucidly',
                    action: {
                      type: 'launch_frame',
                      name: 'Lucidly',
                      url: 'https://app.lucidly.finance/farcaster',
                      splashImageUrl: 'https://app.lucidly.finance/images/logo/Dark_Logomark_200_200.png',
                      splashBackgroundColor: '#080B17',
                    },
                  },
                })} />
              </Head>
              <Component {...pageProps} />
            </BannerProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default MyApp;