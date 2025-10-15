import React from 'react';
import type { TileType } from '../lib/types';

interface TileProps {
  tile: TileType;
}

const getTileStyles = (value: number) => {
  const baseStyle = "flex items-center justify-center font-bold rounded-md w-full h-full";
  const textColor = value <= 4 ? "text-stone-700" : "text-white";
  const fontSize = value < 100 ? 'text-3xl sm:text-5xl' : value < 1000 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl';

  let backgroundColor = 'bg-yellow-600'; // Default
  switch (value) {
    case 2:    backgroundColor = 'bg-stone-200'; break;
    case 4:    backgroundColor = 'bg-stone-300'; break;
    case 8:    backgroundColor = 'bg-orange-300'; break;
    case 16:   backgroundColor = 'bg-orange-400'; break;
    case 32:   backgroundColor = 'bg-orange-500'; break;
    case 64:   backgroundColor = 'bg-red-500'; break;
    case 128:  backgroundColor = 'bg-yellow-300'; break;
    case 256:  backgroundColor = 'bg-yellow-400'; break;
    case 512:  backgroundColor = 'bg-yellow-500'; break;
    case 1024: backgroundColor = 'bg-yellow-500'; break;
    case 2048: backgroundColor = 'bg-yellow-600'; break;
    default:   backgroundColor = 'bg-emerald-600'; break;
  }
  return `${baseStyle} ${textColor} ${fontSize} ${backgroundColor}`;
};


const Tile: React.FC<TileProps> = ({ tile }) => {
  const { value, row, col, isNew, isMerged, isReverted } = tile;
  // Using a single, unified color palette for both themes for a classic look
  const tileStyle = getTileStyles(value);
  const animationClasses = isNew
    ? 'animate-spawn'
    : isReverted
    ? 'animate-undo'
    : '';
  
  const positionStyle: React.CSSProperties = {
    transform: `translate(calc(${col} * (100% + var(--tile-gap))), calc(${row} * (100% + var(--tile-gap))))`,
    transition: 'transform 0.1s ease-out',
    zIndex: isMerged ? 10 : 1,
  };

  return (
    <div 
      className="absolute w-16 h-16 sm:w-24 sm:h-24"
      style={positionStyle}
    >
      <div className={`${tileStyle} ${animationClasses} ${isMerged ? 'animate-merge' : ''}`}>
        {value}
      </div>
    </div>
  );
};

export default Tile;
