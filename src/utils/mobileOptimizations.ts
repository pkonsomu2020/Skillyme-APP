// Mobile performance optimizations

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Check if device is mobile
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

// Optimize images for mobile
export const getOptimizedImageUrl = (url: string, isMobile: boolean): string => {
  if (isMobile && url.includes('Skillyme LOGO.jpg')) {
    // Return smaller version for mobile if available
    return url;
  }
  return url;
};

// Reduce animation complexity on mobile
export const getMobileAnimationClass = (desktopClass: string, mobileClass: string): string => {
  return isMobile() ? mobileClass : desktopClass;
};

// Lazy load components
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// Virtual scrolling for large lists
export const useVirtualScrolling = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return {
    visibleItems,
    startIndex,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
  
  // Preload critical images
  const logoImg = new Image();
  logoImg.src = '/Skillyme LOGO.jpg';
};

// Optimize bundle loading
export const loadComponentWhenVisible = (
  componentLoader: () => Promise<any>,
  threshold = 0.1
) => {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            componentLoader().then(resolve);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    
    // Observe a placeholder element
    const placeholder = document.createElement('div');
    observer.observe(placeholder);
  });
};

import React from 'react';