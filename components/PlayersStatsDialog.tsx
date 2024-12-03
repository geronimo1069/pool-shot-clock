import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { X } from 'lucide-react';

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

interface PlayersStatsDialogProps {
  player: PlayerNumber;
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerStatsState;
  playerName: string;
  onDeleteShot: (player: PlayerNumber, shotIndex: number) => void;
}

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const warningTime = 25;
const timeLimit = 35;

const PlayersStatsDialog = ({ 
  player, 
  isOpen, 
  onClose, 
  playerStats, 
  playerName,
  onDeleteShot
}: PlayersStatsDialogProps) => {
  const stats = playerStats[`player${player}`];
  const shotTimes = stats.shotTimes;

  const timeRanges = [
    { min: 0, max: 15, label: '0-15s', color: 'bg-green-100 text-green-800' },
    { min: 15, max: 25, label: '15-25s', color: 'bg-blue-100 text-blue-800' },
    { min: 25, max: 35, label: '25-35s', color: 'bg-yellow-100 text-yellow-800' },
    { min: 35, max: Infinity, label: '35s+', color: 'bg-red-100 text-red-800' }
  ];

  const timeDistribution = timeRanges.map(range => ({
    range: range.label,
    count: shotTimes.filter(time => time >= range.min && time < range.max).length,
    color: range.color
  }));

  const chartData = shotTimes.map((time, index) => ({
    shot: index + 1,
    time: time
  })).reverse();

  const averageTime = stats.shots > 0 ? (stats.totalTime / stats.shots).toFixed(1) : 0;
  const maxTime = Math.max(...shotTimes);
  const minTime = Math.min(...shotTimes);

  // Format total time to show minutes if over 60 seconds
  const formatTotalTime = (totalSeconds: number) => {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      title="Delete shot"
    >
      <X className="h-3 w-3" />
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Clock className="h-6 w-6" />
            {playerName}'s Detailed Statistics
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-0">
            <CardContent className="p-4">
              <div className="text-sm text-blue-600 mb-1">Total Shots</div>
              <div className="text-2xl font-bold text-blue-800">{stats.shots}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-0">
            <CardContent className="p-4">
              <div className="text-sm text-green-600 mb-1">Average Time</div>
              <div className="text-2xl font-bold text-green-800">{averageTime}s</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-0">
            <CardContent className="p-4">
              <div className="text-sm text-yellow-600 mb-1">Total Time</div>
              <div className="text-2xl font-bold text-yellow-800">{formatTotalTime(stats.totalTime)}</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-0">
            <CardContent className="p-4">
              <div className="text-sm text-purple-600 mb-1">Time Range</div>
              <div className="text-2xl font-bold text-purple-800">{minTime}s - {maxTime}s</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <Timer className="h-5 w-5" />
              Shot Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {timeDistribution.map((dist, i) => (
                <div key={i} className={`${dist.color} rounded-lg p-4`}>
                  <div className="text-2xl font-bold">{dist.count}</div>
                  <div className="text-sm">{dist.range}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <CheckCircle2 className="h-5 w-5" />
              Complete Shot History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-white">
              <div className="grid grid-cols-8 md:grid-cols-12 gap-1">
                {shotTimes.map((time, index) => (
                  <div
                    key={index}
                    className={`relative group p-1 rounded text-center text-xs ${
                      time >= timeLimit ? 'bg-red-100 text-red-800' :
                      time >= warningTime ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {time}s
                    <DeleteButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteShot(player, index);
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayersStatsDialog;