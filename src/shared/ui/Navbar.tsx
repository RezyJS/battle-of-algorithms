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

  if (
    currentUser &&
    currentUser.roles.some((role) => role === 'moderator' || role === 'admin')
  ) {
    navItems.push({ href: '/map-editor', label: 'Конструктор', icon: PenTool });
    navItems.push({ href: '/moderation', label: 'Модерация', icon: Shield });
  }

  return (
    <nav className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 min-h-14 py-2 flex items-center gap-8 justify-between">
        <div className="flex items-center gap-8">
        <Link
          href="/"
          className="text-lg font-bold text-white tracking-tight flex items-center gap-2"
        >
          <Swords className="w-5 h-5 text-indigo-400" />
          Битва алгоритмов
        </Link>

        <div className="flex gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                pathname === href
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 transition-colors',
                pathname === '/profile'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <UserCircle2 className="h-4 w-4" />
              <div className="text-right">
                <p className="text-sm font-medium leading-none">
                  {currentUser.name ?? currentUser.username}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {currentUser.username}
                </p>
              </div>
            </Link>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="h-9 rounded-md border border-white/10 px-3 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Выйти
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/api/auth/login"
              className="h-9 inline-flex items-center rounded-md border border-white/10 px-3 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Войти
            </Link>
            <Link
              href="/api/auth/register"
              className="h-9 inline-flex items-center rounded-md bg-indigo-600 px-3 text-sm text-white transition-colors hover:bg-indigo-500"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
