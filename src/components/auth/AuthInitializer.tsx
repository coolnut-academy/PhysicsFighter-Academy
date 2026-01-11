'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * AuthInitializer - Initializes Firebase auth listener on app mount
 * Should be included in root layout
 */
export function AuthInitializer() {
          const initialize = useAuthStore((state) => state.initialize);

          useEffect(() => {
                    // Initialize auth listener
                    const unsubscribe = initialize();

                    // Cleanup on unmount
                    return () => {
                              unsubscribe();
                    };
          }, [initialize]);

          return null;
}
