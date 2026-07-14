import React from 'react';

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '12px 16px', width: 'fit-content' }}>
      <div className="dot" style={{ animationDelay: '0ms' }} />
      <div className="dot" style={{ animationDelay: '150ms' }} />
      <div className="dot" style={{ animationDelay: '300ms' }} />
      
      <style>{`
        .dot {
          width: 8px;
          height: 8px;
          background-color: var(--text-tertiary);
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.2s infinite ease-in-out;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
