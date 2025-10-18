import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Constants ---
const FONT_FAMILY = "'Exo 2', sans-serif";
const SCENE_WIDTH = 500;
const SCENE_HEIGHT = 700;
const FLOOR_Y = SCENE_HEIGHT - 100;
const GRAVITY = 0.4;
const TOSS_POWER_MULTIPLIER = 1.3;
const MAX_WIND_SPEED = 2.0;
const BOUNCE_FACTOR = -0.6;
const FRICTION = 0.95;

const initialPaperState = {
  x: SCENE_WIDTH / 2,
  y: FLOOR_Y - 30,
  vx: 0,
  vy: 0,
  rotation: 0,
  rotationSpeed: 0,
  scale: 1,
  inFlight: false,
  isScoring: false,
};

// --- Bin Geometry ---
const BIN_X = SCENE_WIDTH / 2;
const BIN_Y = FLOOR_Y - 220;
const BIN_TOP_WIDTH = 80;
const BIN_BOTTOM_WIDTH = 60;
const BIN_HEIGHT = 90;
const BIN_RIM_THICKNESS = 10;

// --- Drawing Functions ---
function drawPaperBall(ctx: CanvasRenderingContext2D, scale: number) {
  const paperGradient = ctx.createRadialGradient(-5 * scale, -5 * scale, 1, 0, 0, 15 * scale);
  paperGradient.addColorStop(0, '#f8fafc'); // slate-50 for highlight
  paperGradient.addColorStop(1, '#E2E8F0'); // slate-200 for main color

  ctx.beginPath();
  ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
  ctx.fillStyle = paperGradient;
  ctx.fill();
}


function drawBackgroundAndFloor(ctx: CanvasRenderingContext2D) {
    // Wall Gradient matching the app's theme
    const wallGradient = ctx.createLinearGradient(0, 0, 0, SCENE_HEIGHT);
    wallGradient.addColorStop(0, '#1e293b'); // slate-800
    wallGradient.addColorStop(1, '#0f172a'); // slate-900
    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
}

function drawBin(ctx: CanvasRenderingContext2D) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(BIN_X, FLOOR_Y + 5, BIN_BOTTOM_WIDTH / 2 + 5, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Bin Body Gradient
    const binGradient = ctx.createLinearGradient(BIN_X - BIN_TOP_WIDTH / 2, 0, BIN_X + BIN_TOP_WIDTH / 2, 0);
    binGradient.addColorStop(0, '#94a3b8'); // slate-400
    binGradient.addColorStop(0.5, '#e2e8f0'); // slate-200
    binGradient.addColorStop(1, '#94a3b8'); // slate-400
    
    ctx.fillStyle = binGradient;

    ctx.beginPath();
    ctx.moveTo(BIN_X - BIN_TOP_WIDTH / 2, BIN_Y);
    ctx.lineTo(BIN_X + BIN_TOP_WIDTH / 2, BIN_Y);
    ctx.lineTo(BIN_X + BIN_BOTTOM_WIDTH / 2, BIN_Y + BIN_HEIGHT);
    ctx.lineTo(BIN_X - BIN_BOTTOM_WIDTH / 2, BIN_Y + BIN_HEIGHT);
    ctx.closePath();
    ctx.fill();
    
    // Bin Rim
    ctx.beginPath();
    ctx.ellipse(BIN_X, BIN_Y, BIN_TOP_WIDTH/2, 10, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
}

const PaperTossScreen: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paperState = useRef({ ...initialPaperState });
    const flickStartPos = useRef<{ x: number; y: number } | null>(null);
    const fanRotation = useRef(0);
    const animationFrameId = useRef<number | null>(null);
    const wind = useRef({ speed: 0, direction: 1 });
    const windParticles = useRef<{ x: number; y: number; radius: number; opacity: number; vx: number; }[]>([]);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [message, setMessage] = useState<{ text: string; color: string; key: number } | null>(null);

    const showMessage = (text: string, color: string) => {
        setMessage({ text, color, key: Date.now() });
        setTimeout(() => setMessage(null), 1500);
    };

    const changeWind = useCallback(() => {
        const newSpeed = parseFloat((Math.random() * MAX_WIND_SPEED).toFixed(1));
        const newDirection = Math.random() < 0.5 ? -1 : 1;
        wind.current = { speed: newSpeed, direction: newDirection };
    }, []);

    const resetPaper = useCallback(() => {
        paperState.current = { ...initialPaperState };
    }, []);

    const handleSuccess = useCallback(() => {
        const newScore = score + 1;
        const newStreak = streak + 1;
        setScore(newScore);
        setStreak(newStreak);
        showMessage('SWISH!', '#4ADE80');
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('paper-toss-highscore', newScore.toString());
        }
        changeWind();
    }, [score, streak, highScore, changeWind]);

    const handleMiss = useCallback(() => {
        setStreak(0);
        showMessage('MISS', '#FB7185');
        resetPaper();
        changeWind();
    }, [resetPaper, changeWind]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            animationFrameId.current = requestAnimationFrame(animate);
            return;
        };
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBackgroundAndFloor(ctx);
        drawBin(ctx);
        
        const currentWind = wind.current;

        // --- Wind Particles ---
        ctx.fillStyle = 'rgba(226, 232, 240, 0.5)'; // slate-200
        windParticles.current.forEach(p => {
            p.x += p.vx + (currentWind.direction * currentWind.speed * 0.75);
            if (currentWind.direction === 1 && p.x > SCENE_WIDTH + 10) p.x = -10;
            else if (currentWind.direction === -1 && p.x < -10) p.x = SCENE_WIDTH + 10;
            
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // --- Physics and update ---
        fanRotation.current = (fanRotation.current + currentWind.speed * 6) % 360;
        const { current: paper } = paperState;

        if (paper.inFlight) {
            const prevY = paper.y;

            paper.vy += GRAVITY;
            if (paper.y < FLOOR_Y - 150) {
                paper.vx += (wind.current.direction * wind.current.speed) / 20;
            }

            paper.x += paper.vx;
            paper.y += paper.vy;
            paper.rotation += paper.rotationSpeed;
            paper.scale = 1 - Math.min(0.6, (initialPaperState.y - paper.y) / (SCENE_HEIGHT * 1.5));
            const paperRadius = 15 * paper.scale;

            const binOpeningY = BIN_Y;
            const binLeftEdge = BIN_X - BIN_TOP_WIDTH / 2;
            const binRightEdge = BIN_X + BIN_TOP_WIDTH / 2;

            let hasCollidedThisFrame = false;

            // 1. Success condition: Check if the paper's center passes through the bin's opening.
            if (prevY < binOpeningY && paper.y >= binOpeningY && paper.vy > 0 && paper.x > binLeftEdge && paper.x < binRightEdge) {
                paper.inFlight = false;
                paper.isScoring = true;
                paper.vy = 2; // Set a gentle downward velocity
                paper.vx *= 0.5; // Slow horizontal movement
                hasCollidedThisFrame = true;
            }

            // 2. Rim collision
            if (!hasCollidedThisFrame) {
                const rimY = binOpeningY;
                const isVerticallyOnRim = paper.y + paperRadius > rimY && paper.y - paperRadius < rimY + BIN_RIM_THICKNESS;

                const ballRightEdge = paper.x + paperRadius;
                const ballLeftEdge = paper.x - paperRadius;

                const isOnLeftRim = ballRightEdge > (binLeftEdge - BIN_RIM_THICKNESS) && ballLeftEdge < binLeftEdge;
                const isOnRightRim = ballRightEdge > binRightEdge && ballLeftEdge < (binRightEdge + BIN_RIM_THICKNESS);

                if (isVerticallyOnRim && (isOnLeftRim || isOnRightRim)) {
                    if (paper.vy > 0) {
                        paper.vy *= BOUNCE_FACTOR;
                        paper.y = rimY - paperRadius;
                    } else {
                        paper.vy *= -0.5;
                    }
                    const pushDirection = paper.x > BIN_X ? 1 : -1;
                    paper.vx = pushDirection * (Math.abs(paper.vx * BOUNCE_FACTOR) + 0.5);
                    paper.rotationSpeed *= 0.5;
                    hasCollidedThisFrame = true;
                }
            }
            
            // 3. Floor collision
            if (!hasCollidedThisFrame && paper.y + paperRadius > FLOOR_Y) {
                paper.y = FLOOR_Y - paperRadius;
                paper.vy *= BOUNCE_FACTOR;
                paper.vx *= FRICTION;
                paper.rotationSpeed *= FRICTION;
                
                if (Math.abs(paper.vy) < 1) {
                    paper.inFlight = false;
                    setTimeout(handleMiss, 1000);
                }
            }
        } else if (paper.isScoring) {
            // Animate the ball falling into the bin
            paper.x += (BIN_X - paper.x) * 0.1; // Center horizontally
            paper.y += paper.vy;
            paper.vy += 0.15; // Accelerate slightly
            paper.scale = Math.max(0, paper.scale - 0.015); // Shrink
            paper.rotation += paper.rotationSpeed;
            paper.rotationSpeed *= 0.97; // Slow rotation

            // Check if animation is finished
            if (paper.scale <= 0) {
                paper.isScoring = false;
                handleSuccess();
                setTimeout(resetPaper, 300); // Give message time to show
            }
        }
        
        // --- Draw dynamic elements ---
        // Paper Shadow
        if (paper.inFlight) {
            const shadowY = FLOOR_Y;
            const shadowOpacity = Math.max(0, 0.2 * (1 - (paper.y / FLOOR_Y)));
            const shadowRadius = Math.max(0, 15 * (1 - (paper.y / FLOOR_Y)));
            if (shadowRadius > 0) {
                ctx.fillStyle = `rgba(0,0,0,${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(paper.x, shadowY + 3, shadowRadius, shadowRadius / 2, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.translate(paper.x, paper.y);
        ctx.rotate(paper.rotation * Math.PI / 180);
        drawPaperBall(ctx, paper.scale);
        ctx.restore();

        if (paper.isScoring) {
            // Draw the front rim of the bin on top of the paper for a 3D effect
            ctx.save();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.ellipse(BIN_X, BIN_Y, BIN_TOP_WIDTH / 2, 10, 0, 0, Math.PI);
            ctx.fill();
            ctx.restore();
        }

        // Wind Indicator
        const fanX = currentWind.direction > 0 ? 30 : SCENE_WIDTH - 80;
        const fanY = 100;
        const wobble = currentWind.speed > 0.1 ? Math.sin(Date.now() / 60) * currentWind.speed * 1.2 : 0;
        const fanBodyX = fanX + wobble;
        const fanBodyY = fanY;

        ctx.fillStyle = "#64748B";
        ctx.fillRect(fanBodyX, fanBodyY, 50, 50);
        ctx.fillStyle = "#334155";
        ctx.fillRect(fanBodyX + 5, fanBodyY + 5, 40, 40);

        ctx.save();
        ctx.translate(fanBodyX + 25, fanBodyY + 25);
        ctx.rotate(fanRotation.current * Math.PI / 180);
        ctx.fillStyle = "#94A3B8";

        const bladeLength = 18;
        const bladeWidth = 7;
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(4, -bladeWidth / 2);
            ctx.lineTo(bladeLength, -bladeWidth / 2 + 3);
            ctx.lineTo(bladeLength, bladeWidth / 2 + 3);
            ctx.lineTo(4, bladeWidth / 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#E2E8F0';
        ctx.font = `bold 18px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(`WIND: ${currentWind.speed.toFixed(1)}`, fanBodyX + 25, 80);

        const arrowX = currentWind.direction > 0 ? fanX + 80 : fanX - 30;
        ctx.beginPath();
        if (currentWind.speed > 0) {
            ctx.moveTo(arrowX, 125);
            ctx.lineTo(arrowX + currentWind.direction * 50, 125);
            ctx.lineTo(arrowX + currentWind.direction * 50 - currentWind.direction * 10, 120);
            ctx.moveTo(arrowX + currentWind.direction * 50, 125);
            ctx.lineTo(arrowX + currentWind.direction * 50 - currentWind.direction * 10, 130);
            ctx.strokeStyle = "#0EA5E9";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        animationFrameId.current = requestAnimationFrame(animate);
    }, [handleSuccess, handleMiss, resetPaper]);

    useEffect(() => {
        const savedHighScore = localStorage.getItem('paper-toss-highscore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }

        if (windParticles.current.length === 0) {
            for (let i = 0; i < 40; i++) {
                windParticles.current.push({
                    x: Math.random() * SCENE_WIDTH,
                    y: Math.random() * (FLOOR_Y - 50),
                    radius: Math.random() * 1.5 + 1,
                    opacity: Math.random() * 0.4 + 0.1,
                    vx: (Math.random() - 0.5) * 0.2,
                });
            }
        }
        
        changeWind();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [animate]);
    
    const getPointerPosition = (e: React.PointerEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (paperState.current.inFlight) return;
        flickStartPos.current = getPointerPosition(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (paperState.current.inFlight || !flickStartPos.current) return;
        const pos = getPointerPosition(e);
        const dx = pos.x - flickStartPos.current.x;
        const dy = pos.y - flickStartPos.current.y;
        
        if (Math.abs(dy) > 10) {
            paperState.current.inFlight = true;
            paperState.current.vx = dx / 15 * TOSS_POWER_MULTIPLIER;
            paperState.current.vy = dy / 10 * TOSS_POWER_MULTIPLIER;
            paperState.current.rotationSpeed = paperState.current.vx;
        }
        flickStartPos.current = null;
    };

    return (
        <div className="flex flex-col items-center justify-start font-sans select-none w-full flex-grow">
            <div className="w-full max-w-lg mx-auto flex justify-around p-4 bg-slate-900/50 rounded-lg mb-4">
                <div className="text-center">
                    <div className="text-sm text-neutral-400 uppercase font-semibold">Score</div>
                    <div className="text-3xl font-bold text-neutral-50">{score}</div>
                </div>
                 <div className="text-center">
                    <div className="text-sm text-neutral-400 uppercase font-semibold">Streak</div>
                    <div className="text-3xl font-bold text-sky-400">{streak}</div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-neutral-400 uppercase font-semibold">Best</div>
                    <div className="text-3xl font-bold text-neutral-50">{highScore}</div>
                </div>
            </div>

            <div 
              className="relative w-full max-w-lg mx-auto aspect-[5/7] rounded-lg overflow-hidden shadow-2xl cursor-pointer"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
                {message && (
                    <div 
                        key={message.key}
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 text-5xl font-extrabold animate-fade-in pointer-events-none"
                        style={{ color: message.color, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                    >
                        {message.text}
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={SCENE_WIDTH}
                    height={SCENE_HEIGHT}
                    className="w-full h-full"
                />
            </div>
             <p className="text-neutral-500 mt-4 text-sm">Flick the paper ball to toss it.</p>
        </div>
    );
};

export default PaperTossScreen;