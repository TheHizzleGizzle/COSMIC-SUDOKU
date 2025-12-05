import React from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface NumberPadProps {
  onNumberSelect: (number: number | null) => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const NumberPad: React.FC<NumberPadProps> = ({ onNumberSelect, theme }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="cosmic-tile p-3 sm:p-4 rounded-2xl">
      {/* Mobile: Compact 5-column grid for thumb-friendly access */}
      <div className="grid grid-cols-5 sm:hidden gap-2 mx-auto" style={{ maxWidth: '280px' }}>
        {numbers.map((number) => (
          <Button
            key={number}
            variant="ghost"
            className="cosmic-tile h-12 w-full text-lg font-bold rounded-xl active:scale-95 transition-all duration-150 touch-manipulation"
            style={{
              color: theme.primary,
              borderColor: theme.primary + '40',
            }}
            onClick={() => onNumberSelect(number)}
            aria-label={`Enter ${number}`}
          >
            {number}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="cosmic-tile h-12 w-full rounded-xl active:scale-95 transition-all duration-150 touch-manipulation"
          style={{
            color: theme.secondary,
            borderColor: theme.secondary + '40',
          }}
          onClick={() => onNumberSelect(null)}
          aria-label="Clear cell"
        >
          <Eraser className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop: Single row layout */}
      <div className="hidden sm:flex flex-wrap justify-center gap-2 max-w-md mx-auto">
        {numbers.map((number) => (
          <Button
            key={number}
            variant="ghost"
            size="lg"
            className="cosmic-tile h-12 w-12 text-lg font-bold rounded-full hover:scale-110 active:scale-95 transition-all duration-200"
            style={{
              color: theme.primary,
              borderColor: theme.primary + '40',
            }}
            onClick={() => onNumberSelect(number)}
            aria-label={`Enter ${number}`}
          >
            {number}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="lg"
          className="cosmic-tile h-12 w-12 rounded-full hover:scale-110 active:scale-95 transition-all duration-200"
          style={{
            color: theme.secondary,
            borderColor: theme.secondary + '40',
          }}
          onClick={() => onNumberSelect(null)}
          aria-label="Clear cell"
        >
          <Eraser className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default NumberPad;