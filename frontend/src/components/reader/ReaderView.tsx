import React, { useState, useEffect, useRef } from 'react';
import { Book, Paragraph, ConversationMessage, QuizQuestion } from '../../types';
import { useReed } from '../../context/ReedContext';
import { ReadingParagraph } from './ReadingParagraph';
import { ListenBar } from './ListenBar';
import { ReedBubble } from '../reed/ReedBubble';
import { AskField } from './AskField';
import { SummaryModal } from './SummaryModal';
import { QuizModal } from './QuizModal';
import { ReedModePanel } from '../reed/ReedModePanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { explainParagraph, summarizeChapter, generateQuiz } from '../../services/api';
import { Volume2, HelpCircle, FileText, HelpCircle as QuizIcon, ArrowLeft } from 'lucide-react';

interface ReaderViewProps {
  book: Book;
  allBooks: Book[];
  onSelectBook: (book: Book) => void;
  onBackToLibrary: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  allBooks,
  onSelectBook,
  onBackToLibrary,
}) => {
  const currentChapter = book.chapters[0];
  const { mode, setMode, startSession, recordParagraphRead } = useReed();

  const [selectedParagraph, setSelectedParagraph] = useState<Paragraph | null>(null);
  const [activeReadingIndex, setActiveReadingIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  // Paneles y modales
  const [isReedPanelOpen, setIsReedPanelOpen] = useState<boolean>(false);
  const [isAskOpen, setIsAskOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Contenidos dinámicos de IA
  const [summaryText, setSummaryText] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  // Referencia a síntesis de voz (Web Speech API para lectura real en voz alta sincronizada)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Iniciar registro de sesión al cargar el libro
  useEffect(() => {
    startSession(book.id, book.title, currentChapter.title, 1);
  }, [book.id, currentChapter.title]);

  // Si se cambia a un modo distinto a "reader", pausar la voz de audio
  useEffect(() => {
    if (mode !== 'reader' && isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    }
  }, [mode]);

  // Formato mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Temporizador de audio y sincronización de lectura
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && mode === 'reader') {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000 / playbackRate);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, mode]);

  // Manejo de lectura en voz alta
  const speakCurrentParagraph = (index: number) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    if (index >= currentChapter.paragraphs.length) {
      setIsPlaying(false);
      setActiveReadingIndex(-1);
      return;
    }

    const paragraph = currentChapter.paragraphs[index];
    recordParagraphRead(paragraph.order);

    const utterance = new SpeechSynthesisUtterance(paragraph.text);
    utterance.lang = 'es-ES';
    utterance.rate = playbackRate;

    utterance.onend = () => {
      const nextIndex = index + 1;
      if (nextIndex < currentChapter.paragraphs.length) {
        setActiveReadingIndex(nextIndex);
        speakCurrentParagraph(nextIndex);
      } else {
        setIsPlaying(false);
        setActiveReadingIndex(-1);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const targetIndex = activeReadingIndex >= 0 ? activeReadingIndex : 0;
      setActiveReadingIndex(targetIndex);
      speakCurrentParagraph(targetIndex);
    }
  };

  const handleListenFrom = (paragraph: Paragraph) => {
    const idx = currentChapter.paragraphs.findIndex(p => p.id === paragraph.id);
    if (idx !== -1) {
      setMode('reader'); // Activa modo lector para mostrar la barra
      setActiveReadingIndex(idx);
      setIsPlaying(true);
      speakCurrentParagraph(idx);
    }
  };

  const handleNextParagraph = () => {
    const nextIdx = Math.min(currentChapter.paragraphs.length - 1, activeReadingIndex + 1);
    setActiveReadingIndex(nextIdx);
    if (isPlaying) {
      speakCurrentParagraph(nextIdx);
    }
  };

  const handlePrevParagraph = () => {
    const prevIdx = Math.max(0, activeReadingIndex - 1);
    setActiveReadingIndex(prevIdx);
    if (isPlaying) {
      speakCurrentParagraph(prevIdx);
    }
  };

  // Ciclo de velocidades: 0.75x, 1x, 1.25x, 1.5x, 2x
  const handleCyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentPos = rates.indexOf(playbackRate);
    const nextRate = rates[(currentPos + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (isPlaying) {
      speakCurrentParagraph(activeReadingIndex >= 0 ? activeReadingIndex : 0);
    }
  };

  // Acciones de IA conectadas a modos
  const handleAskAbout = (paragraph: Paragraph) => {
    setSelectedParagraph(paragraph);
    if (mode === 'sleeping') {
      setIsReedPanelOpen(true);
      return;
    }
    setMode('teacher');
    setIsReedPanelOpen(true);
  };

  const handleSendMessage = async (text: string, quote?: string) => {
    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      paragraphQuote: quote,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation(prev => [...prev, userMsg]);
    setIsThinking(true);

    const explanation = await explainParagraph(quote || selectedParagraph?.text || '', text);

    const reedMsg: ConversationMessage = {
      id: `msg-reed-${Date.now()}`,
      sender: 'reed',
      text: explanation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation(prev => [...prev, reedMsg]);
    setIsThinking(false);
  };

  const handleOpenSummary = async () => {
    if (mode === 'sleeping') {
      setIsReedPanelOpen(true);
      return;
    }
    setMode('companion');
    setIsSummaryOpen(true);
    if (!summaryText) {
      const fullText = currentChapter.paragraphs.map(p => p.text).join('\n\n');
      const res = await summarizeChapter(currentChapter.title, fullText);
      setSummaryText(res);
    }
  };

  const handleOpenQuiz = async () => {
    if (mode === 'sleeping') {
      setIsReedPanelOpen(true);
      return;
    }
    setMode('teacher');
    setIsQuizOpen(true);
    if (quizQuestions.length === 0) {
      const fullText = currentChapter.paragraphs.map(p => p.text).join('\n\n');
      const res = await generateQuiz(currentChapter.title, fullText);
      setQuizQuestions(res);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-states pb-32">
      {/* Barra superior de lectura limpia */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition-colors font-sans"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span>Volver a la biblioteca</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink font-sans">
              {book.title} · {currentChapter.title.split('·')[0]}
            </span>
            <Badge variant="ambar">Con voz</Badge>
          </div>
        </div>

        {/* Botones de acción existentes conectados a los modos de Reed */}
        <div className="bg-paper-raised border border-line rounded-lg p-2.5 sm:p-3 mb-8 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="voice"
              size="sm"
              onClick={() => {
                setMode('reader'); // Revela la barra de audio e inicia la lectura
                setIsPlaying(true);
                const targetIndex = activeReadingIndex >= 0 ? activeReadingIndex : 0;
                setActiveReadingIndex(targetIndex);
                speakCurrentParagraph(targetIndex);
              }}
              className="flex items-center gap-1.5"
            >
              <Volume2 size={16} strokeWidth={2} />
              <span>{isPlaying && mode === 'reader' ? 'Pausar voz' : 'Leer en voz alta'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const target = selectedParagraph || currentChapter.paragraphs[0];
                handleAskAbout(target);
              }}
              className="flex items-center gap-1.5"
            >
              <HelpCircle size={16} strokeWidth={2} />
              <span>Explícame esto</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="quiet"
              size="sm"
              onClick={handleOpenSummary}
              className="flex items-center gap-1.5 text-ink-muted hover:text-ink"
            >
              <FileText size={16} strokeWidth={1.75} />
              <span>Resumir capítulo</span>
            </Button>

            <Button
              variant="quiet"
              size="sm"
              onClick={handleOpenQuiz}
              className="flex items-center gap-1.5 text-ink-muted hover:text-ink"
            >
              <QuizIcon size={16} strokeWidth={1.75} />
              <span>Hazme un quiz</span>
            </Button>
          </div>
        </div>

        {/* Bloque contextual "DÓNDE QUEDASTE" */}
        {currentChapter.whereYouLeftOffSummary && (
          <div className="bg-paper-raised border border-line rounded-lg p-4 sm:p-5 mb-10 shadow-sm transition-colors duration-states">
            <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 font-sans">
              DÓNDE QUEDASTE
            </span>
            <p className="font-serif text-[16px] leading-[26px] text-ink">
              {currentChapter.whereYouLeftOffSummary}
            </p>
          </div>
        )}

        {/* Contenido del libro en Literata */}
        <div className="space-y-2 select-text">
          {currentChapter.paragraphs.map((paragraph, index) => (
            <ReadingParagraph
              key={paragraph.id}
              paragraph={paragraph}
              isReading={mode === 'reader' && activeReadingIndex === index}
              isSelected={selectedParagraph?.id === paragraph.id}
              onSelect={(p) => {
                setSelectedParagraph(selectedParagraph?.id === p.id ? null : p);
                recordParagraphRead(p.order);
              }}
              onAskAbout={handleAskAbout}
              onListenFrom={handleListenFrom}
            />
          ))}
        </div>
      </div>

      {/* =========================================================================
          REGLA CENTRAL DE INTERACCIÓN:
          - Si el modo es "Lector": SE MUESTRA la barra de audio con la burbuja integrada.
          - Si el modo es cualquier otro (Dormido, Compañero, Profesor, Bibliotecario):
            NO se muestra la barra de audio. Se mantiene visible únicamente la burbuja de Reed.
         ========================================================================= */}
      {mode === 'reader' ? (
        <ListenBar
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          chapterTitle={currentChapter.title}
          currentTimeFormatted={formatTime(secondsElapsed)}
          playbackRate={playbackRate}
          onChangePlaybackRate={handleCyclePlaybackRate}
          onPrevParagraph={handlePrevParagraph}
          onNextParagraph={handleNextParagraph}
          onOpenReedAction={(modeKey) => {
            if (modeKey !== 'reader') {
              setIsReedPanelOpen(true);
            }
          }}
          onClose={() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.pause();
            }
            setIsPlaying(false);
            setMode('companion'); // Oculta la barra de audio y vuelve al modo compañero
          }}
        />
      ) : (
        /* En todos los demás modos: Burbuja flotante y limpia en la pantalla de lectura */
        <div className="fixed bottom-6 right-6 z-40 animate-fadeIn">
          <ReedBubble
            onOpenModeAction={(modeKey) => {
              if (modeKey === 'reader') {
                setIsPlaying(true);
                const targetIndex = activeReadingIndex >= 0 ? activeReadingIndex : 0;
                setActiveReadingIndex(targetIndex);
                speakCurrentParagraph(targetIndex);
              } else if (modeKey !== 'sleeping') {
                setIsReedPanelOpen(true);
              }
            }}
          />
        </div>
      )}

      {/* Panel flotante de herramientas según el modo activo */}
      {isReedPanelOpen && (
        <ReedModePanel
          book={book}
          allBooks={allBooks}
          currentParagraph={selectedParagraph || currentChapter.paragraphs[activeReadingIndex >= 0 ? activeReadingIndex : 0]}
          onSelectBook={onSelectBook}
          onClose={() => setIsReedPanelOpen(false)}
        />
      )}

      {/* Panel lateral de preguntas "Conversar con Reed" */}
      {isAskOpen && (
        <AskField
          selectedParagraph={selectedParagraph}
          conversation={conversation}
          onSendMessage={handleSendMessage}
          onClose={() => setIsAskOpen(false)}
          isThinking={isThinking}
        />
      )}

      {/* Modal de resumen de 1 minuto */}
      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        chapterTitle={currentChapter.title}
        summaryText={summaryText}
      />

      {/* Modal de Quiz interactivo */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        questions={quizQuestions}
        chapterTitle={currentChapter.title}
      />
    </div>
  );
};
