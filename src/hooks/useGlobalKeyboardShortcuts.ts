import { useEffect, useCallback, useRef } from 'react';
import { DesignElement } from '../types/design';
import { createShapeAtCenter, CanvasViewport } from '../utils/canvasUtils';

interface GlobalKeyboardShortcutsProps {
  onAddElement: (element: DesignElement) => void;
  selectedElements: string[];
  elements: DesignElement[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  duplicateElement: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
  canvasSize: { width: number; height: number };
  viewport: CanvasViewport;
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  gridEnabled: boolean;
  toggleGrid: () => void;
  onNudge: (direction: 'up' | 'down' | 'left' | 'right', amount: number) => void;
}

export const useGlobalKeyboardShortcuts = ({
  onAddElement,
  selectedElements,
  elements,
  setSelectedElements,
  updateElement,
  deleteElement,
  duplicateElement,
  onGroup,
  onUngroup,
  canvasSize,
  viewport,
  snapEnabled,
  setSnapEnabled,
  gridEnabled,
  toggleGrid,
  onNudge,
}: GlobalKeyboardShortcutsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is typing in an input field
  const isTypingInInput = useCallback(() => {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.getAttribute('role') === 'textbox'
    );
  }, []);

  const createShape = useCallback((type: DesignElement['type']) => {
    const element = createShapeAtCenter(type, canvasSize, viewport);
    onAddElement(element);
    setSelectedElements([element.id]);
  }, [onAddElement, canvasSize, viewport, setSelectedElements]);

  const createLine = useCallback((mode: 'line' | 'arrow') => {
    const element = createShapeAtCenter('line', canvasSize, viewport, {
      lineType: mode,
      points: [
        { x: 0, y: 0 },
        { x: 200, y: 0 }
      ],
      arrowStart: mode === 'arrow',
      arrowEnd: mode === 'arrow',
      arrowheadType: 'triangle',
      arrowheadSize: 12,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: [],
      smoothing: 0
    });
    onAddElement(element);
    setSelectedElements([element.id]);
  }, [onAddElement, canvasSize, viewport, setSelectedElements]);

  const handleImageUpload = useCallback(() => {
    if (!fileInputRef.current) {
      // Create file input dynamically
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // For now, create a placeholder rectangle for image
          // In a full implementation, you'd handle image upload and create an image element
          const imageElement = createShapeAtCenter('rectangle', canvasSize, viewport, {
            name: `Image: ${file.name}`,
            fill: '#E5E7EB',
            stroke: '#9CA3AF',
            strokeWidth: 2
          });
          onAddElement(imageElement);
          setSelectedElements([imageElement.id]);
        }
        document.body.removeChild(input);
      };
      document.body.appendChild(input);
      input.click();
    }
  }, [onAddElement, canvasSize, viewport, setSelectedElements]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input field
    if (isTypingInInput()) return;

    const { key, ctrlKey, metaKey, shiftKey, altKey } = e;
    const isModifierPressed = ctrlKey || metaKey;

    // Prevent default for our custom shortcuts
    const shouldPreventDefault = () => {
      switch (key.toLowerCase()) {
        case 'r':
        case 'o':
        case 'l':
        case 'a':
        case 't':
        case 'i':
        case 'g':
        case 'escape':
        case ' ':
          return !isModifierPressed;
        case ';':
          return isModifierPressed;
        case 'k':
          return isModifierPressed && shiftKey;
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          return true;
        default:
          return false;
      }
    };

    if (shouldPreventDefault()) {
      e.preventDefault();
    }

    // Shape Creation Shortcuts (only when no modifiers are pressed)
    if (!isModifierPressed && !shiftKey && !altKey) {
      switch (key.toLowerCase()) {
        case 'r':
          createShape('rectangle');
          return;
        case 'o':
          createShape('circle');
          return;
        case 'l':
          createLine('line');
          return;
        case 'a':
          createLine('arrow');
          return;
        case 't':
          createShape('text');
          return;
        case 'i':
          handleImageUpload();
          return;
        case 'g':
          toggleGrid();
          return;
        case 'escape':
          setSelectedElements([]);
          return;
        case ' ':
          return;
      }
    }

    // Modifier-based shortcuts
    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 'd':
          if (selectedElements.length > 0) {
            selectedElements.forEach(id => duplicateElement(id));
          }
          return;
        case 'g':
          if (shiftKey) {
            onUngroup();
          } else {
            onGroup();
          }
          return;
        case ';':
          setSnapEnabled(!snapEnabled);
          return;
      }
    }

    // Arrow key nudging
    if (selectedElements.length > 0) {
      const nudgeAmount = shiftKey ? 10 : 1;
      switch (key) {
        case 'ArrowUp':
          onNudge('up', nudgeAmount);
          return;
        case 'ArrowDown':
          onNudge('down', nudgeAmount);
          return;
        case 'ArrowLeft':
          onNudge('left', nudgeAmount);
          return;
        case 'ArrowRight':
          onNudge('right', nudgeAmount);
          return;
      }
    }

  }, [
    isTypingInInput,
    createShape,
    createLine,
    handleImageUpload,
    toggleGrid,
    setSelectedElements,
    selectedElements,
    duplicateElement,
    onGroup,
    onUngroup,
    snapEnabled,
    setSnapEnabled,
    onNudge
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { fileInputRef };
};