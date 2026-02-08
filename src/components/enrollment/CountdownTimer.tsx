'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: Date | { toDate: () => Date } | number;
}

interface TimeLeft {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const calculateTimeLeft = (): TimeLeft => {
    let targetDate: Date;
    
    if (expiresAt instanceof Date) {
      targetDate = expiresAt;
    } else if (typeof expiresAt === 'object' && 'toDate' in expiresAt) {
      targetDate = expiresAt.toDate();
    } else if (typeof expiresAt === 'number') {
      targetDate = new Date(expiresAt);
    } else {
      return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    // Calculate months (approximate: 30.44 days per month)
    const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
    const daysAfterMonths = difference % (1000 * 60 * 60 * 24 * 30.44);
    
    const days = Math.floor(daysAfterMonths / (1000 * 60 * 60 * 24));
    const hours = Math.floor((daysAfterMonths % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((daysAfterMonths % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((daysAfterMonths % (1000 * 60)) / 1000);

    return { months, days, hours, minutes, seconds, isExpired: false };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      
      if (updated.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-red-600 font-bold text-sm">
        ⏰ หมดเวลาเรียนแล้ว
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {timeLeft.months > 0 && (
        <span className="bg-fighter-red text-white px-2 py-1 rounded font-bold">
          {timeLeft.months} เดือน
        </span>
      )}
      {timeLeft.days > 0 && (
        <span className="bg-golden text-ink-black px-2 py-1 rounded font-bold">
          {timeLeft.days} วัน
        </span>
      )}
      <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono">
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export function formatDuration(months: number): string {
  if (months === 3) return '3 เดือน';
  if (months === 6) return '6 เดือน';
  if (months === 12) return '12 เดือน (1 ปี)';
  return `${months} เดือน`;
}
