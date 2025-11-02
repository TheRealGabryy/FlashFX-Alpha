import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Code, Download, Upload, Save, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { DesignElement } from '../../types/design';
import { useProjectValidation } from '../../hooks/useProjectValidation';

interface ProjectJSONEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProject: (elements: DesignElement[], selectedElements: string[]) => void;
  serializeProject: (elements: DesignElement[], selectedElements: string[]) => string;
  deserializeProject: (jsonString: string) => { elements: DesignElement[]; selectedElements: string[] };
  projectElements: DesignElement[];
  selectedElements: string[];
}

const ProjectJSONEditor: React.FC<ProjectJSONEditorProps> = ({
  isOpen,
  onClose,
  onApplyProject,
  serializeProject,
  deserializeProject,
  projectElements,
  selectedElements
}) => {
  const [jsonString, setJsonString] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'applying' | 'success' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { validateProject, lastValidationErrors } = useProjectValidation();

  // Initialize JSON content when opening
  useEffect(() => {
    if (isOpen) {
      const serialized = serializeProject(projectElements, selectedElements);
      setJsonString(serialized);
      setIsValid(true);
      setErrorMessage('');
      setHasChanges(false);
    }
  }, [isOpen, projectElements, selectedElements, serializeProject]);

  const validateJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Basic validation for required project properties
      const requiredProps = ['proj_id', 'schemaVersion', 'createdAt', 'updatedAt', 'canvas', 'elements'];
      const missingProps = requiredProps.filter(prop => !(prop in parsed));
      
      if (missingProps.length > 0) {
        throw new Error(`Missing required properties: ${missingProps.join(', ')}`);
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

  const handleSave = async () => {
    const parsed = validateJson(jsonString);
    if (parsed && isValid) {
      try {
        setApplyStatus('applying');
        
        // Validate with full project validation
        const validationResult = validateProject(jsonString);
        if (!validationResult.success) {
          setApplyStatus('error');
          setErrorMessage(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed');
          return;
        }
        
        const { elements, selectedElements: newSelected } = deserializeProject(jsonString);
        onApplyProject(elements, newSelected);
        
        setHasChanges(false);
        setApplyStatus('success');
        
        setTimeout(() => {
          setApplyStatus('idle');
          onClose();
        }, 1500);
      } catch (error) {
        setApplyStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to apply project');
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.flashfx.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.flashfx.json';
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
    if (projectElements) {
      const serialized = serializeProject(projectElements, selectedElements);
      setJsonString(serialized);
      setHasChanges(false);
      setIsValid(true);
      setErrorMessage('');
      setApplyStatus('idle');
    }
  };

  if (!isOpen) return null;

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
                  <h2 className="text-xl font-bold text-white">Project JSON Editor</h2>
                  <p className="text-sm text-gray-400">
                    Edit the complete project structure - {projectElements.length} elements
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
                  {applyStatus === 'success' ? (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Applied</span>
                    </div>
                  ) : applyStatus === 'error' ? (
                    <div className="flex items-center space-x-1 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Error</span>
                    </div>
                  ) : isValid ? (
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

              {/* Large JSON Editor - MUCH TALLER */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="relative flex-1" style={{ minHeight: '600px' }}>
                  <textarea
                    ref={textareaRef}
                    value={jsonString}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className={`absolute inset-0 w-full h-full p-4 bg-gray-900 border rounded-lg text-sm font-mono text-white resize-none focus:outline-none focus:ring-2 transition-colors ${
                      isValid 
                        ? 'border-gray-600 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="Project JSON will appear here..."
                    spellCheck={false}
                    style={{
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      lineHeight: '1.5',
                      tabSize: 2
                    }}
                  />
                </div>
                
                {/* Error message */}
                {(!isValid && errorMessage) || lastValidationErrors.length > 0 && (
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex-shrink-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400 font-medium">
                        {errorMessage || 'Validation Errors'}
                      </span>
                    </div>
                    {lastValidationErrors.length > 0 && (
                      <div className="space-y-1">
                        {lastValidationErrors.slice(0, 3).map((error, index) => (
                          <div key={index} className="text-xs text-red-300">
                            <span className="font-medium">{error.path}:</span> {error.message}
                          </div>
                        ))}
                        {lastValidationErrors.length > 3 && (
                          <div className="text-xs text-red-400">
                            ...and {lastValidationErrors.length - 3} more errors
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <p>Tip: Edit the complete project structure including all elements, canvas settings, and metadata.</p>
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
                  disabled={!isValid || !hasChanges || applyStatus === 'applying'}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isValid && hasChanges && applyStatus !== 'applying'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Apply Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectJSONEditor;