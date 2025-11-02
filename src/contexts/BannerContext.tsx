import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface BannerContextType {
  isBannerVisible: boolean;
  hideBanner: () => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const hideBanner = () => {
    setIsBannerVisible(false);
  };

  return (
    <BannerContext.Provider value={{ isBannerVisible, hideBanner }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}

// Hook to get the total header height including banner
export function useHeaderHeight() {
  const { isBannerVisible } = useBanner();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);

    // Update on resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: 64px banner (with padding) + 52px nav = 116px total
  // Desktop: 40px banner + 52px nav = 92px total
  return isBannerVisible ? (isMobile ? 116 : 92) : 52;
}
