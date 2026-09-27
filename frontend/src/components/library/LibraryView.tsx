import React, { useMemo, useState } from 'react';
import { Book, ReadingStatus } from '../../types';
import { LibraryEntry } from '../../context/AccountContext';
import { BookCard } from './BookCard';
import { UploadBookModal } from './UploadBookModal';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

interface LibraryViewProps {
  entries: LibraryEntry[];
  onSelectBook: (book: Book) => void;
  onPlayBookAudio: (book: Book) => void;
  onAddNewBook: (book: Book) => void;
  onOpenCatalog: () => void;
}

const filters: { id: 'all' | ReadingStatus; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'reading', label: 'Leyendo' },
  { id: 'finished', label: 'Terminados' },
  { id: 'unread', label: 'Sin empezar' },
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  entries,
  onSelectBook,
  onPlayBookAudio,
  onAddNewBook,
  onOpenCatalog,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | ReadingStatus>('all');
  const [author, setAuthor] = useState('all');

  const authors = useMemo(
    () => [...new Set(entries.map((entry) => entry.book.author))].sort(),
    [entries],
  );

  const visible = entries.filter((entry) => {
    if (filter !== 'all' && entry.record.status !== filter) return false;
    if (author !== 'all' && entry.book.author !== author) return false;
    return true;
  });

  const continueEntry = [...entries]
    .filter((entry) => entry.record.status === 'reading' && entry.record.lastReadAt)
    .sort((a, b) => (b.record.lastReadAt || '').localeCompare(a.record.lastReadAt || ''))[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-line pb-6">
        <div>
          <span className="text-xs font-bold text-ink-muted uppercase tracking-widest block mb-1">
            Tu espacio
          </span>
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink tracking-tight">
            Tu biblioteca
          </h1>
          <p className="text-ink-muted text-sm sm:text-base mt-1.5 max-w-xl">
            Los libros que elegiste, con el punto exacto en el que los dejaste.
          </p>
        </div>

        <Button variant="secondary" onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} strokeWidth={2} className="text-reed" />
          <span>Subir PDF</span>
        </Button>
      </div>

      {continueEntry && (
        <button
          type="button"
          onClick={() => onSelectBook(continueEntry.book)}
          className="w-full text-left mb-8 p-5 sm:p-6 rounded-lg border border-line bg-paper-raised hover:border-line-strong transition-colors"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Continuar leyendo</span>
          <p className="font-serif text-2xl text-ink mt-1">{continueEntry.book.title}</p>
          <p className="text-sm text-ink-muted mt-1">{continueEntry.book.whereYouLeftOff}</p>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              filter === item.id ? 'bg-clay border-clay-strong text-on-clay font-bold' : 'border-transparent text-ink-muted hover:bg-clay/60 hover:text-on-clay'
            }`}
          >
            {item.label}
          </button>
        ))}
        {authors.length > 1 && (
          <select
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className="ml-auto text-sm bg-paper border border-line rounded-md px-2 py-1.5 text-ink"
            aria-label="Filtrar por autor"
          >
            <option value="all">Todos los autores</option>
            {authors.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 text-center">
          <p className="font-serif text-xl text-ink mb-2">Todavía no hay libros aquí</p>
          <p className="text-sm text-ink-muted mb-5">Agrega uno desde el almacén o sube un PDF.</p>
          <Button variant="primary" onClick={onOpenCatalog}>Ir al almacén</Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-ink-muted">Ningún libro coincide con este filtro.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visible.map((entry) => (
            <BookCard
              key={entry.book.id}
              book={entry.book}
              status={entry.record.status}
              onSelectBook={onSelectBook}
              onPlayAudio={onPlayBookAudio}
            />
          ))}
        </div>
      )}

      <UploadBookModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBookUploaded={onAddNewBook}
      />
    </div>
  );
};
