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
          ? "w-[247px] h-[263px] justify-center items-center gap-[10px]"
          : "w-[264px] h-[311px]",
        className,
        isStrategyCard &&
          "hover:bg-[linear-gradient(180deg,_rgba(0,_0,_0,_0.00)_61.22%,_rgba(0,_209,_160,_0.10)_110.27%),_linear-gradient(180deg,_rgba(0,_209,_160,_0.10)_-10.08%,_rgba(153,_153,_153,_0.00)_35.74%)]"
      )}
      {...props}
    >

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
              <h3 className="text-white   text-base font-semibold leading-5">
                {heading}
              </h3>
              {info && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleTooltipClick}
                        className="text-white opacity-60 hover:opacity-100 transition-all duration-200"
                      >
                        <InfoIcon />
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
                <span className="opacity-60">
                  {isStrategyCard && heading.includes("Incentives")
                    ? "Incentive"
                    : "APY"}
                </span>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      {/* <button
                        onClick={handleTooltipClick}
                        className="text-white opacity-60 hover:opacity-100 transition-all duration-200"
                      >
                        <InfoIcon />
                      </button> */}
                    </TooltipTrigger>
                    <TooltipContent
                      onClick={handleTooltipClick}
                      className="bg-[#1A1B1E] text-white p-2 rounded-md border border-[rgba(255,255,255,0.1)]"
                    >
                      <p>{apy.info}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-semibold">{apy.value}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              className={cn(
                "absolute inset-0 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                !disableHover && "group-hover:opacity-100"
              )}
              style={{ backgroundColor: hoverColor }}
            />
            <div className="p-6 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <h3
                  className={cn(
                    "text-[32px] leading-none tracking-tight text-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full flex flex-col items-center mt-[40px] ",
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
              <p className="text-white flex items-center justify-center gap-2 mb-4 mt-5 w-full">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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

          {isComingSoon && (
            <>
              <div className="p-6 pt-0 flex-1 relative z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center">
                <p className="text-white flex items-center justify-center w-full text-[24px]   text-center">
                  Coming Soon
                </p>
              </div>
              <div className="w-full flex justify-center mt-auto">
                <div className="relative w-[200px] h-[100px]">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="absolute w-full h-[200px] object-contain transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-[-20px] group-hover:opacity-0"
                  />
                </div>
              </div>
            </>
          )}

          {!isComingSoon && (
            <div className="w-full flex justify-center mt-auto">
              <div className="relative w-[200px] h-[100px]">
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className={cn(
                    "absolute w-full h-[200px] object-contain transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    selectedDuration
                      ? "bottom-[-30%] translate-y-[30%]"
                      : "bottom-0 group-hover:translate-y-[-20px] group-hover:opacity-0"
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
