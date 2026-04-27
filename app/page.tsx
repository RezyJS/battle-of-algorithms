import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Code2,
  KeyRound,
  Map,
  PlayCircle,
  Swords,
} from 'lucide-react';

import { getCurrentUser } from '@/src/shared/lib/auth/session';

const steps = [
  {
    title: 'Код',
    text: 'Алгоритм выбирает ход оператора на каждом шаге.',
    icon: Code2,
  },
  {
    title: 'Карта',
    text: 'Решение проверяется на фиксированной, случайной или собранной карте.',
    icon: Map,
  },
  {
    title: 'Бой',
    text: 'Симуляция показывает движение, события и итоговый счёт.',
    icon: Swords,
  },
];

const mapCells = [
  'wall',
  'empty',
  'empty',
  'key',
  'empty',
  'wall',
  'empty',
  'empty',
  'bot',
  'empty',
  'wall',
  'empty',
  'empty',
  'empty',
  'empty',
  'wall',
  'empty',
  'empty',
  'empty',
  'empty',
  'wall',
  'empty',
  'empty',
  'empty',
  'wall',
  'empty',
  'wall',
  'empty',
  'empty',
  'empty',
  'wall',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'wall',
  'empty',
  'exit',
  'empty',
  'empty',
  'wall',
  'empty',
  'empty',
  'empty',
  'empty',
  'empty',
  'bot',
];

function getCellClassName(cell: string) {
  if (cell === 'wall') return 'border-slate-300 bg-slate-300';
  if (cell === 'key') return 'border-amber-300 bg-amber-200';
  if (cell === 'exit') return 'border-emerald-300 bg-emerald-200';
  if (cell === 'bot') return 'border-indigo-300 bg-indigo-200';
  return 'border-slate-200 bg-white';
}

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const isAuthenticated = !!currentUser;

  return (
    <div className='min-h-full bg-slate-50'>
      <section className='mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14'>
        <div>
          <p className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm'>
            <KeyRound className='h-4 w-4 text-amber-600' />
            Лабиринт, ключи, выход
          </p>
          <h1 className='mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl'>
            Битва алгоритмов
          </h1>
          <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-600'>
            Напишите JavaScript-код для оператора и проверьте его в бою. Нужно
            брать ключи, искать выход и обходить соперника на общей карте.
          </p>

          <div className='mt-8 flex flex-wrap gap-3'>
            <Link
              href={
                isAuthenticated ? '/editor' : '/api/auth/login?returnTo=/editor'
              }
              className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500'
            >
              {isAuthenticated ? 'Открыть редактор' : 'Войти и писать код'}
              <ArrowRight className='h-4 w-4' />
            </Link>
            <Link
              href='/arena'
              className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100'
            >
              Смотреть арену
              <PlayCircle className='h-4 w-4' />
            </Link>
          </div>
        </div>

        <div className='rounded-3xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
            <div className='grid grid-cols-8 gap-1.5'>
              {mapCells.map((cell, index) => (
                <div
                  key={`${cell}-${index}`}
                  className={`aspect-square rounded-md border ${getCellClassName(cell)}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto grid max-w-7xl gap-4 px-4 pb-12 md:grid-cols-3'>
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <article
              key={step.title}
              className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
            >
              <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800'>
                <Icon className='h-5 w-5' />
              </div>
              <h2 className='mt-4 text-lg font-semibold text-slate-950'>
                {step.title}
              </h2>
              <p className='mt-2 text-sm leading-6 text-slate-600'>
                {step.text}
              </p>
            </article>
          );
        })}
      </section>

      <section className='mx-auto max-w-7xl px-4 pb-14'>
        <div className='flex flex-col gap-4 rounded-2xl border border-green-300 bg-green-200 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='text-base font-semibold text-green-700'>
              Новым пользователям лучше начать с правил.
            </h2>
            <p className='mt-1 text-sm leading-6 text-green-600'>
              Здесь описаны команды, ограничения, типы карт и порядок проверки.
            </p>
          </div>
          <Link
            href='/rules'
            className='inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-green-400 bg-green-300 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-400'
          >
            <BookOpen className='h-4 w-4' />
            Правила
          </Link>
        </div>
      </section>
    </div>
  );
}
