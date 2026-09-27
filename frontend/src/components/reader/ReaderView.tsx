import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Book, Paragraph, ReadingPrefs, ReadingStatus } from '../../types';
import { useReed } from '../../context/ReedContext';
import { useAccount } from '../../context/AccountContext';
import { ReadingParagraph } from './ReadingParagraph';
import { ListenBar } from './ListenBar';
import { ReedBubble } from '../reed/ReedBubble';
import { ReedModePanel } from '../reed/ReedModePanel';
import { chapterStarts, pageIndexForPosition, paginateBook, progressForPage } from '../../lib/reading';
import { ChevronLeft, ChevronRight, List, Minus, Plus } from 'lucide-react';
import { isBackendSession, synthesizeSpeech } from '../../services/api';

interface ReaderViewProps {
  book: Book;
  allBooks: Book[];
  initialChapter: number;
  initialPage: number;
  autoListen?: boolean;
  onProgress: (position: { currentChapter: number; currentPage: number; progress: number; status: ReadingStatus }) => void;
  onSelectBook: (book: Book) => void;
  onBackToLibrary: () => void;
}

const THEMES: Record<ReadingPrefs['theme'], { bg: string; fg: string; muted: string; page: string }> = {
  light: { bg: '#f7f3ea', fg: '#1f2a22', muted: '#586257', page: '#fffdf8' },
  sepia: { bg: '#f3e6c8', fg: '#3d2b1f', muted: '#6d5844', page: '#f8efdc' },
  dark: { bg: '#161b17', fg: '#ece6d8', muted: '#a9ad9f', page: '#1f2621' },
};

const FONT_SIZE = { sm: 17, md: 20, lg: 24 };
const LINE_HEIGHT = { compact: 1.5, normal: 1.75, wide: 2.05 };

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  allBooks,
  initialChapter,
  initialPage,
  autoListen = false,
  onProgress,
  onSelectBook,
  onBackToLibrary,
}) => {
  const pages = useMemo(() => paginateBook(book), [book]);
  const chapters = useMemo(() => chapterStarts(pages), [pages]);
  const [pageIndex, setPageIndex] = useState(() => pageIndexForPosition(pages, initialChapter, initialPage));
  const page = pages[pageIndex];

  // Infinite scroll: pages [renderRange.from, renderRange.to] are stacked; the one in view is pageIndex.
  const [renderRange, setRenderRange] = useState(() => {
    const start = pageIndexForPosition(pages, initialChapter, initialPage);
    return { from: start, to: Math.min(pages.length - 1, start + 2) };
  });
  const pageRefs = useRef(new Map<number, HTMLElement>());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRef = useRef<number | null>(null);
  // Page being read aloud (independent of scrolling while listening).
  const speakingPageRef = useRef(pageIndex);
  const [speakingPage, setSpeakingPage] = useState(pageIndex);

  const { mode, setMode, startSession, recordParagraphRead } = useReed();
  const { prefs, setPrefs, recordReaderUse, recordQuiz, recordNightSession, addReadingSeconds } = useAccount();

  const [selectedParagraph, setSelectedParagraph] = useState<Paragraph | null>(null);
  const [activeReadingIndex, setActiveReadingIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isReedPanelOpen, setIsReedPanelOpen] = useState(false);
  const [reedMenuOpen, setReedMenuOpen] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pageIndexRef = useRef(pageIndex);
  const pagesRef = useRef(pages);
  const playingRef = useRef(isPlaying);
  const rateRef = useRef(playbackRate);
  const skipSpeechReset = useRef(false);
  const onProgressRef = useRef(onProgress);
  const addSecondsRef = useRef(addReadingSeconds);
  pageIndexRef.current = pageIndex;
  pagesRef.current = pages;
  playingRef.current = isPlaying;
  rateRef.current = playbackRate;

  const ensureRendered = (index: number) =>
    setRenderRange((range) => ({
      from: Math.min(range.from, index),
      to: Math.max(range.to, Math.min(pagesRef.current.length - 1, index + 2)),
    }));

  const scrollToPage = (index: number) => {
    pendingScrollRef.current = index;
    ensureRendered(index);
  };

  const setSpeaking = (index: number) => {
    speakingPageRef.current = index;
    setSpeakingPage(index);
  };

  // Voz de ElevenLabs (con sesión): un audio por párrafo, con el siguiente precargado. Si se acaba el
  // límite diario o falla la reproducción, se usa la voz del navegador.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const useBrowserVoiceRef = useRef(false);
  const speechRunRef = useRef(0); // cada lectura nueva invalida la anterior

  const stopSpeech = () => {
    speechRunRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
  };

  const getParagraphAudio = (paragraph: Paragraph) => {
    let url = audioCacheRef.current.get(paragraph.id);
    if (!url) {
      url = synthesizeSpeech(paragraph.text);
      url.catch(() => audioCacheRef.current.delete(paragraph.id));
      audioCacheRef.current.set(paragraph.id, url);
    }
    return url;
  };

  useEffect(() => {
    const cache = audioCacheRef.current;
    return () => {
      stopSpeech();
      cache.forEach((p) => p.then(URL.revokeObjectURL).catch(() => {}));
      cache.clear();
    };
  }, []);
  onProgressRef.current = onProgress;
  addSecondsRef.current = addReadingSeconds;

  useEffect(() => {
    const nextPages = paginateBook(book);
    const start = pageIndexForPosition(nextPages, initialChapter, initialPage);
    setPageIndex(start);
    setRenderRange({ from: start, to: Math.min(nextPages.length - 1, start + 2) });
    setSpeaking(start);
    pageRefs.current.clear();
    setSelectedParagraph(null);
    setActiveReadingIndex(-1);
    setIsPlaying(false);
    stopSpeech();
  }, [book.id]);

  useEffect(() => {
    if (!page) return;
    startSession(book.id, book.title, page.chapterTitle, page.paragraphs[0]?.order ?? 1);
    onProgressRef.current({
      currentChapter: page.chapterNumber,
      currentPage: pageIndex + 1,
      progress: progressForPage(pageIndex, pages.length),
      status: pageIndex >= pages.length - 1 ? 'finished' : 'reading',
    });
  }, [book.id, pageIndex, page?.chapterTitle, pages.length]);

  useEffect(() => {
    recordNightSession();
  }, [book.id]);

  useEffect(() => {
    if (mode === 'reader') recordReaderUse();
  }, [mode, book.id]);

  useEffect(() => {
    const timer = window.setInterval(() => addSecondsRef.current(15), 15000);
    return () => window.clearInterval(timer);
  }, [book.id]);

  useEffect(() => {
    if (mode !== 'reader' && isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    }
  }, [mode]);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying && mode === 'reader') {
      interval = window.setInterval(() => setSecondsElapsed((value) => value + 1), 1000 / playbackRate);
    }
    return () => window.clearInterval(interval);
  }, [isPlaying, playbackRate, mode]);

  useEffect(() => {
    if (!skipSpeechReset.current) return;
    skipSpeechReset.current = false;
    speakParagraph(0);
  }, [pageIndex]);

  useEffect(() => {
    let timer = window.setTimeout(() => setShowChrome(false), 2800);
    const reveal = () => {
      setShowChrome(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShowChrome(false), 2800);
    };
    window.addEventListener('mousemove', reveal);
    window.addEventListener('touchstart', reveal);
    return () => {
      window.removeEventListener('mousemove', reveal);
      window.removeEventListener('touchstart', reveal);
      window.clearTimeout(timer);
    };
  }, []);

  // The page crossing the upper part of the screen is the current page (header, progress).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.page));
        if (visible.length) setPageIndex(Math.min(...visible));
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    pageRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [renderRange.from, renderRange.to, book.id]);

  // Load more pages before the reader reaches the end of what is rendered.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRenderRange((range) => ({ ...range, to: Math.min(pagesRef.current.length - 1, range.to + 3) }));
        }
      },
      { rootMargin: '1200px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [renderRange.to, book.id]);

  // Jumps (table of contents, keyboard, voice moving on) scroll once the page is rendered.
  useEffect(() => {
    const target = pendingScrollRef.current;
    if (target === null) return;
    const element = pageRefs.current.get(target);
    if (element) {
      pendingScrollRef.current = null;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  const goToPage = (index: number) => {
    stopSpeech();
    setIsPlaying(false);
    setActiveReadingIndex(-1);
    const next = Math.min(pages.length - 1, Math.max(0, index));
    setPageIndex(next);
    setSpeaking(next);
    setSelectedParagraph(null);
    scrollToPage(next);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToPage(pageIndexRef.current + 1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPage(pageIndexRef.current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages.length]);

  const speakParagraph = async (index: number) => {
    const current = pagesRef.current[speakingPageRef.current];
    if (!current) return;
    stopSpeech();
    const run = speechRunRef.current;
    if (index >= current.paragraphs.length) {
      const nextPage = speakingPageRef.current + 1;
      if (nextPage < pagesRef.current.length) {
        setSpeaking(nextPage);
        scrollToPage(nextPage);
        speakParagraph(0);
        return;
      }
      setIsPlaying(false);
      setActiveReadingIndex(-1);
      return;
    }

    const paragraph = current.paragraphs[index];
    recordParagraphRead(paragraph.order);
    setActiveReadingIndex(index);
    const next = () => {
      if (run === speechRunRef.current) speakParagraph(index + 1);
    };

    // 1) Voz de ElevenLabs
    if (isBackendSession() && !useBrowserVoiceRef.current) {
      try {
        const url = await getParagraphAudio(paragraph);
        if (run !== speechRunRef.current) return;
        const audio = new Audio(url);
        audio.playbackRate = rateRef.current;
        audio.onended = next;
        audioRef.current = audio;
        await audio.play();
        const following = current.paragraphs[index + 1];
        if (following) getParagraphAudio(following).catch(() => {});
        return;
      } catch {
        if (run !== speechRunRef.current) return;
        useBrowserVoiceRef.current = true;
      }
    }

    // 2) Voz del navegador
    if (!('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(paragraph.text);
    utterance.lang = 'es-ES';
    utterance.rate = rateRef.current;
    utterance.onend = next;
    utterance.onerror = () => {
      if (run === speechRunRef.current) setIsPlaying(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }
    setMode('reader');
    setIsPlaying(true);
    if (activeReadingIndex < 0) setSpeaking(pageIndexRef.current);
    const target = activeReadingIndex >= 0 ? activeReadingIndex : 0;
    setActiveReadingIndex(target);
    speakParagraph(target);
  };

  useEffect(() => {
    if (!autoListen) return;
    setMode('reader');
    setIsPlaying(true);
    setSpeaking(pageIndexRef.current);
    setActiveReadingIndex(0);
    speakParagraph(0);
  }, [book.id, autoListen]);

  const handleListenFrom = (paragraph: Paragraph) => {
    const pageOf = pages.findIndex((item) => item.paragraphs.some((p) => p.id === paragraph.id));
    if (pageOf < 0) return;
    const index = pages[pageOf].paragraphs.findIndex((item) => item.id === paragraph.id);
    setSpeaking(pageOf);
    setMode('reader');
    setIsPlaying(true);
    setActiveReadingIndex(index);
    speakParagraph(index);
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!page) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="font-serif text-xl">Este libro no tiene texto para mostrar.</p>
        <button type="button" onClick={onBackToLibrary} className="mt-4 text-sm text-ink-muted">Volver a la biblioteca</button>
      </div>
    );
  }

  const theme = THEMES[prefs.theme];
  const textStyle: React.CSSProperties = {
    fontFamily: prefs.font === 'serif' ? 'Literata, Georgia, serif' : '"Atkinson Hyperlegible", system-ui, sans-serif',
    fontSize: FONT_SIZE[prefs.fontScale],
    lineHeight: LINE_HEIGHT[prefs.leading],
    color: theme.fg,
  };
  const nextPage = pages[pageIndex + 1];
  const chapterCompleted = !nextPage || nextPage.chapterNumber !== page.chapterNumber;
  const chapterNumbers = chapters.map((item) => item.chapterNumber);
  const chapterPosition = chapterNumbers.indexOf(page.chapterNumber);
  const showReedMenu = (open: boolean) => {
    setReedMenuOpen(open);
    if (open) setIsReedPanelOpen(false);
  };

  const showReedPanel = (open: boolean) => {
    setIsReedPanelOpen(open);
    if (open) setReedMenuOpen(false);
  };
  const chrome = showChrome || tocOpen || settingsOpen || isReedPanelOpen || reedMenuOpen;

  const goChapter = (direction: number) => {
    const target = chapterNumbers[chapterPosition + direction];
    const start = chapters.find((item) => item.chapterNumber === target);
    if (start) goToPage(start.index);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] transition-colors" style={{ background: theme.bg, color: theme.fg }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-6 pb-28 reading-column">
        <div className={`flex items-center justify-between gap-3 mb-8 text-sm transition-opacity ${chrome ? 'opacity-100' : 'opacity-0'}`}>
          <button type="button" onClick={onBackToLibrary} className="hover:opacity-70" style={{ color: theme.muted }}>
            Biblioteca
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setTocOpen((open) => !open); setSettingsOpen(false); }}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:opacity-70"
              style={{ color: theme.muted }}
            >
              <List size={16} />
              Contenido
            </button>
            <button
              type="button"
              onClick={() => { setSettingsOpen((open) => !open); setTocOpen(false); }}
              className="px-2 py-1 font-serif text-lg leading-none hover:opacity-70"
              aria-label="Apariencia de la lectura"
            >
              Aa
            </button>
          </div>
        </div>

        {settingsOpen && (
          <ReadingSettings prefs={prefs} onChange={setPrefs} muted={theme.muted} />
        )}

        <header className="text-center mb-10">
          <p className="text-xs tracking-[0.18em] uppercase mb-3" style={{ color: theme.muted }}>{book.author}</p>
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">{book.title}</h1>
          <p className="font-serif text-lg" style={{ color: theme.muted }}>{page.chapterTitle}</p>
          <p className="text-xs mt-3" style={{ color: theme.muted }}>
            Capítulo {chapterPosition + 1} de {chapters.length}
            <span className="mx-2">·</span>
            Página {pageIndex + 1} de {pages.length}
          </p>
        </header>

        <article className="mx-auto max-w-[40rem]">
          {renderRange.from > 0 && (
            <div className="text-center mb-10">
              <button
                type="button"
                onClick={() => ensureRendered(Math.max(0, renderRange.from - 3))}
                className="text-sm hover:opacity-70"
                style={{ color: theme.muted }}
              >
                ↑ Ver páginas anteriores
              </button>
            </div>
          )}
          {pages.slice(renderRange.from, renderRange.to + 1).map((pg, offset) => {
            const pIndex = renderRange.from + offset;
            const previous = pages[pIndex - 1];
            const newChapter = pIndex > renderRange.from && previous && previous.chapterNumber !== pg.chapterNumber;
            return (
              <section
                key={pIndex}
                data-page={pIndex}
                ref={(element) => {
                  if (element) pageRefs.current.set(pIndex, element);
                  else pageRefs.current.delete(pIndex);
                }}
              >
                {newChapter && <h2 className="font-serif text-2xl text-center mt-6 mb-10">{pg.chapterTitle}</h2>}
                {pg.paragraphs.map((paragraph, index) => (
                  <ReadingParagraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    textStyle={textStyle}
                    isReading={mode === 'reader' && speakingPage === pIndex && activeReadingIndex === index}
                    isSelected={selectedParagraph?.id === paragraph.id}
                    onSelect={(item) => {
                      setSelectedParagraph(selectedParagraph?.id === item.id ? null : item);
                      recordParagraphRead(item.order);
                    }}
                    onAskAbout={(item) => {
                      setSelectedParagraph(item);
                      if (mode === 'sleeping') {
                        showReedPanel(true);
                        return;
                      }
                      setMode('teacher');
                      showReedPanel(true);
                    }}
                    onListenFrom={handleListenFrom}
                  />
                ))}
                <p className="text-center font-serif text-sm mt-10 mb-10 tracking-widest" style={{ color: theme.muted }}>
                  — {pIndex + 1} —
                </p>
              </section>
            );
          })}
          {renderRange.to < pages.length - 1 ? (
            <div ref={sentinelRef} className="h-10" aria-hidden="true" />
          ) : (
            <p className="text-center font-serif mt-6 pb-10" style={{ color: theme.muted }}>Fin del libro</p>
          )}
        </article>
      </div>

      {tocOpen && (
        <div className="fixed inset-0 z-40 bg-ink/30" onClick={() => setTocOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-paper-raised text-ink border-r border-line p-6 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl">Contenido</h2>
              <div className="flex gap-2 text-xs">
                <button type="button" className="text-ink-muted hover:text-ink" onClick={() => goChapter(-1)} disabled={chapterPosition <= 0}>Capítulo anterior</button>
                <button type="button" className="text-ink-muted hover:text-ink" onClick={() => goChapter(1)} disabled={chapterPosition >= chapterNumbers.length - 1}>Capítulo siguiente</button>
              </div>
            </div>
            <ul className="space-y-1">
              {chapters.map((chapter) => (
                <li key={chapter.chapterNumber}>
                  <button
                    type="button"
                    onClick={() => { goToPage(chapter.index); setTocOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm ${chapter.chapterNumber === page.chapterNumber ? 'bg-reed-soft text-ink font-semibold' : 'hover:bg-paper-sunk text-ink'}`}
                  >
                    {chapter.chapterTitle}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      {mode === 'reader' ? (
        <ListenBar
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          chapterTitle={page.chapterTitle}
          currentTimeFormatted={formatTime(secondsElapsed)}
          playbackRate={playbackRate}
          onChangePlaybackRate={() => {
            const rates = [0.75, 1, 1.25, 1.5, 2];
            const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
            setPlaybackRate(next);
            rateRef.current = next;
            if (audioRef.current) audioRef.current.playbackRate = next;
            else if (isPlaying) speakParagraph(activeReadingIndex >= 0 ? activeReadingIndex : 0);
          }}
          onPrevParagraph={() => {
            const index = Math.max(0, activeReadingIndex - 1);
            setActiveReadingIndex(index);
            if (isPlaying) speakParagraph(index);
          }}
          onNextParagraph={() => {
            const index = Math.min((pages[speakingPageRef.current]?.paragraphs.length || 1) - 1, activeReadingIndex + 1);
            setActiveReadingIndex(index);
            if (isPlaying) speakParagraph(index);
          }}
          menuOpen={reedMenuOpen}
          onMenuOpenChange={showReedMenu}
          onOpenReedAction={() => showReedPanel(true)}
          onClose={() => {
            stopSpeech();
            setIsPlaying(false);
            setMode('companion');
          }}
        />
      ) : (
        <div className="fixed bottom-6 right-6 z-40">
          <ReedBubble
            menuOpen={reedMenuOpen}
            onMenuOpenChange={showReedMenu}
            onOpenModeAction={(modeKey) => {
              if (modeKey === 'reader') {
                setIsPlaying(true);
                if (activeReadingIndex < 0) setSpeaking(pageIndexRef.current);
                const target = activeReadingIndex >= 0 ? activeReadingIndex : 0;
                setActiveReadingIndex(target);
                speakParagraph(target);
              } else if (modeKey !== 'sleeping') {
                showReedPanel(true);
              }
            }}
          />
        </div>
      )}

      {isReedPanelOpen && (
        <ReedModePanel
          book={book}
          allBooks={allBooks}
          currentParagraph={selectedParagraph || page.paragraphs[activeReadingIndex >= 0 ? activeReadingIndex : 0]}
          chapterTitle={page.chapterTitle}
          progressPercent={progressForPage(pageIndex, pages.length)}
          chapterCompleted={chapterCompleted}
          onQuizComplete={recordQuiz}
          onSelectBook={onSelectBook}
          onClose={() => showReedPanel(false)}
        />
      )}
    </div>
  );
};

const ReadingSettings: React.FC<{
  prefs: ReadingPrefs;
  onChange: (prefs: ReadingPrefs) => void;
  muted: string;
}> = ({ prefs, onChange, muted }) => {
  const patch = (partial: Partial<ReadingPrefs>) => onChange({ ...prefs, ...partial });
  return (
    <div className="mb-8 rounded-lg border p-4 text-sm space-y-4" style={{ borderColor: muted }}>
      <SettingRow label="Tamaño">
        <IconButton label="Reducir" onClick={() => patch({ fontScale: prefs.fontScale === 'lg' ? 'md' : 'sm' })}><Minus size={14} /></IconButton>
        <span className="px-2 font-serif">A</span>
        <IconButton label="Aumentar" onClick={() => patch({ fontScale: prefs.fontScale === 'sm' ? 'md' : 'lg' })}><Plus size={14} /></IconButton>
      </SettingRow>
      <SettingRow label="Tipografía">
        <Choice active={prefs.font === 'serif'} onClick={() => patch({ font: 'serif' })}>Serif</Choice>
        <Choice active={prefs.font === 'sans'} onClick={() => patch({ font: 'sans' })}>Sans Serif</Choice>
      </SettingRow>
      <SettingRow label="Interlineado">
        <Choice active={prefs.leading === 'compact'} onClick={() => patch({ leading: 'compact' })}>Compacto</Choice>
        <Choice active={prefs.leading === 'normal'} onClick={() => patch({ leading: 'normal' })}>Normal</Choice>
        <Choice active={prefs.leading === 'wide'} onClick={() => patch({ leading: 'wide' })}>Amplio</Choice>
      </SettingRow>
      <SettingRow label="Tema">
        <Choice active={prefs.theme === 'light'} onClick={() => patch({ theme: 'light' })}>Claro</Choice>
        <Choice active={prefs.theme === 'sepia'} onClick={() => patch({ theme: 'sepia' })}>Sepia</Choice>
        <Choice active={prefs.theme === 'dark'} onClick={() => patch({ theme: 'dark' })}>Oscuro</Choice>
      </SettingRow>
    </div>
  );
};

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="w-28 text-xs uppercase tracking-wider opacity-70">{label}</span>
    {children}
  </div>
);

const Choice: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-md border text-xs ${active ? 'font-bold' : 'opacity-70'}`}
  >
    {children}
  </button>
);

const IconButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button type="button" aria-label={label} onClick={onClick} className="w-8 h-8 rounded-md border inline-flex items-center justify-center">
    {children}
  </button>
);
