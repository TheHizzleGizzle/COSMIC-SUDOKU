import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lightbulb, Sparkles, Clock, Shield, HelpCircle } from 'lucide-react';
import { PowerUp } from '@/hooks/useGameState';

interface PowerUpBarProps {
  powerUps: PowerUp[];
  onUsePowerUp: (powerUpId: string) => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const PowerUpBar: React.FC<PowerUpBarProps> = ({ powerUps, onUsePowerUp, theme }) => {
  const getIcon = (powerUpId: string) => {
    switch (powerUpId) {
      case 'stellar-hint':
        return <Lightbulb className="h-4 w-4" />;
      case 'cosmic-reveal':
        return <Sparkles className="h-4 w-4" />;
      case 'time-freeze':
        return <Clock className="h-4 w-4" />;
      case 'error-shield':
        return <Shield className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const handleUsePowerUp = (powerUp: PowerUp) => {
    if (powerUp.quantity <= 0) {
      toast.error(`No ${powerUp.name} available! Purchase more from the shop.`);
      return;
    }
    
    onUsePowerUp(powerUp.id);
    toast.success(`${powerUp.name} activated! ✨`);
  };

  return (
    <div className="cosmic-tile p-4 rounded-2xl">
      <div className="text-center mb-3">
        <h3 className="text-white font-semibold text-sm">Cosmic Power-Ups</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {powerUps.map((powerUp) => (
          <Button
            key={powerUp.id}
            variant="ghost"
            size="sm"
            className="cosmic-tile h-16 flex flex-col items-center justify-center space-y-1 relative"
            style={{
              borderColor: powerUp.quantity > 0 ? theme.primary + '40' : theme.primary + '20',
              opacity: powerUp.quantity > 0 ? 1 : 0.5,
            }}
            onClick={() => handleUsePowerUp(powerUp)}
            disabled={powerUp.quantity <= 0}
          >
            <div className="flex items-center space-x-1">
              {getIcon(powerUp.id)}
            </div>
            <div className="text-xs text-white/80 text-center leading-tight">
              {powerUp.name.split(' ')[0]}
            </div>
            
            {powerUp.quantity > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                style={{ 
                  backgroundColor: theme.accent,
                  color: 'white'
                }}
              >
                {powerUp.quantity}
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-white/60">
          Tap to use • Buy more in shop
        </p>
      </div>
    </div>
  );
};

export default PowerUpBar;