import React, { useState } from 'react';
import Image from 'next/image';
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from '../components/ui/header';
import PortfolioSubpage from './portfolio-subpage';
import YieldSubpage from './yield-subpage';
import MarketsSubpage from './markets-subpage';

enum SubPage {
  Portfolio = "portfolio",
  Yield = "yield",
  Markets = "markets",
}

export default function Page() {
  const [selectedSubPage, setSelectedSubPage] = useState<SubPage>(SubPage.Markets);

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Image
              src="/images/logo/logo-desktop.svg"
              alt="Lucidity Logo"
              width={140}
              height={32}
              priority
            />
          </div>
          <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] mx-4"></div>
          <nav className="hidden md:flex">
            <div className="relative flex">
              <button
                className={`px-4 py-4 text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Portfolio
                    ? "text-[#B88AF8]"
                    : "text-white hover:text-gray-300"
                }`}
                onClick={() => setSelectedSubPage(SubPage.Portfolio)}
              >
                Portfolio
                {selectedSubPage === SubPage.Portfolio && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#B88AF8]"></div>
                )}
              </button>
              
              <button
                className={`px-4 py-4 text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Yield
                    ? "text-[#B88AF8]"
                    : "text-white hover:text-gray-300"
                }`}
                onClick={() => setSelectedSubPage(SubPage.Yield)}
              >
                Earn
                {selectedSubPage === SubPage.Yield && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#B88AF8]"></div>
                )}
              </button>
              
              <button
                className={`px-4 py-4 text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Markets
                    ? "text-[#B88AF8]"
                    : "text-white hover:text-gray-300"
                }`}
                onClick={() => setSelectedSubPage(SubPage.Markets)}
              >
                Markets
                {selectedSubPage === SubPage.Markets && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#B88AF8]"></div>
                )}
              </button>
            </div>
          </nav>
        </div>
        <CustomConnectButton />
      </Header>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {selectedSubPage === SubPage.Portfolio ? <PortfolioSubpage /> : 
         selectedSubPage === SubPage.Yield ? <YieldSubpage /> : 
         <MarketsSubpage />}
      </main>
    </div>
  );
}