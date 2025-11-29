import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Unlock, Copy, Trash2, Download, Group, Ungroup, Search, Code, Layers, Bot, Palette, Save, LogOut } from 'lucide-react';
import { DesignElement } from '../../types/design';
import AIChatTab from './AIChatTab';
import PresetsTab from './PresetsTab';
import SavePresetModal from '../modals/SavePresetModal';

interface LayersPanelProps {
  elements: DesignElement[];
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onOpenJsonEditor: (element: DesignElement) => void;
  onOpenProjectJsonEditor: () => void;
  onOpenLineProperties: () => void;
  onAddElement?: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;
  onUpdateElement?: (id: string, updates: Partial<DesignElement>) => void;
  onApplyProject?: (elements: DesignElement[], selectedElements: string[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSavePreset?: (name: string, description: string, elements: DesignElement[]) => Promise<void>;
  userId?: string | null;
  isGuest?: boolean;
  onSaveProject?: () => Promise<void>;
  onExitToHome?: () => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElements,
  setSelectedElements,
  updateElement,
  deleteElement,
  duplicateElement,
  onGroup,
  onUngroup,
  onOpenJsonEditor,
  onOpenLineProperties,
  onOpenProjectJsonEditor,
  onAddElement,
  onAddMultipleElements,
  onUpdateElement,
  onApplyProject,
  isCollapsed = false,
  onToggleCollapse,
  onSavePreset,
  userId = null,
  isGuest = false,
  onSaveProject,
  onExitToHome
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'layers' | 'ai' | 'presets' | 'json'>('layers');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [autosaveCountdown, setAutosaveCountdown] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  const handleNameEdit = (id: string, currentName: string) => {
    setEditingName(id);
    setEditingValue(currentName);
  };

  const handleNameSubmit = (id: string) => {
    if (editingValue.trim()) {
      updateElement(id, { name: editingValue.trim() });
    }
    setEditingName(null);
    setEditingValue('');
  };

  const handleElementClick = (id: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      // Multi-select with Ctrl+Click
      if (selectedElements.includes(id)) {
        setSelectedElements(selectedElements.filter(selId => selId !== id));
      } else {
        setSelectedElements([...selectedElements, id]);
      }
    } else {
      setSelectedElements([id]);
    }
  };

  const handleSaveAsPreset = () => {
    if (selectedElements.length === 0) return;

    const selectedGroup = elements.find(el => el.id === selectedElements[0] && el.type === 'group');
    if (!selectedGroup) {
      alert('Please select a group to save as preset');
      return;
    }

    setShowSavePresetModal(true);
  };

  const handlePresetSave = async (name: string, description: string) => {
    const selectedGroup = elements.find(el => el.id === selectedElements[0] && el.type === 'group');
    if (!selectedGroup || !onSavePreset) return;

    const presetElements = selectedGroup.children || [];
    await onSavePreset(name, description, presetElements);
  };

  const handleManualSave = async () => {
    if (isSaving || !onSaveProject) return;
    setIsSaving(true);
    try {
      await onSaveProject();
      setAutosaveCountdown(60);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExit = () => {
    if (!onExitToHome) return;

    const shouldSave = confirm('Do you want to save your changes before exiting?');
    if (shouldSave && onSaveProject) {
      onSaveProject().then(() => {
        onExitToHome();
      }).catch((error) => {
        console.error('Error saving before exit:', error);
        const forceExit = confirm('Failed to save. Exit anyway?');
        if (forceExit) {
          onExitToHome();
        }
      });
    } else {
      onExitToHome();
    }
  };

  // Autosave countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setAutosaveCountdown((prev) => {
        if (prev <= 1) {
          // Trigger autosave
          if (onSaveProject && !isSaving) {
            onSaveProject().catch(console.error);
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSaveProject, isSaving]);


  const renderElement = (element: DesignElement, depth = 0) => {
    const isSelected = selectedElements.includes(element.id);
    const hasChildren = element.type === 'group' && element.children && element.children.length > 0;
    
    if (searchTerm && !element.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    return (
      <div key={element.id}>
        <div
          className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
            isSelected
              ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
              : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
          }`}
          style={{ marginLeft: depth * 16 }}
          onClick={(e) => handleElementClick(element.id, e.ctrlKey)}
        >
          <div className="flex items-center justify-between mb-1.5">
            {editingName === element.id ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleNameSubmit(element.id)}
                onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit(element.id)}
                className="bg-gray-600 text-white px-1.5 py-0.5 rounded text-xs flex-1 mr-1.5"
                autoFocus
              />
            ) : (
              <div className="flex items-center flex-1">
                {hasChildren && (
                  <Group className="w-3 h-3 mr-1.5 text-yellow-400" />
                )}
                <span
                  className="font-medium truncate flex-1 text-xs"
                  onDoubleClick={() => handleNameEdit(element.id, element.name)}
                >
                  {element.name}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { visible: !element.visible });
                }}
                className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
              >
                {element.visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-500" />
                )}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { locked: !element.locked });
                }}
                className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
              >
                {element.locked ? (
                  <Lock className="w-3 h-3 text-yellow-400" />
                ) : (
                  <Unlock className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 capitalize">
              {element.type.replace('-', ' ')}
              {hasChildren && ` (${element.children!.length} items)`}
            </span>
            
            <div className="flex items-center space-x-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (element.type === 'line') {
                    onOpenLineProperties();
                  } else {
                    onOpenJsonEditor(element);
                  }
                }}
                className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
                title={element.type === 'line' ? 'Open Line Properties' : 'Edit JSON'}
              >
                <Code className="w-2.5 h-2.5" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateElement(element.id);
                }}
                className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
                title="Duplicate"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element.id);
                }}
                className="p-0.5 rounded hover:bg-red-600/50 transition-colors text-red-400"
                title="Delete"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Render children for groups */}
        {hasChildren && element.children!.map(child => 
          renderElement(child, depth + 1)
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="h-full bg-gray-800/50 backdrop-blur-xl flex flex-col items-center py-4 border-r border-gray-700/50">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 mb-2"
          title="Expand Layers Panel"
        >
          <Layers className="w-5 h-5 text-gray-300" />
        </button>
        <button
          onClick={() => {
            onToggleCollapse?.();
            setActiveTab('ai');
          }}
          className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200"
          title="Open AI Assistant"
        >
          <Bot className="w-5 h-5 text-blue-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800/50 backdrop-blur-xl flex flex-col overflow-hidden min-h-0" data-tutorial-target="layers-panel">
      {/* Tab Navigation */}
      <div className="p-2 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualSave}
              disabled={isSaving || !onSaveProject}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                isSaving
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
              }`}
              title="Save Project"
            >
              <Save className="w-3 h-3" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              onClick={handleExit}
              disabled={!onExitToHome}
              className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 transition-all duration-200"
              title="Exit to Home"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-gray-500">Autosave:</span>
            <span className="font-mono text-yellow-400 font-semibold">{autosaveCountdown}s</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 bg-gray-700/30 rounded p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'layers'
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/30'
            }`}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>Layers</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            data-tutorial-target="ai-tab"
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-violet-400 border border-violet-400/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/30'
            }`}
          >
            <Bot className="w-2.5 h-2.5" />
            <span>AI</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            data-tutorial-target="presets-tab"
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'presets'
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/30'
            }`}
          >
            <Palette className="w-2.5 h-2.5" />
            <span>Presets</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'layers' && (
          <div className="h-full flex flex-col layers-panel">
            <div className="p-2 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">Layers</h3>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={onOpenProjectJsonEditor}
                    disabled={!onOpenProjectJsonEditor}
                    className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
                    title="Open Project JSON Editor (Ctrl+E)"
                    aria-label="Open project JSON editor"
                  >
                    <Code className="w-3 h-3 text-gray-400 hover:text-yellow-400" />
                  </button>
                  {onToggleCollapse && (
                    <button
                      onClick={onToggleCollapse}
                      className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
                      title="Collapse Panel"
                    >
                      <Layers className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search layers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/50"
                />
              </div>

              {/* Group/Ungroup Actions */}
              <div className="flex items-center space-x-1 mb-2">
                <button
                  onClick={onGroup}
                  disabled={selectedElements.length < 2}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-all duration-200 ${
                    selectedElements.length >= 2
                      ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
                      : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  }`}
                  title="Group Selected (Ctrl+G)"
                >
                  <Group className="w-3 h-3 mx-auto" />
                </button>

                <button
                  onClick={onUngroup}
                  disabled={selectedElements.length !== 1 || !elements.find(el => el.id === selectedElements[0] && el.type === 'group')}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-all duration-200 ${
                    selectedElements.length === 1 && elements.find(el => el.id === selectedElements[0] && el.type === 'group')
                      ? 'bg-orange-400/20 text-orange-400 hover:bg-orange-400/30'
                      : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  }`}
                  title="Ungroup Selected (Ctrl+Shift+G)"
                >
                  <Ungroup className="w-3 h-3 mx-auto" />
                </button>

                <button
                  onClick={handleSaveAsPreset}
                  disabled={selectedElements.length !== 1 || !elements.find(el => el.id === selectedElements[0] && el.type === 'group')}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-all duration-200 ${
                    selectedElements.length === 1 && elements.find(el => el.id === selectedElements[0] && el.type === 'group')
                      ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 text-blue-400 hover:from-blue-400/30 hover:to-purple-400/30'
                      : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  }`}
                  title="Save as Preset"
                >
                  <Save className="w-3 h-3 mx-auto" />
                </button>
              </div>
              
              <div className="text-xs text-gray-400">
                {elements.length} element{elements.length !== 1 ? 's' : ''}
                {selectedElements.length > 0 && ` • ${selectedElements.length} selected`}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="overflow-x-auto min-w-0">
                {elements.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">
                    No elements yet. Add shapes or UI components to get started.
                  </div>
                ) : (
                  <div className="p-1.5 space-y-1 min-w-[200px]">
                    {elements.map((element) => renderElement(element))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && onAddElement && (
          <AIChatTab
            onAddElement={onAddElement}
            onAddMultipleElements={onAddMultipleElements}
            onUpdateElement={onUpdateElement}
          />
        )}

        {activeTab === 'presets' && onAddMultipleElements && (
          <PresetsTab
            userId={userId}
            isGuest={isGuest}
            onAddPreset={onAddMultipleElements}
          />
        )}
      </div>

      <SavePresetModal
        isOpen={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
        onSave={handlePresetSave}
        elementCount={
          selectedElements.length === 1
            ? (elements.find(el => el.id === selectedElements[0])?.children?.length || 0)
            : 0
        }
      />
    </div>
  );
};

export default LayersPanel;