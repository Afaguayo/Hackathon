import React, { useState } from 'react';
import { Book } from '../../types';
import { Button } from '../ui/Button';
import { X, Upload, AlertCircle } from 'lucide-react';
import { extractPdfChapters, isPdfFile, withTimeout } from '../../lib/pdf';
import { buildUploadedBook, chaptersFromPlainText } from '../../lib/reading';
import { ApiError, isBackendSession, uploadBook } from '../../services/api';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookUploaded: (newBook: Book) => void;
}

type Phase = 'idle' | 'uploading' | 'preparing' | 'ready';

export const UploadBookModal: React.FC<UploadBookModalProps> = ({
  isOpen,
  onClose,
  onBookUploaded,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    const name = selected.name.toLowerCase();
    const allowed = name.endsWith('.pdf') || name.endsWith('.txt') || name.endsWith('.md') || (isBackendSession() && name.endsWith('.epub'));
    if (!allowed) {
      setError('Puedo preparar PDF o texto. Prueba con uno de esos archivos.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Elige un archivo para continuar.');
      return;
    }
    if (!title.trim()) {
      setError('Escribe el título del libro.');
      return;
    }

    setError(null);
    setPhase('uploading');

    if (isBackendSession()) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('El archivo pesa más de 4 MB. Prueba con un archivo más liviano.');
        setPhase('idle');
        return;
      }
      try {
        const book = await uploadBook(file, title.trim(), author.trim());
        setPhase('ready');
        onBookUploaded(book);
        setPhase('idle');
        setFile(null);
        setTitle('');
        setAuthor('');
        onClose();
      } catch (caught) {
        const status = caught instanceof ApiError ? caught.status : 0;
        setError(
          status === 422 ? 'No pude leer el texto de este archivo. Si es un PDF escaneado, prueba con un EPUB.'
          : status === 429 ? 'Llegaste al límite de libros por hoy. Vuelve mañana.'
          : status === 413 ? 'El archivo pesa más de 4 MB.'
          : 'No pude subir el libro. Inténtalo de nuevo.',
        );
        setPhase('idle');
      }
      return;
    }

    try {
      const name = file.name.toLowerCase();
      let chapters;
      if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        const valid = await isPdfFile(file);
        if (!valid) {
          setError('Este archivo no es un PDF válido.');
          setPhase('idle');
          return;
        }
        setPhase('preparing');
        chapters = await withTimeout(
          extractPdfChapters(file),
          25000,
          'La preparación tardó demasiado. Prueba con un PDF más corto.',
        );
        if (!chapters.length) {
          setError('No pudimos extraer correctamente el texto de este PDF.');
          setPhase('idle');
          return;
        }
      } else {
        setPhase('preparing');
        const raw = await file.text();
        chapters = chaptersFromPlainText(raw);
        if (!chapters.length) {
          setError('No encontramos texto para leer en este archivo.');
          setPhase('idle');
          return;
        }
      }

      const book = buildUploadedBook(title, author, chapters);
      setPhase('ready');
      window.setTimeout(() => {
        onBookUploaded(book);
        setPhase('idle');
        setFile(null);
        setTitle('');
        setAuthor('');
        onClose();
      }, 500);
    } catch (caught) {
      const message = caught instanceof Error && caught.message.startsWith('La preparación')
        ? caught.message
        : 'No pudimos extraer correctamente el texto de este PDF.';
      setError(message);
      setPhase('idle');
    }
  };

  const phaseLabel = phase === 'uploading'
    ? 'Subiendo libro...'
    : phase === 'preparing'
      ? 'Preparando tu libro...'
      : phase === 'ready'
        ? 'Listo para leer.'
        : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper-raised border border-line rounded-lg w-full max-w-lg p-6 shadow-xl relative">
        <button
          onClick={onClose}
          disabled={phase === 'uploading' || phase === 'preparing'}
          className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
          aria-label="Cerrar ventana"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <h3 className="font-serif font-semibold text-2xl text-ink mb-1">Subir un libro</h3>
        <p className="text-sm text-ink-muted mb-5">
          El PDF se convierte en texto para leerlo con calma, como en un libro.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Título del libro</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. La sombra del viento"
              className="w-full px-3.5 py-2.5 rounded-md bg-paper border border-line-strong text-ink placeholder:text-ink-muted text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Autor</span>
            <input
              type="text"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Ej. Carlos Ruiz Zafón"
              className="w-full px-3.5 py-2.5 rounded-md bg-paper border border-line-strong text-ink placeholder:text-ink-muted text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Archivo</span>
            <span className="border-2 border-dashed border-line-strong rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-paper-sunk transition-colors text-center">
              <Upload size={28} strokeWidth={1.75} className="text-reed mb-2" />
              <span className="text-sm text-ink">{file ? file.name : 'PDF, TXT, Markdown o EPUB'}</span>
              <input type="file" accept=".pdf,.txt,.md,.epub,application/pdf,text/plain" className="hidden" onChange={handleFileChange} />
            </span>
          </label>

          {phaseLabel && <p className="text-sm text-ink">{phaseLabel}</p>}
          {error && (
            <p className="text-sm text-danger flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={phase === 'uploading' || phase === 'preparing' || phase === 'ready'}>
            {phase === 'idle' ? 'Preparar libro' : phaseLabel}
          </Button>
        </form>
      </div>
    </div>
  );
};
