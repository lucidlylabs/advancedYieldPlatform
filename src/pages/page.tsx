import React, { useState } from 'react';
// import { ExternalLink } from "lucide-react";
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
  const [selectedChainName, setSelectedChainName] = useState("Ethereum");

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold">AdvancedYield</div>
          <nav className="hidden md:flex space-x-1">
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedSubPage === SubPage.Portfolio
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedSubPage(SubPage.Portfolio)}
            >
              Portfolio
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedSubPage === SubPage.Yield
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedSubPage(SubPage.Yield)}
            >
              Yield
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedSubPage === SubPage.Markets
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedSubPage(SubPage.Markets)}
            >
              Markets
            </button>
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