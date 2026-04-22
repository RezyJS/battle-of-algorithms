'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/shared/lib/utils';
import { BookOpen, Code2, PenTool, Shield, Swords, UserCircle2 } from 'lucide-react';

import type { SessionUser } from '@/src/shared/lib/auth/types';

const baseNavItems = [
  { href: '/', label: 'Арена', icon: Swords },
  { href: '/editor', label: 'Редактор', icon: Code2 },
  { href: '/rules', label: 'Правила', icon: BookOpen },
];

export function Navbar({
  currentUser,
}: {
  currentUser: SessionUser | null;
}) {
  const pathname = usePathname();
  const navItems = [...baseNavItems];

  if (currentUser) {
    navItems.splice(2, 0, {
      href: '/private-battles',
      label: 'Приватные бои',
      icon: Swords,
    });
  }

  if (
    currentUser &&
    currentUser.roles.some((role) => role === 'moderator' || role === 'admin')
  ) {
    navItems.push({ href: '/map-editor', label: 'Конструктор', icon: PenTool });
    navItems.push({ href: '/moderation', label: 'Модерация', icon: Shield });
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 lg:min-h-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
          <Link
            href="/"
            className="text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2"
          >
            <Swords className="w-5 h-5 text-indigo-600" />
            Битва алгоритмов
          </Link>

          <div className="flex flex-wrap gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                  pathname === href
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {currentUser ? (
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-2 rounded-md border border-slate-200 bg-white/70 px-3 py-2 transition-colors',
                pathname === '/profile'
                  ? 'bg-indigo-50 text-slate-950 border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
              )}
            >
              <UserCircle2 className="h-4 w-4" />
              <div className="text-right">
                <p className="text-sm font-medium leading-none">
                  {currentUser.name ?? currentUser.username}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {currentUser.username}
                </p>
              </div>
            </Link>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="h-9 rounded-md border border-slate-200 bg-white/70 px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                Выйти
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <a
              href="/api/auth/login"
              className="h-9 inline-flex items-center rounded-md border border-slate-200 bg-white/70 px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Войти
            </a>
            <a
              href="/api/auth/register"
              className="h-9 inline-flex items-center rounded-md bg-indigo-600 px-3 text-sm text-white transition-colors hover:bg-indigo-500 shadow-sm"
            >
              Регистрация
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
