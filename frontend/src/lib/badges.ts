import { BadgeDefinition, ReadingActivity, UserBookRecord } from '../types';

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_book',
    name: 'Primera historia',
    description: 'Terminaste tu primer libro.',
    requirement: 'booksFinished >= 1',
    emoji: '📖',
  },
  {
    id: 'bibliophile',
    name: 'Bibliófilo',
    description: 'Terminaste 5 libros.',
    requirement: 'booksFinished >= 5',
    emoji: '📚',
  },
  {
    id: 'great_reader',
    name: 'Gran lector',
    description: 'Terminaste 10 libros.',
    requirement: 'booksFinished >= 10',
    emoji: '🏆',
  },
  {
    id: 'constant',
    name: 'Constante',
    description: 'Leíste varios días consecutivos.',
    requirement: 'streak >= 3',
    emoji: '🔥',
  },
  {
    id: 'listener',
    name: 'Oyente',
    description: 'Usaste el modo Lector varias veces.',
    requirement: 'readerModeUses >= 3',
    emoji: '🎧',
  },
  {
    id: 'student',
    name: 'Estudiante',
    description: 'Completaste varios tests de Reed Profesor.',
    requirement: 'quizzesCompleted >= 2',
    emoji: '🎓',
  },
  {
    id: 'night_owl',
    name: 'Noctámbulo',
    description: 'Completaste una sesión de lectura durante la noche.',
    requirement: 'nightSessions >= 1',
    emoji: '🌙',
  },
];

export interface BadgeStats {
  booksFinished: number;
  streak: number;
  readerModeUses: number;
  quizzesCompleted: number;
  nightSessions: number;
}

export function localDate(date = new Date()): string {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
}

export function readingStreak(dates: string[]): number {
  const set = new Set(dates);
  const cursor = new Date();
  if (!set.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (set.has(localDate(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function badgeStats(library: UserBookRecord[], activity: ReadingActivity): BadgeStats {
  return {
    booksFinished: library.filter((book) => book.status === 'finished').length,
    streak: readingStreak(activity.readDates),
    readerModeUses: activity.readerModeUses,
    quizzesCompleted: activity.quizzesCompleted,
    nightSessions: activity.nightSessions,
  };
}

function isEarned(badge: BadgeDefinition, stats: BadgeStats): boolean {
  switch (badge.id) {
    case 'first_book':
      return stats.booksFinished >= 1;
    case 'bibliophile':
      return stats.booksFinished >= 5;
    case 'great_reader':
      return stats.booksFinished >= 10;
    case 'constant':
      return stats.streak >= 3;
    case 'listener':
      return stats.readerModeUses >= 3;
    case 'student':
      return stats.quizzesCompleted >= 2;
    case 'night_owl':
      return stats.nightSessions >= 1;
    default:
      return false;
  }
}

export function evaluateBadges(library: UserBookRecord[], activity: ReadingActivity): {
  activity: ReadingActivity;
  unlockedNow: BadgeDefinition[];
} {
  const stats = badgeStats(library, activity);
  const unlockedNow = BADGES.filter((badge) => isEarned(badge, stats) && !activity.unlocked.includes(badge.id));
  if (!unlockedNow.length) return { activity, unlockedNow };
  return {
    activity: { ...activity, unlocked: [...activity.unlocked, ...unlockedNow.map((badge) => badge.id)] },
    unlockedNow,
  };
}

export function isNightHour(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 21 || hour < 5;
}
