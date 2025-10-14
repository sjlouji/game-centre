import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from '../components/GameBoard';
import Header from '../components/Header';
import GameOverOverlay from '../components/GameOverOverlay';
import WinOverlay from '../components/WinOverlay';
import HelpModal from '../components/HelpModal';
import StatsModal from '../components/StatsModal';
import GameControls from '../components/GameControls';
import { GRID_SIZE } from '../constants';
import type { TileType } from '../types';

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
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Stats & Achievements state
  const [highestTile, setHighestTile] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [achievements, setAchievements] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Load stats from localStorage
    const savedHighScore = localStorage.getItem('2048-highscore');
    setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);

    const savedHighestTile = localStorage.getItem('2048-highest-tile');
    setHighestTile(savedHighestTile ? parseInt(savedHighestTile, 10) : 0);

    const savedGamesWon = localStorage.getItem('2048-games-won');
    setGamesWon(savedGamesWon ? parseInt(savedGamesWon, 10) : 0);

    const savedWinStreak = localStorage.getItem('2048-win-streak');
    setWinStreak(savedWinStreak ? parseInt(savedWinStreak, 10) : 0);

    const savedAchievements = localStorage.getItem('2048-achievements');
    setAchievements(savedAchievements ? new Set(JSON.parse(savedAchievements)) : new Set());
  }, []);

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
  }, [addRandomTile]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const updateScore = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('2048-highscore', newScore.toString());
    }
  }, [highScore]);

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
          triggerHaptic([40, 20, 40]); // Merge feedback
        } else {
          triggerHaptic(20); // Move feedback
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
        
        updateScore(score + totalScoreGained);
        setTiles(finalTiles);
        
        setTimeout(() => {
            const tilesAfterMove = finalTiles.map(t => ({...t, isMerged: false}));
            const tilesWithNew = addRandomTile(tilesAfterMove);
            setTiles(tilesWithNew);

            const maxTile = Math.max(0, ...tilesWithNew.map(t => t.value));
            if (maxTile > highestTile) {
              setHighestTile(maxTile);
              localStorage.setItem('2048-highest-tile', maxTile.toString());
            }

            // Check for new achievements
            const achievementTiers = [512, 1024, 2048, 4096, 8192];
            const newAchievements = new Set(achievements);
            achievementTiers.forEach(tier => {
              if (maxTile >= tier) newAchievements.add(tier);
            });
            if (newAchievements.size > achievements.size) {
              setAchievements(newAchievements);
              localStorage.setItem('2048-achievements', JSON.stringify(Array.from(newAchievements)));
            }

            const justWon = !won && tilesWithNew.some(tile => tile.value === 2048);
            if (justWon) {
              setWon(true);
              triggerHaptic([100, 30, 100, 30, 100]); // Win haptic
              const newGamesWon = gamesWon + 1;
              const newWinStreak = winStreak + 1;
              setGamesWon(newGamesWon);
              setWinStreak(newWinStreak);
              localStorage.setItem('2048-games-won', newGamesWon.toString());
              localStorage.setItem('2048-win-streak', newWinStreak.toString());
            }

            if (!canMove(tilesWithNew)) {
                setGameOver(true);
                if (justWon) {
                    // User won on the last possible move. Win haptic is enough.
                } else {
                    // User lost.
                    triggerHaptic(200); // Game over haptic
                    setWinStreak(0);
                    localStorage.setItem('2048-win-streak', '0');
                }
            }
            setIsMoving(false);
        }, 100);
      }
    },
    [tiles, score, moves, isMoving, gameOver, won, addRandomTile, canMove, updateScore, highestTile, gamesWon, winStreak, achievements]
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
  
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartPosRef.current) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.changedTouches.length === 0) return;

    const touchStartPos = touchStartPosRef.current;
    const touchEndPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEndPos.x - touchStartPos.x;
    const dy = touchEndPos.y - touchStartPos.y;

    const minSwipeDistance = 30;
    const swipeDirectionThreshold = 1.5;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > minSwipeDistance) {
      if (absDx > absDy * swipeDirectionThreshold) {
        move(dx > 0 ? 'right' : 'left');
      } else if (absDy > absDx * swipeDirectionThreshold) {
        move(dy > 0 ? 'down' : 'up');
      }
    }
    touchStartPosRef.current = null;
  }, [move]);

  return (
    <div 
      className="flex flex-col items-center justify-start font-sans select-none w-full flex-grow"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{'--tile-gap': '0.5rem', touchAction: 'none'} as React.CSSProperties}
    >
      <style>{`:root { @media (min-width: 640px) { --tile-gap: 1rem; } }`}</style>
      <Header
        score={score}
        highScore={highScore}
        moves={moves}
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
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showStats && (
          <StatsModal 
            highestTile={highestTile}
            gamesWon={gamesWon}
            winStreak={winStreak}
            achievements={achievements}
            onClose={() => setShowStats(false)} 
          />
        )}
      </div>
      <GameControls
        onNewGame={startNewGame}
        onUndo={handleUndo}
        canUndo={history.length > 0 && !isMoving}
        onHelp={() => setShowHelp(true)}
        onStats={() => setShowStats(true)}
      />
    </div>
  );
};

export default Game2048Screen;