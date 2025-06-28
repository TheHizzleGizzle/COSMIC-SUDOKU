import React, { useState, useEffect } from 'react';
import { Smile, Heart, Zap, Star, Trophy } from 'lucide-react';

interface CosmicMascotProps {
  level: number;
  mistakes: number;
  isGameComplete: boolean;
  currentStreak: number;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const CosmicMascot: React.FC<CosmicMascotProps> = ({ 
  level, 
  mistakes, 
  isGameComplete, 
  currentStreak,
  theme 
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentEmoji, setCurrentEmoji] = useState('🌟');
  const [isAnimating, setIsAnimating] = useState(false);

  const encouragingMessages = [
    "You're doing stellar! ⭐",
    "Keep exploring the cosmos! 🚀",
    "Your brain is out of this world! 🧠",
    "Every number finds its place! ✨",
    "The stars align for you! 🌟",
    "Cosmic wisdom guides you! 🌌",
  ];

  const celebrationMessages = [
    "Magnificent! You've conquered another galaxy! 🎉",
    "Stellar performance, cosmic champion! 🏆",
    "The universe celebrates your victory! ✨",
    "Another puzzle falls to your cosmic powers! 💫",
    "You're a true star navigator! 🌟",
  ];

  const mistakeMessages = [
    "Even stars sometimes flicker! Keep shining! ⭐",
    "Every explorer makes course corrections! 🚀",
    "The cosmos believes in you! 🌌",
    "That's just cosmic dust, keep going! ✨",
  ];

  const streakMessages = [
    "You're on fire like a shooting star! 🔥",
    "Incredible cosmic streak! 🌟",
    "The galaxy bows to your skills! 👑",
    "Unstoppable like a pulsar! ⚡",
  ];

  useEffect(() => {
    let message = '';
    let emoji = '🌟';

    if (isGameComplete) {
      message = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
      emoji = '🎉';
    } else if (currentStreak >= 3) {
      message = streakMessages[Math.floor(Math.random() * streakMessages.length)];
      emoji = '🔥';
    } else if (mistakes > 0 && mistakes % 3 === 0) {
      message = mistakeMessages[Math.floor(Math.random() * mistakeMessages.length)];
      emoji = '💪';
    } else if (Math.random() < 0.3) { // Random encouragement
      message = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      emoji = '🌟';
    }

    if (message && message !== currentMessage) {
      setCurrentMessage(message);
      setCurrentEmoji(emoji);
      setIsAnimating(true);
      
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [isGameComplete, mistakes, currentStreak, level]);

  const getMascotExpression = () => {
    if (isGameComplete) return '🎉';
    if (mistakes > 5) return '😅';
    if (currentStreak >= 5) return '🔥';
    if (level >= 50) return '🚀';
    if (level >= 25) return '⭐';
    return '🌟';
  };

  return (
    <div className="cosmic-tile p-6 rounded-2xl text-center max-w-sm mx-auto">
      {/* Mascot Avatar */}
      <div className="relative mb-4">
        <div 
          className={`text-6xl animate-float ${isAnimating ? 'animate-pulse-glow' : ''}`}
          style={{ filter: `drop-shadow(0 0 10px ${theme.primary}40)` }}
        >
          {getMascotExpression()}
        </div>
        
        {/* Floating particles around the mascot */}
        <div className="absolute -top-2 -right-2">
          <Star className="h-4 w-4 animate-twinkle" style={{ color: theme.accent }} />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Zap className="h-3 w-3 animate-twinkle" style={{ color: theme.secondary }} />
        </div>
      </div>

      {/* Mascot Name */}
      <div className="text-lg font-bold text-white mb-2">
        Cosmos
      </div>
      <div className="text-sm text-white/60 mb-4">
        Your Stellar Guide
      </div>

      {/* Current Message */}
      {currentMessage && (
        <div 
          className={`cosmic-tile p-3 rounded-lg transition-all duration-500 ${
            isAnimating ? 'scale-105 animate-pulse-glow' : ''
          }`}
          style={{ borderColor: theme.primary + '40' }}
        >
          <div className="text-sm text-white leading-relaxed">
            {currentMessage}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 flex justify-center space-x-4 text-xs text-white/60">
        <div className="flex items-center">
          <Trophy className="h-3 w-3 mr-1" />
          Level {level}
        </div>
        <div className="flex items-center">
          <Heart className="h-3 w-3 mr-1" />
          {currentStreak} Streak
        </div>
      </div>

      {/* Level milestone celebration */}
      {level % 10 === 0 && level > 0 && (
        <div className="mt-3 text-xs font-bold animate-pulse" style={{ color: theme.accent }}>
          🎊 Milestone Reached! 🎊
        </div>
      )}
    </div>
  );
};

export default CosmicMascot;