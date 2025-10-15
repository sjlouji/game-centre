import React from 'react';

type Theme = 'light' | 'dark';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 dark:bg-neutral-50 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Intentionally empty for minimalist design from image */}
    </button>
  );
};

export default ThemeToggle;
