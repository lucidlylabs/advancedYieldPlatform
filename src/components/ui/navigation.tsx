import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { CustomConnectButton } from "./ConnectButton/CustomConnectButton";
import { useHeaderHeight } from "../../contexts/BannerContext";

interface NavigationProps {
  currentPage?: 'earn' | 'yields' | 'portfolio' | 'leaderboard' | 'bridge';
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export function Navigation({ 
  currentPage, 
  isMobileMenuOpen = false, 
  setIsMobileMenuOpen 
}: NavigationProps) {
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  return (
    <>
      <div className="flex items-center justify-between w-full sm:px-0">
        <div className="flex items-stretch h-full">
          <div className="flex items-center">
            <div
              className="cursor-pointer"
              onClick={() => {
                router.push('/yields');
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
              {/* <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  currentPage === 'earn'
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/earn');
                }}
              >
                Earn
                {currentPage === 'earn' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button> */}

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  currentPage === 'yields'
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/yields');
                }}
              >
                Yields
                {currentPage === 'yields' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button>

              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  currentPage === 'portfolio'
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/portfolio');
                }}
              >
                Portfolio
                {currentPage === 'portfolio' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button>
              
              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  currentPage === 'leaderboard'
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/leaderboard');
                }}
              >
                Leaderboard
                {currentPage === 'leaderboard' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#B88AF8]"></div>
                )}
              </button>
              
              <div className="h-[20px] w-[1px] bg-[rgba(255,255,255,0.1)] self-center"></div>

              <button
                className={`px-8 py-[18px] text-sm transition-colors relative ${
                  currentPage === 'bridge'
                    ? "text-white"
                    : "text-[#9C9DA2] hover:text-gray-300"
                }`}
                onClick={() => {
                  router.push('/bridge');
                }}
              >
                Bridge
                {currentPage === 'bridge' && (
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
          {setIsMobileMenuOpen && (
            <button
              className="sm:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && setIsMobileMenuOpen && (
        <div className="fixed left-0 right-0 z-[55] md:hidden bg-[rgba(13,16,28,0.95)] backdrop-blur-md py-4 flex flex-col items-center gap-4 border-b border-[rgba(255,255,255,0.1)] px-4" style={{ top: `${headerHeight}px` }}>
          <button
            className={`text-lg w-full text-center py-2 rounded transition-colors ${
              currentPage === 'yields'
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
              currentPage === 'portfolio'
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
            className={`text-lg w-full text-center py-2 rounded transition-colors ${
              currentPage === 'leaderboard'
                ? "text-white bg-[rgba(184,138,248,0.1)]"
                : "text-[#9C9DA2] hover:text-white"
            }`}
            onClick={() => {
              router.push('/leaderboard');
              setIsMobileMenuOpen(false);
            }}
          >
            Leaderboard
          </button>
          <button
            className={`text-lg w-full text-center py-2 rounded transition-colors ${
              currentPage === 'bridge'
                ? "text-white bg-[rgba(184,138,248,0.1)]"
                : "text-[#9C9DA2] hover:text-white"
            }`}
            onClick={() => {
              router.push('/bridge');
              setIsMobileMenuOpen(false);
            }}
          >
            Bridge
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
    </>
  );
}

