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
        onClick={onClose}
      />
      
      {/* Combined Popup container */}
      <div className="relative flex bg-[#121526] rounded-lg overflow-hidden max-w-[850px] w-full text-white border border-[rgba(255,255,255,0.1)]">
        {/* Left Side: Form Content */}
        <div className="p-8 w-[450px] flex-shrink-0">
          <h2 className="text-3xl font-bold mb-3 text-center">Access to Lucidity's Private Beta</h2>
          <p className="text-sm text-gray-400 mb-6 text-center">
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
                className={`w-full px-4 py-3 rounded-lg bg-[#0F111D] text-white border ${ 
                  error ? 'border-red-500' : 'border-[#3A3A3A]'
                } focus:border-[#B88AF8] focus:outline-none placeholder-gray-500`}
              />
              {error && (
                <div className="mt-2 px-4 py-2 bg-[#4B1A1A] border border-red-600 rounded-md">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-[#B88AF8] text-white font-semibold hover:bg-[#A87AE8] transition-colors"
            >
              Submit
            </button>
          </form>
        </div>

        {/* Right Side: Image */}
        <div className="flex-grow flex items-center justify-center bg-[#080B17] p-4 hidden md:flex"> {/* Hide on small screens */}
          <img 
            src="/images/background/beta-image.svg" 
            alt="Beta Illustration" 
            className="max-w-full h-auto object-contain"
            style={{ maxHeight: '400px' }} // Optional: constrain image height if needed
          />
        </div>
      </div>
    </div>
  );
};

export default CodeVerificationPopup;
