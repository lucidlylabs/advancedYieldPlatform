import { useEffect } from 'react';
import Head from "next/head";

export default function App() {
  useEffect(() => {
    // Dynamically import SDK to avoid SSR issues
    import('@farcaster/miniapp-sdk').then(({ sdk }) => {
      sdk.actions.ready();
      
      // Redirect to main app after SDK is ready
      setTimeout(() => {
        window.location.href = 'https://app.lucidly.finance';
      }, 1000); // 1 second delay to show splash screen
    }).catch(() => {
      // If SDK fails, still redirect to main app
      setTimeout(() => {
        window.location.href = 'https://app.lucidly.finance';
      }, 1000);
    });
  }, []);

  return (
    <>
      <Head>
        <title>Lucidly - Advanced Yield Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Discover and earn from the best DeFi yield opportunities across multiple chains." />
      </Head>
      {/* Your app content goes here */}
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="text-center space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Lucidly</h1>
            <p className="text-blue-200">Advanced Yield Platform</p>
          </div>
        </div>
      </main>
    </>
  );
}
