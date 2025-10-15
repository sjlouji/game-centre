
import React from 'react';
import type { GameId } from '../lib/games';

const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0H2C0.895431 0 0 0.895431 0 2V18C0 19.1046 0.895431 20 2 20H18C19.1046 20 20 19.1046 20 18V2C20 0.895431 19.1046 0 18 0Z" fill="#FBBF24"/>
      <path d="M38 0H22C20.8954 0 20 0.895431 20 2V18C20 19.1046 20.8954 20 22 20H38C39.1046 20 40 19.1046 40 18V2C40 0.895431 39.1046 0 38 0Z" fill="#38BDF8"/>
      <path d="M18 20H2C0.895431 20 0 20.8954 0 22V38C0 39.1046 0.895431 40 2 40H18C19.1046 40 20 39.1046 20 38V22C20 20.8954 19.1046 20 18 20Z" fill="#FB7185"/>
      <path d="M38 20H22C20.8954 20 20 20.8954 20 22V38C20 39.1046 20.8954 40 22 40H38C39.1046 40 40 39.1046 40 38V22C40 20.8954 39.1046 20 38 20Z" fill="#4ADE80"/>
    </svg>
    <span className="text-2xl font-bold text-neutral-50">Game Center</span>
  </div>
);

interface AppHeaderProps {
  activeGame: GameId | 'menu';
  onBack: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ activeGame, onBack }) => {
  const isMenu = activeGame === 'menu';

  return (
    <header className="w-full max-w-7xl mx-auto mb-4 sm:mb-8 flex justify-between items-center h-16">
      <div className="flex items-center">
        {isMenu ? (
          <div>
            <Logo />
          </div>
        ) : (
          <button onClick={onBack} className="text-xl text-neutral-400 hover:text-neutral-50 transition-all flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 active:scale-90" aria-label="Back to Game Center">
            <span>&larr;</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
