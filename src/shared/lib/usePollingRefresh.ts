'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function usePollingRefresh(intervalMs: number, enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, router]);
}
