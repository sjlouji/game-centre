
import React, { useState } from 'react';

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ score, onRestart }) => {
  const [shareText, setShareText] = useState('Share');

  const handleShare = () => {
    const message = `I scored ${score} in 2048! Can you beat it? #ReactGameCenter`;
    navigator.clipboard.writeText(message).then(() => {
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    }).catch(err => {
      console.error('Failed to copy score: ', err);
      alert('Failed to copy score.');
    });
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4">
      <div className="bg-slate-900 p-6 sm:p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700 w-full max-w-sm">
        <h2 className="text-4xl sm:text-5xl font-bold text-rose-400 mb-4">Game Over!</h2>
        <p className="text-lg text-neutral-400 mb-1">Final Score:</p>
        <p className="text-3xl font-bold text-neutral-50 mb-6">{score}</p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onRestart}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95"
          >
            Try Again
          </button>
          <button
            onClick={handleShare}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold py-2 px-6 rounded-md transition-all duration-200 text-base active:scale-95"
          >
            {shareText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverOverlay;