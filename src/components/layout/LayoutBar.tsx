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
      <div className="flex items-center gap-0.5 bg-gray-700/30 rounded p-0.5" style={{ width: '50%' }}>
        <button
          onClick={() => onModeChange('design')}
          disabled={isTransitioning}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded font-medium text-sm
            transition-all duration-200
            ${currentMode === 'design'
              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-600/30'
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
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded font-medium text-sm
            transition-all duration-200
            ${currentMode === 'edit'
              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-600/30'
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
