
import React, { useState, useEffect } from 'react';

interface StatsModalProps {
  onClose: () => void;
  highestTile: number;
  gamesWon: number;
  winStreak: number;
  achievements: Set<number>;
}

const getTileStyles = (value: number) => {
  const baseStyle = "flex items-center justify-center font-bold rounded-md w-full h-full text-xs sm:text-sm";
  const textColor = value <= 4 ? "text-stone-700" : "text-white";
  
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
  return `${baseStyle} ${textColor} ${backgroundColor}`;
};

const LockIcon: React.FC = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);


const AchievementBadge: React.FC<{ value: number; unlocked: boolean }> = ({ value, unlocked }) => {
    const tileStyle = getTileStyles(value);
    return (
        <div className="flex flex-col items-center gap-1 text-center">
            <div
                className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-md flex items-center justify-center transition-all duration-500 ${unlocked ? 'opacity-100 scale-100' : 'opacity-50 scale-90 bg-slate-700'}`}
            >
                {unlocked ? (
                    <div className={`${tileStyle}`}>{value}</div>
                ) : (
                   <LockIcon />
                )}
            </div>
            <p className={`text-xs font-semibold ${unlocked ? 'text-neutral-200' : 'text-neutral-500'}`}>
                {value} Tile
            </p>
        </div>
    );
};


const AnimatedStatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        let startTimestamp: number | null = null;
        const duration = 750;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(easedProgress * value);
            
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [value]);

    return (
        <div className="bg-slate-800 p-4 rounded-lg text-center transform transition-transform duration-200 hover:scale-105">
            <p className="text-sm text-neutral-400 uppercase font-semibold">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-neutral-50">{displayValue.toLocaleString()}</p>
        </div>
    );
};


const StatsModal: React.FC<StatsModalProps> = ({ onClose, highestTile, gamesWon, winStreak, achievements }) => {
  const achievementTiers = [512, 1024, 2048, 4096, 8192];
  
  return (
    <div 
      className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 p-6 sm:p-8 rounded-lg shadow-2xl text-left animate-slide-up w-11/12 max-w-md relative border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-50 transition-colors text-2xl active:scale-95"
            aria-label="Close stats"
        >
            &times;
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-400 mb-4 sm:mb-6 text-center">Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AnimatedStatItem label="Highest Tile" value={highestTile} />
            <AnimatedStatItem label="Games Won" value={gamesWon} />
            <AnimatedStatItem label="Win Streak" value={winStreak} />
        </div>
        
        <div className="mt-8">
            <h3 className="text-lg sm:text-xl font-bold text-sky-400 mb-3 sm:mb-4 text-center">Achievements</h3>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 bg-slate-800/50 p-2 sm:p-4 rounded-lg">
                {achievementTiers.map(tier => (
                    <AchievementBadge key={tier} value={tier} unlocked={achievements.has(tier)} />
                ))}
            </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="bg-sky-400 hover:bg-sky-300 text-slate-900 font-bold py-2 px-6 rounded-md transition-all duration-200 text-lg active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;