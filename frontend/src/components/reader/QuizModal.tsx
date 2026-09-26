import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import { Button } from '../ui/Button';
import { X, Check, ArrowRight } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  chapterTitle: string;
  isLoading?: boolean;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  questions,
  chapterTitle,
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;
    setSelectedOption(index);
    setHasAnswered(true);

    if (index === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-raised border border-line rounded-lg w-full max-w-xl p-6 shadow-xl relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
          aria-label="Cerrar quiz"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-4 bg-reed rounded-full" />
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider font-sans">
            Quiz de comprensión
          </span>
        </div>

        <h3 className="font-serif font-semibold text-xl text-ink mb-1 truncate">
          {chapterTitle}
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-ink-muted text-sm font-sans flex flex-col items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-reed border-t-transparent rounded-full animate-spin" />
            <span>Generando preguntas con calma...</span>
          </div>
        ) : isFinished ? (
          <div className="py-8 text-center">
            <h4 className="font-serif font-semibold text-2xl text-ink mb-2">
              Logro de lectura
            </h4>
            <p className="text-base text-ink-muted mb-4 font-sans">
              Respondiste correctamente {score} de {questions.length} preguntas.
            </p>
            <div className="p-4 bg-reed-soft/50 rounded-md border border-line max-w-md mx-auto mb-6 text-sm text-ink font-sans">
              Reed dice: «Terminaste el capítulo y lo entendiste. Muy buen momento para continuar leyendo cuando gustes.»
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={handleReset}>
                Repetir quiz
              </Button>
              <Button variant="primary" onClick={onClose}>
                Volver a la lectura
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-ink-muted mb-4 font-sans">
              <span>Pregunta {currentIndex + 1} de {questions.length}</span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            </div>

            <div className="bg-paper p-4 rounded-md border border-line mb-4">
              <p className="font-serif text-[17px] leading-[26px] font-medium text-ink">
                {currentQuestion.question}
              </p>
            </div>

            {/* Opciones */}
            <div className="space-y-2.5 mb-5">
              {currentQuestion.options.map((option, idx) => {
                let optionStyle = 'border-line hover:border-line-strong bg-paper';
                if (hasAnswered) {
                  if (idx === currentQuestion.correctIndex) {
                    optionStyle = 'border-reed bg-reed-soft/60 text-ink font-semibold';
                  } else if (idx === selectedOption) {
                    optionStyle = 'border-line bg-paper-sunk opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3.5 rounded-md border transition-all duration-states flex items-center justify-between text-sm ${optionStyle}`}
                  >
                    <span>{option}</span>
                    {hasAnswered && idx === currentQuestion.correctIndex && (
                      <Check size={18} className="text-reed flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explicación después de responder */}
            {hasAnswered && (
              <div className="p-3.5 rounded-md bg-paper-sunk border border-line text-xs leading-relaxed text-ink mb-5 font-sans animate-fadeIn">
                <span className="font-bold block mb-1">Explicación:</span>
                {currentQuestion.explanation}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              {hasAnswered ? (
                <Button variant="primary" onClick={handleNext} className="flex items-center gap-1.5">
                  <span>{currentIndex + 1 === questions.length ? 'Ver resultado' : 'Siguiente'}</span>
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <span className="text-xs text-ink-muted self-center">
                  Elige una opción para ver la explicación.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
