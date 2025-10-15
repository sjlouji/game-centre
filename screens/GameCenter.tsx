import React, { useState } from 'react';
import type { Game, GameId } from '../lib/games';
import GameCard from '../components/GameCard';

interface GameCenterProps {
  games: Game[];
  onSelectGame: (gameId: GameId) => void;
}

type FilterType = 'all' | 'available' | 'coming-soon';

const GameCenter: React.FC<GameCenterProps> = ({ games, onSelectGame }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredGames = games.filter(game => {
    if (activeFilter === 'available') return game.status === 'available';
    if (activeFilter === 'coming-soon') return game.status === 'coming-soon';
    return true;
  });

  const FilterButton: React.FC<{ filter: FilterType; label: string }> = ({ filter, label }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
        activeFilter === filter
          ? 'bg-sky-500 text-slate-900 shadow-lg shadow-sky-500/30'
          : 'bg-slate-800 text-neutral-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-start w-full pt-4 sm:pt-0 animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center text-gradient font-heading tracking-tight">
        Choose Your Challenge
      </h1>
      <p className="text-neutral-400 mb-10 sm:mb-12 text-center max-w-lg">
        A collection of fun, addictive web games - simple to play, impossible to put down, and always evolving with new challenges!
      </p>

      <div className="w-full max-w-4xl text-center">
          <div className="mb-8 flex justify-center items-center">
              <div className="flex items-center gap-2">
                  <FilterButton filter="all" label="All" />
                  <FilterButton filter="available" label="Available" />
                  <FilterButton filter="coming-soon" label="Coming Soon" />
              </div>
          </div>
        <div key={activeFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left animate-fade-in">
          {filteredGames.map(game => {
            const isAvailable = game.status === 'available';
            return (
              <div onClick={isAvailable ? () => onSelectGame(game.id) : undefined} key={game.id} className="block h-full">
                  <GameCard
                    title={game.title}
                    description={game.description}
                    visual={game.visual}
                    status={game.status}
                  />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameCenter;