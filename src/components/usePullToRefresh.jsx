import { useState, useRef } from "react";

export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      // Prevent propagation when scrolled at top to avoid stuttering
      e.preventDefault();
      setPullY(Math.min(delta, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 50) {
      setRefreshing(true);
      try { await onRefresh(); } finally { setRefreshing(false); }
    }
    setPullY(0);
    touchStartY.current = null;
  };

  const PullIndicator = () =>
    pullY > 0 || refreshing ? (
      <div className="flex justify-center py-2 text-white/40 text-sm" style={{ marginTop: pullY / 3 }}>
        {refreshing ? "Refreshing..." : pullY > 50 ? "Release to refresh" : "Pull to refresh"}
      </div>
    ) : null;

  return {
    pullY,
    refreshing,
    PullIndicator,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}