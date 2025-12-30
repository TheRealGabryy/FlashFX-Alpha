import React, { useState, useCallback, useEffect } from 'react';
import { DesignElement, ClipProperties } from '../../../types/design';
import { BackgroundConfig } from '../../../types/background';
import { useVideoTimeline } from '../../../hooks/useVideoTimeline';
import VideoCanvas from '../../video/VideoCanvas';
import PlaybackControls from '../../video/PlaybackControls';
import VideoTimeline from '../../video/VideoTimeline';
import LayoutBar from '../LayoutBar';
import ResizableSplitter from '../../timeline/ResizableSplitter';

interface VideoModeLayoutProps {
  elements: DesignElement[];
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  onAddElement: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;

  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  onGroup: () => void;
  onUngroup: () => void;

  onOpenJsonEditor: (element: DesignElement) => void;
  onOpenLineProperties: () => void;
  onOpenExport: () => void;
  onOpenProjectJsonEditor: () => void;
  onOpenEditorSettings?: () => void;

  editorMode?: boolean;
  onBackToMain?: () => void;

  background?: BackgroundConfig;
  onUpdateBackground?: (background: BackgroundConfig) => void;

  onSavePreset?: (name: string, description: string, elements: DesignElement[]) => Promise<void>;
  userId?: string | null;
  isGuest?: boolean;

  onSaveProject?: () => Promise<void>;
  onExitToHome?: () => void;

  onSaveProjectFile?: () => void;
  onLoadProjectFile?: () => void;
}

const DEFAULT_CLIP_DURATION = 5;

const VideoModeLayout: React.FC<VideoModeLayoutProps> = ({
  elements,
  selectedElements,
  setSelectedElements,
  updateElement,
  deleteElement,
  duplicateElement,
  onAddElement,
  onAddMultipleElements,
  zoom,
  setZoom,
  pan,
  setPan,
  showGrid,
  setShowGrid,
  snapEnabled,
  setSnapEnabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGroup,
  onUngroup,
  onOpenJsonEditor,
  onOpenLineProperties,
  onOpenExport,
  onOpenProjectJsonEditor,
  onOpenEditorSettings,
  editorMode,
  onBackToMain,
  background,
  onUpdateBackground,
  onSavePreset,
  userId,
  isGuest,
  onSaveProject,
  onExitToHome,
  onSaveProjectFile,
  onLoadProjectFile
}) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(300);

  const {
    timeline,
    currentTime,
    isPlaying,
    play,
    pause,
    stop,
    togglePlayPause,
    seekToTime,
    setDuration,
    setFps,
    updateElementClipProperties
  } = useVideoTimeline(elements);

  useEffect(() => {
    elements.forEach((element) => {
      if (!element.clipProperties && element.type !== 'group') {
        const clipProps: ClipProperties = {
          startTime: 0,
          duration: DEFAULT_CLIP_DURATION,
          endTime: DEFAULT_CLIP_DURATION,
          trackIndex: 0,
          locked: false,
          muted: false,
          speed: 1,
          color: element.fill || '#60a5fa'
        };

        updateElement(element.id, { clipProperties: clipProps });
      }
    });
  }, []);

  const handleClipSelect = useCallback((elementId: string) => {
    setSelectedClipId(elementId);
    setSelectedElements([elementId]);
  }, [setSelectedElements]);

  const handleUpdateClip = useCallback((elementId: string, updates: Partial<ClipProperties>) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElement(elementId, {
        clipProperties: {
          ...element.clipProperties!,
          ...updates
        }
      });
    }
  }, [elements, updateElement]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <LayoutBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onOpenExport={onOpenExport}
        onSaveProjectFile={onSaveProjectFile}
        onLoadProjectFile={onLoadProjectFile}
        onOpenProjectJsonEditor={onOpenProjectJsonEditor}
        onOpenEditorSettings={onOpenEditorSettings}
        editorMode={editorMode}
        onBackToMain={onBackToMain}
        onSaveProject={onSaveProject}
        onExitToHome={onExitToHome}
        currentMode="video"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col" style={{ height: `calc(100% - ${timelineHeight}px)` }}>
          <VideoCanvas
            elements={elements}
            currentTime={currentTime}
            zoom={zoom}
            pan={pan}
            setPan={setPan}
            background={background}
            selectedClipId={selectedClipId}
            onClipSelect={handleClipSelect}
          />

          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={timeline.duration}
            fps={timeline.fps}
            onPlay={play}
            onPause={pause}
            onStop={stop}
            onSeek={seekToTime}
            onTogglePlayPause={togglePlayPause}
          />
        </div>

        <ResizableSplitter
          onResize={(delta) => setTimelineHeight(prev => Math.max(200, Math.min(600, prev - delta)))}
        />

        <div style={{ height: `${timelineHeight}px` }}>
          <VideoTimeline
            elements={elements}
            currentTime={currentTime}
            duration={timeline.duration}
            fps={timeline.fps}
            onSeek={seekToTime}
            onClipSelect={handleClipSelect}
            onUpdateClip={handleUpdateClip}
            selectedClipId={selectedClipId}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoModeLayout;
