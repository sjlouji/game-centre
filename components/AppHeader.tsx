import React from 'react';
import type { GameId } from '../App';

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
          <div className="w-32 h-6 bg-sky-400 rounded-sm"></div>
        ) : (
          <button onClick={onBack} className="text-xl text-neutral-400 hover:text-neutral-50 transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
            <span>&larr;</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;