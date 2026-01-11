import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
          className?: string;
          text?: string;
}

export function Loading({ className, text = 'Loading...' }: LoadingProps) {
          return (
                    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
                              <Loader2 className="w-12 h-12 animate-spin text-neon-cyan" />
                              {text && <p className="text-dark-text-secondary">{text}</p>}
                    </div>
          );
}

export function PageLoading() {
          return (
                    <div className="min-h-screen flex items-center justify-center">
                              <Loading />
                    </div>
          );
}

export function SpinnerSmall() {
          return <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />;
}
