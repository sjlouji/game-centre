import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from '../components/GameBoard';
import Header from '../components/Header';
import GameOverOverlay from '../components/GameOverOverlay';
import WinOverlay from '../components/WinOverlay';
import { GRID_SIZE } from '../lib/constants';
import type { TileType } from '../lib/types';
import Swipeable from '../components/Swipeable';

// Helper function for haptic feedback
const triggerHaptic = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

const Game2048Screen: React.FC = () => {
  let tileIdCounter = 1;

  const createTile = (row: number, col: number, value: number, isNew: boolean = false): TileType => ({
    id: tileIdCounter++,
    value,
    row,
    col,
    isNew,
    isMerged: false,
    isReverted: false,
  });

  type GameState = {
    tiles: TileType[];
    score: number;
    moves: number;
  };

  const [tiles, setTiles] = useState<TileType[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [winOverlayDismissed, setWinOverlayDismissed] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [history, setHistory] = useState<GameState[]>([]);
  
  // State for stats
  const [highestTile, setHighestTile] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [achievements, setAchievements] = useState<Set<number>>(new Set());

  // Load stats from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedHighScore = localStorage.getItem('2048-highscore');
    setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
    const savedHighestTile = localStorage.getItem('2048-highestTile');
    setHighestTile(savedHighestTile ? parseInt(savedHighestTile, 10) : 0);
    const savedGamesWon = localStorage.getItem('2048-gamesWon');
    setGamesWon(savedGamesWon ? parseInt(savedGamesWon, 10) : 0);
    const savedWinStreak = localStorage.getItem('2048-winStreak');
    setWinStreak(savedWinStreak ? parseInt(savedWinStreak, 10) : 0);
    const savedAchievements = localStorage.getItem('2048-achievements');
    setAchievements(savedAchievements ? new Set(JSON.parse(savedAchievements)) : new Set());
  }, []);
  
  const updateStats = useCallback((updatedTiles: TileType[], newScore: number, gameWon: boolean, gameLost: boolean) => {
    const maxTile = Math.max(0, ...updatedTiles.map(t => t.value));
    if (maxTile > highestTile) {
      setHighestTile(maxTile);
      localStorage.setItem('2048-highestTile', maxTile.toString());
    }

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('2048-highscore', newScore.toString());
    }

    if (gameWon) {
      const newGamesWon = gamesWon + 1;
      const newWinStreak = winStreak + 1;
      setGamesWon(newGamesWon);
      setWinStreak(newWinStreak);
      localStorage.setItem('2048-gamesWon', newGamesWon.toString());
      localStorage.setItem('2048-winStreak', newWinStreak.toString());
    } else if (gameLost) {
      setWinStreak(0);
      localStorage.setItem('2048-winStreak', '0');
    }
    
    // Update achievements
    const achievementTiers = [512, 1024, 2048, 4096, 8192];
    const newAchievements = new Set(achievements);
    let updated = false;
    achievementTiers.forEach(tier => {
      if (maxTile >= tier && !newAchievements.has(tier)) {
        newAchievements.add(tier);
        updated = true;
      }
    });
    if (updated) {
      setAchievements(newAchievements);
      localStorage.setItem('2048-achievements', JSON.stringify(Array.from(newAchievements)));
    }

  }, [highestTile, highScore, gamesWon, winStreak, achievements]);

  const toGrid = (tileArray: TileType[]): (TileType | null)[][] => {
    const grid: (TileType | null)[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    tileArray.forEach(tile => {
      grid[tile.row][tile.col] = tile;
    });
    return grid;
  };

  const getEmptyCells = useCallback((grid: (TileType | null)[][]) => {
    const emptyCells: { row: number; col: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!grid[r][c]) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }
    return emptyCells;
  }, []);

  const addRandomTile = useCallback((currentTiles: TileType[]) => {
    const grid = toGrid(currentTiles);
    const emptyCells = getEmptyCells(grid);
    if (emptyCells.length === 0) return currentTiles;

    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const newTile = createTile(row, col, value, true);
    return [...currentTiles, newTile];
  }, [getEmptyCells]);

  const canMove = useCallback((currentTiles: TileType[]) => {
    const grid = toGrid(currentTiles);
    if (getEmptyCells(grid).length > 0) return true;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = grid[r][c]?.value;
        if (!value) continue;
        if (r < GRID_SIZE - 1 && grid[r + 1][c]?.value === value) return true;
        if (c < GRID_SIZE - 1 && grid[r][c + 1]?.value === value) return true;
      }
    }
    return false;
  }, [getEmptyCells]);

  const startNewGame = useCallback(() => {
    tileIdCounter = 1;
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setWon(false);
    setWinOverlayDismissed(false);
    setHistory([]);
    let newTiles = addRandomTile([]);
    newTiles = addRandomTile(newTiles);
    setTiles(newTiles);
    updateStats(newTiles, 0, false, false);
  }, [addRandomTile, updateStats]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (isMoving || gameOver) return;

      const rotateGrid = (grid: (TileType | null)[][], times: number) => {
        let newGrid = grid;
        for (let i = 0; i < times; i++) {
          const rotated = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              rotated[c][GRID_SIZE - 1 - r] = newGrid[r][c];
            }
          }
          newGrid = rotated;
        }
        return newGrid;
      };

      const slideRowLeft = (row: (TileType | null)[]) => {
        const originalRowValues = row.map(t => t?.value);
        const filtered = row.filter(Boolean) as TileType[];
        const newRow: TileType[] = [];
        let scoreGained = 0;
        
        if (filtered.length > 0) {
            let i = 0;
            while (i < filtered.length) {
                let tile = filtered[i];
                if (i + 1 < filtered.length && tile.value === filtered[i+1].value) {
                    const newValue = tile.value * 2;
                    scoreGained += newValue;
                    newRow.push({ ...tile, value: newValue, isMerged: true });
                    i += 2;
                } else {
                    newRow.push({ ...tile, isMerged: false });
                    i++;
                }
            }
        }
        
        const paddedRow: (TileType | null)[] = [...newRow];
        while (paddedRow.length < GRID_SIZE) {
          paddedRow.push(null);
        }

        const moved = JSON.stringify(originalRowValues) !== JSON.stringify(paddedRow.map(t => t?.value));
        
        return { newRow: paddedRow, scoreGained, moved };
      };
      
      const rotations = { left: 0, up: 3, right: 2, down: 1 };
      const numRotations = rotations[direction];
      let grid = toGrid(tiles);

      grid = rotateGrid(grid, numRotations);

      let totalScoreGained = 0;
      let hasMoved = false;

      const newGrid = grid.map(row => {
        const { newRow, scoreGained, moved } = slideRowLeft(row);
        if (moved) hasMoved = true;
        totalScoreGained += scoreGained;
        return newRow;
      });

      grid = rotateGrid(newGrid, (4 - numRotations) % 4);

      if (hasMoved) {
        if (totalScoreGained > 0) {
          triggerHaptic([40, 20, 40]);
        } else {
          triggerHaptic(20);
        }

        const prevState = { tiles, score, moves };
        setHistory(h => [...h, prevState]);
        setMoves(m => m + 1);
        
        setIsMoving(true);
        const finalTiles: TileType[] = [];
        grid.forEach((row, r) => {
          row.forEach((tile, c) => {
            if (tile) {
              finalTiles.push({ ...tile, row: r, col: c, isNew: false });
            }
          });
        });
        
        const newScore = score + totalScoreGained;
        setScore(newScore);
        setTiles(finalTiles);
        
        setTimeout(() => {
            const tilesAfterMove = finalTiles.map(t => ({...t, isMerged: false}));
            const tilesWithNew = addRandomTile(tilesAfterMove);
            setTiles(tilesWithNew);

            const justWon = !won && tilesWithNew.some(tile => tile.value === 2048);
            if (justWon) {
              setWon(true);
              triggerHaptic([100, 30, 100, 30, 100]);
            }

            const gameIsOver = !canMove(tilesWithNew);
            if (gameIsOver) {
                setGameOver(true);
                if (!justWon) {
                    triggerHaptic(200);
                }
            }
            updateStats(tilesWithNew, newScore, justWon, gameIsOver);
            setIsMoving(false);
        }, 100);
      }
    },
    [tiles, score, moves, isMoving, gameOver, won, addRandomTile, canMove, updateStats]
  );
  
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isMoving) return;

    const lastState = history[history.length - 1];
    setHistory(history.slice(0, -1));

    const revertedTiles = lastState.tiles.map(t => ({ ...t, isReverted: true }));
    setTiles(revertedTiles);
    setScore(lastState.score);
    setMoves(lastState.moves);
    setGameOver(false);

    setTimeout(() => {
        setTiles(currentTiles => currentTiles.map(t => ({ ...t, isReverted: false })));
    }, 400);
  }, [history, isMoving]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      handleUndo();
      return;
    }
    const map: { [key: string]: 'up' | 'down' | 'left' | 'right' } = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    };
    if (map[e.key]) {
      e.preventDefault();
      move(map[e.key]);
    }
  }, [move, handleUndo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Swipeable
      onSwipeUp={() => move('up')}
      onSwipeDown={() => move('down')}
      onSwipeLeft={() => move('left')}
      onSwipeRight={() => move('right')}
      className="flex flex-col items-center justify-start font-sans select-none w-full flex-grow"
      style={{'--tile-gap': '0.5rem'} as React.CSSProperties}
    >
      <style>{`:root { @media (min-width: 640px) { --tile-gap: 1rem; } }`}</style>
      <div className="w-full max-w-[18.5rem] sm:max-w-[29rem]">
        <Header 
            score={score} 
            highScore={highScore}
            onNewGame={startNewGame}
            onUndo={handleUndo}
            canUndo={history.length > 0 && !isMoving}
        />
        <div className="relative">
          <GameBoard tiles={tiles} />
          {gameOver && <GameOverOverlay score={score} onRestart={startNewGame} />}
          {won && !gameOver && !winOverlayDismissed && (
            <WinOverlay 
              onContinue={() => setWinOverlayDismissed(true)}
              onNewGame={startNewGame}
            />
          )}
        </div>
      </div>
    </Swipeable>
  );
};

export default Game2048Screen;