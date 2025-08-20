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
  incentives: Array<{ image: string; name: string; link: string }>;
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
    width="12"
    height="12"
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

const SortIcon = ({ direction }: { direction: "asc" | "desc" | null }) => {
  return (
    <svg
      className="ml-1"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity={direction ? "1" : "0.6"}>
        {/* Up arrow - white when ascending, grey otherwise */}
        <path
          d="M4.08203 5.24992L6.9987 2.33325L9.91536 5.24992"
          stroke={direction === "asc" ? "white" : "#9C9DA2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Down arrow - white when descending, grey otherwise */}
        <path
          d="M4.08203 8.74992L6.9987 11.6666L9.91536 8.74992"
          stroke={direction === "desc" ? "white" : "#9C9DA2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

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
      case "usd":
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
        console.warn(`Unknown incentive type: ${type}`);
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sm:pl-[32px]">
        <div className="grid grid-cols-12 px-4 py-1 border-y-[0.5px] border-[rgba(255,255,255,0.15)]" style={{ height: '38px' }}>
          <div
            className="col-span-4 cursor-pointer flex items-center text-white opacity-60 font-inter text-[11px] font-normal leading-[14px] py-[5px]"
            onClick={() => onSort("name")}
          >
            Available Yields
            <SortIcon direction={sortColumn === "name" ? sortDirection : null} />
          </div>
          <div
            className="col-span-3 cursor-pointer flex items-center justify-end text-white opacity-60 font-inter text-[11px] font-normal leading-[14px]"
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
                    Annual Percentage Yield based on current market conditions
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SortIcon direction={sortColumn === "baseYield" ? sortDirection : null} />
          </div>
          <div className="col-span-3 flex items-center justify-end text-white opacity-60 font-inter text-[11px] font-normal leading-[14px]">
            Incentives
            <SortIcon direction={null} />
          </div>
          <div
            className="col-span-2 cursor-pointer flex items-center justify-end text-white opacity-60 font-inter text-[11px] font-normal leading-[14px]"
            onClick={() => onSort("tvl")}
          >
            TVL
            <SortIcon direction={sortColumn === "tvl" ? sortDirection : null} />
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div>
        {data.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onRowClick && onRowClick(item)}
            className="cursor-pointer sm:pl-[32px]"
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
                  <span className="text-white font-inter text-xs font-normal leading-4">
                    {item.name}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-end text-white font-inter text-xs font-normal leading-4">
                  {item.baseYield}
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  {(() => {
                    console.log('Incentives for', item.name, ':', item.incentives);
                    const hasValidIncentives = item.incentives && 
                      item.incentives.length > 0 && 
                      item.incentives.some(incentive => incentive && incentive.image);
                    
                    return hasValidIncentives ? (
                      item.incentives
                        .filter(incentive => incentive && incentive.image)
                        .map((incentive, index) => (
                          <div key={index} className={index === 0 ? "" : "ml-2"}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {incentive.link && incentive.link !== "#" ? (
                                    <a 
                                      href={incentive.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      <Image
                                        src={incentive.image}
                                        alt={incentive.name}
                                        width={16}
                                        height={16}
                                        className="object-contain"
                                      />
                                    </a>
                                  ) : (
                                    <div>
                                      <Image
                                        src={incentive.image}
                                        alt={incentive.name}
                                        width={16}
                                        height={16}
                                        className="object-contain"
                                      />
                                    </div>
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{incentive.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))
                    ) : (
                      <span className="text-white font-inter text-xs font-normal leading-4">---</span>
                    );
                  })()}
                </div>
                <div className="col-span-2 flex items-center justify-end text-white font-inter text-xs font-normal leading-4">
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
