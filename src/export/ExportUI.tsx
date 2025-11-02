import React, { useState, useEffect } from 'react';
import { Download, Package, Image as ImageIcon, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ExportManager, ExportConfig, ExportProgress, ExportMode } from './ExportManager';
import { DesignElement } from '../types/design';

interface ExportUIProps {
  isOpen: boolean;
  onClose: () => void;
  elements: DesignElement[];
  selectedElements: string[];
  projectName: string;
  canvasWidth: number;
  canvasHeight: number;
}

const ExportUI: React.FC<ExportUIProps> = ({
  isOpen,
  onClose,
  elements,
  selectedElements,
  projectName,
  canvasWidth,
  canvasHeight
}) => {
  const [exportManager] = useState(() => new ExportManager());
  const [progress, setProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    message: ''
  });

  const [exportMode, setExportMode] = useState<ExportMode | null>(null);
  const [customResolution, setCustomResolution] = useState({
    width: canvasWidth,
    height: canvasHeight
  });
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');

  useEffect(() => {
    exportManager.setProgressCallback(setProgress);
  }, [exportManager]);

  const visibleElements = elements.filter(el => el.visible);
  const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));

  const handleExport = async (mode: ExportMode) => {
    setExportMode(mode);

    const config: ExportConfig = {
      mode,
      projectName: projectName || 'FlashFX_Project',
      canvasWidth,
      canvasHeight,
      customWidth: customResolution.width,
      customHeight: customResolution.height,
      format,
      quality: 0.95
    };

    try {
      if (mode === 'canvas') {
        await exportManager.exportCanvas(config, elements);
      } else if (mode === 'zip') {
        await exportManager.exportShapesAsZip(config, elements);
      } else if (mode === 'selection') {
        await exportManager.exportSelection(config, selectedElementsData, elements);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleClose = () => {
    if (progress.status !== 'exporting') {
      setProgress({
        current: 0,
        total: 0,
        status: 'idle',
        message: ''
      });
      setExportMode(null);
      onClose();
    }
  };

  const handleRetry = () => {
    if (exportMode) {
      handleExport(exportMode);
    }
  };

  const estimatedTime = exportManager.estimateTime(
    exportMode === 'zip' ? visibleElements.length :
    exportMode === 'selection' ? selectedElementsData.length : 1
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500">
                <Download className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Export Design</h2>
                <p className="text-sm text-gray-400">Choose export format for your design</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={progress.status === 'exporting'}
              className={`p-2 rounded-lg transition-colors ${
                progress.status === 'exporting'
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {progress.status === 'idle' && (
            <>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="png">PNG (Transparent)</option>
                      <option value="jpeg">JPEG</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Resolution
                    </label>
                    <select
                      onChange={(e) => {
                        const [w, h] = e.target.value.split('x').map(Number);
                        setCustomResolution({ width: w, height: h });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value={`${canvasWidth}x${canvasHeight}`}>
                        Canvas ({canvasWidth}×{canvasHeight})
                      </option>
                      <option value="1920x1080">Full HD (1920×1080)</option>
                      <option value="3840x2160">4K (3840×2160)</option>
                      <option value="7680x4320">8K (7680×4320)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Custom Width
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="16000"
                      value={customResolution.width}
                      onChange={(e) => setCustomResolution(prev => ({ ...prev, width: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Custom Height
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="16000"
                      value={customResolution.height}
                      onChange={(e) => setCustomResolution(prev => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleExport('canvas')}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    <ImageIcon className="w-6 h-6" />
                    <div className="text-left">
                      <div>Export Entire Canvas</div>
                      <div className="text-xs opacity-80">
                        Single image with all visible elements
                      </div>
                    </div>
                  </div>
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleExport('zip')}
                  disabled={visibleElements.length === 0}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-semibold transition-all duration-200 ${
                    visibleElements.length > 0
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400 transform hover:scale-[1.02]'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6" />
                    <div className="text-left">
                      <div>Export ZIP for Animation</div>
                      <div className="text-xs opacity-80">
                        {visibleElements.length} shapes as separate PNGs
                      </div>
                    </div>
                  </div>
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleExport('selection')}
                  disabled={selectedElementsData.length === 0}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-semibold transition-all duration-200 ${
                    selectedElementsData.length > 0
                      ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600 hover:border-gray-500 transform hover:scale-[1.02]'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ImageIcon className="w-6 h-6" />
                    <div className="text-left">
                      <div>Export Selection</div>
                      <div className="text-xs opacity-80">
                        {selectedElementsData.length === 0
                          ? 'No elements selected'
                          : `${selectedElementsData.length} selected element${selectedElementsData.length > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400 leading-relaxed">
                  <strong>Export Info:</strong> ZIP exports include transparent PNGs positioned exactly as they appear on canvas.
                  Canvas export captures everything visible. All exports use 2x pixel ratio for high quality.
                </p>
              </div>
            </>
          )}

          {progress.status === 'exporting' && (
            <div className="py-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {progress.message}
                  </h3>
                  <p className="text-gray-400">
                    {progress.current}/{progress.total} shapes exported
                  </p>
                </div>

                <div className="w-full max-w-md">
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                      style={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Estimated time: ~{estimatedTime}s
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  Please wait while your export is being prepared...
                </p>
              </div>
            </div>
          )}

          {progress.status === 'completed' && (
            <div className="py-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    Export Successful!
                  </h3>
                  <p className="text-gray-400">
                    {progress.message}
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {progress.status === 'error' && (
            <div className="py-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-red-500/20">
                  <AlertCircle className="w-16 h-16 text-red-400" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    Export Failed
                  </h3>
                  <p className="text-gray-400">
                    {progress.message}
                  </p>
                  {progress.error && (
                    <p className="text-sm text-red-400 font-mono bg-red-500/10 px-4 py-2 rounded-lg">
                      {progress.error}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-200"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportUI;
