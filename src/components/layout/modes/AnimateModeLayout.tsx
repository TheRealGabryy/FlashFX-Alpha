import React from 'react';
import DesignModeLayout from './DesignModeLayout';
import { DesignElement } from '../../../types/design';

interface AnimateModeLayoutProps {
  // Canvas state
  elements: DesignElement[];
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  onAddElement: (element: DesignElement) => void;
  
  // Canvas controls
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  
  // Group operations
  onGroup: () => void;
  onUngroup: () => void;
  
  // Export
  onOpenExport: () => void;
  
  // Editor mode
  editorMode?: boolean;
  onBackToMain?: () => void;
}

const AnimateModeLayout: React.FC<AnimateModeLayoutProps> = (props) => {
  // Animate mode now uses Design mode layout
  return (
    <div className="h-full">
      {/* Use Design mode layout */}
      <div className="h-full">
        <DesignModeLayout
          elements={props.elements}
          selectedElements={props.selectedElements}
          setSelectedElements={props.setSelectedElements}
          updateElement={props.updateElement}
          deleteElement={props.deleteElement}
          duplicateElement={props.duplicateElement}
          onAddElement={props.onAddElement}
          zoom={props.zoom}
          setZoom={props.setZoom}
          pan={props.pan}
          setPan={props.setPan}
          showGrid={props.showGrid}
          setShowGrid={props.setShowGrid}
          snapEnabled={props.snapEnabled}
          setSnapEnabled={props.setSnapEnabled}
          canUndo={props.canUndo}
          canRedo={props.canRedo}
          onUndo={props.onUndo}
          onRedo={props.onRedo}
          onGroup={props.onGroup}
          onUngroup={props.onUngroup}
          onOpenExport={props.onOpenExport}
          editorMode={false} // Don't show double header
          onBackToMain={undefined} // Handled by our header
        />
      </div>
    </div>
  );
};

export default AnimateModeLayout;