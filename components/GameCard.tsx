import React from 'react';
import type { GameCategory } from '../lib/games';

interface GameCardProps {
  title: string;
  description: string;
  visual: React.ReactNode;
  status: 'available' | 'coming-soon';
  categories: GameCategory[];
}

const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(({ title, description, visual, status, categories }, ref) => {
  const isAvailable = status === 'available';

  return (
    <div
      ref={ref}
      className={`game-card group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-lg h-full flex flex-col ${
        isAvailable ? 'cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-2 hover:border-cyan-500/50' : 'cursor-default'
      } ${status === 'coming-soon' ? 'game-card-coming-soon' : ''}`}
    >
      {status === 'coming-soon' && (
        <div className="absolute top-2 right-2 bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full z-30">
          SOON
        </div>
      )}
      <div className="game-card-visual h-40 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="z-10 transform transition-transform duration-300 group-hover:scale-110">
            {visual}
        </div>
        {status === 'coming-soon' && (
           <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-20"></div>
        )}
      </div>
      <div className="p-4 text-left flex flex-col flex-grow">
        <h2 className="text-2xl font-bold text-sky-400 mb-2">{title}</h2>
        <div className="flex flex-wrap gap-2 mb-2">
            {categories.map(category => (
              <span key={category} className="px-2.5 py-1 bg-slate-800 text-sky-400 text-xs font-semibold rounded-full">
                {category}
              </span>
            ))}
        </div>
        <p className="text-neutral-400 text-sm mb-4 h-10">{description}</p>
        <div className="flex-grow"></div>
        <button
          disabled={!isAvailable}
          tabIndex={-1} // The link handles focus
          className="w-full mt-auto text-slate-900 font-bold py-3 px-8 rounded-md transition-transform group-hover:scale-105 active:scale-95 disabled:transform-none bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          {isAvailable ? 'Play' : 'Coming Soon'}
        </button>
      </div>
    </div>
  );
});

GameCard.displayName = 'GameCard';

export default GameCard;