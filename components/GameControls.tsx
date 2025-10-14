import React from 'react';

interface GameControlsProps {
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onHelp: () => void;
  onStats: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ onNewGame, onUndo, canUndo, onHelp, onStats }) => {
  return (
    <div className="w-full flex justify-center items-center gap-2 sm:gap-4 mt-4 sm:mt-8 max-w-sm sm:max-w-md">
      <button
        onClick={onStats}
        className="border border-slate-700 bg-slate-900 hover:bg-slate-800 text-neutral-50 font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200"
      >
        Stats
      </button>
      <button
        onClick={onHelp}
        className="border border-slate-700 bg-slate-900 hover:bg-slate-800 text-neutral-50 font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200"
      >
        Help
      </button>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="border border-slate-700 bg-slate-900 hover:bg-slate-800 text-neutral-50 font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 disabled:bg-slate-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
      >
        Undo
      </button>
      <button
        onClick={onNewGame}
        className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200"
      >
        New Game
      </button>
    </div>
  );
};

export default GameControls;
