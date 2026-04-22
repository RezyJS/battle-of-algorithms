'use client';

import { usePollingRefresh } from '@/src/shared/lib/usePollingRefresh';

export function PollingRefresh({
  intervalMs,
  enabled = true,
}: {
  intervalMs: number;
  enabled?: boolean;
}) {
  usePollingRefresh(intervalMs, enabled);

  return null;
}
