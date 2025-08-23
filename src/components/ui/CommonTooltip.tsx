import React from 'react';

interface TooltipItem {
  name: string;
  value: number;
  fill: string;
  payload: any;
}

interface CommonTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  title?: string;
  showTotal?: boolean;
  totalLabel?: string;
  valueFormatter?: (value: number, item: TooltipItem) => string;
  nameFormatter?: (name: string) => string;
  totalValue?: number;
  totalFormatter?: (value: number) => string;
  showColoredCircles?: boolean;
  customContent?: React.ReactNode;
  monetaryValueFormatter?: (item: TooltipItem) => string;
}

export default function CommonTooltip({
  active,
  payload,
  label,
  title,
  showTotal = true,
  totalLabel = "Total",
  valueFormatter,
  nameFormatter,
  totalValue,
  totalFormatter,
  showColoredCircles = true,
  customContent,
  monetaryValueFormatter
}: CommonTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Default formatters
  const defaultValueFormatter = (value: number) => `${(value * 100).toFixed(2)}%`;
  const defaultNameFormatter = (name: string) => 
    name.length > 10 ? `${name.slice(0, 6)}...${name.slice(-4)}` : name;
  const defaultTotalFormatter = (value: number) => 
    value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value.toFixed(0)}`;
  const defaultMonetaryFormatter = (item: TooltipItem) => {
    const tvlKey = `${item.name}_tvl`;
    const tvlValue = item.payload[tvlKey];
    if (tvlValue !== undefined && tvlValue !== null) {
      const numValue = Number(tvlValue);
      if (!isNaN(numValue)) {
        return numValue >= 1000
          ? `$${(numValue / 1000).toFixed(1)}K`
          : `$${numValue.toFixed(0)}`;
      }
    }
    return "$0";
  };

  // Use provided formatters or defaults
  const formatValue = valueFormatter || defaultValueFormatter;
  const formatName = nameFormatter || defaultNameFormatter;
  const formatTotal = totalFormatter || defaultTotalFormatter;
  const formatMonetary = monetaryValueFormatter || defaultMonetaryFormatter;

  // Calculate total if not provided
  const calculatedTotal = totalValue !== undefined ? totalValue : 
    payload.reduce((sum, item) => sum + (item.value * 100), 0);

  return (
    <div className="rounded-lg shadow-lg overflow-hidden border border-gray-200 relative z-50">
      {/* Header - Darker grey background */}
      <div className="bg-gray-300 border-b border-gray-400 px-4 py-3">
        <div className="text-sm font-semibold text-gray-700">
          {title || label}
        </div>
      </div>
      
      {/* Content - Light grey background */}
      <div className="bg-gray-100 px-4 py-3 relative z-50">
        {customContent ? (
          customContent
        ) : (
          <div className="space-y-3">
            {payload.map((item: TooltipItem, index: number) => {
              const displayName = formatName(item.name);
              const displayValue = formatValue(item.value, item);
              const monetaryValue = formatMonetary(item);

              return (
                <div key={index} className="flex items-center gap-3">
                  {showColoredCircles && (
                    <div 
                      className="w-5 h-5 rounded-full flex-shrink-0 relative z-50 bg-white border-2 border-white shadow-md"
                      style={{ 
                        backgroundColor: item.fill,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    />
                  )}
                  <span className="text-sm text-gray-600 flex-1 min-w-0">
                    {displayName}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 text-right min-w-[80px]">
                    {monetaryValue}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 text-right min-w-[60px]">
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer - Same darker grey as header */}
      {showTotal && (
        <div className="bg-gray-300 border-t border-gray-400 px-4 py-3 border-t border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">
              {totalLabel}
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {formatTotal(calculatedTotal)}
            </span>
            {totalValue === undefined && (
              <span className="text-sm font-semibold text-gray-700">
                {calculatedTotal.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
