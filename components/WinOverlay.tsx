
import React from 'react';

interface WinOverlayProps {
  onContinue: () => void;
  onNewGame: () => void;
}

const WinOverlay: React.FC<WinOverlayProps> = ({ onContinue, onNewGame }) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50">
      <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
        <h2 className="text-5xl font-bold text-amber-400 mb-4">You Win!</h2>
        <p className="text-lg text-neutral-400 mb-6">You've reached the 2048 tile!</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onContinue}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold py-3 px-6 rounded-md transition-colors duration-200 text-lg"
          >
            Keep Going
          </button>
          <button
            onClick={onNewGame}
            className="bg-slate-400 hover:bg-slate-300 text-slate-900 font-bold py-3 px-6 rounded-md transition-colors duration-200 text-lg"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinOverlay;