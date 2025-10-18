import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Constants ---
const FONT_FAMILY = "'Exo 2', sans-serif";
const SCENE_WIDTH = 500;
const SCENE_HEIGHT = 700;

// --- 3D Scene Constants ---
const PERSPECTIVE = 600; // Focal length for projection
const VANISHING_POINT_Y = SCENE_HEIGHT / 2 - 150;
const FLOOR_Y = SCENE_HEIGHT - 100;

// --- Physics Constants ---
const GRAVITY = 0.25;
const MAX_WIND_SPEED = 2.0;
const BOUNCE_FACTOR = -0.5;
const FRICTION = 0.85;

// --- Paper State ---
const PAPER_RADIUS_3D = 15;
const initialPaperState = {
  x: 0, // 3D space x (sideways, centered at 0)
  y: PAPER_RADIUS_3D, // 3D space y (height from floor)
  z: 0, // 3D space z (depth, starts near camera)
  vx: 0, vy: 0, vz: 0,
  rotationX: 0, rotationY: 0, rotationZ: 0,
  rotationSpeedX: 0, rotationSpeedY: 0, rotationSpeedZ: 0,
  inFlight: false,
  isScoring: false,
};

// --- Bin 3D Geometry ---
const BIN_Z = 300;
const BIN_HEIGHT_3D = 90;
const BIN_TOP_RADIUS = 45;
const BIN_BOTTOM_RADIUS = 35;

// --- Helper Functions ---
function project(x: number, y: number, z: number) {
  const scale = PERSPECTIVE / (PERSPECTIVE + z);
  // Floor y position moves up towards vanishing point with distance
  const floorScreenY = FLOOR_Y - (FLOOR_Y - VANISHING_POINT_Y) * (z / (BIN_Z * 1.5));
  const screenX = SCENE_WIDTH / 2 + x * scale;
  const screenY = floorScreenY - y * scale;
  return { screenX, screenY, scale };
}

// --- Drawing Functions ---
function drawPaperBall(ctx: CanvasRenderingContext2D, scale: number) {
  const paperGradient = ctx.createRadialGradient(-5 * scale, -5 * scale, 1, 0, 0, 15 * scale);
  paperGradient.addColorStop(0, '#f8fafc');
  paperGradient.addColorStop(1, '#E2E8F0');

  ctx.beginPath();
  ctx.arc(0, 0, PAPER_RADIUS_3D * scale, 0, Math.PI * 2);
  ctx.fillStyle = paperGradient;
  ctx.fill();
}

function drawBackgroundAndFloor(ctx: CanvasRenderingContext2D) {
  const wallGradient = ctx.createLinearGradient(0, 0, 0, SCENE_HEIGHT);
  wallGradient.addColorStop(0, '#1e293b');
  wallGradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
}

function drawBin(ctx: CanvasRenderingContext2D) {
    const { screenX: topCenterX, screenY: topCenterY, scale: topScale } = project(0, BIN_HEIGHT_3D, BIN_Z);
    const { screenX: bottomCenterX, screenY: bottomCenterY, scale: bottomScale } = project(0, 0, BIN_Z);

    const topRadius = BIN_TOP_RADIUS * topScale;
    const bottomRadius = BIN_BOTTOM_RADIUS * bottomScale;
    const rimHeight = 10 * topScale;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(bottomCenterX, FLOOR_Y + 5, bottomRadius + 5, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Body
    const binGradient = ctx.createLinearGradient(topCenterX - topRadius, 0, topCenterX + topRadius, 0);
    binGradient.addColorStop(0, '#94a3b8');
    binGradient.addColorStop(0.5, '#e2e8f0');
    binGradient.addColorStop(1, '#94a3b8');
    ctx.fillStyle = binGradient;
    ctx.beginPath();
    ctx.moveTo(topCenterX - topRadius, topCenterY);
    ctx.lineTo(bottomCenterX - bottomRadius, bottomCenterY);
    ctx.lineTo(bottomCenterX + bottomRadius, bottomCenterY);
    ctx.lineTo(topCenterX + topRadius, topCenterY);
    ctx.closePath();
    ctx.fill();
    
    // Rims & Inside
    ctx.fillStyle = '#94a3b8'; // Back rim
    ctx.beginPath();
    ctx.ellipse(topCenterX, topCenterY, topRadius, rimHeight, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#475569'; // Inside
    ctx.beginPath();
    ctx.ellipse(topCenterX, topCenterY, topRadius, rimHeight, 0, 0, 2 * Math.PI);
    ctx.fill();
}

function drawBinFrontRim(ctx: CanvasRenderingContext2D) {
    const { screenX: topCenterX, screenY: topCenterY, scale: topScale } = project(0, BIN_HEIGHT_3D, BIN_Z);
    const topRadius = BIN_TOP_RADIUS * topScale;
    const rimHeight = 10 * topScale;
    
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(topCenterX, topCenterY, topRadius, rimHeight, 0, 0, Math.PI);
    ctx.fill();
}


const PaperTTossScreen: React.FC = () => {
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
        changeWind();
        // Don't reset paper, let it sit on the floor until next throw
    }, [changeWind]);

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
            paper.vy -= GRAVITY;
            paper.vx += (wind.current.direction * wind.current.speed) * 0.02;

            // Air resistance
            paper.vx *= 0.99; paper.vy *= 0.99; paper.vz *= 0.99;
            
            paper.x += paper.vx; paper.y += paper.vy; paper.z += paper.vz;
            paper.rotationZ += paper.rotationSpeedZ;

            let hasCollidedThisFrame = false;

            // Floor collision
            if (paper.y <= PAPER_RADIUS_3D && paper.vy < 0) {
                paper.y = PAPER_RADIUS_3D;
                paper.vy *= BOUNCE_FACTOR;
                paper.vx *= FRICTION; paper.vz *= FRICTION;
                paper.rotationSpeedZ *= FRICTION;
                
                if (Math.abs(paper.vy) < 0.2) {
                    paper.inFlight = false;
                    setTimeout(handleMiss, 1000);
                }
                hasCollidedThisFrame = true;
            }

            if (!hasCollidedThisFrame) {
                 const distToBinCenter = Math.sqrt(Math.pow(paper.x, 2) + Math.pow(paper.z - BIN_Z, 2));
                
                // Success Check: Is ball falling over the bin's opening?
                if (paper.y < (BIN_HEIGHT_3D + 10) && paper.y > (BIN_HEIGHT_3D - 10) && paper.vy < 0 && distToBinCenter < BIN_TOP_RADIUS - PAPER_RADIUS_3D) {
                    paper.inFlight = false;
                    paper.isScoring = true;
                    paper.vx = (0 - paper.x) * 0.05;
                    paper.vz = (BIN_Z - paper.z) * 0.05;
                    paper.vy = -2; // Gentle fall
                }
                // Rim Collision
                else {
                    const isNearBinHorizontally = distToBinCenter < BIN_TOP_RADIUS + PAPER_RADIUS_3D && distToBinCenter > BIN_TOP_RADIUS - PAPER_RADIUS_3D;
                    const isNearBinVertically = Math.abs(paper.y - BIN_HEIGHT_3D) < 15;
                    if (isNearBinHorizontally && isNearBinVertically) {
                        const angle = Math.atan2(paper.z - BIN_Z, paper.x);
                        const bouncePower = 2 + Math.random();
                        paper.vx = Math.cos(angle) * bouncePower;
                        paper.vz = Math.sin(angle) * bouncePower;
                        paper.vy = Math.abs(paper.vy * BOUNCE_FACTOR * 0.8) + 1; // Bounce up a bit
                    }
                }
            }
        } else if (paper.isScoring) {
            // Animate ball falling into bin
            paper.x += (0 - paper.x) * 0.1;
            paper.z += (BIN_Z - paper.z) * 0.1;
            paper.y += paper.vy;
            paper.vy -= GRAVITY * 0.5;

            if (paper.y <= 0) {
                paper.isScoring = false;
                handleSuccess();
                setTimeout(resetPaper, 300);
            }
        }
        
        // --- Draw dynamic elements ---
        const { screenX, screenY, scale } = project(paper.x, paper.y, paper.z);
        
        // Paper Shadow
        if (paper.y > 0) {
            const { screenX: shadowX, screenY: shadowY } = project(paper.x, 0, paper.z);
            const shadowOpacity = Math.max(0, 0.3 * (1 - (paper.y / (SCENE_HEIGHT / 2))));
            const shadowRadius = Math.max(0, 15 * scale * (1 - (paper.y / (SCENE_HEIGHT / 1.5))));
            if (shadowRadius > 0) {
                ctx.fillStyle = `rgba(0,0,0,${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(shadowX, shadowY + 3, shadowRadius, shadowRadius / 2, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Conditional rendering for 3D layering
        const isBehindBin = paper.z > BIN_Z;

        if (isBehindBin) {
            // Draw paper behind bin
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(paper.rotationZ * Math.PI / 180);
            drawPaperBall(ctx, scale);
            ctx.restore();
        }

        if (paper.isScoring) {
            // Draw the front rim of the bin on top of the paper for a 3D effect
            drawBinFrontRim(ctx);
        }

        if (!isBehindBin) {
            // Draw paper in front of bin
             ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(paper.rotationZ * Math.PI / 180);
            drawPaperBall(ctx, scale);
            ctx.restore();
        }

        // --- UI Elements ---
        // Wind Indicator
        const fanX = currentWind.direction > 0 ? 30 : SCENE_WIDTH - 80;
        const fanY = 100;
        const wobble = currentWind.speed > 0.1 ? Math.sin(Date.now() / 60) * currentWind.speed * 1.2 : 0;
        const fanBodyX = fanX + wobble;

        ctx.fillStyle = "#64748B"; ctx.fillRect(fanBodyX, fanY, 50, 50);
        ctx.fillStyle = "#334155"; ctx.fillRect(fanBodyX + 5, fanY + 5, 40, 40);

        ctx.save();
        ctx.translate(fanBodyX + 25, fanY + 25);
        ctx.rotate(fanRotation.current * Math.PI / 180);
        ctx.fillStyle = "#94A3B8";
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillRect(4, -3, 14, 6);
        }
        ctx.restore();

        ctx.fillStyle = '#E2E8F0'; ctx.font = `bold 18px ${FONT_FAMILY}`; ctx.textAlign = 'center';
        ctx.fillText(`WIND: ${currentWind.speed.toFixed(1)}`, fanBodyX + 25, 80);

        if (currentWind.speed > 0) {
            const arrowX = currentWind.direction > 0 ? fanX + 80 : fanX - 30;
            ctx.beginPath();
            ctx.moveTo(arrowX, 125);
            ctx.lineTo(arrowX + currentWind.direction * 50, 125);
            ctx.lineTo(arrowX + currentWind.direction * 50 - currentWind.direction * 10, 120);
            ctx.moveTo(arrowX + currentWind.direction * 50, 125);
            ctx.lineTo(arrowX + currentWind.direction * 50 - currentWind.direction * 10, 130);
            ctx.strokeStyle = "#0EA5E9"; ctx.lineWidth = 4; ctx.stroke();
        }

        animationFrameId.current = requestAnimationFrame(animate);
    }, [handleSuccess, handleMiss, resetPaper]);

    useEffect(() => {
        const savedHighScore = localStorage.getItem('paper-toss-highscore');
        if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

        if (windParticles.current.length === 0) {
            for (let i = 0; i < 40; i++) {
                windParticles.current.push({
                    x: Math.random() * SCENE_WIDTH, y: Math.random() * (FLOOR_Y - 50),
                    radius: Math.random() * 1.5 + 1, opacity: Math.random() * 0.4 + 0.1,
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
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [animate]);
    
    const getPointerPosition = (e: React.PointerEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (paperState.current.inFlight || paperState.current.isScoring) return;
        resetPaper(); // Reset on new touch if it was sitting on the floor
        flickStartPos.current = getPointerPosition(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (paperState.current.inFlight || !flickStartPos.current) return;
        
        const pos = getPointerPosition(e);
        const dx = pos.x - flickStartPos.current.x;
        const dy = pos.y - flickStartPos.current.y;
        
        if (dy < -15) { // Needs a clear upward flick
            const { current: paper } = paperState;
            paper.inFlight = true;
            paper.vx = dx * 0.12;
            paper.vy = -dy * 0.18;
            paper.vz = -dy * 0.22;
            paper.rotationSpeedZ = paper.vx * 0.5;
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
              onPointerMove={(e) => { if (flickStartPos.current) e.preventDefault()}}
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

export default PaperTTossScreen;
