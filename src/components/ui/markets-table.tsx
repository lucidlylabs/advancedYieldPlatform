import React from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

interface MarketItem {
    id: number;
    name: string;
    type: string;
    baseYield: string;
    incentives: string[];
    tvl: string;
}

interface MarketsTableProps {
    data: MarketItem[];
    sortColumn: string | null;
    sortDirection: "asc" | "desc";
    onSort: (column: string) => void;
    onRowClick?: (item: MarketItem) => void;
    selectedItemId?: number | null;
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

const MarketsTable: React.FC<MarketsTableProps> = ({
    data,
    sortColumn,
    sortDirection,
    onSort,
    onRowClick,
    selectedItemId,
}) => {
    // Function to get icon based on asset type
    const getAssetIcon = (type: string) => {
        switch (type) {
            case "eth":
                return (
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                        <Image
                            src="/images/icons/eth-stable.svg"
                            alt="ETH"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                );
            case "btc":
                return (
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                        <Image
                            src="/images/icons/btc-stable.svg"
                            alt="BTC"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                );
            case "usd":
                return (
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                        <Image
                            src="/images/icons/usd-stable.svg"
                            alt="USD"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    // Incentive icon component
    const IncentiveIcon = ({ type }: { type: string }) => {
        const baseStyle = "w-4 h-4 flex items-center justify-center";

        switch (type) {
            case "eth":
                return (
                    <div className={baseStyle}>
                        <Image
                            src="/images/icons/eth-incentive.svg"
                            alt="ETH Incentive"
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                    </div>
                );
            case "btc":
                return (
                    <div className={baseStyle}>
                        <Image
                            src="/images/icons/btc-incentive.svg"
                            alt="BTC Incentive"
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                    </div>
                );
            case "usdc":
                return (
                    <div className={baseStyle}>
                        <Image
                            src="/images/icons/incentives-usd.svg"
                            alt="USD Incentive"
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            <div className="pl-[32px]">
                <div className="grid grid-cols-12 pr-6 py-2 border-y-[0.5px] border-[rgba(255,255,255,0.15)]">
                    <div
                        className="col-span-4 cursor-pointer flex items-center text-white opacity-60 text-[14px] font-normal leading-[14px] py-[5px]"
                        onClick={() => onSort("name")}
                    >
                        Available Yields
                        {sortColumn === "name" && (
                            <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                        )}
                    </div>
                    <div
                        className="col-span-3 cursor-pointer flex items-center text-white opacity-60 text-[14px] font-normal leading-[14px]"
                        onClick={() => onSort("baseYield")}
                    >
                        Base APY
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="ml-1 text-white opacity-60 hover:opacity-100 transition-all duration-200 flex items-center">
                                        <InfoIcon />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Annual Percentage Yield scaled on historical 7 day trailing performance.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {sortColumn === "baseYield" && (
                            <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                        )}
                    </div>
                    <div className="col-span-3 flex items-center text-white opacity-60 text-[14px] font-normal leading-[14px]">
                        Incentives
                    </div>
                    <div
                        className="col-span-2 cursor-pointer flex items-center justify-end text-white opacity-60 text-[14px] font-normal leading-[14px]"
                        onClick={() => onSort("tvl")}
                    >
                        TVL
                        {sortColumn === "tvl" && (
                            <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div>
                {data.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => onRowClick && onRowClick(item)}
                        className="cursor-pointer pl-[32px]"
                    >
                        <div
                            className={cn(
                                "transition duration-200",
                                index % 2 === 1 && "bg-[rgba(255,255,255,0.02)]",
                                "hover:bg-[linear-gradient(90deg,rgba(0,209,160,0.15)_0%,rgba(0,209,160,0)_15%,rgba(0,209,160,0)_85%,rgba(0,209,160,0.15)_100%)]",
                                selectedItemId === item.id &&
                                "bg-[linear-gradient(90deg,rgba(0,209,160,0.15)_0%,rgba(0,209,160,0)_15%,rgba(0,209,160,0)_85%,rgba(0,209,160,0.15)_100%)]"
                            )}
                        >
                            <div className="grid grid-cols-12 pr-6 py-4 pl-4">
                                <div className="col-span-4 flex items-center">
                                    {getAssetIcon(item.type)}
                                    <span className="text-white text-xs font-normal leading-4">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="col-span-3 flex items-center text-white text-xs font-normal leading-4">
                                    {item.baseYield}
                                </div>
                                <div className="col-span-3 flex items-center">
                                    {item.incentives.map((incentive, index) => (
                                        <div key={index} className="-ml-1 first:ml-0">
                                            <IncentiveIcon type={incentive} />
                                        </div>
                                    ))}
                                </div>
                                <div className="col-span-2 flex items-center justify-end text-white text-xs font-normal leading-4">
                                    {item.tvl}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export { MarketsTable };
