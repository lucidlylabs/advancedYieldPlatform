import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from "../components/ui/header";
import PortfolioSubpage from "./portfolio";
import YieldSubpage from "./earn";
import MarketsSubpage from "./yields";
import CodeVerificationPopup from "@/components/ui/CodeVerificationPopup";

enum SubPage {
  Portfolio = "portfolio",
  Yield = "yield",
  Markets = "markets",
}

export default function Page() {
  const router = useRouter();
  const [selectedSubPage, setSelectedSubPage] = useState<SubPage>(
    SubPage.Yield
  );

  // Check the current route and set the appropriate subpage
  useEffect(() => {
    const path = router.pathname;
    if (path === '/portfolio') {
      setSelectedSubPage(SubPage.Portfolio);
    } else if (path === '/yields') {
      setSelectedSubPage(SubPage.Markets);
    } else if (path === '/earn') {
      setSelectedSubPage(SubPage.Yield);
    }
  }, [router.pathname]);
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
    // Check the current route and render appropriate component
    const path = router.pathname;
    
    if (path === '/portfolio') {
      return <PortfolioSubpage />;
    } else if (path === '/yields') {
      return <MarketsSubpage />;
    } else if (path === '/earn') {
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
    }
    
    // Default behavior for the main page
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
    <div className="min-h-screen flex flex-col pt-[52px]">
      <Header onNavigateToDeposit={handleNavigateToDeposit}>
      <div className="flex items-center justify-between w-full px-4 sm:px-0">
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
          <div className="w-[1px] bg-[rgba(255,255,255,0.1)] ml-4 hidden sm:block"></div>
          <nav className="hidden md:flex">
            <div className="relative flex">
              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Yield
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/earn');
                }}
              >
                Earn
                {selectedSubPage === SubPage.Yield && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button>

              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Markets
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/yields');
                }}
              >
                Yields
                {selectedSubPage === SubPage.Markets && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button>

              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  selectedSubPage === SubPage.Portfolio
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/portfolio');
                }}
              >
                Portfolio
                {selectedSubPage === SubPage.Portfolio && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button>
              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative text-[#9C9DA2] hover:text-gray-300`}
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
        </div>
        <div className="flex flex-row gap-2">
            <CustomConnectButton />
            <button
              className="sm:hidden text-white p-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
      </Header>

      {isMobileMenuOpen && (
      <div className="fixed top-[72px] left-0 right-0 z-40 md:hidden bg-[#0D101C] py-4 flex flex-col items-center gap-4 border-b border-[rgba(255,255,255,0.1)] px-4">
        <button
          className={`text-lg w-full text-center py-2 rounded transition-colors ${
            selectedSubPage === SubPage.Yield
              ? "text-white bg-[rgba(184,138,248,0.1)]"
              : "text-[#9C9DA2] hover:text-white"
          }`}
          onClick={() => {
            router.push('/earn');
            setIsMobileMenuOpen(false);
          }}
        >
          Earn
        </button>
        <button
          className={`text-lg w-full text-center py-2 rounded transition-colors ${
            selectedSubPage === SubPage.Markets
              ? "text-white bg-[rgba(184,138,248,0.1)]"
              : "text-[#9C9DA2] hover:text-white"
          }`}
          onClick={() => {
            router.push('/yields');
            setIsMobileMenuOpen(false);
          }}
        >
          Yields
        </button>
        <button
          className={`text-lg w-full text-center py-2 rounded transition-colors ${
            selectedSubPage === SubPage.Portfolio
              ? "text-white bg-[rgba(184,138,248,0.1)]"
              : "text-[#9C9DA2] hover:text-white"
          }`}
          onClick={() => {
            router.push('/portfolio');
            setIsMobileMenuOpen(false);
          }}
        >
          Portfolio
        </button>
        <button
          className="text-lg w-full text-center py-2 rounded transition-colors text-[#9C9DA2] hover:text-white"
          onClick={() => {
            window.open(
              "https://docs.lucidly.finance",
              "_blank",
              "noopener,noreferrer"
            );
            setIsMobileMenuOpen(false);
          }}
        >
          Docs
        </button>
      </div>
    )}

      <main className={`flex-1 overflow-y-auto ${isMobileMenuOpen ? 'pt-[200px]' : ''}`}>{renderSubPage()}</main>
    </div>
  );
}
