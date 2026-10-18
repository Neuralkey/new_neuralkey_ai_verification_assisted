import React from 'react';
import { Sparkles, Smartphone, Landmark, RotateCcw } from 'lucide-react';
import { NeuralkeyLogo } from './NeuralkeyLogo';

interface HeaderProps {
  currentTab: 'console' | 'wallet' | 'bank';
  onSelectTab: (tab: 'console' | 'wallet' | 'bank') => void;
  pendingCount: number;
  onOpenAboutModal?: () => void;
  onResetDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  onOpenAboutModal,
  onResetDemo,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
        {/* Top Row on Mobile/Tablet: Brand + Right Action Buttons */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto min-w-0">
          {/* Brand */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0"
            onClick={() => onSelectTab('console')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center p-1.5">
                <NeuralkeyLogo className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white truncate block">
                NeuralKey
              </span>
            </div>
          </div>

          {/* Mobile/Tablet Right Controls (Shown on < lg in top row) */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            {onResetDemo && (
              <button
                onClick={onResetDemo}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs: 3 Equal Columns on Mobile/Tablet, Inline Pill Bar on Desktop */}
        <nav
          aria-label="Primary Views"
          className="grid grid-cols-3 lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm w-full lg:w-auto min-w-0"
        >
          <button
            onClick={() => onSelectTab('console')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2 lg:py-1.5 rounded-lg font-semibold cursor-pointer transition-all min-w-0 text-center ${
              currentTab === 'console'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 hidden sm:inline shrink-0" />
            <span className="truncate text-[11px] sm:text-xs md:text-sm">Reviewer Console</span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-400/30 text-white font-bold shrink-0">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('wallet')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2 lg:py-1.5 rounded-lg font-semibold cursor-pointer transition-all min-w-0 text-center ${
              currentTab === 'wallet'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 hidden sm:inline shrink-0" />
            <span className="truncate text-[11px] sm:text-xs md:text-sm">Mobile App</span>
          </button>

          <button
            onClick={() => onSelectTab('bank')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2 lg:py-1.5 rounded-lg font-semibold cursor-pointer transition-all min-w-0 text-center ${
              currentTab === 'bank'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 hidden sm:inline shrink-0" />
            <span className="truncate text-[11px] sm:text-xs md:text-sm">Bank Portal</span>
          </button>
        </nav>

        {/* Desktop Right Controls (Shown on lg+) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
