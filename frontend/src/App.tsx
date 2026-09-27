import React, { useState } from 'react';
import { AppView, Book } from './types';
import { Header } from './components/ui/Header';
import { LibraryView } from './components/library/LibraryView';
import { CatalogView } from './components/catalog/CatalogView';
import { ProfileView } from './components/profile/ProfileView';
import { ReaderView } from './components/reader/ReaderView';
import { AuthScreen } from './components/auth/AuthScreen';
import { AuthProvider } from './components/auth/ClerkAuthProvider';
import { AccountProvider, useAccount } from './context/AccountContext';
import { ReedProvider } from './context/ReedContext';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AccountProvider>
        <ReedProvider>
          <AppShell />
        </ReedProvider>
      </AccountProvider>
    </AuthProvider>
  );
};

const AppShell: React.FC = () => {
  const {
    ready,
    user,
    entries,
    catalog,
    toast,
    dismissToast,
    isInLibrary,
    addToLibrary,
    addUploadedBook,
    getBook,
    saveProgress,
  } = useAccount();

  const [currentView, setCurrentView] = useState<AppView>('library');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listenOnOpen, setListenOnOpen] = useState(false);

  if (!ready) return <div className="min-h-screen bg-paper" />;
  if (!user) return <AuthScreen />;

  const selected = selectedId ? getBook(selectedId) : undefined;
  const selectedEntry = entries.find((entry) => entry.book.id === selectedId);
  const reedBooks = [...catalog];
  entries.forEach((entry) => {
    if (!reedBooks.some((book) => book.id === entry.book.id)) reedBooks.push(entry.book);
  });

  const openBook = (book: Book, listen = false) => {
    if (!isInLibrary(book.id)) addToLibrary(book.id);
    setListenOnOpen(listen);
    setSelectedId(book.id);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-states font-sans flex flex-col">
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'reader' && !selected) return;
          setCurrentView(view);
        }}
        bookTitle={selected?.title}
        chapterTitle={selectedEntry && selectedEntry.record.status !== 'unread' ? selectedEntry.book.whereYouLeftOff : undefined}
      />

      {toast && (
        <button
          type="button"
          onClick={dismissToast}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-paper-raised border border-line shadow-lg text-sm text-ink"
        >
          {toast}
        </button>
      )}

      <main className="flex-1">
        {currentView === 'library' && (
          <LibraryView
            entries={entries}
            onSelectBook={(book) => openBook(book)}
            onPlayBookAudio={(book) => openBook(book, true)}
            onAddNewBook={(book) => {
              addUploadedBook(book);
              setListenOnOpen(false);
              setSelectedId(book.id);
              setCurrentView('reader');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCatalog={() => setCurrentView('catalog')}
          />
        )}
        {currentView === 'catalog' && (
          <CatalogView
            books={catalog}
            isInLibrary={isInLibrary}
            onAdd={(book) => addToLibrary(book.id)}
            onRead={(book) => openBook(book)}
          />
        )}
        {currentView === 'profile' && <ProfileView />}
        {currentView === 'reader' && selected && (
          <ReaderView
            book={selected}
            allBooks={reedBooks}
            initialChapter={selectedEntry?.record.currentChapter ?? 1}
            initialPage={selectedEntry?.record.currentPage ?? 0}
            autoListen={listenOnOpen}
            onProgress={(position) => saveProgress(selected.id, position)}
            onSelectBook={(book) => openBook(book)}
            onBackToLibrary={() => setCurrentView('library')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
