# React Game Center

A sleek, responsive, and modern game hub built from the ground up with React, TypeScript, and Tailwind CSS. This project showcases a polished user interface and a fully-functional 2048 game, all wrapped in a scalable "Game Center" architecture designed for easy expansion.

![React 2048 Game Center](https://i.imgur.com/example.png)  
*(Note: Replace with an actual screenshot of the application)*

---

## Features

### Game Center Hub
- **Dynamic & Animated UI**: A visually appealing interface with a subtle animated gradient background and smooth screen transitions.
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

- **React**: For building a component-based, declarative UI.
- **TypeScript**: For robust, type-safe code that is easier to maintain and scale.
- **Tailwind CSS**: For a utility-first CSS framework that enables rapid and consistent styling.
- **HTML5 / CSS3**: Core web technologies, including modern features like CSS variables and keyframe animations.
- **No Build Tools**: This project is configured to run directly in the browser using ES Modules and an `importmap`, making it simple to get started.

---

## Project Structure

The codebase is organized into a clean and logical structure to promote modularity and ease of navigation.

```
/
├── components/         # Reusable React components (GameBoard, Tile, Modals, etc.)
├── screens/            # Top-level screen components (GameCenter, Game2048Screen)
├── types/              # TypeScript type definitions (TileType)
├── constants.ts        # Shared constants (GRID_SIZE)
├── App.tsx             # Main application component with routing logic
├── index.html          # The entry point of the web application
├── index.tsx           # The React bootstrap script
└── metadata.json       # Application metadata
```

---

## Getting Started

This project is set up to be run without any complex build steps or package installations.

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd <project-directory>
    ```

3.  **Run a local server:**
    Since the project uses ES Modules, you need to serve the files from a local web server. A simple way to do this is with Python's built-in server or a tool like `live-server`.

    **Using Python 3:**
    ```sh
    python -m http.server
    ```

    **Using `live-server` for VS Code:**
    - Install the "Live Server" extension in Visual Studio Code.
    - Right-click on `index.html` in the file explorer and select "Open with Live Server".

4.  **Open in your browser:**
    Navigate to the local address provided by your server (e.g., `http://localhost:8000`).

---

## How to Add a New Game

The application is designed to be easily extensible. To add a new game:

1.  **Create the Game Component**: Build your new game as a React component inside the `screens/` directory (e.g., `screens/NewGameScreen.tsx`).

2.  **Add Game Metadata**: In `App.tsx`, add a new game object to the `GAMES` array.
    ```typescript
    const GAMES: Game[] = [
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

3.  **Add the Route**: In `App.tsx`, add a `case` for your new game's ID in the `renderActiveScreen` function to render your component.
    ```typescript
    const renderActiveScreen = () => {
      // ...
      switch (activeGame) {
        case '2048':
          return <Game2048Screen />;
        case 'new-game': // Add this case
          return <NewGameScreen />;
        default:
          return <GameCenter ... />;
      }
    };
    ```
