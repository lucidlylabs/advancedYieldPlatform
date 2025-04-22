import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from "../components/ui/header";
import PortfolioSubpage from "./portfolio-subpage";
import YieldSubpage from "./yield-subpage";
import MarketsSubpage from "./markets-subpage";
import CodeVerificationPopup from "@/components/ui/CodeVerificationPopup";

enum SubPage {
  Portfolio = "portfolio",
  Yield = "yield",
  Markets = "markets",
}

export default function Page() {
  const [selectedSubPage, setSelectedSubPage] = useState<SubPage>(
    SubPage.Yield
  );
  const [depositParams, setDepositParams] = useState<{
    asset: string;
    duration: string;
    strategy: string;
  } | null>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [isCodePopupOpen, setIsCodePopupOpen] = useState(true);
  const [verificationError, setVerificationError] = useState("");

  const handleVerifyCode = (code: string) => {
    if (code === process.env.NEXT_PUBLIC_BETA_ACCESS_CODE) {
      setIsVerified(true);
      setIsCodePopupOpen(false);
      setVerificationError("");
    } else {
      setVerificationError("Incorrect code. Please try again.");
    }
  };

  const handleNavigateToDeposit = (params: {
    asset: string;
    duration: string;
    strategy: string;
  }) => {
    setSelectedSubPage(SubPage.Yield);
    setDepositParams(params);
  };

  const renderSubPage = () => {
    switch (selectedSubPage) {
      case SubPage.Portfolio:
        return <PortfolioSubpage />;
      case SubPage.Yield:
        if (!isVerified) {
          return (
            <CodeVerificationPopup
              isOpen={isCodePopupOpen}
              onClose={() => {}}
              onVerify={handleVerifyCode}
              error={verificationError}
            />
          );
        }
        return <YieldSubpage depositParams={depositParams} />;
      case SubPage.Markets:
        return <MarketsSubpage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onNavigateToDeposit={handleNavigateToDeposit}
      >
        <div className="flex items-stretch h-full">
          <div className="flex items-center pl-3">
            <div 
              className="cursor-pointer" 
              onClick={() => {
                setSelectedSubPage(SubPage.Yield);
                setDepositParams(null);
              }}
            >
              <Image
                src="/images/logo/logo-desktop.svg"
                alt="Lucidity Logo"
                width={80}
                height={16}
                priority
              />
            </div>
          </div>
          <div className="w-[1px] bg-[rgba(255,255,255,0.1)] mx-4"></div>
          <nav className="hidden md:flex">
            <div className="relative flex">
              <button
                className={`px-6 py-4 text-sm transition-colors relative ${selectedSubPage === SubPage.Yield ? "text-[#B88AF8]" : "text-white hover:text-gray-300"}`}
                onClick={() => {
                  setSelectedSubPage(SubPage.Yield);
                  setDepositParams(null);
                }}
              >
                Earn
                {selectedSubPage === SubPage.Yield && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B88AF8]"></div>}
              </button>

              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-6 py-4 text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Markets
                    ? "text-[#B88AF8]"
                    : "text-white hover:text-gray-300"
                }`}
                onClick={() => setSelectedSubPage(SubPage.Markets)}
              >
                Yields
                {selectedSubPage === SubPage.Markets && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B88AF8]"></div>
                )}
              </button>

              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-6 py-4 text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Portfolio
                    ? "text-[#B88AF8]"
                    : "text-white hover:text-gray-300"
                }`}
                onClick={() => setSelectedSubPage(SubPage.Portfolio)}
              >
                Portfolio
                {selectedSubPage === SubPage.Portfolio && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B88AF8]"></div>
                )}
              </button>
            </div>
          </nav>
        </div>
        <CustomConnectButton />
      </Header>

      <main className="flex-1">
        {renderSubPage()}
      </main>
    </div>
  );
}
