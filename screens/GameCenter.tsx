import React from 'react';
import type { Game, GameId } from '../App';
import GameCard from '../components/GameCard';

interface GameCenterProps {
  games: Game[];
  onSelectGame: (gameId: GameId) => void;
}

const FeaturedGameCard: React.FC<{ game: Game; onPlay: () => void }> = ({ game, onPlay }) => (
  <div
    className="featured-card group w-full max-w-4xl bg-slate-900 rounded-xl flex flex-col sm:flex-row items-center overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-slate-700"
    onClick={onPlay}
  >
    <div className="game-card-visual w-full sm:w-1/2 h-56 sm:h-64 flex items-center justify-center p-4 relative">
        <div className="z-10 transform transition-transform duration-300 group-hover:scale-110">
            {game.visual}
        </div>
    </div>
    <div className="p-6 sm:p-8 text-center sm:text-left w-full sm:w-1/2">
        <h2 className="text-3xl sm:text-4xl font-bold text-sky-400 mb-2">{game.title}</h2>
        <p className="text-neutral-400 text-base mb-6 h-12">{game.description}</p>
        <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-10 rounded-md transition-transform hover:scale-105">
          Play Now
        </button>
    </div>
  </div>
);


const GameCenter: React.FC<GameCenterProps> = ({ games, onSelectGame }) => {
  const featuredGame = games.length > 0 ? games[0] : null;
  const otherGames = games.length > 1 ? games.slice(1) : [];

  return (
    <div className="flex flex-col items-center justify-start w-full pt-4 sm:pt-8">
      {featuredGame && (
         <div className="w-full flex flex-col items-center mb-10 sm:mb-16">
            <FeaturedGameCard game={featuredGame} onPlay={() => onSelectGame(featuredGame.id)} />
         </div>
      )}

      {otherGames.length > 0 && (
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-50 mb-6 sm:mb-8 text-left">All Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {otherGames.map(game => (
              <GameCard
                key={game.id}
                title={game.title}
                description={game.description}
                visual={game.visual}
                status={game.status}
                onPlay={() => onSelectGame(game.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCenter;