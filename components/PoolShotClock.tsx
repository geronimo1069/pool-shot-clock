"use client";

import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, User, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

interface PlayerStats {
  shots: number;
  totalTime: number;
  shotTimes: number[];
}

interface PlayerStatsState {
  player1: PlayerStats;
  player2: PlayerStats;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [playerStats, setPlayerStats] = useState<PlayerStatsState>({
    player1: { shots: 0, totalTime: 0, shotTimes: [] },
    player2: { shots: 0, totalTime: 0, shotTimes: [] }
  });
  
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    setIsRunning(true);
    timerRef.current = window.setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);
  };
  
  const pauseTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };
  
  const nextShot = () => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
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
      window.clearInterval(timerRef.current);
    }
    startTimer();
  };
  
  const switchPlayer = () => {
    setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    setCurrentTime(0);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);
    setIsRunning(true);
  };
  
  const getAverageTime = (player) => {
    const stats = playerStats[`player${player}`];
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

  const getTopLongestTimes = (playerKey) => {
    return playerStats[playerKey].shotTimes.slice(0, 10);
  };

  const getShotCounts = (playerKey) => {
    const times = playerStats[playerKey].shotTimes;
    return {
      red: times.filter(time => time >= timeLimit).length,
      yellow: times.filter(time => time >= warningTime && time < timeLimit).length,
      blue: times.filter(time => time < warningTime).length
    };
  };

  const renderTimeRow = (times, start, end) => {
    const slicedTimes = times.slice(start, end);
    return (
      <>
        {slicedTimes.map((time, index) => (
          <div key={index} 
            className={`rounded p-1 text-center text-sm ${
              time >= timeLimit ? 'bg-red-50 text-red-600' : 
              time >= warningTime ? 'bg-yellow-50 text-yellow-600' : 
              'bg-blue-50'
            }`}
          >
            {time}s
          </div>
        ))}
        {Array(5 - slicedTimes.length).fill(0).map((_, index) => (
          <div key={`empty-${start}-${index}`} className="bg-gray-50 rounded p-1 text-center text-sm text-gray-400">
            --
          </div>
        ))}
      </>
    );
  };

  const resetStats = () => {
    pauseTimer();
    setCurrentTime(0);
    setPlayerStats({
      player1: { shots: 0, totalTime: 0, shotTimes: [] },
      player2: { shots: 0, totalTime: 0, shotTimes: [] }
    });
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

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white py-3 px-4 shadow-lg">
        <div className="flex items-center justify-between">
          <BallIcon number={8} />
          <h1 className="text-2xl font-bold text-center tracking-wide">
            POCKET PACE
          </h1>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger>
                <Settings size={24} className="text-white hover:text-blue-200 cursor-pointer" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Player Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Player 1:</label>
                    <input
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="Enter player 1 name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Player 2:</label>
                    <input
                      className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="Enter player 2 name"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <BallIcon number={9} />
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex-grow flex flex-col items-center justify-center bg-white shadow-lg mb-4">
        <div 
          className={`font-bold transition-colors duration-300 ${getTimerColor()}`}
          style={{
            fontSize: 'min(30vh, 50vw)',
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
            <div className="grid grid-cols-5 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player1'), 0, 5)}
            </div>
            <div className="grid grid-cols-5 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player1'), 5, 10)}
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
            <div className="grid grid-cols-5 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player2'), 0, 5)}
            </div>
            <div className="grid grid-cols-5 gap-1 mt-1">
              {renderTimeRow(getTopLongestTimes('player2'), 5, 10)}
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