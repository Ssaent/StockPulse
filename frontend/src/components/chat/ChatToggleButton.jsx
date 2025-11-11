import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ChatToggleButton({ onClick, onlineCount = 0, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`fixed top-1/2 -translate-y-1/2 z-30 transition-all duration-300 ${
        isOpen
          ? '-right-20 opacity-0 pointer-events-none'
          : 'right-0'
      }`}
      aria-label="Open Chat"
    >
      {/* Tab that sticks out */}
      <div className="flex items-center bg-gradient-to-l from-indigo-500 to-purple-500 rounded-l-xl shadow-2xl hover:pr-2 transition-all group">
        {/* Icon */}
        <div className="p-3">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>

        {/* Online count badge */}
        {onlineCount > 0 && (
          <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full border-2 border-slate-900 animate-pulse">
            {onlineCount}
          </div>
        )}

        {/* Text label (shows on hover) */}
        <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          <span className="text-white font-semibold text-sm pr-3">
            Chat {onlineCount > 0 && `(${onlineCount})`}
          </span>
        </div>
      </div>
    </button>
  );
}