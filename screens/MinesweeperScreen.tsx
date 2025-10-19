
import React, { useState, useEffect, useCallback } from 'react';

// --- Types ---
type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  isHit?: boolean;
};
type Board = CellState[][];
type GameStatus = 'menu' | 'playing' | 'won' | 'lost';
type Difficulty = 'easy' | 'medium' | 'hard';

// --- Constants ---
const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const NUMBER_COLORS = [
  '', '#3b82f6', '#16a34a', '#ef4444', '#6366f1',
  '#a855f7', '#ec4899', '#f97316', '#eab308'
];

// --- Helper Functions ---
const createEmptyBoard = (rows: number, cols: number): Board => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
};

const plantMinesAndCalculate = (board: Board, initialRow: number, initialCol: number, rows: number, cols: number, mines: number): Board => {
  const newBoard = JSON.parse(JSON.stringify(board));
  let minesPlaced = 0;

  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const isInitialClick = Math.abs(r - initialRow) <= 1 && Math.abs(c - initialCol) <= 1;

    if (!newBoard[r][c].isMine && !isInitialClick) {
      newBoard[r][c].isMine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let mineCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
              mineCount++;
            }
          }
        }
        newBoard[r][c].adjacentMines = mineCount;
      }
    }
  }
  return newBoard;
};

// --- Components ---

const Cell: React.FC<{ r: number, c: number, cell: CellState; onClick: () => void; onContextMenu: (e: React.MouseEvent) => void; gameStatus: GameStatus }> = React.memo(({ r, c, cell, onClick, onContextMenu, gameStatus }) => {
  const { isRevealed, isFlagged, isMine, adjacentMines, isHit } = cell;

  const getCellContent = () => {
    if (isFlagged) return <span className="animate-flag">🚩</span>;
    if (isRevealed) {
      if (isMine) return '💣';
      if (adjacentMines > 0) return <span className="animate-reveal">{adjacentMines}</span>;
    }
    return '';
  };

  const isLostAndMine = gameStatus === 'lost' && isMine && !isFlagged;

  const baseClass = "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-lg rounded-sm transition-colors duration-100";
  let cellClass = '';

  if (isRevealed || isLostAndMine) {
    if (isHit) cellClass = "bg-red-500 animate-mine-hit";
    else if (isMine) cellClass = "bg-red-500/50";
    else cellClass = "bg-slate-700 shadow-inner";
  } else {
    cellClass = "bg-slate-800 hover:bg-slate-700/70 active:bg-slate-600 cursor-pointer";
  }
  
  const isWinningAndMine = gameStatus === 'won' && isMine;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      disabled={isRevealed || gameStatus !== 'playing'}
      className={`${baseClass} ${cellClass}`}
      style={{ 
        color: NUMBER_COLORS[adjacentMines],
        animationDelay: isLostAndMine ? `${r * 20 + c * 10}ms` : (isWinningAndMine ? `${r * 20 + c * 10}ms` : '0s')
      }}
      aria-label={isRevealed ? `Cell with ${adjacentMines} adjacent mines` : 'Covered cell'}
    >
      {isLostAndMine ? <span className="animate-mine-reveal">💣</span> : (isWinningAndMine ? <span className="animate-win-flag">🚩</span> : getCellContent())}
    </button>
  );
});

const MinesweeperScreen: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(DIFFICULTIES.medium.rows, DIFFICULTIES.medium.cols));
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [firstClick, setFirstClick] = useState(true);
  const [minesLeft, setMinesLeft] = useState(DIFFICULTIES.medium.mines);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let interval: ReturnType<typeof setInterval> | null = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus]);

  const startGame = (diff: Difficulty) => {
    const { rows, cols, mines } = DIFFICULTIES[diff];
    setDifficulty(diff);
    setBoard(createEmptyBoard(rows, cols));
    setGameStatus('playing');
    setFirstClick(true);
    setMinesLeft(mines);
    setTimer(0);
  };

  const checkWinCondition = useCallback((currentBoard: Board) => {
    const { rows, cols } = DIFFICULTIES[difficulty];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!currentBoard[r][c].isMine && !currentBoard[r][c].isRevealed) {
          return false;
        }
      }
    }
    setGameStatus('won');
    return true;
  }, [difficulty]);
  
  const revealCells = useCallback((boardToReveal: Board, r: number, c: number): Board => {
    const { rows, cols } = DIFFICULTIES[difficulty];
    const newBoard = JSON.parse(JSON.stringify(boardToReveal));
    const queue: [number, number][] = [[r, c]];
    
    if (newBoard[r][c].isRevealed) return newBoard;
    
    newBoard[r][c].isRevealed = true;
    
    while(queue.length > 0) {
        const [row, col] = queue.shift()!;
        if (newBoard[row][col].adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = row + dr;
                    const nc = col + dc;

                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
                        newBoard[nr][nc].isRevealed = true;
                        if(newBoard[nr][nc].adjacentMines === 0){
                           queue.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
    return newBoard;
  }, [difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== 'playing' || board[r][c].isRevealed || board[r][c].isFlagged) return;

    let currentBoard = board;
    if (firstClick) {
      const { rows, cols, mines } = DIFFICULTIES[difficulty];
      currentBoard = plantMinesAndCalculate(board, r, c, rows, cols, mines);
      setFirstClick(false);
    }
    
    if (currentBoard[r][c].isMine) {
      const finalBoard = JSON.parse(JSON.stringify(currentBoard));
      finalBoard[r][c].isHit = true;
      setBoard(finalBoard);
      setGameStatus('lost');
      return;
    }

    const newBoard = revealCells(currentBoard, r, c);
    setBoard(newBoard);
    checkWinCondition(newBoard);
  };

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || board[r][c].isRevealed) return;
    
    const newBoard = JSON.parse(JSON.stringify(board));
    const cell = newBoard[r][c];
    if (cell.isFlagged) {
      cell.isFlagged = false;
      setMinesLeft(prev => prev + 1);
    } else if (minesLeft > 0) {
      cell.isFlagged = true;
      setMinesLeft(prev => prev - 1);
    }
    setBoard(newBoard);
  };

  const getResetButtonEmoji = () => {
    if (gameStatus === 'won') return '😎';
    if (gameStatus === 'lost') return '😵';
    return '🙂';
  };

  const { rows, cols } = DIFFICULTIES[difficulty];

  if (gameStatus === 'menu') {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
        <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
            <h2 className="text-4xl font-bold text-sky-400 mb-6 font-heading">Minesweeper</h2>
            <p className="text-md font-semibold text-neutral-300 mb-4">Select Difficulty</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={() => startGame('easy')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">Easy</button>
                <button onClick={() => startGame('medium')} className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">Medium</button>
                <button onClick={() => startGame('hard')} className="w-full bg-rose-500 hover:bg-rose-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">Hard</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
      <style>{`
        @keyframes reveal-content {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-reveal { animation: reveal-content 0.3s ease-out; }

        @keyframes flag-place {
            0% { transform: scale(1); }
            50% { transform: scale(1.3) rotate(-10deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        .animate-flag { animation: flag-place 0.3s ease-in-out; }
        
        @keyframes win-flag {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }
        .animate-win-flag { animation: win-flag 0.4s ease-out; }

        @keyframes mine-hit {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        .animate-mine-hit { animation: mine-hit 0.3s ease-out; }

        @keyframes mine-reveal {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }
        .animate-mine-reveal { animation: mine-reveal 0.3s ease-out; }
      `}</style>
      <div className="bg-slate-900 p-3 sm:p-4 rounded-lg shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-4 bg-slate-800 p-2 rounded-md">
          <div className="bg-slate-950 text-red-500 font-mono text-3xl px-2 rounded">{minesLeft.toString().padStart(3, '0')}</div>
          <button onClick={() => startGame(difficulty)} className="text-3xl bg-slate-700 rounded-md w-10 h-10 flex items-center justify-center active:scale-95">{getResetButtonEmoji()}</button>
          <div className="bg-slate-950 text-red-500 font-mono text-3xl px-2 rounded">{Math.min(timer, 999).toString().padStart(3, '0')}</div>
        </div>
        <div className="relative">
          <div className={`grid gap-px bg-slate-950`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {board.map((row, r) =>
              row.map((cell, c) => (
                <Cell key={`${r}-${c}`} r={r} c={c} cell={cell} onClick={() => handleCellClick(r, c)} onContextMenu={(e) => handleRightClick(e, r, c)} gameStatus={gameStatus} />
              ))
            )}
          </div>
          {(gameStatus === 'won' || gameStatus === 'lost') && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4" style={{ animationDelay: '1s'}}>
                <h2 className={`text-4xl font-bold mb-4 ${gameStatus === 'won' ? 'text-amber-400' : 'text-rose-400'}`}>{gameStatus === 'won' ? 'You Win!' : 'Game Over'}</h2>
                <button onClick={() => setGameStatus('menu')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">Main Menu</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesweeperScreen;
