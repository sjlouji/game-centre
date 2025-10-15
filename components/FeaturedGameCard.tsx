import React from 'react';
import type { Game } from '../lib/games';

interface FeaturedGameCardProps {
  game: Game;
}

const FeaturedGameCard: React.FC<FeaturedGameCardProps> = ({ game }) => {
  const className = "featured-card group relative w-full max-w-5xl bg-slate-900 rounded-xl flex flex-col sm:flex-row items-center overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-[1.02] hover:border-sky-500/50 border border-slate-700";

  return (
    <div className={className}>
        {/* Background Gradient Decoration */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500 via-slate-900 to-slate-900"></div>
        
        <div className="w-full sm:w-2/5 h-56 sm:h-auto sm:self-stretch flex items-center justify-center p-4 relative">
            <div className="z-10 transform transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                {game.visual}
            </div>
        </div>
        <div className="relative p-6 sm:p-10 text-center sm:text-left w-full sm:w-3/5">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest mb-1">Featured Game</h3>
            <h2 className="text-4xl sm:text-5xl font-bold text-neutral-50 mb-3">{game.title}</h2>
            <p className="text-neutral-400 text-base mb-8 h-12">{game.description}</p>
            <button tabIndex={-1} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-12 rounded-lg transition-transform group-hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/30">
              Play Now
            </button>
        </div>
    </div>
  );
};

export default FeaturedGameCard;