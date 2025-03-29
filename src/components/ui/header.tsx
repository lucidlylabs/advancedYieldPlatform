import React, { useState } from "react";

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export function Header({ className, children, ...props }: HeaderProps) {
  const [shouldShowBanner, setShouldShowBanner] = useState(true);

  return (
    <div className={`flex flex-col w-full ${className}`} {...props}>
      {shouldShowBanner && (
        <div className="w-full bg-amber-900 text-amber-100 py-2 px-4 relative">
          <div className="flex flex-col sm:flex-row items-center justify-center text-center text-sm gap-2">
            <span>A banner for Important Info which we want to highlight</span>
            <span>
              <a
                href="https://google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                {" "}
                Link
              </a>
            </span>
          </div>
          <button
            className="absolute right-2 top-2 h-6 w-6 p-0 flex items-center justify-center text-amber-200 hover:bg-amber-800 rounded"
            onClick={() => setShouldShowBanner(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between py-0 px-6 bg-[#080B17] text-white border-b border-[rgba(255,255,255,0.1)] backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
