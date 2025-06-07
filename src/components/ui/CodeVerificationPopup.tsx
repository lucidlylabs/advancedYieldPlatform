import React, { useState } from "react";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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
    const [code, setCode] = useState("");
    const [internalError, setInternalError] = useState("");
    const error = externalError || internalError;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length === 0) {
            setInternalError("Please enter a code");
            return;
        }
        onVerify(code);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#080B17]/60 backdrop-blur-sm" />
            <div className="relative flex bg-[#080B17] rounded-lg overflow-hidden max-w-[800px] w-full text-white border border-[rgba(255,255,255,0.1)] h-[406px]">
                <div className="py-8 px-10 w-[450px] flex-shrink-0 flex flex-col justify-between">
                    <div>
                        <h2
                            className="text-[#B88AF8] font-bold mb-3 text-[32px] leading-normal tracking-[-0.877px]"
                        >
                            Access Lucidly Private Beta
                        </h2>
                        <p className="text-[#9C9DA2] text-sm font-normal leading-[22px] mb-6">
                            No code? Follow us on X, Telegram, or Discord — invites are shared
                            with our community.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        setInternalError("");
                                    }}
                                    placeholder="Enter your access code"
                                    className={`w-full px-4 py-3 rounded bg-[#0F111D] text-white ${error ? "border border-[#EB563C]/15" : "border-transparent"
                                        } focus:border-[#B88AF8] focus:outline-none placeholder-gray-500`}
                                />
                                {error && (
                                    <div className="mt-2 px-4 py-2 bg-[#F85A3E]/10 rounded">
                                        <p className="text-[#F85A3E] text-xs font-normal leading-[18px]">
                                            {error}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Bottom section: Button and Icons */}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-6 py-3 rounded-lg bg-[#B88AF8] text-white text-sm font-semibold leading-[16px] hover:bg-[#A87AE8] transition-colors w-[210px]"
                        >
                            Submit
                        </button>
                        {/* Social Icons group */}
                        <div className="flex items-center gap-7">
                            <a
                                href="https://discord.gg/6TZX89RPWW"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white"
                            >
                                <FaDiscord size={24} />
                            </a>
                            <a
                                href="https://x.com/LucidlyFinance"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white"
                            >
                                <FaXTwitter size={24} />
                            </a>
                            <a
                                href="https://t.me/lucidlyfi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white"
                            >
                                <FaTelegramPlane size={24} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Side: Image */}
                <div className="flex-grow bg-[#080B17] hidden md:flex">
                    {" "}
                    {/* Removed items-center justify-center */}
                    <img
                        src="https://lucidlyfinance.s3.eu-north-1.amazonaws.com/beta-image.svg"
                        alt="Beta Illustration"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

export default CodeVerificationPopup;
