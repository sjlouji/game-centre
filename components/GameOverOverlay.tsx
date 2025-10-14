
import React from 'react';

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ score, onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50">
      <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
        <h2 className="text-5xl font-bold text-rose-400 mb-4">Game Over!</h2>
        <p className="text-lg text-neutral-400 mb-1">Final Score:</p>
        <p className="text-3xl font-bold text-neutral-50 mb-6">{score}</p>
        <button
          onClick={onRestart}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-colors duration-200 text-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default GameOverOverlay;