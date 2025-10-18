
import React, { useState } from 'react';

interface WinOverlayProps {
  onContinue: () => void;
  onNewGame: () => void;
}

const WinOverlay: React.FC<WinOverlayProps> = ({ onContinue, onNewGame }) => {
  const [shareText, setShareText] = useState('Share');

  const handleShare = () => {
    const message = `I beat 2048! Time to go for 4096... #GCADE`;
    navigator.clipboard.writeText(message).then(() => {
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    }).catch(err => {
      console.error('Failed to copy message: ', err);
      alert('Failed to copy message.');
    });
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4">
      <div className="bg-slate-900 p-6 sm:p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700 w-full max-w-sm">
        <h2 className="text-4xl sm:text-5xl font-bold text-amber-400 mb-4">You Win!</h2>
        <p className="text-lg text-neutral-400 mb-6">You've reached the 2048 tile!</p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
            <button
              onClick={onContinue}
              className="w-full sm:flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95"
            >
              Keep Going
            </button>
            <button
              onClick={onNewGame}
              className="w-full sm:flex-1 bg-slate-400 hover:bg-slate-300 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95"
            >
              New Game
            </button>
          </div>
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

export default WinOverlay;