import React, { useRef, useEffect, useCallback, useState } from 'react';

// --- Constants ---
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
// Bird
const BIRD_X = 60;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const GRAVITY = 0.4;
const JUMP_FORCE = -7;
const BIRD_MAX_ROTATION = Math.PI / 6;
const BIRD_FALL_ROTATION = Math.PI / 2;
// Pipes
const PIPE_WIDTH = 52;
const PIPE_CAP_HEIGHT = 20;
const PIPE_GAP = 120;
const PIPE_SPACING = 200; // Horizontal distance between pipes
const PIPE_SPEED = 2;
// Background
const BG_SCROLL_SPEED = 0.5;

type Cloud = { x: number; y: number; size: number };

const FlappyBirdScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showModal, setShowModal] = useState<'menu' | 'gameOver' | null>('menu');

  // Use refs for all state managed by the game loop
  const gameState = useRef<'menu' | 'playing' | 'gameOver'>('menu');
  const score = useRef(0);
  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdRotation = useRef(0);
  const flapState = useRef(0);
  const pipes = useRef<{ x: number; gapY: number; scored: boolean }[]>([]);
  const clouds = useRef<Cloud[]>([]);
  const bgOffset = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef(0);
  const gameOverState = useRef({ flashOpacity: 0, isDone: false });

  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappy-highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
  }, []);

  const handleGameOver = useCallback(() => {
    if (gameState.current !== 'playing') return;
    gameState.current = 'gameOver';
    gameOverState.current = { flashOpacity: 1, isDone: false };
    if (score.current > highScore) {
      setHighScore(score.current);
      localStorage.setItem('flappy-highscore', score.current.toString());
    }
  }, [highScore]);
  
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#71c5cf');
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    clouds.current.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.size * 0.6, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    });
  }, []);

  const drawPipes = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    pipes.current.forEach(pipe => {
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        pipeGradient.addColorStop(0, '#58a348');
        pipeGradient.addColorStop(0.5, '#84e154');
        pipeGradient.addColorStop(1, '#58a348');
        ctx.fillStyle = pipeGradient;

        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        // Top pipe cap
        ctx.fillRect(pipe.x - 4, pipe.gapY - PIPE_CAP_HEIGHT, PIPE_WIDTH + 8, PIPE_CAP_HEIGHT);
        ctx.strokeRect(pipe.x - 4, pipe.gapY - PIPE_CAP_HEIGHT, PIPE_WIDTH + 8, PIPE_CAP_HEIGHT);
        
        // Bottom pipe
        const bottomY = pipe.gapY + PIPE_GAP;
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);
        ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);
        // Bottom pipe cap
        ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, PIPE_CAP_HEIGHT);
        ctx.strokeRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, PIPE_CAP_HEIGHT);
    });
  }, []);
  
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    let y = birdY.current;
    if (gameState.current === 'menu') {
        y += Math.sin(timestamp / 200) * 5; // Bobbing animation
    }
    
    ctx.save();
    ctx.translate(BIRD_X, y);
    ctx.rotate(birdRotation.current);

    // Body
    ctx.fillStyle = '#facc15'; // yellow-400
    ctx.strokeStyle = '#ca8a04'; // yellow-600
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_WIDTH / 2, BIRD_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing
    ctx.fillStyle = '#fbbf24'; // amber-400
    const wingYOffset = -2;
    const wingRotation = flapState.current > 0 ? -Math.PI / 4 : -Math.PI / 12;
    ctx.save();
    ctx.translate(-5, wingYOffset);
    ctx.rotate(wingRotation);
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_WIDTH / 3, BIRD_HEIGHT / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#f97316'; // orange-500
    ctx.strokeStyle = '#b45309'; // orange-700
    ctx.beginPath();
    ctx.moveTo(15, -2);
    ctx.lineTo(25, 2);
    ctx.lineTo(15, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // --- Update Logic ---
    bgOffset.current = (bgOffset.current + BG_SCROLL_SPEED) % CANVAS_WIDTH;
    
    clouds.current.forEach(cloud => {
        cloud.x -= BG_SCROLL_SPEED * 1.5;
        if (cloud.x < -cloud.size * 2) {
            cloud.x = CANVAS_WIDTH + cloud.size;
            cloud.y = Math.random() * CANVAS_HEIGHT * 0.4;
        }
    });

    if (gameState.current === 'playing') {
      // Bird physics
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;
      birdRotation.current = Math.min(Math.max(-BIRD_MAX_ROTATION, birdVelocity.current / 10), BIRD_MAX_ROTATION);
      if (flapState.current > 0) flapState.current--;

      // Pipe movement
      pipes.current.forEach(pipe => {
        pipe.x -= PIPE_SPEED;
        if (pipe.x < -PIPE_WIDTH) {
          pipe.x = CANVAS_WIDTH;
          pipe.gapY = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150) + 75;
          pipe.scored = false;
        }
        
        if (!pipe.scored && pipe.x < BIRD_X - PIPE_WIDTH) {
          pipe.scored = true;
          score.current += 1;
          setDisplayScore(score.current);
        }
      });
      
      // Collision detection
      const birdTop = birdY.current - BIRD_HEIGHT / 2;
      const birdBottom = birdY.current + BIRD_HEIGHT / 2;
      if (birdBottom > CANVAS_HEIGHT - 20) { // Ground collision
        birdY.current = CANVAS_HEIGHT - 20 - BIRD_HEIGHT / 2;
        handleGameOver();
      }
      if (birdTop < 0) { birdY.current = BIRD_HEIGHT / 2; birdVelocity.current = 0; }

      pipes.current.forEach(pipe => {
          if ( BIRD_X + BIRD_WIDTH / 2 > pipe.x && BIRD_X - BIRD_WIDTH / 2 < pipe.x + PIPE_WIDTH && (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP)) {
            handleGameOver();
          }
      });
    } else if (gameState.current === 'gameOver' && !gameOverState.current.isDone) {
        if (gameOverState.current.flashOpacity > 0) gameOverState.current.flashOpacity -= 0.1;
        
        if (birdY.current < CANVAS_HEIGHT - 20 - BIRD_HEIGHT / 2) {
            birdVelocity.current += GRAVITY * 1.5;
            birdY.current += birdVelocity.current;
            if (birdRotation.current < BIRD_FALL_ROTATION) birdRotation.current += 0.05;
        }

        if (birdY.current >= CANVAS_HEIGHT - 20 - BIRD_HEIGHT / 2) {
            if (!gameOverState.current.isDone) {
                setTimeout(() => {
                    gameOverState.current.isDone = true;
                    setShowModal('gameOver');
                }, 200);
            }
        }
    }

    // --- Drawing Logic ---
    drawBackground(ctx);
    drawPipes(ctx);

    // Ground
    ctx.fillStyle = '#d4d79e';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    ctx.fillStyle = '#87ab3f';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 5);

    drawBird(ctx, timestamp);
    
    // Score
    if (gameState.current !== 'menu') {
        ctx.fillStyle = 'white';
        ctx.font = "bold 48px 'Exo 2', sans-serif";
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(score.current.toString(), CANVAS_WIDTH / 2, 60);
        ctx.fillText(score.current.toString(), CANVAS_WIDTH / 2, 60);
    }
    
    // Game Over Flash
    if (gameOverState.current.flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${gameOverState.current.flashOpacity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [handleGameOver, drawBackground, drawPipes, drawBird]);
  
  const startGame = useCallback(() => {
    gameState.current = 'playing';
    setShowModal(null);
    score.current = 0;
    setDisplayScore(0);
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    birdRotation.current = 0;
    pipes.current = [];
    for (let i = 0; i < 2; i++) {
      pipes.current.push({
        x: CANVAS_WIDTH + 100 + i * PIPE_SPACING,
        gapY: Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150) + 75,
        scored: false,
      });
    }
  }, []);

  const handleFlap = useCallback(() => {
    if (gameState.current === 'playing') {
      birdVelocity.current = JUMP_FORCE;
      flapState.current = 15;
    } else if (showModal) {
      startGame();
      birdVelocity.current = JUMP_FORCE;
      flapState.current = 15;
    }
  }, [startGame, showModal]);

  useEffect(() => {
    const handleInteraction = () => handleFlap();
    const handleKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); handleFlap(); } };
    
    window.addEventListener('keydown', handleKey);
    const canvas = canvasRef.current;
    if (canvas) canvas.addEventListener('click', handleInteraction);
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (canvas) canvas.removeEventListener('click', handleInteraction);
    };
  }, [handleFlap]);
  
  useEffect(() => {
    clouds.current = Array.from({ length: 5 }, () => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT * 0.4,
        size: Math.random() * 20 + 15,
    }));
    lastTime.current = 0;
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [gameLoop]);

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center animate-fade-in p-4">
        <div className="w-full max-w-sm flex justify-between items-center mb-4 px-2">
            <div className="bg-slate-900 p-2 px-4 rounded-md text-center">
                <div className="text-sm text-neutral-400">SCORE</div>
                <div className="text-3xl font-bold">{displayScore}</div>
            </div>
            <div className="bg-slate-900 p-2 px-4 rounded-md text-center">
                <div className="text-sm text-neutral-400">BEST</div>
                <div className="text-3xl font-bold">{highScore}</div>
            </div>
        </div>
        <div className="relative rounded-md shadow-2xl border-4 border-slate-700 overflow-hidden cursor-pointer" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} onClick={handleFlap}>
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            {showModal === 'menu' && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/30">
                    <div className="text-center text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                        <h2 className="text-5xl font-bold font-heading">Flappy Bird</h2>
                        <p className="mt-4 text-xl animate-pulse">Tap or Press Space to Start</p>
                    </div>
                </div>
            )}
            {showModal === 'gameOver' && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/50 animate-fade-in">
                    <div className="bg-slate-800 p-8 rounded-lg shadow-2xl text-center border border-slate-700">
                        <h2 className="text-4xl font-bold text-rose-400 mb-2">Game Over</h2>
                        <p className="text-lg text-neutral-300 mb-4">Score: {score.current}</p>
                        <p className="text-md text-neutral-400 animate-pulse">Tap to play again</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default FlappyBirdScreen;
