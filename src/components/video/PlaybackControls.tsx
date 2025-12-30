import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Square } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onTogglePlayPause: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  fps,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onTogglePlayPause
}) => {
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const handleSkipBackward = () => {
    onSeek(Math.max(0, currentTime - 1));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(duration, currentTime + 1));
  };

  return (
    <div className="flex items-center justify-between bg-gray-800 border-t border-gray-700 px-6 py-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSkipBackward}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Skip backward 1 second"
        >
          <SkipBack className="w-5 h-5 text-gray-300" />
        </button>

        <button
          onClick={onTogglePlayPause}
          className="p-3 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-gray-900" />
          ) : (
            <Play className="w-6 h-6 text-gray-900" />
          )}
        </button>

        <button
          onClick={onStop}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Stop"
        >
          <Square className="w-5 h-5 text-gray-300" />
        </button>

        <button
          onClick={handleSkipForward}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Skip forward 1 second"
        >
          <SkipForward className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm font-mono text-gray-300">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-gray-500">/</div>
        <div className="text-sm font-mono text-gray-400">
          {formatTime(duration)}
        </div>
        <div className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
          {fps} FPS
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
