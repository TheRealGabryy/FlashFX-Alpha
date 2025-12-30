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
  zoom?: number;
  setZoom?: (zoom: number) => void;
}

export const useGlobalKeyboardShortcuts = ({
  onAddElement,
  selectedElements,
  elements,
  setSelectedElements,
  updateElement,
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
  zoom,
  setZoom,
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

  const createButton = useCallback(() => {
    const element = createShapeAtCenter('button', canvasSize, viewport, {
      name: 'Button',
      fill: '#FFD700',
      stroke: '#FFA500',
      strokeWidth: 2,
      borderRadius: 12,
      text: 'Click Me',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      textColor: '#000000',
      shadow: {
        blur: 12,
        color: 'rgba(255, 215, 0, 0.4)',
        x: 0,
        y: 4
      }
    });
    onAddElement(element);
    setSelectedElements([element.id]);
  }, [onAddElement, canvasSize, viewport, setSelectedElements]);

  const createChatBubble = useCallback(() => {
    const element = createShapeAtCenter('chat-bubble', canvasSize, viewport, {
      name: 'Chat Bubble',
      width: 200,
      height: 60,
      fill: '#1F2937',
      stroke: '#374151',
      strokeWidth: 1,
      borderRadius: 18,
      text: 'Hello! How are you?',
      fontSize: 14,
      textAlign: 'left',
      textColor: '#FFFFFF',
      shadow: {
        blur: 8,
        color: 'rgba(0, 0, 0, 0.3)',
        x: 0,
        y: 2
      }
    });
    onAddElement(element);
    setSelectedElements([element.id]);
  }, [onAddElement, canvasSize, viewport, setSelectedElements]);

  const createChatFrame = useCallback(() => {
    const element = createShapeAtCenter('chat-frame', canvasSize, viewport, {
      name: 'Chat Frame',
      width: 320,
      height: 568,
      fill: '#000000',
      stroke: '#374151',
      strokeWidth: 2,
      borderRadius: 36,
      shadow: {
        blur: 20,
        color: 'rgba(0, 0, 0, 0.5)',
        x: 0,
        y: 8
      }
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
        case 'q':
        case 'w':
        case 'e':
        case 'r':
        case 't':
        case 'y':
        case 'u':
        case 'i':
        case 'g':
        case 'escape':
        case ' ':
        case '+':
        case '=':
        case '-':
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
        case 'q':
          createShape('rectangle');
          return;
        case 'w':
          createShape('circle');
          return;
        case 'e':
          createShape('text');
          return;
        case 'r':
          createButton();
          return;
        case 't':
          createChatBubble();
          return;
        case 'y':
          createChatFrame();
          return;
        case 'u':
          createLine('line');
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
        case '+':
        case '=':
          if (setZoom && zoom) {
            setZoom(Math.min(3, zoom + 0.05));
          }
          return;
        case '-':
          if (setZoom && zoom) {
            setZoom(Math.max(0.25, zoom - 0.05));
          }
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
    createButton,
    createChatBubble,
    createChatFrame,
    handleImageUpload,
    toggleGrid,
    setSelectedElements,
    selectedElements,
    duplicateElement,
    onGroup,
    onUngroup,
    snapEnabled,
    setSnapEnabled,
    onNudge,
    zoom,
    setZoom
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { fileInputRef };
};