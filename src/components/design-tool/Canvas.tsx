import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DesignElement } from '../../types/design';
import { BackgroundConfig, generateBackgroundStyle } from '../../types/background';
import EnhancedDesignElementComponent from './EnhancedDesignElementComponent';
import ContextMenu from './ContextMenu';
import SnapGuides from './SnapGuides';
import { useSnapping } from '../../hooks/useSnapping';
import AdvancedGrid from './AdvancedGrid';
import { GridSettings, GridCalculations } from '../../hooks/useGridSystem';
import { findParentGroup } from '../../utils/groupUtils';

interface CanvasProps {
  elements: DesignElement[];
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  zoom: number;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  showGrid: boolean;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  snapEnabled?: boolean;
  gridSettings?: GridSettings;
  gridCalculations?: GridCalculations;
  onGridSnap?: (x: number, y: number) => { x: number; y: number };
  background?: BackgroundConfig;
}

const CANVAS_WIDTH = 3840;
const CANVAS_HEIGHT = 2160;

const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElements,
  setSelectedElements,
  updateElement,
  zoom,
  pan,
  setPan,
  showGrid,
  onDuplicateElement,
  onDeleteElement,
  snapEnabled = true,
  gridSettings,
  gridCalculations,
  onGridSnap,
  background
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string | null;
  } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const canvasCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

  const {
    detectSnaps,
    showGuides,
    hideGuides,
    activeGuides
  } = useSnapping(elements, canvasCenter, zoom);

  // Clamp position to canvas boundaries
  const clampToCanvas = useCallback((x: number, y: number, width: number, height: number) => {
    const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - width, x));
    const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - height, y));
    return { x: clampedX, y: clampedY };
  }, []);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const artboard = artboardRef.current;
    if (!artboard) return { x: 0, y: 0 };

    const rect = artboard.getBoundingClientRect();
    const canvasX = (clientX - rect.left) / zoom;
    const canvasY = (clientY - rect.top) / zoom;
    
    return { x: canvasX, y: canvasY };
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return; // Right click
    
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(e.clientX, e.clientY);

    // Check if clicking inside artboard
    if (canvasX < 0 || canvasX > CANVAS_WIDTH || canvasY < 0 || canvasY > CANVAS_HEIGHT) {
      // Outside artboard - start viewport panning
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedElements([]);
      return;
    }

    // Check if clicking on an element
    const clickedElement = elements.find(element => {
      return canvasX >= element.x && 
             canvasX <= element.x + element.width &&
             canvasY >= element.y && 
             canvasY <= element.y + element.height;
    });

    if (!clickedElement) {
      // Start selection box or pan
      if (e.ctrlKey || e.metaKey) {
        // Start selection box
        setSelectionBox({
          startX: canvasX,
          startY: canvasY,
          endX: canvasX,
          endY: canvasY
        });
      } else {
        // Start panning
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        setSelectedElements([]);
      }
    }
  }, [pan, zoom, elements, setSelectedElements, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectionBox) {
      const canvasX = (e.clientX - (artboardRef.current?.getBoundingClientRect().left || 0)) / zoom;
      const canvasY = (e.clientY - (artboardRef.current?.getBoundingClientRect().top || 0)) / zoom;

      setSelectionBox(prev => prev ? {
        ...prev,
        endX: Math.max(0, Math.min(CANVAS_WIDTH, canvasX)),
        endY: Math.max(0, Math.min(CANVAS_HEIGHT, canvasY))
      } : null);
    } else if (isDragging) {
      // Zoom-adjusted panning
      const newPan = {
        x: (e.clientX - dragStart.x),
        y: (e.clientY - dragStart.y)
      };
      setPan(newPan);
    }
  }, [isDragging, dragStart, setPan, selectionBox, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (selectionBox) {
      // Complete selection box
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      const selectedIds = elements.filter(element => {
        return element.x >= minX && 
               element.x + element.width <= maxX &&
               element.y >= minY && 
               element.y + element.height <= maxY;
      }).map(el => el.id);

      setSelectedElements(selectedIds);
      setSelectionBox(null);
    }

    setIsDragging(false);
  }, [selectionBox, elements, setSelectedElements]);

  const handleContextMenu = useCallback((e: React.MouseEvent, elementId?: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId: elementId || null
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeContextMenu]);

  // Grid lines for the artboard
  const renderLegacyGrid = () => {
    if (gridSettings?.enabled) return null; // Don't render legacy grid if advanced grid is enabled
    
    return renderLegacyGridLines();
  };

  const gridSize = 40;
  const renderLegacyGridLines = () => {
    const gridLines = [];
  
    if (showGrid) {
    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={CANVAS_HEIGHT}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={CANVAS_WIDTH}
          y2={y}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      );
    }
    }
    
    return gridLines;
  };

  // Enhanced element update with grid snapping
  const renderElements = (elementList: DesignElement[], parentOffset = { x: 0, y: 0 }) => {
    return elementList.map((element) => {
      if (element.type === 'group' && element.children) {
        return (
          <div key={element.id}>
            {/* Group container */}
            <EnhancedDesignElementComponent
              element={element}
              isSelected={selectedElements.includes(element.id)}
              isHovered={hoveredElement === element.id}
              onSelect={(ctrlKey) => {
                if (ctrlKey) {
                  if (selectedElements.includes(element.id)) {
                    setSelectedElements(selectedElements.filter(id => id !== element.id));
                  } else {
                    setSelectedElements([...selectedElements, element.id]);
                  }
                } else {
                  setSelectedElements([element.id]);
                }
              }}
              onUpdate={(updates) => {
                // Clamp group position to canvas
                if (updates.x !== undefined || updates.y !== undefined) {
                  // Apply grid snapping if enabled
                  if (onGridSnap && gridSettings?.snapEnabled) {
                    const snapped = onGridSnap(
                      updates.x !== undefined ? updates.x : element.x,
                      updates.y !== undefined ? updates.y : element.y
                    );
                    updates = { ...updates, x: snapped.x, y: snapped.y };
                  }
                  const newX = updates.x !== undefined ? updates.x : element.x;
                  const newY = updates.y !== undefined ? updates.y : element.y;
                  const clamped = clampToCanvas(newX, newY, element.width, element.height);
                  updates = { ...updates, ...clamped };
                }
                updateElement(element.id, updates);
              }}
              onContextMenu={(e) => handleContextMenu(e, element.id)}
              onHover={(isHovered) => setHoveredElement(isHovered ? element.id : null)}
              parentOffset={parentOffset}
              allElements={elements}
              zoom={zoom}
              snapEnabled={snapEnabled}
              canvasSize={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            />
            {/* Group children - with parent group selection */}
            {element.children.map((child) => (
              <EnhancedDesignElementComponent
                key={child.id}
                element={child}
                isSelected={selectedElements.includes(element.id)}
                isHovered={hoveredElement === element.id}
                onSelect={(ctrlKey) => {
                  if (ctrlKey) {
                    if (selectedElements.includes(element.id)) {
                      setSelectedElements(selectedElements.filter(id => id !== element.id));
                    } else {
                      setSelectedElements([...selectedElements, element.id]);
                    }
                  } else {
                    setSelectedElements([element.id]);
                  }
                }}
                onUpdate={(updates) => {
                  if (updates.x !== undefined || updates.y !== undefined) {
                    const deltaX = (updates.x !== undefined ? updates.x : child.x) - child.x;
                    const deltaY = (updates.y !== undefined ? updates.y : child.y) - child.y;

                    const groupUpdates = {
                      x: element.x + deltaX,
                      y: element.y + deltaY
                    };

                    if (onGridSnap && gridSettings?.snapEnabled) {
                      const snapped = onGridSnap(groupUpdates.x, groupUpdates.y);
                      groupUpdates.x = snapped.x;
                      groupUpdates.y = snapped.y;
                    }

                    const clamped = clampToCanvas(groupUpdates.x, groupUpdates.y, element.width, element.height);
                    updateElement(element.id, clamped);
                  } else {
                    updateElement(element.id, updates);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, element.id)}
                onHover={(isHovered) => setHoveredElement(isHovered ? element.id : null)}
                parentOffset={{
                  x: parentOffset.x + element.x,
                  y: parentOffset.y + element.y
                }}
                allElements={elements}
                zoom={zoom}
                snapEnabled={snapEnabled}
                canvasSize={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              />
            ))}
          </div>
        );
      } else {
        return (
          <EnhancedDesignElementComponent
            key={element.id}
            element={element}
            isSelected={selectedElements.includes(element.id)}
            isHovered={hoveredElement === element.id}
            onSelect={(ctrlKey) => {
              if (ctrlKey) {
                if (selectedElements.includes(element.id)) {
                  setSelectedElements(selectedElements.filter(id => id !== element.id));
                } else {
                  setSelectedElements([...selectedElements, element.id]);
                }
              } else {
                setSelectedElements([element.id]);
              }
            }}
            onUpdate={(updates) => {
              // Clamp element position to canvas
              if (updates.x !== undefined || updates.y !== undefined) {
                // Apply grid snapping if enabled
                if (onGridSnap && gridSettings?.snapEnabled) {
                  const snapped = onGridSnap(
                    updates.x !== undefined ? updates.x : element.x,
                    updates.y !== undefined ? updates.y : element.y
                  );
                  updates = { ...updates, x: snapped.x, y: snapped.y };
                }
                const newX = updates.x !== undefined ? updates.x : element.x;
                const newY = updates.y !== undefined ? updates.y : element.y;
                const clamped = clampToCanvas(newX, newY, element.width, element.height);
                updates = { ...updates, ...clamped };
              }
              updateElement(element.id, updates);
            }}
            onContextMenu={(e) => handleContextMenu(e, element.id)}
            onHover={(isHovered) => setHoveredElement(isHovered ? element.id : null)}
            parentOffset={parentOffset}
            allElements={elements}
            zoom={zoom}
            snapEnabled={snapEnabled}
            canvasSize={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          />
        );
      }
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-900">
      <div
        ref={canvasRef}
        className="w-full h-full flex items-center justify-center p-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => handleContextMenu(e)}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          minWidth: `${CANVAS_WIDTH * zoom + 200}px`,
          minHeight: `${CANVAS_HEIGHT * zoom + 200}px`
        }}
      >
        {/* 4K Artboard */}
        <div
          id="canvas-artboard"
          ref={artboardRef}
          className="relative border-2 border-gray-600 shadow-2xl flex-shrink-0"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: !background?.enabled ? '#1F2937' : undefined,
            ...( background?.enabled ? generateBackgroundStyle(background) : {})
          }}
        >
          {/* Grid */}
          {gridSettings && gridCalculations ? (
            <AdvancedGrid
              gridSettings={gridSettings}
              gridCalculations={gridCalculations}
              canvasSize={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            />
          ) : (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            >
              {renderLegacyGrid()}
            </svg>
          )}
          )

          {/* Canvas Center Point */}
          <div 
            className="absolute w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
            style={{
              left: CANVAS_WIDTH / 2,
              top: CANVAS_HEIGHT / 2
            }}
          />

          {/* Canvas Info */}
          <div className="absolute top-4 left-4 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-600/50">
            <div className="text-xs text-gray-300 font-medium">4K Artboard</div>
            <div className="text-xs text-gray-400">{CANVAS_WIDTH} × {CANVAS_HEIGHT}</div>
          </div>

          {/* Elements */}
          {renderElements(elements)}

          {/* Snap Guides */}
          <SnapGuides
            guides={activeGuides}
            canvasSize={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            zoom={1} // Guides are now relative to artboard, not viewport
            pan={{ x: 0, y: 0 }}
          />

          {/* Selection Box */}
          {selectionBox && (
            <div
              className="absolute border-2 border-yellow-400 bg-yellow-400/10 pointer-events-none"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY)
              }}
            />
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={closeContextMenu}
          onDuplicate={onDuplicateElement}
          onDelete={onDeleteElement}
        />
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50">
        <span className="text-sm text-gray-300">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default Canvas;