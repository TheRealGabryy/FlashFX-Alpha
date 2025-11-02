import React, { useState, useCallback, useEffect } from 'react';
import HorizontalShapesBar from './HorizontalShapesBar';
import LayersPanel from '../design-tool/LayersPanel';
import Canvas from '../design-tool/Canvas';
import PropertiesPanel from './PropertiesPanel';
import ResizeHandle from './ResizeHandle';
import { useResizablePanels } from '../../hooks/useResizablePanels';
import { DesignElement } from '../../types/design';
import { useGridSystem } from '../../hooks/useGridSystem';
import { CanvasViewport } from '../../utils/canvasUtils';
import GridSettingsPanel from '../design-tool/GridSettingsPanel';

interface LayoutComposerProps {
  // Canvas state
  elements: DesignElement[];
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  onAddElement: (element: DesignElement) => void;
  
  // Canvas controls
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  
  // Group operations
  onGroup: () => void;
  onUngroup: () => void;
  
  // Export
  onOpenExport: () => void;
  
  // Editor mode
  editorMode?: boolean;
  onBackToMain?: () => void;
}

const LayoutComposer: React.FC<LayoutComposerProps> = ({
  elements,
  selectedElements,
  setSelectedElements,
  updateElement,
  deleteElement,
  duplicateElement,
  onAddElement,
  zoom,
  setZoom,
  pan,
  setPan,
  showGrid,
  setShowGrid,
  snapEnabled,
  setSnapEnabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGroup,
  onUngroup,
  onOpenExport,
  editorMode = false,
  onBackToMain
}) => {
  const [showLayers, setShowLayers] = useState(true);
  const [showGridSettings, setShowGridSettings] = useState(false);
  
  const { 
    panelSizes, 
    resizeHandlers, 
    isResizing, 
    canvasWidth,
    timelineHeight,
    propertiesTimelineWidth
  } = useResizablePanels();

  // Grid system
  const canvasSize = { width: 3840, height: 2160 };
  const {
    gridSettings,
    gridCalculations,
    updateGridSettings,
    toggleGrid,
    toggleSnap
  } = useGridSystem(canvasSize);

  // Canvas viewport for shape creation
  const viewport: CanvasViewport = {
    width: window.innerWidth * (canvasWidth / 100),
    height: window.innerHeight * (panelSizes.canvasHeight / 100),
    scrollX: pan.x,
    scrollY: pan.y,
    zoom
  };

  // Calculate initial zoom to fit canvas properly
  const calculateInitialZoom = useCallback(() => {
    const layersWidth = showLayers ? (window.innerWidth * panelSizes.layersWidth / 100) : 0;
    const propertiesWidth = window.innerWidth * panelSizes.propertiesWidth / 100;
    const padding = 40;

    // Canvas height is dynamic based on panel sizes
    const canvasHeight = window.innerHeight * (panelSizes.canvasHeight / 100);
    const availableWidth = window.innerWidth - layersWidth - propertiesWidth - padding;

    const canvasWidth = 3840;
    const canvasHeightActual = 2160;

    const zoomX = availableWidth / canvasWidth;
    const zoomY = canvasHeight / canvasHeightActual;

    return Math.min(zoomX, zoomY, 1) * 0.8; // 80% of max fit for padding
  }, [showLayers, panelSizes]);

  // Initialize zoom on mount and layout changes
  useEffect(() => {
    const initialZoom = calculateInitialZoom();
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [calculateInitialZoom, setZoom, setPan]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newZoom = calculateInitialZoom();
      setZoom(newZoom);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateInitialZoom, setZoom]);

  const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));

  return (
    <div className={`${editorMode ? 'h-screen' : 'h-[calc(100vh-80px)]'} bg-gray-900 flex flex-col overflow-hidden relative`}>
      {/* Top Section: Layers + Canvas + Properties */}
      <div className="flex flex-1 min-h-0">
        {/* Layers Panel */}
        {showLayers && (
          <div className="w-1/4 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 flex-shrink-0">
            <LayersPanel
              elements={elements}
              selectedElements={selectedElements}
              setSelectedElements={setSelectedElements}
              updateElement={updateElement}
              deleteElement={deleteElement}
              duplicateElement={duplicateElement}
              onGroup={onGroup}
              onUngroup={onUngroup}
            />
          </div>
        )}

        {/* Canvas Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Shapes Bar */}
          <HorizontalShapesBar 
            onAddElement={onAddElement}
            canvasSize={canvasSize}
            viewport={viewport}
            zoom={zoom}
            setZoom={setZoom}
            onOpenGridSettings={() => setShowGridSettings(true)}
            gridEnabled={gridSettings.enabled}
            snapEnabled={gridSettings.snapEnabled}
            onToggleGrid={toggleGrid}
            onToggleSnap={toggleSnap}
            currentMode="animate"
            onModeChange={() => {}}
            isTransitioning={false}
          />

          {/* Canvas */}
          <div className="flex-1 bg-gray-900 relative overflow-hidden">
            <Canvas
              elements={elements}
              selectedElements={selectedElements}
              setSelectedElements={setSelectedElements}
              updateElement={updateElement}
              zoom={zoom}
              pan={pan}
              setPan={setPan}
              showGrid={!gridSettings.enabled && showGrid}
              onDuplicateElement={duplicateElement}
              onDeleteElement={deleteElement}
              snapEnabled={snapEnabled}
              gridSettings={gridSettings}
              gridCalculations={gridCalculations}
              onGridSnap={gridCalculations.snapToGrid}
            />
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-1/4 bg-gray-800/50 backdrop-blur-xl border-l border-gray-700/50 flex-shrink-0">
          <PropertiesPanel
            selectedElements={selectedElementsData}
            updateElement={updateElement}
            currentTime={0}
          />
        </div>
      </div>

      {/* Grid Settings Panel */}
      <GridSettingsPanel
        isOpen={showGridSettings}
        onClose={() => setShowGridSettings(false)}
        gridSettings={gridSettings}
        updateGridSettings={updateGridSettings}
        shapeSnapEnabled={snapEnabled}
        onToggleShapeSnap={() => setSnapEnabled(!snapEnabled)}
      />
    </div>
  );
};

export default LayoutComposer;