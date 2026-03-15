'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/shared/lib/utils';
import { Swords, Code2, BookOpen, PenTool } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Арена', icon: Swords },
  { href: '/editor', label: 'Редактор', icon: Code2 },
  { href: '/map-editor', label: 'Конструктор', icon: PenTool },
  { href: '/rules', label: 'Правила', icon: BookOpen },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-8">
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
    </nav>
  );
}
