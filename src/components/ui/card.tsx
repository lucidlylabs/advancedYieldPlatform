import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface CustomCardProps {
  heading: string;
  imageSrc: string;
  imageAlt?: string;
  className?: string;
  hoverColor?: string;
  onDurationSelect?: (duration: string) => void;
  selectedDuration?: string;
  info?: string;
  apy?: {
    value: string;
    info: string;
  };
  isStrategyCard?: boolean;
}

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CustomCard = ({
  heading,
  imageSrc,
  imageAlt = "Semi-circle image",
  className,
  hoverColor = "#B88AF8", // Default solid purple color
  onDurationSelect,
  selectedDuration,
  info,
  apy,
  isStrategyCard,
  ...props
}: CustomCardProps) => {
  const handleDurationClick = (duration: string) => {
    if (onDurationSelect) {
      onDurationSelect(duration);
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-[4px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-card-foreground shadow-sm w-[264px] h-[311px] flex flex-col group transition-all duration-300 ease-out cursor-pointer",
        className
      )} 
      {...props}
    >
      {/* Heading section with color transition */}
      <div className="relative">
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ backgroundColor: hoverColor }}
        />
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-[32px] font-semibold leading-none tracking-tight text-white group-hover:text-[#1A1B1E] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
              {heading}
              {selectedDuration && (
                <div className="text-lg opacity-60 mt-2">{selectedDuration}</div>
              )}
            </h3>
            {info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-white opacity-60 hover:opacity-100 transition-all duration-200">
                      <InfoIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {isStrategyCard && apy && (
            <div className="mt-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="opacity-60">APY</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-white opacity-60 hover:opacity-100 transition-all duration-200">
                        <InfoIcon />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{apy.info}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-semibold">{apy.value}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Duration Selection Content */}
      {!selectedDuration && onDurationSelect && (
        <div className="p-6 pt-0 flex-1 relative z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <p className="text-[#1A1B1E] flex items-center gap-2 mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#1A1B1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Select Duration
          </p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleDurationClick("30 Days")}
              className="w-[calc(50%-4px)] px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white hover:bg-[rgba(26,27,30,0.2)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              30 Days
            </button>
            <button 
              onClick={() => handleDurationClick("90 Days")}
              className="w-[calc(50%-4px)] px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white hover:bg-[rgba(26,27,30,0.2)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              90 Days
            </button>
            <button 
              onClick={() => handleDurationClick("180 Days")}
              className="w-full px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white hover:bg-[rgba(26,27,30,0.2)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              180 Days
            </button>
            <button 
              onClick={() => handleDurationClick("Perpetual Duration")}
              className="w-full px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white hover:bg-[rgba(26,27,30,0.2)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              Perpetual Duration
            </button>
          </div>
        </div>
      )}

      {/* Semi-circle image container at the bottom */}
      <div className="w-full flex justify-center mt-auto">
        <div className="relative w-[200px] h-[100px]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="absolute bottom-0 w-full h-[200px] object-contain transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform group-hover:translate-y-[-20px] group-hover:opacity-0"
            />
          ) : (
            <div className="absolute bottom-0 w-full h-[200px] bg-gray-200 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform group-hover:translate-y-[-20px] group-hover:opacity-0">
              {/* Placeholder semi-circle */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { CustomCard };
