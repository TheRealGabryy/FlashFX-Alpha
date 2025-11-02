import React, { useRef, useState } from 'react';

interface AnimationTimelineProps {
  currentTime: number;
  duration: number;
  fps: number;
  onSeek: (time: number) => void;
  selectedClipId?: string | null;
}

const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  currentTime,
  duration,
  fps = 30,
  onSeek,
  selectedClipId
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const pixelsPerSecond = 50;
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

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
    }

    return ticks;
  };

  const playheadPosition = currentTime * pixelsPerSecond;

  const propertyRows = [
    { name: 'Transform > Position', disabled: true },
    { name: 'Transform > Scale', disabled: true },
    { name: 'Transform > Rotation', disabled: true },
    { name: 'Opacity', disabled: true },
    { name: 'Fill Color', disabled: true },
    { name: 'Stroke', disabled: true }
  ];

  return (
    <div className="h-full bg-gray-900 border-t border-l border-gray-700/50 flex flex-col relative">
      <div className="h-8 bg-gray-800/80 border-b border-gray-700/50 flex items-center px-4 justify-between">
        <div className="text-sm font-medium text-gray-300">Animation Timeline</div>
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

      <div className="flex-1 overflow-auto relative">
        {!selectedClipId ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm p-8 relative">
            {/* Full-height yellow playhead for empty state */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 pointer-events-none z-20"
              style={{ left: `${playheadPosition}px` }}
            ></div>
            <div className="text-center space-y-2">
              <p className="font-medium">Animation Timeline: Reserved for Property Keyframes</p>
              <p className="text-xs text-gray-600">Select a clip in the General Timeline to view properties</p>
              <p className="text-xs text-gray-600">No keyframe features available yet</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="text-xs text-gray-400 px-4 py-2 bg-gray-800/40 border-b border-gray-700/30">
              Property tracks for selected clip (Animation features disabled)
            </div>
            {propertyRows.map((property, index) => (
              <div
                key={index}
                className="h-10 border-b border-gray-700/30 flex items-center relative opacity-50"
                title="Animation features disabled — timeline reserved"
              >
                <div className="w-48 px-3 text-xs text-gray-400 border-r border-gray-700/30">
                  {property.name}
                </div>

                <div className="flex-1 relative">
                  {/* Full-height yellow playhead for this property track */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 pointer-events-none z-20"
                    style={{ left: `${playheadPosition}px` }}
                  ></div>
                  <div className="absolute inset-0 overflow-x-auto">
                    <div style={{ width: `${duration * pixelsPerSecond}px`, minWidth: '100%', height: '100%' }}>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="px-4 py-8 text-center">
              <p className="text-xs text-gray-600">
                Keyframe controls are disabled. Animation timeline is reserved for future implementation.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="h-8 bg-gray-800/80 border-t border-gray-700/50 flex items-center px-4 gap-4">
        <button className="text-xs text-gray-400 cursor-not-allowed" disabled>
          Add Keyframe (Disabled)
        </button>
        <button className="text-xs text-gray-400 cursor-not-allowed" disabled>
          Animation: None
        </button>
      </div>
    </div>
  );
};

export default AnimationTimeline;
