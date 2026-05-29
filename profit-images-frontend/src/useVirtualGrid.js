import { useState, useEffect, useRef, useCallback } from 'react';

const PAGE = 80; // cards rendered per batch

export function useVirtualGrid(items) {
  const [visible, setVisible] = useState(PAGE);
  const sentinelRef = useRef(null);

  // Reset when items change (folder switch)
  useEffect(() => {
    setVisible(PAGE);
  }, [items]);

  const loadMore = useCallback(() => {
    setVisible((prev) => Math.min(prev + PAGE, items.length));
  }, [items.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    visibleItems: items.slice(0, visible),
    hasMore: visible < items.length,
    remaining: items.length - visible,
    sentinelRef,
  };
}
