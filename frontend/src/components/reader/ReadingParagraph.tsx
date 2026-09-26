import React from 'react';
import { Paragraph } from '../../types';
import { MessageSquare, Play } from 'lucide-react';

interface ReadingParagraphProps {
  paragraph: Paragraph;
  isReading: boolean;
  isSelected: boolean;
  onSelect: (paragraph: Paragraph) => void;
  onAskAbout: (paragraph: Paragraph) => void;
  onListenFrom: (paragraph: Paragraph) => void;
}

export const ReadingParagraph: React.FC<ReadingParagraphProps> = ({
  paragraph,
  isReading,
  isSelected,
  onSelect,
  onAskAbout,
  onListenFrom,
}) => {
  return (
    <div className="relative mb-6 group transition-colors duration-states">
      {/* Línea-junco: Cursor de lectura al margen izquierdo cuando se lee en voz alta */}
      {isReading && (
        <span
          className="absolute -left-4 sm:-left-6 top-1 bottom-1 w-[2.5px] rounded-full bg-reed transition-all duration-states"
          title="Leyendo en voz alta"
        />
      )}

      {/* Párrafo con tipografía Literata 20px / 32px y ancho de 60-68 caracteres */}
      <div
        onClick={() => onSelect(paragraph)}
        className={`cursor-pointer rounded-sm p-2 -m-2 transition-all duration-states select-text ${
          isSelected
            ? 'bg-highlight text-ink'
            : isReading
            ? 'text-ink'
            : 'text-ink hover:bg-paper-sunk/50'
        }`}
      >
        <p className="font-serif text-[19px] sm:text-[20px] leading-[32px] max-w-[65ch]">
          {paragraph.text}
        </p>
      </div>

      {/* Barra de opciones flotante cuando el párrafo está seleccionado (como en Slide 10 y 11) */}
      {isSelected && (
        <div className="mt-3 flex flex-wrap items-center gap-2 animate-fadeIn z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAskAbout(paragraph);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-reed text-on-reed text-sm font-bold shadow-sm hover:bg-reed-strong transition-colors"
          >
            <MessageSquare size={16} strokeWidth={2} />
            <span>Preguntar sobre esto</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onListenFrom(paragraph);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line-strong bg-paper-raised text-ink text-sm font-bold hover:bg-paper-sunk transition-colors"
          >
            <Play size={16} strokeWidth={2} className="text-ambar-ink" />
            <span>Escuchar desde aquí</span>
          </button>
        </div>
      )}
    </div>
  );
};
