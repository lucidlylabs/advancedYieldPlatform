import React, { useState } from 'react';

interface CodeVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
}

const CodeVerificationPopup: React.FC<CodeVerificationPopupProps> = ({
  isOpen,
  onClose,
  onVerify,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 0) {
      setError('Please enter a code');
      return;
    }
    onVerify(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur background */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup content */}
      <div className="relative bg-[#1A1A1A] rounded-lg p-8 w-[400px] max-w-[90vw]">
        <h2 className="text-2xl font-bold mb-6 text-white">Enter Access Code</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Enter your code"
              className="w-full px-4 py-3 rounded-lg bg-[#2A2A2A] text-white border border-[#3A3A3A] focus:border-[#B88AF8] focus:outline-none"
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-[#B88AF8] text-white hover:bg-[#A87AE8] transition-colors"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CodeVerificationPopup; 