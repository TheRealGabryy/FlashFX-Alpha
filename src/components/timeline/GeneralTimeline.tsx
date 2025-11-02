import React, { useRef, useState, useEffect } from 'react';
import { DesignElement } from '../../types/design';

interface Clip {
  id: string;
  name: string;
  linkedShapeID: string;
  start: number;
  duration: number;
  color: string;
  locked: boolean;
  muted: boolean;
}

interface Track {
  id: string;
  layerID: string;
  clips: Clip[];
}

interface GeneralTimelineProps {
  elements: DesignElement[];
  currentTime: number;
  duration: number;
  fps: number;
  onSeek: (time: number) => void;
  onClipSelect?: (clipId: string) => void;
}

const GeneralTimeline: React.FC<GeneralTimelineProps> = ({
  elements,
  currentTime,
  duration,
  fps = 30,
  onSeek,
  onClipSelect
}) => {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newTracks: Track[] = elements.map((element, index) => {
      const clip: Clip = {
        id: `clip-${element.id}`,
        name: element.name || `Layer ${index + 1}`,
        linkedShapeID: element.id,
        start: 0,
        duration: 5,
        color: element.fill || '#60a5fa',
        locked: false,
        muted: false
      };

      return {
        id: `track-${element.id}`,
        layerID: element.id,
        clips: [clip]
      };
    });

    setTracks(newTracks);
  }, [elements]);

  const handleRulerClick = (e: React.MouseEvent) => {
    if (rulerRef.current) {
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(time, duration)));
    }
  };

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    if (isDraggingPlayhead && rulerRef.current) {
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(time, duration)));
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const renderRulerTicks = () => {
    const ticks = [];
    const totalSeconds = Math.ceil(duration);

    for (let i = 0; i <= totalSeconds; i++) {
      const x = i * pixelsPerSecond;
      ticks.push(
        <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: `${x}px` }}>
          <div className="w-px h-4 bg-gray-500"></div>
          <span className="text-[10px] text-gray-400 mt-1">{i}s</span>
        </div>
      );

      for (let f = 1; f < fps; f += 5) {
        const frameX = x + (f / fps) * pixelsPerSecond;
        ticks.push(
          <div key={`${i}-${f}`} className="absolute top-0" style={{ left: `${frameX}px` }}>
            <div className="w-px h-2 bg-gray-600"></div>
          </div>
        );
      }
    }

    return ticks;
  };

  const playheadPosition = currentTime * pixelsPerSecond;

  return (
    <div className="h-full bg-gray-900 border-t border-r border-gray-700/50 flex flex-col relative">
      <div className="h-8 bg-gray-800/80 border-b border-gray-700/50 flex items-center px-4 justify-between">
        <div className="text-sm font-medium text-gray-300">General Timeline</div>
        <div className="text-xs text-gray-400">
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div
        ref={rulerRef}
        className="h-10 bg-gray-850 border-b border-gray-700/50 relative cursor-pointer overflow-hidden"
        onClick={handleRulerClick}
        onMouseMove={handlePlayheadDrag}
        onMouseUp={() => setIsDraggingPlayhead(false)}
        onMouseLeave={() => setIsDraggingPlayhead(false)}
      >
        <div className="absolute inset-0 overflow-x-auto">
          <div className="relative h-full" style={{ width: `${duration * pixelsPerSecond}px`, minWidth: '100%' }}>
            {renderRulerTicks()}

            {/* Playhead in ruler for drag handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-transparent z-10 cursor-ew-resize"
              style={{ left: `${playheadPosition}px` }}
              onMouseDown={() => setIsDraggingPlayhead(true)}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-sm cursor-ew-resize"></div>
            </div>
          </div>
        </div>
      </div>

      <div ref={timelineRef} className="flex-1 overflow-auto relative">
        {tracks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No layers available. Create shapes to see timeline clips.
          </div>
        ) : (
          <div className="relative">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="h-12 border-b border-gray-700/30 flex items-center relative hover:bg-gray-800/30"
              >
                <div className="w-32 px-3 text-xs text-gray-300 truncate border-r border-gray-700/30">
                  {track.clips[0]?.name || `Track ${index + 1}`}
                </div>

                <div
                  className="flex-1 relative cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const time = x / pixelsPerSecond;
                    onSeek(Math.max(0, Math.min(time, duration)));
                  }}
                >
                  {/* Full-height yellow playhead for this track */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 pointer-events-none z-20"
                    style={{ left: `${playheadPosition}px` }}
                  ></div>
                  <div className="absolute inset-0 overflow-x-auto">
                    <div style={{ width: `${duration * pixelsPerSecond}px`, minWidth: '100%', height: '100%' }}>
                      {track.clips.map(clip => {
                        const clipX = clip.start * pixelsPerSecond;
                        const clipWidth = clip.duration * pixelsPerSecond;
                        const isUnderPlayhead = currentTime >= clip.start && currentTime <= clip.start + clip.duration;

                        return (
                          <div
                            key={clip.id}
                            className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all ${
                              isUnderPlayhead ? 'ring-2 ring-yellow-400' : ''
                            }`}
                            style={{
                              left: `${clipX}px`,
                              width: `${clipWidth}px`,
                              backgroundColor: clip.color,
                              opacity: clip.muted ? 0.4 : 0.8
                            }}
                            onClick={() => onClipSelect?.(clip.id)}
                          >
                            <div className="px-2 py-1 text-xs text-white truncate">
                              {clip.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-8 bg-gray-800/80 border-t border-gray-700/50 flex items-center px-4 gap-4">
        <button className="text-xs text-gray-400 hover:text-white transition-colors">
          Zoom: {pixelsPerSecond}px/s
        </button>
        <button className="text-xs text-gray-400 hover:text-white transition-colors">
          Snap: On
        </button>
      </div>
    </div>
  );
};

export default GeneralTimeline;
