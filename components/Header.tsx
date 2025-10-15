
import React, { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  score: number;
  highScore: number;
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const StatBox: React.FC<{ label: string; value: number | string; isAnimating?: boolean }> = ({ label, value, isAnimating = false }) => (
  <div className="bg-slate-900 p-2 sm:px-4 rounded-md text-center border border-slate-700 min-w-[6rem]">
    <div className="text-sm text-neutral-400 uppercase font-semibold">{label}</div>
    <div className={`text-2xl font-bold text-neutral-50 ${isAnimating ? 'animate-score-update' : ''}`}>
      {value}
    </div>
  </div>
);

const Header: React.FC<HeaderProps> = ({ score, highScore, onNewGame, onUndo, canUndo }) => {
  const [isAnimatingScore, setIsAnimatingScore] = useState(false);
  const [isAnimatingHighScore, setIsAnimatingHighScore] = useState(false);
  const prevScoreRef = useRef(score);
  const prevHighScoreRef = useRef(highScore);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      setIsAnimatingScore(true);
      const timer = setTimeout(() => setIsAnimatingScore(false), 400);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (highScore > prevHighScoreRef.current) {
      setIsAnimatingHighScore(true);
      const timer = setTimeout(() => setIsAnimatingHighScore(false), 400);
      return () => clearTimeout(timer);
    }
    prevHighScoreRef.current = highScore;
  }, [highScore]);

  return (
    <header className="w-full flex flex-col sm:flex-row justify-between sm:items-center text-center sm:text-left mb-4 max-w-sm sm:max-w-md">
      <div className="flex flex-col mb-4 sm:mb-0">
        <h1 className="text-4xl sm:text-6xl font-bold text-neutral-50">2048</h1>
        <p className="text-neutral-400 mt-1">Join numbers, get to <strong>2048!</strong></p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-center gap-2">
          <StatBox label="Score" value={score} isAnimating={isAnimatingScore} />
          <StatBox label="Best" value={highScore} isAnimating={isAnimatingHighScore} />
        </div>
        <div className="flex justify-center gap-2 w-full">
           <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-neutral-50 font-bold py-2 px-4 rounded-md text-sm transition-all duration-200 disabled:bg-slate-800 disabled:text-neutral-500 disabled:cursor-not-allowed active:scale-95"
          >
            Undo
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-4 rounded-md text-sm transition-all duration-200 active:scale-95"
          >
            New
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
