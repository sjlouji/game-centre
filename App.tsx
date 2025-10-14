import React, { useState, useEffect, useCallback } from 'react';
import GameCenter from './screens/GameCenter';
import Game2048Screen from './screens/Game2048Screen';
import AppHeader from './components/AppHeader';

export type GameId = '2048' | 'stickman' | 'bouncing-ball';

export interface Game {
  id: GameId;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  visual: React.ReactNode;
}

const GAMES: Game[] = [
  {
    id: '2048',
    title: '2048',
    description: 'Join the numbers to get the 2048 tile!',
    status: 'available',
    visual: (
      <div className="grid grid-cols-2 gap-2 w-24 h-24">
        <div className="bg-slate-700 rounded-md"></div>
        <div className="bg-amber-400 rounded-md"></div>
        <div className="bg-rose-400 rounded-md"></div>
        <div className="bg-slate-400 rounded-md"></div>
      </div>
    ),
  },
  {
    id: 'stickman',
    title: 'Stickman Hook',
    description: 'Swing through levels with your grappling hook!',
    status: 'coming-soon',
    visual: (
       <div className="w-16 h-16 relative">
        {/* Rope */}
        <div className="absolute top-[-0.5rem] left-[3.2rem] w-12 h-0.5 bg-slate-600 transform -rotate-45 origin-top-left"></div>
        {/* Stickman */}
        <div className="absolute bottom-2 left-2 transform -rotate-45">
          <div className="w-5 h-5 rounded-full bg-sky-400"></div> {/* Head */}
          <div className="absolute top-4 left-2 w-0.5 h-6 bg-sky-400"></div> {/* Body */}
        </div>
      </div>
    ),
  },
    {
    id: 'bouncing-ball',
    title: 'Bouncing Ball',
    description: 'Navigate your ball through tricky obstacles.',
    status: 'coming-soon',
    visual: (
      <div className="w-16 h-16 relative">
        {/* Ball */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-9 h-9 rounded-full bg-rose-400"></div>
        {/* Shadow */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-slate-800 rounded-full opacity-75 blur-sm"></div>
      </div>
    ),
  },
];

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId | 'menu'>('menu');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigation = (target: GameId | 'menu') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGame(target);
      setIsTransitioning(false);
    }, 300); // Corresponds to the fade-out animation duration
  };

  const renderActiveScreen = () => {
    if (activeGame === 'menu') {
      return <GameCenter games={GAMES} onSelectGame={(gameId) => handleNavigation(gameId)} />;
    }
    
    switch (activeGame) {
      case '2048':
        return <Game2048Screen />;
      default:
        return <GameCenter games={GAMES} onSelectGame={(gameId) => handleNavigation(gameId)} />;
    }
  };

  const transitionClass = isTransitioning ? 'screen-fade-exit' : 'screen-fade-enter';

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start p-4 sm:p-12">
      <AppHeader 
        activeGame={activeGame} 
        onBack={() => handleNavigation('menu')} 
      />
      <main className={`w-full flex-grow flex flex-col ${transitionClass}`}>
        {renderActiveScreen()}
      </main>
    </div>
  );
};

export default App;