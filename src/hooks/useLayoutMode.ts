import { useState, useCallback } from 'react';

export type LayoutMode = 'design' | 'video';

export interface LayoutModeState {
  currentMode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  isTransitioning: boolean;
}

export const useLayoutMode = (): LayoutModeState => {
  const [currentMode, setCurrentMode] = useState<LayoutMode>('design');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setMode = useCallback((mode: LayoutMode) => {
    if (mode === currentMode) return;

    setIsTransitioning(true);
    setCurrentMode(mode);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, [currentMode]);

  return {
    currentMode,
    setMode,
    isTransitioning
  };
};