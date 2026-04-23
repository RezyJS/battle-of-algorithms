'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/src/shared/ui/navigation-menu';
import {
  battleMenuItems,
  moderationNavItems,
} from '@/src/shared/config/navigation';
import { cn } from '@/src/shared/lib/utils';
import type { SessionUser } from '@/src/shared/lib/auth/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/shared/ui/sheet';

const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  admin: 'Администратор',
};

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ currentUser }: { currentUser: SessionUser | null }) {
  const pathname = usePathname();
  const canModerate =
    !!currentUser &&
    currentUser.roles.some((role) => role === 'moderator' || role === 'admin');

  return (
    <nav className='sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm'>
      <div className='mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:min-h-14 lg:flex-row lg:items-center lg:justify-between'>
        <Link
          href='/'
          className='flex items-center gap-2 text-2xl font-bold tracking-tight text-indigo-600'
        >
          Битва алгоритмов
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className='text-xl font-semibold'>
                Соревнования
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className='w-96'>
                  {battleMenuItems.map((component) => (
                    <li key={component.title}>
                      <NavigationMenuLink asChild>
                        <Link href={component.href}>
                          <div className='flex flex-col gap-1 text-sm'>
                            <div className='leading-none font-medium'>
                              {component.title}
                            </div>
                            <div className='line-clamp-2 text-muted-foreground'>
                              {component.description}
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {canModerate && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className='text-xl font-semibold'>
                  Модерация
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className='w-96'>
                    {moderationNavItems.map((component) => (
                      <li key={component.title}>
                        <NavigationMenuLink asChild>
                          <Link href={component.href}>
                            <div className='flex flex-col gap-1 text-sm'>
                              <div className='leading-none font-medium'>
                                {component.title}
                              </div>
                              <div className='line-clamp-2 text-muted-foreground'>
                                {component.description}
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                active={isActive(pathname, '/rules')}
              >
                <Link href='/rules'>
                  <p className='text-lg font-semibold'>Правила</p>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {currentUser ?
          <div className='flex flex-wrap items-center gap-3 lg:justify-end'>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'flex items-center gap-2 rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950',
                    pathname === '/profile' && 'border-indigo-200 bg-indigo-50 text-slate-950',
                  )}
                >
                  <div className='text-right flex items-center gap-1'>
                    <p className='text-sm font-medium leading-none'>
                      {currentUser.name ?? currentUser.username}
                    </p>
                    <p className='mt-1 text-xs text-slate-500'>
                      {`(@${currentUser.username})`}
                    </p>
                  </div>
                </button>
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{currentUser.name ?? currentUser.username}</SheetTitle>
                  <SheetDescription>@{currentUser.username}</SheetDescription>
                </SheetHeader>

                <div className='px-4 pb-4'>
                  <div className='grid gap-3 md:grid-cols-1'>
                    <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                      <p className='text-xs text-slate-500'>Email</p>
                      <p className='mt-2 text-sm text-slate-900'>
                        {currentUser.email ?? 'Не указан'}
                      </p>
                    </div>

                    <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                      <p className='text-xs text-slate-500'>Роли</p>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {currentUser.roles.map((role) => (
                          <span
                            key={role}
                            className='rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700'
                          >
                            {roleLabels[role] ?? role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <form
              action='/api/auth/logout'
              method='post'
            >
              <button
                type='submit'
                className='h-9 rounded-md border border-slate-200 bg-white/70 px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950'
              >
                Выйти
              </button>
            </form>
          </div>
        : <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
            <a
              href='/api/auth/login'
              className='inline-flex h-9 items-center rounded-md border border-slate-200 bg-white/70 px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950'
            >
              Войти
            </a>
            <a
              href='/api/auth/register'
              className='inline-flex h-9 items-center rounded-md bg-indigo-600 px-3 text-sm text-white shadow-sm transition-colors hover:bg-indigo-500'
            >
              Регистрация
            </a>
          </div>
        }
      </div>
    </nav>
  );
}
