import React, { useEffect, useState } from 'react';
import { Book } from './types';
import { initialBooks } from './data/sampleBooks';
import { Header } from './components/ui/Header';
import { LibraryView } from './components/library/LibraryView';
import { ReaderView } from './components/reader/ReaderView';
import { AuthProvider, useBackendAuth } from './components/auth/ClerkAuthProvider';
import { ReedProvider } from './context/ReedContext';
import { listLibrary, loadBookContent } from './services/api';

export const App: React.FC = () => (
  <AuthProvider>
    <ReedProvider>
      <AppShell />
    </ReedProvider>
  </AuthProvider>
);

/** Inside the providers so it can see whether a signed-in user's library can be loaded. */
const AppShell: React.FC = () => {
  const { backendSignedIn } = useBackendAuth();
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [currentView, setCurrentView] = useState<'library' | 'reader'>('library');
  const [selectedBook, setSelectedBook] = useState<Book>(initialBooks[0]);
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  // The user's uploaded books first, then the sample books.
  const books = [...userBooks, ...initialBooks];

  useEffect(() => {
    if (!backendSignedIn) {
      setUserBooks([]);
      return;
    }
    let cancelled = false;
    listLibrary()
      .then((list) => !cancelled && setUserBooks(list))
      .catch(() => !cancelled && setLibraryError('No pude cargar tu biblioteca. Recarga la página para intentarlo de nuevo.'));
    return () => {
      cancelled = true;
    };
  }, [backendSignedIn]);

  const handleSelectBook = async (book: Book) => {
    setLibraryError(null);
    let ready = book;
    if (book.documentId && !book.chapters.length) {
      setOpeningBookId(book.id);
      try {
        ready = await loadBookContent(book);
        setUserBooks((prev) => prev.map((b) => (b.id === ready.id ? ready : b)));
      } catch {
        setLibraryError(`No pude abrir "${book.title}". Inténtalo de nuevo.`);
        return;
      } finally {
        setOpeningBookId(null);
      }
    }
    setSelectedBook(ready);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewBook = (newBook: Book) => {
    if (newBook.documentId) setUserBooks((prev) => [newBook, ...prev]);
    setSelectedBook(newBook);
    setCurrentView('reader');
  };

  const currentChapter =
    selectedBook?.chapters.find((c) => c.number === selectedBook.currentChapterNumber) ?? selectedBook?.chapters[0];

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-states font-sans flex flex-col">
      {/* Encabezado global */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        bookTitle={selectedBook?.title}
        chapterTitle={currentChapter?.title}
        hasAudio={selectedBook?.hasAudio}
      />

      {(libraryError || openingBookId) && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
          <p className={`text-sm rounded-md px-3 py-2 border ${libraryError ? 'text-danger border-danger bg-danger/10' : 'text-ink-muted border-line bg-paper-sunk'}`}>
            {libraryError ?? 'Abriendo tu libro…'}
          </p>
        </div>
      )}

      {/* Vista principal condicional */}
      <main className="flex-1">
        {currentView === 'library' ? (
          <LibraryView
            books={books}
            onSelectBook={handleSelectBook}
            onPlayBookAudio={handleSelectBook}
            onAddNewBook={handleAddNewBook}
          />
        ) : (
          <ReaderView
            key={selectedBook.id}
            book={selectedBook}
            allBooks={books}
            onSelectBook={handleSelectBook}
            onBackToLibrary={() => setCurrentView('library')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
