import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { UserAuthControls } from '../auth/ClerkAuthProvider';
import { BookOpen, Library } from 'lucide-react';

interface HeaderProps {
  currentView: 'library' | 'reader';
  onNavigate: (view: 'library' | 'reader') => void;
  bookTitle?: string;
  chapterTitle?: string;
  hasAudio?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  bookTitle,
  chapterTitle,
  hasAudio,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-line transition-colors duration-states">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and breadcrumb context */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <button
            onClick={() => onNavigate('library')}
            className="text-left focus:outline-none focus-visible:outline-2 rounded-sm"
          >
            <BrandLogo size="md" />
          </button>

          {currentView === 'reader' && bookTitle && (
            <div className="hidden md:flex items-center gap-2 text-sm text-ink-muted truncate font-sans">
              <span className="text-line-strong">/</span>
              <span className="text-ink font-medium truncate">{bookTitle}</span>
              {chapterTitle && (
                <>
                  <span className="text-line-strong">·</span>
                  <span className="truncate">{chapterTitle}</span>
                </>
              )}
              {hasAudio && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-ambar text-on-ambar font-semibold">
                  Con voz
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md transition-colors duration-states ${
              currentView === 'library'
                ? 'bg-paper-raised border border-line text-ink'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Library size={18} strokeWidth={1.75} />
            <span className="hidden sm:inline">Biblioteca</span>
          </button>

          {currentView === 'reader' && (
            <button
              onClick={() => onNavigate('reader')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-paper-raised border border-line text-ink"
            >
              <BookOpen size={18} strokeWidth={1.75} />
              <span className="hidden sm:inline">Lector</span>
            </button>
          )}

          <div className="h-5 w-[1px] bg-line mx-1" />

          <ThemeToggle />

          <UserAuthControls />
        </div>
      </div>
    </header>
  );
};
