'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  Lightbulb,
  MapPin,
  Timer,
} from 'lucide-react';

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
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-1 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
        )}
      </button>
      {open && <div className="space-y-1 pb-3">{children}</div>}
    </div>
  );
}

function MethodItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="rounded-md px-2 py-1.5 transition-colors hover:bg-slate-100">
      <code className="font-mono text-xs text-indigo-600">{name}</code>
      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
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
      {
        name: 'operator.scan(radius)',
        desc: '2D-массив клеток вокруг оператора',
      },
    ],
  },
  {
    title: 'Навигация',
    icon: Compass,
    methods: [
      {
        name: 'operator.getDistanceTo("key")',
        desc: 'Расстояние до ближайшего ключа',
      },
      { name: 'operator.getDistanceTo("exit")', desc: 'Расстояние до выхода' },
      { name: 'operator.getPosition()', desc: 'Текущая позиция (Point)' },
      {
        name: 'operator.getOpponentPosition()',
        desc: 'Позиция соперника {x, y} (только Дуэль)',
      },
    ],
  },
  {
    title: 'Метки',
    icon: MapPin,
    methods: [
      { name: 'operator.markCell()', desc: 'Оставить метку на текущей клетке' },
      {
        name: 'operator.isMarked(dx, dy)',
        desc: 'Проверить метку со смещением',
      },
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

export function OperatorApiReference({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm ${className}`}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Lightbulb className="h-4 w-4 text-amber-500" />
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
            {section.methods.map((method) => (
              <MethodItem
                key={method.name}
                name={method.name}
                desc={method.desc}
              />
            ))}
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
