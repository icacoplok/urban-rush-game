'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine, GameState } from '@/game/GameEngine';

export default function UrbanRushGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [hasShield, setHasShield] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onScoreChange: setScore,
      onCoinChange: setCoins,
      onStateChange: setGameState,
      onSpeedChange: setSpeed,
      onDistanceChange: setDistance,
      onMultiplierChange: setMultiplier,
      onShieldChange: setHasShield,
      onHighScore: setHighScore,
    });

    engineRef.current = engine;
    setHighScore(engine.getHighScore());

    // Initial render
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  const handleStart = useCallback(() => {
    engineRef.current?.doStart();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.doRestart();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.doPause();
  }, []);

  const handleMute = useCallback(() => {
    const muted = engineRef.current?.doToggleMute();
    setIsMuted(!!muted);
  }, []);

  const handleMoveLeft = useCallback(() => {
    engineRef.current?.doMoveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.doMoveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.doJump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.doSlide();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      {/* Canvas */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* HUD - Always visible during gameplay */}
      {gameState === 'playing' && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex justify-between items-start p-3 sm:p-4">
            {/* Left side - Score */}
            <div className="space-y-1">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                <div className="text-yellow-400 text-xs sm:text-sm font-bold tracking-wider">SCORE</div>
                <div className="text-white text-lg sm:text-2xl font-black tabular-nums">{score.toLocaleString()}</div>
              </div>
              {multiplier > 1 && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-3 py-1">
                  <span className="text-white text-sm font-bold">x{multiplier}</span>
                </div>
              )}
              {hasShield && (
                <div className="bg-purple-600/80 rounded-lg px-3 py-1">
                  <span className="text-white text-xs font-bold">SHIELD ACTIVE</span>
                </div>
              )}
            </div>

            {/* Right side - Coins & Controls */}
            <div className="space-y-1 text-right">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2">
                <span className="text-yellow-400 text-lg">●</span>
                <span className="text-white text-lg sm:text-xl font-bold tabular-nums">{coins}</span>
              </div>
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 justify-end">
                <span className="text-green-400 text-xs">SPD</span>
                <span className="text-white text-sm font-bold tabular-nums">{Math.round(speed)}</span>
              </div>
              <div className="flex gap-1 pointer-events-auto">
                <button
                  onClick={handlePause}
                  className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-white hover:bg-black/70 transition-colors"
                >
                  ⏸
                </button>
                <button
                  onClick={handleMute}
                  className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-white hover:bg-black/70 transition-colors"
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 z-20 sm:hidden pointer-events-auto">
          <div className="flex justify-center gap-2 px-4">
            <button
              onTouchStart={(e) => { e.preventDefault(); handleMoveLeft(); }}
              className="bg-white/15 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center text-2xl text-white active:bg-white/30 transition-colors"
            >
              ←
            </button>
            <div className="flex flex-col gap-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
                className="bg-white/15 backdrop-blur-sm rounded-xl w-16 h-14 flex items-center justify-center text-2xl text-white active:bg-white/30 transition-colors"
              >
                ↑
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); handleSlide(); }}
                className="bg-white/15 backdrop-blur-sm rounded-xl w-16 h-14 flex items-center justify-center text-2xl text-white active:bg-white/30 transition-colors"
              >
                ↓
              </button>
            </div>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleMoveRight(); }}
              className="bg-white/15 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center text-2xl text-white active:bg-white/30 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* MENU SCREEN */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800/95 to-black">
          <div className="text-center px-4 max-w-lg">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-5xl sm:text-7xl font-black tracking-wider mb-2">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  URBAN
                </span>
              </h1>
              <h1 className="text-5xl sm:text-7xl font-black tracking-wider">
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  RUSH
                </span>
              </h1>
              <p className="mt-3 text-lg sm:text-xl font-light tracking-[0.3em] text-white/40">
                ENDLESS RUNNER
              </p>
            </div>

            {/* Controls Info */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md mb-6 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-white/50">
                <p className="text-left">← → / A D - Switch Lane</p>
                <p className="text-left">↑ / W / Space - Jump</p>
                <p className="text-left">↓ / S - Slide</p>
                <p className="text-left">ESC / P - Pause</p>
                <p className="text-left">M - Mute Sound</p>
                <p className="text-left">Swipe - Mobile Control</p>
              </div>
            </div>

            {/* High Score */}
            {highScore > 0 && (
              <div className="mb-4 text-white/40 text-sm">
                HIGH SCORE: <span className="text-yellow-400 font-bold">{highScore.toLocaleString()}</span>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 py-3 px-10 sm:py-4 sm:px-14 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-lg sm:text-xl font-bold text-white shadow-lg shadow-cyan-900/30 hover:from-cyan-500 hover:to-blue-500 transition-all hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              START RUNNING
            </button>

            {/* Mobile hint */}
            <p className="mt-4 text-white/20 text-xs">Swipe or tap to start on mobile</p>
          </div>
        </div>
      )}

      {/* PAUSE SCREEN */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center px-4">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-wider mb-2">PAUSED</h2>
            <p className="text-white/40 mb-8">Take a breather</p>
            <div className="space-y-3">
              <button
                onClick={handlePause}
                className="block mx-auto py-3 px-10 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-lg font-bold text-white shadow-lg hover:from-cyan-500 hover:to-blue-500 transition-all hover:scale-105 active:scale-95"
              >
                RESUME
              </button>
              <button
                onClick={handleMute}
                className="block mx-auto py-2 px-6 rounded-xl bg-white/10 text-sm font-medium text-white/70 hover:bg-white/20 transition-colors"
              >
                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-red-900/80 via-gray-900/90 to-black/95">
          <div className="text-center px-4 max-w-sm">
            <h2 className="text-5xl sm:text-6xl font-black tracking-wider mb-2">
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                GAME OVER
              </span>
            </h2>
            <p className="text-white/30 mb-6">You crashed!</p>

            {/* Stats */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md mb-6 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Score</span>
                <span className="text-white text-2xl font-black tabular-nums">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Coins</span>
                <span className="text-yellow-400 text-xl font-bold tabular-nums">● {coins}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Distance</span>
                <span className="text-cyan-400 text-lg font-bold tabular-nums">{Math.round(distance)}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Top Speed</span>
                <span className="text-green-400 text-lg font-bold tabular-nums">{Math.round(speed)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                <span className="text-yellow-400/70 text-sm">Best Score</span>
                <span className="text-yellow-400 font-bold tabular-nums">{Math.max(highScore, score).toLocaleString()}</span>
              </div>
              {score >= highScore && score > 0 && (
                <div className="bg-yellow-500/20 rounded-lg py-1.5 text-yellow-400 text-sm font-bold">
                  NEW HIGH SCORE!
                </div>
              )}
            </div>

            <button
              onClick={handleRestart}
              className="inline-flex items-center justify-center gap-2 py-3 px-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-lg font-bold text-white shadow-lg shadow-red-900/30 hover:from-red-500 hover:to-orange-500 transition-all hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              RUN AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
