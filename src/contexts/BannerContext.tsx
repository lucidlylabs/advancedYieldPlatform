import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  return isBannerVisible ? 92 : 52; // 40px banner + 52px nav = 92px total
}
