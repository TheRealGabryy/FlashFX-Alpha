import React, { useState, useCallback, useEffect } from 'react';
import HorizontalShapesBar from '../HorizontalShapesBar';
import LayersPanel from '../../design-tool/LayersPanel';
import Canvas from '../../design-tool/Canvas';
import PropertiesPanel from '../PropertiesPanel';
import LayoutBar from '../LayoutBar';
import { DesignElement } from '../../../types/design';
import { BackgroundConfig } from '../../../types/background';
import { useGridSystem } from '../../../hooks/useGridSystem';
import { useLayoutMode } from '../../../hooks/useLayoutMode';
import { CanvasViewport } from '../../../utils/canvasUtils';
import GridSettingsPanel from '../../design-tool/GridSettingsPanel';
import GeneralTimeline from '../../timeline/GeneralTimeline';
import AnimationTimeline from '../../timeline/AnimationTimeline';
import ResizableSplitter from '../../timeline/ResizableSplitter';
import TutorialOverlay from '../../tutorial/TutorialOverlay';
import { useTutorial } from '../../../contexts/TutorialContext';

interface DesignModeLayoutProps {
  // Canvas state
  elements: DesignElement[];
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  onAddElement: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;
  
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
  
  // JSON Editor
  onOpenJsonEditor: (element: DesignElement) => void;
  
  // Line Properties
  onOpenLineProperties: () => void;
  
  // Project JSON Editor
  onOpenProjectJsonEditor: () => void;
  
  // Export
  onOpenExport: () => void;

  // Editor Settings
  onOpenEditorSettings?: () => void;

  // Editor mode
  editorMode?: boolean;
  onBackToMain?: () => void;

  // Background
  background?: BackgroundConfig;
  onUpdateBackground?: (background: BackgroundConfig) => void;

  // Presets
  onSavePreset?: (name: string, description: string, elements: DesignElement[]) => Promise<void>;
  userId?: string | null;
  isGuest?: boolean;

  // Project Save/Exit
  onSaveProject?: () => Promise<void>;
  onExitToHome?: () => void;

  // Project File Management
  onSaveProjectFile?: () => void;
  onLoadProjectFile?: () => void;
}

const DesignModeLayout: React.FC<DesignModeLayoutProps> = ({
  elements,
  selectedElements,
  setSelectedElements,
  updateElement,
  deleteElement,
  duplicateElement,
  onAddElement,
  onAddMultipleElements,
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
  onOpenJsonEditor,
  onOpenLineProperties,
  onOpenProjectJsonEditor,
  onOpenExport,
  onOpenEditorSettings,
  editorMode = false,
  onBackToMain,
  background,
  onUpdateBackground,
  onSavePreset,
  userId,
  isGuest = false,
  onSaveProject,
  onExitToHome,
  onSaveProjectFile,
  onLoadProjectFile
}) => {
  const { startTutorial } = useTutorial();
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [isLayersPanelCollapsed, setIsLayersPanelCollapsed] = useState(false);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(10);
  const [fps] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const [leftColumnWidth, setLeftColumnWidth] = useState(25);
  const [rightColumnWidth, setRightColumnWidth] = useState(25);
  const [topRowHeight, setTopRowHeight] = useState(60);

  // Layout mode state
  const { currentMode, setMode, isTransitioning } = useLayoutMode();

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
    width: window.innerWidth * 0.5, // 50% for canvas
    height: window.innerHeight,
    scrollX: pan.x,
    scrollY: pan.y,
    zoom
  };

  // Calculate initial zoom to fit canvas properly
  const calculateInitialZoom = useCallback(() => {
    const layersWidth = window.innerWidth * 0.25; // 25%
    const propertiesWidth = window.innerWidth * 0.25; // 25%
    const padding = 40;

    const availableWidth = window.innerWidth - layersWidth - propertiesWidth - padding;
    const availableHeight = window.innerHeight - 100; // Account for shapes bar

    const canvasWidth = 3840;
    const canvasHeightActual = 2160;

    const zoomX = availableWidth / canvasWidth;
    const zoomY = availableHeight / canvasHeightActual;

    return Math.min(zoomX, zoomY, 1) * 0.8; // 80% of max fit for padding
  }, []);

  // Initialize zoom on mount
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

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleClipSelect = useCallback((clipId: string) => {
    setSelectedClipId(clipId);
  }, []);

  const centerColumnWidth = 100 - leftColumnWidth - rightColumnWidth;
  const bottomRowHeight = 100 - topRowHeight;

  // Determine grid layout based on current mode
  const gridLayout = currentMode === 'design'
    ? {
        gridTemplateColumns: `${leftColumnWidth}% ${centerColumnWidth}% ${rightColumnWidth}%`,
        gridTemplateRows: '100%', // Single row for design mode
      }
    : {
        gridTemplateColumns: `${leftColumnWidth}% ${centerColumnWidth}% ${rightColumnWidth}%`,
        gridTemplateRows: `${topRowHeight}% ${bottomRowHeight}%`, // Two rows for edit mode
      };

  return (
    <div className={`${editorMode ? 'h-screen' : 'h-[calc(100vh-80px)]'} bg-gray-900 overflow-hidden editor-cursor-default`}>
      <div className={`h-full transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`} style={{
        display: 'grid',
        ...gridLayout
      }}>
        {/* Top Row - Three Columns */}
        {/* Layers Panel (Left Column) */}
        <div className="bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 overflow-hidden">
          <LayersPanel
            elements={elements}
            selectedElements={selectedElements}
            setSelectedElements={setSelectedElements}
            updateElement={updateElement}
            deleteElement={deleteElement}
            duplicateElement={duplicateElement}
            onGroup={onGroup}
            onUngroup={onUngroup}
            onOpenJsonEditor={onOpenJsonEditor}
            onOpenLineProperties={onOpenLineProperties}
            onOpenProjectJsonEditor={onOpenProjectJsonEditor}
            onAddElement={onAddElement}
            onAddMultipleElements={onAddMultipleElements}
            onUpdateElement={updateElement}
            isCollapsed={isLayersPanelCollapsed}
            onToggleCollapse={() => setIsLayersPanelCollapsed(!isLayersPanelCollapsed)}
            onSavePreset={onSavePreset}
            userId={userId}
            isGuest={isGuest}
            onSaveProject={onSaveProject}
            onExitToHome={onExitToHome}
          />
        </div>

        {/* Center Column (Canvas + Red Bar) */}
        <div className="flex flex-col overflow-hidden">
          {/* Red Toolbar Bar - Preserved exactly as is */}
          <div className="flex-shrink-0">
            <HorizontalShapesBar
              onAddElement={onAddElement}
              onAddMultipleElements={onAddMultipleElements}
              canvasSize={canvasSize}
              viewport={viewport}
              zoom={zoom}
              setZoom={setZoom}
              onOpenGridSettings={() => setShowGridSettings(true)}
              onOpenEditorSettings={onOpenEditorSettings}
              onOpenExport={onOpenExport}
              gridEnabled={gridSettings.enabled}
              snapEnabled={gridSettings.snapEnabled}
              onToggleGrid={toggleGrid}
              onToggleSnap={toggleSnap}
              currentMode="design"
              onModeChange={() => {}}
              isTransitioning={false}
            />
          </div>

          {/* Canvas Area + Layout Bar Container */}
          <div className="flex-1 flex flex-col bg-gray-900 relative overflow-hidden">
            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
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
                background={background}
              />
            </div>

            {/* Layout Bar - Fixed at bottom of preview panel */}
            <div className="flex-shrink-0">
              <LayoutBar
                currentMode={currentMode}
                onModeChange={setMode}
                isTransitioning={isTransitioning}
                onSaveProject={onSaveProjectFile}
                onLoadProject={onLoadProjectFile}
                onStartTutorial={startTutorial}
              />
            </div>
          </div>
        </div>

        {/* Properties Panel (Right Column) */}
        <div className="bg-gray-800/50 backdrop-blur-xl border-l border-gray-700/50 overflow-hidden">
          <PropertiesPanel
            selectedElements={selectedElementsData}
            updateElement={updateElement}
            currentTime={currentTime}
            isCollapsed={isPropertiesPanelCollapsed}
            onToggleCollapse={() => setIsPropertiesPanelCollapsed(!isPropertiesPanelCollapsed)}
            background={background}
            onUpdateBackground={onUpdateBackground}
          />
        </div>

        {/* Bottom Row - Two Timelines (50% / 50%) spanning full width - Only visible in Edit mode */}
        {currentMode === 'edit' && (
          <div style={{ gridColumn: '1 / 4' }} className="overflow-hidden">
            <div className="h-full" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* General Timeline (Left 50%) */}
              <div className="overflow-hidden">
                <GeneralTimeline
                  elements={elements}
                  currentTime={currentTime}
                  duration={duration}
                  fps={fps}
                  onSeek={handleSeek}
                  onClipSelect={handleClipSelect}
                />
              </div>
              {/* Animation Timeline (Right 50%) */}
              <div className="overflow-hidden">
                <AnimationTimeline
                  currentTime={currentTime}
                  duration={duration}
                  fps={fps}
                  onSeek={handleSeek}
                  selectedClipId={selectedClipId}
                />
              </div>
            </div>
          </div>
        )}
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

      {/* Tutorial Overlay */}
      <TutorialOverlay />
    </div>
  );
};

export default DesignModeLayout;