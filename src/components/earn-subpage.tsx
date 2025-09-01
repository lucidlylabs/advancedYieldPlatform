import React from 'react';

interface DepositParams {
  asset: string;
  duration: string;
  strategy: string;
}

interface EarnSubpageProps {
  depositParams?: DepositParams | null;
}

const EarnSubpage: React.FC<EarnSubpageProps> = ({ depositParams }) => {
  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Earn</h1>
        <p className="text-gray-400">Earn page content will be implemented here.</p>
      </div>
    </div>
  );
};

export default EarnSubpage;
