"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, User, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from "../lib/utils";

interface PlayerStats {
  shots: number;
  totalTime: number;
  shotTimes: number[];
}

interface PlayerStatsState {
  player1: PlayerStats;
  player2: PlayerStats;
}

type PlayerKey = 'player1' | 'player2';

interface GameState {
  currentTime: number;
  isRunning: boolean;
  currentPlayer: number;
  player1Name: string;
  player2Name: string;
  playerStats: PlayerStatsState;
  isTimeOut: boolean;
  timeOutTime: number;
}

interface BallIconProps {
  number: number;
  className?: string;
}

const BallIcon = ({ number, className }: BallIconProps) => (
  <div className={`inline-block relative ${className}`}>
    <svg viewBox="0 0 100 100" width="32" height="32">
      {/* Ball background */}
      <defs>
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      
      {/* Main ball */}
      <circle cx="50" cy="50" r="48" fill={number === 8 ? 'black' : 'yellow'} stroke="white" strokeWidth="2"/>
      
      {/* Ball shine */}
      <circle cx="50" cy="50" r="48" fill="url(#shine)" />
      
      {/* For 9-ball, add white stripe */}
      {number === 9 && (
        <>
          <path
            d="M20 50 Q35 25, 50 20 Q65 25, 80 50 Q65 75, 50 80 Q35 75, 20 50"
            fill="white"
            stroke="none"
          />
        </>
      )}
      
      {/* Number circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="22" 
        fill="white"
        stroke={number === 9 ? 'black' : 'none'}
        strokeWidth="2"
      />
      
      {/* Number text */}
      <text
        x="50"
        y="50"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="black"
        fontSize="26"
        fontWeight="bold"
        fontFamily="Arial"
      >
        {number}
      </text>
    </svg>
  </div>
);

const PoolShotClock = () => {
  const getSavedPlayerNames = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('poolPlayerNames');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };

  const getSavedPlayerStats = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('poolPlayerStats');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Name, setPlayer1Name] = useState(() => 
    getSavedPlayerNames()?.player1Name ?? "Player 1"
  );
  const [player2Name, setPlayer2Name] = useState(() => 
    getSavedPlayerNames()?.player2Name ?? "Player 2"
  );
  const [playerStats, setPlayerStats] = useState<PlayerStatsState>(() => 
    getSavedPlayerStats() ?? {
      player1: { shots: 0, totalTime: 0, shotTimes: [] },
      player2: { shots: 0, totalTime: 0, shotTimes: [] }
    }
  );
  
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const warningTime = 20;
  const timeLimit = 25;

  // Save player names whenever they change
  useEffect(() => {
    const dataToSave = { player1Name, player2Name };
    console.log('Attempting to save names:', dataToSave);
    localStorage.setItem('poolPlayerNames', JSON.stringify(dataToSave));
  }, [player1Name, player2Name]);

  useEffect(() => {
    console.log('Attempting to save stats:', playerStats);
    localStorage.setItem('poolPlayerStats', JSON.stringify(playerStats));
  }, [playerStats]);

  // Modify resetStats to also clear localStorage
  const resetStats = () => {
    pauseTimer();
    setCurrentTime(0);
    setInnings(0);
    setPlayerStats({
      player1: { shots: 0, totalTime: 0, shotTimes: [] },
      player2: { shots: 0, totalTime: 0, shotTimes: [] }
    });
    // Clear localStorage
    localStorage.removeItem('poolPlayerStats');
    // Don't clear player names from storage - keep them even after reset
  };

  const startTimer = () => {
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);
};

const pauseTimer = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
    }
    setIsRunning(false);
};
  
const nextShot = () => {
  const playerKey: PlayerKey = currentPlayer === 1 ? 'player1' : 'player2';
  setPlayerStats(prev => {
      const shotTime = currentTime;
      const updatedShotTimes = [...prev[playerKey].shotTimes, shotTime].sort((a, b) => b - a);
      return {
          ...prev,
          [playerKey]: {
              shots: prev[playerKey].shots + 1,
              totalTime: prev[playerKey].totalTime + shotTime,
              shotTimes: updatedShotTimes
          }
      };
  });
  setCurrentTime(0);
  if (timerRef.current !== null) {
      clearInterval(timerRef.current);
  }
  startTimer();
};
  
const switchPlayer = () => {
  // If timer is running, record the current time for the current player
  if (isRunning) {
    const playerKey = `player${currentPlayer}` as keyof PlayerStatsState;
    setPlayerStats(prev => {
      const shotTime = currentTime;
      const updatedShotTimes = [...prev[playerKey].shotTimes, shotTime].sort((a, b) => b - a);
      
      // Increment innings only when Player 2 finishes
      if (currentPlayer === 2) {
      setInnings(prev => prev + 1);
      } 
      
      return {
        ...prev,
        [playerKey]: {
          shots: prev[playerKey].shots + 1,
          totalTime: prev[playerKey].totalTime + shotTime,
          shotTimes: updatedShotTimes
        }
      };
    });
  }

  // Reset timer and switch player
  setCurrentTime(0);
  if (timerRef.current) clearInterval(timerRef.current);
  setCurrentPlayer(prev => prev === 1 ? 2 : 1);
  
  // Start the timer for the new player
  startTimer();
};
  
  const getAverageTime = (player: number) => {
    const playerKey: PlayerKey = `player${player}` as PlayerKey;
    const stats = playerStats[playerKey];
    return stats.shots === 0 ? 0 : (stats.totalTime / stats.shots).toFixed(1);
  };
  
  const getTimerColor = () => {
    if (currentTime >= timeLimit) {
      return 'text-red-600';
    }
    if (currentTime >= warningTime) {
      return 'text-yellow-500';
    }
    return 'text-gray-900';
  };

  const getCurrentPlayerName = () => {
    return currentPlayer === 1 ? player1Name : player2Name;
  };

  const getTopLongestTimes = (playerKey: PlayerKey) => {
    return playerStats[playerKey].shotTimes.slice(0, 10);
  };

  const getShotCounts = (playerKey: PlayerKey) => {
    const times = playerStats[playerKey].shotTimes;
    return {
      red: times.filter(time => time >= timeLimit).length,
      yellow: times.filter(time => time >= warningTime && time < timeLimit).length,
      blue: times.filter(time => time < warningTime).length
    };
  };

  const renderTimeRow = (times: number[], start: number, end: number) => {
    const slicedTimes = times.slice(start, end);
    return (
      <>
        {slicedTimes.map((time, index) => (
          <div key={index} 
            className={`rounded p-2 text-center text-sm ${
              time >= timeLimit ? 'bg-red-100 text-red-800' : 
              time >= warningTime ? 'bg-yellow-100 text-yellow-800' : 
              'bg-blue-100 text-blue-800'
            }`}
          >
            {time}s
          </div>
        ))}
        {Array(4 - slicedTimes.length).fill(0).map((_, index) => (
          <div key={`empty-${start}-${index}`} className="bg-gray-50 rounded p-2 text-center text-sm text-gray-400">
            --
          </div>
        ))}
      </>
    );
  };

  const [isTimeOut, setIsTimeOut] = useState(false);
  const [timeOutTime, setTimeOutTime] = useState(0);
  const timeOutWarning = 55;
  const timeOutLimit = 60;

  const toggleTimeOut = () => {
    if (!isTimeOut) {
      // Starting time out
      setIsTimeOut(true);
      setTimeOutTime(0);
      // Pause the shot clock
      clearInterval(timerRef.current);
      // Start time out timer
      timerRef.current = setInterval(() => {
        setTimeOutTime(prev => prev + 1);
      }, 1000);
    } else {
      // Ending time out
      setIsTimeOut(false);
      setTimeOutTime(0);
      clearInterval(timerRef.current);
      // Resume shot clock where it left off
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
      setIsRunning(true);
    }
  };
  
  const getTimeOutColor = () => {
    if (timeOutTime >= timeOutLimit) {
      return 'bg-red-500 hover:bg-red-600';
    }
    if (timeOutTime >= timeOutWarning) {
      return 'bg-yellow-500 hover:bg-yellow-600';
    }
    return 'bg-indigo-600 hover:bg-indigo-700';
  };

  const [innings, setInnings] = useState(0);

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen p-4 flex flex-col">
      <div className="bg-blue-600 text-white p-4 shadow-lg rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <BallIcon number={8} />
          <h1 className="text-2xl font-bold text-center tracking-wide">
            POCKET PACE
          </h1>
          <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-white hover:text-blue-200">
                <Settings size={24} />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Player Settings</DialogTitle>
              </DialogHeader>
              <form className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="player1" className="text-right font-medium">
                    Player 1
                  </label>
                  <input
                    id="player1"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    placeholder="Enter player 1 name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="player2" className="text-right font-medium">
                    Player 2
                  </label>
                  <input
                    id="player2"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    placeholder="Enter player 2 name"
                  />
                </div>
              </form>
            </DialogContent>
          </Dialog>
            <BallIcon number={9} />
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex-grow flex flex-col items-center justify-center bg-white shadow-lg mb-4 rounded-lg">
        <div 
          className={`font-bold transition-colors duration-300 ${getTimerColor()}`}
          style={{
            fontSize: 'min(22.5vh, 37.5vw)',
            lineHeight: '1',
            padding: '0'
          }}
        >
          {currentTime === 0 ? '0' : String(currentTime).padStart(2, '0')}
        </div>
        <div className="text-2xl font-semibold mb-6">
          {getCurrentPlayerName()}'s Turn
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-4 bg-gray-200">
        {/* Top row buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`h-16 rounded-lg flex items-center justify-center gap-2 ${
              isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white font-bold w-full`}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={nextShot}
            className="h-16 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 w-full"
          >
            <Timer size={24} />
            Next Shot
          </button>
        </div>

        {/* Bottom row buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={switchPlayer}
            className="h-16 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold flex items-center justify-center gap-2 w-full"
          >
            <User size={24} />
            Switch Player
          </button>
          <button
            onClick={resetStats}
            className="h-16 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-bold flex items-center justify-center gap-2 w-full"
          >
            <RotateCcw size={24} />
            Reset
          </button>
        </div>

        {/* Time Out Button */}
        <button
          onClick={toggleTimeOut}
          className={`h-16 rounded-lg flex items-center justify-between p-4 text-white font-bold w-full ${getTimeOutColor()}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Timer size={24} />
            {isTimeOut ? "End Time Out" : "Time Out"}
          </div>
          {isTimeOut && (
            <div className={`text-xl ${timeOutTime >= timeOutWarning ? 'animate-pulse' : ''}`}>
              {String(timeOutTime).padStart(2, '0')}s
            </div>
          )}
        </button>
      </div>

      {/* Player Stats */}
      <div className="p-4 bg-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Player 1 Stats */}
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="font-bold mb-2">{player1Name}</div>
            <div>Shots: {playerStats.player1.shots}</div>
            <div className="mb-2">Avg: {getAverageTime(1)}s</div>
            <div className="flex justify-center gap-2 mb-2">
              <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm">
                {getShotCounts('player1').red}
              </span>
              <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-sm">
                {getShotCounts('player1').yellow}
              </span>
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                {getShotCounts('player1').blue}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600 mt-2">Longest Times:</div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player1'), 0, 4)}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player1'), 4, 8)}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player1'), 8, 12)}
            </div>
          </div>

          {/* Player 2 Stats */}
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="font-bold mb-2">{player2Name}</div>
            <div>Shots: {playerStats.player2.shots}</div>
            <div className="mb-2">Avg: {getAverageTime(2)}s</div>
            <div className="flex justify-center gap-2 mb-2">
              <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm">
                {getShotCounts('player2').red}
              </span>
              <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-sm">
                {getShotCounts('player2').yellow}
              </span>
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                {getShotCounts('player2').blue}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600 mt-2">Longest Times:</div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player2'), 0, 4)}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player2'), 4, 8)}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player2'), 8, 12)}
            </div>
          </div>
        </div>

        {/* Game Stats Section */}  
      <div className="bg-white rounded-lg shadow p-4 mb-4 mt-4">
        <div className="text-lg font-bold mb-2">Game Stats</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600 mb-1">Total Innings</div>
            <div className="text-2xl font-bold text-blue-600">{innings}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600 mb-1">Shots/Inning</div>
            <div className="text-2xl font-bold text-green-600">
              {innings === 0 ? '0' : ((playerStats.player1.shots + playerStats.player2.shots) / innings).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
        <div className="text-center mt-4 text-gray-400 text-sm">
          Designed by: J. Girardi
        </div>
      </div>
    </div>
  );
};

export default PoolShotClock;