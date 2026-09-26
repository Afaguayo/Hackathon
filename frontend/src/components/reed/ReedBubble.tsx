import React, { useState, useRef, useEffect } from 'react';
import { ReedMode } from '../../types';
import { useReed } from '../../context/ReedContext';
import { BookOpen, GraduationCap, Headphones, Moon, Smile, Check, Sun } from 'lucide-react';

interface ReedBubbleProps {
  onOpenModeAction?: (actionType: string) => void;
  className?: string;
}

export const ReedBubble: React.FC<ReedBubbleProps> = ({
  onOpenModeAction,
  className = '',
}) => {
  const { mode, setMode } = useReed();
  const [isOpen, setIsOpen] = useState(false);
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
    icon: React.ReactNode;
  }[] = [
    {
      key: 'sleeping',
      label: 'Dormido',
      phrase: 'Déjame solo',
      desc: 'Reed no interviene, ni muestra resúmenes ni preguntas.',
      icon: <Moon size={18} strokeWidth={1.75} className="text-ink-muted" />,
    },
    {
      key: 'companion',
      label: 'Compañero',
      phrase: 'Acompáñame',
      desc: 'Un amigo que lee contigo, resume con calma y cuenta datos curiosos.',
      icon: <Smile size={18} strokeWidth={1.75} className="text-reed" />,
    },
    {
      key: 'teacher',
      label: 'Profesor',
      phrase: 'Enséñame',
      desc: 'Te ayuda a razonar con pistas socráticas y evalúa tu sesión.',
      icon: <GraduationCap size={18} strokeWidth={1.75} className="text-reed" />,
    },
    {
      key: 'librarian',
      label: 'Bibliotecario',
      phrase: 'Ayúdame con mis libros',
      desc: 'Te sugiere lecturas afines y responde dudas de tu biblioteca.',
      icon: <BookOpen size={18} strokeWidth={1.75} className="text-reed" />,
    },
    {
      key: 'reader',
      label: 'Lector',
      phrase: 'Léemelo',
      desc: 'Muestra la barra de audio inferior y lee el texto sincronizado.',
      icon: <Headphones size={18} strokeWidth={1.75} className="text-ambar-ink" />,
    },
  ];

  const currentModeInfo = modeOptions.find(m => m.key === mode);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Burbuja circular de Reed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Reed: ${currentModeInfo?.label || mode} («${currentModeInfo?.phrase}»). Clic para cambiar de modo.`}
        className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-states shadow-lg hover:scale-105 active:scale-95 ${
          mode === 'sleeping'
            ? 'bg-paper-sunk border-line-strong opacity-85'
            : mode === 'reader'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-ambar'
            : 'bg-reed-soft border-reed'
        }`}
        aria-label="Menú de Reed"
      >
        {/* Avatar SVG minimalista de Reed */}
        <ReedFace mode={mode} />

        {/* Indicador visual de modo en esquina */}
        <span
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm ${
            mode === 'sleeping'
              ? 'bg-paper-sunk text-ink-muted border border-line-strong'
              : mode === 'reader'
              ? 'bg-ambar text-on-ambar'
              : 'bg-reed text-on-reed'
          }`}
        >
          {mode === 'sleeping' && 'Z'}
          {mode === 'companion' && '•'}
          {mode === 'teacher' && '🎓'}
          {mode === 'librarian' && '📚'}
          {mode === 'reader' && '🎧'}
        </span>
      </button>

      {/* Popover / Menú flotante compacto de selección de modos */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-80 sm:w-96 bg-paper-raised border border-line-strong shadow-2xl rounded-lg p-4 z-50 animate-slideUp font-sans">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-sans">
                ACOMPAÑAMIENTO DE REED
              </span>
              <h4 className="font-serif font-semibold text-lg text-ink">
                ¿Cómo quieres que Reed te acompañe?
              </h4>
            </div>
          </div>

          {/* Opción directa: Despertar a Reed si está dormido */}
          {mode === 'sleeping' && (
            <div className="mb-3 p-3 bg-paper rounded-md border border-line flex items-center justify-between">
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
                  onClick={() => {
                    setMode(opt.key);
                    setIsOpen(false);
                    if (onOpenModeAction) {
                      onOpenModeAction(opt.key);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-md transition-all duration-states flex items-start gap-3 border ${
                    isActive
                      ? 'bg-reed-soft/70 border-reed text-ink shadow-sm'
                      : 'border-transparent hover:bg-paper-sunk text-ink'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-paper border border-line flex-shrink-0">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-ink">
                        {opt.label}
                      </span>
                      <span className="text-xs font-serif italic text-ink-muted">
                        «{opt.phrase}»
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                  {isActive && (
                    <Check size={16} strokeWidth={2.5} className="text-reed self-center ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-line text-center">
            <span className="text-[11px] text-ink-muted">
              {mode === 'reader'
                ? 'La barra de audio inferior está activa en modo Lector.'
                : 'La barra de audio solo aparecerá al cambiar a modo Lector.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG de la carita de Reed adaptada al modo
const ReedFace: React.FC<{ mode: ReedMode }> = ({ mode }) => {
  if (mode === 'sleeping') {
    return (
      <svg viewBox="0 0 36 36" className="w-7 h-7 text-ink-muted">
        {/* Tallo junco superior dormido (levemente inclinado) */}
        <path d="M18 7 C18 4, 15 2, 14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Ojos cerrados dormidos */}
        <path d="M11 18 Q14 21 16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M20 18 Q22 21 25 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Boca suave de descanso */}
        <path d="M16 25 Q18 26 20 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  if (mode === 'reader') {
    return (
      <svg viewBox="0 0 36 36" className="w-7 h-7 text-ambar-ink">
        {/* Tallo junco con audífonos */}
        <path d="M18 8 C18 4, 21 2, 22 3" stroke="#2f5d46" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Diadema de audífonos */}
        <path d="M7 17 C7 9, 29 9, 29 17" stroke="#d9893b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <rect x="5" y="15" width="4" height="7" rx="2" fill="#d9893b" />
        <rect x="27" y="15" width="4" height="7" rx="2" fill="#d9893b" />
        {/* Ojos atentos */}
        <circle cx="13" cy="19" r="1.5" fill="currentColor" />
        <circle cx="23" cy="19" r="1.5" fill="currentColor" />
        {/* Sonrisa serena */}
        <path d="M15 25 Q18 28 21 25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // Normal, Profesor o Bibliotecario:
  return (
    <svg viewBox="0 0 36 36" className="w-7 h-7 text-ink">
      {/* Tallo junco superior erguido */}
      <path d="M18 7 C18 3, 22 2, 23 3" stroke="#2f5d46" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Ojos amigables y atentos */}
      <circle cx="12" cy="18" r="1.75" fill="currentColor" />
      <circle cx="24" cy="18" r="1.75" fill="currentColor" />
      {/* Sonrisa cálida */}
      <path d="M14 24 Q18 28 22 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
};
