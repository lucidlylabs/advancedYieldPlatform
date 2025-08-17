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
      } catch (error) {
        console.error('Failed to initialize Mini App:', error);
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

      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Lucidly</h1>
            <p className="text-blue-200">Advanced Yield Platform</p>
          </div>

          {/* Status Indicator */}
          {!isReady && (
            <div className="bg-blue-800/50 rounded-lg p-4 text-center">
              <p className="text-blue-200">Initializing Mini App...</p>
            </div>
          )}

          {/* User Info */}
          {user && (
            <div className="bg-white/10 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Welcome!</h2>
              <p className="text-sm text-blue-200">
                Connected as: {user.username || user.fid}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white/10 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center">DeFi Yield Opportunities</h2>
            
            <div className="space-y-3">
              <div className="bg-white/5 rounded p-3">
                <h3 className="font-medium">Base Chain</h3>
                <p className="text-sm text-blue-200">Earn up to 12% APY</p>
              </div>
              
              <div className="bg-white/5 rounded p-3">
                <h3 className="font-medium">Ethereum</h3>
                <p className="text-sm text-blue-200">Earn up to 8% APY</p>
              </div>
              
              <div className="bg-white/5 rounded p-3">
                <h3 className="font-medium">Stablecoins</h3>
                <p className="text-sm text-blue-200">Earn up to 15% APY</p>
              </div>
            </div>

            <button 
              onClick={() => window.open('https://dev.lucidly.finance', '_blank')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Explore Opportunities
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-blue-300">
            <p>Powered by Farcaster Mini Apps</p>
          </div>
        </div>
      </main>
    </>
  );
}
