import React, { useState } from 'react';
import { Book } from '../../types';
import { BookCard } from './BookCard';
import { UploadBookModal } from './UploadBookModal';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

interface LibraryViewProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onPlayBookAudio: (book: Book) => void;
  onAddNewBook: (book: Book) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  onSelectBook,
  onPlayBookAudio,
  onAddNewBook,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn">
      {/* Encabezado de la biblioteca */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 border-b border-line pb-6">
        <div>
          <span className="text-xs font-bold text-ink-muted uppercase tracking-widest block mb-1 font-sans">
            SISTEMA DE LECTURA · INNOVATHON 2.0
          </span>
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink tracking-tight">
            Tu biblioteca
          </h1>
          <p className="text-ink-muted text-sm sm:text-base mt-1.5 max-w-xl font-sans">
            El amigo curioso que ya leyó el libro y te lo cuenta con calma.
          </p>
        </div>

        <div>
          <Button
            variant="secondary"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={2} className="text-reed" />
            <span>Subir nuevo libro</span>
          </Button>
        </div>
      </div>

      {/* Grid de libros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onSelectBook={onSelectBook}
            onPlayAudio={onPlayBookAudio}
          />
        ))}
      </div>

      {/* Modal para subir libro */}
      <UploadBookModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBookUploaded={onAddNewBook}
      />
    </div>
  );
};
