# Project Quickstart

This project was vibe coded with [SteerCode](https://steercode.com).

Follow this guide for editing, running, and publishing your project.

## Project Access

Visit your project directly here:

[<YOUR_PROJECT_URL>](<YOUR_PROJECT_URL>)

## How to Edit Your Project

You have several options to manage and edit your project:

### Using SteerCode

* Access your [project at SteerCode](<YOUR_PROJECT_URL>).
* Edit directly using simple prompts.
* All changes are automatically saved to your repository.

### Using a Local IDE

Follow these steps to edit your project locally:

1. **Clone Your Repository**

   ```bash
   git clone <YOUR_GIT_URL>
   ```

2. **Navigate to Your Project Directory**

   ```bash
   cd <YOUR_PROJECT_NAME>
   ```

3. **Install Dependencies**

   Ensure Node.js and npm are installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)):

   ```bash
   npm install
   ```

4. **Run the Development Server**

   Launch the local server with auto‑reload enabled:

   ```bash
   npm run dev
   ```

### Editing Directly on GitHub

For quick edits:

* Navigate to the file you wish to edit on GitHub.
* Click the pencil icon to enter edit mode.
* Make and commit your changes directly.

## Tech Stack

This project uses the following technologies:

* **Vite** – fast and efficient build tool
* **React** – interactive user interfaces
* **TypeScript** – JavaScript with strong typing
* **Tailwind CSS** – utility‑first CSS framework
* **shadcn‑ui** – modern UI components

## Publishing Your Project

To publish your project:

* Open [SteerCode](YOUR_PROJECT_URL).
* Click the **Publish** button.

Happy coding!

# 🌌 Cosmic Sudoku

> An enchanting space-themed Sudoku game with infinite levels, cosmic collection system, and beautiful bubble aesthetics.

![Cosmic Sudoku Banner](https://via.placeholder.com/800x400/1a1b3a/00f5ff?text=🌌+Cosmic+Sudoku+🌌)

## ✨ Features

### 🎮 Core Gameplay
- **Classic 9x9 Sudoku** with intuitive bubble-styled interface
- **Infinite Level Progression** with algorithmic difficulty scaling
- **Real-time Validation** with visual feedback for invalid moves
- **Smart Number Pad** for easy input on any device
- **Responsive Design** optimized for desktop, tablet, and mobile

### 🌟 Gamification System
- **Stardust Currency** - Earn cosmic rewards for completing puzzles
- **Achievement System** - Unlock 6+ cosmic achievements for various accomplishments
- **Power-Up Shop** - Strategic abilities to enhance your gameplay:
  - 💡 **Stellar Hint** - Reveal possible numbers for a cell
  - ✨ **Cosmic Reveal** - Auto-fill a correct number
  - ⏸️ **Time Freeze** - Pause timer for 30 seconds
  - 🛡️ **Error Shield** - Prevent mistake penalties
- **Cosmic Collection** - Unlock beautiful space themes and customizations
- **Streak Tracking** - Maintain winning streaks for bonus rewards

### 🎨 Visual Design
- **Space-themed Background** with animated twinkling stars
- **Bubble Aesthetics** inspired by modern mobile games
- **Cosmic Color Palette** featuring stellar cyan, aurora pink, and galaxy purple
- **Smooth Animations** with hover effects and celebrations
- **Theme Customization** - Unlock and switch between cosmic themes:
  - 🌌 Classic Cosmos
  - 🌸 Nebula Dreams
  - 🌈 Aurora Borealis
  - 🌠 Galaxy Explorer

### 🚀 Advanced Features
- **Animated Mascot** - "Cosmos" provides encouragement and reacts to gameplay
- **Celebration System** - Epic completion animations with detailed stats
- **Progress Tracking** - Comprehensive statistics and personal records
- **Local Storage** - All progress automatically saved
- **Performance Analytics** - Track time, accuracy, and improvement

## 🎯 Difficulty Scaling

The game features intelligent difficulty progression:

| Level Range | Difficulty | Clues Available | Description |
|-------------|------------|----------------|-------------|
| 1-10 | Easy | 40-45 | Perfect for beginners |
| 11-25 | Medium | 30-35 | Moderate challenge |
| 26-50 | Hard | 25-30 | Advanced puzzles |
| 51+ | Expert | 20-25 | Master-level difficulty |

## 🛠️ Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for lightning-fast development
- **Styling**: Tailwind CSS with custom cosmic theme
- **UI Components**: shadcn/ui with Radix primitives
- **Icons**: Lucide React
- **Notifications**: Sonner for beautiful toasts
- **State Management**: React hooks with localStorage persistence
- **Animations**: CSS transitions and custom keyframes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cosmic-sudoku.git
   cd cosmic-sudoku
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun run build
```

The built files will be in the `dist` directory, ready for deployment.

## 🎮 How to Play

1. **Select a Cell** - Click on any empty cell in the 9x9 grid
2. **Choose a Number** - Use the cosmic number pad to input values 1-9
3. **Follow Sudoku Rules**:
   - Each row must contain numbers 1-9 with no repeats
   - Each column must contain numbers 1-9 with no repeats
   - Each 3x3 box must contain numbers 1-9 with no repeats
4. **Use Power-Ups** strategically to overcome challenging puzzles
5. **Complete Levels** to earn stardust and unlock new cosmic themes
6. **Build Streaks** for bonus rewards and achievements

## 🏆 Achievements

Unlock cosmic achievements by demonstrating your skills:

- 🏆 **First Victory** - Complete your first puzzle
- ⚡ **Speed Demon** - Complete a puzzle in under 3 minutes
- 🎯 **Perfect Scholar** - Complete a puzzle without mistakes
- 🔥 **On Fire** - Win 5 games in a row
- ⭐ **Rising Star** - Reach level 10
- 🌌 **Cosmic Collector** - Unlock 3 cosmic themes

## 📱 Screenshots

<!-- Add actual screenshots when available -->
![Gameplay Screenshot](https://via.placeholder.com/600x400/1a1b3a/00f5ff?text=Gameplay+Screenshot)
*Main game interface with cosmic theme and animated mascot*

![Achievements Screen](https://via.placeholder.com/600x400/2d3561/ff6b9d?text=Achievements+Screen)
*Achievement system showing unlocked cosmic accomplishments*

![Theme Selection](https://via.placeholder.com/600x400/0a0a1a/c471ed?text=Theme+Selection)
*Cosmic theme customization with beautiful color palettes*

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── SudokuGrid.tsx  # Main game grid
│   ├── NumberPad.tsx   # Number input interface
│   ├── GameStats.tsx   # Statistics display
│   ├── CosmicMascot.tsx # Animated mascot
│   └── ...
├── hooks/              # Custom React hooks
│   └── useGameState.ts # Main game state management
├── utils/              # Utility functions
│   └── sudoku.ts       # Sudoku generation and validation
├── pages/              # Page components
└── styles/             # CSS and styling
```

### Key Components

- **`useGameState`** - Comprehensive hook managing game state, achievements, and persistence
- **`SudokuGrid`** - Interactive grid with validation and theming
- **`CosmicMascot`** - Animated character providing feedback and encouragement
- **`PowerUpBar`** - Strategic power-up system for enhanced gameplay

## 🎨 Customization

### Adding New Themes
1. Define your cosmic color palette in `useGameState.ts`
2. Add the theme to the `cosmicThemes` array
3. Set unlock conditions and stardust cost

### Creating New Power-Ups
1. Add power-up definition to `initialPowerUps`
2. Implement logic in the `handleUsePowerUp` function
3. Add appropriate icons and descriptions

### Modifying Difficulty
Adjust the difficulty scaling in `getDifficultyForLevel` function in `utils/sudoku.ts`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow the existing code style and conventions
- Add TypeScript types for new features
- Test your changes across different screen sizes
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic Sudoku puzzles and modern mobile game aesthetics
- Built with the amazing React and Tailwind CSS ecosystems
- UI components powered by shadcn/ui and Radix primitives
- Icons provided by Lucide React

## 🌟 Support the Project

If you enjoy Cosmic Sudoku, please:
- ⭐ Star this repository
- 🐛 Report bugs or suggest features
- 🔄 Share with fellow puzzle enthusiasts
- 🤝 Contribute to the codebase

---

**Explore infinite puzzles across the universe! 🌌🧩**

*Made with ❤️ and cosmic energy*