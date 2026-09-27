import React from 'react';
import { Book, ReadingStatus } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Play } from 'lucide-react';

interface BookCardProps {
  book: Book;
  status: ReadingStatus;
  onSelectBook: (book: Book) => void;
  onPlayAudio: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  status,
  onSelectBook,
  onPlayAudio,
}) => {
  const statusLabel = status === 'finished' ? 'Leído' : status === 'reading' ? 'Leyendo' : 'Sin empezar';
  const chapterLabel = status === 'unread'
    ? 'Sin empezar'
    : `Capítulo ${book.currentChapterNumber} de ${book.totalChapters}`;
  const actionLabel = status === 'unread' ? 'Empezar a leer' : status === 'finished' ? 'Abrir de nuevo' : 'Continuar leyendo';

  return (
    <div className="bg-paper-raised border border-line rounded-lg p-5 sm:p-6 transition-all duration-states hover:border-line-strong flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4">
          <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-md bg-paper-sunk border border-line flex-shrink-0 flex flex-col justify-between p-2.5 select-none relative overflow-hidden shadow-sm">
            <span className="w-1.5 h-full absolute left-0 top-0 bg-reed" />
            <span className="text-[10px] font-bold text-reed uppercase tracking-wider pl-1">Reed</span>
            <div className="pl-1">
              <p className="text-[11px] font-serif font-semibold text-ink line-clamp-2 leading-tight">
                {book.title}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={status === 'finished' ? 'reed' : 'neutral'}>{statusLabel}</Badge>
              {book.hasAudio && <Badge variant="ambar">Con voz</Badge>}
            </div>

            <h3 className="font-serif font-semibold text-xl sm:text-2xl text-ink tracking-tight truncate">
              {book.title}
            </h3>
            <p className="text-sm text-ink-muted mb-2">{book.author}</p>
            {status !== 'unread' && (
              <p className="text-xs text-ink-muted leading-relaxed">{book.whereYouLeftOff}</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar label={chapterLabel} percent={book.progressPercent} showText />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-line">
        <Button variant="primary" onClick={() => onSelectBook(book)} className="flex-1">
          {actionLabel}
        </Button>

        {book.hasAudio && status !== 'unread' && (
          <Button
            variant="secondary"
            onClick={() => onPlayAudio(book)}
            className="flex items-center gap-1.5"
            title="Escuchar desde donde quedaste"
          >
            <Play size={16} strokeWidth={2} className="text-ambar-ink" />
            <span>Escuchar</span>
          </Button>
        )}
      </div>
    </div>
  );
};
