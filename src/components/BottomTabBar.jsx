import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home as HomeIcon, BookOpen as BookIcon, User as UserIcon, Sparkles as SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { tabHistoryManager } from "@/lib/TabHistoryManager";

const TABS = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Wellness", icon: SparklesIcon, page: "Chat" },
  { label: "Library", icon: BookIcon, page: "CommunityPresets" },
  { label: "Profile", icon: UserIcon, page: "Profile" },
];

const SCROLL_KEY = (page) => `tab_scroll_${page}`;

function saveScrollPosition(page) {
  const el = document.querySelector("[data-tab-content]");
  if (el) {
    sessionStorage.setItem(SCROLL_KEY(page), String(el.scrollTop));
  }
}

function restoreScrollPosition(page) {
  const el = document.querySelector("[data-tab-content]");
  if (!el) return;
  const saved = sessionStorage.getItem(SCROLL_KEY(page));
  if (saved !== null) {
    // Defer until after paint so new page content is measured
    requestAnimationFrame(() => {
      el.scrollTop = Number(saved);
    });
  } else {
    el.scrollTop = 0;
  }
}

export default function BottomTabBar({ currentPageName }) {
  const location = useLocation();

  // Track which tab is active and update history stack
  useEffect(() => {
    const tabConfig = TABS.find((t) => t.page === currentPageName);
    if (tabConfig) {
      tabHistoryManager.push(currentPageName, location.pathname);
    }
  }, [currentPageName, location.pathname]);

  // Save position whenever the active tab changes (i.e. we're leaving it)
  useEffect(() => {
    return () => {
      saveScrollPosition(currentPageName);
    };
  }, [currentPageName]);

  // Restore position when the tab becomes active
  useEffect(() => {
    restoreScrollPosition(currentPageName);
  }, [currentPageName]);

  const handleTabClick = (e, tab) => {
    if (currentPageName === tab.page) {
      // Tap same tab → scroll to top and clear saved position
      e.preventDefault();
      const el = document.querySelector("[data-tab-content]");
      if (el) el.scrollTo({ top: 0, behavior: "smooth" });
      sessionStorage.removeItem(SCROLL_KEY(tab.page));
    } else {
      // Save current tab's scroll before navigating
      saveScrollPosition(currentPageName);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.08]"
      style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPageName === tab.page;
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              onClick={(e) => handleTabClick(e, tab)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all select-none min-h-[44px] min-w-[44px] justify-center",
                isActive ? "text-emerald-400" : "text-white/60 active:text-white/80"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}