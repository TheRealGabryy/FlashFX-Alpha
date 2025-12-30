import React, { useRef, useCallback, useMemo } from 'react';
import { DesignElement } from '../../types/design';
import { BackgroundConfig, generateBackgroundStyle } from '../../types/background';
import EnhancedDesignElementComponent from '../design-tool/EnhancedDesignElementComponent';

interface VideoCanvasProps {
  elements: DesignElement[];
  currentTime: number;
  zoom: number;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  background?: BackgroundConfig;
  selectedClipId?: string | null;
  onClipSelect?: (elementId: string) => void;
}

const CANVAS_WIDTH = 3840;
const CANVAS_HEIGHT = 2160;

const VideoCanvas: React.FC<VideoCanvasProps> = ({
  elements,
  currentTime,
  zoom,
  pan,
  setPan,
  background,
  selectedClipId,
  onClipSelect
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);

  const getVisibleElements = useMemo(() => {
    return elements.filter(element => {
      const clipProps = element.clipProperties;
      if (!clipProps) {
        return true;
      }
      return (
        currentTime >= clipProps.startTime &&
        currentTime <= clipProps.endTime &&
        element.visible
      );
    });
  }, [elements, currentTime]);

  const calculateElementOpacity = useCallback((element: DesignElement): number => {
    const clipProps = element.clipProperties;
    if (!clipProps) return element.opacity;

    const relativeTime = currentTime - clipProps.startTime;
    let opacity = element.opacity;

    if (clipProps.fadeIn && relativeTime < clipProps.fadeIn) {
      opacity *= relativeTime / clipProps.fadeIn;
    }

    if (clipProps.fadeOut) {
      const fadeOutStart = clipProps.duration - clipProps.fadeOut;
      if (relativeTime > fadeOutStart) {
        const fadeProgress = (relativeTime - fadeOutStart) / clipProps.fadeOut;
        opacity *= 1 - fadeProgress;
      }
    }

    return opacity;
  }, [currentTime]);

  const renderElements = (elementList: DesignElement[]) => {
    return elementList.map((element) => {
      const opacity = calculateElementOpacity(element);
      const isSelected = selectedClipId === element.id;

      return (
        <div
          key={element.id}
          onClick={() => onClipSelect?.(element.id)}
          className="cursor-pointer"
        >
          <EnhancedDesignElementComponent
            element={{ ...element, opacity }}
            isSelected={isSelected}
            isHovered={false}
            onSelect={() => onClipSelect?.(element.id)}
            onUpdate={() => {}}
            onContextMenu={(e) => e.preventDefault()}
            onHover={() => {}}
            parentOffset={{ x: 0, y: 0 }}
            allElements={elements}
            zoom={1}
            snapEnabled={false}
            canvasSize={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          />
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-900">
      <div
        ref={canvasRef}
        className="w-full h-full flex items-center justify-center p-4"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          minWidth: `${CANVAS_WIDTH * zoom + 200}px`,
          minHeight: `${CANVAS_HEIGHT * zoom + 200}px`
        }}
      >
        <div
          id="video-canvas-artboard"
          ref={artboardRef}
          className="relative border-2 border-gray-600 shadow-2xl flex-shrink-0"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: !background?.enabled ? '#1F2937' : undefined,
            ...(background?.enabled ? generateBackgroundStyle(background) : {})
          }}
        >
          <div className="absolute top-4 left-4 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-600/50">
            <div className="text-xs text-gray-300 font-medium">Video Preview</div>
            <div className="text-xs text-gray-400">{CANVAS_WIDTH} × {CANVAS_HEIGHT}</div>
          </div>

          {renderElements(getVisibleElements)}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 px-3 py-1 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50">
        <span className="text-sm text-gray-300">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default VideoCanvas;
