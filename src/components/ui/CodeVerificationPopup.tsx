import React, { useState } from 'react';

interface CodeVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  error?: string;
}

const CodeVerificationPopup: React.FC<CodeVerificationPopupProps> = ({
  isOpen,
  onClose,
  onVerify,
  error: externalError,
}) => {
  const [code, setCode] = useState('');
  const [internalError, setInternalError] = useState('');
  const error = externalError || internalError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 0) {
      setInternalError('Please enter a code');
      return;
    }
    onVerify(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blur background */}
      <div 
        className="absolute inset-0 bg-[#080B17]/60 backdrop-blur-sm"
      />
      
      {/* Combined Popup container */}
      <div className="relative flex bg-[#080B17] rounded-lg overflow-hidden max-w-[850px] w-full text-white border border-[rgba(255,255,255,0.1)] shadow-[0px_0px_25px_0px_rgba(255,255,255,0.05)]">
        {/* Left Side: Form Content */}
        <div className="p-8 w-[450px] flex-shrink-0">
          <h2 
            className="text-[#B88AF8] font-bold mb-3 text-[32px] leading-normal tracking-[-0.877px]"
            style={{ textShadow: '4px 4px 0px #35165F' }} 
          >
            Access to Lucidity's Private Beta
          </h2>
          <p className="text-[#9C9DA2] text-sm font-normal leading-[22px] mb-6">
            No code? Follow us on X, Telegram, or Discord — invites are shared with our community.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setInternalError('');
                }}
                placeholder="Enter your access code"
                className={`w-full px-4 py-3 rounded bg-white/8 text-white border ${
                  error ? 'border-[#EB563C]/15' : 'border-[#3A3A3A]'
                } focus:border-[#B88AF8] focus:outline-none placeholder-gray-500`}
              />
              {error && (
                <div className="mt-2 px-4 py-2 bg-[#F85A3E]/10 rounded">
                  <p className="text-[#F85A3E] text-xs font-normal leading-[18px]">{error}</p>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-[#B88AF8] text-white text-sm font-semibold leading-[16px] hover:bg-[#A87AE8] transition-colors"
            >
              Submit
            </button>
          </form>
        </div>

        {/* Right Side: Image */}
        <div className="flex-grow bg-[#080B17] hidden md:flex"> {/* Removed items-center justify-center */}
          <img 
            src="/images/background/beta-image.svg" 
            alt="Beta Illustration" 
            className="w-full h-full object-cover" // Fill container and cover area
          />
        </div>
      </div>
    </div>
  );
};

export default CodeVerificationPopup;
