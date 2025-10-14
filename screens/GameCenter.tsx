import React from 'react';
import type { Game, GameId } from '../App';
import GameCard from '../components/GameCard';
import FeaturedGameCard from '../components/FeaturedGameCard';

interface GameCenterProps {
  games: Game[];
  onSelectGame: (gameId: GameId) => void;
}

const GameCenter: React.FC<GameCenterProps> = ({ games, onSelectGame }) => {
  const featuredGame = games.length > 0 ? games[0] : null;
  const otherGames = games.length > 1 ? games.slice(1) : [];

  return (
    <div className="flex flex-col items-center justify-start w-full pt-4 sm:pt-0">
      {featuredGame && (
         <div className="w-full flex flex-col items-center mb-12 sm:mb-16">
            <FeaturedGameCard game={featuredGame} onPlay={() => onSelectGame(featuredGame.id)} />
         </div>
      )}

      {otherGames.length > 0 && (
        <div className="w-full max-w-5xl">
            <div className="flex items-center mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50">All Games</h2>
                <div className="flex-grow h-px bg-slate-700 ml-6"></div>
            </div>
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