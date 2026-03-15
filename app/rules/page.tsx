'use client';

import { useEffect, useState } from 'react';
import {
  Trophy,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Swords,
  Timer,
} from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';

const SECTIONS = [
  { id: 'goal', label: 'Цель' },
  { id: 'modes', label: 'Режимы' },
  { id: 'victory', label: 'Победа' },
  { id: 'scoring', label: 'Очки' },
  { id: 'interaction', label: 'Правила' },
  { id: 'constraints', label: 'Ограничения' },
];

function getActiveSectionId(): string {
  const lastSectionId = SECTIONS[SECTIONS.length - 1]?.id ?? 'goal';

  if (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 24
  ) {
    return lastSectionId;
  }

  const marker = window.innerHeight * 0.35;
  let activeSectionId = SECTIONS[0]?.id ?? 'goal';

  for (const { id } of SECTIONS) {
    const section = document.getElementById(id);
    if (!section) {
      continue;
    }

    if (section.getBoundingClientRect().top <= marker) {
      activeSectionId = id;
    }
  }

  return activeSectionId;
}

function FloatingNav() {
  const [active, setActive] = useState('goal');

  useEffect(() => {
    const updateActive = () => {
      setActive(getActiveSectionId());
    };

    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    window.addEventListener('hashchange', updateActive);

    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
      window.removeEventListener('hashchange', updateActive);
    };
  }, []);

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-2">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={() => setActive(id)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap',
            active === id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-gray-900/50 rounded-xl border border-white/5 p-6 scroll-mt-20">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-indigo-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function RulesPage() {
  return (
    <>
      <FloatingNav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Правила</h1>
          <p className="text-gray-400 text-sm mt-1">
            Всё что нужно знать о «Битве алгоритмов».
          </p>
        </div>

        <div className="space-y-6">
          <Section id="goal" title="Цель игры" icon={Target}>
            <p className="text-gray-300 text-sm leading-relaxed">
              Напишите алгоритм, который проведёт вашего оператора через
              карту. Чтобы победить, оператору нужно <strong>подобрать хотя бы
              один ключ</strong> и затем <strong>добраться до выхода</strong>.
              В гонке карта может быть неизвестна заранее, а в дуэли она
              фиксирована и позволяет строить более точную стратегию.
            </p>
          </Section>

          <Section id="modes" title="Режимы игры" icon={Swords}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/5 bg-gray-800/40 p-4">
                <h3 className="text-sm font-semibold text-white">Гонка</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Универсальный режим: карта может быть стандартной или
                  случайно сгенерированной, а алгоритм не должен полагаться на
                  знание раскладки заранее.
                </p>
              </div>

              <div className="rounded-lg border border-white/5 bg-gray-800/40 p-4">
                <h3 className="text-sm font-semibold text-white">Дуэль</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Карта фиксирована, доступен{' '}
                  <code className="rounded bg-gray-950 px-1 py-0.5 text-xs text-indigo-300">
                    getOpponentPosition()
                  </code>
                  , а через конструктор можно подготовить собственную арену и
                  загрузить её в игру.
                </p>
              </div>
            </div>
          </Section>

          <Section id="victory" title="Условия победы" icon={Trophy}>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">
                    Ранний выход
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Если оба оператора смогли выйти, выигрывает тот, кто сделал
                    это раньше по шагам. Если выйти успел только один, он
                    побеждает автоматически.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-800/30 rounded-lg p-3">
                <Timer className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-300">
                    Одновременный финиш
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Если оба оператора вышли на одном и том же шаге, система
                    фиксирует ничью. Дополнительного тай-брейка по «меньшему
                    числу ходов» сейчас нет.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-red-950/30 border border-red-800/30 rounded-lg p-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-red-300">
                    Таймаут и незавершённый бой
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Если никто не выбрался, преимущество получает оператор,
                    который хотя бы подобрал ключ. Если ключ есть у обоих или
                    ни у кого, результатом будет ничья.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section id="scoring" title="Система очков" icon={Zap}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 text-gray-400 font-medium">
                      Действие
                    </th>
                    <th className="text-right py-2 text-gray-400 font-medium">
                      Очки
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800/50">
                    <td className="py-2">Ключ есть в финальном состоянии</td>
                    <td className="text-right font-mono text-emerald-400">
                      +50
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-2">Оператор вышел из лабиринта</td>
                    <td className="text-right font-mono text-emerald-400">
                      +100
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-2">Бонус победителю за ранний выход</td>
                    <td className="text-right font-mono text-emerald-400">
                      +25
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Таймаут без выхода</td>
                    <td className="text-right font-mono text-red-400">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="interaction" title="Правила взаимодействия" icon={Shield}>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">1.</span>
                <p>
                  <strong>Блокировка:</strong> операторы не могут занимать одну
                  клетку. Если оператор пытается встать на занятую клетку, ход
                  не выполняется.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">2.</span>
                <p>
                  <strong>Общие ключи:</strong> любой ключ может быть подобран
                  любым игроком. На карте может быть один или два ключа, а
                  оператору для выхода достаточно подобрать хотя бы один.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">3.</span>
                <p>
                  <strong>Параллельное выполнение:</strong> оба алгоритма
                  выполняются независимо, после чего арена воспроизводит их
                  покадрово. В дуэли можно дополнительно считывать позицию
                  соперника.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">4.</span>
                <p>
                  <strong>Кастомные карты:</strong> конструктор пропускает только
                  карты с 2 спавнами, 1 выходом, 1–2 ключами, рамкой из стен и
                  полной достижимостью целей от обоих игроков.
                </p>
              </div>
            </div>
          </Section>

          <Section id="constraints" title="Ограничения" icon={AlertTriangle}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Макс. шагов
                </h4>
                <p className="text-lg font-mono text-white">1 000</p>
                <p className="text-xs text-gray-500 mt-1">
                  На одно выполнение скрипта
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Размер карты
                </h4>
                <p className="text-lg font-mono text-white">
                  {MAP_SIZE_LIMITS.minWidth}–{MAP_SIZE_LIMITS.maxWidth} ×{' '}
                  {MAP_SIZE_LIMITS.minHeight}–{MAP_SIZE_LIMITS.maxHeight}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Для генератора и конструктора карт
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Язык
                </h4>
                <p className="text-lg font-mono text-white">JavaScript</p>
                <p className="text-xs text-gray-500 mt-1">
                  Стандартный JS, без внешних библиотек
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  API соперника
                </h4>
                <p className="text-lg font-mono text-white">Только Duel</p>
                <p className="text-xs text-gray-500 mt-1">
                  `getOpponentPosition()` доступен лишь в режиме дуэли
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Запрещено
                </h4>
                <p className="text-lg font-mono text-white">DOM / Сеть</p>
                <p className="text-xs text-gray-500 mt-1">
                  Нет доступа к API браузера
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Редактор карт
                </h4>
                <p className="text-lg font-mono text-white">/map-editor</p>
                <p className="text-xs text-gray-500 mt-1">
                  Кастомная карта применяется прямо в текущую игру
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
