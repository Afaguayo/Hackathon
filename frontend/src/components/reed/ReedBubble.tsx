import React, { useState, useRef, useEffect } from 'react';
import { ReedMode } from '../../types';
import { useReed } from '../../context/ReedContext';
import { Sun } from 'lucide-react';
import sleeping from '../../assets/reed/sleeping.png';
import companion from '../../assets/reed/companion.png';
import teacher from '../../assets/reed/teacher.png';
import librarian from '../../assets/reed/librarian.png';
import reader from '../../assets/reed/reader.png';

const modePortraits: Record<ReedMode, string> = {
  sleeping,
  companion,
  teacher,
  librarian,
  reader,
};

interface ReedBubbleProps {
  onOpenModeAction?: (actionType: string) => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  className?: string;
}

export const ReedBubble: React.FC<ReedBubbleProps> = ({
  onOpenModeAction,
  menuOpen,
  onMenuOpenChange,
  className = '',
}) => {
  const { mode, setMode } = useReed();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = menuOpen ?? internalOpen;
  const setIsOpen = (open: boolean) => {
    onMenuOpenChange?.(open);
    if (menuOpen === undefined) setInternalOpen(open);
  };
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const modeOptions: {
    key: ReedMode;
    label: string;
    phrase: string;
    desc: string;
  }[] = [
    {
      key: 'sleeping',
      label: 'Dormido',
      phrase: 'Déjame solo',
      desc: 'Reed no interviene, ni muestra resúmenes ni preguntas.',
    },
    {
      key: 'companion',
      label: 'Compañero',
      phrase: 'Acompáñame',
      desc: 'Un amigo que lee contigo, resume con calma y cuenta datos curiosos.',
    },
    {
      key: 'teacher',
      label: 'Profesor',
      phrase: 'Enséñame',
      desc: 'Te ayuda a razonar con pistas socráticas y evalúa tu sesión.',
    },
    {
      key: 'librarian',
      label: 'Bibliotecario',
      phrase: 'Ayúdame con mis libros',
      desc: 'Te sugiere lecturas afines y responde dudas de tu biblioteca.',
    },
    {
      key: 'reader',
      label: 'Lector',
      phrase: 'Léemelo',
      desc: 'Muestra la barra de audio inferior y lee el texto sincronizado.',
    },
  ];

  const currentModeInfo = modeOptions.find(m => m.key === mode);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Reed: ${currentModeInfo?.label || mode} («${currentModeInfo?.phrase}»). Clic para cambiar de modo.`}
        className="relative h-14 w-14 rounded-full overflow-hidden bg-paper-raised flex items-end justify-center transition-all duration-states shadow-lg hover:brightness-110 active:scale-95"
        aria-label="Menú de Reed"
      >
        <img
          src={modePortraits[mode]}
          alt=""
          className="h-[92%] w-auto object-contain"
        />
      </button>

      {isOpen && (
        <div className="fixed z-50 bottom-[6.5rem] right-[max(0.75rem,calc(50vw-36rem))] w-[min(20rem,calc(100vw-2rem))] max-h-[min(24rem,calc(100dvh-9.5rem))] overflow-x-hidden overflow-y-auto bg-paper-raised border border-line-strong shadow-2xl rounded-lg p-3.5 animate-slideUp font-sans">
          <div className="pb-2.5 mb-2.5 border-b border-line">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-sans">
              Acompañamiento
            </span>
            <h4 className="font-serif font-semibold text-lg text-ink leading-tight">
              ¿Cómo te acompaña Reed?
            </h4>
          </div>

          {/* Opción directa: Despertar a Reed si está dormido */}
          {mode === 'sleeping' && (
            <div className="mb-3 p-3 bg-paper rounded-md border border-line-strong flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink block">Reed está descansando</span>
                <span className="text-[11px] text-ink-muted">Sin avisos ni interrupciones</span>
              </div>
              <button
                onClick={() => {
                  setMode('companion');
                  setIsOpen(false);
                  if (onOpenModeAction) onOpenModeAction('companion');
                }}
                className="px-3 py-1.5 bg-reed text-on-reed text-xs font-bold rounded-md hover:bg-reed-strong transition-colors flex items-center gap-1.5"
              >
                <Sun size={14} />
                <span>Despertar a Reed</span>
              </button>
            </div>
          )}

          {/* Lista de modos */}
          <div className="space-y-1.5">
            {modeOptions.map((opt) => {
              const isActive = mode === opt.key;
              return (
                <button
                  key={opt.key}
                  title={opt.desc}
                  onClick={() => {
                    setMode(opt.key);
                    setIsOpen(false);
                    if (onOpenModeAction) {
                      onOpenModeAction(opt.key);
                    }
                  }}
                  className={`w-full text-left p-2 rounded-md transition-all duration-states flex items-center gap-3 border ${
                    isActive
                      ? 'bg-clay border-clay-strong text-on-clay shadow-sm'
                      : 'border-transparent hover:bg-paper text-ink'
                  }`}
                >
                  <span className="w-14 h-[4.5rem] rounded-[4px] overflow-hidden border border-line-strong bg-paper-raised flex items-end justify-center flex-shrink-0">
                    <img
                      src={modePortraits[opt.key]}
                      alt=""
                      className="h-[94%] w-auto object-contain"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`block font-bold text-sm ${isActive ? 'text-on-clay' : 'text-ink'}`}>
                      {opt.label}
                    </span>
                    <span className={`block text-xs font-serif italic ${isActive ? 'text-on-clay/80' : 'text-ink-muted'}`}>
                      «{opt.phrase}»
                    </span>
                    <p className={`text-xs mt-0.5 leading-snug ${isActive ? 'text-on-clay/80' : 'text-ink-muted'}`}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 border-t border-line pt-2.5 text-center text-xs leading-snug text-ink-muted">
            {mode === 'reader'
              ? 'El audio está activo en modo Lector.'
              : 'El audio aparece solo en modo Lector.'}
          </p>
        </div>
      )}
    </div>
  );
};
