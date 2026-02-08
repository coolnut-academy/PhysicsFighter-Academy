'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'default' | 'white' | 'small' | 'large';
}

export function Logo({ className, width, height, variant = 'default' }: LogoProps) {
  const sizeClasses = {
    default: 'w-8 h-8',
    small: 'w-5 h-5',
    large: 'w-12 h-12',
    white: 'w-8 h-8',
  };

  const dimensions = {
    default: { w: 32, h: 27 },
    small: { w: 20, h: 17 },
    large: { w: 48, h: 40 },
    white: { w: 32, h: 27 },
  };

  const size = dimensions[variant];

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[variant], className)}>
      <Image
        src="/logo/Physics Fighter ไม่มีพื้นหลัง.png"
        alt="Physics Fighter Academy"
        width={width || size.w}
        height={height || size.h}
        className="object-contain w-full h-full"
        priority
      />
    </div>
  );
}

// Simple Logo Icon without text - for use in navbars, buttons, etc.
export function LogoIcon({ className, size = 32, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={style}>
      <Image
        src="/logo/Physics Fighter ไม่มีพื้นหลัง.png"
        alt="Physics Fighter Academy"
        width={size}
        height={size * 0.84}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Logo with Text for headers
export function LogoWithText({ 
  className, 
  showText = true,
  textClassName 
}: { 
  className?: string; 
  showText?: boolean;
  textClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative bg-fighter-red p-2 border-2 border-ink-black -skew-x-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <LogoIcon size={28} className="relative z-10" style={{ transform: 'skewX(6deg)' }} />
      </div>
      {showText && (
        <span className={cn('text-xl font-heading uppercase text-ink-black -skew-x-3', textClassName)}>
          Physics Fighter
        </span>
      )}
    </div>
  );
}
