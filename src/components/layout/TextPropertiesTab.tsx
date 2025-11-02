import React from 'react';
import { Copy, Clipboard } from 'lucide-react';
import { DesignElement } from '../../types/design';
import { useClipboard } from '../../hooks/useClipboard';

interface TextPropertiesTabProps {
  selectedElements: DesignElement[];
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

const TextPropertiesTab: React.FC<TextPropertiesTabProps> = ({
  selectedElements,
  updateElement,
  showAdvanced,
  setShowAdvanced
}) => {
  const { copyValue, pasteValue } = useClipboard();

  if (selectedElements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xs">No text elements selected</p>
        </div>
      </div>
    );
  }

  const selectedElement = selectedElements[0];
  const isMultiSelect = selectedElements.length > 1;

  const handleUpdate = (updates: Partial<DesignElement>) => {
    if (isMultiSelect) {
      selectedElements.forEach(element => {
        updateElement(element.id, updates);
      });
    } else {
      updateElement(selectedElement.id, updates);
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

  // Round values for display
  const roundedElement = {
    ...selectedElement,
    fontSize: selectedElement.fontSize ? Math.round(selectedElement.fontSize) : 16,
    letterSpacing: selectedElement.letterSpacing ? Math.round(selectedElement.letterSpacing) : 0,
    wordSpacing: selectedElement.wordSpacing ? Math.round(selectedElement.wordSpacing) : 0
  };

  return (
    <div className="h-full overflow-y-auto p-2 space-y-3 custom-scrollbar">
      {/* Text Content */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-blue-400 rounded-full mr-1.5"></span>
          Text Content
        </h4>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Text</label>
          <textarea
            value={selectedElement.text || ''}
            onChange={(e) => handleUpdate({ text: e.target.value })}
            className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-green-400 rounded-full mr-1.5"></span>
          Typography
        </h4>
        
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">Font Size</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.fontSize)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy font size"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('fontSize')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste font size"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <input
              type="number"
              min="8"
              value={roundedElement.fontSize}
              onChange={(e) => handleUpdate({ fontSize: Math.round(Number(e.target.value)) })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Font Weight</label>
            <select
              value={selectedElement.fontWeight || '400'}
              onChange={(e) => handleUpdate({ fontWeight: e.target.value })}
              className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            >
              <option value="300">Light</option>
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Font Family</label>
          <select
            value={selectedElement.fontFamily || 'Inter'}
            onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
            className="w-full px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
          >
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Text Color</label>
          <div className="flex items-center space-x-1.5">
            <input
              type="color"
              value={selectedElement.textColor || '#000000'}
              onChange={(e) => handleUpdate({ textColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-gray-600/50"
            />
            <input
              type="text"
              value={selectedElement.textColor || '#000000'}
              onChange={(e) => handleUpdate({ textColor: e.target.value })}
              className="flex-1 px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-gray-300 flex items-center">
          <span className="w-1 h-1 bg-purple-400 rounded-full mr-1.5"></span>
          Alignment
        </h4>
        
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Horizontal</label>
          <div className="grid grid-cols-3 gap-0.5">
            {['left', 'center', 'right'].map((align) => (
              <button
                key={align}
                onClick={() => handleUpdate({ textAlign: align as 'left' | 'center' | 'right' })}
                className={`px-1.5 py-0.5 rounded text-xs transition-all duration-200 ${
                  selectedElement.textAlign === align
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Vertical</label>
          <div className="grid grid-cols-3 gap-0.5">
            {[
              { value: 'top', label: 'Top' },
              { value: 'middle', label: 'Middle' },
              { value: 'bottom', label: 'Bottom' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleUpdate({ verticalAlign: value as any })}
                className={`px-1.5 py-0.5 rounded text-xs transition-all duration-200 ${
                  selectedElement.verticalAlign === value
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-gray-300 flex items-center">
            <span className="w-1 h-1 bg-orange-400 rounded-full mr-1.5"></span>
            Advanced
          </h4>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">Letter Spacing</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.letterSpacing)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy letter spacing"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('letterSpacing')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste letter spacing"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <input
                type="range"
                min="-5"
                max="20"
                step="0.1"
                value={roundedElement.letterSpacing}
                onChange={(e) => handleUpdate({ letterSpacing: Math.round(Number(e.target.value)) })}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="number"
                min="-5"
                max="20"
                step="1"
                value={roundedElement.letterSpacing}
                onChange={(e) => handleUpdate({ letterSpacing: Math.round(Number(e.target.value)) })}
                className="w-10 px-1 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Line Height</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.1"
                value={selectedElement.lineHeight || 1.2}
                onChange={(e) => handleUpdate({ lineHeight: Number(e.target.value) })}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="number"
                min="0.8"
                max="3"
                step="0.1"
                value={selectedElement.lineHeight || 1.2}
                onChange={(e) => handleUpdate({ lineHeight: Number(e.target.value) })}
                className="w-10 px-1 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-gray-400">Word Spacing</label>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handleCopyValue(roundedElement.wordSpacing)}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Copy word spacing"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
                <button
                  onClick={() => handlePasteValue('wordSpacing')}
                  className="p-0.5 hover:bg-gray-600/50 rounded transition-colors"
                  title="Paste word spacing"
                >
                  <Clipboard className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <input
                type="range"
                min="-10"
                max="20"
                step="1"
                value={roundedElement.wordSpacing}
                onChange={(e) => handleUpdate({ wordSpacing: Math.round(Number(e.target.value)) })}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="number"
                min="-10"
                max="20"
                step="1"
                value={roundedElement.wordSpacing}
                onChange={(e) => handleUpdate({ wordSpacing: Math.round(Number(e.target.value)) })}
                className="w-10 px-1 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Text Decoration</label>
            <div className="grid grid-cols-2 gap-0.5">
              {[
                { value: 'none', label: 'None' },
                { value: 'underline', label: 'Underline' },
                { value: 'line-through', label: 'Strike' },
                { value: 'overline', label: 'Overline' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleUpdate({ textDecoration: value as any })}
                  className={`px-1.5 py-0.5 rounded text-xs transition-all duration-200 ${
                    selectedElement.textDecoration === value
                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextPropertiesTab;