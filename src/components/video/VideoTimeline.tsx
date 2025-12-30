import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DesignElement, ClipProperties } from '../../types/design';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface VideoTimelineProps {
  elements: DesignElement[];
  currentTime: number;
  duration: number;
  fps: number;
  onSeek: (time: number) => void;
  onClipSelect?: (elementId: string) => void;
  onUpdateClip?: (elementId: string, updates: Partial<ClipProperties>) => void;
  selectedClipId?: string | null;
}

const DEFAULT_CLIP_DURATION = 5;
const MIN_CLIP_DURATION = 0.1;

const VideoTimeline: React.FC<VideoTimelineProps> = ({
  elements,
  currentTime,
  duration,
  fps = 30,
  onSeek,
  onClipSelect,
  onUpdateClip,
  selectedClipId
}) => {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{elementId: string, startX: number, startTime: number} | null>(null);
  const [resizingClip, setResizingClip] = useState<{elementId: string, edge: 'start' | 'end', startX: number, originalProps: ClipProperties} | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const getClipProperties = useCallback((element: DesignElement): ClipProperties => {
    if (element.clipProperties) {
      return element.clipProperties;
    }

    return {
      startTime: 0,
      duration: DEFAULT_CLIP_DURATION,
      endTime: DEFAULT_CLIP_DURATION,
      trackIndex: 0,
      locked: false,
      muted: false,
      speed: 1,
      color: element.fill || '#60a5fa'
    };
  }, []);

  const handleRulerClick = (e: React.MouseEvent) => {
    if (rulerRef.current && !isDraggingPlayhead) {
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(time, duration)));
    }
  };

  const handlePlayheadDrag = useCallback((e: MouseEvent) => {
    if (isDraggingPlayhead && rulerRef.current) {
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(time, duration)));
    }
  }, [isDraggingPlayhead, pixelsPerSecond, duration, onSeek]);

  const handleClipDrag = useCallback((e: MouseEvent) => {
    if (draggingClip && timelineRef.current) {
      const deltaX = e.clientX - draggingClip.startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newStartTime = Math.max(0, draggingClip.startTime + deltaTime);

      const element = elements.find(el => el.id === draggingClip.elementId);
      if (element && onUpdateClip) {
        const clipProps = getClipProperties(element);
        const newEndTime = newStartTime + clipProps.duration;

        onUpdateClip(draggingClip.elementId, {
          ...clipProps,
          startTime: newStartTime,
          endTime: newEndTime
        });
      }
    }
  }, [draggingClip, pixelsPerSecond, elements, onUpdateClip, getClipProperties]);

  const handleClipResize = useCallback((e: MouseEvent) => {
    if (resizingClip && timelineRef.current) {
      const deltaX = e.clientX - resizingClip.startX;
      const deltaTime = deltaX / pixelsPerSecond;

      const element = elements.find(el => el.id === resizingClip.elementId);
      if (element && onUpdateClip) {
        const originalProps = resizingClip.originalProps;

        if (resizingClip.edge === 'start') {
          const newStartTime = Math.max(0, originalProps.startTime + deltaTime);
          const newDuration = Math.max(MIN_CLIP_DURATION, originalProps.endTime - newStartTime);

          onUpdateClip(resizingClip.elementId, {
            ...originalProps,
            startTime: newStartTime,
            duration: newDuration,
            endTime: newStartTime + newDuration
          });
        } else {
          const newDuration = Math.max(MIN_CLIP_DURATION, originalProps.duration + deltaTime);
          const newEndTime = originalProps.startTime + newDuration;

          onUpdateClip(resizingClip.elementId, {
            ...originalProps,
            duration: newDuration,
            endTime: newEndTime
          });
        }
      }
    }
  }, [resizingClip, pixelsPerSecond, elements, onUpdateClip]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handlePlayheadDrag(e);
      handleClipDrag(e);
      handleClipResize(e);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDraggingClip(null);
      setResizingClip(null);
    };

    if (isDraggingPlayhead || draggingClip || resizingClip) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingPlayhead, draggingClip, resizingClip, handlePlayheadDrag, handleClipDrag, handleClipResize]);

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

      for (let f = 5; f < fps; f += 5) {
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
    <div className="h-full bg-gray-900 border-t border-gray-700/50 flex flex-col relative">
      <div className="h-8 bg-gray-800/80 border-b border-gray-700/50 flex items-center px-4 justify-between">
        <div className="text-sm font-medium text-gray-300">Video Timeline</div>
        <div className="text-xs text-gray-400">
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div
        ref={rulerRef}
        className="h-10 bg-gray-850 border-b border-gray-700/50 relative cursor-pointer overflow-x-auto"
        onClick={handleRulerClick}
      >
        <div className="relative h-full" style={{ width: `${duration * pixelsPerSecond}px`, minWidth: '100%' }}>
          {renderRulerTicks()}

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 cursor-ew-resize"
            style={{ left: `${playheadPosition}px` }}
            onMouseDown={() => setIsDraggingPlayhead(true)}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-sm cursor-ew-resize"></div>
          </div>
        </div>
      </div>

      <div ref={timelineRef} className="flex-1 overflow-auto relative">
        {elements.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No elements available. Create shapes to see timeline clips.
          </div>
        ) : (
          <div className="relative">
            {elements.filter(el => el.type !== 'group').map((element, index) => {
              const clipProps = getClipProperties(element);
              const clipX = clipProps.startTime * pixelsPerSecond;
              const clipWidth = clipProps.duration * pixelsPerSecond;
              const isSelected = selectedClipId === element.id;
              const isUnderPlayhead = currentTime >= clipProps.startTime && currentTime <= clipProps.endTime;

              return (
                <div
                  key={element.id}
                  className="h-12 border-b border-gray-700/30 flex items-center relative hover:bg-gray-800/30"
                >
                  <div className="w-32 px-3 flex items-center justify-between border-r border-gray-700/30 gap-2">
                    <span className="text-xs text-gray-300 truncate flex-1">
                      {element.name || `Track ${index + 1}`}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="p-0.5 hover:bg-gray-700 rounded"
                        title={element.visible ? 'Hide' : 'Show'}
                      >
                        {element.visible ? (
                          <Eye className="w-3 h-3 text-gray-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                      <button
                        className="p-0.5 hover:bg-gray-700 rounded"
                        title={clipProps.locked ? 'Unlock' : 'Lock'}
                      >
                        {clipProps.locked ? (
                          <Lock className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Unlock className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative" style={{ height: '100%' }}>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 pointer-events-none z-20"
                      style={{ left: `${playheadPosition}px` }}
                    ></div>

                    <div className="absolute inset-0 overflow-x-auto">
                      <div style={{ width: `${duration * pixelsPerSecond}px`, minWidth: '100%', height: '100%' }}>
                        <div
                          className={`absolute top-1 bottom-1 rounded cursor-move transition-all group ${
                            isSelected ? 'ring-2 ring-yellow-400 shadow-lg' : ''
                          } ${isUnderPlayhead ? 'shadow-md' : ''}`}
                          style={{
                            left: `${clipX}px`,
                            width: `${clipWidth}px`,
                            backgroundColor: clipProps.color || element.fill,
                            opacity: clipProps.muted ? 0.4 : 0.8
                          }}
                          onClick={() => onClipSelect?.(element.id)}
                          onMouseDown={(e) => {
                            if (!clipProps.locked) {
                              setDraggingClip({
                                elementId: element.id,
                                startX: e.clientX,
                                startTime: clipProps.startTime
                              });
                            }
                          }}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-white/50"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              if (!clipProps.locked) {
                                setResizingClip({
                                  elementId: element.id,
                                  edge: 'start',
                                  startX: e.clientX,
                                  originalProps: clipProps
                                });
                              }
                            }}
                          />

                          <div className="px-2 py-1 text-xs text-white truncate select-none">
                            {element.name}
                          </div>

                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-white/50"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              if (!clipProps.locked) {
                                setResizingClip({
                                  elementId: element.id,
                                  edge: 'end',
                                  startX: e.clientX,
                                  originalProps: clipProps
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-8 bg-gray-800/80 border-t border-gray-700/50 flex items-center px-4 gap-4">
        <button
          className="text-xs text-gray-400 hover:text-white transition-colors"
          onClick={() => setPixelsPerSecond(prev => Math.min(prev + 10, 200))}
        >
          Zoom In
        </button>
        <button
          className="text-xs text-gray-400 hover:text-white transition-colors"
          onClick={() => setPixelsPerSecond(prev => Math.max(prev - 10, 20))}
        >
          Zoom Out
        </button>
        <span className="text-xs text-gray-500">
          {pixelsPerSecond}px/s
        </span>
      </div>
    </div>
  );
};

export default VideoTimeline;
