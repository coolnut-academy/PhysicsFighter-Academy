"use client";

import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'small' | 'large' | 'full';
}

const containerSizeClasses = {
  small: 'max-w-3xl',
  default: 'max-w-7xl',
  large: 'max-w-[1600px]',
  full: 'max-w-none',
};

export function ResponsiveContainer({ 
  children, 
  className,
  size = 'default'
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      'mx-auto w-full px-4 sm:px-6 lg:px-8',
      containerSizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}

// Grid layout for cards/items
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'small' | 'default' | 'large';
}

const gapClasses = {
  none: 'gap-0',
  small: 'gap-3',
  default: 'gap-4 sm:gap-6',
  large: 'gap-6 sm:gap-8',
};

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'default'
}: ResponsiveGridProps) {
  const getColsClass = () => {
    const classes: string[] = ['grid'];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={cn(
      getColsClass(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Flex layout that stacks on mobile
interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'none' | 'small' | 'default' | 'large';
  reverse?: boolean;
}

export function ResponsiveFlex({
  children,
  className,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = 'default',
  reverse = false,
}: ResponsiveFlexProps) {
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
  };

  return (
    <div className={cn(
      'flex',
      direction === 'col' ? 'flex-col' : 'flex-col sm:flex-row',
      reverse && (direction === 'col' ? 'flex-col-reverse' : 'flex-col-reverse sm:flex-row-reverse'),
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Section with consistent spacing
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'none' | 'small' | 'default' | 'large';
}

const spacingClasses = {
  none: 'py-0',
  small: 'py-4 sm:py-6',
  default: 'py-6 sm:py-8 lg:py-12',
  large: 'py-8 sm:py-12 lg:py-16',
};

export function ResponsiveSection({
  children,
  className,
  spacing = 'default',
}: ResponsiveSectionProps) {
  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
}

// Card that adapts to screen size
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'default' | 'large';
  hover?: boolean;
}

const paddingClasses = {
  none: 'p-0',
  small: 'p-3 sm:p-4',
  default: 'p-4 sm:p-6',
  large: 'p-6 sm:p-8',
};

export function ResponsiveCard({
  children,
  className,
  padding = 'default',
  hover = true,
}: ResponsiveCardProps) {
  return (
    <div className={cn(
      'bg-white border-2 sm:border-[3px] border-ink-black rounded-lg sm:rounded-xl',
      paddingClasses[padding],
      hover && 'transition-all duration-200 hover:shadow-arcade hover:-translate-y-1',
      className
    )}>
      {children}
    </div>
  );
}

// Typography that scales with screen size
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
  '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function ResponsiveText({
  children,
  className,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
}: ResponsiveTextProps) {
  return (
    <Component className={cn(
      textSizeClasses[size],
      weightClasses[weight],
      className
    )}>
      {children}
    </Component>
  );
}
