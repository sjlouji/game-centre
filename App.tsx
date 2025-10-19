
import React, { useState, useEffect, useCallback } from 'react';
import GameCenter from './screens/GameCenter';
import Game2048Screen from './screens/Game2048Screen';
import DinoGameScreen from './screens/DinoGameScreen';
import TicTacToeScreen from './screens/TicTacToeScreen';
import BlockFallScreen from './screens/BlockFallScreen';
import StackGameScreen from './screens/StackGameScreen';
import MinesweeperScreen from './screens/MinesweeperScreen';
import SnakeScreen from './screens/SnakeScreen';
import AppHeader from './components/AppHeader';
import { Game, GameId, GAMES } from './lib/games';
import ConnectFourScreen from './screens/ConnectFourScreen';
import FlappyBirdScreen from './screens/FlappyBirdScreen';
import SudokuScreen from './screens/SudokuScreen';
import MemoryMatchScreen from './screens/MemoryMatchScreen';

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
      case 'tic-tac-toe':
        return <TicTacToeScreen />;
      case 'block-fall':
        return <BlockFallScreen />;
      case 'stack':
        return <StackGameScreen />;
      case 'minesweeper':
        return <MinesweeperScreen />;
      case 'snake':
        return <SnakeScreen />;
      case 'connect-four':
        return <ConnectFourScreen />;
      case 'flappy-bird':
        return <FlappyBirdScreen />;
      case 'sudoku':
        return <SudokuScreen />;
      case 'memory-match':
        return <MemoryMatchScreen />;
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