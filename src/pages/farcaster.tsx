import Head from "next/head";
import { useEffect, useState } from "react";

export default function FarcasterApp() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Dynamically import the SDK to avoid SSR issues
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Initialize the SDK
        await sdk.actions.ready();
        setIsReady(true);

        // Get user information
        const userInfo = await sdk.actions.signIn({ nonce: 'lucidly-miniapp' });
        setUser(userInfo);

        // After successful initialization, redirect to main app
        setTimeout(() => {
          window.location.href = 'https://dev.lucidly.finance';
        }, 2000); // 2 second delay to show splash screen
      } catch (error) {
        console.error('Failed to initialize Mini App:', error);
        // If initialization fails, still redirect to main app
        setTimeout(() => {
          window.location.href = 'https://dev.lucidly.finance';
        }, 2000);
      }
    };

    // Check if we're in a Mini App environment
    const url = new URL(window.location.href);
    const isMini = url.pathname.startsWith('/farcaster') || 
                   url.searchParams.get('miniApp') === 'true';

    if (isMini) {
      initializeMiniApp();
    }
  }, []);

  return (
    <>
      <Head>
        <title>Lucidly - Advanced Yield Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Discover and earn from the best DeFi yield opportunities across multiple chains." />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Lucidly</h1>
            <p className="text-blue-200">Advanced Yield Platform</p>
          </div>

          {/* Loading State */}
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-blue-200">Loading...</p>
          </div>
        </div>
      </main>
    </>
  );
}
