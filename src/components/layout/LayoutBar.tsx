import React from 'react';
import { Palette, Film } from 'lucide-react';
import { LayoutMode } from '../../hooks/useLayoutMode';

interface LayoutBarProps {
  currentMode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
  isTransitioning: boolean;
}

const LayoutBar: React.FC<LayoutBarProps> = ({
  currentMode,
  onModeChange,
  isTransitioning
}) => {
  return (
    <div className="w-full flex items-center justify-center bg-gray-800/50 backdrop-blur-xl border-t border-gray-700/50 py-2">
      <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-1 border border-gray-700/50">
        <button
          onClick={() => onModeChange('design')}
          disabled={isTransitioning}
          className={`
            flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium text-sm
            transition-all duration-200
            ${currentMode === 'design'
              ? 'bg-gray-700/70 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/40'
            }
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
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
            ${currentMode === 'edit'
              ? 'bg-gray-700/70 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/40'
            }
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Film className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};

export default LayoutBar;
