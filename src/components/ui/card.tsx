import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Icon, InfoIcon } from "lucide-react";

type DurationType = "30_DAYS" | "60_DAYS" | "180_DAYS" | "PERPETUAL_DURATION";

interface CustomCardProps {
  heading: string;
  imageSrc: string;
  imageAlt?: string;
  className?: string;
  hoverColor?: string;
  onDurationSelect?: (duration: DurationType) => void;
  selectedDuration?: DurationType;
  info?: string;
  apy?: {
    value: string;
    info: string;
  };
  isStrategyCard?: boolean;
  disableHover?: boolean;
  onReset?: () => void;
  isComingSoon?: boolean;
  availableDurations?: DurationType[];
}

const formatDuration = (duration: string) => {
  if (duration === "PERPETUAL_DURATION") return "Liquid";
  const [number, period] = duration.split("_");
  return `${number} ${period.toLowerCase()}`;
};

const CustomCard: React.FC<CustomCardProps> = ({
  heading,
  imageSrc,
  imageAlt = "Semi-circle image",
  className,
  hoverColor = "#B88AF8",
  onDurationSelect,
  selectedDuration,
  info,
  apy,
  isStrategyCard,
  disableHover,
  onReset,
  isComingSoon,
  availableDurations,
  ...props
}) => {
  const handleDurationClick = (duration: DurationType) => {
    if (onDurationSelect) {
      onDurationSelect(duration);
    }
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up to parent card
  };

  // Helper function to check if a duration is available
  const isDurationAvailable = (duration: DurationType) => {
    // If availableDurations is not provided, assume all are available
    if (!availableDurations) return true;
    return availableDurations.includes(duration);
  };

  return (
    <div
      className={cn(
        "opacity-80",
        "relative overflow-hidden rounded-[4px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-card-foreground shadow-sm flex flex-col group transition-all duration-300 ease-out cursor-pointer",
        isStrategyCard
          ? "w-[264px] h-[263px] justify-center items-center gap-[10px]"
          : "w-[264px] h-[311px] max-w-[264px]",
        className,
        isStrategyCard &&
          "hover:bg-[linear-gradient(180deg,_rgba(0,_0,_0,_0.00)_61.22%,_rgba(0,_209,_160,_0.10)_110.27%),_linear-gradient(180deg,_rgba(0,_209,_160,_0.10)_-10.08%,_rgba(153,_153,_153,_0.00)_35.74%)]"
      )}
      {...props}
    >
      {/* Subtle radial white gradient overlay at the top - only on hover */}
      <div 
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)'
        }}
      />

      {isStrategyCard ? (
        <div className="flex flex-col h-full relative">
          {/* Coming Soon Overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[#B88AF8] text-2xl font-bold italic text-center">Coming Soon</span>
            </div>
          )}
          {/* Image */}
          <div className="flex justify-center items-center pt-8">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-[56px] h-[56px] object-contain"
            />
          </div>

          {/* Heading */}
          <div className="px-6 pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-white text-base font-semibold leading-6">
                {heading}
              </h3>
              {info && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleTooltipClick}
                        className="transition-all duration-200"
                      >
                        <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.49967 10.6666V7.99992M7.49967 5.33325H7.50634M14.1663 7.99992C14.1663 11.6818 11.1816 14.6666 7.49967 14.6666C3.81778 14.6666 0.833008 11.6818 0.833008 7.99992C0.833008 4.31802 3.81778 1.33325 7.49967 1.33325C11.1816 1.33325 14.1663 4.31802 14.1663 7.99992Z" stroke="#9C9DA2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      onClick={handleTooltipClick}
                      className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]"
                    >
                      <p>{info}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* APY */}
          {apy && (
            <div className="mt-auto px-6 pb-8 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="flex items-center gap-1 text-[#9C9DA2]">
                  {isStrategyCard && heading.includes("Incentives")
                    ? "Incentive"
                    : "APY"}
                  {/* Inline SVG icon */}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer">
                          <path d="M8.49967 10.6666V7.99992M8.49967 5.33325H8.50634M15.1663 7.99992C15.1663 11.6818 12.1816 14.6666 8.49967 14.6666C4.81778 14.6666 1.83301 11.6818 1.83301 7.99992C1.83301 4.31802 4.81778 1.33325 8.49967 1.33325C12.1816 1.33325 15.1663 4.31802 15.1663 7.99992Z" stroke="#9C9DA2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent
                        onClick={handleTooltipClick}
                        className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]"
                      >
                        <p>Base APY (7D Trailing)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              </div>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="text-2xl font-semibold blur-sm transition-all duration-300">
                      {apy.value}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]">
                    <p>Collecting Data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
          <div
            className={cn(
              "absolute inset-0 origin-top scale-y-0 transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
              !disableHover && "group-hover:scale-y-100"
            )}
            style={{ backgroundColor: hoverColor }}
          />
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    "text-[32px] leading-none tracking-tight text-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full flex flex-col items-center justify-center  ",
                    !disableHover && "group-hover:text-[#1A1B1E]"
                  )}
                >
                  {heading}
                  {selectedDuration && onReset && (
                    <div className="flex flex-col items-center gap-4 mt-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onReset();
                        }}
                        className="text-lg opacity-60 hover:opacity-100 transition-all duration-200 underline decoration-[rgba(255,255,255,0.6)] hover:decoration-white cursor-pointer"
                      >
                        {formatDuration(selectedDuration)}
                      </div>
                    </div>
                  )}
                  {selectedDuration && !onReset && (
                    <div className="text-lg opacity-60 mt-2">
                      {formatDuration(selectedDuration)}
                    </div>
                  )}
                </h3>
              </div>
            </div>
          </div>

          {!selectedDuration && onDurationSelect && !isComingSoon && (
            <div className="p-6 pt-0 flex-1 relative z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                              <p className="text-[#D7E3EF] opacity-80 font-medium text-xs flex items-center justify-center gap-1 mb-4 mt-5 w-full">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.00033 3.50008V7.00008L9.33366 8.16675M12.8337 7.00008C12.8337 10.2217 10.222 12.8334 7.00033 12.8334C3.77866 12.8334 1.16699 10.2217 1.16699 7.00008C1.16699 3.77842 3.77866 1.16675 7.00033 1.16675C10.222 1.16675 12.8337 3.77842 12.8337 7.00008Z" stroke="#D7E3EF" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                Select Duration
              </p>
              <div className="flex flex-wrap gap-2">
                {/* 30 Days Button */}
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => isDurationAvailable("30_DAYS") ? handleDurationClick("30_DAYS") : undefined}
                        className={cn(
                          "w-[calc(50%-4px)] px-4 py-2 rounded-[4px] border text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                          isDurationAvailable("30_DAYS") ? "hover:cursor-pointer border-[rgba(184,138,248,0.30)]" : "cursor-not-allowed opacity-50 border-gray-600",
                          !disableHover && isDurationAvailable("30_DAYS") && `hover:text-[#1A1B1E]`
                        )}
                        onMouseEnter={(e) => {
                          if (!disableHover && isDurationAvailable("30_DAYS"))
                            e.currentTarget.style.backgroundColor = hoverColor;
                        }}
                        onMouseLeave={(e) => {
                          if (!disableHover && isDurationAvailable("30_DAYS"))
                            e.currentTarget.style.backgroundColor = "";
                        }}
                        disabled={!isDurationAvailable("30_DAYS")}
                      >
                        {formatDuration("30_DAYS")}
                      </button>
                    </TooltipTrigger>
                    {!isDurationAvailable("30_DAYS") && (
                      <TooltipContent className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]">
                        <p>Coming Soon</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                  {/* 60 Days Button */}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => isDurationAvailable("60_DAYS") ? handleDurationClick("60_DAYS") : undefined}
                          className={cn(
                            "w-[calc(50%-4px)] px-4 py-2 rounded-[4px] border text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            isDurationAvailable("60_DAYS") ? "hover:cursor-pointer border-[rgba(184,138,248,0.30)]" : "cursor-not-allowed opacity-50 border-gray-600",
                            !disableHover && isDurationAvailable("60_DAYS") && `hover:text-[#1A1B1E]`
                          )}
                          onMouseEnter={(e) => {
                            if (!disableHover && isDurationAvailable("60_DAYS"))
                              e.currentTarget.style.backgroundColor = hoverColor;
                          }}
                          onMouseLeave={(e) => {
                            if (!disableHover && isDurationAvailable("60_DAYS"))
                              e.currentTarget.style.backgroundColor = "";
                          }}
                          disabled={!isDurationAvailable("60_DAYS")}
                        >
                          {formatDuration("60_DAYS")}
                        </button>
                      </TooltipTrigger>
                      {!isDurationAvailable("60_DAYS") && (
                        <TooltipContent className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]">
                          <p>Coming Soon</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  {/* 180 Days Button */}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => isDurationAvailable("180_DAYS") ? handleDurationClick("180_DAYS") : undefined}
                          className={cn(
                            "w-full px-4 py-2 rounded-[4px] border text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            isDurationAvailable("180_DAYS") ? "hover:cursor-pointer border-[rgba(184,138,248,0.30)]" : "cursor-not-allowed opacity-50 border-gray-600",
                            !disableHover && isDurationAvailable("180_DAYS") && `hover:text-[#1A1B1E]`
                          )}
                          onMouseEnter={(e) => {
                            if (!disableHover && isDurationAvailable("180_DAYS"))
                              e.currentTarget.style.backgroundColor = hoverColor;
                          }}
                          onMouseLeave={(e) => {
                            if (!disableHover && isDurationAvailable("180_DAYS"))
                              e.currentTarget.style.backgroundColor = "";
                          }}
                          disabled={!isDurationAvailable("180_DAYS")}
                        >
                          {formatDuration("180_DAYS")}
                        </button>
                      </TooltipTrigger>
                      {!isDurationAvailable("180_DAYS") && (
                        <TooltipContent className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]">
                          <p>Coming Soon</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  {/* Perpetual Button */}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => isDurationAvailable("PERPETUAL_DURATION") ? handleDurationClick("PERPETUAL_DURATION") : undefined}
                          className={cn(
                            "w-full px-4 py-2 rounded-[4px] border text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            isDurationAvailable("PERPETUAL_DURATION") ? "hover:cursor-pointer border-[rgba(184,138,248,0.30)]" : "cursor-not-allowed opacity-50 border-gray-600",
                            !disableHover && isDurationAvailable("PERPETUAL_DURATION") && `hover:text-[#1A1B1E]`
                          )}
                          onMouseEnter={(e) => {
                            if (!disableHover && isDurationAvailable("PERPETUAL_DURATION"))
                              e.currentTarget.style.backgroundColor = hoverColor;
                          }}
                          onMouseLeave={(e) => {
                            if (!disableHover && isDurationAvailable("PERPETUAL_DURATION"))
                              e.currentTarget.style.backgroundColor = "";
                          }}
                          disabled={!isDurationAvailable("PERPETUAL_DURATION")}
                        >
                          {formatDuration("PERPETUAL_DURATION")}
                        </button>
                      </TooltipTrigger>
                      {!isDurationAvailable("PERPETUAL_DURATION") && (
                        <TooltipContent className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]">
                          <p>Coming Soon</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
          )}

          {/* Coming Soon Overlay */}

          {isComingSoon && (
            <>
              <div className="p-6 pt-0 flex-1 relative z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center">
                <p className="text-white flex items-center justify-center w-full text-[24px]   text-center">
                  Coming Soon
                </p>
              </div>
              <div className="w-full flex justify-center mt-auto">
                <div className="relative w-[200px] h-[125px]">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="absolute w-full h-[200px] object-contain transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-[-200px] group-hover:scale-50 group-hover:opacity-0"
                  />
                </div>
              </div>
            </>
          )}

          {!isComingSoon && (
            <div className="w-full flex justify-center mt-auto">
              <div className="relative w-[200px] h-[78px]">
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className={cn(
                    "absolute w-full h-[200px] object-contain transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    selectedDuration
                      ? "bottom-[-18%] translate-y-[30%]"
                      : "bottom-0 group-hover:translate-y-[-200px] group-hover:scale-50 group-hover:opacity-0"
                  )}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { CustomCard };
