import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { CustomConnectButton } from "../components/ui/ConnectButton/CustomConnectButton";
import { Header } from "../components/ui/header";
import { Navigation } from "../components/ui/navigation";
import PortfolioSubpage from "./portfolio";
import Yieldsubpage from "./earn";
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
      return <Yieldsubpage depositParams={depositParams} />;
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
        return <Yieldsubpage depositParams={depositParams} />;
      case SubPage.Markets:
        return <MarketsSubpage />;
      default:
        return null;
    }
  };

  // Determine current page based on route
  const getCurrentPage = () => {
    const path = router.pathname;
    if (path === '/earn') return 'earn';
    if (path === '/yields') return 'yields';
    if (path === '/portfolio') return 'portfolio';
    if (path === '/leaderboard') return 'leaderboard';
    return 'earn'; // default
  };

  return (
    <div className="min-h-screen flex flex-col pt-[52px]">
      <Header onNavigateToDeposit={handleNavigateToDeposit}>
        <Navigation 
          currentPage={getCurrentPage() as 'earn' | 'yields' | 'portfolio' | 'leaderboard'}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </Header>

      <main className={`flex-1 overflow-y-auto ${isMobileMenuOpen ? 'pt-[200px]' : ''}`}>{renderSubPage()}</main>
    </div>
  );
}
