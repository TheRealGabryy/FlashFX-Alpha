import React, { useState, useEffect, useRef } from 'react';
import { X, Code, Download, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { DesignElement } from '../../types/design';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: DesignElement | null;
  onSave: (updatedElement: DesignElement) => void;
}

const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  element,
  onSave
}) => {
  const [jsonString, setJsonString] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert internal DesignElement to JSON format
  const convertToJsonFormat = (element: DesignElement) => {
    const jsonElement: any = {
      id: element.id,
      type: element.type,
      name: element.name,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      opacity: element.opacity,
      visible: element.visible,
      locked: element.locked,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      borderRadius: element.borderRadius,
      shadow: {
        blur: element.shadow?.blur || 0,
        offsetX: element.shadow?.x || 0,
        offsetY: element.shadow?.y || 0,
        color: element.shadow?.color || 'rgba(0, 0, 0, 0)'
      }
    };

    // Add text properties if it's a text-based element
    if (element.type === 'text' || element.type === 'button' || element.type === 'chat-bubble') {
      jsonElement.text = element.text || '';
      jsonElement.fontSize = element.fontSize || 16;
      jsonElement.fontWeight = element.fontWeight || '400';
      jsonElement.fontFamily = element.fontFamily || 'Inter';
      jsonElement.textColor = element.textColor || '#000000';
      jsonElement.textAlign = element.textAlign || 'left';
      jsonElement.verticalAlign = element.verticalAlign || 'top';
      jsonElement.letterSpacing = element.letterSpacing || 0;
      jsonElement.lineHeight = element.lineHeight || 1.2;
      jsonElement.wordSpacing = element.wordSpacing || 0;
      jsonElement.textDecoration = element.textDecoration || 'none';
    }

    // Add line properties if it's a line element
    if (element.type === 'line') {
      jsonElement.lineType = element.lineType || 'line';
      jsonElement.points = element.points || [{ x: 0, y: 0 }, { x: element.width, y: 0 }];
      jsonElement.arrowStart = element.arrowStart || false;
      jsonElement.arrowEnd = element.arrowEnd || false;
      jsonElement.arrowheadType = element.arrowheadType || 'triangle';
      jsonElement.arrowheadSize = element.arrowheadSize || 12;
      jsonElement.lineCap = element.lineCap || 'round';
      jsonElement.lineJoin = element.lineJoin || 'round';
      jsonElement.dashArray = element.dashArray || [];
      jsonElement.smoothing = element.smoothing || 0;
      jsonElement.trimStart = element.trimStart || 0;
      jsonElement.trimEnd = element.trimEnd || 1;
    }

    return jsonElement;
  };

  // Convert JSON format back to internal DesignElement
  const convertFromJsonFormat = (jsonElement: any): DesignElement => {
    const element: DesignElement = {
      id: jsonElement.id,
      type: jsonElement.type,
      name: jsonElement.name,
      x: jsonElement.x,
      y: jsonElement.y,
      width: jsonElement.width,
      height: jsonElement.height,
      rotation: jsonElement.rotation,
      opacity: jsonElement.opacity,
      visible: jsonElement.visible,
      locked: jsonElement.locked,
      fill: jsonElement.fill,
      stroke: jsonElement.stroke,
      strokeWidth: jsonElement.strokeWidth,
      borderRadius: jsonElement.borderRadius,
      shadow: {
        blur: jsonElement.shadow?.blur || 0,
        x: jsonElement.shadow?.offsetX || 0,
        y: jsonElement.shadow?.offsetY || 0,
        color: jsonElement.shadow?.color || 'rgba(0, 0, 0, 0)'
      }
    };

    // Add text properties if present
    if (jsonElement.text !== undefined) element.text = jsonElement.text;
    if (jsonElement.fontSize !== undefined) element.fontSize = jsonElement.fontSize;
    if (jsonElement.fontWeight !== undefined) element.fontWeight = jsonElement.fontWeight;
    if (jsonElement.fontFamily !== undefined) element.fontFamily = jsonElement.fontFamily;
    if (jsonElement.textColor !== undefined) element.textColor = jsonElement.textColor;
    if (jsonElement.textAlign !== undefined) element.textAlign = jsonElement.textAlign;
    if (jsonElement.verticalAlign !== undefined) element.verticalAlign = jsonElement.verticalAlign;
    if (jsonElement.letterSpacing !== undefined) element.letterSpacing = jsonElement.letterSpacing;
    if (jsonElement.lineHeight !== undefined) element.lineHeight = jsonElement.lineHeight;
    if (jsonElement.wordSpacing !== undefined) element.wordSpacing = jsonElement.wordSpacing;
    if (jsonElement.textDecoration !== undefined) element.textDecoration = jsonElement.textDecoration;

    // Add line properties if present
    if (jsonElement.lineType !== undefined) element.lineType = jsonElement.lineType;
    if (jsonElement.points !== undefined) element.points = jsonElement.points;
    if (jsonElement.arrowStart !== undefined) element.arrowStart = jsonElement.arrowStart;
    if (jsonElement.arrowEnd !== undefined) element.arrowEnd = jsonElement.arrowEnd;
    if (jsonElement.arrowheadType !== undefined) element.arrowheadType = jsonElement.arrowheadType;
    if (jsonElement.arrowheadSize !== undefined) element.arrowheadSize = jsonElement.arrowheadSize;
    if (jsonElement.lineCap !== undefined) element.lineCap = jsonElement.lineCap;
    if (jsonElement.lineJoin !== undefined) element.lineJoin = jsonElement.lineJoin;
    if (jsonElement.dashArray !== undefined) element.dashArray = jsonElement.dashArray;
    if (jsonElement.smoothing !== undefined) element.smoothing = jsonElement.smoothing;
    if (jsonElement.trimStart !== undefined) element.trimStart = jsonElement.trimStart;
    if (jsonElement.trimEnd !== undefined) element.trimEnd = jsonElement.trimEnd;

    return element;
  };

  // Update JSON string when element changes
  useEffect(() => {
    if (element) {
      const jsonElement = convertToJsonFormat(element);
      const jsonStr = JSON.stringify(jsonElement, null, 2);
      setJsonString(jsonStr);
      setIsValid(true);
      setErrorMessage('');
      setHasChanges(false);
    }
  }, [element]);

  const validateJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Basic validation for required properties
      const requiredProps = ['id', 'type', 'name', 'x', 'y', 'width', 'height'];
      const missingProps = requiredProps.filter(prop => !(prop in parsed));
      
      if (missingProps.length > 0) {
        throw new Error(`Missing required properties: ${missingProps.join(', ')}`);
      }
      
      // Validate shadow structure if present
      if (parsed.shadow && typeof parsed.shadow === 'object') {
        const shadowProps = ['blur', 'offsetX', 'offsetY', 'color'];
        const missingShadowProps = shadowProps.filter(prop => !(prop in parsed.shadow));
        if (missingShadowProps.length > 0) {
          throw new Error(`Missing shadow properties: ${missingShadowProps.join(', ')}`);
        }
      }
      
      setIsValid(true);
      setErrorMessage('');
      return parsed;
    } catch (error) {
      setIsValid(false);
      setErrorMessage(error instanceof Error ? error.message : 'Invalid JSON format');
      return null;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonString(value);
    setHasChanges(true);
    validateJson(value);
  };

  const handleSave = () => {
    const parsed = validateJson(jsonString);
    if (parsed && isValid) {
      const updatedElement = convertFromJsonFormat(parsed);
      onSave(updatedElement);
      setHasChanges(false);
      onClose();
    }
  };

  const handleDownload = () => {
    if (!element) return;
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${element.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            handleJsonChange(content);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (element) {
      const jsonElement = convertToJsonFormat(element);
      const jsonStr = JSON.stringify(jsonElement, null, 2);
      setJsonString(jsonStr);
      setHasChanges(false);
      setIsValid(true);
      setErrorMessage('');
    }
  };

  // Syntax highlighting function
  const highlightJson = (json: string) => {
    return json
      .replace(/("[\w\s]*")(\s*:\s*)/g, '<span style="color: #9333ea;">$1</span>$2') // Keys - purple
      .replace(/:\s*(".*?")/g, ': <span style="color: #166534;">$1</span>') // String values - dark green
      .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: #ea580c;">$1</span>') // Numbers - orange
      .replace(/:\s*(true|false|null)/g, ': <span style="color: #dc2626;">$1</span>') // Booleans/null - red
      .replace(/([{}[\]:,])/g, '<span style="color: #6b7280;">$1</span>'); // Punctuation - gray
  };

  if (!isOpen || !element) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">JSON Editor</h2>
                  <p className="text-sm text-gray-400">
                    Edit element properties as JSON - {element.name} ({element.type})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-hidden min-h-0">
            <div className="h-full flex flex-col space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleImport}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import JSON</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      hasChanges
                        ? 'bg-orange-600 hover:bg-orange-500 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Reset
                  </button>
                </div>

                {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  {isValid ? (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Valid JSON</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Invalid JSON</span>
                    </div>
                  )}
                  
                  {hasChanges && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  )}
                </div>
              </div>

              {/* JSON Editor - Now much taller and resizable */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="relative flex-1 min-h-[500px]">
                  <textarea
                    ref={textareaRef}
                    value={jsonString}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className={`absolute inset-0 w-full h-full p-4 bg-gray-900 border rounded-lg text-sm font-mono text-white resize-y focus:outline-none focus:ring-2 transition-colors ${
                      isValid 
                        ? 'border-gray-600 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="JSON will appear here..."
                    spellCheck={false}
                    style={{
                      minHeight: '500px',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      lineHeight: '1.5',
                      tabSize: 2
                    }}
                  />
                  
                  {/* Syntax highlighting overlay - hidden for now as it's complex with textarea */}
                  {/* We'll keep the textarea approach for better editing experience */}
                </div>
                
                {/* Error message */}
                {!isValid && errorMessage && (
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-400">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <p>Tip: Use proper JSON format. Shadow properties use offsetX/offsetY. Lines include points array and line-specific properties.</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={!isValid || !hasChanges}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isValid && hasChanges
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Apply Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonEditorModal;