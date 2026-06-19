import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const OVERSCAN = 5;
const ROW_HEIGHT = 88;

export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  overscan: number = OVERSCAN
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * ROW_HEIGHT;

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
    const end = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + overscan);
    return { start, end };
  }, [scrollTop, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange.start, visibleRange.end]
  );

  const onScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const paddingTop = visibleRange.start * ROW_HEIGHT;
  const paddingBottom = (items.length - visibleRange.end) * ROW_HEIGHT;

  return {
    containerRef,
    onScroll,
    visibleItems,
    paddingTop,
    paddingBottom,
    totalHeight,
    scrollTop,
  };
}

export { ROW_HEIGHT };
