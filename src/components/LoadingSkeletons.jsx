/**
 * LoadingSkeletons
 * High-performance skeleton loaders for React.Suspense boundaries
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageSkeleton - Full page loading state
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-slate-900/50 border-b border-white/[0.08]" />

      {/* Content area */}
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-slate-900/50 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-900/30 rounded-lg w-full" />
            <div className="h-4 bg-slate-900/30 rounded-lg w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CardSkeleton - Card/preset loading state
 */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900/30 border border-white/[0.08] p-4 animate-pulse">
      <div className="h-32 bg-slate-900/50 rounded-lg mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-900/50 rounded w-3/4" />
        <div className="h-3 bg-slate-900/30 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * GridSkeleton - Multi-card grid loading state
 */
export function GridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * ListItemSkeleton - List item loading state
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/20 animate-pulse">
      <div className="w-12 h-12 bg-slate-900/50 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-900/50 rounded w-3/4" />
        <div className="h-3 bg-slate-900/30 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * ListSkeleton - Multiple list items loading state
 */
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * SoundCardSkeleton - Specialized skeleton for sound cards
 */
export function SoundCardSkeleton() {
  return (
    <div className="relative rounded-2xl bg-slate-900/30 border border-white/[0.08] p-4 animate-pulse overflow-hidden">
      {/* Emoji/icon area */}
      <div className="text-4xl mb-3 opacity-20">🎵</div>

      {/* Content area */}
      <div className="space-y-3">
        <div className="h-5 bg-slate-900/50 rounded w-3/4" />
        <div className="h-3 bg-slate-900/30 rounded w-full" />

        {/* Volume slider placeholder */}
        <div className="pt-2">
          <div className="h-2 bg-slate-900/50 rounded-full w-full" />
        </div>

        {/* Favorite button placeholder */}
        <div className="flex justify-end">
          <div className="w-8 h-8 bg-slate-900/50 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * SoundGridSkeleton - Grid of sound card skeletons
 */
export function SoundGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <SoundCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * ChatMessageSkeleton - Loading state for chat messages
 */
export function ChatMessageSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* User message */}
      <div className="flex justify-end">
        <div className="w-2/3 h-16 bg-slate-800 rounded-2xl" />
      </div>

      {/* AI response placeholder */}
      <div className="flex justify-start gap-2">
        <div className="w-8 h-8 bg-slate-900/50 rounded-lg flex-shrink-0" />
        <div className="w-2/3 space-y-2">
          <div className="h-4 bg-slate-900/50 rounded w-full" />
          <div className="h-4 bg-slate-900/50 rounded w-4/5" />
          <div className="h-4 bg-slate-900/30 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * FormSkeleton - Form loading state
 */
export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-slate-900/50 rounded w-1/4" />
          <div className="h-10 bg-slate-900/30 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * Pulse wrapper for custom skeletons
 */
export function PulseSkeleton({ className = '' }) {
  return <div className={cn('animate-pulse bg-slate-900/30 rounded', className)} />;
}

export default {
  PageSkeleton,
  CardSkeleton,
  GridSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  SoundCardSkeleton,
  SoundGridSkeleton,
  ChatMessageSkeleton,
  FormSkeleton,
  PulseSkeleton,
};