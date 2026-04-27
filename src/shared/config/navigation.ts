import {
  BookOpen,
  Code2,
  Home,
  PenTool,
  Shield,
  Swords,
  Users,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Swords;
};

type MenuItem = {
  title: string;
  href: string;
  description: string;
  icon: typeof Swords;
};

export const publicNavItems: NavItem[] = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/arena', label: 'Арена', icon: Swords },
  { href: '/editor', label: 'Редактор', icon: Code2 },
  { href: '/rules', label: 'Правила', icon: BookOpen },
] ;

export const privateNavItem: NavItem = {
  href: '/private-battles',
  label: 'Приватные бои',
  icon: Users,
};

export const battleMenuItems: MenuItem[] = [
  {
    title: 'Главная',
    href: '/',
    description: 'Короткое объяснение проекта и быстрый старт.',
    icon: Home,
  },
  {
    title: 'Арена',
    href: '/arena',
    description: 'Публичные показы и текущий активный бой.',
    icon: Swords,
  },
  {
    title: 'Приватные бои',
    href: '/private-battles',
    description: 'Комнаты один на один с приглашением по username.',
    icon: Users,
  },
  {
    title: 'Редактор',
    href: '/editor',
    description: 'Написание и отправка алгоритма на модерацию.',
    icon: Code2,
  },
] ;

export const moderationNavItems: (MenuItem & { label: string })[] = [
  {
    href: '/map-editor',
    label: 'Конструктор',
    title: 'Конструктор карты',
    description: 'Быстрый доступ к редактору общей карты.',
    icon: PenTool,
  },
  {
    href: '/moderation',
    label: 'Отправки',
    title: 'Отправки',
    description: 'Проверка код-отправок и смена статусов.',
    icon: Shield,
  },
  {
    href: '/moderation/arena',
    label: 'Состав арены',
    title: 'Состав арены',
    description: 'Назначение пары и настройка общей конфигурации боя.',
    icon: Swords,
  },
];
