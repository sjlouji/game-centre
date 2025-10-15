
import React from 'react';

export type GameId = '2048' | 'dino' | 'stickman' | 'bouncing-ball';

export interface Game {
  id: GameId;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  visual: React.ReactNode;
}

// FIX: Replaced JSX with React.createElement to be valid in a .ts file
export const GAMES: Game[] = [
  {
    id: '2048',
    title: '2048',
    description: 'Join the numbers to get the 2048 tile!',
    status: 'available',
    visual: React.createElement(
      'div',
      { className: 'grid grid-cols-2 gap-2 w-24 h-24' },
      React.createElement('div', { className: 'bg-slate-700 rounded-md' }),
      React.createElement('div', { className: 'bg-amber-400 rounded-md' }),
      React.createElement('div', { className: 'bg-rose-400 rounded-md' }),
      React.createElement('div', { className: 'bg-slate-400 rounded-md' })
    ),
  },
  {
    id: 'dino',
    title: 'Pixel Dino Run',
    description: 'Jump over obstacles and run as far as you can!',
    status: 'available',
    visual: React.createElement(
      'div',
      { className: 'w-24 h-16 relative' },
      React.createElement(
        'div',
        { className: 'absolute bottom-2 left-0 w-full h-px bg-slate-400' },
        React.createElement('div', { className: 'absolute top-0 left-[10%] w-1 h-0.5 bg-slate-400' }),
        React.createElement('div', { className: 'absolute top-0 left-[40%] w-2 h-0.5 bg-slate-400' }),
        React.createElement('div', { className: 'absolute top-0 left-[75%] w-1 h-0.5 bg-slate-400' })
      ),
      React.createElement(
        'div',
        { className: 'absolute bottom-[0.6rem] left-2 w-5 h-6 bg-sky-400 rounded-t-sm' },
        React.createElement('div', { className: 'absolute top-1 right-1 w-1 h-1 bg-slate-900 rounded-full' })
      ),
      React.createElement(
        'div',
        { className: 'absolute bottom-[0.6rem] right-4 w-2 h-4 bg-emerald-400' },
        React.createElement('div', { className: 'absolute top-0 -left-1 w-4 h-1 bg-emerald-400' })
      )
    ),
  },
  {
    id: 'stickman',
    title: 'Stickman Hook',
    description: 'Swing through levels with your grappling hook!',
    status: 'coming-soon',
    visual: React.createElement(
      'div',
      { className: 'w-16 h-16 relative' },
      React.createElement('div', { className: 'absolute top-[-0.5rem] left-[3.2rem] w-12 h-0.5 bg-slate-600 transform -rotate-45 origin-top-left' }),
      React.createElement(
        'div',
        { className: 'absolute bottom-2 left-2 transform -rotate-45' },
        React.createElement('div', { className: 'w-5 h-5 rounded-full bg-sky-400' }),
        React.createElement('div', { className: 'absolute top-4 left-2 w-0.5 h-6 bg-sky-400' })
      )
    ),
  },
    {
    id: 'bouncing-ball',
    title: 'Bouncing Ball',
    description: 'Navigate your ball through tricky obstacles.',
    status: 'coming-soon',
    visual: React.createElement(
      'div',
      { className: 'w-16 h-16 relative' },
      React.createElement('div', { className: 'absolute top-3 left-1/2 transform -translate-x-1/2 w-9 h-9 rounded-full bg-rose-400' }),
      React.createElement('div', { className: 'absolute bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-slate-800 rounded-full opacity-75 blur-sm' })
    ),
  },
];
