import React from 'react';
import { ConversationMessage } from '../../types';

interface AskBubbleProps {
  message: ConversationMessage;
}

export const AskBubble: React.FC<AskBubbleProps> = ({ message }) => {
  const isReed = message.sender === 'reed';

  return (
    <div className={`flex flex-col mb-4 ${isReed ? 'items-start' : 'items-end'}`}>
      <div
        className={`max-w-[85%] rounded-md p-4 transition-all duration-states ${
          isReed
            ? 'bg-reed-soft text-ink border border-line'
            : 'bg-paper-sunk text-ink'
        }`}
      >
        {isReed && (
          <div className="flex items-center gap-1.5 mb-1.5 select-none">
            <span className="w-[2.5px] h-3.5 bg-reed rounded-full" />
            <span className="font-serif font-semibold text-xs tracking-tight text-ink">
              Reed
            </span>
          </div>
        )}

        {message.paragraphQuote && (
          <div className="border-l-2 border-line-strong pl-2.5 mb-2.5 text-xs italic text-ink-muted font-serif">
            «{message.paragraphQuote}»
          </div>
        )}

        <p className="text-[15px] sm:text-[16px] leading-[24px] font-sans whitespace-pre-line">
          {message.text}
        </p>
      </div>

      <span className="text-[11px] text-ink-muted mt-1 px-1 font-sans">
        {message.timestamp}
      </span>
    </div>
  );
};
