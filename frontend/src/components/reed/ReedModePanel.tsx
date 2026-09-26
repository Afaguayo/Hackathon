import React, { useState } from 'react';
import { Book, Paragraph, QuizQuestion } from '../../types';
import { useReed } from '../../context/ReedContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  X,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Shuffle,
  Clock,
  CheckCircle,
  Lightbulb,
  Search,
  Check
} from 'lucide-react';

interface ReedModePanelProps {
  book: Book;
  allBooks: Book[];
  currentParagraph: Paragraph | null;
  onSelectBook: (book: Book) => void;
  onClose: () => void;
}

export const ReedModePanel: React.FC<ReedModePanelProps> = ({
  book,
  allBooks,
  currentParagraph,
  onSelectBook,
  onClose,
}) => {
  const { mode, sessionStats, habits, setMode } = useReed();

  // Sub-pestañas para cada modo
  const [companionTab, setCompanionTab] = useState<'summary' | 'curiosity'>('curiosity');
  const [summaryScope, setSummaryScope] = useState<'paragraph' | 'chapter' | 'session'>('session');
  
  // Estado para el modo profesor (Socrático)
  const [socraticStep, setSocraticStep] = useState<number>(1);
  const [socraticQuery, setSocraticQuery] = useState('');
  const [showSessionTest, setShowSessionTest] = useState(false);

  // Estado para el modo bibliotecario
  const [libraryQuery, setLibraryQuery] = useState('');
  const [randomPick, setRandomPick] = useState<Book | null>(null);

  // Formato mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  if (mode === 'sleeping') {
    return (
      <div className="fixed bottom-24 right-4 sm:right-8 z-40 max-w-sm w-full bg-paper-raised border border-line-strong rounded-lg p-5 shadow-2xl animate-slideUp font-sans">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              REED ESTÁ DORMIDO
            </span>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-ink-muted mb-4 font-serif leading-relaxed">
          «Zzz... Disfruta tu lectura a solas. No te interrumpiré con avisos ni resúmenes mientras descanse.»
        </p>
        <Button variant="primary" size="sm" onClick={() => setMode('companion')} className="w-full">
          Despertar a Reed
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-40 max-w-md w-[calc(100%-2rem)] sm:w-[440px] bg-paper-raised border border-line-strong rounded-lg shadow-2xl overflow-hidden animate-slideUp font-sans max-h-[80vh] flex flex-col">
      {/* Cabecera del panel contextual según modo */}
      <div className="p-3.5 sm:p-4 bg-paper border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-reed rounded-full" />
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            {mode === 'companion' && 'Modo Compañero · Leyendo contigo'}
            {mode === 'teacher' && 'Modo Profesor · Comprensión y guía'}
            {mode === 'librarian' && 'Modo Bibliotecario · Tu biblioteca'}
            {mode === 'reader' && 'Modo Lector · Audio y ritmo'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors"
          aria-label="Cerrar panel"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* =========================================
            MODO 1: COMPAÑERO
        ========================================= */}
        {mode === 'companion' && (
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-line pb-2">
              <button
                onClick={() => setCompanionTab('curiosity')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                  companionTab === 'curiosity'
                    ? 'bg-reed-soft text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Datos curiosos
              </button>
              <button
                onClick={() => setCompanionTab('summary')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                  companionTab === 'summary'
                    ? 'bg-reed-soft text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Resúmenes breves
              </button>
            </div>

            {companionTab === 'curiosity' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-md bg-paper border border-line">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Lightbulb size={16} strokeWidth={2} />
                    <span>¿Sabías esto sobre esta parte?</span>
                  </div>
                  <p className="font-serif text-sm text-ink leading-relaxed">
                    {book.curiosities?.[0] ||
                      'El junco se ha utilizado desde hace miles de años como cálamo para escribir los primeros pergaminos antes de la invención de la imprenta.'}
                  </p>
                </div>

                {book.curiosities && book.curiosities.length > 1 && (
                  <div className="p-3.5 rounded-md bg-paper border border-line">
                    <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1">
                      Contexto del autor ({book.author})
                    </span>
                    <p className="font-serif text-sm text-ink leading-relaxed">
                      {book.curiosities[1]}
                    </p>
                  </div>
                )}

                <div className="p-3 bg-paper-sunk rounded-md text-xs text-ink-muted">
                  Reed: «Leo a tu lado. Si quieres saber más sobre algún pasaje, selecciónalo y pregúntame.»
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Selector de alcance de resumen */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-paper-sunk rounded-md text-xs font-medium text-center">
                  <button
                    onClick={() => setSummaryScope('paragraph')}
                    className={`py-1 rounded ${
                      summaryScope === 'paragraph' ? 'bg-paper-raised text-ink font-bold shadow-sm' : 'text-ink-muted'
                    }`}
                  >
                    Párrafo
                  </button>
                  <button
                    onClick={() => setSummaryScope('chapter')}
                    className={`py-1 rounded ${
                      summaryScope === 'chapter' ? 'bg-paper-raised text-ink font-bold shadow-sm' : 'text-ink-muted'
                    }`}
                  >
                    Capítulo
                  </button>
                  <button
                    onClick={() => setSummaryScope('session')}
                    className={`py-1 rounded ${
                      summaryScope === 'session' ? 'bg-paper-raised text-ink font-bold shadow-sm' : 'text-ink-muted'
                    }`}
                  >
                    Esta sesión
                  </button>
                </div>

                <div className="p-4 rounded-md bg-paper border border-line">
                  <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                    {summaryScope === 'paragraph' && 'Resumen del párrafo seleccionado'}
                    {summaryScope === 'chapter' && `Resumen de ${book.chapters[0]?.title || 'el capítulo'}`}
                    {summaryScope === 'session' && `Lo que llevas leído en esta sesión (${formatTime(sessionStats.secondsReading)})`}
                  </span>
                  <p className="font-serif text-sm leading-relaxed text-ink">
                    {summaryScope === 'paragraph'
                      ? currentParagraph
                        ? `Se describe: "${currentParagraph.text.slice(0, 140)}..." En resumen, plasma cómo los personajes perciben lo novedoso con asombro.`
                        : 'Toca cualquier párrafo en el libro para ver su síntesis aquí.'
                      : summaryScope === 'chapter'
                      ? (book.chapters[0]?.whereYouLeftOffSummary || 'Melquíades llega a Macondo trayendo los imanes, desatando la obsesión de José Arcadio por la alquimia y el oro.')
                      : `En esta sesión leíste desde el párrafo ${sessionStats.startParagraphOrder} hasta el ${sessionStats.endParagraphOrder} durante ${formatTime(sessionStats.secondsReading)}. Se ha explorado la fundación de Macondo y la fascinación por los inventos de los gitanos.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            MODO 2: PROFESOR (Socrático y Guía)
        ========================================= */}
        {mode === 'teacher' && (
          <div className="space-y-4">
            {!showSessionTest ? (
              <>
                {/* 4.3 Guía de lectura personalizada */}
                <div className="p-3.5 rounded-md bg-paper border border-line flex items-center gap-3">
                  <Clock size={20} className="text-reed flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Ritmo sugerido de hoy
                    </span>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {habits.recommendationNote}
                    </p>
                  </div>
                </div>

                {/* 4.1 Ayudar a comprender con método Socrático */}
                <div className="p-4 rounded-md bg-paper-raised border border-line space-y-3">
                  <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    COMPRENSIÓN SOCRÁTICA
                  </span>
                  <p className="text-xs text-ink-muted">
                    Reed no te dará la respuesta directa de inmediato; te ayudará a pensar por ti mismo.
                  </p>

                  {currentParagraph && (
                    <div className="p-2.5 bg-paper rounded border border-line text-xs italic font-serif text-ink line-clamp-2">
                      «{currentParagraph.text}»
                    </div>
                  )}

                  {/* Pasos socráticos */}
                  <div className="p-3 rounded-md bg-reed-soft/40 border border-line text-sm text-ink space-y-2">
                    {socraticStep === 1 && (
                      <div>
                        <span className="font-bold text-xs text-reed block mb-1">
                          💡 Pista 1 de razonamiento:
                        </span>
                        <p className="font-serif">
                          «Fíjate en las palabras que usa el autor para describir los objetos: "como huevos prehistóricos", "manos de gorrión". ¿Qué emoción intenta transmitir respecto al entorno?»
                        </p>
                      </div>
                    )}
                    {socraticStep === 2 && (
                      <div>
                        <span className="font-bold text-xs text-reed block mb-1">
                          🤔 Pregunta para pensar:
                        </span>
                        <p className="font-serif">
                          «Si Macondo era tan nuevo que las cosas no tenían nombre, ¿por qué los imanes causaron tanta revolución entre las casas de madera?»
                        </p>
                      </div>
                    )}
                    {socraticStep === 3 && (
                      <div>
                        <span className="font-bold text-xs text-reed block mb-1">
                          📖 Explicación directa:
                        </span>
                        <p className="font-serif">
                          «Los imanes representan el primer choque entre el aislamiento primitivo de la aldea y la ciencia del mundo exterior. José Arcadio no ve un simple truco, sino una oportunidad para transformar su realidad.»
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {socraticStep < 3 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSocraticStep(prev => prev + 1)}
                        className="text-xs flex-1"
                      >
                        {socraticStep === 1 ? '¿Quieres otra pista?' : 'Explícamelo directamente'}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSocraticStep(1)}
                        className="text-xs flex-1"
                      >
                        Reiniciar pregunta socrática
                      </Button>
                    )}
                  </div>
                </div>

                {/* 4.2 Test después de la sesión */}
                <div className="pt-2 border-t border-line">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSessionTest(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    <span>Realizar test de esta sesión ({formatTime(sessionStats.secondsReading)})</span>
                  </Button>
                </div>
              </>
            ) : (
              /* Componente de Test de sesión */
              <SessionTestFlow
                sessionStats={sessionStats}
                book={book}
                onDone={() => setShowSessionTest(false)}
              />
            )}
          </div>
        )}

        {/* =========================================
            MODO 3: BIBLIOTECARIO
        ========================================= */}
        {mode === 'librarian' && (
          <div className="space-y-4">
            {/* 5.3 Recomendación aleatoria */}
            <div className="p-3.5 rounded-md bg-paper border border-line flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink block">
                  ¿No sabes qué leer?
                </span>
                <span className="text-xs text-ink-muted">
                  Reed elegirá algo afín a tu gusto.
                </span>
              </div>
              <Button
                variant="voice"
                size="sm"
                onClick={() => {
                  const otherBooks = allBooks.filter(b => b.id !== book.id);
                  const pick = otherBooks[Math.floor(Math.random() * otherBooks.length)] || book;
                  setRandomPick(pick);
                }}
                className="flex items-center gap-1.5"
              >
                <Shuffle size={14} />
                <span>🎲 Recomiéndame algo</span>
              </Button>
            </div>

            {/* Resultado de recomendación aleatoria */}
            {randomPick && (
              <div className="p-3.5 rounded-md bg-reed-soft/50 border border-reed space-y-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-reed uppercase tracking-wider block">
                  Recomendado para hoy
                </span>
                <h5 className="font-serif font-bold text-base text-ink">
                  {randomPick.title}
                </h5>
                <p className="text-xs text-ink-muted">
                  {randomPick.author} · {randomPick.genre} ({randomPick.publishedYear})
                </p>
                <p className="text-xs text-ink font-serif italic">
                  «{randomPick.recommendationReason || 'Un libro cautivador para tu biblioteca.'}»
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onSelectBook(randomPick);
                    onClose();
                  }}
                  className="w-full text-xs mt-2"
                >
                  Abrir este libro
                </Button>
              </div>
            )}

            {/* 5.4 Consultar mi biblioteca sin IA arbitraria */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                CONSULTAS RÁPIDAS EN TU BIBLIOTECA
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Gabriel García Márquez',
                  'Fábulas y clásicos',
                  'Antes del año 2000',
                  'Pendientes',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setLibraryQuery(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-pill bg-paper border border-line hover:border-line-strong text-ink transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-ink-muted" />
                <input
                  type="text"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Ej. libros de García Márquez, antes de 2000..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-md bg-paper border border-line-strong text-ink placeholder:text-ink-muted focus:border-focus"
                />
              </div>

              {/* Resultados filtrados */}
              <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                {allBooks
                  .filter((b) => {
                    if (!libraryQuery) return true;
                    const q = libraryQuery.toLowerCase();
                    if (q.includes('antes') && q.includes('2000')) {
                      return (b.publishedYear || 2026) < 2000;
                    }
                    if (q.includes('pendiente')) {
                      return b.progressPercent < 100;
                    }
                    return (
                      b.title.toLowerCase().includes(q) ||
                      b.author.toLowerCase().includes(q) ||
                      (b.genre && b.genre.toLowerCase().includes(q))
                    );
                  })
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        onSelectBook(b);
                        onClose();
                      }}
                      className="p-2.5 rounded-md bg-paper border border-line hover:border-reed cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-serif font-semibold text-xs text-ink truncate">
                          {b.title}
                        </p>
                        <p className="text-[11px] text-ink-muted truncate">
                          {b.author} · {b.genre} ({b.publishedYear})
                        </p>
                      </div>
                      <Badge variant={b.progressPercent === 100 ? 'reed' : 'neutral'}>
                        {b.progressPercent}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* 5.1 & 5.2 Libros similares */}
            <div className="pt-2 border-t border-line space-y-2">
              <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                SIMILARES A ESTE LIBRO
              </span>
              {allBooks
                .filter(b => b.id !== book.id)
                .slice(0, 2)
                .map(similar => (
                  <div key={similar.id} className="p-2.5 rounded-md bg-paper border border-line">
                    <p className="font-serif font-bold text-xs text-ink">{similar.title}</p>
                    <p className="text-[11px] text-ink-muted mb-1">{similar.author}</p>
                    <p className="text-[11px] text-ink font-serif italic">
                      «{similar.recommendationReason || 'Comparte temas y estilo de lectura afines.'}»
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================
            MODO 4: LECTOR
        ========================================= */}
        {mode === 'reader' && (
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-paper border border-line space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ambar-ink">
                <span className="w-2 h-2 rounded-full bg-ambar animate-ping" />
                <span>EXPERIENCIA DE AUDIO ENRIQUECIDA</span>
              </div>
              <p className="font-serif text-sm text-ink leading-relaxed">
                «He sincronizado el texto con la voz de audio. Puedes controlar la velocidad y avanzar o retroceder párrafo a párrafo directamente desde la barra inferior.»
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted pt-2 border-t border-line font-sans">
                <div>
                  <span className="font-bold text-ink block">Capítulo activo:</span>
                  <span>{book.chapters[0]?.title}</span>
                </div>
                <div>
                  <span className="font-bold text-ink block">Párrafo actual:</span>
                  <span>{currentParagraph?.order || 1} de {book.chapters[0]?.paragraphs.length || 6}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-componente para el Test de sesión (Requisito 4.2)
const SessionTestFlow: React.FC<{
  sessionStats: any;
  book: Book;
  onDone: () => void;
}> = ({ sessionStats, book, onDone }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [answered, setAnswered] = useState(false);

  // Preguntas generadas basadas estrictamente en la sesión
  const sessionQuestions: QuizQuestion[] = [
    {
      id: 'sq-1',
      question: `¿Qué instrumento presentaron los gitanos al inicio de la sesión en "${book.title}"?`,
      options: ['Un telescopio', 'Dos lingotes metálicos (imán)', 'Una lente gigante', 'Una brújula'],
      correctIndex: 1,
      explanation: 'Melquíades presentó el imán que hacía crujir las maderas y arrastraba calderos.',
      type: 'multiple'
    },
    {
      id: 'sq-2',
      question: 'Verdadero o Falso: En la aldea las casas estaban hechas de barro y cañabrava.',
      options: ['Verdadero', 'Falso'],
      correctIndex: 0,
      explanation: 'El texto menciona explícitamente veinte casas de barro y cañabrava a la orilla del río.',
      type: 'boolean'
    },
    {
      id: 'sq-3',
      question: '¿Por qué para mencionar muchas cosas había que señalarlas con el dedo?',
      options: ['Porque estaba prohibido hablar', 'Porque el mundo era tan reciente que carecían de nombre', 'Porque los ruidos del río no dejaban escuchar', 'Por una costumbre gitana'],
      correctIndex: 1,
      explanation: 'El texto enfatiza que "el mundo era tan reciente, que muchas cosas carecían de nombre".',
      type: 'comprehension'
    }
  ];

  const q = sessionQuestions[currentQIndex];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);
    if (idx === q.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex + 1 < sessionQuestions.length) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOpt(null);
      setAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="p-4 text-center space-y-3 animate-fadeIn">
        <h5 className="font-serif font-bold text-lg text-ink">
          Comprensión de tu sesión
        </h5>
        <p className="text-xs text-ink-muted">
          Respondiste correctamente {score} de {sessionQuestions.length} preguntas sobre los párrafos leídos.
        </p>
        <div className="p-3 bg-reed-soft/60 rounded-md text-xs text-ink font-serif">
          «Comprendiste muy bien los puntos clave de lo que leíste hoy. No hay notas ni reprobados en Reed: solo acompañamiento.»
        </div>
        <Button variant="primary" size="sm" onClick={onDone} className="w-full">
          Volver a la lectura
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>Pregunta {currentQIndex + 1} de {sessionQuestions.length}</span>
        <span>Basado en tu lectura de hoy</span>
      </div>

      <p className="font-serif text-sm font-semibold text-ink">
        {q.question}
      </p>

      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let style = 'bg-paper border-line text-ink hover:border-line-strong';
          if (answered) {
            if (idx === q.correctIndex) style = 'bg-reed-soft border-reed text-ink font-bold';
            else if (idx === selectedOpt) style = 'bg-paper-sunk opacity-50';
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`w-full text-left p-2.5 rounded-md border text-xs transition-all flex items-center justify-between ${style}`}
            >
              <span>{opt}</span>
              {answered && idx === q.correctIndex && <Check size={14} className="text-reed" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="p-2.5 bg-paper-sunk rounded text-xs text-ink-muted font-serif">
          {q.explanation}
        </div>
      )}

      {answered && (
        <Button variant="primary" size="sm" onClick={handleNext} className="w-full text-xs">
          {currentQIndex + 1 === sessionQuestions.length ? 'Finalizar comprobación' : 'Siguiente'}
        </Button>
      )}
    </div>
  );
};
