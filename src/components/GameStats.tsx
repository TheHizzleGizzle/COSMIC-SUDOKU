import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Clock, Target, Zap } from 'lucide-react';
import { GameStats as GameStatsType } from '@/hooks/useGameState';

interface GameStatsProps {
  stats: GameStatsType;
  gameStartTime: number;
  mistakes: number;
  hintsUsed: number;
  isGameComplete: boolean;
  timeFrozenUntil?: number;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const GameStats: React.FC<GameStatsProps> = ({
  stats,
  gameStartTime,
  mistakes,
  hintsUsed,
  isGameComplete,
  timeFrozenUntil = 0,
  theme
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [frozenTime, setFrozenTime] = useState<number | null>(null);

  useEffect(() => {
    if (isGameComplete) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Check if time is currently frozen
      if (timeFrozenUntil > now) {
        // Time is frozen - save the frozen time if not already saved
        if (frozenTime === null) {
          setFrozenTime(Math.floor((now - gameStartTime) / 1000));
        }
        // Keep showing the frozen time
        setCurrentTime(frozenTime || Math.floor((now - gameStartTime) / 1000));
      } else {
        // Time is not frozen - clear frozen time and update normally
        if (frozenTime !== null) {
          setFrozenTime(null);
        }
        setCurrentTime(Math.floor((now - gameStartTime) / 1000));
      }
    }, 100); // Check more frequently to catch freeze start/end

    return () => clearInterval(interval);
  }, [gameStartTime, isGameComplete, timeFrozenUntil, frozenTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyBadge = (level: number) => {
    if (level <= 10) return { text: 'Easy', color: 'bg-green-500' };
    if (level <= 25) return { text: 'Medium', color: 'bg-yellow-500' };
    if (level <= 50) return { text: 'Hard', color: 'bg-orange-500' };
    return { text: 'Expert', color: 'bg-red-500' };
  };

  const difficulty = getDifficultyBadge(stats.level);

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cosmic-tile border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 mr-2" style={{ color: theme.accent }} />
              <span className="text-sm font-medium text-white/80">Level</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.level}</div>
            <Badge className={`${difficulty.color} text-white mt-1`}>
              {difficulty.text}
            </Badge>
          </CardContent>
        </Card>

        <Card className="cosmic-tile border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 mr-2" style={{ color: theme.primary }} />
              <span className="text-sm font-medium text-white/80">Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.score.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-tile border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 mr-2" style={{ color: theme.secondary }} />
              <span className="text-sm font-medium text-white/80">Stardust</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: theme.secondary }}>
              {stats.stardust}
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-tile border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 mr-2" style={{ color: theme.accent }} />
              <span className="text-sm font-medium text-white/80">Time</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatTime(currentTime)}
            </div>
            {timeFrozenUntil > Date.now() && (
              <div className="text-xs text-blue-400 mt-1">⏸️ Frozen</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cosmic-tile border-0">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-red-400">{mistakes}</div>
            <div className="text-xs text-white/60">Mistakes</div>
          </CardContent>
        </Card>

        <Card className="cosmic-tile border-0">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{hintsUsed}</div>
            <div className="text-xs text-white/60">Hints</div>
          </CardContent>
        </Card>

        <Card className="cosmic-tile border-0">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-green-400">{stats.currentStreak}</div>
            <div className="text-xs text-white/60">Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate */}
      {stats.gamesPlayed > 0 && (
        <Card className="cosmic-tile border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2" style={{ color: theme.primary }} />
                <span className="text-sm font-medium text-white/80">Win Rate</span>
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%
              </div>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {stats.gamesWon}/{stats.gamesPlayed} games won
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GameStats;