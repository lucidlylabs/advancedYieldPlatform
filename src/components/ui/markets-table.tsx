import React from 'react';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onRowClick?: (item: MarketItem) => void;
  selectedItemId?: number | null;
}

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MarketsTable: React.FC<MarketsTableProps> = ({
  data,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  selectedItemId
}) => {
  // Function to get icon based on asset type
  const getAssetIcon = (type: string) => {
    switch(type) {
      case 'eth':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L12 9.5M12 2L6 5M12 2L18 5M12 22L12 15M12 22L6 19M12 22L18 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'btc':
        return (
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 2V4M14.5 2V4M9.5 20V22M14.5 20V22M7 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18V6C5 4.89543 5.89543 4 7 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 12H13M13 12C14.1046 12 15 11.1046 15 10C15 8.89543 14.1046 8 13 8H10V16H13C14.1046 16 15 15.1046 15 14C15 12.8954 14.1046 12 13 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'usd':
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M17 5H9.5C7.567 5 6 6.567 6 8.5C6 10.433 7.567 12 9.5 12H14.5C16.433 12 18 13.567 18 15.5C18 17.433 16.433 19 14.5 19H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Incentive icon component
  const IncentiveIcon = ({ type }: { type: string }) => {
    const baseStyle = "w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center";
    
    switch(type) {
      case 'eth':
        return (
          <div className={baseStyle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L12 9.5M12 2L6 5M12 2L18 5M12 22L12 15M12 22L6 19M12 22L18 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'btc':
        return (
          <div className={baseStyle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 2V4M14.5 2V4M9.5 20V22M14.5 20V22M7 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18V6C5 4.89543 5.89543 4 7 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 12H13M13 12C14.1046 12 15 11.1046 15 10C15 8.89543 14.1046 8 13 8H10V16H13C14.1046 16 15 15.1046 15 14C15 12.8954 14.1046 12 13 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'usdc':
        return (
          <div className={baseStyle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M17 5H9.5C7.567 5 6 6.567 6 8.5C6 10.433 7.567 12 9.5 12H14.5C16.433 12 18 13.567 18 15.5C18 17.433 16.433 19 14.5 19H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="grid grid-cols-4 py-4 border-b border-gray-700 text-gray-400 text-sm">
        <div 
          className="cursor-pointer flex items-center"
          onClick={() => onSort('name')}
        >
          Available Yields
          {sortColumn === 'name' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div 
          className="cursor-pointer flex items-center"
          onClick={() => onSort('baseYield')}
        >
          Base APY
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-white opacity-60 hover:opacity-100 transition-all duration-200">
                  <InfoIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Annual Percentage Yield based on current market conditions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {sortColumn === 'baseYield' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="flex items-center">
          Incentives
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-white opacity-60 hover:opacity-100 transition-all duration-200">
                  <InfoIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Additional token rewards</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div 
          className="cursor-pointer flex items-center"
          onClick={() => onSort('tvl')}
        >
          TVL
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-white opacity-60 hover:opacity-100 transition-all duration-200">
                  <InfoIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total Value Locked</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {sortColumn === 'tvl' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-4 mt-4">
        {data.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "grid grid-cols-4 items-center py-4 border-b border-gray-800 hover:bg-gray-800 rounded-md cursor-pointer transition duration-200",
              selectedItemId === item.id && "bg-gray-800"
            )}
            onClick={() => onRowClick && onRowClick(item)}
          >
            <div className="flex items-center">
              {getAssetIcon(item.type)}
              <span>{item.name}</span>
            </div>
            <div>{item.baseYield}</div>
            <div className="flex">
              {item.incentives.map((incentive, index) => (
                <div key={index} className="mr-1">
                  <IncentiveIcon type={incentive} />
                </div>
              ))}
            </div>
            <div>{item.tvl}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { MarketsTable };