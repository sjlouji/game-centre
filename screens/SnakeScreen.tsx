
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swipeable from '../components/Swipeable';

// --- Constants ---
const GRID_SIZE = 20;
const BOARD_WIDTH_CELLS = 25;
const BOARD_HEIGHT_CELLS = 25;
const CANVAS_WIDTH = GRID_SIZE * BOARD_WIDTH_CELLS;
const CANVAS_HEIGHT = GRID_SIZE * BOARD_HEIGHT_CELLS;
const INITIAL_SPEED_MS = 160;
const MIN_SPEED_MS = 50;
const SPEED_INCREMENT = 5;

// --- Types ---
type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'playing' | 'gameOver';
type Animation = { pos: Position; progress: number; };

// --- Helper Functions ---
const getRandomPosition = (snake: Position[]): Position => {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * BOARD_WIDTH_CELLS),
      y: Math.floor(Math.random() * BOARD_HEIGHT_CELLS),
    };
  } while (snake.some(segment => segment.x === position.x && segment.y === position.y));
  return position;
};

const SnakeScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const timeAccumulator = useRef<number>(0);

  // --- Game State Refs ---
  const snake = useRef<Position[]>([{ x: 12, y: 12 }]);
  const food = useRef<Position>(getRandomPosition(snake.current));
  const direction = useRef<Direction>('RIGHT');
  const inputQueue = useRef<Direction[]>([]);
  const speed = useRef(INITIAL_SPEED_MS);
  const gameState = useRef<GameStatus>('playing');
  const score = useRef(0);
  
  // --- Animation State Refs ---
  const foodEatAnim = useRef<Animation | null>(null);
  const newFoodAnim = useRef<Animation | null>(null);
  const gameOverAnim = useRef<number>(0); // Progress from 0 to 1

  // --- React State for UI ---
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake-highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
  }, []);

  const resetGame = useCallback(() => {
    snake.current = [{ x: 12, y: 12 }];
    food.current = getRandomPosition(snake.current);
    direction.current = 'RIGHT';
    inputQueue.current = [];
    speed.current = INITIAL_SPEED_MS;
    score.current = 0;
    setCurrentScore(0);
    gameState.current = 'playing';
    setShowGameOverModal(false);
    foodEatAnim.current = null;
    newFoodAnim.current = null;
    gameOverAnim.current = 0;
    lastUpdateTime.current = performance.now();
    timeAccumulator.current = 0;
  }, []);
  
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastUpdateTime.current;
    lastUpdateTime.current = timestamp;

    if (gameState.current === 'playing') {
        timeAccumulator.current += deltaTime;
        if (timeAccumulator.current >= speed.current) {
            moveSnake();
            timeAccumulator.current = 0;
        }
    } else if (gameState.current === 'gameOver') {
        if (gameOverAnim.current < 1) {
            gameOverAnim.current = Math.min(1, gameOverAnim.current + deltaTime / 500); // 500ms animation
        } else if (!showGameOverModal) {
            if (score.current > highScore) {
                setHighScore(score.current);
                localStorage.setItem('snake-highscore', score.current.toString());
            }
            setShowGameOverModal(true);
        }
    }

    // Update animations
    if (foodEatAnim.current) {
        foodEatAnim.current.progress -= deltaTime / 200; // 200ms animation
        if (foodEatAnim.current.progress <= 0) foodEatAnim.current = null;
    }
    if (newFoodAnim.current) {
        newFoodAnim.current.progress += deltaTime / 200; // 200ms animation
        if (newFoodAnim.current.progress >= 1) newFoodAnim.current = null;
    }

    draw();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [highScore, showGameOverModal]);

  useEffect(() => {
    resetGame();
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [resetGame, gameLoop]);

  const moveSnake = () => {
    // Process input
    if (inputQueue.current.length > 0) {
      const nextDir = inputQueue.current.shift()!;
      const currentDir = direction.current;
      if (
        !((currentDir === 'UP' && nextDir === 'DOWN') || (currentDir === 'DOWN' && nextDir === 'UP') ||
          (currentDir === 'LEFT' && nextDir === 'RIGHT') || (currentDir === 'RIGHT' && nextDir === 'LEFT'))
      ) {
        direction.current = nextDir;
      }
    }

    const newSnake = [...snake.current];
    const head = { ...newSnake[0] };

    switch (direction.current) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }
    
    // Wall collision
    if (head.x < 0 || head.x >= BOARD_WIDTH_CELLS || head.y < 0 || head.y >= BOARD_HEIGHT_CELLS) {
      gameState.current = 'gameOver'; return;
    }
    // Self collision
    for (let i = 1; i < newSnake.length; i++) {
      if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
        gameState.current = 'gameOver'; return;
      }
    }

    newSnake.unshift(head);

    // Food collision
    if (head.x === food.current.x && head.y === food.current.y) {
      score.current += 1;
      setCurrentScore(score.current);
      foodEatAnim.current = { pos: food.current, progress: 1 };
      food.current = getRandomPosition(newSnake);
      newFoodAnim.current = { pos: food.current, progress: 0 };
      speed.current = Math.max(MIN_SPEED_MS, speed.current - SPEED_INCREMENT);
    } else {
      newSnake.pop();
    }
    snake.current = newSnake;
  };

  const changeDirection = useCallback((newDir: Direction) => {
    if (inputQueue.current.length < 2) {
      inputQueue.current.push(newDir);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp': changeDirection('UP'); break;
        case 'ArrowDown': changeDirection('DOWN'); break;
        case 'ArrowLeft': changeDirection('LEFT'); break;
        case 'ArrowRight': changeDirection('RIGHT'); break;
        case ' ': if (gameState.current === 'gameOver' && showGameOverModal) resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, resetGame, showGameOverModal]);
  
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#1e293b'; // slate-800
    for (let i = 0; i <= BOARD_WIDTH_CELLS; i++) { ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, CANVAS_HEIGHT); ctx.stroke(); }
    for (let i = 0; i <= BOARD_HEIGHT_CELLS; i++) { ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(CANVAS_WIDTH, i * GRID_SIZE); ctx.stroke(); }

    // Draw snake
    snake.current.forEach((segment, index) => {
      if (gameState.current === 'gameOver') {
        const flash = Math.floor(gameOverAnim.current * 10) % 2 === 0;
        ctx.fillStyle = flash ? '#f87171' : '#fff'; // rose-400
      } else {
        ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
      }
      
      let size = GRID_SIZE;
      let offset = 0;
      if (index === 0 && foodEatAnim.current) {
        const pulse = 1 + Math.sin(foodEatAnim.current.progress * Math.PI) * 0.4;
        size = GRID_SIZE * pulse;
        offset = (GRID_SIZE - size) / 2;
      }
      ctx.fillRect(segment.x * GRID_SIZE + offset, segment.y * GRID_SIZE + offset, size, size);
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(segment.x * GRID_SIZE + offset, segment.y * GRID_SIZE + offset, size, size);
    });

    // Draw food and animations
    if (newFoodAnim.current) {
      ctx.fillStyle = '#fb7185';
      const p = newFoodAnim.current.progress;
      const scale = Math.sin(p * Math.PI) * 0.5 + 0.5; // Simple pop-in
      ctx.beginPath();
      ctx.arc( food.current.x * GRID_SIZE + GRID_SIZE / 2, food.current.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2.5 * scale, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc( food.current.x * GRID_SIZE + GRID_SIZE / 2, food.current.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    if (foodEatAnim.current) {
      const p = foodEatAnim.current.progress;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc( foodEatAnim.current.pos.x * GRID_SIZE + GRID_SIZE / 2, foodEatAnim.current.pos.y * GRID_SIZE + GRID_SIZE / 2, (GRID_SIZE / 2) * (1.5 - p), 0, 2 * Math.PI);
      ctx.globalAlpha = p;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="w-full max-w-lg flex justify-between items-center mb-4 px-2">
         <div className="bg-slate-900 p-2 px-4 rounded-md text-center">
            <div className="text-sm text-neutral-400">SCORE</div>
            <div className="text-3xl font-bold">{currentScore}</div>
        </div>
        <div className="bg-slate-900 p-2 px-4 rounded-md text-center">
            <div className="text-sm text-neutral-400">BEST</div>
            <div className="text-3xl font-bold">{highScore}</div>
        </div>
      </div>
      <Swipeable
        className="relative bg-slate-900 rounded-md shadow-2xl border border-slate-700"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        onSwipeUp={() => changeDirection('UP')}
        onSwipeDown={() => changeDirection('DOWN')}
        onSwipeLeft={() => changeDirection('LEFT')}
        onSwipeRight={() => changeDirection('RIGHT')}
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        {showGameOverModal && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm rounded-md animate-fade-in z-50 p-4">
                <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
                    <h2 className="text-4xl font-bold text-rose-400 mb-4">Game Over</h2>
                    <p className="text-lg text-neutral-400 mb-6">Final Score: {score.current}</p>
                    <button onClick={resetGame} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">
                        Play Again
                    </button>
                </div>
            </div>
        )}
      </Swipeable>
    </div>
  );
};

export default SnakeScreen;
