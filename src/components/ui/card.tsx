import React from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";

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
}

const InfoIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

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
                <div className="flex flex-col h-full">
                    <div className="flex justify-center items-center pt-8">
                        <img
                            src={imageSrc}
                            alt={imageAlt}
                            className="w-[56px] h-[56px] object-contain"
                        />
                    </div>

                    <div className="px-6 pt-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <h3 className="text-white text-base font-semibold leading-5">
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
                            <div className="flex items-center gap-2">
                                <h3
                                    className={cn(
                                        "text-[32px] leading-none tracking-tight text-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full flex flex-col items-center justify-center",
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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onReset();
                                                }}
                                                className="text-[#B88AF8] hover:opacity-100 transition-all duration-200 flex items-center gap-2 font-normal text-xs leading-none"
                                            >
                                                Change Asset
                                                <img
                                                    src="/images/icons/arrow.svg"
                                                    alt="arrow"
                                                    className="w-[11px] h-[8px] -ml-1"
                                                />
                                            </button>
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
                                <button
                                    onClick={() => handleDurationClick("30_DAYS")}
                                    className={cn(
                                        "w-[calc(50%-4px)] px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:cursor-pointer",
                                        !disableHover && `hover:text-[#1A1B1E]`
                                    )}
                                    onMouseEnter={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = hoverColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = "";
                                    }}
                                >
                                    {formatDuration("30_DAYS")}
                                </button>
                                <button
                                    onClick={() => handleDurationClick("60_DAYS")}
                                    className={cn(
                                        "w-[calc(50%-4px)] px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:cursor-pointer",
                                        !disableHover && `hover:text-[#1A1B1E]`
                                    )}
                                    onMouseEnter={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = hoverColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = "";
                                    }}
                                >
                                    {formatDuration("60_DAYS")}
                                </button>
                                <button
                                    onClick={() => handleDurationClick("180_DAYS")}
                                    className={cn(
                                        "w-full px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:cursor-pointer",
                                        !disableHover && `hover:text-[#1A1B1E]`
                                    )}
                                    onMouseEnter={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = hoverColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = "";
                                    }}
                                >
                                    {formatDuration("180_DAYS")}
                                </button>
                                <button
                                    onClick={() => handleDurationClick("PERPETUAL_DURATION")}
                                    className={cn(
                                        "w-full px-4 py-2 rounded-[4px] border border-[rgba(184,138,248,0.30)] text-white bg-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:cursor-pointer",
                                        !disableHover && `hover:text-[#1A1B1E]`
                                    )}
                                    onMouseEnter={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = hoverColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!disableHover)
                                            e.currentTarget.style.backgroundColor = "";
                                    }}
                                >
                                    {formatDuration("PERPETUAL_DURATION")}
                                </button>
                            </div>
                        </div>
                    )}

                    {isComingSoon && (
                        <>
                            <div className="p-6 pt-0 flex-1 relative z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center">
                                <p className="text-[#B88AF8] flex items-center justify-center w-full text-[24px] font-bold text-center">
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
