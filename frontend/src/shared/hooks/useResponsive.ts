"use client";

import { useState, useEffect } from 'react';

// Mobile-first breakpoints (matching Tailwind CSS)
const breakpoints = {
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices (large desktops)
  '2xl': 1536, // 2X large devices (larger desktops)
} as const;

type Breakpoint = keyof typeof breakpoints;

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  breakpoint: Breakpoint | 'xs';
}

/**
 * Custom hook for responsive design with mobile-first approach
 * Returns current screen size information and breakpoint helpers
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    width: 0,
    height: 0,
    isMobile: true, // Default to mobile-first
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    breakpoint: 'xs',
  });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine breakpoint (mobile-first)
      let breakpoint: Breakpoint | 'xs' = 'xs';
      if (width >= breakpoints['2xl']) breakpoint = '2xl';
      else if (width >= breakpoints.xl) breakpoint = 'xl';
      else if (width >= breakpoints.lg) breakpoint = 'lg';
      else if (width >= breakpoints.md) breakpoint = 'md';
      else if (width >= breakpoints.sm) breakpoint = 'sm';

      setState({
        width,
        height,
        isMobile: width < breakpoints.md, // < 768px
        isTablet: width >= breakpoints.md && width < breakpoints.lg, // 768px - 1023px
        isDesktop: width >= breakpoints.lg && width < breakpoints.xl, // 1024px - 1279px
        isLargeDesktop: width >= breakpoints.xl, // >= 1280px
        breakpoint,
      });
    };

    // Set initial size
    updateSize();

    // Add event listener with throttling for performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 100); // Throttle to 10fps
    };

    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
}

/**
 * Hook to check if current screen matches a specific breakpoint or larger
 * @param breakpoint - The minimum breakpoint to match
 * @returns boolean indicating if screen is at or above the breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useResponsive();
  return width >= breakpoints[breakpoint];
}

/**
 * Hook to get responsive values based on current breakpoint
 * @param values - Object with breakpoint keys and corresponding values
 * @returns The value for the current breakpoint (mobile-first)
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined {
  const { breakpoint } = useResponsive();

  // Mobile-first approach: return the largest matching breakpoint value
  if (breakpoint === '2xl' && values['2xl']) return values['2xl'];
  if ((breakpoint === '2xl' || breakpoint === 'xl') && values.xl) return values.xl;
  if ((breakpoint === '2xl' || breakpoint === 'xl' || breakpoint === 'lg') && values.lg) return values.lg;
  if ((breakpoint === '2xl' || breakpoint === 'xl' || breakpoint === 'lg' || breakpoint === 'md') && values.md) return values.md;
  if (breakpoint !== 'xs' && values.sm) return values.sm;
  
  return values.xs;
}

/**
 * Utility function to check if device is likely touch-enabled
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - Legacy property
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const { width, height } = useResponsive();
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Hook for safe area insets (useful for mobile devices with notches)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Export breakpoints for use in other components
export { breakpoints };
