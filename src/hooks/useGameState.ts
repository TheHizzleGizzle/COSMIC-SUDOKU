import { useState, useEffect, useCallback } from 'react';
import { GameGrid, generatePuzzle, createGameGrid, getDifficultyForLevel, validateCell, isPuzzleComplete, calculateScore } from '@/utils/sudoku';

export interface GameStats {
  level: number;
  score: number;
  totalTime: number;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  stardust: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface CosmicTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  unlocked: boolean;
  cost: number;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  quantity: number;
}

const initialStats: GameStats = {
  level: 1,
  score: 0,
  totalTime: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  stardust: 100, // Starting stardust
};

const initialAchievements: Achievement[] = [
  { id: 'first-win', name: 'First Victory', description: 'Complete your first puzzle', icon: '🏆', unlocked: false },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Complete a puzzle in under 3 minutes', icon: '⚡', unlocked: false },
  { id: 'perfect-scholar', name: 'Perfect Scholar', description: 'Complete a puzzle without mistakes', icon: '🎯', unlocked: false },
  { id: 'streak-5', name: 'On Fire', description: 'Win 5 games in a row', icon: '🔥', unlocked: false },
  { id: 'level-10', name: 'Rising Star', description: 'Reach level 10', icon: '⭐', unlocked: false },
  { id: 'collector', name: 'Cosmic Collector', description: 'Unlock 3 cosmic themes', icon: '🌌', unlocked: false },
];

const cosmicThemes: CosmicTheme[] = [
  { id: 'default', name: 'Classic Cosmos', colors: { primary: '#00f5ff', secondary: '#ff6b9d', accent: '#c471ed' }, unlocked: true, cost: 0 },
  { id: 'nebula', name: 'Nebula Dreams', colors: { primary: '#ff4081', secondary: '#e91e63', accent: '#9c27b0' }, unlocked: false, cost: 500 },
  { id: 'aurora', name: 'Aurora Borealis', colors: { primary: '#00e676', secondary: '#4caf50', accent: '#8bc34a' }, unlocked: false, cost: 750 },
  { id: 'galaxy', name: 'Galaxy Explorer', colors: { primary: '#3f51b5', secondary: '#5c6bc0', accent: '#9575cd' }, unlocked: false, cost: 1000 },
];

const initialPowerUps: PowerUp[] = [
  { id: 'stellar-hint', name: 'Stellar Hint', description: 'Reveal possible numbers for a cell', icon: '💡', cost: 50, quantity: 3 },
  { id: 'cosmic-reveal', name: 'Cosmic Reveal', description: 'Fill in a correct number', icon: '✨', cost: 100, quantity: 1 },
  { id: 'time-freeze', name: 'Time Freeze', description: 'Pause timer for 30 seconds', icon: '⏸️', cost: 75, quantity: 2 },
  { id: 'error-shield', name: 'Error Shield', description: 'Prevent mistake penalty', icon: '🛡️', cost: 60, quantity: 2 },
];

export const useGameState = () => {
  const [grid, setGrid] = useState<GameGrid>(() => createGameGrid(generatePuzzle('easy')));
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('cosmic-sudoku-stats');
    return saved ? JSON.parse(saved) : initialStats;
  });
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('cosmic-sudoku-achievements');
    return saved ? JSON.parse(saved) : initialAchievements;
  });
  const [themes, setThemes] = useState<CosmicTheme[]>(() => {
    const saved = localStorage.getItem('cosmic-sudoku-themes');
    return saved ? JSON.parse(saved) : cosmicThemes;
  });
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => {
    const saved = localStorage.getItem('cosmic-sudoku-powerups');
    return saved ? JSON.parse(saved) : initialPowerUps;
  });
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('cosmic-sudoku-current-theme') || 'default';
  });
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isGameComplete, setIsGameComplete] = useState<boolean>(false);
  const [timeFrozenUntil, setTimeFrozenUntil] = useState<number>(0);
  const [errorShieldActive, setErrorShieldActive] = useState<boolean>(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cosmic-sudoku-stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('cosmic-sudoku-achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('cosmic-sudoku-themes', JSON.stringify(themes));
  }, [themes]);

  useEffect(() => {
    localStorage.setItem('cosmic-sudoku-powerups', JSON.stringify(powerUps));
  }, [powerUps]);

  useEffect(() => {
    localStorage.setItem('cosmic-sudoku-current-theme', currentTheme);
  }, [currentTheme]);

  const updateCell = useCallback((row: number, col: number, value: number | null) => {
    if (grid[row][col].isFixed || isGameComplete) return;

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(r => r.map(cell => ({ ...cell })));
      newGrid[row][col].value = value;
      newGrid[row][col].isValid = validateCell(newGrid, row, col);

      if (!newGrid[row][col].isValid && value !== null) {
        if (errorShieldActive) {
          // Shield absorbs the error
          setErrorShieldActive(false);
        } else {
          setMistakes(prev => prev + 1);
        }
      }

      // Check if puzzle is complete
      if (isPuzzleComplete(newGrid)) {
        const timeInSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        const difficulty = getDifficultyForLevel(stats.level);
        const earnedScore = calculateScore(timeInSeconds, difficulty, stats.level);
        const stardustEarned = Math.floor(earnedScore / 10);
        
        completeGame(earnedScore, stardustEarned, timeInSeconds);
        setIsGameComplete(true);
      }

      return newGrid;
    });
  }, [grid, isGameComplete, gameStartTime, stats.level]);

  const completeGame = useCallback((earnedScore: number, stardustEarned: number, timeInSeconds: number) => {
    const isPerfectGame = mistakes === 0;
    const isSpeedRun = timeInSeconds < 180; // Under 3 minutes

    setStats(prevStats => {
      const newStats = {
        ...prevStats,
        score: prevStats.score + earnedScore,
        totalTime: prevStats.totalTime + timeInSeconds,
        gamesPlayed: prevStats.gamesPlayed + 1,
        gamesWon: prevStats.gamesWon + 1,
        currentStreak: prevStats.currentStreak + 1,
        bestStreak: Math.max(prevStats.bestStreak, prevStats.currentStreak + 1),
        stardust: prevStats.stardust + stardustEarned,
      };

      // Check for achievements
      checkAchievements(newStats, isPerfectGame, isSpeedRun);
      
      return newStats;
    });

    console.log(`Game completed! Score: ${earnedScore}, Stardust: ${stardustEarned}, Time: ${timeInSeconds}s`);
  }, [mistakes]);

  const checkAchievements = useCallback((newStats: GameStats, isPerfectGame: boolean, isSpeedRun: boolean) => {
    setAchievements(prevAchievements => {
      const updatedAchievements = [...prevAchievements];
      
      // First win
      if (newStats.gamesWon === 1 && !updatedAchievements.find(a => a.id === 'first-win')?.unlocked) {
        const achievement = updatedAchievements.find(a => a.id === 'first-win');
        if (achievement) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
        }
      }

      // Perfect game
      if (isPerfectGame && !updatedAchievements.find(a => a.id === 'perfect-scholar')?.unlocked) {
        const achievement = updatedAchievements.find(a => a.id === 'perfect-scholar');
        if (achievement) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
        }
      }

      // Speed run
      if (isSpeedRun && !updatedAchievements.find(a => a.id === 'speed-demon')?.unlocked) {
        const achievement = updatedAchievements.find(a => a.id === 'speed-demon');
        if (achievement) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
        }
      }

      // Streak achievements
      if (newStats.currentStreak >= 5 && !updatedAchievements.find(a => a.id === 'streak-5')?.unlocked) {
        const achievement = updatedAchievements.find(a => a.id === 'streak-5');
        if (achievement) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
        }
      }

      // Level achievements
      if (newStats.level >= 10 && !updatedAchievements.find(a => a.id === 'level-10')?.unlocked) {
        const achievement = updatedAchievements.find(a => a.id === 'level-10');
        if (achievement) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
        }
      }

      return updatedAchievements;
    });
  }, []);

  const startNewGame = useCallback(() => {
    const difficulty = getDifficultyForLevel(stats.level);
    const newPuzzle = generatePuzzle(difficulty);
    setGrid(createGameGrid(newPuzzle));
    setGameStartTime(Date.now());
    setMistakes(0);
    setHintsUsed(0);
    setIsGameComplete(false);
    setTimeFrozenUntil(0);
    setErrorShieldActive(false);
    console.log(`Starting new game - Level: ${stats.level}, Difficulty: ${difficulty}`);
  }, [stats.level]);

  const nextLevel = useCallback(() => {
    setStats(prevStats => ({ ...prevStats, level: prevStats.level + 1 }));
    startNewGame();
  }, [startNewGame]);

  // Get valid candidate numbers for a cell
  const getCandidates = useCallback((row: number, col: number): number[] => {
    const candidates: number[] = [];
    for (let num = 1; num <= 9; num++) {
      // Create a temporary grid to test this number
      const testGrid = grid.map(r => r.map(cell => ({ ...cell })));
      testGrid[row][col].value = num;
      if (validateCell(testGrid, row, col)) {
        candidates.push(num);
      }
    }
    return candidates;
  }, [grid]);

  // Use a power-up
  const usePowerUp = useCallback((powerUpId: string, selectedCell: { row: number; col: number } | null): { success: boolean; message: string; candidates?: number[] } => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp || powerUp.quantity <= 0) {
      return { success: false, message: 'Power-up not available!' };
    }

    // Decrement quantity
    setPowerUps(prevPowerUps =>
      prevPowerUps.map(p => p.id === powerUpId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p)
    );

    switch (powerUpId) {
      case 'stellar-hint': {
        if (!selectedCell || grid[selectedCell.row][selectedCell.col].isFixed) {
          return { success: false, message: 'Select an empty cell first!' };
        }
        const candidates = getCandidates(selectedCell.row, selectedCell.col);
        setHintsUsed(prev => prev + 1);
        if (candidates.length === 0) {
          return { success: true, message: 'This cell has no valid candidates!', candidates: [] };
        }
        return {
          success: true,
          message: `Possible numbers: ${candidates.join(', ')}`,
          candidates
        };
      }

      case 'cosmic-reveal': {
        // Find all empty cells
        const emptyCells: { row: number; col: number }[] = [];
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (!grid[row][col].isFixed && grid[row][col].value === null) {
              emptyCells.push({ row, col });
            }
          }
        }

        if (emptyCells.length === 0) {
          return { success: false, message: 'No empty cells to reveal!' };
        }

        // Pick a random empty cell and fill it with correct answer
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const candidates = getCandidates(randomCell.row, randomCell.col);

        if (candidates.length > 0) {
          // Pick the first valid candidate (or random one)
          const correctNumber = candidates[Math.floor(Math.random() * candidates.length)];
          updateCell(randomCell.row, randomCell.col, correctNumber);
          return { success: true, message: `Revealed a number at row ${randomCell.row + 1}, col ${randomCell.col + 1}!` };
        }

        return { success: false, message: 'Could not find a valid number to reveal!' };
      }

      case 'time-freeze': {
        setTimeFrozenUntil(Date.now() + 30000); // 30 seconds
        return { success: true, message: 'Time frozen for 30 seconds!' };
      }

      case 'error-shield': {
        setErrorShieldActive(true);
        return { success: true, message: 'Error shield activated! Next mistake will be ignored.' };
      }

      default:
        return { success: false, message: 'Unknown power-up!' };
    }
  }, [powerUps, grid, getCandidates, updateCell]);

  const buyTheme = useCallback((themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || theme.unlocked || stats.stardust < theme.cost) return false;

    setStats(prevStats => ({ ...prevStats, stardust: prevStats.stardust - theme.cost }));
    setThemes(prevThemes => {
      const updatedThemes = prevThemes.map(t => t.id === themeId ? { ...t, unlocked: true } : t);

      // Check Cosmic Collector achievement
      const unlockedCount = updatedThemes.filter(t => t.unlocked).length;
      if (unlockedCount >= 3) {
        setAchievements(prevAchievements => {
          const updatedAchievements = [...prevAchievements];
          const achievement = updatedAchievements.find(a => a.id === 'collector');
          if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = new Date();
          }
          return updatedAchievements;
        });
      }

      return updatedThemes;
    });

    return true;
  }, [themes, stats.stardust]);

  const buyPowerUp = useCallback((powerUpId: string) => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp || stats.stardust < powerUp.cost) return false;

    setStats(prevStats => ({ ...prevStats, stardust: prevStats.stardust - powerUp.cost }));
    setPowerUps(prevPowerUps =>
      prevPowerUps.map(p => p.id === powerUpId ? { ...p, quantity: p.quantity + 1 } : p)
    );
    
    return true;
  }, [powerUps, stats.stardust]);

  return {
    // Game state
    grid,
    stats,
    achievements,
    themes,
    powerUps,
    currentTheme,
    mistakes,
    hintsUsed,
    isGameComplete,
    gameStartTime,
    timeFrozenUntil,
    errorShieldActive,

    // Actions
    updateCell,
    startNewGame,
    nextLevel,
    buyTheme,
    buyPowerUp,
    usePowerUp,
    getCandidates,
    setCurrentTheme,
  };
};