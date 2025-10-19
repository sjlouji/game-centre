
import React, { useState, useEffect, useCallback } from 'react';

// --- Constants ---
const ICONS = ['🧠', '🕹️', '👾', '🚀', '⭐', '🍕', '🤖', '👻', '🔥', '💡'];
const GRID_SIZE = 4; // 4x4 grid
const PAIRS_COUNT = (GRID_SIZE * GRID_SIZE) / 2;

// --- Types ---
type Card = {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
};

// --- Helper Functions ---
const shuffleArray = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
};

const generateCards = (): Card[] => {
  const selectedIcons = ICONS.slice(0, PAIRS_COUNT);
  const cardIcons = shuffleArray([...selectedIcons, ...selectedIcons]);
  return cardIcons.map((icon, index) => ({
    id: index,
    icon,
    isFlipped: false,
    isMatched: false,
  }));
};

const MemoryMatchScreen: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(generateCards());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const resetGame = useCallback(() => {
    setCards(generateCards());
    setFlippedIndices([]);
    setMoves(0);
    setIsChecking(false);
    setIsWon(false);
  }, []);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.icon === secondCard.icon) {
        // It's a match
        setCards(prevCards =>
          prevCards.map(card =>
            card.icon === firstCard.icon ? { ...card, isMatched: true } : card
          )
        );
        setFlippedIndices([]);
        setIsChecking(false);
      } else {
        // Not a match
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map((card, index) =>
              index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
      setMoves(m => m + 1);
    }
  }, [flippedIndices, cards]);

  useEffect(() => {
    const allMatched = cards.every(card => card.isMatched);
    if (allMatched && cards.length > 0) {
      setTimeout(() => setIsWon(true), 500);
    }
  }, [cards]);

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    setCards(prevCards =>
      prevCards.map((card, i) => (i === index ? { ...card, isFlipped: true } : card))
    );
    setFlippedIndices(prev => [...prev, index]);
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="w-full max-w-md flex justify-between items-center mb-6 px-2">
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-300 font-heading">Memory Match</h2>
        <div className="bg-slate-900 p-2 px-4 rounded-md text-center">
            <div className="text-sm text-neutral-400">MOVES</div>
            <div className="text-3xl font-bold">{moves}</div>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`memory-card aspect-square ${card.isFlipped ? 'flipped' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center justify-center transition-colors">
                  {/* Front design can go here */}
                </div>
                <div
                  className={`memory-card-back flex items-center justify-center text-4xl sm:text-5xl ${card.isMatched ? 'bg-emerald-600 animate-match' : 'bg-sky-600'}`}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isWon && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/80 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4">
            <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
              <h2 className="text-4xl font-bold text-amber-400 mb-4">You Win!</h2>
              <p className="text-lg text-neutral-400 mb-6">You found all pairs in {moves} moves!</p>
              <button
                onClick={resetGame}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
       <button onClick={resetGame} className="mt-8 bg-slate-700 hover:bg-slate-600 text-neutral-50 font-bold py-2 px-6 rounded-md transition-all duration-200 active:scale-95">
          Reset Game
        </button>
    </div>
  );
};

export default MemoryMatchScreen;
