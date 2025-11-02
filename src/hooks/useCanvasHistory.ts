import { useState, useCallback, useRef } from 'react';
import { DesignElement } from '../types/design';

export interface CanvasState {
  elements: DesignElement[];
  selectedElements: string[];
}

export const useCanvasHistory = (initialState: CanvasState) => {
  const [currentState, setCurrentState] = useState<CanvasState>(initialState);
  const [undoStack, setUndoStack] = useState<CanvasState[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasState[]>([]);
  const isApplyingHistory = useRef(false);

  const pushToHistory = useCallback((newState: CanvasState) => {
    if (isApplyingHistory.current) return;
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack([]); // Clear redo stack when new action is performed
    setCurrentState(newState);
  }, [currentState]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    isApplyingHistory.current = true;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentState]);
    setCurrentState(previousState);
    isApplyingHistory.current = false;
  }, [undoStack, currentState]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    isApplyingHistory.current = true;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentState]);
    setCurrentState(nextState);
    isApplyingHistory.current = false;
  }, [redoStack, currentState]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return {
    currentState,
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    setCurrentState
  };
};