import React from 'react';
import { Copy, Clipboard, Palette, Plus, Trash2, GripVertical } from 'lucide-react';
import { DesignElement } from '../../types/design';
import { useClipboard } from '../../hooks/useClipboard';

interface ShapePropertiesTabProps {
  selectedElements: DesignElement[];
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
}

const ShapePropertiesTab: React.FC<ShapePropertiesTabProps> = ({
  selectedElements,
  updateElement
}) => {
  const { copyStyle, pasteStyle, copyValue, pasteValue, copiedStyle } = useClipboard();

  if (selectedElements.length === 0) return null;

  const selectedElement = selectedElements[0];
  const isMultiSelect = selectedElements.length > 1;
  
  // Ensure shadow property exists with default values
  const safeSelectedElement = {
    ...selectedElement,
    shadow: selectedElement.shadow || { blur: 0, x: 0, y: 0, color: 'transparent' }
  };

  const handleUpdate = (updates: Partial<DesignElement>) => {
    if (isMultiSelect) {
      selectedElements.forEach(element => {
        updateElement(element.id, updates);
      });
    } else {
      updateElement(selectedElement.id, updates);
    }
  };

  const handleCopyStyle = () => {
    copyStyle(selectedElement);
  };

  const handlePasteStyle = () => {
    const updates = pasteStyle(selectedElement);
    if (updates) {
      handleUpdate(updates);
    }
  };

  const handleCopyValue = async (value: number) => {
    await copyValue(value);
  };

  const handlePasteValue = async (property: keyof DesignElement) => {
    const value = await pasteValue();
    if (value !== null) {
      handleUpdate({ [property]: value });
    }
  };

  const handleGradientToggle = () => {
    const isEnabled = !safeSelectedElement.gradientEnabled;
    const updates: Partial<DesignElement> = {
      gradientEnabled: isEnabled
    };
    
    if (isEnabled && !safeSelectedElement.gradientColors) {
      // Initialize default gradient
      updates.gradientColors = [
        { color: safeSelectedElement.fill, position: 0, id: 'gradient-1' },
        { color: '#FFFFFF', position: 100, id: 'gradient-2' }
      ];
      updates.gradientType = 'linear';
      updates.gradientAngle = 45;
    }
    
    handleUpdate(updates);
  };

  const handleGradientColorChange = (colorId: string, newColor: string) => {
    const gradientColors = safeSelectedElement.gradientColors || [];
    const updatedColors = gradientColors.map(gc => 
      gc.id === colorId ? { ...gc, color: newColor } : gc
    );
    handleUpdate({ gradientColors: updatedColors });
  };

  const handleGradientPositionChange = (colorId: string, newPosition: number) => {
    const gradientColors = safeSelectedElement.gradientColors || [];
    const updatedColors = gradientColors.map(gc => 
      gc.id === colorId ? { ...gc, position: newPosition } : gc
    ).sort((a, b) => a.position - b.position);
    handleUpdate({ gradientColors: updatedColors });
  };

  const addGradientColor = () => {
    const gradientColors = safeSelectedElement.gradientColors || [];
    if (gradientColors.length >= 5) return;
    
    const newPosition = gradientColors.length > 0 
      ? Math.max(...gradientColors.map(gc => gc.position)) + 20
      : 50;
    
    const newColor = {
      color: '#3B82F6',
      position: Math.min(100, newPosition),
      id: `gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedColors = [...gradientColors, newColor].sort((a, b) => a.position - b.position);
    handleUpdate({ gradientColors: updatedColors });
  };

  const removeGradientColor = (colorId: string) => {
    const gradientColors = safeSelectedElement.gradientColors || [];
    if (gradientColors.length <= 2) return; // Keep at least 2 colors
    
    const updatedColors = gradientColors.filter(gc => gc.id !== colorId);
    handleUpdate({ gradientColors: updatedColors });
  };
  // Round values for display
  const roundedElement = {
    ...safeSelectedElement,
    x: Math.round(safeSelectedElement.x),
    y: Math.round(safeSelectedElement.y),
    width: Math.round(safeSelectedElement.width),
    height: Math.round(safeSelectedElement.height),
    rotation: Math.round(safeSelectedElement.rotation),
    strokeWidth: Math.round(safeSelectedElement.strokeWidth),
    borderRadius: Math.round(safeSelectedElement.borderRadius),
    shadow: {
      ...safeSelectedElement.shadow,
      blur: Math.round(safeSelectedElement.shadow.blur),
      x: Math.round(safeSelectedElement.shadow.x),
      y: Math.round(safeSelectedElement.shadow.y)
    }
  };

  return (
    <div className="h-full overflow-y-auto p-2 space-y-3 custom-scrollbar">
      {/* Style Copy/Paste */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-cyan-400 rounded-full mr-1.5"></span>
          Style
        </h4>
        
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleCopyStyle}
            className="flex items-center justify-center space-x-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded text-xs text-gray-300 hover:text-yellow-400 transition-all duration-200"
            title="Copy all style properties"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Style</span>
          </button>
          
          <button
            onClick={handlePasteStyle}
            disabled={!copiedStyle}
            className={`flex items-center justify-center space-x-1 px-2 py-1 border rounded text-xs transition-all duration-200 ${
              copiedStyle
                ? 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/50 text-gray-300 hover:text-yellow-400'
                : 'bg-gray-800/50 border-gray-700/50 text-gray-600 cursor-not-allowed'
            }`}
            title="Paste copied style properties"
          >
            <Clipboard className="w-3 h-3" />
            <span>Paste Style</span>
          </button>
        </div>
      </div>

      {/* Position & Size */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-yellow-400 rounded-full mr-1.5"></span>
          Position & Size
        </h4>
        
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">X</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.x)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy X position"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('x')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste X position"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <input
              type="number"
              value={roundedElement.x}
              onChange={(e) => handleUpdate({ x: Math.round(Number(e.target.value)) })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">Y</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.y)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy Y position"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('y')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste Y position"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <input
              type="number"
              value={roundedElement.y}
              onChange={(e) => handleUpdate({ y: Math.round(Number(e.target.value)) })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">Width</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.width)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy width"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('width')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste width"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <input
              type="number"
              value={roundedElement.width}
              onChange={(e) => handleUpdate({ width: Math.round(Number(e.target.value)) })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">Height</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.height)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy height"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('height')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste height"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <input
              type="number"
              value={roundedElement.height}
              onChange={(e) => handleUpdate({ height: Math.round(Number(e.target.value)) })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-orange-400 rounded-full mr-1.5"></span>
          Appearance
        </h4>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Fill Color</label>
          <div className="space-y-1.5">
            {/* Gradient Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <input
                  type="checkbox"
                  checked={safeSelectedElement.gradientEnabled || false}
                  onChange={handleGradientToggle}
                  className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                />
                <label className="text-xs text-gray-400">Gradient Fill</label>
              </div>
              
              {safeSelectedElement.gradientEnabled && (
                <div className="flex items-center space-x-1">
                  <select
                    value={safeSelectedElement.gradientType || 'linear'}
                    onChange={(e) => handleUpdate({ gradientType: e.target.value as 'linear' | 'radial' })}
                    className="px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              )}
            </div>
            
            {!safeSelectedElement.gradientEnabled ? (
              // Standard solid color picker
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={safeSelectedElement.fill}
                  onChange={(e) => handleUpdate({ fill: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-600/50"
                />
                <input
                  type="text"
                  value={safeSelectedElement.fill}
                  onChange={(e) => handleUpdate({ fill: e.target.value })}
                  className="flex-1 px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
                />
              </div>
            ) : (
              // Gradient controls
              <div className="space-y-1.5">
                {/* Gradient Angle (for linear gradients) */}
                {safeSelectedElement.gradientType === 'linear' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-0.5">
                      Angle: {safeSelectedElement.gradientAngle || 45}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={safeSelectedElement.gradientAngle || 45}
                      onChange={(e) => handleUpdate({ gradientAngle: Number(e.target.value) })}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}
                
                {/* Gradient Colors */}
                <div className="space-y-1">
                  {(safeSelectedElement.gradientColors || []).map((gradientColor, index) => (
                    <div key={gradientColor.id} className="flex items-center space-x-1">
                      <div className="flex items-center space-x-1 flex-1">
                        <GripVertical className="w-2.5 h-2.5 text-gray-500 cursor-move" />
                        <input
                          type="color"
                          value={gradientColor.color}
                          onChange={(e) => handleGradientColorChange(gradientColor.id, e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border border-gray-600/50"
                        />
                        <input
                          type="text"
                          value={gradientColor.color}
                          onChange={(e) => handleGradientColorChange(gradientColor.id, e.target.value)}
                          className="flex-1 px-1 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
                          placeholder="#FFFFFF"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradientColor.position}
                          onChange={(e) => handleGradientPositionChange(gradientColor.id, Number(e.target.value))}
                          className="w-8 px-1 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      
                      {(safeSelectedElement.gradientColors || []).length > 2 && (
                        <button
                          onClick={() => removeGradientColor(gradientColor.id)}
                          className="p-0.5 rounded hover:bg-red-600/20 transition-colors"
                          title="Remove color"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Color Button */}
                  {(safeSelectedElement.gradientColors || []).length < 5 && (
                    <button
                      onClick={addGradientColor}
                      className="w-full flex items-center justify-center space-x-1 px-1.5 py-1 bg-gray-700/30 hover:bg-gray-600/30 border border-gray-600/30 border-dashed rounded text-xs text-gray-400 hover:text-gray-300 transition-all duration-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Color</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Stroke Color</label>
          <div className="flex items-center space-x-1.5">
            <input
              type="color"
              value={safeSelectedElement.stroke}
              onChange={(e) => handleUpdate({ stroke: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-gray-600/50"
            />
            <input
              type="text"
              value={safeSelectedElement.stroke}
              onChange={(e) => handleUpdate({ stroke: e.target.value })}
              className="flex-1 px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Stroke Width</label>
          <input
            type="number"
            min="0"
            value={roundedElement.strokeWidth}
            onChange={(e) => handleUpdate({ strokeWidth: Math.round(Number(e.target.value)) })}
            className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Border Radius</label>
          <input
            type="number"
            min="0"
            value={roundedElement.borderRadius}
            onChange={(e) => handleUpdate({ borderRadius: Math.round(Number(e.target.value)) })}
            className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Opacity</label>
          <div className="space-y-0.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={safeSelectedElement.opacity}
              onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-xs text-gray-400 text-center">
              {Math.round(safeSelectedElement.opacity * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Shadow */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-purple-400 rounded-full mr-1.5"></span>
          Shadow
        </h4>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Shadow Blur</label>
          <input
            type="number"
            min="0"
            value={roundedElement.shadow.blur}
            onChange={(e) => handleUpdate({ 
              shadow: { ...safeSelectedElement.shadow, blur: Math.round(Number(e.target.value)) }
            })}
            className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Shadow X</label>
            <input
              type="number"
              value={roundedElement.shadow.x}
              onChange={(e) => handleUpdate({ 
                shadow: { ...safeSelectedElement.shadow, x: Math.round(Number(e.target.value)) }
              })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Shadow Y</label>
            <input
              type="number"
              value={roundedElement.shadow.y}
              onChange={(e) => handleUpdate({ 
                shadow: { ...safeSelectedElement.shadow, y: Math.round(Number(e.target.value)) }
              })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Shadow Color</label>
          <div className="flex items-center space-x-1.5">
            <input
              type="color"
              value={safeSelectedElement.shadow.color}
              onChange={(e) => handleUpdate({ 
                shadow: { ...safeSelectedElement.shadow, color: e.target.value }
              })}
              className="w-6 h-6 rounded cursor-pointer border border-gray-600/50"
            />
            <input
              type="text"
              value={safeSelectedElement.shadow.color}
              onChange={(e) => handleUpdate({ 
                shadow: { ...safeSelectedElement.shadow, color: e.target.value }
              })}
              className="flex-1 px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShapePropertiesTab;