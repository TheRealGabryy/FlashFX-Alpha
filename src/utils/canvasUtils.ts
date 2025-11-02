import { DesignElement } from '../types/design';

export interface CanvasViewport {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  zoom: number;
}

export interface CanvasCenter {
  x: number;
  y: number;
}

/**
 * Calculate the center of the visible canvas viewport
 * Accounts for zoom, pan, and scroll transforms
 */
export const calculateCanvasCenter = (
  canvasSize: { width: number; height: number },
  viewport: CanvasViewport
): CanvasCenter => {
  // Calculate the visible area center considering zoom and pan
  const visibleWidth = viewport.width / viewport.zoom;
  const visibleHeight = viewport.height / viewport.zoom;
  
  // Account for pan offset (negative pan means canvas moved right/down)
  const centerX = (canvasSize.width / 2) - (viewport.scrollX / viewport.zoom);
  const centerY = (canvasSize.height / 2) - (viewport.scrollY / viewport.zoom);
  
  // Clamp to canvas boundaries
  const clampedX = Math.max(0, Math.min(canvasSize.width, centerX));
  const clampedY = Math.max(0, Math.min(canvasSize.height, centerY));
  
  return { x: clampedX, y: clampedY };
};

/**
 * Create a new shape at the center of the visible canvas
 */
export const createShapeAtCenter = (
  type: DesignElement['type'],
  canvasSize: { width: number; height: number },
  viewport: CanvasViewport,
  customProps?: Partial<DesignElement>
): DesignElement => {
  const center = calculateCanvasCenter(canvasSize, viewport);
  
  // Larger default sizes for better visibility
  const defaultWidth = 800;
  const defaultHeight = 500;
  
  // Position shape at center minus half its size
  const x = center.x - (defaultWidth / 2);
  const y = center.y - (defaultHeight / 2);
  
  const baseElement: DesignElement = {
    id: Date.now().toString(),
    type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: defaultWidth,
    height: defaultHeight,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#3B82F6',
    stroke: '#1E40AF',
    strokeWidth: 2,
    borderRadius: type === 'circle' ? 50 : 8,
    shadow: {
      blur: 8,
      color: 'rgba(0, 0, 0, 0.3)',
      x: 0,
      y: 4
    },
    ...customProps
  };

  // Type-specific customizations
  switch (type) {
    case 'circle':
      return {
        ...baseElement,
        width: 600,
        height: 600,
        fill: '#EF4444',
        stroke: '#DC2626',
        borderRadius: 50
      };
      
    case 'text':
      return {
        ...baseElement,
        width: 600,
        height: 120,
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        borderRadius: 0,
        text: 'Hello World',
        fontSize: 48,
        fontWeight: '600',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        textTransform: 'none',
        textAlign: 'left',
        verticalAlign: 'middle',
        textColor: '#FFFFFF',
        shadow: { blur: 0, color: 'rgba(0, 0, 0, 0)', x: 0, y: 0 }
      };
      
    case 'button':
      return {
        ...baseElement,
        width: 300,
        height: 100,
        fill: '#FFD700',
        stroke: '#FFA500',
        borderRadius: 12,
        text: 'Click Me',
        fontSize: 32,
        fontWeight: '600',
        fontFamily: 'Inter',
        textAlign: 'center',
        verticalAlign: 'middle',
        textColor: '#000000',
        shadow: {
          blur: 12,
          color: 'rgba(255, 215, 0, 0.4)',
          x: 0,
          y: 4
        }
      };
      
    case 'chat-bubble':
      return {
        ...baseElement,
        width: 400,
        height: 120,
        fill: '#1F2937',
        stroke: '#374151',
        strokeWidth: 1,
        borderRadius: 18,
        text: 'Hello! How are you?',
        fontSize: 28,
        fontWeight: '400',
        fontFamily: 'Inter',
        textAlign: 'left',
        verticalAlign: 'middle',
        textColor: '#FFFFFF',
        shadow: {
          blur: 8,
          color: 'rgba(0, 0, 0, 0.3)',
          x: 0,
          y: 2
        }
      };
      
    case 'chat-frame':
      return {
        ...baseElement,
        width: 640,
        height: 1136,
        fill: '#000000',
        stroke: '#374151',
        borderRadius: 36,
        shadow: {
          blur: 20,
          color: 'rgba(0, 0, 0, 0.5)',
          x: 0,
          y: 8
        }
      };
      
    case 'line':
      return {
        ...baseElement,
        width: 300,
        height: 2,
        fill: 'transparent',
        stroke: '#FFD700',
        strokeWidth: 4,
        borderRadius: 0,
        cornerRadius: 0,
        pointCornerRadii: [],
        points: [
          { x: 0, y: 0, radius: 0 },
          { x: 300, y: 0, radius: 0 }
        ],
        arrowStart: false,
        arrowEnd: false,
        arrowheadType: 'triangle',
        arrowheadSize: 16,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: [],
        smoothing: 0,
        trimStart: 0,
        trimEnd: 1,
        closePath: false,
        autoScaleArrows: false,
       shadow: { blur: 0, color: 'rgba(0, 0, 0, 0)', x: 0, y: 0 },
       // Apply custom props AFTER base properties to avoid override
       ...customProps
      };
      
    default:
      return { ...baseElement, ...customProps };
  }
};