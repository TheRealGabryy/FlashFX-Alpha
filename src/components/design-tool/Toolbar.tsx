import React, { useRef, useState } from 'react';
import { Square, Circle, Type, Smartphone, MessageCircle, ZoomIn, ZoomOut, Grid2x2 as Grid, Undo2, Redo2, Download, Magnet, FileDown, Clock, Plus, Image, Settings, Upload, FileType, Minus } from 'lucide-react';
import { DesignElement } from '../../types/design';
import ImageImportMenu from '../image/ImageImportMenu';
import GoogleImageSearchModal from '../image/GoogleImageSearchModal';
import DalleGenerateModal from '../image/DalleGenerateModal';
import { getDefaultImageFilters } from '../../utils/imageFilters';
import { GridSettings } from '../../hooks/useGridSystem';
import { Tooltip } from '../common/Tooltip';

interface ToolbarProps {
  onAddElement: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  snapEnabled?: boolean;
  setSnapEnabled?: (enabled: boolean) => void;
  onOpenExport?: () => void;
  selectedCount?: number;
  onToggleTextSettings?: () => void;
  showTextSettings?: boolean;
  onToggleTimeline?: () => void;
  showTimeline?: boolean;
  onOpenEditorSettings?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddElement,
  onAddMultipleElements,
  zoom,
  setZoom,
  showGrid,
  setShowGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  snapEnabled = true,
  setSnapEnabled,
  onOpenExport,
  selectedCount = 0,
  onToggleTextSettings,
  showTextSettings = false,
  onToggleTimeline,
  showTimeline = true,
  onOpenEditorSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);
  const [showDalleGenerate, setShowDalleGenerate] = useState(false);
  const createRectangle = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'rectangle',
      name: 'Rectangle',
      x: 200,
      y: 200,
      width: 120,
      height: 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      borderRadius: 8,
      shadow: {
        blur: 8,
        color: 'rgba(0, 0, 0, 0.3)',
        x: 0,
        y: 4
      }
    };
    onAddElement(element);
  };

  const createCircle = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'circle',
      name: 'Circle',
      x: 250,
      y: 250,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#EF4444',
      stroke: '#DC2626',
      strokeWidth: 2,
      borderRadius: 50,
      shadow: {
        blur: 8,
        color: 'rgba(0, 0, 0, 0.3)',
        x: 0,
        y: 4
      }
    };
    onAddElement(element);
  };

  const createText = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'text',
      name: 'Text',
      x: 300,
      y: 300,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#FFFFFF',
      stroke: 'transparent',
      strokeWidth: 0,
      borderRadius: 0,
      shadow: {
        blur: 0,
        color: 'rgba(0, 0, 0, 0)',
        x: 0,
        y: 0
      },
      text: 'Hello World',
      fontSize: 24,
      fontWeight: '600',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      textTransform: 'none',
      textAlign: 'left',
      verticalAlign: 'middle',
      textColor: '#FFFFFF'
    };
    onAddElement(element);
  };

  const createButton = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'button',
      name: 'Button',
      x: 350,
      y: 350,
      width: 140,
      height: 48,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#FFD700',
      stroke: '#FFA500',
      strokeWidth: 2,
      borderRadius: 12,
      shadow: {
        blur: 12,
        color: 'rgba(255, 215, 0, 0.4)',
        x: 0,
        y: 4
      },
      text: 'Click Me',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      textTransform: 'none',
      textAlign: 'center',
      verticalAlign: 'middle',
      textColor: '#000000'
    };
    onAddElement(element);
  };

  const createChatBubble = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'chat-bubble',
      name: 'Chat Bubble',
      x: 400,
      y: 400,
      width: 200,
      height: 60,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#1F2937',
      stroke: '#374151',
      strokeWidth: 1,
      borderRadius: 18,
      shadow: {
        blur: 8,
        color: 'rgba(0, 0, 0, 0.3)',
        x: 0,
        y: 2
      },
      text: 'Hello! How are you?',
      fontSize: 14,
      fontWeight: '400',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      textTransform: 'none',
      textAlign: 'left',
      verticalAlign: 'middle',
      textColor: '#FFFFFF'
    };
    onAddElement(element);
  };

  const createChatFrame = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'chat-frame',
      name: 'Chat Frame',
      x: 450,
      y: 450,
      width: 320,
      height: 568,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#000000',
      stroke: '#374151',
      strokeWidth: 2,
      borderRadius: 36,
      shadow: {
        blur: 20,
        color: 'rgba(0, 0, 0, 0.5)',
        x: 0,
        y: 8
      }
    };
    onAddElement(element);
  };

  const createLine = () => {
    const element: DesignElement = {
      id: Date.now().toString(),
      type: 'line',
      name: 'Line',
      x: 500,
      y: 500,
      width: 200,
      height: 0,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: 'transparent',
      stroke: '#60A5FA',
      strokeWidth: 3,
      borderRadius: 0,
      shadow: {
        blur: 0,
        color: 'transparent',
        x: 0,
        y: 0
      },
      lineType: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 200, y: 0 }
      ],
      arrowStart: false,
      arrowEnd: false,
      arrowheadType: 'triangle',
      arrowheadSize: 12,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: [],
      smoothing: 0
    };
    onAddElement(element);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom + 0.05));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.25, zoom - 0.05));
  };

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

        const x = 1920 / 2 - width / 2;
        const y = 1080 / 2 - height / 2;

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
    const startX = 1920 - ((cols * maxImageSize + (cols - 1) * spacing) / 2);
    const startY = 1080 - ((rows * maxImageSize + (rows - 1) * spacing) / 2);

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

  const tools = [
    {
      icon: Plus,
      label: 'Import Image',
      shortcut: '',
      description: 'Upload images from your computer, search online, or generate with AI',
      action: handleMenuToggle,
      special: true,
      ref: imageButtonRef
    },
    {
      icon: Square,
      label: 'Rectangle',
      shortcut: 'Q',
      description: 'Create a rectangular shape with customizable size, color, border radius, and shadow effects',
      action: createRectangle
    },
    {
      icon: Circle,
      label: 'Circle',
      shortcut: 'W',
      description: 'Add a circular shape with adjustable fill, stroke, and shadow properties',
      action: createCircle
    },
    {
      icon: Type,
      label: 'Text',
      shortcut: 'E',
      description: 'Insert text with customizable font, size, color, alignment, and styling options',
      action: createText
    },
    {
      icon: MessageCircle,
      label: 'Button',
      shortcut: 'R',
      description: 'Create an interactive button element with text, styling, and hover effects',
      action: createButton
    },
    {
      icon: MessageCircle,
      label: 'Chat Bubble',
      shortcut: 'T',
      description: 'Add a chat message bubble for creating messaging interfaces and conversations',
      action: createChatBubble
    },
    {
      icon: Smartphone,
      label: 'Chat Frame',
      shortcut: 'Y',
      description: 'Insert a mobile device frame perfect for showcasing chat interfaces',
      action: createChatFrame
    },
    {
      icon: Minus,
      label: 'Line',
      shortcut: 'U',
      description: 'Draw straight or curved lines with arrows, dashes, and custom stroke styles',
      action: createLine
    }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-400 mr-4">Tools:</div>
          {tools.map((tool, index) => {
            const button = (
              <button
                key={index}
                ref={(tool as any).ref}
                onClick={tool.action}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 group relative ${
                  (tool as any).special
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400'
                    : 'bg-gray-700/50 hover:bg-gray-600/50'
                }`}
              >
                <tool.icon className={`w-5 h-5 transition-all duration-300 ${
                  (tool as any).special
                    ? `text-gray-900 ${showImageMenu ? 'rotate-45' : 'rotate-0'}`
                    : 'text-gray-300 group-hover:text-yellow-400'
                }`} />
              </button>
            );

            if (tool.shortcut || tool.description) {
              return (
                <Tooltip
                  key={index}
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                  description={tool.description}
                >
                  {button}
                </Tooltip>
              );
            }

            return button;
          })}

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
        </div>

        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canUndo 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-yellow-400' 
                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canRedo 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-yellow-400' 
                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-2"></div>

          {/* Zoom Controls */}
          <Tooltip
            title="Zoom Out (-)"
            description="Decrease canvas zoom by 5%"
          >
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200"
            >
              <ZoomOut className="w-5 h-5 text-gray-300" />
            </button>
          </Tooltip>

          <span className="text-sm text-gray-400 px-2 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Tooltip
            title="Zoom In (+)"
            description="Increase canvas zoom by 5%"
          >
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200"
            >
              <ZoomIn className="w-5 h-5 text-gray-300" />
            </button>
          </Tooltip>

          <div className="w-px h-6 bg-gray-600 mx-2"></div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showGrid 
                ? 'bg-yellow-400/20 text-yellow-400' 
                : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-5 h-5" />
          </button>
          
          {setSnapEnabled && (
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                snapEnabled
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
              }`}
              title="Toggle Snapping"
            >
              <Magnet className="w-5 h-5" />
            </button>
          )}

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="p-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 transition-all duration-200 shadow-lg"
              title="Export Design"
            >
              <Download className="w-5 h-5" />
            </button>
          )}

          {onOpenEditorSettings && (
            <button
              onClick={onOpenEditorSettings}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-yellow-400 transition-all duration-200"
              title="Editor Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {onToggleTextSettings && (
            <button
              onClick={onToggleTextSettings}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showTextSettings
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
              }`}
              title="Toggle Text Settings (Ctrl+Shift+T)"
            >
              <Type className="w-5 h-5" />
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

export default Toolbar;