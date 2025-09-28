"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Responsive container component with mobile-first approach
 * Provides consistent spacing and max-widths across breakpoints
 */
export function ResponsiveContainer({
  children,
  className,
  size = 'lg',
  padding = 'md',
  as: Component = 'div',
}: ResponsiveContainerProps) {
  // Mobile-first max-width classes
  const sizeClasses = {
    sm: 'max-w-2xl',      // 672px
    md: 'max-w-4xl',      // 896px  
    lg: 'max-w-6xl',      // 1152px
    xl: 'max-w-7xl',      // 1280px
    full: 'max-w-full',   // No max width
  };

  // Mobile-first padding classes
  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4',                    // 12px mobile, 16px sm+
    md: 'px-4 sm:px-6 lg:px-8',           // 16px mobile, 24px sm+, 32px lg+
    lg: 'px-6 sm:px-8 lg:px-12',          // 24px mobile, 32px sm+, 48px lg+
    xl: 'px-8 sm:px-12 lg:px-16',         // 32px mobile, 48px sm+, 64px lg+
  };

  const containerClasses = cn(
    'w-full mx-auto',
    sizeClasses[size],
    paddingClasses[padding],
    className
  );

  return (
    <Component className={containerClasses}>
      {children}
    </Component>
  );
}

/**
 * Grid container with responsive columns
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
}: ResponsiveGridProps) {
  // Mobile-first grid column classes
  const getColClasses = () => {
    const classes = [];
    
    if (cols.xs) classes.push(`grid-cols-${cols.xs}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  };

  // Gap classes
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',           // 12px mobile, 16px sm+
    md: 'gap-4 sm:gap-6',           // 16px mobile, 24px sm+
    lg: 'gap-6 sm:gap-8',           // 24px mobile, 32px sm+
    xl: 'gap-8 sm:gap-12',          // 32px mobile, 48px sm+
  };

  return (
    <div className={cn(
      'grid',
      getColClasses(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Responsive flex container
 */
interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    xs?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
}

export function ResponsiveFlex({
  children,
  className,
  direction = { xs: 'col', md: 'row' },
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
}: ResponsiveFlexProps) {
  // Direction classes
  const getDirectionClasses = () => {
    const classes = [];
    
    if (direction.xs) classes.push(`flex-${direction.xs}`);
    if (direction.sm) classes.push(`sm:flex-${direction.sm}`);
    if (direction.md) classes.push(`md:flex-${direction.md}`);
    if (direction.lg) classes.push(`lg:flex-${direction.lg}`);
    
    return classes.join(' ');
  };

  // Alignment classes
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  // Gap classes
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
    xl: 'gap-6 sm:gap-8',
  };

  return (
    <div className={cn(
      'flex',
      getDirectionClasses(),
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Responsive stack component (vertical spacing)
 */
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  space?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function ResponsiveStack({
  children,
  className,
  space = 'md',
  align = 'stretch',
}: ResponsiveStackProps) {
  const spaceClasses = {
    sm: 'space-y-2 sm:space-y-3',        // 8px mobile, 12px sm+
    md: 'space-y-4 sm:space-y-6',        // 16px mobile, 24px sm+
    lg: 'space-y-6 sm:space-y-8',        // 24px mobile, 32px sm+
    xl: 'space-y-8 sm:space-y-12',       // 32px mobile, 48px sm+
    '2xl': 'space-y-12 sm:space-y-16',   // 48px mobile, 64px sm+
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div className={cn(
      'flex flex-col',
      spaceClasses[space],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Responsive section with proper spacing
 */
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'white' | 'gray' | 'transparent';
}

export function ResponsiveSection({
  children,
  className,
  padding = 'lg',
  background = 'transparent',
}: ResponsiveSectionProps) {
  const paddingClasses = {
    sm: 'py-8 sm:py-12',          // 32px mobile, 48px sm+
    md: 'py-12 sm:py-16',         // 48px mobile, 64px sm+
    lg: 'py-16 sm:py-20',         // 64px mobile, 80px sm+
    xl: 'py-20 sm:py-24',         // 80px mobile, 96px sm+
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent',
  };

  return (
    <section className={cn(
      paddingClasses[padding],
      backgroundClasses[background],
      className
    )}>
      {children}
    </section>
  );
}
