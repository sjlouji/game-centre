import React from 'react';
import { useRouter } from 'next/router';
import GameCenter from '../screens/GameCenter';
import { GAMES, type GameId } from '../lib/games';

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleSelectGame = (gameId: GameId) => {
    router.push(`/${gameId}`);
  };

  return <GameCenter games={GAMES} onSelectGame={handleSelectGame} />;
};

export default HomePage;
