import React from 'react';
import type { TileType } from '../types';
import Tile from './Tile';
import { GRID_SIZE } from '../constants';

interface GameBoardProps {
  tiles: TileType[];
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles }) => {
  return (
    <div className="relative bg-slate-700 p-2 sm:p-4 rounded-md shadow-lg border border-slate-700" style={{ touchAction: 'none' }}>
      <div className={`grid grid-cols-4 gap-2 sm:gap-4`}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div key={i} className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-600 rounded-md" />
        ))}
      </div>
      <div className="tile-container absolute top-0 left-0 right-0 bottom-0 p-2 sm:p-4">
        {tiles.map(tile => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;