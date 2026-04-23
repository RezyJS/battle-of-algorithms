'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type ExpandableCardProps = {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
};

export function ExpandableCard({
  title,
  subtitle,
  meta,
  actions,
  children,
  defaultOpen = true,
  className = '',
  contentClassName = '',
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
    >
      <div className='flex items-center gap-4 px-5 py-4'>
        <button
          type='button'
          onClick={() => setOpen((prev) => !prev)}
          className='flex flex-1 items-center gap-3 text-left'
          aria-expanded={open}
        >
          <div className='mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-600'>
            {open ?
              <ChevronDown className='h-4 w-4' />
            : <ChevronRight className='h-4 w-4' />}
          </div>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <h2 className='text-sm font-semibold text-slate-900'>{title}</h2>
              {meta}
            </div>
            {subtitle && (
              <p className='mt-1 text-sm text-slate-500'>{subtitle}</p>
            )}
          </div>
        </button>

        {actions && <div className='shrink-0'>{actions}</div>}
      </div>

      {open && (
        <div
          className={`border-t border-slate-200 px-5 py-4 ${contentClassName}`.trim()}
        >
          {children}
        </div>
      )}
    </section>
  );
}
