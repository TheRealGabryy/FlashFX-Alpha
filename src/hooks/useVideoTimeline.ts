import { useState, useCallback, useEffect, useRef } from 'react';
import { DesignElement, VideoTimeline, ClipProperties } from '../types/design';
import { v4 as uuidv4 } from 'uuid';

export interface UseVideoTimelineReturn {
  timeline: VideoTimeline;
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  seekToTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setFps: (fps: number) => void;
  initializeClipsFromElements: (elements: DesignElement[]) => void;
  updateElementClipProperties: (elementId: string, updates: Partial<ClipProperties>) => void;
}

const DEFAULT_CLIP_DURATION = 5;
const DEFAULT_FPS = 30;
const DEFAULT_TOTAL_DURATION = 30;

export const useVideoTimeline = (elements: DesignElement[]): UseVideoTimelineReturn => {
  const [timeline, setTimeline] = useState<VideoTimeline>({
    duration: DEFAULT_TOTAL_DURATION,
    currentTime: 0,
    fps: DEFAULT_FPS,
    tracks: [],
    isPlaying: false,
    loop: false
  });

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  const initializeClipsFromElements = useCallback((elements: DesignElement[]) => {
    const tracks = elements
      .filter(el => el.type !== 'group')
      .map((element, index) => ({
        id: `track-${element.id}`,
        name: element.name || `Track ${index + 1}`,
        elementId: element.id,
        visible: element.visible,
        locked: element.locked,
        height: 40
      }));

    setTimeline(prev => ({
      ...prev,
      tracks
    }));
  }, []);

  useEffect(() => {
    initializeClipsFromElements(elements);
  }, [elements, initializeClipsFromElements]);

  const setCurrentTime = useCallback((time: number) => {
    setTimeline(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.duration))
    }));
  }, []);

  const play = useCallback(() => {
    setTimeline(prev => ({ ...prev, isPlaying: true }));
    lastTimeRef.current = Date.now();
  }, []);

  const pause = useCallback(() => {
    setTimeline(prev => ({ ...prev, isPlaying: false }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    setTimeline(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0
    }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    setTimeline(prev => {
      if (prev.isPlaying) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        lastTimeRef.current = Date.now();
      }
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  }, []);

  const seekToTime = useCallback((time: number) => {
    setCurrentTime(time);
  }, [setCurrentTime]);

  const setDuration = useCallback((duration: number) => {
    setTimeline(prev => ({ ...prev, duration }));
  }, []);

  const setFps = useCallback((fps: number) => {
    setTimeline(prev => ({ ...prev, fps }));
  }, []);

  const updateElementClipProperties = useCallback((elementId: string, updates: Partial<ClipProperties>) => {
    console.log('Update clip properties:', elementId, updates);
  }, []);

  useEffect(() => {
    if (!timeline.isPlaying) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setTimeline(prev => {
        let newTime = prev.currentTime + deltaTime;

        if (newTime >= prev.duration) {
          if (prev.loop) {
            newTime = 0;
          } else {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            return { ...prev, isPlaying: false, currentTime: prev.duration };
          }
        }

        return { ...prev, currentTime: newTime };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [timeline.isPlaying, timeline.loop, timeline.duration]);

  return {
    timeline,
    currentTime: timeline.currentTime,
    isPlaying: timeline.isPlaying,
    setCurrentTime,
    play,
    pause,
    stop,
    togglePlayPause,
    seekToTime,
    setDuration,
    setFps,
    initializeClipsFromElements,
    updateElementClipProperties
  };
};
