import React from 'react';
import { Palette, Film, Download, FolderOpen, HelpCircle, LogOut } from 'lucide-react';
import { LayoutMode } from '../../hooks/useLayoutMode';

interface LayoutBarProps {
  currentMode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
  isTransitioning: boolean;
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onStartTutorial?: () => void;
  onExitToHome?: () => void;
}

const LayoutBar: React.FC<LayoutBarProps> = ({
  currentMode,
  onModeChange,
  isTransitioning,
  onSaveProject,
  onLoadProject,
  onStartTutorial,
  onExitToHome
}) => {
  return (
    <div
      className="w-full flex items-center justify-between px-4 backdrop-blur-xl border-t py-2"
      style={{
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderColor: 'rgba(55, 65, 81, 0.5)'
      }}
    >
      <div className="flex items-center gap-2">
        {onLoadProject && (
          <button
            onClick={onLoadProject}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all"
            title="Load Project"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Load</span>
          </button>
        )}
        {onSaveProject && (
          <button
            onClick={onSaveProject}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all"
            title="Download Project"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}
      </div>

      <div
        className="flex items-center gap-1 rounded-lg p-1 border"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          borderColor: 'rgba(55, 65, 81, 0.5)'
        }}
      >
        <button
          onClick={() => onModeChange('design')}
          disabled={isTransitioning}
          className={`
            flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium text-sm
            transition-all duration-200
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={currentMode === 'design'
            ? { backgroundColor: 'rgba(55, 65, 81, 0.9)', color: '#ffffff' }
            : { color: '#9CA3AF' }
          }
          onMouseEnter={(e) => {
            if (currentMode !== 'design' && !isTransitioning) {
              e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.4)';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== 'design') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9CA3AF';
            }
          }}
        >
          <Palette className="w-4 h-4" />
          <span>Design</span>
        </button>

        <button
          onClick={() => onModeChange('edit')}
          disabled={isTransitioning}
          className={`
            flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium text-sm
            transition-all duration-200
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={currentMode === 'edit'
            ? { backgroundColor: 'rgba(55, 65, 81, 0.9)', color: '#ffffff' }
            : { color: '#9CA3AF' }
          }
          onMouseEnter={(e) => {
            if (currentMode !== 'edit' && !isTransitioning) {
              e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.4)';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== 'edit') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9CA3AF';
            }
          }}
        >
          <Film className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onStartTutorial && (
          <button
            onClick={onStartTutorial}
            data-tutorial-target="tutorial-button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all"
            title="Start Tutorial"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tutorial</span>
          </button>
        )}
        {onExitToHome && (
          <button
            onClick={onExitToHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all"
            title="Exit to Home"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LayoutBar;
