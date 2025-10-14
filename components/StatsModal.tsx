import React, { useState, useEffect } from 'react';

interface StatsModalProps {
  onClose: () => void;
  highestTile: number;
  gamesWon: number;
  winStreak: number;
}

const AnimatedStatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        // No animation needed if the target value is 0
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        let startTimestamp: number | null = null;
        const duration = 750; // A consistent duration feels polished

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // easeOutCubic function for a smooth slowdown effect
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(easedProgress * value);
            
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [value]); // Re-animate if the value changes

    return (
        <div className="bg-slate-800 p-4 rounded-lg text-center transform transition-transform duration-200 hover:scale-105">
            <p className="text-sm text-neutral-400 uppercase font-semibold">{label}</p>
            <p className="text-3xl font-bold text-neutral-50">{displayValue.toLocaleString()}</p>
        </div>
    );
};


const StatsModal: React.FC<StatsModalProps> = ({ onClose, highestTile, gamesWon, winStreak }) => {
  return (
    <div 
      className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 p-6 sm:p-8 rounded-lg shadow-2xl text-left animate-slide-up w-11/12 max-w-md relative border border-slate-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-50 transition-colors text-2xl"
            aria-label="Close stats"
        >
            &times;
        </button>
        <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AnimatedStatItem label="Highest Tile" value={highestTile} />
            <AnimatedStatItem label="Games Won" value={gamesWon} />
            <AnimatedStatItem label="Win Streak" value={winStreak} />
        </div>
        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="bg-sky-400 hover:bg-sky-300 text-slate-900 font-bold py-2 px-6 rounded-md transition-colors duration-200 text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;