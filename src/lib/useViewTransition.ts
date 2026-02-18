'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook that wraps Next.js router.push with View Transitions API.
 * Falls back to regular navigation when not supported.
 */
export function useViewTransitionRouter() {
  const router = useRouter();

  const push = useCallback(
    (href: string) => {
      if (
        typeof document !== 'undefined' &&
        'startViewTransition' in document
      ) {
        (document as unknown as { startViewTransition: (cb: () => void) => void })
          .startViewTransition(() => {
            router.push(href);
          });
      } else {
        router.push(href);
      }
    },
    [router]
  );

  const back = useCallback(() => {
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document
    ) {
      (document as unknown as { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => {
          router.back();
        });
    } else {
      router.back();
    }
  }, [router]);

  return { push, back, refresh: router.refresh, replace: router.replace };
}
