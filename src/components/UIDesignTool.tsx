import React, { useState, useCallback } from 'react';
import ExportUI from '../export/ExportUI';
import LayoutManager from './layout/LayoutManager';
import LayoutModeSwitcher from './layout/LayoutModeSwitcher';
import ShortCutPopUpModal from './design-tool/ShortCutPopUpModal';
import JsonEditorModal from './design-tool/JsonEditorModal';
import ProjectJSONEditor from './design-tool/ProjectJSONEditor';
import LinePropertiesBar from './design-tool/LinePropertiesBar';
import EditorSettingsModal from './design-tool/EditorSettingsModal';
import FlashFXAIComponent from './FlashFX_AI_Component';
import ProjectManager from './project/ProjectManager';
import { TutorialProvider } from '../contexts/TutorialContext';
import { DesignElement } from '../types/design';
import { BackgroundConfig, createDefaultBackground } from '../types/background';
import { ProjectCanvas } from '../types/projectFile';
import { useCanvasHistory, CanvasState } from '../hooks/useCanvasHistory';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLayoutMode } from '../hooks/useLayoutMode';
import { useGlobalKeyboardShortcuts } from '../hooks/useGlobalKeyboardShortcuts';
import { useGridSystem } from '../hooks/useGridSystem';
import { usePreviewAutoBackup } from '../hooks/usePreviewAutoBackup';
import { useAuth } from '../contexts/AuthContext';
import { createGroup, ungroupElements, updateElementInGroup, getAllElementsFlat } from '../utils/groupUtils';
import { CanvasViewport } from '../utils/canvasUtils';
import { PresetService } from '../services/PresetService';
import { supabase } from '../lib/supabase';

interface UIDesignToolProps {
  onBackToMain: () => void;
  editorMode?: boolean;
  projectId?: string | null;
}

const UIDesignTool: React.FC<UIDesignToolProps> = ({ onBackToMain, editorMode = false, projectId = null }) => {
  const { isGuest, user } = useAuth();

  const initialState: CanvasState = {
    elements: [],
    selectedElements: []
  };

  const {
    currentState,
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasHistory(initialState);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonEditorElement, setJsonEditorElement] = useState<DesignElement | null>(null);
  const [showProjectJsonEditor, setShowProjectJsonEditor] = useState(false);
  const [showLineProperties, setShowLineProperties] = useState(false);
  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [background, setBackground] = useState<BackgroundConfig>(createDefaultBackground());
  const [projectLoaded, setProjectLoaded] = useState(false);

  // Load project data when projectId is provided
  React.useEffect(() => {
    const loadProject = async () => {
      if (!projectId || projectLoaded) return;

      try {
        if (isGuest) {
          const stored = localStorage.getItem('flashfx_guest_projects');
          if (stored) {
            const projects = JSON.parse(stored);
            const project = projects.find((p: any) => p.id === projectId);
            if (project) {
              setProjectName(project.name);

              if (project.data?.projectFileLoaded && project.data?.elements) {
                const loadedElements = project.data.elements;
                const loadedCanvas = project.data.canvas;

                if (loadedElements.length > 0) {
                  pushToHistory({ elements: loadedElements, selectedElements: [] });
                }

                if (loadedCanvas) {
                  setZoom(loadedCanvas.zoom || 1);
                  setPan(loadedCanvas.pan || { x: 0, y: 0 });
                  setShowGrid(loadedCanvas.grid?.enabled ?? true);
                  setSnapEnabled(loadedCanvas.grid?.snap ?? true);
                  if (loadedCanvas.background) {
                    setBackground(loadedCanvas.background);
                  }
                }
              } else if (project.data?.backgroundColor) {
                const bgConfig: BackgroundConfig = {
                  enabled: true,
                  layers: [{
                    id: 'layer-1',
                    type: 'solid',
                    angle: 0,
                    colorStops: [{
                      color: project.data.backgroundColor,
                      position: 0
                    }],
                    blendMode: 'normal',
                    opacity: 100
                  }]
                };
                setBackground(bgConfig);
              }
            }
          }
        } else if (user) {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (!error && data) {
            setProjectName(data.name);

            if (data.data?.projectFileLoaded && data.data?.elements) {
              const loadedElements = data.data.elements;
              const loadedCanvas = data.data.canvas;

              if (loadedElements.length > 0) {
                pushToHistory({ elements: loadedElements, selectedElements: [] });
              }

              if (loadedCanvas) {
                setZoom(loadedCanvas.zoom || 1);
                setPan(loadedCanvas.pan || { x: 0, y: 0 });
                setShowGrid(loadedCanvas.grid?.enabled ?? true);
                setSnapEnabled(loadedCanvas.grid?.snap ?? true);
                if (loadedCanvas.background) {
                  setBackground(loadedCanvas.background);
                }
              }
            } else if (data.data?.backgroundColor) {
              const bgConfig: BackgroundConfig = {
                enabled: true,
                layers: [{
                  id: 'layer-1',
                  type: 'solid',
                  angle: 0,
                  colorStops: [{
                    color: data.data.backgroundColor,
                    position: 0
                  }],
                  blendMode: 'normal',
                  opacity: 100
                }]
              };
              setBackground(bgConfig);
            }
          }
        }
        setProjectLoaded(true);
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadProject();
  }, [projectId, isGuest, user, projectLoaded]);

  usePreviewAutoBackup({
    projectId,
    isGuest,
    enabled: true,
    intervalMs: 60000,
    quality: 0.8,
    maxWidth: 1280,
    maxHeight: 720
  });

  // Layout mode state
  const { currentMode, setMode, isTransitioning } = useLayoutMode();

  // Grid system
  const canvasSize = { width: 3840, height: 2160 };
  const {
    gridSettings,
    updateGridSettings,
    toggleGrid,
  } = useGridSystem(canvasSize);

  // Canvas viewport for shape creation
  const viewport: CanvasViewport = {
    width: window.innerWidth * 0.6,
    height: window.innerHeight * 0.6,
    scrollX: pan.x,
    scrollY: pan.y,
    zoom
  };

  const currentCanvas: ProjectCanvas = {
    width: canvasSize.width,
    height: canvasSize.height,
    fps: 30,
    unit: 'px',
    background,
    grid: {
      enabled: showGrid,
      size: gridSettings.gridSize,
      snap: snapEnabled
    },
    zoom,
    pan
  };

  const handleProjectLoaded = useCallback((newElements: DesignElement[], newCanvas: ProjectCanvas) => {
    const newState: CanvasState = {
      elements: newElements,
      selectedElements: []
    };
    pushToHistory(newState);

    setZoom(newCanvas.zoom || 1);
    setPan(newCanvas.pan || { x: 0, y: 0 });
    setShowGrid(newCanvas.grid.enabled);
    setSnapEnabled(newCanvas.grid.snap);

    if (newCanvas.background) {
      setBackground(newCanvas.background);
    }
  }, [pushToHistory]);

  const updateCanvas = useCallback((newElements: DesignElement[], newSelectedElements?: string[]) => {
    const newState: CanvasState = {
      elements: newElements,
      selectedElements: newSelectedElements ?? currentState.selectedElements
    };
    pushToHistory(newState);
  }, [pushToHistory, currentState.selectedElements]);

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    const newElements = updateElementInGroup(currentState.elements, id, updates);
    updateCanvas(newElements);
  }, [currentState.elements, updateCanvas]);

  const addElement = useCallback((element: DesignElement) => {
    const newElements = [...currentState.elements, element];
    updateCanvas(newElements, [element.id]);
  }, [currentState.elements, updateCanvas]);

  const addMultipleElements = useCallback((elements: DesignElement[]) => {
    const newElements = [...currentState.elements, ...elements];
    const newSelectedIds = elements.map(el => el.id);
    updateCanvas(newElements, newSelectedIds);
  }, [currentState.elements, updateCanvas]);

  const deleteElement = useCallback((id: string) => {
    const newElements = currentState.elements.filter(el => el.id !== id);
    const newSelected = currentState.selectedElements.filter(selId => selId !== id);
    updateCanvas(newElements, newSelected);
  }, [currentState.elements, currentState.selectedElements, updateCanvas]);

  const duplicateElement = useCallback((id: string) => {
    const allElements = getAllElementsFlat(currentState.elements);
    const element = allElements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20,
        name: `${element.name} Copy`
      };
      addElement(newElement);
    }
  }, [currentState.elements, addElement]);

  const setSelectedElements = useCallback((selectedIds: string[]) => {
    const newState: CanvasState = {
      elements: currentState.elements,
      selectedElements: selectedIds
    };
    pushToHistory(newState);
  }, [currentState.elements, pushToHistory]);

  // Keyboard shortcut handlers
  const handleDuplicate = useCallback(() => {
    if (currentState.selectedElements.length === 1) {
      duplicateElement(currentState.selectedElements[0]);
    }
  }, [currentState.selectedElements, duplicateElement]);

  const handleGroup = useCallback(() => {
    if (currentState.selectedElements.length >= 2) {
      const newElements = createGroup(currentState.elements, currentState.selectedElements);
      const newGroup = newElements.find(el => el.type === 'group' && !currentState.elements.find(existing => existing.id === el.id));
      updateCanvas(newElements, newGroup ? [newGroup.id] : []);
    }
  }, [currentState.elements, currentState.selectedElements, updateCanvas]);

  const handleUngroup = useCallback(() => {
    if (currentState.selectedElements.length === 1) {
      const selectedElement = currentState.elements.find(el => el.id === currentState.selectedElements[0]);
      if (selectedElement?.type === 'group') {
        const newElements = ungroupElements(currentState.elements, selectedElement.id);
        const childIds = selectedElement.children?.map(child => child.id) || [];
        updateCanvas(newElements, childIds);
      }
    }
  }, [currentState.elements, currentState.selectedElements, updateCanvas]);

  const handleDelete = useCallback(() => {
    if (currentState.selectedElements.length > 0) {
      let newElements = [...currentState.elements];
      currentState.selectedElements.forEach(id => {
        newElements = newElements.filter(el => el.id !== id);
      });
      updateCanvas(newElements, []);
    }
  }, [currentState.elements, currentState.selectedElements, updateCanvas]);

  const handleNudge = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
    if (currentState.selectedElements.length === 0) return;

    let newElements = [...currentState.elements];
    currentState.selectedElements.forEach(id => {
      const elementIndex = newElements.findIndex(el => el.id === id);
      if (elementIndex !== -1) {
        const element = newElements[elementIndex];
        let updates: Partial<DesignElement> = {};

        switch (direction) {
          case 'up':
            updates.y = element.y - amount;
            break;
          case 'down':
            updates.y = element.y + amount;
            break;
          case 'left':
            updates.x = element.x - amount;
            break;
          case 'right':
            updates.x = element.x + amount;
            break;
        }

        newElements = updateElementInGroup(newElements, id, updates);
      }
    });

    updateCanvas(newElements);
  }, [currentState.elements, currentState.selectedElements, updateCanvas]);

  const handleSelectAll = useCallback(() => {
    const allIds = currentState.elements.map(el => el.id);
    setSelectedElements(allIds);
  }, [currentState.elements, setSelectedElements]);

  const handleExport = useCallback(() => {
    setShowExportPanel(true);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedElements([]);
  }, [setSelectedElements]);

  const handleOpenJsonEditor = useCallback((element: DesignElement) => {
    setJsonEditorElement(element);
    setShowJsonEditor(true);
  }, []);

  const handleSaveJsonEdit = useCallback((updatedElement: DesignElement) => {
    updateElement(updatedElement.id, updatedElement);
    setShowJsonEditor(false);
    setJsonEditorElement(null);
  }, [updateElement]);

  const handleOpenLineProperties = useCallback(() => {
    const lineElements = currentState.elements.filter(el => 
      el.type === 'line' && currentState.selectedElements.includes(el.id)
    );
    if (lineElements.length > 0) {
      setShowLineProperties(true);
    }
  }, [currentState.elements, currentState.selectedElements]);
  const handleOpenProjectJsonEditor = useCallback(() => {
    setShowProjectJsonEditor(true);
  }, []);

  const handleApplyProject = useCallback((elements: DesignElement[], selectedElements: string[]) => {
    const newState: CanvasState = {
      elements,
      selectedElements
    };
    pushToHistory(newState);
    setShowProjectJsonEditor(false);
  }, [pushToHistory]);

  const handleShowShortcuts = useCallback(() => {
    setShowShortcutsModal(true);
  }, []);

  const handleOpenEditorSettings = useCallback(() => {
    setShowEditorSettings(true);
  }, []);

  const handleSavePreset = useCallback(async (name: string, description: string, elements: DesignElement[]) => {
    try {
      if (isGuest) {
        const localPresets = PresetService.loadPresetsFromLocalStorage();
        const newPreset = {
          id: `preset-${Date.now()}`,
          user_id: 'guest',
          name,
          description,
          elements,
          element_count: elements.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        PresetService.savePresetsToLocalStorage([...localPresets, newPreset]);
      } else if (user?.id) {
        await PresetService.createPreset(user.id, {
          name,
          description,
          elements,
          element_count: elements.length
        });
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      throw error;
    }
  }, [isGuest, user]);

  const handleSaveProject = useCallback(async () => {
    if (!projectId) return;

    try {
      if (isGuest) {
        const stored = localStorage.getItem('flashfx_guest_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          const updatedProjects = projects.map((p: any) => {
            if (p.id === projectId) {
              return {
                ...p,
                name: projectName,
                data: {
                  ...p.data,
                  projectFileLoaded: true,
                  elements: currentState.elements,
                  selectedElements: currentState.selectedElements,
                  canvas: currentCanvas,
                  background
                },
                updated_at: new Date().toISOString()
              };
            }
            return p;
          });
          localStorage.setItem('flashfx_guest_projects', JSON.stringify(updatedProjects));
        }
      } else if (user) {
        await supabase
          .from('projects')
          .update({
            name: projectName,
            data: {
              projectFileLoaded: true,
              elements: currentState.elements,
              selectedElements: currentState.selectedElements,
              canvas: currentCanvas,
              background
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }, [projectId, isGuest, user, projectName, currentState.elements, currentState.selectedElements, currentCanvas, background]);


  // Enhanced keyboard shortcuts with shortcut modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + Alt + Shift + S
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleShowShortcuts();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleShowShortcuts]);
  
  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts({
    onAddElement: addElement,
    selectedElements: currentState.selectedElements,
    elements: currentState.elements,
    setSelectedElements,
    updateElement,
    duplicateElement: handleDuplicate,
    onGroup: handleGroup,
    onUngroup: handleUngroup,
    canvasSize,
    viewport,
    snapEnabled,
    setSnapEnabled,
    gridEnabled: gridSettings.enabled,
    toggleGrid,
    onNudge: handleNudge
  });
  
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDuplicate: handleDuplicate,
    onGroup: handleGroup,
    onUngroup: handleUngroup,
    onDelete: handleDelete,
    onNudge: handleNudge,
    onSelectAll: handleSelectAll,
    onExport: handleExport,
    onDeselect: handleDeselect,
    canUndo,
    canRedo
  });


  return (
    <TutorialProvider>
      <ProjectManager
        elements={currentState.elements}
        canvas={currentCanvas}
        userId={user?.id || null}
        userName={user?.email || null}
        onProjectLoaded={handleProjectLoaded}
      >
        {({ handleSaveClick, handleLoadClick, currentProjectName }) => (
          <div className="h-full flex flex-col">
          {/* Main Layout Area */}
          <div className="flex-1">
            <LayoutManager
              currentMode={currentMode}
              isTransitioning={isTransitioning}
              elements={currentState.elements}
              selectedElements={currentState.selectedElements}
              setSelectedElements={setSelectedElements}
              updateElement={updateElement}
              deleteElement={deleteElement}
              duplicateElement={duplicateElement}
              onAddElement={addElement}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              snapEnabled={snapEnabled}
              setSnapEnabled={setSnapEnabled}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
          onRedo={redo}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
          onOpenExport={handleExport}
          onOpenJsonEditor={handleOpenJsonEditor}
          onOpenLineProperties={handleOpenLineProperties}
          onOpenProjectJsonEditor={handleOpenProjectJsonEditor}
          onOpenEditorSettings={handleOpenEditorSettings}
          editorMode={editorMode}
          onBackToMain={onBackToMain}
          background={background}
          onUpdateBackground={setBackground}
          onAddMultipleElements={addMultipleElements}
          onSavePreset={handleSavePreset}
          userId={user?.id || null}
          isGuest={isGuest}
          onSaveProject={handleSaveProject}
          onExitToHome={onBackToMain}
          onSaveProjectFile={handleSaveClick}
          onLoadProjectFile={handleLoadClick}
            />
          </div>

          <FlashFXAIComponent 
        onAddElement={addElement}
        onAddMultipleElements={addMultipleElements}
        onUpdateElement={updateElement}
      />
      
      <ExportUI
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        elements={currentState.elements}
        selectedElements={currentState.selectedElements}
        projectName={projectName}
        canvasWidth={3840}
        canvasHeight={2160}
      />
      
      <ShortCutPopUpModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      
      <JsonEditorModal
        isOpen={showJsonEditor}
        onClose={() => {
          setShowJsonEditor(false);
          setJsonEditorElement(null);
        }}
        element={jsonEditorElement}
        onSave={handleSaveJsonEdit}
      />
      
      <ProjectJSONEditor
        isOpen={showProjectJsonEditor}
        onClose={() => setShowProjectJsonEditor(false)}
        onApplyProject={handleApplyProject}
        serializeProject={(elements, selected) => JSON.stringify({
          proj_id: `proj-${Date.now()}`,
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canvas: { width: 3840, height: 2160 },
          elements: {
            byId: Object.fromEntries(elements.map(el => [el.id, el])),
            order: elements.map(el => el.id)
          }
        }, null, 2)}
        deserializeProject={(jsonString) => {
          const parsed = JSON.parse(jsonString);
          const elements = parsed.elements.order.map((id: string) => parsed.elements.byId[id]);
          return { elements, selectedElements: [] };
        }}
        projectElements={currentState.elements}
        selectedElements={currentState.selectedElements}
      />
      
      <LinePropertiesBar
        selectedElements={currentState.elements.filter(el =>
          el.type === 'line' && currentState.selectedElements.includes(el.id)
        )}
        updateElement={updateElement}
        isOpen={showLineProperties}
        onClose={() => setShowLineProperties(false)}
      />

      <EditorSettingsModal
        isOpen={showEditorSettings}
        onClose={() => setShowEditorSettings(false)}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        gridSettings={gridSettings}
        updateGridSettings={updateGridSettings}
        shapeSnapEnabled={snapEnabled}
        onToggleShapeSnap={() => setSnapEnabled(!snapEnabled)}
          />
        </div>
        )}
      </ProjectManager>
    </TutorialProvider>
  );
};

export default UIDesignTool;