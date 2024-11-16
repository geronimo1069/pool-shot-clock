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
}

const PlayersStatsDialog = ({ 
  player, 
  isOpen, 
  onClose, 
  playerStats, 
  playerName 
}: PlayersStatsDialogProps) => {
  const stats = playerStats[`player${player}`];
  const shotTimes = stats.shotTimes;

  // Calculate time distributions
  const timeRanges = [
    { min: 0, max: 15, label: '0-15s', color: 'bg-green-100 text-green-800' },
    { min: 15, max: 30, label: '15-30s', color: 'bg-blue-100 text-blue-800' },
    { min: 30, max: 40, label: '30-40s', color: 'bg-yellow-100 text-yellow-800' },
    { min: 40, max: Infinity, label: '40s+', color: 'bg-red-100 text-red-800' }
  ];

  const timeDistribution = timeRanges.map(range => ({
    range: range.label,
    count: shotTimes.filter(time => time >= range.min && time < range.max).length,
    color: range.color
  }));

  // Prepare data for the line chart
  const chartData = shotTimes.map((time, index) => ({
    shot: index + 1,
    time: time
  })).reverse(); // Most recent shots first

  // Calculate statistics
  const averageTime = stats.shots > 0 ? (stats.totalTime / stats.shots).toFixed(1) : 0;
  const maxTime = Math.max(...shotTimes);
  const minTime = Math.min(...shotTimes);
  const medianTime = shotTimes.length > 0 
    ? shotTimes.slice().sort((a, b) => a - b)[Math.floor(shotTimes.length / 2)]
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <button
         onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {playerName}'s Detailed Statistics
          </DialogTitle>
        </DialogHeader>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="text-sm text-blue-600 mb-1">Total Shots</div>
              <div className="text-2xl font-bold">{stats.shots}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4">
              <div className="text-sm text-green-600 mb-1">Average Time</div>
              <div className="text-2xl font-bold">{averageTime}s</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="p-4">
              <div className="text-sm text-yellow-600 mb-1">Median Time</div>
              <div className="text-2xl font-bold">{medianTime}s</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="p-4">
              <div className="text-sm text-purple-600 mb-1">Time Range</div>
              <div className="text-2xl font-bold">{minTime}s - {maxTime}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Shot Time Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Shot Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {timeDistribution.map((dist, i) => (
                <div key={i} className={`${dist.color} rounded-lg p-4`}>
                  <div className="text-2xl font-bold">{dist.count}</div>
                  <div className="text-sm">{dist.range}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complete Shot History */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg font-semibold flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5" />
      Complete Shot History
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
      <div className="grid grid-cols-8 md:grid-cols-12 gap-1">
        {shotTimes.map((time, index) => (
          <div
            key={index}
            className={`p-1 rounded text-center text-xs ${
              time >= 25 ? 'bg-red-100 text-red-800' :
              time >= 20 ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {time}s
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