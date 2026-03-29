import React, { useEffect } from "react";
import BottomTabBar from "@/components/BottomTabBar";

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };

    // Apply on mount
    applyTheme(mediaQuery);

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main style={{ paddingBottom: 'calc(4rem + var(--safe-area-inset-bottom))' }}>
        {children}
      </main>
      <BottomTabBar currentPageName={currentPageName} />
    </div>
  );
}