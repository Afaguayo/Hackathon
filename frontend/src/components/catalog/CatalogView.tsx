import React, { useMemo, useState } from 'react';
import { Book } from '../../types';
import { Button } from '../ui/Button';

interface CatalogViewProps {
  books: Book[];
  isInLibrary: (bookId: string) => boolean;
  onAdd: (book: Book) => void;
  onRead: (book: Book) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ books, isInLibrary, onAdd, onRead }) => {
  const categories = useMemo(
    () => ['Todas', ...new Set(books.map((book) => book.genre).filter(Boolean) as string[])],
    [books],
  );
  const [category, setCategory] = useState('Todas');
  const visible = category === 'Todas' ? books : books.filter((book) => book.genre === category);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 border-b border-line pb-6">
        <span className="text-xs font-bold text-ink-muted uppercase tracking-widest block mb-1">Catálogo</span>
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink tracking-tight">Almacén</h1>
        <p className="text-ink-muted text-sm sm:text-base mt-1.5 max-w-xl">
          Libros disponibles para sumar a tu biblioteca. El progreso será solo tuyo.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              category === item ? 'bg-clay border-clay-strong text-on-clay font-bold' : 'border-transparent text-ink-muted hover:bg-clay/60 hover:text-on-clay'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.map((book) => {
          const owned = isInLibrary(book.id);
          return (
            <article key={book.id} className="bg-paper-raised border border-line rounded-lg p-5 sm:p-6 flex flex-col">
              <div className="flex gap-4">
                <div className="w-16 h-24 rounded-md bg-paper-sunk border border-line relative overflow-hidden flex-shrink-0 p-2">
                  <span className="w-1.5 h-full absolute left-0 top-0 bg-reed" />
                  <p className="pl-1 text-[11px] font-serif font-semibold text-ink line-clamp-4">{book.title}</p>
                </div>
                <div className="min-w-0">
                  {book.genre && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">{book.genre}</p>
                  )}
                  <h2 className="font-serif text-2xl text-ink leading-tight">{book.title}</h2>
                  <p className="text-sm text-ink-muted mt-1">{book.author}</p>
                </div>
              </div>
              {book.recommendationReason && (
                <p className="text-sm text-ink-muted mt-4 leading-relaxed">{book.recommendationReason}</p>
              )}
              <div className="mt-5 pt-4 border-t border-line flex items-center gap-3">
                {owned ? (
                  <>
                    <span className="text-sm text-ink-muted flex-1">En tu biblioteca</span>
                    <Button variant="primary" onClick={() => onRead(book)}>Leer ahora</Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" className="flex-1" onClick={() => onAdd(book)}>
                      Agregar a mi biblioteca
                    </Button>
                    <Button variant="secondary" onClick={() => onRead(book)}>Leer ahora</Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
