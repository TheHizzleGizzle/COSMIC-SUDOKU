import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Zap, Play, RotateCcw } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  score: number;
  stardust: number;
  timeInSeconds: number;
  mistakes: number;
  onNextLevel: () => void;
  onPlayAgain: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  level,
  score,
  stardust,
  timeInSeconds,
  mistakes,
  onNextLevel,
  onPlayAgain,
  theme
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    if (mistakes === 0 && timeInSeconds < 180) {
      return { message: "Absolutely Stellar! 🌟", color: theme.accent };
    } else if (mistakes === 0) {
      return { message: "Perfect Precision! 🎯", color: theme.primary };
    } else if (timeInSeconds < 300) {
      return { message: "Lightning Fast! ⚡", color: theme.secondary };
    } else {
      return { message: "Well Done! 🎉", color: theme.primary };
    }
  };

  const performance = getPerformanceMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cosmic-tile border-0 max-w-md">
        <div className="text-center space-y-6 p-2">
          {/* Celebration Header */}
          <div className="relative">
            <div className={`text-6xl animate-bounce ${showConfetti ? 'animate-pulse-glow' : ''}`}>
              🎉
            </div>
            <div className="absolute -top-2 -left-2">
              <Star className="h-6 w-6 animate-twinkle" style={{ color: theme.accent }} />
            </div>
            <div className="absolute -top-2 -right-2">
              <Star className="h-4 w-4 animate-twinkle" style={{ color: theme.primary }} />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <Star className="h-5 w-5 animate-twinkle" style={{ color: theme.secondary }} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Level {level} Complete!
            </h2>
            <div 
              className="text-lg font-semibold"
              style={{ color: performance.color }}
            >
              {performance.message}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="cosmic-tile border-0">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2" style={{ color: theme.accent }} />
                <div className="text-lg font-bold text-white">{score.toLocaleString()}</div>
                <div className="text-xs text-white/60">Score</div>
              </CardContent>
            </Card>

            <Card className="cosmic-tile border-0">
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2" style={{ color: theme.secondary }} />
                <div className="text-lg font-bold" style={{ color: theme.secondary }}>{stardust}</div>
                <div className="text-xs text-white/60">Stardust</div>
              </CardContent>
            </Card>

            <Card className="cosmic-tile border-0">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-white">{formatTime(timeInSeconds)}</div>
                <div className="text-xs text-white/60">Time</div>
              </CardContent>
            </Card>

            <Card className="cosmic-tile border-0">
              <CardContent className="p-4 text-center">
                <div className={`text-lg font-bold ${mistakes === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {mistakes}
                </div>
                <div className="text-xs text-white/60">Mistakes</div>
              </CardContent>
            </Card>
          </div>

          {/* Bonus Badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {mistakes === 0 && (
              <Badge className="bg-green-500 text-white">
                Perfect Game! 🎯
              </Badge>
            )}
            {timeInSeconds < 180 && (
              <Badge className="bg-blue-500 text-white">
                Speed Demon! ⚡
              </Badge>
            )}
            {level % 10 === 0 && (
              <Badge className="bg-purple-500 text-white">
                Milestone Reached! 🏆
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full cosmic-tile animate-pulse-glow"
              onClick={() => {
                onNextLevel();
                onClose();
              }}
              style={{
                backgroundColor: theme.primary + '20',
                borderColor: theme.primary,
                color: theme.primary
              }}
            >
              <Play className="h-5 w-5 mr-2" />
              Continue to Level {level + 1}
            </Button>

            <Button
              variant="ghost"
              className="w-full cosmic-tile"
              onClick={() => {
                onPlayAgain();
                onClose();
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Level {level} Again
            </Button>
          </div>

          {/* Encouragement Message */}
          <div className="text-sm text-white/80 leading-relaxed">
            {level < 10 ? "You're mastering the cosmic fundamentals! 🌟" :
             level < 25 ? "Your skills are reaching across galaxies! 🌌" :
             level < 50 ? "You've become a true cosmic navigator! 🚀" :
             "You are one with the universe! 🌠"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CelebrationModal;