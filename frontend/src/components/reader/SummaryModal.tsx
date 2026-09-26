import React from 'react';
import { Button } from '../ui/Button';
import { X, BookOpen } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  summaryText: string;
  isLoading?: boolean;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  chapterTitle,
  summaryText,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-raised border border-line rounded-lg w-full max-w-xl p-6 shadow-xl relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
          aria-label="Cerrar resumen"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-4 bg-reed rounded-full" />
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider font-sans">
            Resumen de 1 minuto
          </span>
        </div>

        <h3 className="font-serif font-semibold text-2xl text-ink mb-4">
          {chapterTitle}
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-ink-muted text-sm font-sans flex flex-col items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-reed border-t-transparent rounded-full animate-spin" />
            <span>Reed está sintetizando el capítulo...</span>
          </div>
        ) : (
          <div className="bg-paper p-5 rounded-md border border-line mb-6">
            <p className="font-serif text-[17px] leading-[28px] text-ink whitespace-pre-line">
              {summaryText}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-line">
          <Button variant="primary" onClick={onClose}>
            Seguir leyendo
          </Button>
        </div>
      </div>
    </div>
  );
};
