
import React, { useState, useEffect, useCallback } from 'react';
import GameCenter from './screens/GameCenter';
import Game2048Screen from './screens/Game2048Screen';
import DinoGameScreen from './screens/DinoGameScreen';
import PaperTossScreen from './screens/PaperTossScreen';
import AppHeader from './components/AppHeader';
import { Game, GameId, GAMES } from './lib/games';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId | 'menu'>('menu');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigation = (target: GameId | 'menu') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGame(target);
      setIsTransitioning(false);
    }, 300);
  };

  const renderActiveScreen = () => {
    if (activeGame === 'menu') {
      return <GameCenter games={GAMES} onSelectGame={(gameId) => handleNavigation(gameId)} />;
    }
    
    switch (activeGame) {
      case '2048':
        return <Game2048Screen />;
      case 'dino':
        return <DinoGameScreen />;
      case 'paper-toss':
        return <PaperTossScreen />;
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