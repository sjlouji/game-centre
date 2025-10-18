import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swipeable from '../components/Swipeable';

// --- Game Constants ---
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// --- Types ---
type TetrominoLetter = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
type CellValue = 0 | TetrominoLetter;
type Tetromino = { shape: CellValue[][]; color: string };
type Player = {
    pos: { x: number; y: number };
    tetromino: Tetromino;
};
type DisplayCell = {
  value: CellValue;
  isGhost?: boolean;
  isClearing?: boolean;
  isHardDropImpact?: boolean;
};
type DisplayBoard = DisplayCell[][];
type Difficulty = 'easy' | 'normal' | 'hard';
type GameState = 'menu' | 'playing' | 'gameOver';

const TETROMINOS: Record<TetrominoLetter, Tetromino> = {
  I: { shape: [[0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0]], color: '#38bdf8' },
  J: { shape: [[0, 'J', 0], [0, 'J', 0], ['J', 'J', 0]], color: '#60a5fa' },
  L: { shape: [[0, 'L', 0], [0, 'L', 0], [0, 'L', 'L']], color: '#fb923c' },
  O: { shape: [['O', 'O'], ['O', 'O']], color: '#facc15' },
  S: { shape: [[0, 'S', 'S'], ['S', 'S', 0], [0, 0, 0]], color: '#4ade80' },
  T: { shape: [[0, 0, 0], ['T', 'T', 'T'], [0, 'T', 0]], color: '#c084fc' },
  Z: { shape: [['Z', 'Z', 0], [0, 'Z', 'Z'], [0, 0, 0]], color: '#fb7185' },
};

const TETROMINO_KEYS: TetrominoLetter[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

const DIFFICULTY_SETTINGS: Record<Difficulty, { baseTime: number, minTime: number }> = {
  easy: { baseTime: 1200, minTime: 250 },
  normal: { baseTime: 1000, minTime: 200 },
  hard: { baseTime: 800, minTime: 150 },
};

const createBoard = (): CellValue[][] => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

const getRandomTetromino = (): Tetromino => {
  const randKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  return TETROMINOS[randKey];
};

// --- Custom Hooks ---
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<(() => void) | null>(null);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    function tick() { if (savedCallback.current) savedCallback.current(); }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// --- Game Components ---
const Cell: React.FC<{ cell: DisplayCell }> = React.memo(({ cell }) => {
  if (cell.isClearing) {
    return <div className="aspect-square bg-white animate-pulse" />;
  }

  const baseClass = "aspect-square rounded-[3px]";

  if (cell.value === 0) {
    return <div className={`${baseClass} ${cell.isGhost ? 'bg-slate-700/50' : 'bg-slate-900'}`} />;
  }

  const color = TETROMINOS[cell.value].color;

  if (cell.isGhost) {
      return <div className={baseClass} style={{ backgroundColor: 'transparent', border: `2px solid ${color}`, opacity: 0.3 }} />;
  }
  
  const impactClass = cell.isHardDropImpact ? 'animate-hard-drop' : '';

  return (
    <div
      className={`${baseClass} ${impactClass}`}
      style={{
        backgroundColor: color,
        boxShadow: 'inset 0px 0px 5px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    />
  );
});

const Board: React.FC<{ board: DisplayBoard }> = ({ board }) => (
  <div className="grid grid-cols-10 gap-px p-1 bg-slate-700 rounded-md shadow-inner">
    {board.map((row, y) => row.map((cell, x) => <Cell key={`${y}-${x}`} cell={cell} />))}
  </div>
);

const Stats: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-slate-900 p-2 rounded-md text-center w-full">
    <div className="text-sm text-neutral-400 uppercase font-semibold">{label}</div>
    <div className="text-2xl font-bold text-neutral-50">{value}</div>
  </div>
);

const NextPiece: React.FC<{ tetromino: Tetromino | null }> = ({ tetromino }) => (
  <div className="bg-slate-900 p-2 rounded-md w-full">
    <div className="text-sm text-center text-neutral-400 uppercase font-semibold mb-2">Next</div>
    <div className="flex justify-center items-center h-16">
      {tetromino && (
        <div className={`grid gap-px ${tetromino.shape[0].length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {tetromino.shape.map((row, y) =>
            row.map((cell, x) => (
              <div key={`${y}-${x}`} className="w-4 h-4" style={{ backgroundColor: cell === 0 ? 'transparent' : tetromino.color, borderRadius: '2px' }}></div>
            ))
          )}
        </div>
      )}
    </div>
  </div>
);

// --- Main Game Screen ---
const BlockFallScreen: React.FC = () => {
  const [board, setBoard] = useState(createBoard());
  const [player, setPlayer] = useState<Player | null>(null);
  const [nextTetromino, setNextTetromino] = useState<Tetromino | null>(() => getRandomTetromino());
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [hardDropImpact, setHardDropImpact] = useState<Player | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [dropTime, setDropTime] = useState<number | null>(null);

  const checkCollision = useCallback((playerToCheck: Player, boardToCheck: CellValue[][], { moveX, moveY }: { moveX: number; moveY: number }) => {
    for (let y = 0; y < playerToCheck.tetromino.shape.length; y++) {
      for (let x = 0; x < playerToCheck.tetromino.shape[y].length; x++) {
        if (playerToCheck.tetromino.shape[y][x] !== 0) {
          const newY = y + playerToCheck.pos.y + moveY;
          const newX = x + playerToCheck.pos.x + moveX;
          if (newY >= BOARD_HEIGHT || newX < 0 || newX >= BOARD_WIDTH || (boardToCheck[newY] && boardToCheck[newY][newX] !== 0)) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const spawnNewPiece = useCallback((currentBoard: CellValue[][]) => {
    const newPlayer = { pos: { x: BOARD_WIDTH / 2 - 2, y: 0 }, tetromino: nextTetromino! };
    if (checkCollision(newPlayer, currentBoard, { moveX: 0, moveY: 0 })) {
      setGameState('gameOver');
      setDropTime(null);
    } else {
      setPlayer(newPlayer);
      setNextTetromino(getRandomTetromino());
    }
  }, [checkCollision, nextTetromino]);

  const processLandedPiece = useCallback((landedPlayer: Player) => {
    const boardWithMergedPiece = JSON.parse(JSON.stringify(board)) as CellValue[][];
    landedPlayer.tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardY = y + landedPlayer.pos.y;
                const boardX = x + landedPlayer.pos.x;
                if (boardY >= 0) {
                    boardWithMergedPiece[boardY][boardX] = value;
                }
            }
        });
    });
    setBoard(boardWithMergedPiece);
    setPlayer(null);

    const fullRows: number[] = [];
    boardWithMergedPiece.forEach((row, y) => {
        if (row.every(cell => cell !== 0)) fullRows.push(y);
    });

    if (fullRows.length > 0) {
        setDropTime(null);
        setClearingRows(fullRows);
        setTimeout(() => {
            let boardAfterSweep = boardWithMergedPiece.filter((_, index) => !fullRows.includes(index));
            const emptyRows = Array.from({ length: fullRows.length }, () => Array(BOARD_WIDTH).fill(0));
            const finalBoard = [...emptyRows, ...boardAfterSweep];
            
            const linePoints = [0, 40, 100, 300, 1200];
            setScore(prev => prev + linePoints[fullRows.length] * (level + 1));
            setLines(prev => prev + fullRows.length);
            
            setBoard(finalBoard);
            spawnNewPiece(finalBoard);
            setClearingRows([]);
        }, 300);
    } else {
        spawnNewPiece(boardWithMergedPiece);
    }
  }, [board, level, spawnNewPiece]);


  const startGame = useCallback((selectedDifficulty: Difficulty) => {
    setBoard(createBoard());
    setScore(0);
    setLines(0);
    setLevel(0);
    setClearingRows([]);
    setHardDropImpact(null);
    setDifficulty(selectedDifficulty);
    setGameState('playing');
    const firstPiece = getRandomTetromino();
    const secondPiece = getRandomTetromino();
    setNextTetromino(secondPiece);
    setPlayer({ pos: { x: BOARD_WIDTH / 2 - 2, y: 0 }, tetromino: firstPiece });
  }, []);

  const movePlayer = useCallback((dir: -1 | 1) => {
    if (!player || clearingRows.length > 0 || gameState !== 'playing') return;
    if (!checkCollision(player, board, { moveX: dir, moveY: 0 })) {
      setPlayer(prev => prev ? ({ ...prev, pos: { ...prev.pos, x: prev.pos.x + dir }}) : null);
    }
  }, [player, board, checkCollision, clearingRows, gameState]);

  const rotate = (matrix: Tetromino['shape']) => {
    const rotated = matrix.map((_, index) => matrix.map(col => col[index]));
    return rotated.map(row => row.reverse());
  };

  const rotatePlayer = useCallback(() => {
    if (!player || clearingRows.length > 0 || gameState !== 'playing') return;
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape);

    let offset = 1;
    while (checkCollision(clonedPlayer, board, { moveX: 0, moveY: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino.shape[0].length) return;
    }
    setPlayer(clonedPlayer);
  }, [player, board, checkCollision, clearingRows, gameState]);

  const drop = useCallback(() => {
    if (!player || gameState !== 'playing') return;
    if (!checkCollision(player, board, { moveX: 0, moveY: 1 })) {
      setPlayer(prev => prev ? ({...prev, pos: { ...prev.pos, y: prev.pos.y + 1 }}) : null);
    } else {
      if (player.pos.y < 1) {
        setGameState('gameOver');
        setDropTime(null);
        return;
      }
      processLandedPiece(player);
    }
  }, [player, board, checkCollision, processLandedPiece, gameState]);

  const hardDrop = useCallback(() => {
    if (!player || clearingRows.length > 0 || gameState !== 'playing') return;
    let finalY = player.pos.y;
    while (!checkCollision({ ...player, pos: { ...player.pos, y: finalY } }, board, { moveX: 0, moveY: 1 })) {
      finalY++;
    }
    const landedPlayer = { ...player, pos: { ...player.pos, y: finalY } };
    setHardDropImpact(landedPlayer);
    setTimeout(() => setHardDropImpact(null), 150);
    processLandedPiece(landedPlayer);
  }, [player, board, checkCollision, processLandedPiece, clearingRows, gameState]);
  
  useEffect(() => {
      if (lines > 0 && Math.floor(lines / 10) > level) {
          setLevel(prev => prev + 1);
      }
  }, [lines, level]);

  useEffect(() => {
    if (gameState === 'playing' && clearingRows.length === 0) {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        const newDropTime = settings.baseTime / (level + 1) + settings.minTime;
        setDropTime(newDropTime);
    }
  }, [level, gameState, clearingRows, difficulty]);

  useInterval(() => {
    if (gameState === 'playing') drop();
  }, dropTime);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') movePlayer(-1);
    else if (e.key === 'ArrowRight') movePlayer(1);
    else if (e.key === 'ArrowDown') drop();
    else if (e.key === 'ArrowUp') rotatePlayer();
    else if (e.key === ' ') hardDrop();
  }, [gameState, movePlayer, drop, rotatePlayer, hardDrop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const displayBoard: DisplayBoard = board.map((row, y) =>
    row.map(value => ({ value, isClearing: clearingRows.includes(y) }))
  );
  
  if (player && gameState === 'playing') {
    let ghostY = player.pos.y;
    while (!checkCollision({ ...player, pos: { ...player.pos, y: ghostY }}, board, { moveX: 0, moveY: 1 })) {
        ghostY++;
    }

    player.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + ghostY;
          const boardX = x + player.pos.x;
          if (boardY >= 0 && !displayBoard[boardY][boardX].value) {
            displayBoard[boardY][boardX] = { value, isGhost: true };
          }
        }
      });
    });

    player.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + player.pos.y;
          const boardX = x + player.pos.x;
          if (boardY >= 0) {
            displayBoard[boardY][boardX] = { value };
          }
        }
      });
    });
  }

  if (hardDropImpact) {
    hardDropImpact.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
          if (value !== 0) {
              const boardY = y + hardDropImpact.pos.y;
              const boardX = x + hardDropImpact.pos.x;
              if (boardY >= 0) {
                  displayBoard[boardY][boardX] = { value, isHardDropImpact: true };
              }
          }
      });
    });
  }

  const DifficultyButton: React.FC<{
    level: Difficulty;
    label: string;
    colorClass: string;
  }> = ({ level, label, colorClass }) => (
    <button
      onClick={() => startGame(level)}
      className={`w-full ${colorClass} text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95`}
    >
      {label}
    </button>
  );

  return (
    <Swipeable 
      className="w-full flex-grow flex items-center justify-center animate-fade-in"
      onSwipeLeft={() => movePlayer(-1)}
      onSwipeRight={() => movePlayer(1)}
      onSwipeUp={rotatePlayer}
      onSwipeDown={drop}
      onTap={hardDrop}
    >
      <style>{`
        @keyframes hard-drop-effect {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1, 0.9); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-hard-drop {
          animation: hard-drop-effect 0.15s ease-out;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
        <div className="relative w-[12.5rem] sm:w-[20rem]">
          <Board board={displayBoard} />
          {(gameState === 'menu' || gameState === 'gameOver') && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/80 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4 text-center">
              {gameState === 'gameOver' ? (
                  <>
                      <h2 className="text-4xl font-bold text-rose-400 mb-2">Game Over</h2>
                      <p className="text-lg text-neutral-400 mb-6">Final Score: {score}</p>
                  </>
              ) : (
                  <h2 className="text-4xl font-bold text-sky-400 mb-6 font-heading">Block Fall</h2>
              )}
              <p className="text-md font-semibold text-neutral-300 mb-4">Select Difficulty</p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <DifficultyButton level="easy" label="Easy" colorClass="bg-emerald-500 hover:bg-emerald-400" />
                  <DifficultyButton level="normal" label="Normal" colorClass="bg-sky-500 hover:bg-sky-400" />
                  <DifficultyButton level="hard" label="Hard" colorClass="bg-rose-500 hover:bg-rose-400" />
              </div>
            </div>
          )}
        </div>
        <div className="w-48 flex flex-col gap-4">
            <Stats label="Score" value={score} />
            <Stats label="Lines" value={lines} />
            <Stats label="Level" value={level} />
            <NextPiece tetromino={nextTetromino} />
             <button
                onClick={() => setGameState('menu')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-neutral-50 font-bold py-2 px-4 rounded-md transition-all duration-200 active:scale-95"
            >
                New Game
            </button>
        </div>
      </div>
    </Swipeable>
  );
};

export default BlockFallScreen;