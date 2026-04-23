import {
  AlertTriangle,
  Bot,
  Compass,
  Flag,
  KeyRound,
  Layers3,
  Map,
  ShieldCheck,
  Swords,
  Trophy,
} from 'lucide-react';

import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';

const mapModes = [
  {
    title: 'Фиксированная',
    note: 'Для базового сравнения стратегий на одной и той же схеме.',
  },
  {
    title: 'Случайная',
    note: 'Для проверки устойчивости решения на новой раскладке.',
  },
  {
    title: 'Из конструктора',
    note: 'Для ручных сценариев и обмена конкретной картой по коду.',
  },
];

const preflightChecks = [
  'Прогон на фиксированной карте',
  'Несколько запусков на случайной карте',
  'Один сценарий на своей карте из конструктора',
];

const scoreRows = [
  ['Ключ в финальном состоянии', '+50'],
  ['Выход из лабиринта', '+100'],
  ['Более ранний выход', '+25'],
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.34em] text-indigo-600">
          Battle of Algorithms
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Правила
        </h1>
      </header>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-7">
          <div className="grid h-full gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-7">
              <div className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Trophy className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                Как победить
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <p>
                  Цель простая: подобрать хотя бы один ключ и довести оператора
                  до выхода.
                </p>
                <p>
                  Если вышли оба, выигрывает тот, кто сделал это раньше. Если
                  выйти смог только один, бой уходит ему.
                </p>
                <p>
                  Если никто не вышел, система смотрит, кто хотя бы дошёл до
                  ключа. Если это не помогло различить игроков, фиксируется
                  ничья.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-6 lg:border-l lg:border-t-0">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Очки
              </p>
              <div className="mt-5 space-y-3">
                {scoreRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm"
                  >
                    <span className="max-w-[14rem] text-sm leading-6 text-slate-700">
                      {label}
                    </span>
                    <span className="text-lg font-semibold text-emerald-600">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f3f6ff_100%)] p-6 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Режимы
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                Гонка и дуэль
              </h2>
            </div>
            <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
              <Swords className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.4rem] border border-indigo-100 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-950">Гонка</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Проверяет, умеет ли стратегия жить на разных раскладках. Карта
                может быть фиксированной, случайной или пользовательской.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Дуэль</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Позволяет учитывать соперника через `getOpponentPosition()` и
                подстраивать тактику под конкретную арену.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-950">Карты</h2>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Map className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {mapModes.map((mode, index) => (
              <div
                key={mode.title}
                className="rounded-[1.4rem] border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {mode.title}
                  </p>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {mode.note}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff 0%,#fff5f1 100%)] shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-8">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-6 sm:p-7">
              <div className="inline-flex rounded-2xl bg-rose-100 p-3 text-rose-700">
                <Bot className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                Что делать перед отправкой
              </h2>
              <ol className="mt-6 space-y-3">
                {preflightChecks.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-[1.3rem] border border-white bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-7 text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-rose-100 bg-white/70 p-6 lg:border-l lg:border-t-0">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Тестовая арена
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Здесь можно запустить тестовый бой против шаблонного соперника и
                выбрать, на какой карте проверять алгоритм: фиксированной,
                случайной или своей из конструктора.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="aspect-square rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#eef2ff_0%,#fff_100%)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Fixed
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 9 }).map((_, cellIndex) => (
                      <div
                        key={`fixed-${cellIndex}`}
                        className={`h-5 rounded-md ${
                          cellIndex < 4 ? 'bg-slate-300' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="aspect-square rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#ecfeff_0%,#fff_100%)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Random
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {['bg-cyan-200', 'bg-white', 'bg-cyan-100', 'bg-white', 'bg-cyan-300', 'bg-white', 'bg-cyan-100', 'bg-white', 'bg-cyan-200'].map(
                      (className, cellIndex) => (
                        <div
                          key={`random-${cellIndex}`}
                          className={`h-5 rounded-md ${className}`}
                        />
                      ),
                    )}
                  </div>
                </div>
                <div className="aspect-square rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#fff_100%)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Custom
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {['bg-violet-200', 'bg-white', 'bg-yellow-200', 'bg-white', 'bg-violet-100', 'bg-white', 'bg-white', 'bg-emerald-200', 'bg-white'].map(
                      (className, cellIndex) => (
                        <div
                          key={`custom-${cellIndex}`}
                          className={`h-5 rounded-md ${className}`}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f6f3ff_0%,#ffffff_100%)] p-6 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-950">
              Seed и код карты
            </h2>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <Layers3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.4rem] border border-violet-100 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-violet-500">
                Seed
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Нужен для повторяемой генерации случайной карты. Один и тот же
                seed при одинаковом размере даёт одинаковый результат.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-cyan-100 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-600">
                Код карты
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Нужен для обмена конкретной конфигурацией. Восстанавливает карту
                один в один, даже после ручных правок.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Комнаты
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                Приватный бой
              </h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">1. Код</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Игроки договариваются о комнате и конфигурации.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">2. Готовность</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Подтверждение идёт отдельно от выбора карты и кода.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">3. Старт</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                После запуска комната становится read-only.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f0fdfa_0%,#ffffff_100%)] p-6 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-950">
              Проверки конструктора
            </h2>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Compass className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-100 bg-white/80 p-4">
              <Flag className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm leading-7 text-slate-700">
                На карте должны быть два спавна, выход и хотя бы один ключ.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-100 bg-white/80 p-4">
              <KeyRound className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm leading-7 text-slate-700">
                Для обоих операторов проверяется достижимость ключей и выхода.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-100 bg-white/80 p-4">
              <Map className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm leading-7 text-slate-700">
                Размер ограничен диапазоном от {MAP_SIZE_LIMITS.minWidth}×
                {MAP_SIZE_LIMITS.minHeight} до {MAP_SIZE_LIMITS.maxWidth}×
                {MAP_SIZE_LIMITS.maxHeight}.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-rose-200 bg-[linear-gradient(180deg,#fff1f2_0%,#ffffff_100%)] p-6 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-950">Ограничения</h2>
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
            <li className="rounded-[1.4rem] border border-white bg-white/80 px-4 py-3">
              Нет внешних библиотек и сетевых запросов.
            </li>
            <li className="rounded-[1.4rem] border border-white bg-white/80 px-4 py-3">
              Нет доступа к DOM и браузерному окружению.
            </li>
            <li className="rounded-[1.4rem] border border-white bg-white/80 px-4 py-3">
              Есть лимит шагов, поэтому тяжёлые и бесконечные циклы ломают
              стратегию.
            </li>
          </ul>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] px-6 py-7 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.32)] xl:col-span-7">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Коротко
          </p>
          <p className="mt-4 max-w-4xl text-2xl font-semibold leading-tight text-slate-950">
            Нормальная стратегия не должна жить на одной удобной карте. Проверяй
            её на фиксированной схеме, на случайной генерации и на своём
            собранном сценарии, а потом уже отправляй на модерацию.
          </p>
        </article>
      </section>
    </div>
  );
}
