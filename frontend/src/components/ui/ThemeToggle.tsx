import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('reed-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('reed-theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      title={isDark ? 'Cambiar a tema Papiro' : 'Cambiar a tema Noche'}
      className="p-2 rounded-md border border-line hover:bg-paper-sunk text-ink transition-colors duration-states flex items-center justify-center"
      aria-label="Cambiar tema de lectura"
    >
      {isDark ? (
        <Sun size={20} strokeWidth={1.75} />
      ) : (
        <Moon size={20} strokeWidth={1.75} />
      )}
    </button>
  );
};
