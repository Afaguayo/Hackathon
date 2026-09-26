import React, { useState } from 'react';
import { Book } from '../../types';
import { Button } from '../ui/Button';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { ApiError, isBackendSession, uploadBook } from '../../services/api';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_'));

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookUploaded: (newBook: Book) => void;
}

export const UploadBookModal: React.FC<UploadBookModalProps> = ({
  isOpen,
  onClose,
  onBookUploaded,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validExtensions = ['.epub', '.pdf', '.txt', '.md'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setError('No pude abrir este archivo. Prueba con un EPUB o PDF.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Auto extract title from filename
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor escribe el título del libro.');
      return;
    }

    // Signed in: upload to the backend, which extracts the chapters and prepares Reed for this book.
    if (isBackendSession()) {
      if (!file) {
        setError('Elige el archivo del libro (EPUB, PDF o TXT).');
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('El archivo pesa más de 4 MB. Prueba con un EPUB o un PDF más liviano.');
        return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
        const book = await uploadBook(file, title.trim(), author.trim());
        onBookUploaded(book);
        onClose();
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        setError(
          status === 422 ? 'No pude leer el texto de este archivo. Si es un PDF escaneado, prueba con un EPUB.'
          : status === 429 ? 'Llegaste al límite de libros por hoy. Vuelve mañana.'
          : status === 413 ? 'El archivo pesa más de 4 MB.'
          : 'No pude subir el libro. Inténtalo de nuevo.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (CLERK_ENABLED) {
      setError('Inicia sesión para subir tus libros.');
      return;
    }

    // Demo mode (no Clerk key): simulated upload.
    setIsSubmitting(true);

    // Simular procesamiento del libro y creación
    setTimeout(() => {
      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: title.trim(),
        author: author.trim() || 'Autor desconocido',
        currentChapterNumber: 1,
        totalChapters: 5,
        progressPercent: 0,
        whereYouLeftOff: 'Capítulo 1 · Inicio de lectura',
        hasAudio: true,
        chapters: [
          {
            id: `ch-1-${Date.now()}`,
            number: 1,
            title: 'Capítulo 1 · Introducción',
            whereYouLeftOffSummary: 'Comienzo del libro.',
            paragraphs: [
              {
                id: `p-new-1`,
                order: 1,
                text: file
                  ? `Se ha cargado con éxito el archivo "${file.name}". Reed está listo para acompañarte en la lectura de esta obra.`
                  : 'El libro comienza aquí con calma y claridad.'
              },
              {
                id: `p-new-2`,
                order: 2,
                text: 'Puedes seleccionar cualquier párrafo para conversar con Reed, pedir una explicación o escuchar con la voz de ElevenLabs.'
              }
            ]
          }
        ]
      };

      onBookUploaded(newBook);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-raised border border-line rounded-lg w-full max-w-lg p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
          aria-label="Cerrar ventana"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <h3 className="font-serif font-semibold text-2xl text-ink mb-1">
          Subir un libro
        </h3>
        <p className="text-sm text-ink-muted mb-5">
          Sube un archivo EPUB, PDF o texto para leer y escuchar con Reed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5 font-sans">
              Título del libro
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. La sombra del viento"
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-paper border border-line-strong text-ink placeholder:text-ink-muted text-sm focus:border-focus transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5 font-sans">
              Autor
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ej. Carlos Ruiz Zafón"
              className="w-full px-3.5 py-2.5 rounded-md bg-paper border border-line-strong text-ink placeholder:text-ink-muted text-sm focus:border-focus transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5 font-sans">
              Archivo del libro
            </label>
            <label className="border-2 border-dashed border-line-strong rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-paper-sunk transition-colors text-center">
              <Upload size={28} strokeWidth={1.75} className="text-reed mb-2" />
              {file ? (
                <div className="flex items-center gap-2 text-ink text-sm font-medium">
                  <FileText size={16} />
                  <span>{file.name}</span>
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold text-ink">
                    Elige un archivo o arrástralo aquí
                  </span>
                  <span className="text-xs text-ink-muted mt-1">
                    Archivos soportados: EPUB, PDF, TXT
                  </span>
                </>
              )}
              <input
                type="file"
                accept=".epub,.pdf,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-danger/10 border border-danger text-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Agregar a mi biblioteca'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
