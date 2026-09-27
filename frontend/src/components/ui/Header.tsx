import React from 'react';
import { AppView } from '../../types';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { UserAvatar } from '../auth/UserAvatar';
import { useAccount } from '../../context/AccountContext';
import { Library, UserRound, Warehouse } from 'lucide-react';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  bookTitle?: string;
  chapterTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  bookTitle,
  chapterTitle,
}) => {
  const { user } = useAccount();

  const itemClass = (view: AppView) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md transition-colors duration-states ${
      currentView === view ? 'bg-clay border border-clay-strong text-on-clay' : 'text-ink-muted hover:bg-clay/70 hover:text-on-clay'
    }`;

  const segmentClass = (view: 'library' | 'catalog') =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md transition-colors duration-states ${
      currentView === view ? 'bg-clay text-on-clay' : 'text-ink-muted hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-line transition-colors duration-states">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <button
            onClick={() => onNavigate('library')}
            className="text-left focus:outline-none focus-visible:outline-2 rounded-sm"
          >
            <BrandLogo size="md" />
          </button>

          {currentView === 'reader' && bookTitle && (
            <div className="hidden md:flex items-center gap-2 text-sm text-ink-muted truncate">
              <span className="text-line-strong">/</span>
              <span className="text-ink font-medium truncate">{bookTitle}</span>
              {chapterTitle && (
                <>
                  <span className="text-line-strong">·</span>
                  <span className="truncate">{chapterTitle}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-stretch rounded-md border border-line bg-paper-raised p-0.5">
            <button type="button" onClick={() => onNavigate('library')} className={segmentClass('library')}>
              <Library size={18} strokeWidth={1.75} />
              <span className="hidden sm:inline">Biblioteca</span>
            </button>
            <button type="button" onClick={() => onNavigate('catalog')} className={segmentClass('catalog')}>
              <Warehouse size={18} strokeWidth={1.75} />
              <span className="hidden sm:inline">Almacén</span>
            </button>
          </div>
          <button type="button" onClick={() => onNavigate('profile')} className={itemClass('profile')}>
            <UserRound size={18} strokeWidth={1.75} />
            <span className="hidden sm:inline">Perfil</span>
          </button>

          <div className="h-5 w-px bg-line mx-1" />
          <ThemeToggle />

          {user && (
            <button type="button" onClick={() => onNavigate('profile')} className="flex items-center gap-2 ml-1" title={user.name}>
              <UserAvatar name={user.name} imageUrl={user.avatarUrl} />
              <span className="text-sm font-medium text-ink hidden lg:inline max-w-[8rem] truncate">{user.name}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
