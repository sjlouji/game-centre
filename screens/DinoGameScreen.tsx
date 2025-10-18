import React, { useRef, useEffect, useCallback } from 'react';
import Swipeable from '../components/Swipeable';

// --- Debug ---
const DEBUG_MODE = false; // Set to true to visualize hitboxes

// --- Game Constants ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 200;
const GAME_BACKGROUND = 'transparent';
// --- New Color Palette ---
const DINO_COLOR = '#38bdf8'; // sky-400
const DINO_EYE_COLOR = '#0f172a'; // slate-900
const OBSTACLE_COLOR = '#4ade80'; // emerald-400
const OBSTACLE_FLOWER_COLOR = '#fb7185'; // rose-400
const FONT = `bold 14px 'Exo 2', sans-serif`;

// --- Road ---
const GROUND_Y = GAME_HEIGHT - 40;
const ROAD_LINE_COLOR = '#475569'; // slate-600
const ROAD_SPECKLE_COLOR_RGB = '71, 85, 105'; // slate-500


// --- Dino (Cuter Proportions) ---
const DINO_X_POS = 40;
const DINO_INITIAL_Y = GROUND_Y;
const DINO_JUMP_FORCE = -12;
const DINO_GRAVITY = 0.6;
const DINO_BODY_WIDTH = 34;
const DINO_BODY_HEIGHT = 38;
const DINO_LEGS_HEIGHT = 8;
const DINO_HEIGHT = DINO_BODY_HEIGHT + DINO_LEGS_HEIGHT;
const DINO_DUCK_WIDTH = 48;
const DINO_DUCK_BODY_HEIGHT = 22;
const DINO_CORNER_RADIUS = 16;
const DINO_EYE_RADIUS = 3.5;
const DINO_SHADOW_MAX_WIDTH = 35;
const DINO_SHADOW_MIN_WIDTH = 20;
const DINO_SHADOW_MAX_OPACITY = 0.2;
const DINO_SHADOW_MIN_OPACITY = 0.05;


// --- Animation Constants ---
const DINO_DUCK_ANIM_SPEED = 0.2;
const OBSTACLE_SPAWN_ANIM_SPEED = 0.05;
const REPLAY_PULSE_SPEED = 0.05;
const LANDING_SQUASH_FRAMES = 6;


// --- Game Speed ---
const INITIAL_GAME_SPEED = 5;
const GAME_SPEED_INCREMENT = 0.001;
const GAME_SPEED_ACCELERATION_FACTOR = 1.5;

// --- Obstacles ---
const MIN_SPAWN_RATE_CAP = 25;
const MAX_SPAWN_RATE_CAP = 40;
const PTERANODON_SPAWN_SCORE = 300;
const SPAWN_RATE_ACCELERATION_SCORE = 1000;
const OBSTACLE_CORNER_RADIUS = 8;

// --- Dimensions for drawn objects ---
const CACTUS_WIDTH_SMALL = 22;
const CACTUS_HEIGHT_SMALL = 60;
const CACTUS_WIDTH_LARGE = 30;
const CACTUS_HEIGHT_LARGE = 80;
const PTERANODON_WIDTH = 55;
const PTERANODON_HEIGHT = 50;
const BUSH_WIDTH = 50;
const BUSH_HEIGHT = 35;

const OBSTACLE_DEFINITIONS = {
  CACTUS_SMALL: [
    { width: CACTUS_WIDTH_SMALL, height: CACTUS_HEIGHT_SMALL },
    { width: CACTUS_WIDTH_SMALL * 2, height: CACTUS_HEIGHT_SMALL },
  ],
  CACTUS_LARGE: [
    { width: CACTUS_WIDTH_LARGE, height: CACTUS_HEIGHT_LARGE },
    { width: CACTUS_WIDTH_LARGE * 2, height: CACTUS_HEIGHT_LARGE },
  ],
  PTERANODON: { width: PTERANODON_WIDTH, height: PTERANODON_HEIGHT },
  BUSH: [
    { width: BUSH_WIDTH, height: BUSH_HEIGHT },
    { width: BUSH_WIDTH * 1.5, height: BUSH_HEIGHT },
  ],
};

type ObstacleType = 'CACTUS_SMALL' | 'CACTUS_LARGE' | 'PTERANODON' | 'BUSH';
type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  frame?: number;
  spawnAnimProgress: number;
  hasFlower?: boolean;
};

type Hitbox = {
    x: number;
    y: number;
    w: number;
    h: number;
};

// Helper function to draw rounded rectangles
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}


const DinoGameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Game state refs
  const dinoY = useRef(DINO_INITIAL_Y);
  const dinoVelocityY = useRef(0);
  const dinoCurrentBodyHeight = useRef(DINO_BODY_HEIGHT);
  const dinoCurrentBodyWidth = useRef(DINO_BODY_WIDTH);
  const dinoRunFrame = useRef(0);
  const landingSquashFrames = useRef(0);
  const isJumping = useRef(false);
  const isDucking = useRef(false);
  const obstacles = useRef<Obstacle[]>([]);
  const frameCounter = useRef(0);
  const score = useRef(0);
  const highScore = useRef(0);
  const gameSpeed = useRef(INITIAL_GAME_SPEED);
  const nextObstacleFrame = useRef(0);
  const isGameOver = useRef(false);
  const gameOverAnimProgress = useRef(0);
  const roadOffset = useRef(0);
  const roadSpeckles = useRef<{ x: number; y: number; width: number; opacity: number; }[]>([]);
  
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = GAME_BACKGROUND;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!isGameOver.current) {
        updateDino();
        updateObstacles();
        updateScore();
        checkCollision();
        roadOffset.current += gameSpeed.current;
    }

    drawGround(ctx);
    drawDino(ctx);
    drawObstacles(ctx);
    drawScore(ctx);

    if (DEBUG_MODE) {
        drawDebugHitboxes(ctx);
    }

    if (isGameOver.current) {
        gameOverAnimProgress.current = Math.min(1, gameOverAnimProgress.current + 0.02);
        drawGameOver(ctx);
    }
    
    frameCounter.current++;
    animationFrameId.current = requestAnimationFrame(animate);
  }, []);

  const resetGame = useCallback(() => {
    dinoY.current = DINO_INITIAL_Y;
    dinoVelocityY.current = 0;
    isJumping.current = false;
    isDucking.current = false;
    dinoCurrentBodyHeight.current = DINO_BODY_HEIGHT;
    dinoCurrentBodyWidth.current = DINO_BODY_WIDTH;
    obstacles.current = [];
    frameCounter.current = 0;
    score.current = 0;
    gameSpeed.current = INITIAL_GAME_SPEED;
    isGameOver.current = false;
    nextObstacleFrame.current = 100;
    gameOverAnimProgress.current = 0;
    roadOffset.current = 0;
    const speckles = [];
    for (let i = 0; i < 150; i++) {
        speckles.push({
            x: Math.random() * GAME_WIDTH,
            y: GROUND_Y + 3 + Math.random() * 12,
            width: Math.random() * 6 + 2,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
    roadSpeckles.current = speckles;
    
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    animate();
  }, [animate]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHighScore = localStorage.getItem('dino-highscore');
      if(savedHighScore) {
        highScore.current = parseInt(savedHighScore, 10);
      }
    }
    resetGame();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [resetGame]);

  const handleJumpOrRestart = useCallback(() => {
    if (isGameOver.current) {
      resetGame();
      return;
    }
    if (!isJumping.current) {
      isJumping.current = true;
      dinoVelocityY.current = DINO_JUMP_FORCE;
    }
  }, [resetGame]);

  const handleDuckStart = useCallback(() => {
    if (!isJumping.current) {
      isDucking.current = true;
    }
  }, []);
  
  const handleDuckEnd = useCallback(() => {
    isDucking.current = false;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      handleJumpOrRestart();
    } else if (e.code === 'ArrowDown') {
      handleDuckStart();
    }
  }, [handleJumpOrRestart, handleDuckStart]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'ArrowDown') {
      handleDuckEnd();
    }
  }, [handleDuckEnd]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const drawGround = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.strokeStyle = ROAD_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
  
    roadSpeckles.current.forEach(speckle => {
      const drawX = ((speckle.x - roadOffset.current) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      ctx.fillStyle = `rgba(${ROAD_SPECKLE_COLOR_RGB}, ${speckle.opacity})`;
      ctx.fillRect(drawX, speckle.y, speckle.width, 2);
    });
  };


  const updateDino = () => {
    if (isJumping.current) {
      dinoY.current += dinoVelocityY.current;
      dinoVelocityY.current += DINO_GRAVITY;
      if (dinoY.current >= DINO_INITIAL_Y) {
        dinoY.current = DINO_INITIAL_Y;
        isJumping.current = false;
        dinoVelocityY.current = 0;
        landingSquashFrames.current = LANDING_SQUASH_FRAMES;
      }
    }
    const targetHeight = isDucking.current && !isJumping.current ? DINO_DUCK_BODY_HEIGHT : DINO_BODY_HEIGHT;
    const targetWidth = isDucking.current && !isJumping.current ? DINO_DUCK_WIDTH : DINO_BODY_WIDTH;
    
    dinoCurrentBodyHeight.current += (targetHeight - dinoCurrentBodyHeight.current) * DINO_DUCK_ANIM_SPEED;
    dinoCurrentBodyWidth.current += (targetWidth - dinoCurrentBodyWidth.current) * DINO_DUCK_ANIM_SPEED;

    if (!isJumping.current && !isDucking.current) {
      const animationSpeed = Math.max(3, 12 - Math.floor(gameSpeed.current));
      if (frameCounter.current % animationSpeed === 0) {
          dinoRunFrame.current = (dinoRunFrame.current + 1) % 2;
      }
    }
  };
  
  const getDinoHitboxes = (): Hitbox[] => {
    const inset = 4;
    const bodyH = dinoCurrentBodyHeight.current;
    const bodyW = dinoCurrentBodyWidth.current;
    const legsH = dinoCurrentBodyHeight.current < DINO_BODY_HEIGHT - 5 ? 0 : DINO_LEGS_HEIGHT;
    
    const totalH = bodyH + legsH;
    const topY = dinoY.current - totalH;

    return [{ 
        x: DINO_X_POS + inset / 2, 
        y: topY + inset / 2, 
        w: bodyW - inset, 
        h: totalH - inset
    }];
  };

  const getObstacleHitboxes = (obstacle: Obstacle): Hitbox[] => {
    const obstacleY = DINO_INITIAL_Y;
    if (obstacle.type === 'PTERANODON') {
        const body: Hitbox = {
            x: obstacle.x + obstacle.width * 0.2,
            y: obstacle.y - obstacle.height + obstacle.height * 0.3,
            w: obstacle.width * 0.6,
            h: obstacle.height * 0.4
        };
        const wings: Hitbox = {
            x: obstacle.x,
            y: obstacle.y - obstacle.height + obstacle.height * 0.5,
            w: obstacle.width,
            h: obstacle.height * 0.2
        };
        return [body, wings];
    } else if (obstacle.type === 'BUSH') {
      return [{
        x: obstacle.x + 4,
        y: obstacleY - obstacle.height + 4,
        w: obstacle.width - 8,
        h: obstacle.height - 4
      }];
    } else if (obstacle.type === 'CACTUS_LARGE') {
        const stemWidth = obstacle.width * 0.4;
        const stemHeight = obstacle.height;
        const stemX = obstacle.x + (obstacle.width - stemWidth) / 2;
        const stemY = obstacleY - stemHeight;
        
        const armWidth = obstacle.width * 0.7;
        const armHeight = stemWidth;

        const mainStem: Hitbox = { x: stemX, y: stemY, w: stemWidth, h: stemHeight };
        const leftArm: Hitbox = { x: stemX - armWidth * 0.5, y: stemY + stemHeight * 0.3, w: armWidth * 0.8, h: armHeight };
        const rightArm: Hitbox = { x: stemX + stemWidth, y: stemY + stemHeight * 0.5, w: armWidth * 0.8, h: armHeight };
        
        return [mainStem, leftArm, rightArm];
    } else { // CACTUS_SMALL
        const topBarHeight = obstacle.height * 0.4;
        const stemWidth = obstacle.width * 0.3;
        const stemHeight = obstacle.height * 0.6;

        const topBar: Hitbox = {
            x: obstacle.x,
            y: obstacleY - obstacle.height,
            w: obstacle.width,
            h: topBarHeight
        };
        const stem: Hitbox = {
            x: obstacle.x + (obstacle.width - stemWidth) / 2,
            y: obstacleY - stemHeight,
            w: stemWidth,
            h: stemHeight
        };
        return [topBar, stem];
    }
  };

  const checkCollision = () => {
    const dinoHitboxes = getDinoHitboxes();
    for (const obstacle of obstacles.current) {
        const obstacleHitboxes = getObstacleHitboxes(obstacle);
        for (const dBox of dinoHitboxes) {
            for (const oBox of obstacleHitboxes) {
                if (
                    dBox.x < oBox.x + oBox.w &&
                    dBox.x + dBox.w > oBox.x &&
                    dBox.y < oBox.y + oBox.h &&
                    dBox.h + dBox.y > oBox.y
                ) {
                    isGameOver.current = true;
                    gameOverAnimProgress.current = 0;
                    if (score.current > highScore.current) {
                        highScore.current = Math.floor(score.current);
                        localStorage.setItem('dino-highscore', highScore.current.toString());
                    }
                    return;
                }
            }
        }
    }
  };
  
  const spawnObstacle = () => {
    const obstacleTypes: ObstacleType[] = ['CACTUS_SMALL', 'CACTUS_LARGE', 'BUSH'];
    if (score.current > PTERANODON_SPAWN_SCORE) {
      obstacleTypes.push('PTERANODON');
    }

    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let newObstacle: Partial<Obstacle> & { type: ObstacleType };

    switch (type) {
      case 'CACTUS_SMALL': {
        const variants = OBSTACLE_DEFINITIONS.CACTUS_SMALL;
        const variant = variants[Math.floor(Math.random() * variants.length)];
        newObstacle = { y: DINO_INITIAL_Y, type, ...variant };
        break;
      }
      case 'CACTUS_LARGE': {
        const variants = OBSTACLE_DEFINITIONS.CACTUS_LARGE;
        const variant = variants[Math.floor(Math.random() * variants.length)];
        newObstacle = { y: DINO_INITIAL_Y, type, ...variant, hasFlower: Math.random() > 0.7 };
        break;
      }
      case 'BUSH': {
        const variants = OBSTACLE_DEFINITIONS.BUSH;
        const variant = variants[Math.floor(Math.random() * variants.length)];
        newObstacle = { y: DINO_INITIAL_Y, type, ...variant };
        break;
      }
      case 'PTERANODON': {
        const heights = [DINO_INITIAL_Y - 20, DINO_INITIAL_Y - 50, 90];
        const y = heights[Math.floor(Math.random() * heights.length)];
        newObstacle = { y, type, ...OBSTACLE_DEFINITIONS.PTERANODON, frame: 1 };
        break;
      }
    }

    obstacles.current.push({
      x: GAME_WIDTH,
      spawnAnimProgress: 0,
      ...(newObstacle as any),
    });
  };
  
  const updateObstacles = () => {
    if (frameCounter.current > nextObstacleFrame.current) {
        spawnObstacle();
        
        const baseMin = 50;
        const baseMax = 100;
        let reductionFactor = Math.floor(score.current / 250);

        if (score.current > SPAWN_RATE_ACCELERATION_SCORE) {
            const bonusReduction = Math.floor((score.current - SPAWN_RATE_ACCELERATION_SCORE) / 250) * 2;
            reductionFactor += bonusReduction;
        }
        
        const currentMinRate = Math.max(MIN_SPAWN_RATE_CAP, baseMin - reductionFactor * 2);
        const currentMaxRate = Math.max(MAX_SPAWN_RATE_CAP, baseMax - reductionFactor * 3);

        const spawnDelay = Math.floor(Math.random() * (currentMaxRate - currentMinRate + 1)) + currentMinRate;
        nextObstacleFrame.current = frameCounter.current + spawnDelay;
    }
    
    obstacles.current.forEach(obstacle => {
        obstacle.x -= gameSpeed.current;
        if (obstacle.type === 'PTERANODON' && frameCounter.current % 10 === 0) {
            obstacle.frame = (obstacle.frame === 1) ? 2 : 1;
        }
        if (obstacle.spawnAnimProgress < 1) {
            obstacle.spawnAnimProgress += OBSTACLE_SPAWN_ANIM_SPEED;
        }
    });

    obstacles.current = obstacles.current.filter(obstacle => obstacle.x > -obstacle.width);
  };

  const updateScore = () => {
    if (frameCounter.current % 10 === 0) {
        score.current += 1;
    }
    
    const speedRampFactor = Math.floor(score.current / 1000);
    const currentIncrement = GAME_SPEED_INCREMENT * (1 + speedRampFactor * GAME_SPEED_ACCELERATION_FACTOR);
    gameSpeed.current += currentIncrement;
  };

  const drawDino = (ctx: CanvasRenderingContext2D) => {
    const yPos = dinoY.current;
    let bodyH = dinoCurrentBodyHeight.current;
    let bodyW = dinoCurrentBodyWidth.current;

    const jumpHeight = DINO_INITIAL_Y - yPos;
    const maxJumpHeight = DINO_INITIAL_Y - (DINO_INITIAL_Y + DINO_JUMP_FORCE * 8);
    const jumpRatio = Math.max(0, Math.min(1, jumpHeight / maxJumpHeight));

    const shadowWidth = DINO_SHADOW_MAX_WIDTH - (DINO_SHADOW_MAX_WIDTH - DINO_SHADOW_MIN_WIDTH) * jumpRatio;
    const shadowOpacity = DINO_SHADOW_MAX_OPACITY - (DINO_SHADOW_MAX_OPACITY - DINO_SHADOW_MIN_OPACITY) * jumpRatio;
    const shadowY = GROUND_Y + 5;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.beginPath();
    ctx.ellipse(DINO_X_POS + bodyW / 2, shadowY, shadowWidth / 2, shadowWidth / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = DINO_COLOR;
    
    let isSquashing = false;
    if (landingSquashFrames.current > 0) {
        const squashFactor = Math.sin((landingSquashFrames.current / LANDING_SQUASH_FRAMES) * Math.PI) * 0.2;
        bodyH -= DINO_BODY_HEIGHT * squashFactor;
        bodyW += DINO_BODY_WIDTH * squashFactor;
        landingSquashFrames.current--;
        isSquashing = true;
    } else if (isJumping.current) {
        const stretchFactor = -dinoVelocityY.current / DINO_JUMP_FORCE * 0.15;
        bodyH += DINO_BODY_HEIGHT * stretchFactor;
        bodyW -= DINO_BODY_WIDTH * stretchFactor;
    }

    const isDucked = dinoCurrentBodyHeight.current < DINO_BODY_HEIGHT - 5;
    const legHeight = isDucked ? 0 : DINO_LEGS_HEIGHT;

    const bodyTopY = yPos - legHeight - bodyH;
    drawRoundedRect(ctx, DINO_X_POS, bodyTopY, bodyW, bodyH, DINO_CORNER_RADIUS);
    
    if (!isDucked && !isSquashing) {
        ctx.fillStyle = DINO_COLOR;
        const legWidth = 8;
        const legFullHeight = DINO_LEGS_HEIGHT + 2;
        const legBentHeight = DINO_LEGS_HEIGHT * 0.7;
        
        const legFrontX = DINO_X_POS + bodyW * 0.6;
        const legBackX = DINO_X_POS + bodyW * 0.2;
        
        if (isJumping.current) {
            drawRoundedRect(ctx, legFrontX, yPos - legBentHeight, legWidth, legBentHeight, 4);
            drawRoundedRect(ctx, legBackX, yPos - legBentHeight, legWidth, legBentHeight, 4);
        } else {
            const animationSpeed = Math.max(3, 15 - Math.floor(gameSpeed.current));
            if (frameCounter.current % animationSpeed === 0) {
                dinoRunFrame.current = (dinoRunFrame.current + 1) % 2;
            }
            if (dinoRunFrame.current === 0) {
              drawRoundedRect(ctx, legFrontX, yPos - legFullHeight, legWidth, legFullHeight, 4);
              drawRoundedRect(ctx, legBackX, yPos - legBentHeight, legWidth, legBentHeight, 4);
            } else {
              drawRoundedRect(ctx, legFrontX, yPos - legBentHeight, legWidth, legBentHeight, 4);
              drawRoundedRect(ctx, legBackX, yPos - legFullHeight, legWidth, legFullHeight, 4);
            }
        }
    }
    
    ctx.fillStyle = DINO_EYE_COLOR;
    ctx.beginPath();
    const eyeX = DINO_X_POS + bodyW * 0.7;
    const eyeY = bodyTopY + bodyH * 0.35;
    ctx.arc(eyeX, eyeY, DINO_EYE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  };
  
  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    obstacles.current.forEach(obstacle => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, obstacle.spawnAnimProgress);
        ctx.fillStyle = OBSTACLE_COLOR;
        const obstacleY = DINO_INITIAL_Y;
        if (obstacle.type === 'PTERANODON') {
            const bodyY = obstacle.y - obstacle.height * 0.8;
            drawRoundedRect(ctx, obstacle.x + obstacle.width * 0.2, bodyY, obstacle.width * 0.6, obstacle.height * 0.4, 8);
            
            ctx.fillStyle = DINO_EYE_COLOR;
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width * 0.7, bodyY + obstacle.height * 0.15, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = OBSTACLE_COLOR;
            const wingY = obstacle.y - obstacle.height * 0.5;
            const wingHeight = obstacle.height * 0.2;
            ctx.beginPath();
            ctx.moveTo(obstacle.x, wingY);
            const wingFlap = obstacle.frame === 1 ? -10 : 10;
            ctx.quadraticCurveTo(obstacle.x + obstacle.width / 2, wingY + wingFlap, obstacle.x + obstacle.width, wingY);
            ctx.quadraticCurveTo(obstacle.x + obstacle.width / 2, wingY + wingFlap + wingHeight, obstacle.x, wingY);
            ctx.closePath();
            ctx.fill();

        } else if (obstacle.type === 'BUSH') {
            drawRoundedRect(ctx, obstacle.x, obstacleY - obstacle.height, obstacle.width, obstacle.height, 15);
        } else if (obstacle.type === 'CACTUS_LARGE') {
            const stemWidth = obstacle.width * 0.4;
            const stemHeight = obstacle.height;
            const stemX = obstacle.x + (obstacle.width - stemWidth) / 2;
            const stemY = obstacleY - stemHeight;
            drawRoundedRect(ctx, stemX, stemY, stemWidth, stemHeight, OBSTACLE_CORNER_RADIUS);

            const armWidth = obstacle.width * 0.7;
            const armHeight = stemWidth;
            
            const leftArmX = stemX - armWidth * 0.5;
            const leftArmY = stemY + stemHeight * 0.3;
            drawRoundedRect(ctx, leftArmX, leftArmY, armWidth, armHeight, OBSTACLE_CORNER_RADIUS);
            
            const rightArmX = stemX + stemWidth - armWidth * 0.2;
            const rightArmY = stemY + stemHeight * 0.5;
            drawRoundedRect(ctx, rightArmX, rightArmY, armWidth, armHeight, OBSTACLE_CORNER_RADIUS);
            
            if (obstacle.hasFlower) {
              ctx.fillStyle = OBSTACLE_FLOWER_COLOR;
              ctx.beginPath();
              ctx.arc(stemX + stemWidth / 2, stemY - 5, 5, 0, Math.PI * 2);
              ctx.fill();
            }

        } else { // CACTUS_SMALL
            const topBarWidth = obstacle.width;
            const topBarHeight = obstacle.height * 0.4;
            const stemWidth = obstacle.width * 0.3;
            const stemHeight = obstacle.height * 0.6;
            
            drawRoundedRect(ctx, obstacle.x, obstacleY - obstacle.height, topBarWidth, topBarHeight, OBSTACLE_CORNER_RADIUS);
            const stemX = obstacle.x + (topBarWidth - stemWidth) / 2;
            const stemY = obstacleY - stemHeight;
            drawRoundedRect(ctx, stemX, stemY, stemWidth, stemHeight, OBSTACLE_CORNER_RADIUS / 2);
        }
        ctx.restore();
    });
  };
  
  const drawScore = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = FONT;
    ctx.textAlign = 'right';
    const displayScore = Math.floor(score.current).toString().padStart(5, '0');
    const displayHighScore = highScore.current.toString().padStart(5, '0');
    ctx.fillText(`HI ${displayHighScore} ${displayScore}`, GAME_WIDTH - 10, 20);
  };

  const drawGameOver = (ctx: CanvasRenderingContext2D) => {
      const p = gameOverAnimProgress.current;
      const easedP = 1 - Math.pow(1 - p, 4);

      const centerX = GAME_WIDTH / 2;
      const centerY = GAME_HEIGHT / 2;
      const outerRadius = GAME_WIDTH * 0.7;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
      gradient.addColorStop(0.2, `rgba(2, 6, 23, ${easedP * 0.85})`);
      gradient.addColorStop(1, `rgba(2, 6, 23, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.globalAlpha = easedP;

      const titleY = GAME_HEIGHT / 2 - 40 - (1 - easedP) * 20;
      ctx.font = `bold 32px 'Exo 2', sans-serif`;
      ctx.fillStyle = '#fb7185';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, titleY);

      const scoreY = GAME_HEIGHT / 2 + 10 - (1 - easedP) * 20;
      ctx.font = `bold 16px 'Exo 2', sans-serif`;
      ctx.fillStyle = '#94a3b8';
      const finalScoreText = `SCORE: ${Math.floor(score.current)}`;
      const bestScoreText = `BEST: ${highScore.current}`;
      ctx.fillText(finalScoreText, GAME_WIDTH / 2, scoreY);
      ctx.fillText(bestScoreText, GAME_WIDTH / 2, scoreY + 25);
      
      if (easedP > 0.5) {
        const promptOpacity = (easedP - 0.5) * 2;
        ctx.globalAlpha = promptOpacity;

        const pulse = Math.sin(frameCounter.current * REPLAY_PULSE_SPEED) * 0.5 + 0.5;
        const glowOpacity = pulse * 0.7;
        
        ctx.font = `bold 18px 'Exo 2', sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.shadowColor = `rgba(148, 163, 184, ${glowOpacity})`;
        ctx.shadowBlur = 15;

        ctx.fillText('Tap to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);

        ctx.shadowBlur = 0;
      }
      
      ctx.globalAlpha = 1;
  };

  const drawDebugHitboxes = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;

    const dinoHitboxes = getDinoHitboxes();
    dinoHitboxes.forEach(box => {
        ctx.strokeRect(box.x, box.y, box.w, box.h);
    });

    obstacles.current.forEach(obstacle => {
        const obstacleHitboxes = getObstacleHitboxes(obstacle);
        obstacleHitboxes.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.w, box.h);
        });
    });
  };
  
  return (
    <Swipeable
      className="w-full flex-grow flex items-center justify-center"
      onTap={handleJumpOrRestart}
      onSwipeUp={handleJumpOrRestart}
      onSwipeDown={handleDuckStart}
      onTouchEnd={handleDuckEnd}
    >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full max-w-[600px] h-auto"
        />
    </Swipeable>
  );
};

export default DinoGameScreen;