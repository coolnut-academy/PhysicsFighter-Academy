import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, differenceInHours, isPast, formatDistanceToNow } from 'date-fns';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
          return twMerge(clsx(inputs));
}

/**
 * Format currency in Thai Baht
 */
export function formatCurrency(amount: number): string {
          return new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
          }).format(amount);
}

/**
 * Format date in Thai format
 */
export function formatDate(date: Date | number): string {
          return new Intl.DateTimeFormat('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
          }).format(date);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | number): string {
          return new Intl.DateTimeFormat('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
          }).format(date);
}

/**
 * Returns a relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date): string {
          return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Calculate time remaining for enrollment with expiration
 */
export interface TimeRemaining {
          days: number;
          hours: number;
          expired: boolean;
          percentage: number; // 0-100 for progress bar
}

export function calculateTimeRemaining(enrollment: any): TimeRemaining {
          const now = new Date();
          const expiresAt = enrollment.expiresAt instanceof Date
                    ? enrollment.expiresAt
                    : enrollment.expiresAt.toDate();
          const startDate = enrollment.startDate instanceof Date
                    ? enrollment.startDate
                    : enrollment.startDate.toDate();

          const expired = isPast(expiresAt);

          if (expired) {
                    return {
                              days: 0,
                              hours: 0,
                              expired: true,
                              percentage: 0,
                    };
          }

          const days = differenceInDays(expiresAt, now);
          const hours = differenceInHours(expiresAt, now) % 24;

          // Calculate percentage of time remaining
          const totalDuration = expiresAt.getTime() - startDate.getTime();
          const timeUsed = now.getTime() - startDate.getTime();
          const percentage = Math.max(0, Math.min(100, 100 - (timeUsed / totalDuration) * 100));

          return {
                    days,
                    hours,
                    expired: false,
                    percentage,
          };
}
/**
 * Calculate days remaining until expiry
 */
export function getDaysRemaining(expiryDate: Date): number {
          const now = new Date();
          const diff = expiryDate.getTime() - now.getTime();
          return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if date has expired
 */
export function isExpired(expiryDate: Date): boolean {
          return new Date() > expiryDate;
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
          if (text.length <= length) return text;
          return text.substring(0, length) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
          return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Generate random ID
 */
export function generateId(): string {
          return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Get YouTube Embed URL from various YouTube URL formats
 */
export function getYouTubeEmbedUrl(url: string): string | null {
          if (!url) return null;

          // Handle already embedded URLs
          if (url.includes('embed')) return url;

          // Regular expression for YouTube URLs
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);

          return (match && match[2].length === 11)
                    ? `https://www.youtube.com/embed/${match[2]}`
                    : null;
}

/**
 * Compress image to a reasonable size (max dimension 1280px, 0.7 quality)
 */
export function compressImage(file: File): Promise<File> {
          return new Promise((resolve, reject) => {
                    // Create an image object
                    const img = new Image();
                    const reader = new FileReader();

                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                              if (e.target?.result) {
                                        img.src = e.target.result as string;
                              }
                    };
                    reader.onerror = (error) => reject(error);

                    img.onload = () => {
                              // Dimensions
                              const MAX_WIDTH = 1280;
                              const MAX_HEIGHT = 720;
                              let width = img.width;
                              let height = img.height;

                              // Calculate new dimensions
                              if (width > height) {
                                        if (width > MAX_WIDTH) {
                                                  height *= MAX_WIDTH / width;
                                                  width = MAX_WIDTH;
                                        }
                              } else {
                                        if (height > MAX_HEIGHT) {
                                                  width *= MAX_HEIGHT / height;
                                                  height = MAX_HEIGHT;
                                        }
                              }

                              // Create canvas
                              const canvas = document.createElement('canvas');
                              canvas.width = width;
                              canvas.height = height;

                              // Draw image on canvas
                              const ctx = canvas.getContext('2d');
                              if (!ctx) {
                                        reject(new Error('Failed to get canvas context'));
                                        return;
                              }
                              ctx.drawImage(img, 0, 0, width, height);

                              // Convert to file
                              canvas.toBlob(
                                        (blob) => {
                                                  if (blob) {
                                                            const compressedFile = new File([blob], file.name, {
                                                                      type: 'image/jpeg',
                                                                      lastModified: Date.now(),
                                                            });
                                                            resolve(compressedFile);
                                                  } else {
                                                            reject(new Error('Failed to compress image'));
                                                  }
                                        },
                                        'image/jpeg',
                                        0.7 // 70% quality
                              );
                    };
                    img.onerror = (error) => reject(error);
          });
}
