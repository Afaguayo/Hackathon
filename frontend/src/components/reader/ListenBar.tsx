import React from 'react';
import { Play, Pause, X, SkipBack, SkipForward } from 'lucide-react';
import { ReedBubble } from '../reed/ReedBubble';

interface ListenBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  chapterTitle: string;
  currentTimeFormatted: string;
  playbackRate: number;
  onChangePlaybackRate: () => void;
  onPrevParagraph?: () => void;
  onNextParagraph?: () => void;
  onOpenReedAction?: (actionType: string) => void;
  onClose?: () => void;
}

export const ListenBar: React.FC<ListenBarProps> = ({
  isPlaying,
  onTogglePlay,
  chapterTitle,
  currentTimeFormatted,
  playbackRate,
  onChangePlaybackRate,
  onPrevParagraph,
  onNextParagraph,
  onOpenReedAction,
  onClose,
}) => {
  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-3xl z-40 animate-slideUp">
      <div className="bg-paper-raised/95 backdrop-blur-md border border-line-strong shadow-2xl rounded-lg p-2.5 sm:p-3.5 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-states">
        
        {/* Lado izquierdo: Botón ámbar circular + Controles de salto + Título */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Botón Play/Pausa en Ámbar (la voz) */}
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-ambar text-on-ambar flex items-center justify-center flex-shrink-0 shadow-md hover:brightness-105 active:scale-95 transition-all duration-states"
            aria-label={isPlaying ? 'Pausar lectura' : 'Escuchar lectura'}
          >
            {isPlaying ? (
              <Pause size={20} strokeWidth={2.2} />
            ) : (
              <Play size={20} strokeWidth={2.2} className="ml-0.5" />
            )}
          </button>

          {/* Botones de salto de párrafo (Sección 6) */}
          {onPrevParagraph && (
            <button
              onClick={onPrevParagraph}
              title="Retroceder al párrafo anterior"
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors hidden xs:flex items-center justify-center"
            >
              <SkipBack size={16} strokeWidth={1.75} />
            </button>
          )}

          {onNextParagraph && (
            <button
              onClick={onNextParagraph}
              title="Avanzar al siguiente párrafo"
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors hidden xs:flex items-center justify-center"
            >
              <SkipForward size={16} strokeWidth={1.75} />
            </button>
          )}

          {/* Información del capítulo */}
          <div className="min-w-0 pr-1">
            <span className="block text-[10px] sm:text-[11px] font-bold text-ambar-ink uppercase tracking-wider font-sans">
              {isPlaying ? 'ESCUCHANDO' : 'EN PAUSA'}
            </span>
            <p className="font-sans font-semibold text-xs sm:text-sm text-ink truncate max-w-[140px] sm:max-w-[240px]">
              {chapterTitle}
            </p>
          </div>
        </div>

        {/* Lado derecho: Onda de voz + Tiempo + Velocidades (0.75x a 2x) + BURBUJA DE REED */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Onda de voz animada en ámbar que respira a 1.2s */}
          <div className="hidden sm:flex items-center gap-1 h-5" title="Voz de ElevenLabs">
            <span className={`w-[2px] rounded-full bg-ambar ${isPlaying ? 'animate-wave-1' : 'h-2'}`} />
            <span className={`w-[2px] rounded-full bg-ambar ${isPlaying ? 'animate-wave-2' : 'h-3.5'}`} />
            <span className={`w-[2px] rounded-full bg-ambar ${isPlaying ? 'animate-wave-3' : 'h-5'}`} />
            <span className={`w-[2px] rounded-full bg-ambar ${isPlaying ? 'animate-wave-4' : 'h-3'}`} />
            <span className={`w-[2px] rounded-full bg-ambar ${isPlaying ? 'animate-wave-5' : 'h-1.5'}`} />
          </div>

          {/* Tiempo transcurrido */}
          <span className="text-xs font-sans font-medium text-ink-muted hidden xs:inline">
            {currentTimeFormatted}
          </span>

          {/* Selector de velocidad: 0.75x, 1x, 1.25x, 1.5x, 2x (Sección 6) */}
          <button
            onClick={onChangePlaybackRate}
            className="px-2 py-1 text-xs font-bold rounded-pill border border-line-strong hover:bg-paper-sunk text-ink transition-colors font-sans"
            title="Cambiar velocidad de lectura (0.75x, 1x, 1.25x, 1.5x, 2x)"
          >
            {playbackRate}×
          </button>

          {/* Divisor estético sutil */}
          <div className="h-6 w-[1px] bg-line mx-0.5 sm:mx-1" />

          {/* BURBUJA DE REED INTEGRADA EN LA BARRA (Sección 1 y 7) */}
          <ReedBubble onOpenModeAction={onOpenReedAction} />

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
              title="Ocultar barra"
            >
              <X size={15} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
