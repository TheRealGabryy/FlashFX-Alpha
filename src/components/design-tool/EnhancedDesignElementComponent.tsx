import React, { useState, useRef, useCallback } from 'react';
import { DesignElement } from '../../types/design';
import { useSnapping } from '../../hooks/useSnapping';
import EnhancedLineComponent from './EnhancedLineComponent';

interface EnhancedDesignElementComponentProps {
  element: DesignElement;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (ctrlKey: boolean) => void;
  onUpdate: (updates: Partial<DesignElement>) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onHover: (isHovered: boolean) => void;
  parentOffset?: { x: number; y: number };
  allElements?: DesignElement[];
  zoom?: number;
  snapEnabled?: boolean;
  canvasSize?: { width: number; height: number };
  onGridSnap?: (x: number, y: number) => { x: number; y: number };
  onGridSnapSize?: (width: number, height: number) => { width: number; height: number };
}

interface ResizeHandle {
  position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  cursor: string;
  x: number;
  y: number;
}

const EnhancedDesignElementComponent: React.FC<EnhancedDesignElementComponentProps> = ({
  element,
  isSelected,
  isHovered,
  onSelect,
  onUpdate,
  onContextMenu,
  onHover,
  parentOffset = { x: 0, y: 0 },
  allElements = [],
  zoom = 1,
  snapEnabled = true,
  canvasSize = { width: 3840, height: 2160 },
  onGridSnap,
  onGridSnapSize
}) => {
  if (!element.visible) return null;

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({ 
    x: 0, y: 0, width: 0, height: 0, elementX: 0, elementY: 0 
  });
  const elementRef = useRef<HTMLDivElement>(null);
  
  const canvasCenter = { x: canvasSize.width / 2, y: canvasSize.height / 2 };
  const {
    detectSnaps,
    showGuides,
    hideGuides
  } = useSnapping(allElements, canvasCenter, zoom, snapEnabled, canvasSize);

  const absoluteX = parentOffset.x + element.x;
  const absoluteY = parentOffset.y + element.y;

  // Clamp position to canvas boundaries
  const clampToCanvas = useCallback((x: number, y: number, width: number, height: number) => {
    const clampedX = Math.max(0, Math.min(canvasSize.width - width, x));
    const clampedY = Math.max(0, Math.min(canvasSize.height - height, y));
    return { x: clampedX, y: clampedY };
  }, [canvasSize]);

  // Generate resize handles
  const getResizeHandles = useCallback((): ResizeHandle[] => {
    const handleSize = 36; // 3x larger for easier interaction
    const halfHandle = handleSize / 2;

    return [
      { position: 'nw', cursor: 'nw-resize', x: -halfHandle, y: -halfHandle },
      { position: 'ne', cursor: 'ne-resize', x: element.width - halfHandle, y: -halfHandle },
      { position: 'sw', cursor: 'sw-resize', x: -halfHandle, y: element.height - halfHandle },
      { position: 'se', cursor: 'se-resize', x: element.width - halfHandle, y: element.height - halfHandle },
      { position: 'n', cursor: 'n-resize', x: element.width / 2 - halfHandle, y: -halfHandle },
      { position: 's', cursor: 's-resize', x: element.width / 2 - halfHandle, y: element.height - halfHandle },
      { position: 'e', cursor: 'e-resize', x: element.width - halfHandle, y: element.height / 2 - halfHandle },
      { position: 'w', cursor: 'w-resize', x: -halfHandle, y: element.height / 2 - halfHandle }
    ];
  }, [element.width, element.height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (element.locked) return;
    
    e.stopPropagation();
    onSelect(e.ctrlKey || e.metaKey);
    
    // Check for Alt key for duplication
    if (e.altKey) {
      setIsDuplicating(true);
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y
    });
  }, [element.locked, element.x, element.y, onSelect]);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (element.locked) return;
    
    e.stopPropagation();
    setIsResizing(handle.position);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
      elementX: element.x,
      elementY: element.y
    });
  }, [element.locked, element.width, element.height, element.x, element.y]);

  const calculateResize = useCallback((
    deltaX: number, 
    deltaY: number, 
    handle: string, 
    shiftKey: boolean
  ) => {
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.elementX;
    let newY = resizeStart.elementY;

    const aspectRatio = resizeStart.width / resizeStart.height;

    switch (handle) {
      case 'se':
        newWidth = Math.max(10, resizeStart.width + deltaX);
        newHeight = Math.max(10, resizeStart.height + deltaY);
        if (shiftKey) {
          // Maintain aspect ratio
          const widthRatio = newWidth / resizeStart.width;
          const heightRatio = newHeight / resizeStart.height;
          const ratio = Math.max(widthRatio, heightRatio);
          newWidth = resizeStart.width * ratio;
          newHeight = resizeStart.height * ratio;
        }
        break;
      case 'sw':
        newWidth = Math.max(10, resizeStart.width - deltaX);
        newHeight = Math.max(10, resizeStart.height + deltaY);
        newX = resizeStart.elementX + (resizeStart.width - newWidth);
        if (shiftKey) {
          const widthRatio = newWidth / resizeStart.width;
          const heightRatio = newHeight / resizeStart.height;
          const ratio = Math.max(widthRatio, heightRatio);
          newWidth = resizeStart.width * ratio;
          newHeight = resizeStart.height * ratio;
          newX = resizeStart.elementX + (resizeStart.width - newWidth);
        }
        break;
      case 'ne':
        newWidth = Math.max(10, resizeStart.width + deltaX);
        newHeight = Math.max(10, resizeStart.height - deltaY);
        newY = resizeStart.elementY + (resizeStart.height - newHeight);
        if (shiftKey) {
          const widthRatio = newWidth / resizeStart.width;
          const heightRatio = newHeight / resizeStart.height;
          const ratio = Math.max(widthRatio, heightRatio);
          newWidth = resizeStart.width * ratio;
          newHeight = resizeStart.height * ratio;
          newY = resizeStart.elementY + (resizeStart.height - newHeight);
        }
        break;
      case 'nw':
        newWidth = Math.max(10, resizeStart.width - deltaX);
        newHeight = Math.max(10, resizeStart.height - deltaY);
        newX = resizeStart.elementX + (resizeStart.width - newWidth);
        newY = resizeStart.elementY + (resizeStart.height - newHeight);
        if (shiftKey) {
          const widthRatio = newWidth / resizeStart.width;
          const heightRatio = newHeight / resizeStart.height;
          const ratio = Math.max(widthRatio, heightRatio);
          newWidth = resizeStart.width * ratio;
          newHeight = resizeStart.height * ratio;
          newX = resizeStart.elementX + (resizeStart.width - newWidth);
          newY = resizeStart.elementY + (resizeStart.height - newHeight);
        }
        break;
      case 'n':
        newHeight = Math.max(10, resizeStart.height - deltaY);
        newY = resizeStart.elementY + (resizeStart.height - newHeight);
        if (shiftKey) {
          newWidth = newHeight * aspectRatio;
          newX = resizeStart.elementX + (resizeStart.width - newWidth) / 2;
        }
        break;
      case 's':
        newHeight = Math.max(10, resizeStart.height + deltaY);
        if (shiftKey) {
          newWidth = newHeight * aspectRatio;
          newX = resizeStart.elementX + (resizeStart.width - newWidth) / 2;
        }
        break;
      case 'e':
        newWidth = Math.max(10, resizeStart.width + deltaX);
        if (shiftKey) {
          newHeight = newWidth / aspectRatio;
          newY = resizeStart.elementY + (resizeStart.height - newHeight) / 2;
        }
        break;
      case 'w':
        newWidth = Math.max(10, resizeStart.width - deltaX);
        newX = resizeStart.elementX + (resizeStart.width - newWidth);
        if (shiftKey) {
          newHeight = newWidth / aspectRatio;
          newY = resizeStart.elementY + (resizeStart.height - newHeight) / 2;
        }
        break;
    }

    return { newWidth, newHeight, newX, newY };
  }, [resizeStart]);

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - dragStart.x) / zoom;
        const deltaY = (e.clientY - dragStart.y) / zoom;
        
        const rawX = dragStart.elementX + deltaX;
        const rawY = dragStart.elementY + deltaY;
        
        const clamped = clampToCanvas(rawX, rawY, element.width, element.height);
        
        let finalX = clamped.x;
        let finalY = clamped.y;
        if (onGridSnap) {
          const gridSnapped = onGridSnap(clamped.x, clamped.y);
          finalX = gridSnapped.x;
          finalY = gridSnapped.y;
        }
        
        const snapResult = detectSnaps(element, finalX, finalY, snapEnabled);
        if (snapResult.x !== undefined) finalX = snapResult.x;
        if (snapResult.y !== undefined) finalY = snapResult.y;
        
        showGuides(snapResult.guides);
        
        // Handle duplication
        if (isDuplicating) {
          // Create duplicate element
          const duplicateId = `${element.id}-duplicate-${Date.now()}`;
          const duplicateElement: DesignElement = {
            ...element,
            id: duplicateId,
            name: `${element.name} Copy`,
            x: finalX,
            y: finalY,
            startTime: 0,
            endTime: 5
          };
          
          // This would need to be handled by the parent component
          // For now, just update position
          onUpdate({ x: finalX, y: finalY });
          setIsDuplicating(false);
        } else {
          onUpdate({ x: finalX, y: finalY });
        }
      }
      
      if (isResizing) {
        const deltaX = (e.clientX - resizeStart.x) / zoom;
        const deltaY = (e.clientY - resizeStart.y) / zoom;
        
        const { newWidth, newHeight, newX, newY } = calculateResize(
          deltaX, 
          deltaY, 
          isResizing, 
          e.shiftKey
        );
        
        // Apply grid snapping to size if available
        let finalWidth = newWidth;
        let finalHeight = newHeight;
        if (onGridSnapSize) {
          const sizeSnapped = onGridSnapSize(newWidth, newHeight);
          finalWidth = sizeSnapped.width;
          finalHeight = sizeSnapped.height;
        }
        
        // Ensure resized element stays within canvas bounds
        const maxWidth = canvasSize.width - newX;
        const maxHeight = canvasSize.height - newY;
        
        const clampedWidth = Math.min(finalWidth, maxWidth);
        const clampedHeight = Math.min(finalHeight, maxHeight);
        
        onUpdate({ 
          width: clampedWidth, 
          height: clampedHeight,
          x: newX,
          y: newY
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      setIsDuplicating(false);
      hideGuides();
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    isDuplicating,
    dragStart,
    resizeStart,
    onUpdate,
    element,
    detectSnaps,
    showGuides,
    hideGuides,
    snapEnabled,
    zoom,
    canvasSize,
    onGridSnap,
    onGridSnapSize,
    calculateResize,
    clampToCanvas
  ]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: absoluteX,
    top: absoluteY,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    cursor: element.locked ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    pointerEvents: element.locked ? 'none' : 'auto'
  };

  const shadowStyle = element.shadow.blur > 0 ? {
    boxShadow: `${element.shadow.x}px ${element.shadow.y}px ${element.shadow.blur}px ${element.shadow.color}`
  } : {};

  // Generate gradient CSS
  const getGradientStyle = (element: DesignElement) => {
    if (!element.gradientEnabled || !element.gradientColors || element.gradientColors.length < 2) {
      return { backgroundColor: element.fill };
    }
    
    const sortedColors = [...element.gradientColors].sort((a, b) => a.position - b.position);
    const colorStops = sortedColors.map(gc => `${gc.color} ${gc.position}%`).join(', ');
    
    if (element.gradientType === 'radial') {
      return {
        background: `radial-gradient(circle, ${colorStops})`
      };
    } else {
      const angle = element.gradientAngle || 45;
      return {
        background: `linear-gradient(${angle}deg, ${colorStops})`
      };
    }
  };
  const renderElement = () => {
    if (element.type === 'group') {
      return (
        <div
          style={{
            ...baseStyle,
            border: isSelected ? '2px dashed #FFD700' : '2px dashed transparent',
            backgroundColor: 'transparent'
          }}
          onMouseDown={handleMouseDown}
          onContextMenu={onContextMenu}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
        />
      );
    }

    switch (element.type) {
      case 'rectangle':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              ...getGradientStyle(element),
              border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              borderRadius: element.borderRadius,
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          />
        );

      case 'circle':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              ...getGradientStyle(element),
              border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              borderRadius: '50%',
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          />
        );

      case 'text':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              color: element.textColor,
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              fontFamily: element.fontFamily || 'Inter',
              fontStyle: element.fontStyle || 'normal',
              textTransform: element.textTransform || 'none',
              textDecoration: element.textDecoration || 'none',
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              lineHeight: element.lineHeight || 1.2,
              wordSpacing: element.wordSpacing ? `${element.wordSpacing}px` : 'normal',
              textAlign: element.textAlign || 'left',
              display: 'flex',
              alignItems: element.verticalAlign === 'top' ? 'flex-start' : 
                        element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                           element.textAlign === 'right' ? 'flex-end' : 
                           element.textAlign === 'justify' ? 'stretch' : 'flex-start',
              padding: '4px',
              whiteSpace: element.textAlign === 'justify' ? 'normal' : 'pre-wrap',
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          >
            {element.text}
          </div>
        );

      case 'button':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              ...getGradientStyle(element),
              border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              borderRadius: element.borderRadius,
              color: element.textColor,
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              fontFamily: element.fontFamily || 'Inter',
              fontStyle: element.fontStyle || 'normal',
              textTransform: element.textTransform || 'none',
              textDecoration: element.textDecoration || 'none',
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              lineHeight: element.lineHeight || 1.2,
              wordSpacing: element.wordSpacing ? `${element.wordSpacing}px` : 'normal',
              textAlign: element.textAlign || 'center',
              display: 'flex',
              alignItems: element.verticalAlign === 'top' ? 'flex-start' : 
                        element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                           element.textAlign === 'right' ? 'flex-end' : 
                           element.textAlign === 'justify' ? 'stretch' : 'flex-start',
              whiteSpace: element.textAlign === 'justify' ? 'normal' : 'pre-wrap',
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          >
            {element.text}
          </div>
        );

      case 'chat-bubble':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              ...getGradientStyle(element),
              border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              borderRadius: element.borderRadius,
              color: element.textColor,
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              fontFamily: element.fontFamily || 'Inter',
              fontStyle: element.fontStyle || 'normal',
              textTransform: element.textTransform || 'none',
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              lineHeight: element.lineHeight || 1.2,
              wordSpacing: element.wordSpacing ? `${element.wordSpacing}px` : 'normal',
              textDecoration: element.textDecoration || 'none',
              display: 'flex',
              alignItems: element.verticalAlign === 'top' ? 'flex-start' : 
                        element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                           element.textAlign === 'right' ? 'flex-end' : 
                           element.textAlign === 'justify' ? 'stretch' : 'flex-start',
              textAlign: element.textAlign || 'left',
              padding: '12px 16px',
              whiteSpace: element.textAlign === 'justify' ? 'normal' : 'pre-wrap',
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          >
            {element.text}
          </div>
        );

      case 'chat-frame':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              ...getGradientStyle(element),
              border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              borderRadius: element.borderRadius,
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40%',
                height: '20px',
                ...(element.gradientEnabled ? getGradientStyle(element) : { backgroundColor: element.fill }),
                borderRadius: '0 0 12px 12px'
              }}
            />
          </div>
        );
        
      case 'line':
        return (
          <EnhancedLineComponent
            element={element}
            isSelected={isSelected}
            isHovered={isHovered}
            onUpdate={onUpdate}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            absoluteX={absoluteX}
            absoluteY={absoluteY}
            zoom={zoom}
          />
        );

      case 'image':
        return (
          <div
            data-element-id={element.id}
            style={{
              ...baseStyle,
              overflow: 'hidden',
              borderRadius: element.borderRadius || 0,
              ...shadowStyle
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
          >
            {element.imageData && (
              <img
                src={element.imageData}
                alt={element.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  display: 'block',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
                draggable={false}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {renderElement()}
      
      {/* Enhanced selection outline and resize handles */}
      {(isSelected || isHovered) && !element.locked && element.type !== 'group' && element.type !== 'line' && (
        <div
          style={{
            position: 'absolute',
            left: absoluteX - 2,
            top: absoluteY - 2,
            width: element.width + 4,
            height: element.height + 4,
            border: isSelected ? '2px solid #FFD700' : '2px solid rgba(255, 215, 0, 0.5)',
            borderRadius: element.borderRadius + 2,
            pointerEvents: 'none'
          }}
        >
          {/* Enhanced resize handles - only show when selected */}
          {isSelected && getResizeHandles().map((handle) => (
            <div
              key={handle.position}
              style={{
                position: 'absolute',
                left: handle.x,
                top: handle.y,
                width: 36,
                height: 36,
                backgroundColor: '#FFD700',
                border: '3px solid #FFA500',
                borderRadius: '4px',
                cursor: handle.cursor,
                pointerEvents: 'auto',
                opacity: isHovered || isSelected ? 1 : 0.7,
                transition: 'opacity 0.2s ease'
              }}
              onMouseDown={(e) => handleResizeStart(e, handle)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedDesignElementComponent;