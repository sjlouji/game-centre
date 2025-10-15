# Next.js Game Center

A sleek, responsive, and modern game hub built from the ground up with Next.js, React, TypeScript, and Tailwind CSS. This project showcases a polished user interface and a fully-functional 2048 game, all wrapped in a scalable "Game Center" architecture designed for easy expansion.

---

## Features

### Game Center Hub
- **Dynamic & Animated UI**: A visually appealing interface with a subtle animated gradient background.
- **File-Based Routing**: Clean, shareable URLs for each game (e.g., `/2048`).
- **Featured Game Section**: Highlights a primary game for immediate engagement.
- **Extensible Game Library**: A clean grid layout for adding and displaying multiple games.
- **"Coming Soon" State**: Easily mark games that are in development to build anticipation.
- **Responsive Design**: A mobile-first approach ensures a seamless experience on all devices, from phones to desktops.

### 2048 Game
- **Classic Gameplay**: The beloved 2048 mechanics are fully implemented.
- **Responsive Controls**:
    - **Desktop**: Intuitive `Arrow Keys` for tile movement.
    - **Mobile**: Smooth `Swipe` gestures for on-the-go play.
- **Rich Animations**:
    - Tiles spawn, slide, and merge with fluid animations.
    - The score and high score "pop" when updated for satisfying feedback.
- **State & Stat Management**:
    - **Undo Move**: Made a mistake? Undo your last move with `Ctrl+Z` or the undo button.
    - **Persistent High Score**: Your best score is saved locally, so you can always aim to beat it.
    - **Detailed Statistics**: An elegant modal displays your highest tile achieved, total games won, and current win streak.
- **Engagement & Replayability**:
    - **Achievements System**: Unlock badges for reaching high-value tiles (512, 1024, 2048, and beyond). Progress is saved across sessions.
    - **Social Sharing**: Share your score with a click after winning or on game over.
- **Haptic Feedback**: Subtle vibrations on mobile devices enhance the tactile feel of moving and merging tiles.

---

## Tech Stack

- **Next.js**: A React framework for production-grade applications.
- **React**: For building a component-based, declarative UI.
- **TypeScript**: For robust, type-safe code that is easier to maintain and scale.
- **Tailwind CSS**: For a utility-first CSS framework that enables rapid and consistent styling.
- **PostCSS / Autoprefixer**: For processing and optimizing CSS for browser compatibility.

---

## Project Structure

```
/
├── components/         # Reusable React components (Header, Modals, Game-specific UI)
├── lib/                # Shared utilities, types, and constants
├── pages/              # Application routes (index.tsx, 2048.tsx, etc.)
│   ├── api/            # API routes
│   ├── _app.tsx        # Main application wrapper
│   └── _document.tsx   # Custom document structure
├── screens/            # Top-level screen components (GameCenter, Game2048Screen)
├── styles/             # Global styles
├── public/             # Static assets
└── tailwind.config.js  # Tailwind CSS configuration
```

---

## Getting Started

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```

4.  **Open in your browser:**
    Navigate to `http://localhost:3000`.

---

## How to Add a New Game

The application is designed to be easily extensible. To add a new game:

1.  **Create the Game Component**: Build your new game as a React component, for example in `screens/NewGameScreen.tsx`.

2.  **Add Game Metadata**: In `lib/games.ts`, add a new game object to the `GAMES` array.
    ```typescript
    export const GAMES: Game[] = [
      // ... existing games
      {
        id: 'new-game', // A unique string ID
        title: 'New Awesome Game',
        description: 'A brief, exciting description of the game.',
        status: 'available', // or 'coming-soon'
        visual: ( /* A ReactNode for the game card visual */ ),
      },
    ];
    ```

3.  **Create the Game Page**: Create a new file in the `pages/` directory named after your game's ID (e.g., `pages/new-game.tsx`).
    ```tsx
    import NewGameScreen from '../screens/NewGameScreen';

    const NewGamePage: React.FC = () => {
      return <NewGameScreen />;
    };

    export default NewGamePage;
    ```
The game will now automatically appear in the Game Center and be accessible via its own URL.
