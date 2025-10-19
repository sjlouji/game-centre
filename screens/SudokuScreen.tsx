
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Types ---
type Difficulty = 'easy' | 'medium' | 'hard';
type GameStatus = 'menu' | 'playing' | 'solved';
type Cell = {
  value: number | null;
  isGiven: boolean;
  isInvalid: boolean;
};
type Board = Cell[][];
type Position = { row: number; col: number };

// --- Constants ---
const DIFFICULTIES: Record<Difficulty, { label: string; emptyCells: number }> = {
  easy: { label: 'Easy', emptyCells: 35 },
  medium: { label: 'Medium', emptyCells: 45 },
  hard: { label: 'Hard', emptyCells: 55 },
};

// Puzzle source: https://sandiway.arizona.edu/sudoku/examples.html
const PUZZLES = {
  easy: '..3.2.6..9..3.5..1..18.64....81.29..7.......8..67.82....26.95..8..2.3..9..5.1.3..',
  medium: '4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......',
  hard: '8..........7....2....5.4.1.8...6...4...6.3.7...5...2...1.9.8....3....2..........4',
};

// --- Helper Functions ---
const generatePuzzle = (difficulty: Difficulty): { puzzle: Board; solution: number[][] } => {
  const baseString = PUZZLES[difficulty];
  const puzzleBoard: Board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ value: null, isGiven: false, isInvalid: false })));
  const solutionBoard: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  // A simple solver to get the solution from the puzzle string
  const solve = (board: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              if (solve(board)) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const isValid = (board: number[][], row: number, col: number, num: number) => {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num || board[i][col] === num || board[3 * Math.floor(row / 3) + Math.floor(i / 3)][3 * Math.floor(col / 3) + i % 3] === num) {
        return false;
      }
    }
    return true;
  };

  // Populate solution board from string
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const char = baseString[i];
    solutionBoard[row][col] = char === '.' ? 0 : parseInt(char);
  }
  solve(solutionBoard);

  // Populate puzzle board from string
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const char = baseString[i];
    if (char !== '.') {
      const value = parseInt(char);
      puzzleBoard[row][col] = { value, isGiven: true, isInvalid: false };
    }
  }

  return { puzzle: puzzleBoard, solution: solutionBoard };
};

const SudokuScreen: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution } = generatePuzzle(diff);
    setDifficulty(diff);
    setBoard(puzzle);
    setSolution(solution);
    setSelectedCell(null);
    setErrors(0);
    setTimer(0);
    setStatus('playing');
  }, []);

  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);
  
  const checkWin = useCallback((currentBoard: Board) => {
      for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
              if (currentBoard[r][c].value === null || currentBoard[r][c].value !== solution![r][c]) {
                  return false;
              }
          }
      }
      return true;
  }, [solution]);

  const handleNumberInput = useCallback((num: number | null) => {
    if (!selectedCell || status !== 'playing' || !board) return;

    const { row, col } = selectedCell;
    if (board[row][col].isGiven) return;

    const newBoard = JSON.parse(JSON.stringify(board)) as Board;
    const currentCell = newBoard[row][col];
    
    if (num === null) {
        currentCell.value = null;
        currentCell.isInvalid = false;
    } else {
        currentCell.value = num;
        if (solution && solution[row][col] !== num) {
            currentCell.isInvalid = true;
            setErrors(e => e + 1);
        } else {
            currentCell.isInvalid = false;
        }
    }
    
    setBoard(newBoard);
    
    if (checkWin(newBoard)) {
        setStatus('solved');
    }

  }, [selectedCell, board, solution, status, checkWin]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status !== 'playing' || !selectedCell) return;
    
    let { row, col } = selectedCell;

    switch(e.key) {
        case 'ArrowUp': row = Math.max(0, row - 1); break;
        case 'ArrowDown': row = Math.min(8, row + 1); break;
        case 'ArrowLeft': col = Math.max(0, col - 1); break;
        case 'ArrowRight': col = Math.min(8, col + 1); break;
        case 'Backspace':
        case 'Delete':
            handleNumberInput(null);
            return;
        default:
            if (!isNaN(parseInt(e.key)) && e.key !== '0') {
                handleNumberInput(parseInt(e.key));
            }
            return;
    }
    e.preventDefault();
    setSelectedCell({ row, col });
  }, [status, selectedCell, handleNumberInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const selectedValue = selectedCell && board ? board[selectedCell.row][selectedCell.col].value : null;

  const renderBoard = useMemo(() => {
    if (!board) return null;
    return (
      <div className="sudoku-grid">
        {board.flat().map((cell, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          
          const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
          const isRelated = selectedCell && (selectedCell.row === row || selectedCell.col === col || (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && Math.floor(selectedCell.col / 3) === Math.floor(col / 3)));
          const isHighlighted = selectedValue && cell.value === selectedValue;

          let bgClass = 'bg-slate-800';
          if (isSelected) bgClass = 'bg-sky-700';
          else if (isRelated) bgClass = 'bg-slate-700';

          return (
            <div
              key={i}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl cursor-pointer transition-colors duration-150 ${bgClass}`}
              onClick={() => setSelectedCell({ row, col })}
            >
              <span className={`
                ${cell.isGiven ? 'text-neutral-300' : (cell.isInvalid ? 'text-rose-500' : 'text-sky-400')}
                ${(isHighlighted && !isSelected) ? 'bg-sky-900 rounded-full w-2/3 h-2/3 flex items-center justify-center' : ''}
                ${cell.value ? 'animate-number-pop' : ''}
              `}>
                {cell.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [board, selectedCell, selectedValue]);

  if (status === 'menu') {
    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
            <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
                <h2 className="text-4xl font-bold text-sky-400 mb-6 font-heading">Sudoku</h2>
                <p className="text-md font-semibold text-neutral-300 mb-4">Select Difficulty</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    {(Object.keys(DIFFICULTIES) as Difficulty[]).map(diff => (
                        <button key={diff} onClick={() => startGame(diff)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">
                            {DIFFICULTIES[diff].label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-8">
        <div className="relative">
          {renderBoard}
           {status === 'solved' && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/80 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4">
              <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
                <h2 className="text-4xl font-bold text-amber-400 mb-4">You Win!</h2>
                <p className="text-lg text-neutral-400 mb-6">Completed in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</p>
                <button onClick={() => setStatus('menu')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">
                  New Game
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs lg:w-48">
          <div className="flex justify-between bg-slate-900 p-2 rounded-lg border border-slate-700">
            <div className="text-center px-2">
                <div className="text-sm text-neutral-400">Time</div>
                <div className="text-xl font-bold font-mono">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
            </div>
            <div className="text-center px-2">
                <div className="text-sm text-neutral-400">Errors</div>
                <div className="text-xl font-bold font-mono text-rose-500">{errors}</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
                <button 
                  key={i + 1}
                  onClick={() => handleNumberInput(i + 1)}
                  className="h-12 bg-slate-800 hover:bg-slate-700 rounded-md text-2xl font-bold flex items-center justify-center active:scale-95 transition-colors"
                >
                    {i + 1}
                </button>
            ))}
            <button 
              onClick={() => handleNumberInput(null)}
              className="h-12 bg-slate-800 hover:bg-slate-700 rounded-md text-xl font-bold flex items-center justify-center active:scale-95 transition-colors col-span-5"
            >
              Erase
            </button>
          </div>
           <button onClick={() => setStatus('menu')} className="w-full bg-slate-700 hover:bg-slate-600 text-neutral-50 font-bold py-2 px-4 rounded-md transition-all duration-200 active:scale-95">
                Main Menu
            </button>
        </div>
      </div>
    </div>
  );
};

export default SudokuScreen;
