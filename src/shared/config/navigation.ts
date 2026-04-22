import {
  BookOpen,
  Code2,
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
  { href: '/', label: 'Арена', icon: Swords },
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
    title: 'Арена',
    href: '/',
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
  {
    href: '/map-editor',
    label: 'Конструктор',
    title: 'Конструктор карты',
    description: 'Редактирование общей карты для активного боя.',
    icon: PenTool,
  },
];
