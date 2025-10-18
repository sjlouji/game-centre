
import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Constants ---
const BLOCK_HEIGHT = 25;
const STARTING_WIDTH = 40; // percentage
const PERFECT_PLACEMENT_THRESHOLD = 0.5; // percentage

// --- Types ---
type Block = { y: number; x: number; width: number; color: string; };
type Cutoff = Block & { id: number; };

const StackGameScreen: React.FC = () => {
    const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
    const [stack, setStack] = useState<Block[]>([]);
    const [cutoffs, setCutoffs] = useState<Cutoff[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [perfectPlacementEffect, setPerfectPlacementEffect] = useState<Block | null>(null);
    const [lastPlacedY, setLastPlacedY] = useState<number | null>(null);

    const activeBlockRef = useRef<{ y: number; x: number; width: number; color: string; direction: 1 | -1 } | null>(null);
    const activeBlockElementRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const speedRef = useRef(0.05); // percentage per ms
    const cutoffIdCounter = useRef(0);

    useEffect(() => {
        const savedHighScore = localStorage.getItem('stack-highscore');
        setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
    }, []);

    const generateColor = useCallback((y: number) => {
        const hue = (180 + y * 10) % 360;
        return `hsl(${hue}, 80%, 60%)`;
    }, []);

    const startGame = useCallback(() => {
        setGameState('playing');
        setScore(0);
        setStack([{ y: 0, x: (100 - STARTING_WIDTH) / 2, width: STARTING_WIDTH, color: generateColor(0) }]);
        setCutoffs([]);
        setShowGameOverModal(false);
        setPerfectPlacementEffect(null);
        setLastPlacedY(null);
        speedRef.current = 0.05;
        
        activeBlockRef.current = { y: 1, x: 0, width: STARTING_WIDTH, color: generateColor(1), direction: 1 };
        
        if (activeBlockElementRef.current) {
            activeBlockElementRef.current.style.opacity = '1';
            activeBlockElementRef.current.style.width = `${STARTING_WIDTH}%`;
            activeBlockElementRef.current.style.backgroundColor = activeBlockRef.current.color;
            activeBlockElementRef.current.style.transform = `translateY(${-activeBlockRef.current.y * BLOCK_HEIGHT}px) translateZ(0)`;
            activeBlockElementRef.current.style.left = `${activeBlockRef.current.x}%`;
        }

        lastTimeRef.current = performance.now();
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        gameLoop();
    }, [generateColor]);

    useEffect(() => {
        startGame();
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [startGame]);

    const gameLoop = useCallback(() => {
        animationFrameId.current = requestAnimationFrame(time => {
            if (gameState !== 'playing' || !lastTimeRef.current || !activeBlockRef.current || !activeBlockElementRef.current) {
                return;
            }

            const deltaTime = time - lastTimeRef.current;
            const activeBlock = activeBlockRef.current;
            
            activeBlock.x += activeBlock.direction * speedRef.current * deltaTime;

            if (activeBlock.x + activeBlock.width > 100) {
                activeBlock.x = 100 - activeBlock.width;
                activeBlock.direction = -1;
            } else if (activeBlock.x < 0) {
                activeBlock.x = 0;
                activeBlock.direction = 1;
            }

            activeBlockElementRef.current.style.left = `${activeBlock.x}%`;
            lastTimeRef.current = time;
            gameLoop();
        });
    }, [gameState]);

    const placeBlock = useCallback(() => {
        if (!activeBlockRef.current) return;
        
        const activeBlock = { ...activeBlockRef.current };
        const prevBlock = stack[stack.length - 1];

        const overlapStart = Math.max(activeBlock.x, prevBlock.x);
        const overlapEnd = Math.min(activeBlock.x + activeBlock.width, prevBlock.x + prevBlock.width);
        const overlapWidth = overlapEnd - overlapStart;

        if (overlapWidth <= 0) {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (activeBlockElementRef.current) activeBlockElementRef.current.style.opacity = '0';
            
            const missedBlock: Cutoff = { ...activeBlock, id: cutoffIdCounter.current++ };
            setCutoffs(prev => [...prev, missedBlock]);
            activeBlockRef.current = null;

            setGameState('gameOver');
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('stack-highscore', score.toString());
            }
            setTimeout(() => setShowGameOverModal(true), 500);
            return;
        }

        const newWidth = overlapWidth;
        const newX = overlapStart;
        
        if (activeBlock.width - newWidth > 0.1) {
            const isLeftCutoff = activeBlock.x < prevBlock.x;
            const cutoff: Cutoff = {
                id: cutoffIdCounter.current++, y: activeBlock.y,
                x: isLeftCutoff ? activeBlock.x : newX + newWidth,
                width: activeBlock.width - newWidth, color: activeBlock.color,
            };
            setCutoffs(prev => [...prev, cutoff]);
        }
        
        const perfectPlacement = Math.abs(newX - prevBlock.x) < PERFECT_PLACEMENT_THRESHOLD && Math.abs(newWidth - prevBlock.width) < PERFECT_PLACEMENT_THRESHOLD;
        const widthToUse = perfectPlacement ? prevBlock.width : newWidth;
        const xToUse = perfectPlacement ? prevBlock.x : newX;
        
        const newBlock: Block = { y: activeBlock.y, x: xToUse, width: widthToUse, color: activeBlock.color };
        
        if (perfectPlacement) {
            setPerfectPlacementEffect(newBlock);
            setTimeout(() => setPerfectPlacementEffect(null), 400);
        }
        
        const newScore = score + 1;
        setScore(newScore);
        setStack(prev => [...prev, newBlock]);
        setLastPlacedY(newBlock.y);
        speedRef.current = Math.min(0.2, speedRef.current * 1.02);

        activeBlockRef.current = {
            y: activeBlock.y + 1, x: 0, width: widthToUse,
            color: generateColor(activeBlock.y + 1), direction: Math.random() > 0.5 ? 1 : -1,
        };
        if (activeBlockElementRef.current) {
            activeBlockElementRef.current.style.width = `${widthToUse}%`;
            activeBlockElementRef.current.style.backgroundColor = activeBlockRef.current.color;
            activeBlockElementRef.current.style.transform = `translateY(${-activeBlockRef.current.y * BLOCK_HEIGHT}px) translateZ(0)`;
            activeBlockElementRef.current.style.left = `${activeBlockRef.current.x}%`;
        }
    }, [stack, score, highScore, generateColor]);
    
    const handleInteraction = useCallback(() => {
        if (gameState === 'playing') {
            placeBlock();
        } else if (gameState === 'gameOver' && showGameOverModal) {
            startGame();
        }
    }, [gameState, placeBlock, startGame, showGameOverModal]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                handleInteraction();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleInteraction]);

    const cameraY = Math.max(0, (score - 4) * BLOCK_HEIGHT);

    return (
        <div 
            className="w-full h-full flex-grow flex flex-col items-center justify-end pb-10 select-none overflow-hidden relative bg-slate-800"
            style={{ perspective: '800px', touchAction: 'none' }}
            onClick={handleInteraction}
        >
            <style>{`
                .cutoff-fall { animation: fall 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
                @keyframes fall {
                    to {
                        transform: translateY(80vh) translateZ(-200px) rotateX(150deg) rotateZ(60deg) scale(0.7);
                        opacity: 0;
                    }
                }
                .animate-block-place {
                    animation: place-block-anim 0.2s cubic-bezier(0.2, 0.8, 0.7, 1.2);
                    transform-origin: bottom;
                }
                @keyframes place-block-anim {
                    from { transform: scaleY(1.1); }
                    to { transform: scaleY(1); }
                }
                .animate-perfect-flash {
                    animation: perfect-flash 0.4s ease-out forwards;
                    background-color: white;
                }
                @keyframes perfect-flash {
                    from { opacity: 0.7; }
                    to { opacity: 0; }
                }
            `}</style>
             <div className="absolute top-4 left-0 right-0 flex justify-center sm:justify-between gap-4 px-4 z-20">
                <div className="bg-slate-900/70 p-2 px-4 rounded-md text-center sm:text-left">
                    <div className="text-sm text-neutral-400">SCORE</div>
                    <div className="text-3xl font-bold">{score}</div>
                </div>
                <div className="bg-slate-900/70 p-2 px-4 rounded-md text-center sm:text-right">
                    <div className="text-sm text-neutral-400">BEST</div>
                    <div className="text-3xl font-bold">{highScore}</div>
                </div>
             </div>

            <div 
                className="relative w-[300px] h-[80vh] transition-transform duration-500 ease-out" 
                style={{ transform: `translateY(${cameraY}px) rotateX(25deg)`, transformStyle: 'preserve-3d' }}
            >
                <div className="absolute w-full h-full">
                    {/* Base Plate */}
                    <div className="absolute bottom-0"
                        style={{
                            height: `${BLOCK_HEIGHT}px`, left: '20%', width: `60%`,
                            backgroundColor: '#334155', transform: `translateY(${BLOCK_HEIGHT}px)`,
                            boxShadow: '0 5px 10px rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.2)',
                        }}
                    />
                    {stack.map((block) => {
                        const distanceFromTop = score - block.y;
                        const opacity = gameState === 'gameOver' ? 1 : Math.max(0, Math.min(1, (18 - distanceFromTop) / 10));
                        const isLastPlaced = block.y === lastPlacedY;
                        return (
                            <div key={block.y} className="absolute bottom-0"
                                style={{
                                    height: `${BLOCK_HEIGHT}px`, left: `${block.x}%`, width: `${block.width}%`,
                                    transform: `translateY(${-block.y * BLOCK_HEIGHT}px) translateZ(0)`,
                                    opacity, transition: 'opacity 0.5s ease-out',
                                }}
                            >
                                <div
                                    className={`w-full h-full ${isLastPlaced ? 'animate-block-place' : ''}`}
                                    style={{
                                        backgroundColor: block.color,
                                        boxShadow: '0 5px 10px rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(0,0,0,0.2)',
                                    }}
                                />
                            </div>
                        );
                    })}
                    {cutoffs.map(c => (
                         <div key={c.id} className="absolute bottom-0 cutoff-fall"
                            style={{
                                height: `${BLOCK_HEIGHT}px`, left: `${c.x}%`, width: `${c.width}%`,
                                backgroundColor: c.color, transform: `translateY(${-c.y * BLOCK_HEIGHT}px)`,
                                boxShadow: '0 5px 10px rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.2)',
                            }}
                        />
                    ))}
                    {gameState === 'playing' && (
                        <div ref={activeBlockElementRef} className="absolute bottom-0"
                            style={{
                                height: `${BLOCK_HEIGHT}px`,
                                boxShadow: '0 5px 15px rgba(0,0,0,0.4)', border: '1px solid rgba(0,0,0,0.2)',
                            }}
                        />
                    )}
                    {perfectPlacementEffect && (
                        <div className="absolute bottom-0 animate-perfect-flash"
                            style={{
                                height: `${BLOCK_HEIGHT + 4}px`,
                                left: `${perfectPlacementEffect.x}%`,
                                width: `${perfectPlacementEffect.width}%`,
                                transform: `translateY(${-(perfectPlacementEffect.y * BLOCK_HEIGHT) - 2}px) translateZ(5px)`,
                                borderRadius: '2px',
                            }}
                        />
                    )}
                </div>
            </div>
            
            {gameState === 'gameOver' && showGameOverModal && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-sm animate-fade-in z-50 p-4">
                    <div className="bg-slate-900 p-8 rounded-lg shadow-2xl text-center animate-slide-up border border-slate-700">
                        <h2 className="text-4xl font-bold text-rose-400 mb-4">Game Over</h2>
                        <p className="text-lg text-neutral-400 mb-6">You stacked {score} blocks!</p>
                        <button onClick={handleInteraction} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-md transition-all duration-200 text-lg active:scale-95">
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StackGameScreen;
