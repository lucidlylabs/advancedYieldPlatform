import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import { ErrorBoundary } from 'react-error-boundary';
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
            <Head>
              <link rel="icon" href="/images/logo/logo.svg" />
              <title>Lucidly Finance</title>
              <meta property="og:image" content="/images/background/metaImage.svg" />
            </Head>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
