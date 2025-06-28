export type SudokuGrid = (number | null)[][];
export type SudokuCell = { value: number | null; isFixed: boolean; isValid: boolean };
export type GameGrid = SudokuCell[][];

// Generate a complete valid Sudoku grid
export const generateCompleteGrid = (): SudokuGrid => {
  const grid: SudokuGrid = Array(9).fill(null).map(() => Array(9).fill(null));
  
  const isValid = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };
  
  const fillGrid = (grid: SudokuGrid): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (fillGrid(grid)) return true;
              grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  fillGrid(grid);
  return grid;
};

// Generate a puzzle by removing numbers from a complete grid
export const generatePuzzle = (difficulty: 'easy' | 'medium' | 'hard' | 'expert'): SudokuGrid => {
  const completeGrid = generateCompleteGrid();
  const puzzle = completeGrid.map(row => [...row]);
  
  // Determine number of clues based on difficulty
  const cluesCounts = {
    easy: 45,
    medium: 35,
    hard: 30,
    expert: 25
  };
  
  const targetClues = cluesCounts[difficulty];
  const cellsToRemove = 81 - targetClues;
  
  const cells = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      cells.push([i, j]);
    }
  }
  
  // Shuffle cells array
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  
  // Remove numbers
  for (let i = 0; i < cellsToRemove && i < cells.length; i++) {
    const [row, col] = cells[i];
    puzzle[row][col] = null;
  }
  
  return puzzle;
};

// Get difficulty based on level
export const getDifficultyForLevel = (level: number): 'easy' | 'medium' | 'hard' | 'expert' => {
  if (level <= 10) return 'easy';
  if (level <= 25) return 'medium';
  if (level <= 50) return 'hard';
  return 'expert';
};

// Convert SudokuGrid to GameGrid
export const createGameGrid = (puzzle: SudokuGrid): GameGrid => {
  return puzzle.map(row => 
    row.map(cell => ({
      value: cell,
      isFixed: cell !== null,
      isValid: true
    }))
  );
};

// Validate a specific cell
export const validateCell = (grid: GameGrid, row: number, col: number): boolean => {
  const value = grid[row][col].value;
  if (value === null) return true;
  
  // Check row
  for (let x = 0; x < 9; x++) {
    if (x !== col && grid[row][x].value === value) return false;
  }
  
  // Check column
  for (let x = 0; x < 9; x++) {
    if (x !== row && grid[x][col].value === value) return false;
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentRow = boxRow + i;
      const currentCol = boxCol + j;
      if (currentRow !== row && currentCol !== col && 
          grid[currentRow][currentCol].value === value) return false;
    }
  }
  
  return true;
};

// Check if puzzle is complete
export const isPuzzleComplete = (grid: GameGrid): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value === null || !grid[row][col].isValid) {
        return false;
      }
    }
  }
  return true;
};

// Calculate score based on time and difficulty
export const calculateScore = (timeInSeconds: number, difficulty: string, level: number): number => {
  const baseScore = 1000;
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 2.5
  }[difficulty] || 1;
  
  const timeBonus = Math.max(0, 600 - timeInSeconds); // Bonus for completing under 10 minutes
  const levelBonus = level * 10;
  
  return Math.round((baseScore * difficultyMultiplier) + timeBonus + levelBonus);
};