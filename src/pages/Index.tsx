import React, { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import SudokuGrid from '@/components/SudokuGrid';
import NumberPad from '@/components/NumberPad';
import GameStats from '@/components/GameStats';
import CosmicMascot from '@/components/CosmicMascot';
import PowerUpBar from '@/components/PowerUpBar';
import CelebrationModal from '@/components/CelebrationModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Star, 
  Palette, 
  Zap, 
  ShoppingCart,
  Award,
  Crown
} from 'lucide-react';

const Index = () => {
  const gameState = useGameState();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [lastStardust, setLastStardust] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  const currentThemeData = gameState.themes.find(t => t.id === gameState.currentTheme) || gameState.themes[0];

  // Track game completion to show celebration
  React.useEffect(() => {
    if (gameState.isGameComplete && !showCelebration) {
      const timeInSeconds = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
      const difficulty = gameState.stats.level <= 10 ? 'easy' : 
                        gameState.stats.level <= 25 ? 'medium' : 
                        gameState.stats.level <= 50 ? 'hard' : 'expert';
      
      // Calculate rewards (simplified)
      const earnedScore = Math.round(1000 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : difficulty === 'hard' ? 2 : 2.5));
      const stardustEarned = Math.floor(earnedScore / 10);
      
      setLastScore(earnedScore);
      setLastStardust(stardustEarned);
      setLastTime(timeInSeconds);
      setShowCelebration(true);
    }
  }, [gameState.isGameComplete, showCelebration, gameState.gameStartTime]);

  const handleCellClick = (row: number, col: number) => {
    if (gameState.grid[row][col].isFixed) return;
    setSelectedCell({ row, col });
  };

  const handleNumberSelect = (number: number | null) => {
    if (!selectedCell) {
      toast.error("Please select a cell first!");
      return;
    }
    gameState.updateCell(selectedCell.row, selectedCell.col, number);
  };

  const handleNewGame = () => {
    gameState.startNewGame();
    setSelectedCell(null);
    setShowCelebration(false);
    toast.success("New puzzle generated! 🌟");
  };

  const handleNextLevel = () => {
    gameState.nextLevel();
    setSelectedCell(null);
    setShowCelebration(false);
    toast.success(`Welcome to Level ${gameState.stats.level + 1}! 🚀`);
  };

  const handleUsePowerUp = (powerUpId: string) => {
    // Here you would implement the actual power-up logic
    // For now, we'll just show a toast and decrement the quantity
    console.log(`Using power-up: ${powerUpId}`);
    
    // Find the power-up and use it
    const powerUp = gameState.powerUps.find(p => p.id === powerUpId);
    if (powerUp && powerUp.quantity > 0) {
      // Implement power-up effects here
      switch (powerUpId) {
        case 'stellar-hint':
          // Show hint for selected cell
          if (selectedCell) {
            toast.info("💡 This cell could be a 3, 7, or 9!");
          } else {
            toast.info("💡 Select a cell first to get a hint!");
          }
          break;
        case 'cosmic-reveal':
          // Reveal a random empty cell
          toast.info("✨ A number has been revealed!");
          break;
        case 'time-freeze':
          // Pause timer (would need timer implementation)
          toast.info("⏸️ Time frozen for 30 seconds!");
          break;
        case 'error-shield':
          // Prevent next mistake
          toast.info("🛡️ Error shield activated!");
          break;
      }
    }
  };

  const handleBuyTheme = (themeId: string) => {
    if (gameState.buyTheme(themeId)) {
      toast.success("New cosmic theme unlocked! ✨");
    } else {
      toast.error("Not enough stardust! ⭐");
    }
  };

  const handleBuyPowerUp = (powerUpId: string) => {
    if (gameState.buyPowerUp(powerUpId)) {
      toast.success("Power-up purchased! ⚡");
    } else {
      toast.error("Not enough stardust! ⭐");
    }
  };

  const unlockedAchievements = gameState.achievements.filter(a => a.unlocked);

  return (
    <div className="cosmic-bg min-h-screen p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 animate-float">
            🌌 Cosmic Sudoku 🌌
          </h1>
          <p className="text-white/80 text-lg">
            Explore infinite puzzles across the universe!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Mascot */}
          <div className="space-y-6">
            <GameStats 
              stats={gameState.stats}
              gameStartTime={gameState.gameStartTime}
              mistakes={gameState.mistakes}
              hintsUsed={gameState.hintsUsed}
              isGameComplete={gameState.isGameComplete}
              theme={currentThemeData.colors}
            />
            
            <CosmicMascot
              level={gameState.stats.level}
              mistakes={gameState.mistakes}
              isGameComplete={gameState.isGameComplete}
              currentStreak={gameState.stats.currentStreak}
              theme={currentThemeData.colors}
            />

            {/* Power-Up Bar */}
            <PowerUpBar
              powerUps={gameState.powerUps}
              onUsePowerUp={handleUsePowerUp}
              theme={currentThemeData.colors}
            />

            {/* Quick Actions */}
            <div className="space-y-3">
              <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
                <DialogTrigger asChild>
                  <Button className="w-full cosmic-tile" variant="ghost">
                    <Trophy className="h-4 w-4 mr-2" />
                    Achievements ({unlockedAchievements.length}/{gameState.achievements.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="cosmic-tile border-0 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center">
                      <Trophy className="h-5 w-5 mr-2" style={{ color: currentThemeData.colors.accent }} />
                      Cosmic Achievements
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {gameState.achievements.map(achievement => (
                      <Card key={achievement.id} className={`cosmic-tile border-0 ${achievement.unlocked ? 'opacity-100' : 'opacity-50'}`}>
                        <CardContent className="p-3 flex items-center space-x-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{achievement.name}</div>
                            <div className="text-sm text-white/60">{achievement.description}</div>
                            {achievement.unlocked && achievement.unlockedAt && (
                              <div className="text-xs text-green-400">
                                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {achievement.unlocked && <Crown className="h-4 w-4 text-yellow-400" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showThemes} onOpenChange={setShowThemes}>
                <DialogTrigger asChild>
                  <Button className="w-full cosmic-tile" variant="ghost">
                    <Palette className="h-4 w-4 mr-2" />
                    Cosmic Themes
                  </Button>
                </DialogTrigger>
                <DialogContent className="cosmic-tile border-0 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center">
                      <Palette className="h-5 w-5 mr-2" style={{ color: currentThemeData.colors.accent }} />
                      Cosmic Themes
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {gameState.themes.map(theme => (
                      <Card key={theme.id} className="cosmic-tile border-0">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-white">{theme.name}</div>
                            {theme.id === gameState.currentTheme && <Badge className="bg-green-500">Active</Badge>}
                          </div>
                          <div className="flex space-x-2 mb-3">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                          </div>
                          <div className="flex justify-between items-center">
                            {theme.unlocked ? (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => gameState.setCurrentTheme(theme.id)}
                                disabled={theme.id === gameState.currentTheme}
                              >
                                {theme.id === gameState.currentTheme ? 'Active' : 'Select'}
                              </Button>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-white/60 flex items-center">
                                  <Star className="h-3 w-3 mr-1" />
                                  {theme.cost}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleBuyTheme(theme.id)}
                                  disabled={gameState.stats.stardust < theme.cost}
                                >
                                  Buy
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showPowerUps} onOpenChange={setShowPowerUps}>
                <DialogTrigger asChild>
                  <Button className="w-full cosmic-tile" variant="ghost">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Power-Up Shop
                  </Button>
                </DialogTrigger>
                <DialogContent className="cosmic-tile border-0 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center">
                      <Zap className="h-5 w-5 mr-2" style={{ color: currentThemeData.colors.accent }} />
                      Cosmic Power-Ups
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {gameState.powerUps.map(powerUp => (
                      <Card key={powerUp.id} className="cosmic-tile border-0">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{powerUp.icon}</span>
                              <div>
                                <div className="font-semibold text-white">{powerUp.name}</div>
                                <div className="text-sm text-white/60">{powerUp.description}</div>
                              </div>
                            </div>
                            <Badge variant="secondary">{powerUp.quantity}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/60 flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {powerUp.cost}
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleBuyPowerUp(powerUp.id)}
                              disabled={gameState.stats.stardust < powerUp.cost}
                            >
                              Buy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Center Column - Game Board */}
          <div className="space-y-6">
            <SudokuGrid
              grid={gameState.grid}
              onCellClick={handleCellClick}
              selectedCell={selectedCell}
              theme={currentThemeData.colors}
            />
            
            <NumberPad
              onNumberSelect={handleNumberSelect}
              theme={currentThemeData.colors}
            />

            {/* Game Controls */}
            <div className="flex flex-col space-y-3">
              {gameState.isGameComplete ? (
                <Button 
                  size="lg" 
                  className="w-full cosmic-tile animate-pulse-glow"
                  onClick={handleNextLevel}
                  style={{ 
                    backgroundColor: currentThemeData.colors.primary + '20',
                    borderColor: currentThemeData.colors.primary,
                    color: currentThemeData.colors.primary
                  }}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Next Level ({gameState.stats.level + 1})
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full cosmic-tile"
                  onClick={handleNewGame}
                  variant="ghost"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  New Puzzle
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Current Level Info */}
            <Card className="cosmic-tile border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <Award className="h-5 w-5 mr-2" style={{ color: currentThemeData.colors.accent }} />
                  Current Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-white">
                  <span>Level:</span>
                  <span className="font-bold">{gameState.stats.level}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Difficulty:</span>
                  <span className="font-bold">
                    {gameState.stats.level <= 10 ? 'Easy' : 
                     gameState.stats.level <= 25 ? 'Medium' : 
                     gameState.stats.level <= 50 ? 'Hard' : 'Expert'}
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Progress:</span>
                  <span className="font-bold">
                    {gameState.grid.flat().filter(cell => cell.value !== null).length}/81
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="cosmic-tile border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">💡 Cosmic Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-white/80 space-y-2">
                  <li>• Click a cell, then select a number</li>
                  <li>• Use power-ups strategically</li>
                  <li>• Complete puzzles to earn stardust</li>
                  <li>• Unlock new themes and power-ups</li>
                  <li>• Maintain streaks for bonus rewards</li>
                  <li>• Each level increases difficulty</li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="cosmic-tile border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">📊 Your Journey</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-white text-sm">
                  <span>Total Score:</span>
                  <span className="font-bold">{gameState.stats.score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white text-sm">
                  <span>Games Won:</span>
                  <span className="font-bold">{gameState.stats.gamesWon}</span>
                </div>
                <div className="flex justify-between text-white text-sm">
                  <span>Best Streak:</span>
                  <span className="font-bold">{gameState.stats.bestStreak}</span>
                </div>
                <div className="flex justify-between text-white text-sm">
                  <span>Total Time:</span>
                  <span className="font-bold">
                    {Math.floor(gameState.stats.totalTime / 3600)}h {Math.floor((gameState.stats.totalTime % 3600) / 60)}m
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Celebration Modal */}
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          level={gameState.stats.level}
          score={lastScore}
          stardust={lastStardust}
          timeInSeconds={lastTime}
          mistakes={gameState.mistakes}
          onNextLevel={handleNextLevel}
          onPlayAgain={handleNewGame}
          theme={currentThemeData.colors}
        />
      </div>
    </div>
  );
};

export default Index;