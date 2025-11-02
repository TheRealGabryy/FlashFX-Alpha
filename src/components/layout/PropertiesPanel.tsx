import React from 'react';
import { Settings, Type, ChevronDown, Play, Minus, Image, ChevronRight } from 'lucide-react';
import { DesignElement } from '../../types/design';
import { BackgroundConfig } from '../../types/background';
import ShapePropertiesTab from './ShapePropertiesTab';
import TextPropertiesTab from './TextPropertiesTab';
import LinePropertiesTab from './LinePropertiesTab';
import ImagePropertiesTab from './ImagePropertiesTab';
import BackgroundSettingsPanel from './BackgroundSettingsPanel';

interface PropertiesPanelProps {
  selectedElements: DesignElement[];
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  currentTime?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  background?: BackgroundConfig;
  onUpdateBackground?: (background: BackgroundConfig) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  updateElement,
  currentTime = 0,
  isCollapsed = false,
  onToggleCollapse,
  background,
  onUpdateBackground
}) => {
  const [activeTab, setActiveTab] = React.useState<'shape' | 'text' | 'line' | 'image' | 'animations'>('shape');
  const [showTextSettings, setShowTextSettings] = React.useState(false);
  
  const hasTextElements = selectedElements.some(el => 
    el.type === 'text' || el.type === 'button' || el.type === 'chat-bubble'
  );
  
  const hasLineElements = selectedElements.some(el =>
    el.type === 'line'
  );

  const hasImageElements = selectedElements.some(el =>
    el.type === 'image'
  );

  // Auto-switch to image tab if only image elements are selected
  React.useEffect(() => {
    if (selectedElements.length > 0 && selectedElements.every(el => el.type === 'image')) {
      setActiveTab('image');
    } else if (selectedElements.length > 0 && selectedElements.every(el => el.type === 'line')) {
      setActiveTab('line');
    } else if (selectedElements.length > 0 && selectedElements.some(el => el.type === 'text' || el.type === 'button' || el.type === 'chat-bubble')) {
      setActiveTab('text');
    } else if (selectedElements.length > 0) {
      setActiveTab('shape');
    }
  }, [selectedElements]);

  if (isCollapsed) {
    return (
      <div className="h-full bg-gray-800/50 backdrop-blur-xl flex flex-col items-center py-4 border-l border-gray-700/50">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200"
          title="Expand Properties Panel"
        >
          <Settings className="w-5 h-5 text-gray-300" />
        </button>
      </div>
    );
  }

  if (selectedElements.length === 0) {
    if (background && onUpdateBackground) {
      return <BackgroundSettingsPanel background={background} onUpdate={onUpdateBackground} />;
    }

    return (
      <div className="h-full flex flex-col">
        <div className="p-2 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white">Properties</h3>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
                title="Collapse Panel"
              >
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-700/50 flex items-center justify-center">
              <span className="text-sm">🎨</span>
            </div>
            <h3 className="text-xs font-medium text-gray-400 mb-1">No Selection</h3>
            <p className="text-xs text-gray-500">Select an element</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure all selected elements have shadow property with default values
  const elementsWithDefaults = selectedElements.map(element => ({
    ...element,
    shadow: element.shadow || { blur: 0, x: 0, y: 0, color: 'transparent' }
  }));

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* Header with Tabs */}
      <div className="p-2 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white">Properties</h3>
          <div className="flex items-center space-x-2">
            {selectedElements.length > 1 && (
              <div className="text-xs text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded text-xs">
                {selectedElements.length} selected
              </div>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-0.5 rounded hover:bg-gray-600/50 transition-colors"
                title="Collapse Panel"
              >
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-0.5 bg-gray-700/30 rounded p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('shape')}
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'shape'
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/30'
            }`}
          >
            <Settings className="w-2.5 h-2.5" />
            <span>Shape</span>
          </button>
          
          <button
            onClick={() => setActiveTab('text')}
            disabled={!hasTextElements}
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'text' && hasTextElements
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : hasTextElements
                ? 'text-gray-400 hover:text-white hover:bg-gray-600/30'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Type className="w-2.5 h-2.5" />
            <span>Text</span>
          </button>
          
          <button
            onClick={() => setActiveTab('line')}
            disabled={!hasLineElements}
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'line' && hasLineElements
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : hasLineElements
                ? 'text-gray-400 hover:text-white hover:bg-gray-600/30'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Minus className="w-2.5 h-2.5" />
            <span>Line</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            disabled={!hasImageElements}
            className={`flex-1 flex items-center justify-center space-x-1 px-1.5 py-1 rounded font-medium transition-all duration-200 ${
              activeTab === 'image' && hasImageElements
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : hasImageElements
                ? 'text-gray-400 hover:text-white hover:bg-gray-600/30'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Image className="w-2.5 h-2.5" />
            <span>Image</span>
          </button>
        </div>

        {/* Show Text Settings Button */}
        {hasTextElements && (
          <button
            onClick={() => setShowTextSettings(!showTextSettings)}
            className={`w-full mt-1.5 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
              showTextSettings
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <Type className="w-2.5 h-2.5" />
              <span>Text Settings</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showTextSettings ? 'rotate-180' : ''}`} />
            </div>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-w-0">
        {activeTab === 'shape' ? (
          <ShapePropertiesTab
            selectedElements={elementsWithDefaults}
            updateElement={updateElement}
          />
        ) : activeTab === 'text' ? (
          <TextPropertiesTab
            selectedElements={elementsWithDefaults.filter(el => 
              el.type === 'text' || el.type === 'button' || el.type === 'chat-bubble'
            )}
            updateElement={updateElement}
            showAdvanced={showTextSettings}
            setShowAdvanced={setShowTextSettings}
          />
        ) : activeTab === 'line' ? (
          <LinePropertiesTab
            selectedElements={elementsWithDefaults.filter(el =>
              el.type === 'line'
            )}
            updateElement={updateElement}
          />
        ) : activeTab === 'image' ? (
          <ImagePropertiesTab
            selectedElements={elementsWithDefaults.filter(el =>
              el.type === 'image'
            )}
            updateElement={updateElement}
          />
        ) : null}
      </div>
    </div>
  );
};

export default PropertiesPanel;