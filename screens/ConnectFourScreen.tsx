import React, { useState, useCallback, useMemo } from 'react';

const ROWS = 6;
const COLS = 7;
const PLAYER_1 = 'R'; // Red
const PLAYER_2 = 'Y'; // Yellow
type Player = 'R' | 'Y';

const createEmptyBoard = (): (Player | null)[][] => {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
};

const checkWin = (boardToCheck: (Player | null)[][]): { winner: Player; line: [number, number][] } | null => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const player = boardToCheck[r][c];
      if (player === null) continue;
      // Horizontal
      if (c + 3 < COLS && player === boardToCheck[r][c+1] && player === boardToCheck[r][c+2] && player === boardToCheck[r][c+3]) {
        return { winner: player, line: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
      }
      // Vertical
      if (r + 3 < ROWS && player === boardToCheck[r+1][c] && player === boardToCheck[r+2][c] && player === boardToCheck[r+3][c]) {
        return { winner: player, line: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
      }
      // Diagonal /
      if (r + 3 < ROWS && c + 3 < COLS && player === boardToCheck[r+1][c+1] && player === boardToCheck[r+2][c+2] && player === boardToCheck[r+3][c+3]) {
        return { winner: player, line: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
      }
      // Diagonal \
      if (r + 3 < ROWS && c - 3 >= 0 && player === boardToCheck[r+1][c-1] && player === boardToCheck[r+2][c-2] && player === boardToCheck[r+3][c-3]) {
        return { winner: player, line: [[r,c], [r+1,c-1], [r+2,c-2], [r+3,c-3]] };
      }
    }
  }
  return null;
};


const ConnectFourScreen: React.FC = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(PLAYER_1);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'draw'>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][]>([]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_1);
    setGameState('playing');
    setWinner(null);
    setWinningLine([]);
  }, []);

  const handleColumnClick = useCallback((col: number) => {
    if (gameState !== 'playing' || board[0][col]) return;

    const newBoard = board.map(r => [...r]);
    let row = ROWS - 1;
    while (row >= 0) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = currentPlayer;
        break;
      }
      row--;
    }
    
    setBoard(newBoard);
    
    const winResult = checkWin(newBoard);
    if (winResult) {
      setGameState('won');
      setWinner(winResult.winner);
      setWinningLine(winResult.line);
    } else if (newBoard.every(r => r.every(cell => cell !== null))) {
      setGameState('draw');
    } else {
      setCurrentPlayer(currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1);
    }
  }, [board, currentPlayer, gameState]);

  const statusMessage = useMemo(() => {
    if (gameState === 'won') {
      return `Player ${winner === PLAYER_1 ? '1' : '2'} Wins!`;
    }
    if (gameState === 'draw') {
      return "It's a Draw!";
    }
    return `Player ${currentPlayer === PLAYER_1 ? '1' : '2'}'s Turn`;
  }, [gameState, winner, currentPlayer]);

  const playerColorClass = currentPlayer === PLAYER_1 ? 'bg-rose-500' : 'bg-yellow-400';
  const winnerColorClass = winner === PLAYER_1 ? 'text-rose-400' : 'text-yellow-400';

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="text-center mb-6">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${gameState === 'won' ? winnerColorClass : 'text-neutral-300'}`}>
            {statusMessage}
        </h2>
      </div>

      <div className="relative bg-blue-900/50 p-3 rounded-2xl shadow-2xl border-2 border-blue-500/50"
        onMouseLeave={() => setHoverColumn(null)}
      >
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: COLS }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-10 sm:h-12 flex items-center justify-center cursor-pointer ${gameState === 'playing' ? 'hover:bg-blue-800/50' : ''} rounded-t-lg`}
              onMouseEnter={() => gameState === 'playing' && setHoverColumn(colIndex)}
              onClick={() => handleColumnClick(colIndex)}
            >
              {hoverColumn === colIndex && gameState === 'playing' && (
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-50 ${playerColorClass}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 bg-blue-800 rounded-lg">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWinning = winningLine.some(([wr, wc]) => wr === r && wc === c);
              const dropDistance = `-${(r + 2) * 52}px`;

              return (
                <div key={`${r}-${c}`} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center p-1">
                  <div className={`w-full h-full rounded-full transition-all duration-300 bg-slate-900`}>
                    {cell && (
                      <div 
                        className={`w-full h-full rounded-full ${cell === PLAYER_1 ? 'bg-rose-500' : 'bg-yellow-400'} animate-drop-in ${isWinning ? 'animate-pulse-win' : ''}`}
                        // FIX: Cast the 'style' object to 'React.CSSProperties' to allow the use of CSS custom properties ('--drop-distance') and resolve the TypeScript error.
                        style={{ '--drop-distance': dropDistance } as React.CSSProperties}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(gameState === 'won' || gameState === 'draw') && (
        <button
          onClick={resetGame}
          className="mt-10 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all duration-200 text-lg active:scale-95 animate-fade-in"
        >
          Play Again
        </button>
      )}
    </div>
  );
};

export default ConnectFourScreen;