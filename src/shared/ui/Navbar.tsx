'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Code2,
  Home,
  LogOut,
  Map,
  Shield,
  Swords,
  Users,
} from 'lucide-react';

import { cn } from '@/src/shared/lib/utils';
import type { SessionUser } from '@/src/shared/lib/auth/types';

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
        active ?
          'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      )}
    >
      <Icon className='h-4 w-4' />
      {label}
    </Link>
  );
}

function ToolLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
        active ?
          'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      {label}
    </Link>
  );
}

export function Navbar({ currentUser }: { currentUser: SessionUser | null }) {
  const pathname = usePathname();
  const canModerate =
    !!currentUser &&
    currentUser.roles.some((role) => role === 'moderator' || role === 'admin');
  const editorHref =
    currentUser ? '/editor' : '/api/auth/login?returnTo=/editor';
  const privateBattlesHref =
    currentUser ? '/private-battles' : (
      '/api/auth/login?returnTo=/private-battles'
    );

  const handleLogoutSubmit = (event: { preventDefault: () => void }) => {
    if (!window.confirm('Вы точно хотите выйти из аккаунта?')) {
      event.preventDefault();
    }
  };

  return (
    <nav className='sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-8xl gap-3 px-4 py-3 flex-row items-center justify-evenly'>
        <div className='flex flex-col gap-8 lg:flex-row lg:items-center'>
          <Link
            href='/'
            className='flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-600'
          >
            Битва алгоритмов
          </Link>

          <div className='flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1'>
            <NavLink
              href='/'
              label='Главная'
              icon={Home}
              active={isActive(pathname, '/')}
            />
            {currentUser ?
              <>
                <NavLink
                  href={editorHref}
                  label='Редактор'
                  icon={Code2}
                  active={isActive(pathname, '/editor')}
                />
                <NavLink
                  href='/arena'
                  label='Арена'
                  icon={Swords}
                  active={isActive(pathname, '/arena')}
                />
                <NavLink
                  href={privateBattlesHref}
                  label='Приватные сражения'
                  icon={Users}
                  active={isActive(pathname, '/private-battles')}
                />
              </>
            : <></>}
            <NavLink
              href='/rules'
              label='Правила'
              icon={BookOpen}
              active={isActive(pathname, '/rules')}
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 xl:justify-end'>
          {canModerate && (
            <div className='flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1'>
              <ToolLink
                href='/map-editor'
                label='Конструктор'
                icon={Map}
                active={isActive(pathname, '/map-editor')}
              />
              <ToolLink
                href='/moderation'
                label='Отправки'
                icon={Shield}
                active={pathname === '/moderation'}
              />
              <ToolLink
                href='/moderation/arena'
                label='Состав'
                icon={Swords}
                active={isActive(pathname, '/moderation/arena')}
              />
            </div>
          )}

          {currentUser ?
            <div className='flex flex-wrap items-center gap-2'>
              <div className='flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3'>
                <span className='text-sm font-medium text-slate-900'>
                  {currentUser.name ?? currentUser.username}
                </span>
                <span className='text-sm text-slate-500'>
                  @{currentUser.username}
                </span>
              </div>

              <form
                action='/api/auth/logout'
                method='post'
                onSubmit={handleLogoutSubmit}
              >
                <button
                  type='submit'
                  className='inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950'
                >
                  <LogOut className='h-4 w-4' />
                  Выйти
                </button>
              </form>
            </div>
          : <div className='flex flex-wrap items-center gap-2'>
              <a
                href='/api/auth/login'
                className='inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950'
              >
                Войти
              </a>
              <a
                href='/api/auth/register'
                className='inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500'
              >
                Регистрация
              </a>
            </div>
          }
        </div>
      </div>
    </nav>
  );
}
