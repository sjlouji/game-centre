import React, { useState, useMemo } from 'react';

const WINNING_COMBOS = [
  // Rows
  { combo: [0, 1, 2], class: 'strike-row-1' },
  { combo: [3, 4, 5], class: 'strike-row-2' },
  { combo: [6, 7, 8], class: 'strike-row-3' },
  // Columns
  { combo: [0, 3, 6], class: 'strike-col-1' },
  { combo: [1, 4, 7], class: 'strike-col-2' },
  { combo: [2, 5, 8], class: 'strike-col-3' },
  // Diagonals
  { combo: [0, 4, 8], class: 'strike-diag-1' },
  { combo: [2, 4, 6], class: 'strike-diag-2' },
];

const calculateWinner = (squares: Array<'X' | 'O' | null>) => {
  for (const { combo, class: lineClass } of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: combo, lineClass };
    }
  }
  return null;
};

const TicTacToeScreen: React.FC = () => {
  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const gameResult = useMemo(() => calculateWinner(board), [board]);
  const isBoardFull = board.every(square => square !== null);

  const handleClick = (i: number) => {
    if (gameResult || board[i]) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const getStatus = () => {
    if (gameResult) {
      return `Winner: ${gameResult.winner}`;
    }
    if (isBoardFull) {
      return "It's a Draw!";
    }
    return `Next player: ${xIsNext ? 'X' : 'O'}`;
  };

  const Square = ({ value, onClick, isWinning }: { value: 'X' | 'O' | null; onClick: () => void; isWinning: boolean }) => (
    <button
      className={`w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 flex items-center justify-center rounded-lg shadow-inner transition-all duration-200
        ${isWinning ? 'bg-slate-700' : 'hover:bg-slate-700'}
        ${value === 'X' ? 'text-sky-400' : 'text-rose-400'}`}
      onClick={onClick}
    >
      <span className={`text-6xl sm:text-7xl font-bold font-heading transform transition-transform duration-200 ${value ? 'scale-100' : 'scale-0'}`}>
        {value}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full flex-grow animate-fade-in p-4">
      <style>{`
        .strike {
          position: absolute;
          background-color: #FBBF24;
          height: 8px;
          border-radius: 4px;
          animation: draw-strike 0.4s ease-out forwards;
        }
        @keyframes draw-strike { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes draw-strike-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        
        .strike-row-1 { width: 90%; top: 16.66%; left: 5%; transform-origin: left; }
        .strike-row-2 { width: 90%; top: 50%; left: 5%; transform: translateY(-50%) scaleX(0); transform-origin: left; }
        .strike-row-3 { width: 90%; bottom: 16.66%; left: 5%; transform-origin: left; }
        
        .strike-col-1 { height: 90%; width: 8px; left: 16.66%; top: 5%; transform-origin: top; animation-name: draw-strike-y; }
        .strike-col-2 { height: 90%; width: 8px; left: 50%; top: 5%; transform: translateX(-50%) scaleY(0); transform-origin: top; animation-name: draw-strike-y; }
        .strike-col-3 { height: 90%; width: 8px; right: 16.66%; top: 5%; transform-origin: top; animation-name: draw-strike-y; }

        .strike-diag-1 { width: 120%; top: 50%; left: -10%; transform: translateY(-50%) rotate(45deg) scaleX(0); transform-origin: left; }
        .strike-diag-2 { width: 120%; top: 50%; right: -10%; transform: translateY(-50%) rotate(-45deg) scaleX(0); transform-origin: right; }
      `}</style>
       <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-300 transition-colors duration-300">
          {getStatus()}
        </h2>
      </div>

      <div className="relative grid grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-900 rounded-2xl shadow-2xl">
        {board.map((square, i) => (
          <Square
            key={i}
            value={square}
            onClick={() => handleClick(i)}
            isWinning={gameResult?.line.includes(i) ?? false}
          />
        ))}
        {gameResult && <div className={`strike ${gameResult.lineClass}`}></div>}
      </div>

      {(gameResult || isBoardFull) && (
        <button
          onClick={handleRestart}
          className="mt-10 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all duration-200 text-lg active:scale-95 animate-fade-in"
        >
          Play Again
        </button>
      )}
    </div>
  );
};

export default TicTacToeScreen;