import React, { useRef, useState } from 'react';
import { Square, Circle, Type, MessageCircle, Smartphone, Grid2x2 as Grid, Settings, ZoomIn, ZoomOut, Minus, ArrowRight, PenTool, Plus, Download } from 'lucide-react';
import { DesignElement } from '../../types/design';
import { createShapeAtCenter, CanvasViewport } from '../../utils/canvasUtils';
import LayoutModeSwitcher from './LayoutModeSwitcher';
import { LayoutMode } from '../../hooks/useLayoutMode';
import ImageImportMenu from '../image/ImageImportMenu';
import GoogleImageSearchModal from '../image/GoogleImageSearchModal';
import DalleGenerateModal from '../image/DalleGenerateModal';
import { getDefaultImageFilters } from '../../utils/imageFilters';

interface HorizontalShapesBarProps {
  onAddElement: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;
  canvasSize: { width: number; height: number };
  viewport: CanvasViewport;
  zoom: number;
  setZoom: (zoom: number) => void;
  onOpenGridSettings: () => void;
  onOpenEditorSettings?: () => void;
  onOpenExport?: () => void;
  gridEnabled: boolean;
  snapEnabled: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  // Layout mode props
  currentMode?: LayoutMode;
  onModeChange?: (mode: LayoutMode) => void;
  isTransitioning?: boolean;
}

const HorizontalShapesBar: React.FC<HorizontalShapesBarProps> = ({
  onAddElement,
  onAddMultipleElements,
  canvasSize,
  viewport,
  zoom,
  setZoom,
  onOpenGridSettings,
  onOpenEditorSettings,
  onOpenExport,
  gridEnabled,
  snapEnabled,
  onToggleGrid,
  onToggleSnap,
  currentMode,
  onModeChange,
  isTransitioning
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);
  const [showDalleGenerate, setShowDalleGenerate] = useState(false);
  const createShape = (type: DesignElement['type']) => {
    const element = createShapeAtCenter(type, canvasSize, viewport);
    onAddElement(element);
  };

  const createLine = (mode: 'line' | 'arrow' | 'pen') => {
    const element = createShapeAtCenter('line' as DesignElement['type'], canvasSize, viewport, {
      lineType: mode,
      points: mode === 'pen' ? [] : [
        { x: 0, y: 0 },
        { x: 200, y: 0 }
      ],
      arrowStart: mode === 'arrow',
      arrowEnd: mode === 'arrow',
      arrowheadType: 'triangle',
      arrowheadSize: 12,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: [],
      smoothing: 0
    });
    onAddElement(element);
  };
  const tools = [
    { icon: Square, label: 'Rectangle', action: () => createShape('rectangle') },
    { icon: Circle, label: 'Circle', action: () => createShape('circle') },
    { icon: Type, label: 'Text', action: () => createShape('text') },
    { icon: MessageCircle, label: 'Button', action: () => createShape('button') },
    { icon: MessageCircle, label: 'Chat Bubble', action: () => createShape('chat-bubble') },
    { icon: Smartphone, label: 'Chat Frame', action: () => createShape('chat-frame') }
  ];

  const lineTools = [
    { mode: 'line' as const, icon: Minus, label: 'Line', description: 'Draw straight lines' },
    { mode: 'arrow' as const, icon: ArrowRight, label: 'Arrow', description: 'Draw lines with arrowheads' },
    { mode: 'pen' as const, icon: PenTool, label: 'Pen Tool', description: 'Draw polylines and curves' }
  ];

  const handleMenuToggle = () => {
    setShowImageMenu(!showImageMenu);
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleSearchImage = () => {
    setShowGoogleSearch(true);
  };

  const handleGenerateAI = () => {
    setShowDalleGenerate(true);
  };

  const handleImportFromUrl = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = base64;
        });

        const maxImageSize = 400;
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;

        if (width > maxImageSize || height > maxImageSize) {
          if (width > height) {
            width = maxImageSize;
            height = width / aspectRatio;
          } else {
            height = maxImageSize;
            width = height * aspectRatio;
          }
        }

        const x = canvasSize.width / 2 - width / 2;
        const y = canvasSize.height / 2 - height / 2;

        const element: DesignElement = {
          id: `${Date.now()}`,
          type: 'image',
          name: 'Imported Image',
          x,
          y,
          width,
          height,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          borderRadius: 0,
          shadow: {
            blur: 0,
            color: 'transparent',
            x: 0,
            y: 0
          },
          imageData: base64,
          originalWidth: img.width,
          originalHeight: img.height,
          aspectRatioLocked: true,
          blendMode: 'normal',
          filters: getDefaultImageFilters()
        };

        onAddElement(element);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Failed to import image from URL:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageElements: DesignElement[] = [];
    const fileArray = Array.from(files);

    // Calculate grid layout for multiple images
    const cols = Math.ceil(Math.sqrt(fileArray.length));
    const rows = Math.ceil(fileArray.length / cols);
    const spacing = 50;
    const maxImageSize = 400;

    // Center starting position
    const startX = canvasSize.width / 2 - ((cols * maxImageSize + (cols - 1) * spacing) / 2);
    const startY = canvasSize.height / 2 - ((rows * maxImageSize + (rows - 1) * spacing) / 2);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Load image to get dimensions
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = base64;
        });

        // Calculate scaled dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;

        if (width > maxImageSize || height > maxImageSize) {
          if (width > height) {
            width = maxImageSize;
            height = width / aspectRatio;
          } else {
            height = maxImageSize;
            width = height * aspectRatio;
          }
        }

        // Calculate position in grid
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (maxImageSize + spacing);
        const y = startY + row * (maxImageSize + spacing);

        const element: DesignElement = {
          id: `${Date.now()}-${i}`,
          type: 'image',
          name: file.name.replace(/\.[^/.]+$/, ''),
          x,
          y,
          width,
          height,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          borderRadius: 0,
          shadow: {
            blur: 0,
            color: 'transparent',
            x: 0,
            y: 0
          },
          imageData: base64,
          originalWidth: img.width,
          originalHeight: img.height,
          aspectRatioLocked: true,
          blendMode: 'normal',
        };

        imageElements.push(element);
      } catch (error) {
        console.error(`Failed to load image ${file.name}:`, error);
      }
    }

    // Add all images at once
    if (imageElements.length > 0) {
      if (onAddMultipleElements && imageElements.length > 1) {
        onAddMultipleElements(imageElements);
      } else {
        imageElements.forEach(el => onAddElement(el));
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-12 bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 flex items-center justify-between px-4 flex-shrink-0" data-tutorial-target="toolbar">
      {/* Left side - Shape tools */}
      <div className="flex items-center space-x-2">
        <div className="text-xs text-gray-400 mr-1">Shapes:</div>
        <div className="flex items-center space-x-1">
          {/* Image Import Button - FIRST */}
          <button
            ref={imageButtonRef}
            onClick={handleMenuToggle}
            data-tutorial-target="image-button"
            className="w-8 h-8 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 hover:scale-105 group flex items-center justify-center relative"
            title="Import Images"
          >
            <Plus
              className={`w-4 h-4 text-gray-900 transition-all duration-300 absolute ${
                showImageMenu ? 'rotate-45 opacity-100' : 'rotate-0 opacity-100'
              }`}
            />
          </button>

          {/* Image Import Menu */}
          <ImageImportMenu
            isOpen={showImageMenu}
            onClose={() => setShowImageMenu(false)}
            buttonRef={imageButtonRef}
            onImportFile={handleImportFile}
            onSearchImage={handleSearchImage}
            onGenerateAI={handleGenerateAI}
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {tools.map((tool, index) => (
            <button
              key={index}
              onClick={tool.action}
              className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 group flex items-center justify-center"
              title={tool.label}
            >
              <tool.icon className="w-4 h-4 text-gray-300 group-hover:text-yellow-400" />
            </button>
          ))}

          {/* Line Tools - Separate Buttons */}
          {lineTools.map((tool) => (
            <button
              key={tool.mode}
              onClick={() => createLine(tool.mode)}
              className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 group flex items-center justify-center"
              title={tool.label}
            >
              <tool.icon className="w-4 h-4 text-gray-300 group-hover:text-yellow-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Center section - Zoom controls */}
      <div className="flex items-center space-x-2">
        <div className="text-xs text-gray-400 mr-1">Zoom:</div>
        
        <button
          onClick={() => setZoom(Math.max(0.1, zoom - 0.25))}
          className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 flex items-center justify-center"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
        </button>
        
        <span className="text-xs text-gray-400 px-2 min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 flex items-center justify-center"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
        </button>
      </div>

      {/* Right side - Grid controls and Layout Mode */}
      <div className="flex items-center space-x-4">
        {/* Grid Controls */}
        <div className="flex items-center space-x-2">
        <div className="text-xs text-gray-400 mr-1">Grid:</div>
        
        <button
          onClick={onToggleGrid}
          className={`w-8 h-8 rounded-md transition-all duration-200 hover:scale-105 flex items-center justify-center ${
            gridEnabled 
              ? 'bg-yellow-400/20 text-yellow-400' 
              : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
        
        <button
          onClick={onToggleSnap}
          className={`w-8 h-8 rounded-md transition-all duration-200 hover:scale-105 flex items-center justify-center ${
            snapEnabled 
              ? 'bg-yellow-400/20 text-yellow-400' 
              : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
          }`}
          title="Snap to Grid"
        >
          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
        </button>
        
        <button
          onClick={onOpenGridSettings}
          data-tutorial-target="grid-button"
          className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 flex items-center justify-center"
          title="Grid Settings"
        >
          <Grid className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
        </button>

        {onOpenEditorSettings && (
          <button
            onClick={onOpenEditorSettings}
            className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 flex items-center justify-center"
            title="Editor Settings"
          >
            <Settings className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
          </button>
        )}

        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="w-8 h-8 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg"
            title="Export Design"
          >
            <Download className="w-4 h-4 text-gray-900" />
          </button>
        )}
        </div>
      </div>

      {/* Modals */}
      <GoogleImageSearchModal
        isOpen={showGoogleSearch}
        onClose={() => setShowGoogleSearch(false)}
        onImport={handleImportFromUrl}
      />

      <DalleGenerateModal
        isOpen={showDalleGenerate}
        onClose={() => setShowDalleGenerate(false)}
        onImport={handleImportFromUrl}
      />
    </div>
  );
};

export default HorizontalShapesBar;