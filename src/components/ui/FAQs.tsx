import React, { useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string;
}

interface FAQsProps {
  items: FAQItemProps[];
  className?: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors border border-[rgba(255,255,255,0.1)]">
      <button
        className="w-full flex justify-between items-center text-left p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[#D7E3EF] font-medium text-[14px] pr-4">{question}</span>
        <svg
          className={`w-4 h-4 text-[#9C9DA2] transform transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-[#9C9DA2] text-[13px] leading-relaxed border-t border-[rgba(255,255,255,0.1)] pt-3">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQs: React.FC<FAQsProps> = ({ items, className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <FAQItem
          key={index}
          question={item.question}
          answer={item.answer}
        />
      ))}
    </div>
  );
};

export { FAQs, type FAQItemProps, type FAQsProps };

