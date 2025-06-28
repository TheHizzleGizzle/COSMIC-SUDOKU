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
    <div className="cosmic-tile p-4 rounded-2xl">
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {numbers.map((number) => (
          <Button
            key={number}
            variant="ghost"
            size="lg"
            className="cosmic-tile h-14 w-14 text-xl font-bold rounded-full hover:scale-110 transition-all duration-200"
            style={{
              color: theme.primary,
              borderColor: theme.primary + '40',
            }}
            onClick={() => onNumberSelect(number)}
          >
            {number}
          </Button>
        ))}
        
        {/* Clear/Erase button */}
        <Button
          variant="ghost"
          size="lg"
          className="cosmic-tile h-14 w-14 rounded-full hover:scale-110 transition-all duration-200 col-span-3 mx-auto"
          style={{
            color: theme.secondary,
            borderColor: theme.secondary + '40',
          }}
          onClick={() => onNumberSelect(null)}
        >
          <Eraser className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default NumberPad;