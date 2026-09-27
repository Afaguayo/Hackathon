import { Book, ReadingActivity, ReadingPrefs, UserBookRecord } from '../types';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

const USERS_KEY = 'reed.users';
const SESSION_KEY = 'reed.session';

export const emptyActivity = (): ReadingActivity => ({
  readDates: [],
  nightSessions: 0,
  readerModeUses: 0,
  quizzesCompleted: 0,
  readingSeconds: 0,
  unlocked: [],
});

export const defaultPrefs = (): ReadingPrefs => ({
  fontScale: 'md',
  font: 'serif',
  leading: 'normal',
  theme: 'sepia',
});

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_KEY, []);
}

function saveUsers(users: StoredUser[]) {
  writeJson(USERS_KEY, users);
}

export function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar,
  };
}

export function loadSessionUser(): SessionUser | null {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const user = loadUsers().find((item) => item.id === id);
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return toSessionUser(user);
}

export function saveSession(userId: string) {
  localStorage.setItem(SESSION_KEY, userId);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return loadUsers().find((user) => user.email.toLowerCase() === normalized);
}

export function insertUser(user: StoredUser) {
  saveUsers([...loadUsers(), user]);
}

export function updateStoredUser(userId: string, patch: Partial<StoredUser>) {
  saveUsers(loadUsers().map((user) => (user.id === userId ? { ...user, ...patch } : user)));
}

export function replacePassword(email: string, salt: string, passwordHash: string): boolean {
  const users = loadUsers();
  const index = users.findIndex((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (index < 0) return false;
  users[index] = { ...users[index], salt, passwordHash };
  saveUsers(users);
  return true;
}

export function loadLibrary(userId: string): UserBookRecord[] {
  return readJson(`reed.library.${userId}`, []);
}

export function saveLibrary(userId: string, library: UserBookRecord[]) {
  writeJson(`reed.library.${userId}`, library);
}

export function loadUploads(userId: string): Book[] {
  return readJson(`reed.uploads.${userId}`, []);
}

export function saveUploads(userId: string, uploads: Book[]) {
  writeJson(`reed.uploads.${userId}`, uploads);
}

export function loadActivity(userId: string): ReadingActivity {
  return { ...emptyActivity(), ...readJson(activityKey(userId), emptyActivity()) };
}

export function saveActivity(userId: string, activity: ReadingActivity) {
  writeJson(activityKey(userId), activity);
}

export function loadPrefs(userId: string): ReadingPrefs {
  return { ...defaultPrefs(), ...readJson(`reed.prefs.${userId}`, defaultPrefs()) };
}

export function savePrefs(userId: string, prefs: ReadingPrefs) {
  writeJson(`reed.prefs.${userId}`, prefs);
}

export function loadAvatarOverride(userId: string): string | null {
  return localStorage.getItem(`reed.avatar.${userId}`);
}

export function saveAvatarOverride(userId: string, dataUrl: string | null) {
  if (!dataUrl) localStorage.removeItem(`reed.avatar.${userId}`);
  else localStorage.setItem(`reed.avatar.${userId}`, dataUrl);
}

function activityKey(userId: string) {
  return `reed.activity.${userId}`;
}

export function freshUserBook(bookId: string): UserBookRecord {
  return {
    bookId,
    currentChapter: 1,
    currentPage: 0,
    progress: 0,
    status: 'unread',
    addedAt: new Date().toISOString(),
    lastReadAt: null,
  };
}
