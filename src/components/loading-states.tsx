/**
 * Loading State Components
 *
 * Reusable loading skeletons and spinners for consistent UX.
 * Provides various loading states for different components.
 */

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full Page Loading Spinner
 *
 * Centered loading spinner for full-page loads
 */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Button Loading Spinner
 *
 * Small spinner for button loading states
 */
export function ButtonLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {text}
    </>
  );
}

/**
 * Table Loading Skeleton
 *
 * Skeleton for table/list loading states
 */
export function TableLoader({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Loading Skeleton
 *
 * Skeleton for card components
 */
export function CardLoader() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Loading Skeleton
 *
 * Skeleton for dashboard pages with cards
 */
export function DashboardLoader() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/3 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardLoader key={i} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CardLoader />
        <CardLoader />
      </div>
    </div>
  );
}

/**
 * Form Loading Skeleton
 *
 * Skeleton for form components
 */
export function FormLoader() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

/**
 * Chat Loading Skeleton
 *
 * Skeleton for chat/message components
 */
export function ChatLoader() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div className={`max-w-[80%] space-y-2 ${i % 2 === 0 ? '' : 'items-end'}`}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline Spinner
 *
 * Small inline spinner for inline loading states
 */
export function InlineLoader({ size = 16 }: { size?: number }) {
  return <Loader2 className="animate-spin" style={{ width: size, height: size }} />;
}
