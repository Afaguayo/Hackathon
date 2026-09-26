import React, { useState } from 'react';
import { ConversationMessage, Paragraph } from '../../types';
import { AskBubble } from './AskBubble';
import { ArrowRight, X, Sparkles } from 'lucide-react';

interface AskFieldProps {
  selectedParagraph: Paragraph | null;
  conversation: ConversationMessage[];
  onSendMessage: (text: string, quote?: string) => void;
  onClose: () => void;
  isThinking?: boolean;
}

export const AskField: React.FC<AskFieldProps> = ({
  selectedParagraph,
  conversation,
  onSendMessage,
  onClose,
  isThinking = false,
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    onSendMessage(question.trim(), selectedParagraph?.text);
    setQuestion('');
  };

  const handleQuickQuestion = (quickText: string) => {
    onSendMessage(quickText, selectedParagraph?.text);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-paper-raised border-l border-line shadow-2xl z-50 flex flex-col animate-slideLeft transition-colors duration-panels">
      {/* Encabezado del panel de preguntas */}
      <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-[3px] h-5 bg-reed rounded-full" />
          <h3 className="font-serif font-semibold text-lg text-ink">
            Conversar con Reed
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
          aria-label="Cerrar panel de conversación"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* Cita del párrafo seleccionado (como en Slide 09) */}
      {selectedParagraph && (
        <div className="p-4 bg-paper border-b border-line">
          <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 font-sans">
            SOBRE ESTE PÁRRAFO
          </span>
          <p className="font-serif italic text-sm text-ink line-clamp-3 leading-relaxed">
            “{selectedParagraph.text}”
          </p>
        </div>
      )}

      {/* Historial de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {conversation.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ink text-sm font-medium mb-1 font-sans">
              ¿Algo no te quedó claro? Pregúntame.
            </p>
            <p className="text-xs text-ink-muted font-sans">
              Reed ya leyó el capítulo y te lo explica con calma.
            </p>

            {/* Sugerencias rápidas */}
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => handleQuickQuestion('¿Qué significa esto en palabras sencillas?')}
                className="text-left text-xs p-2.5 rounded-md bg-paper border border-line hover:border-line-strong text-ink transition-colors"
              >
                «¿Qué significa esto en palabras sencillas?»
              </button>
              <button
                onClick={() => handleQuickQuestion('¿Por qué es importante este momento en la historia?')}
                className="text-left text-xs p-2.5 rounded-md bg-paper border border-line hover:border-line-strong text-ink transition-colors"
              >
                «¿Por qué es importante este momento en la historia?»
              </button>
            </div>
          </div>
        ) : (
          conversation.map((msg) => (
            <AskBubble key={msg.id} message={msg} />
          ))
        )}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-ink-muted py-2">
            <span className="w-2 h-2 rounded-full bg-reed animate-pulse" />
            <span className="font-sans">Reed está pensando...</span>
          </div>
        )}
      </div>

      {/* Input de pregunta: matches Slide 09 AskField */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-line bg-paper-raised">
        <div className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pregúntale lo que quieras sobre este párrafo..."
            className="w-full pl-3.5 pr-12 py-3 rounded-md bg-paper border border-line-strong text-ink placeholder:text-ink-muted text-sm focus:border-focus transition-colors"
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className="absolute right-1.5 p-2 rounded-md bg-reed text-on-reed disabled:bg-paper-sunk disabled:text-ink-muted transition-colors hover:bg-reed-strong"
            title="Enviar pregunta"
          >
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
};
