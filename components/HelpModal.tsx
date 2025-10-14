
import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
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
            className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-50 transition-colors text-2xl active:scale-95"
            aria-label="Close help"
        >
            &times;
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-400 mb-3 sm:mb-4">How to Play</h2>
        <div className="space-y-3 sm:space-y-4 text-neutral-400">
            <p>
                The objective of the game is to combine numbered tiles to reach the <strong>2048 tile</strong>.
            </p>
            <div>
                <h3 className="font-bold text-neutral-50 mb-1">Controls:</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Desktop:</strong> Use your <kbd className="font-sans bg-slate-700 text-neutral-400 rounded px-1.5 py-0.5">Arrow Keys</kbd> to move the tiles.</li>
                    <li><strong>Mobile:</strong> <strong>Swipe</strong> Up, Down, Left, or Right to move the tiles.</li>
                </ul>
            </div>
            <p>
                When two tiles with the same number touch, they <strong>merge into one</strong> with their values added together!
            </p>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="bg-sky-400 hover:bg-sky-300 text-slate-900 font-bold py-2 px-6 rounded-md transition-all duration-200 text-lg active:scale-95"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;