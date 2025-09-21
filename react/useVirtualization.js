import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Custom React hook for virtual scrolling
 * @param {Object} options - Virtualization options
 * @param {Array} options.items - Array of items to virtualize
 * @param {number} options.itemHeight - Height of each item
 * @param {number} options.containerHeight - Height of container
 * @param {number} options.overscan - Number of items to render outside viewport
 * @param {Function} options.getItemHeight - Dynamic height function
 * @returns {Object} Virtualization state and utilities
 */
export default function useVirtualization(options = {}) {
  const {
    items = [],
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    getItemHeight = null
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate dynamic heights if provided
  const itemHeights = useMemo(() => {
    if (getItemHeight && typeof getItemHeight === 'function') {
      return items.map((item, index) => getItemHeight(item, index));
    }
    return new Array(items.length).fill(itemHeight);
  }, [items, itemHeight, getItemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return itemHeights.reduce((sum, height) => sum + height, 0);
  }, [itemHeights]);

  // Calculate start and end indices
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    let currentOffset = 0;
    let start = 0;
    let end = 0;
    let foundStart = false;

    for (let i = 0; i < itemHeights.length; i++) {
      const height = itemHeights[i];
      
      if (!foundStart && currentOffset + height > scrollTop) {
        start = Math.max(0, i - overscan);
        foundStart = true;
      }
      
      if (currentOffset > scrollTop + containerHeight) {
        end = Math.min(items.length, i + overscan);
        break;
      }
      
      currentOffset += height;
    }

    if (end === 0) {
      end = items.length;
    }

    // Calculate offset for start index
    const offsetY = itemHeights.slice(0, start).reduce((sum, height) => sum + height, 0);

    return { startIndex: start, endIndex: end, offsetY };
  }, [scrollTop, containerHeight, itemHeights, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      height: itemHeights[startIndex + index]
    }));
  }, [items, startIndex, endIndex, itemHeights]);

  // Handle scroll
  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (containerRef.current) {
      const offset = itemHeights.slice(0, index).reduce((sum, height) => sum + height, 0);
      containerRef.current.scrollTop = offset;
    }
  }, [itemHeights]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  // Get item position
  const getItemPosition = useCallback((index) => {
    const top = itemHeights.slice(0, index).reduce((sum, height) => sum + height, 0);
    const height = itemHeights[index];
    return { top, height, bottom: top + height };
  }, [itemHeights]);

  // Check if item is visible
  const isItemVisible = useCallback((index) => {
    return index >= startIndex && index < endIndex;
  }, [startIndex, endIndex]);

  return {
    containerRef,
    scrollTop,
    totalHeight,
    visibleItems,
    startIndex,
    endIndex,
    offsetY,
    handleScroll,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    getItemPosition,
    isItemVisible,
    itemHeights
  };
}

/**
 * Hook for horizontal virtualization
 * @param {Object} options - Virtualization options
 * @returns {Object} Horizontal virtualization state
 */
export function useHorizontalVirtualization(options = {}) {
  const {
    items = [],
    itemWidth = 200,
    containerWidth = 800,
    overscan = 3,
    getItemWidth = null
  } = options;

  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef(null);

  // Calculate dynamic widths
  const itemWidths = useMemo(() => {
    if (getItemWidth && typeof getItemWidth === 'function') {
      return items.map((item, index) => getItemWidth(item, index));
    }
    return new Array(items.length).fill(itemWidth);
  }, [items, itemWidth, getItemWidth]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return itemWidths.reduce((sum, width) => sum + width, 0);
  }, [itemWidths]);

  // Calculate start and end indices
  const { startIndex, endIndex, offsetX } = useMemo(() => {
    let currentOffset = 0;
    let start = 0;
    let end = 0;
    let foundStart = false;

    for (let i = 0; i < itemWidths.length; i++) {
      const width = itemWidths[i];
      
      if (!foundStart && currentOffset + width > scrollLeft) {
        start = Math.max(0, i - overscan);
        foundStart = true;
      }
      
      if (currentOffset > scrollLeft + containerWidth) {
        end = Math.min(items.length, i + overscan);
        break;
      }
      
      currentOffset += width;
    }

    if (end === 0) {
      end = items.length;
    }

    const offsetX = itemWidths.slice(0, start).reduce((sum, width) => sum + width, 0);

    return { startIndex: start, endIndex: end, offsetX };
  }, [scrollLeft, containerWidth, itemWidths, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      width: itemWidths[startIndex + index]
    }));
  }, [items, startIndex, endIndex, itemWidths]);

  // Handle scroll
  const handleScroll = useCallback((event) => {
    setScrollLeft(event.target.scrollLeft);
  }, []);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (containerRef.current) {
      const offset = itemWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
      containerRef.current.scrollLeft = offset;
    }
  }, [itemWidths]);

  return {
    containerRef,
    scrollLeft,
    totalWidth,
    visibleItems,
    startIndex,
    endIndex,
    offsetX,
    handleScroll,
    scrollToItem,
    itemWidths
  };
}

/**
 * Hook for grid virtualization
 * @param {Object} options - Grid virtualization options
 * @returns {Object} Grid virtualization state
 */
export function useGridVirtualization(options = {}) {
  const {
    items = [],
    itemWidth = 200,
    itemHeight = 200,
    containerWidth = 800,
    containerHeight = 600,
    gap = 10,
    overscan = 2
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef(null);

  // Calculate grid dimensions
  const { columns, rows, totalWidth, totalHeight } = useMemo(() => {
    const cols = Math.floor((containerWidth + gap) / (itemWidth + gap));
    const rows = Math.ceil(items.length / cols);
    const width = cols * itemWidth + (cols - 1) * gap;
    const height = rows * itemHeight + (rows - 1) * gap;
    
    return { columns: cols, rows, totalWidth: width, totalHeight: height };
  }, [items.length, itemWidth, itemHeight, containerWidth, gap]);

  // Calculate visible range
  const { startRow, endRow, startCol, endCol, offsetY, offsetX } = useMemo(() => {
    const startRowIndex = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRowIndex = Math.min(
      rows,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );
    
    const startColIndex = Math.max(0, Math.floor(scrollLeft / (itemWidth + gap)) - overscan);
    const endColIndex = Math.min(
      columns,
      Math.ceil((scrollLeft + containerWidth) / (itemWidth + gap)) + overscan
    );

    const offsetY = startRowIndex * (itemHeight + gap);
    const offsetX = startColIndex * (itemWidth + gap);

    return {
      startRow: startRowIndex,
      endRow: endRowIndex,
      startCol: startColIndex,
      endCol: endColIndex,
      offsetY,
      offsetX
    };
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, itemHeight, itemWidth, gap, overscan, rows, columns]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const items = [];
    
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const index = row * columns + col;
        if (index < options.items.length) {
          items.push({
            item: options.items[index],
            index,
            row,
            col,
            x: col * (itemWidth + gap),
            y: row * (itemHeight + gap)
          });
        }
      }
    }
    
    return items;
  }, [startRow, endRow, startCol, endCol, columns, options.items, itemWidth, itemHeight, gap]);

  // Handle scroll
  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
    setScrollLeft(event.target.scrollLeft);
  }, []);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (containerRef.current) {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = col * (itemWidth + gap);
      const y = row * (itemHeight + gap);
      
      containerRef.current.scrollLeft = x;
      containerRef.current.scrollTop = y;
    }
  }, [columns, itemWidth, itemHeight, gap]);

  return {
    containerRef,
    scrollTop,
    scrollLeft,
    totalWidth,
    totalHeight,
    visibleItems,
    columns,
    rows,
    startRow,
    endRow,
    startCol,
    endCol,
    offsetY,
    offsetX,
    handleScroll,
    scrollToItem
  };
}

/**
 * Hook for window-based virtualization
 * @param {Object} options - Window virtualization options
 * @returns {Object} Window virtualization state
 */
export function useWindowVirtualization(options = {}) {
  const {
    items = [],
    itemHeight = 50,
    overscan = 5,
    getItemHeight = null,
    windowSize = 10
  } = options;

  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(windowSize);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Calculate dynamic heights
  const itemHeights = useMemo(() => {
    if (getItemHeight && typeof getItemHeight === 'function') {
      return items.map((item, index) => getItemHeight(item, index));
    }
    return new Array(items.length).fill(itemHeight);
  }, [items, itemHeight, getItemHeight]);

  // Get window items
  const windowItems = useMemo(() => {
    const start = Math.max(0, windowStart - overscan);
    const end = Math.min(items.length, windowEnd + overscan);
    
    return items.slice(start, end).map((item, index) => ({
      item,
      index: start + index,
      height: itemHeights[start + index]
    }));
  }, [items, windowStart, windowEnd, overscan, itemHeights]);

  // Move window up
  const moveWindowUp = useCallback((amount = 1) => {
    setWindowStart(prev => Math.max(0, prev - amount));
    setWindowEnd(prev => Math.min(items.length, prev - amount));
  }, [items.length]);

  // Move window down
  const moveWindowDown = useCallback((amount = 1) => {
    setWindowStart(prev => Math.min(items.length - windowSize, prev + amount));
    setWindowEnd(prev => Math.min(items.length, prev + amount));
  }, [items.length, windowSize]);

  // Set window position
  const setWindowPosition = useCallback((start) => {
    const clampedStart = Math.max(0, Math.min(start, items.length - windowSize));
    setWindowStart(clampedStart);
    setWindowEnd(clampedStart + windowSize);
  }, [items.length, windowSize]);

  // Check if item is in window
  const isInWindow = useCallback((index) => {
    return index >= windowStart && index < windowEnd;
  }, [windowStart, windowEnd]);

  return {
    windowStart,
    windowEnd,
    windowItems,
    scrollPosition,
    setScrollPosition,
    moveWindowUp,
    moveWindowDown,
    setWindowPosition,
    isInWindow,
    itemHeights
  };
}
