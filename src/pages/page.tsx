import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from "../components/ui/header";
import PortfolioSubpage from "./portfolio-subpage";
import YieldSubpage from "./earn-subpage";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is already verified from localStorage
  useEffect(() => {
    const verified = localStorage.getItem("isVerified");
    if (verified === "true") {
      setIsVerified(true);
      setIsCodePopupOpen(false);
    }
  }, []);

  const handleVerifyCode = async (code: string) => {
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode: code }),
      });

      if (response.ok) {
        setIsVerified(true);
        setIsCodePopupOpen(false);
        setVerificationError("");
        localStorage.setItem("isVerified", "true");
      } else {
        const data = await response.json();
        setVerificationError(
          data.message || "Incorrect code. Please try again."
        );
        setIsVerified(false);
        setIsCodePopupOpen(true);
      }
    } catch (error) {
      // console.error("Error verifying code:", error);
      setVerificationError("An error occurred during verification.");
      setIsVerified(false);
      setIsCodePopupOpen(true);
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
      <Header onNavigateToDeposit={handleNavigateToDeposit}>
        <div className="flex items-stretch h-full">
          <div className="flex items-center">
            <div
              className="cursor-pointer"
              onClick={() => {
                window.location.href = "https://lucidly.finance";
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
                className={`px-6 py-4 text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Yield
                    ? "text-[#B88AF8]"
                    : "text-white hover:text-gray-300"
                }`}
                onClick={() => {
                  setSelectedSubPage(SubPage.Yield);
                  setDepositParams(null);
                }}
              >
                Earn
                {selectedSubPage === SubPage.Yield && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B88AF8]"></div>
                )}
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
              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-6 py-4 text-sm transition-colors relative `}
                onClick={() => {
                  window.open(
                    "https://docs.lucidly.finance",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Docs
              </button>
            </div>
          </nav>
          <div className="w-[1px] bg-[rgba(255,255,255,0.1)] mx-4"></div>

          <div className="flex flex-row gap-2">
            <CustomConnectButton />
            <button
              className="md:hidden ml-auto pr-4 text-white"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
        {isMobileMenuOpen && (
          <div className="inset-0 flex flex-col pb-2 items-center justify-center space-y-4 text-white">
            <button
              className="text-xl"
              onClick={() => {
                setSelectedSubPage(SubPage.Yield);
                setDepositParams(null);
                setIsMobileMenuOpen(false);
              }}
            >
              Earn
            </button>

            <button
              className="text-xl"
              onClick={() => {
                setSelectedSubPage(SubPage.Markets);
                setIsMobileMenuOpen(false);
              }}
            >
              Yields
            </button>

            <button
              className="text-xl"
              onClick={() => {
                setSelectedSubPage(SubPage.Portfolio);
                setIsMobileMenuOpen(false);
              }}
            >
              Portfolio
            </button>
          </div>
        )}
        </div>

      </Header>

      <main className="flex-1">{renderSubPage()}</main>
    </div>
  );
}
