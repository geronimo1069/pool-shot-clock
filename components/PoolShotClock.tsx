"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, User, Settings, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from "../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

import PlayersStatsDialog from './PlayersStatsDialog';

type PlayerNumber = 1 | 2;

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

// Add this interface with the existing interfaces
interface WinsState {
  player1: number;
  player2: number;
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
  const { data: session, status } = useSession();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [playerStats, setPlayerStats] = useState<PlayerStatsState>({
    player1: { shots: 0, totalTime: 0, shotTimes: [] },
    player2: { shots: 0, totalTime: 0, shotTimes: [] }
  });

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerNumber>(1);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [wins, setWins] = useState<WinsState>({ player1: 0, player2: 0 });
  
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [timeOutTime, setTimeOutTime] = useState(0);
  const timeOutWarning = 55;
  const timeOutLimit = 60;
  
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
  
  useEffect(() => {
    const savedWins = localStorage.getItem('poolWins');
    if (savedWins) {
      setWins(JSON.parse(savedWins));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('poolWins', JSON.stringify(wins));
  }, [wins]);

  useEffect(() => {
    const savedNames = localStorage.getItem('poolPlayerNames');
    if (savedNames) {
      const names = JSON.parse(savedNames);
      setPlayer1Name(names.player1Name);
      setPlayer2Name(names.player2Name);
    }
  
    const savedStats = localStorage.getItem('poolPlayerStats');
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    }
  }, []); // Only runs once on mount

  const handleWin = (winner: 'player1' | 'player2') => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  
    // Update wins
    setWins(prev => ({
      ...prev,
      [winner]: prev[winner] + 1
    }));
  
    // Reset timer and keep it paused
    setCurrentTime(0);
    setIsRunning(false);  // Keep timer paused
  
    // Set winner as current player and start their timer
    setCurrentPlayer(winner === 'player1' ? 1 : 2);
    
  };
  
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const warningTime = 25;
  const timeLimit = 35;

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

    // Reset wins
    setWins({ player1: 0, player2: 0 });

    // Clear localStorage
    localStorage.removeItem('poolPlayerStats');
    localStorage.removeItem('poolWins');
    localStorage.removeItem('poolPlayerNames');

    // Refresh the page
    window.location.reload();
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
      const updatedShotTimes = [shotTime, ...prev[playerKey].shotTimes];
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
  // First, stop the current timer
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = undefined;
  }

  // If timer was running, record the current time for the current player
  if (isRunning) {
    const playerKey = `player${currentPlayer}` as keyof PlayerStatsState;
    setPlayerStats(prev => {
      const shotTime = currentTime;
      const updatedShotTimes = [shotTime, ...prev[playerKey].shotTimes];
      
      return {
        ...prev,
        [playerKey]: {
          shots: prev[playerKey].shots + 1,
          totalTime: prev[playerKey].totalTime + shotTime,
          shotTimes: updatedShotTimes
        }
      };
    });

    // Increment innings only when Player 2 finishes
    if (currentPlayer === 2) {
      setInnings(prev => prev + 1);
    }
  }

  // Switch player
  setCurrentPlayer(prev => prev === 1 ? 2 : 1);
  
  // Reset timer and start it for the new player
  setCurrentTime(0);
  setIsRunning(true);  // Set running to true
  timerRef.current = setInterval(() => {
    setCurrentTime(prev => prev + 1);
  }, 1000);
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

  const getRecentShots = (playerKey: PlayerKey) => {
    return playerStats[playerKey].shotTimes.slice(0, 12);
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

  // Save wins to localStorage when they change
  useEffect(() => {
    localStorage.setItem('poolWins', JSON.stringify(wins));
  }, [wins]);

  const handleDeleteShot = (player: PlayerNumber, shotIndex: number) => {
    setPlayerStats(prev => {
      const playerKey = `player${player}` as PlayerKey;
      const playerStats = prev[playerKey];
      
      // Get the time that's being deleted to subtract from total
      const timeToDelete = playerStats.shotTimes[shotIndex];
      
      // Create new shot times array without the deleted shot
      const newShotTimes = [...playerStats.shotTimes];
      newShotTimes.splice(shotIndex, 1);
      
      return {
        ...prev,
        [playerKey]: {
          shots: playerStats.shots - 1,
          totalTime: playerStats.totalTime - timeToDelete,
          shotTimes: newShotTimes
        }
      };
    });
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Welcome to Pocket Pace</h1>
        <p className="text-gray-600">Please sign in to continue</p>
        <button
          onClick={() => signIn('google')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

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
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Player Settings</DialogTitle>
                  <DialogClose className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
                  Return
                  </DialogClose>
                </div>
              </DialogHeader>
              <form>
                <div className="grid gap-4 py-4">
                  {/* Your existing player name inputs */}
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
      
                    {/* Add account section inside the form */}
                  <div className="border-t mt-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Signed in as:</div>
                      {/* Use optional chaining to safely access the email */}
                      <div className="text-sm text-gray-600">
                        {session?.user?.email || 'Loading...'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Sign Out
                      </button>
                  </div>
                  </div>
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

      {/* Updated Control Buttons Layout */}
      <div className="p-4 bg-gray-200">
        {/* Start/Pause and Next Shot buttons */}
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

        {/* Switch Player and Rack Over buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={switchPlayer}
            className="h-16 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold flex items-center justify-center gap-2 w-full"
          >
            <User size={24} />
            Switch Player
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button 
                onClick={() => {
                  // Stop the timer immediately when Rack Over is clicked
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = undefined;
                 }
                  setIsRunning(false);
                }} 
                className="h-16 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center justify-center gap-2 w-full"
              >
                <Trophy size={24} />
                Rack Over
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle className="text-lg font-bold mb-4">
                Who Won?
              </AlertDialogTitle>
              <div className="grid grid-cols-2 gap-4">
                <AlertDialogAction
                  onClick={() => handleWin('player1')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {player1Name}
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => handleWin('player2')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {player2Name}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Time Out and Reset buttons */}
<div className="grid grid-cols-2 gap-4 mb-4">
  <button
    onClick={toggleTimeOut}
    className={`h-16 rounded-lg flex items-center justify-between px-4 text-white font-bold w-full ${getTimeOutColor()}`}
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
  <AlertDialog>
  <AlertDialogTrigger asChild>
    <button className="h-16 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-bold flex items-center justify-center gap-2 w-full">
      <RotateCcw size={24} />
      Reset
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent className="bg-white">
    <AlertDialogTitle className="text-xl font-bold mb-4 text-red-600">
      Reset Everything?
    </AlertDialogTitle>
    <div className="mb-6 text-gray-700">
      This will reset everything:
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li>Player names</li>
        <li>Match wins ({wins.player1}-{wins.player2})</li>
        <li>All player statistics</li>
        <li>Shot times and averages</li>
        <li>Innings count</li>
      </ul>
      <div className="mt-4 text-red-600 font-semibold">
        This action cannot be undone.
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <AlertDialogAction
        onClick={() => {/* do nothing, just close dialog */}}
        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
      >
        Cancel
      </AlertDialogAction>
      <AlertDialogAction
        onClick={resetStats}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Reset Everything
      </AlertDialogAction>
    </div>
  </AlertDialogContent>
</AlertDialog>
</div>

      {/* Player Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Player 1 Stats */}
        <button 
          onClick={() => {
            setSelectedPlayer(1);
            setStatsDialogOpen(true);
          }}
          className="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors w-full text-left"
        >
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
            {renderTimeRow(getRecentShots('player1'), 0, 4)}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {renderTimeRow(getRecentShots('player1'), 4, 8)}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {renderTimeRow(getRecentShots('player1'), 8, 12)}
          </div>
        </button>

        {/* Player 2 Stats */}
        <button 
          onClick={() => {
            setSelectedPlayer(2);
            setStatsDialogOpen(true);
          }}
          className="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors w-full text-left"
        >
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
            {renderTimeRow(getRecentShots('player2'), 0, 4)}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {renderTimeRow(getRecentShots('player2'), 4, 8)}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {renderTimeRow(getRecentShots('player2'), 8, 12)}
          </div>
        </button>
      </div>

      {/* Game Stats Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-lg font-bold mb-2">Game Stats</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600 mb-1">Total Innings</div>
            <div className="text-2xl font-bold text-blue-600">{innings}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600 mb-1">Wins</div>
            <div className="text-2xl font-bold text-green-600">
              {wins.player1} / {wins.player2}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 text-gray-400 text-sm">
        Designed by: JJ Girardi
      </div>
      </div>
      <PlayersStatsDialog 
        player={selectedPlayer}
        isOpen={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        playerStats={playerStats}
        playerName={selectedPlayer === 1 ? player1Name : player2Name}
        onDeleteShot={handleDeleteShot}
      />
    </div>
  );
};



export default PoolShotClock;