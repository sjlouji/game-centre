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
       <div className="w-16 h-16 flex items-center justify-center">
         <div className="w-4 h-4 rounded-full bg-slate-400 -mr-2"></div>
         <div className="w-1 h-8 bg-slate-400 transform -rotate-45"></div>
         <div className="w-4 h-4 rounded-full bg-slate-400 -ml-2"></div>
       </div>
    ),
  },
    {
    id: 'bouncing-ball',
    title: 'Bouncing Ball',
    description: 'Navigate your ball through tricky obstacles.',
    status: 'coming-soon',
    visual: (
      <div className="w-16 h-16 flex items-end justify-center">
        <div className="w-8 h-8 rounded-full bg-rose-400"></div>
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