import React from 'react';
import { GameGrid } from '@/utils/sudoku';

interface SudokuGridProps {
  grid: GameGrid;
  onCellClick: (row: number, col: number) => void;
  selectedCell: { row: number; col: number } | null;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const SudokuGrid: React.FC<SudokuGridProps> = ({ grid, onCellClick, selectedCell, theme }) => {
  const getCellStyle = (row: number, col: number, cell: any) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isRelated = selectedCell && (
      selectedCell.row === row || 
      selectedCell.col === col || 
      (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && 
       Math.floor(selectedCell.col / 3) === Math.floor(col / 3))
    );
    
    let backgroundColor = 'rgba(255, 255, 255, 0.05)';
    let borderColor = 'rgba(255, 255, 255, 0.2)';
    let textColor = 'white';
    
    if (isSelected) {
      backgroundColor = `${theme.primary}20`;
      borderColor = theme.primary;
    } else if (isRelated) {
      backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
    
    if (cell.isFixed) {
      textColor = theme.accent;
      backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
    
    if (!cell.isValid) {
      backgroundColor = 'rgba(255, 0, 0, 0.2)';
      borderColor = '#ff4444';
    }
    
    return {
      backgroundColor,
      borderColor,
      color: textColor,
    };
  };

  const getBorderStyle = (row: number, col: number) => {
    const borders = {
      borderTopWidth: row % 3 === 0 ? '2px' : '1px',
      borderBottomWidth: row === 8 ? '2px' : '1px',
      borderLeftWidth: col % 3 === 0 ? '2px' : '1px',
      borderRightWidth: col === 8 ? '2px' : '1px',
    };
    return borders;
  };

  return (
    <div className="cosmic-tile p-2 sm:p-4 rounded-2xl">
      <div 
        className="grid grid-cols-9 gap-0 w-full mx-auto aspect-square"
        style={{ maxWidth: 'min(100%, 420px)' }}
        role="grid"
        aria-label="Sudoku puzzle grid"
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellStyle = getCellStyle(rowIndex, colIndex, cell);
            const borderStyle = getBorderStyle(rowIndex, colIndex);
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className="number-tile cursor-pointer flex items-center justify-center text-sm sm:text-lg font-bold transition-all duration-200 active:scale-95 sm:hover:scale-105 touch-manipulation"
                style={{
                  ...cellStyle,
                  ...borderStyle,
                  borderStyle: 'solid',
                  aspectRatio: '1',
                  minWidth: '28px',
                  minHeight: '28px',
                }}
                onClick={() => onCellClick(rowIndex, colIndex)}
                aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}, ${cell.value || 'empty'}${cell.isFixed ? ', fixed' : ''}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
              >
                {cell.value || ''}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SudokuGrid;