import React, { useState } from 'react';
// import { XIcon } from "lucide-react";

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export function Header({ className, children, ...props }: HeaderProps) {
  const [shouldShowBanner, setShouldShowBanner] = useState(true);
  
  return (
    <div className={`flex flex-col w-full ${className}`} {...props}>
      {shouldShowBanner && (
        <div className="w-full bg-amber-100 dark:bg-amber-900 py-2 px-4 relative">
          <div className="flex flex-col sm:flex-row items-center justify-center text-center text-sm gap-2">
            <span>
              This app is built for emergencies, so it prioritizes resilience over speed. Please be patient as it loads.
            </span>
            <span>
              You can also run it yourself{" "}
              <a 
                href="https://github.com/yourusername/yourrepo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                here
              </a>.
            </span>
          </div>
          <button
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={() => setShouldShowBanner(false)}
          >
            {/* <XIcon className="h-4 w-4" /> */}
            <span className="sr-only">Close</span>
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between py-4 px-6 bg-white dark:bg-gray-800 shadow-sm">
        {children}
      </div>
    </div>
  );
}