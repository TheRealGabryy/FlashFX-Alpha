import { useState, useCallback } from 'react';
import { DesignElement } from '../types/design';

export interface SnapGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
}

export interface SnapResult {
  x?: number;
  y?: number;
  guides: SnapGuide[];
}

const SNAP_THRESHOLD = 8;

export const useSnapping = (
  elements: DesignElement[],
  canvasCenter: { x: number; y: number },
  zoom: number = 1,
  enabled: boolean = true,
  canvasSize?: { width: number; height: number }
) => {
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);

  const getElementBounds = useCallback((element: DesignElement) => {
    return {
      left: element.x,
      right: element.x + element.width,
      top: element.y,
      bottom: element.y + element.height,
      centerX: element.x + element.width / 2,
      centerY: element.y + element.height / 2,
      width: element.width,
      height: element.height
    };
  }, []);

  const detectSnaps = useCallback((
    movingElement: DesignElement,
    newX: number,
    newY: number,
    snapEnabled: boolean = enabled
  ): SnapResult => {
    if (!snapEnabled) {
      return { guides: [] };
    }

    const guides: SnapGuide[] = [];
    let snappedX = newX;
    let snappedY = newY;

    const movingBounds = {
      left: newX,
      right: newX + movingElement.width,
      top: newY,
      bottom: newY + movingElement.height,
      centerX: newX + movingElement.width / 2,
      centerY: newY + movingElement.height / 2,
      width: movingElement.width,
      height: movingElement.height
    };

    // Canvas center snapping
    const threshold = SNAP_THRESHOLD / zoom;

    // Canvas edge snapping if canvas size is provided
    if (canvasSize) {
      // Snap to left edge
      if (Math.abs(movingBounds.left) < threshold) {
        snappedX = 0;
        guides.push({
          id: 'canvas-left',
          type: 'vertical',
          position: 0,
          color: '#FF8C00'
        });
      }
      
      // Snap to right edge
      else if (Math.abs(movingBounds.right - canvasSize.width) < threshold) {
        snappedX = canvasSize.width - movingElement.width;
        guides.push({
          id: 'canvas-right',
          type: 'vertical',
          position: canvasSize.width,
          color: '#FF8C00'
        });
      }
      
      // Snap to top edge
      if (Math.abs(movingBounds.top) < threshold) {
        snappedY = 0;
        guides.push({
          id: 'canvas-top',
          type: 'horizontal',
          position: 0,
          color: '#FF8C00'
        });
      }
      
      // Snap to bottom edge
      else if (Math.abs(movingBounds.bottom - canvasSize.height) < threshold) {
        snappedY = canvasSize.height - movingElement.height;
        guides.push({
          id: 'canvas-bottom',
          type: 'horizontal',
          position: canvasSize.height,
          color: '#FF8C00'
        });
      }
    }
    // Snap to canvas center X
    if (Math.abs(movingBounds.centerX - canvasCenter.x) < threshold) {
      snappedX = canvasCenter.x - movingElement.width / 2;
      guides.push({
        id: 'canvas-center-x',
        type: 'vertical',
        position: canvasCenter.x,
        color: '#FFD700'
      });
    }

    // Snap to canvas center Y
    if (Math.abs(movingBounds.centerY - canvasCenter.y) < threshold) {
      snappedY = canvasCenter.y - movingElement.height / 2;
      guides.push({
        id: 'canvas-center-y',
        type: 'horizontal',
        position: canvasCenter.y,
        color: '#FFD700'
      });
    }

    // Element-to-element snapping
    const otherElements = elements.filter(el => el.id !== movingElement.id && el.visible);
    
    otherElements.forEach((element, index) => {
      const bounds = getElementBounds(element);
      
      // Update moving bounds with current snapped position
      const currentMovingBounds = {
        left: snappedX,
        right: snappedX + movingElement.width,
        top: snappedY,
        bottom: snappedY + movingElement.height,
        centerX: snappedX + movingElement.width / 2,
        centerY: snappedY + movingElement.height / 2
      };

      // Horizontal snapping (Y-axis alignment)
      
      // Top edge to top edge
      if (Math.abs(currentMovingBounds.top - bounds.top) < threshold) {
        snappedY = bounds.top;
        guides.push({
          id: `element-${index}-top`,
          type: 'horizontal',
          position: bounds.top,
          color: '#FF8C00'
        });
      }
      
      // Bottom edge to bottom edge
      else if (Math.abs(currentMovingBounds.bottom - bounds.bottom) < threshold) {
        snappedY = bounds.bottom - movingElement.height;
        guides.push({
          id: `element-${index}-bottom`,
          type: 'horizontal',
          position: bounds.bottom,
          color: '#FF8C00'
        });
      }
      
      // Top edge to bottom edge (stacking)
      else if (Math.abs(currentMovingBounds.top - bounds.bottom) < threshold) {
        snappedY = bounds.bottom;
        guides.push({
          id: `element-${index}-stack-bottom`,
          type: 'horizontal',
          position: bounds.bottom,
          color: '#FF8C00'
        });
      }
      
      // Bottom edge to top edge (stacking)
      else if (Math.abs(currentMovingBounds.bottom - bounds.top) < threshold) {
        snappedY = bounds.top - movingElement.height;
        guides.push({
          id: `element-${index}-stack-top`,
          type: 'horizontal',
          position: bounds.top,
          color: '#FF8C00'
        });
      }
      
      // Center Y alignment
      else if (Math.abs(currentMovingBounds.centerY - bounds.centerY) < threshold) {
        snappedY = bounds.centerY - movingElement.height / 2;
        guides.push({
          id: `element-${index}-center-y`,
          type: 'horizontal',
          position: bounds.centerY,
          color: '#FFD700'
        });
      }

      // Vertical snapping (X-axis alignment)
      
      // Left edge to left edge
      if (Math.abs(currentMovingBounds.left - bounds.left) < threshold) {
        snappedX = bounds.left;
        guides.push({
          id: `element-${index}-left`,
          type: 'vertical',
          position: bounds.left,
          color: '#FF8C00'
        });
      }
      
      // Right edge to right edge
      else if (Math.abs(currentMovingBounds.right - bounds.right) < threshold) {
        snappedX = bounds.right - movingElement.width;
        guides.push({
          id: `element-${index}-right`,
          type: 'vertical',
          position: bounds.right,
          color: '#FF8C00'
        });
      }
      
      // Left edge to right edge (side by side)
      else if (Math.abs(currentMovingBounds.left - bounds.right) < threshold) {
        snappedX = bounds.right;
        guides.push({
          id: `element-${index}-side-right`,
          type: 'vertical',
          position: bounds.right,
          color: '#FF8C00'
        });
      }
      
      // Right edge to left edge (side by side)
      else if (Math.abs(currentMovingBounds.right - bounds.left) < threshold) {
        snappedX = bounds.left - movingElement.width;
        guides.push({
          id: `element-${index}-side-left`,
          type: 'vertical',
          position: bounds.left,
          color: '#FF8C00'
        });
      }
      
      // Center X alignment
      else if (Math.abs(currentMovingBounds.centerX - bounds.centerX) < threshold) {
        snappedX = bounds.centerX - movingElement.width / 2;
        guides.push({
          id: `element-${index}-center-x`,
          type: 'vertical',
          position: bounds.centerX,
          color: '#FFD700'
        });
      }
    });

    return {
      x: snappedX !== newX ? snappedX : undefined,
      y: snappedY !== newY ? snappedY : undefined,
      guides
    };
  }, [elements, canvasCenter, zoom, getElementBounds, enabled]);

  const showGuides = useCallback((guides: SnapGuide[]) => {
    setActiveGuides(guides);
  }, []);

  const hideGuides = useCallback(() => {
    setActiveGuides([]);
  }, []);

  return {
    detectSnaps,
    showGuides,
    hideGuides,
    activeGuides
  };
};