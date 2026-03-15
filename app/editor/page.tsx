'use client';

import { useState } from 'react';
import { useGameStore, PLAYERS } from '@/src/app/model/game-store';
import { ScriptEditor } from '@/src/features/script-editor';
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  Eye,
  Compass,
  MapPin,
  Timer,
} from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

// Collapsible section
function Collapsible({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 px-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
      {open && <div className="pb-3 space-y-1">{children}</div>}
    </div>
  );
}

function MethodItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="px-2 py-1.5 rounded-md hover:bg-gray-800/50 transition-colors">
      <code className="text-xs text-indigo-300 font-mono">{name}</code>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

const API_SECTIONS = [
  {
    title: 'Движение',
    icon: ArrowRight,
    methods: [
      { name: 'operator.moveRight()', desc: 'Двигаться вправо' },
      { name: 'operator.moveLeft()', desc: 'Двигаться влево' },
      { name: 'operator.moveUp()', desc: 'Двигаться вверх' },
      { name: 'operator.moveDown()', desc: 'Двигаться вниз' },
      { name: 'operator.wait()', desc: 'Пропустить ход (стоит 1 шаг)' },
    ],
  },
  {
    title: 'Обзор',
    icon: Eye,
    methods: [
      { name: 'operator.lookRight()', desc: 'Можно ли идти вправо?' },
      { name: 'operator.lookLeft()', desc: 'Можно ли идти влево?' },
      { name: 'operator.lookUp()', desc: 'Можно ли идти вверх?' },
      { name: 'operator.lookDown()', desc: 'Можно ли идти вниз?' },
      { name: 'operator.scan(radius)', desc: '2D-массив клеток вокруг оператора' },
    ],
  },
  {
    title: 'Навигация',
    icon: Compass,
    methods: [
      { name: 'operator.getDistanceTo("key")', desc: 'Расстояние до ближайшего ключа' },
      { name: 'operator.getDistanceTo("exit")', desc: 'Расстояние до выхода' },
      { name: 'operator.getPosition()', desc: 'Текущая позиция (Point)' },
      { name: 'operator.getOpponentPosition()', desc: 'Позиция соперника {x, y} (только Дуэль)' },
    ],
  },
  {
    title: 'Метки',
    icon: MapPin,
    methods: [
      { name: 'operator.markCell()', desc: 'Оставить метку на текущей клетке' },
      { name: 'operator.isMarked(dx, dy)', desc: 'Проверить метку со смещением' },
    ],
  },
  {
    title: 'Состояние',
    icon: Timer,
    methods: [
      { name: 'operator.hasKey()', desc: 'Ключ подобран?' },
      { name: 'operator.hasExited()', desc: 'Оператор вышел?' },
      { name: 'operator.getStepCount()', desc: 'Количество сделанных шагов' },
    ],
  },
];

const TIPS = [
  {
    title: 'Ограничивайте циклы',
    code: 'for (let i = 0; i < 800; i++) {\n  if (operator.hasExited()) break;\n  // ...\n}',
  },
  {
    title: 'Метки против зацикливания',
    code: 'operator.markCell();\nif (!operator.isMarked(1, 0)) {\n  operator.moveRight();\n}',
  },
  {
    title: 'Смена стратегии после ключа',
    code: 'const target = operator.hasKey()\n  ? "exit" : "key";\nconst d = operator.getDistanceTo(target);',
  },
];

export default function EditorPage() {
  const { scripts, setScript, isRunning } = useGameStore();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Редактор скриптов</h1>
        <p className="text-gray-400 text-sm mt-1">
          Напишите алгоритмы для операторов. Каждый игрок видит только свой
          код.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Editor area */}
        <div className="flex-1">
          {/* Player tabs */}
          <div className="flex border-b border-gray-800 mb-4">
            {PLAYERS.map((player, idx) => (
              <button
                key={player.uid}
                onClick={() => setActiveTab(idx)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
                  activeTab === idx
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200',
                )}
              >
                <span className="text-base">{player.emoji}</span>
                {player.label}
              </button>
            ))}
          </div>

          {/* Active editor */}
          <ScriptEditor
            playerLabel={`Скрипт ${PLAYERS[activeTab].label.toLowerCase()}`}
            playerEmoji={PLAYERS[activeTab].emoji}
            script={scripts[activeTab]}
            onScriptChange={(script) => setScript(activeTab, script)}
            disabled={isRunning}
          />
        </div>

        {/* Sidebar — compact API + tips */}
        <div className="w-72 space-y-4">
          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="font-semibold text-sm text-gray-200 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              API оператора
            </h3>
            <div>
              {API_SECTIONS.map((section) => (
                <Collapsible
                  key={section.title}
                  title={section.title}
                  icon={section.icon}
                  defaultOpen={section.title === 'Движение'}
                >
                  {section.methods.map((m) => (
                    <MethodItem key={m.name} name={m.name} desc={m.desc} />
                  ))}
                </Collapsible>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="font-semibold text-sm text-gray-200 mb-3">
              Советы
            </h3>
            <div className="space-y-3">
              {TIPS.map((tip) => (
                <div key={tip.title}>
                  <h4 className="text-xs font-semibold text-gray-300 mb-1">
                    {tip.title}
                  </h4>
                  <pre className="text-xs bg-gray-950 rounded-md p-2 text-green-400 font-mono overflow-x-auto">
                    {tip.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-3">
            <p className="text-xs text-amber-300">
              ⚠️ Максимум 1000 шагов. Всегда ставьте ограничение циклов и
              условие выхода.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
