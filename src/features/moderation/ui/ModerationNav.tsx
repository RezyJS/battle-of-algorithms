'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { moderationNavItems } from '@/src/shared/config/navigation';
import { cn } from '@/src/shared/lib/utils';

export function ModerationNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {moderationNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-lg px-4 py-2 text-sm transition-colors',
            pathname === item.href ?
              'bg-indigo-600 text-white shadow-sm'
            : 'border border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50',
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
