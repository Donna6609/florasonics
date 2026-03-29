import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAIN_TABS = ['Home', 'Chat', 'CommunityPresets', 'Profile'];

export default function Header({ currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMainTab = MAIN_TABS.includes(currentPageName);

  // Format page name for display
  const getPageTitle = () => {
    if (isMainTab) return null;
    return currentPageName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-white/[0.08] md:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center justify-between px-4 py-3 h-14">
        {isMainTab ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="text-lg font-light text-white/90">FloraSonics</span>
            </div>
            <div className="w-6" />
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors active:opacity-70 min-w-[44px] min-h-[44px]"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-medium text-white/90 flex-1 text-center">
              {getPageTitle()}
            </h1>
            <div className="w-6" />
          </>
        )}
      </div>
    </header>
  );
}