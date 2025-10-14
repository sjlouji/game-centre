import React from 'react';

interface GameCardProps {
  title: string;
  description: string;
  visual: React.ReactNode;
  status: 'available' | 'coming-soon';
  onPlay: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, visual, status, onPlay }) => {
  const isAvailable = status === 'available';

  return (
    <div
      className={`game-card group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-lg ${
        isAvailable ? 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1' : 'cursor-default'
      } ${status === 'coming-soon' ? 'game-card-coming-soon' : ''}`}
      onClick={isAvailable ? onPlay : undefined}
    >
      {status === 'coming-soon' && (
        <div className="absolute top-2 right-2 bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full z-10">
          SOON
        </div>
      )}
      <div className="game-card-visual h-40 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="z-10 transform transition-transform duration-300 group-hover:scale-110">
            {visual}
        </div>
      </div>
      <div className="p-4 text-left">
        <h2 className="text-2xl font-bold text-sky-400 mb-2">{title}</h2>
        <p className="text-neutral-400 text-sm mb-4 h-10">{description}</p>
        <button
          disabled={!isAvailable}
          className="w-full text-slate-900 font-bold py-3 px-8 rounded-md transition-transform hover:scale-105 disabled:transform-none bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          {isAvailable ? 'Play' : 'Coming Soon'}
        </button>
      </div>
    </div>
  );
};

export default GameCard;