import { useEffect } from 'react';
import Head from "next/head";
import MainPage from './page';

export default function App() {
  useEffect(() => {
    // Dynamically import SDK to avoid SSR issues
    import('@farcaster/miniapp-sdk').then(({ sdk }) => {
      sdk.actions.ready();
    }).catch((error) => {
      // If SDK fails, just log it - app will still work
      console.log('Mini App SDK not available:', error);
    });
  }, []);

  return (
    <>
      <Head>
        <title>Lucidly - Advanced Yield Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Discover and earn from the best DeFi yield opportunities across multiple chains." />
        {/* Required: homeUrl must have embed metadata per Base docs */}
        <meta name="fc:miniapp" content={JSON.stringify({
          version: 'next',
          imageUrl: 'https://app.lucidly.finance/assets/farcaster/og-image.png',
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
      <MainPage />
    </>
  );
}
