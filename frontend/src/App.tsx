import React, { useState } from 'react';
import { Book } from './types';
import { initialBooks } from './data/sampleBooks';
import { Header } from './components/ui/Header';
import { LibraryView } from './components/library/LibraryView';
import { ReaderView } from './components/reader/ReaderView';
import { AuthProvider } from './components/auth/ClerkAuthProvider';
import { ReedProvider } from './context/ReedContext';

export const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [currentView, setCurrentView] = useState<'library' | 'reader'>('library');
  const [selectedBook, setSelectedBook] = useState<Book>(initialBooks[0]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayBookAudio = (book: Book) => {
    setSelectedBook(book);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewBook = (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
    setSelectedBook(newBook);
    setCurrentView('reader');
  };

  return (
    <AuthProvider>
      <ReedProvider>
        <div className="min-h-screen bg-paper text-ink transition-colors duration-states font-sans flex flex-col">
          {/* Encabezado global */}
          <Header
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            bookTitle={selectedBook?.title}
            chapterTitle={selectedBook?.chapters[0]?.title}
            hasAudio={selectedBook?.hasAudio}
          />

          {/* Vista principal condicional */}
          <main className="flex-1">
            {currentView === 'library' ? (
              <LibraryView
                books={books}
                onSelectBook={handleSelectBook}
                onPlayBookAudio={handlePlayBookAudio}
                onAddNewBook={handleAddNewBook}
              />
            ) : (
              <ReaderView
                book={selectedBook}
                allBooks={books}
                onSelectBook={handleSelectBook}
                onBackToLibrary={() => setCurrentView('library')}
              />
            )}
          </main>
        </div>
      </ReedProvider>
    </AuthProvider>
  );
};

export default App;
