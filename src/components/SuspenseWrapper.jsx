/**
 * SuspenseWrapper
 * Wraps lazy-loaded components with React.Suspense and skeleton loaders
 * Provides consistent loading UX for dynamically imported modules
 */

import React, { Suspense } from 'react';
import {
  PageSkeleton,
  CardSkeleton,
  GridSkeleton,
  ListSkeleton,
  SoundGridSkeleton,
  ChatMessageSkeleton,
  FormSkeleton,
} from './LoadingSkeletons';

/**
 * PageSuspense - For full-page lazy components
 */
export function PageSuspense({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * CardSuspense - For single card lazy components
 */
export function CardSuspense({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <CardSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * GridSuspense - For grid-based lazy components
 */
export function GridSuspense({ children, count = 4, fallback = null }) {
  return (
    <Suspense fallback={fallback || <GridSkeleton count={count} />}>
      {children}
    </Suspense>
  );
}

/**
 * SoundGridSuspense - For sound grid lazy components
 */
export function SoundGridSuspense({ children, count = 6, fallback = null }) {
  return (
    <Suspense fallback={fallback || <SoundGridSkeleton count={count} />}>
      {children}
    </Suspense>
  );
}

/**
 * ListSuspense - For list-based lazy components
 */
export function ListSuspense({ children, count = 5, fallback = null }) {
  return (
    <Suspense fallback={fallback || <ListSkeleton count={count} />}>
      {children}
    </Suspense>
  );
}

/**
 * ChatSuspense - For chat lazy components
 */
export function ChatSuspense({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <ChatMessageSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * FormSuspense - For form lazy components
 */
export function FormSuspense({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <FormSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * GenericSuspense - For custom fallback content
 */
export function GenericSuspense({ children, fallback }) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

export default {
  PageSuspense,
  CardSuspense,
  GridSuspense,
  SoundGridSuspense,
  ListSuspense,
  ChatSuspense,
  FormSuspense,
  GenericSuspense,
};