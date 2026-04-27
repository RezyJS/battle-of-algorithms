import { CalendarClock, Code2, LogIn, Swords } from 'lucide-react';
import Link from 'next/link';

export default function NoBattle({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
      <div className='grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center'>
        <div>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800'>
            <CalendarClock className='h-6 w-6' />
          </div>
          <h2 className='mt-5 text-2xl font-semibold text-slate-950'>
            Сейчас нет активного боя
          </h2>
          <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600'>
            Когда модератор назначит пару, вы сможете наблюдать за проведением
            соревнования.
          </p>

          <div className='mt-6 flex flex-wrap gap-3'>
            {isAuthenticated ?
              <>
                <Link
                  href='/editor'
                  className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500'
                >
                  <Code2 className='h-4 w-4' />
                  Редактор
                </Link>
                <Link
                  href='/private-battles'
                  className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100'
                >
                  <Swords className='h-4 w-4' />
                  Приватные бои
                </Link>
              </>
            : <>
                <a
                  href='/api/auth/login?returnTo=/editor'
                  className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500'
                >
                  <LogIn className='h-4 w-4' />
                  Войти для редактора
                </a>
                <Link
                  href='/rules'
                  className='inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100'
                >
                  Правила
                </Link>
              </>
            }
          </div>
        </div>

        <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4'>
          <div className='grid grid-cols-6 gap-1.5'>
            {Array.from({ length: 36 }).map((_, index) => {
              const isWall = [2, 3, 8, 14, 15, 20, 27, 28].includes(index);
              const isKey = index === 10;
              const isExit = index === 35;
              const isSpawn = index === 0 || index === 30;

              return (
                <div
                  key={index}
                  className={[
                    'aspect-square rounded border',
                    isWall ?
                      'border-slate-300 bg-slate-300'
                    : 'border-slate-200 bg-white',
                    isKey && 'border-amber-300 bg-amber-200',
                    isExit && 'border-emerald-300 bg-emerald-200',
                    isSpawn && 'border-indigo-300 bg-indigo-200',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              );
            })}
          </div>
          <p className='mt-4 text-center text-xs text-slate-500'>
            Ожидаем следующую пару
          </p>
        </div>
      </div>
    </section>
  );
}
