import React, { useState, useEffect } from 'react';
import { Palette, Plus, Download, Upload, Trash2, Loader } from 'lucide-react';
import { Preset } from '../../types/preset';
import { PresetService } from '../../services/PresetService';
import { DesignElement } from '../../types/design';

interface PresetsTabProps {
  userId: string | null;
  isGuest: boolean;
  onAddPreset: (elements: DesignElement[]) => void;
}

const PresetsTab: React.FC<PresetsTabProps> = ({ userId, isGuest, onAddPreset }) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPresets();
  }, [userId, isGuest]);

  const loadPresets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isGuest) {
        const localPresets = PresetService.loadPresetsFromLocalStorage();
        setPresets(localPresets);
      } else if (userId) {
        const userPresets = await PresetService.getUserPresets(userId);
        setPresets(userPresets);
      }
    } catch (err) {
      console.error('Error loading presets:', err);
      setError('Failed to load presets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      if (isGuest) {
        const updatedPresets = presets.filter(p => p.id !== presetId);
        PresetService.savePresetsToLocalStorage(updatedPresets);
        setPresets(updatedPresets);
      } else {
        await PresetService.deletePreset(presetId);
        setPresets(presets.filter(p => p.id !== presetId));
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
      alert('Failed to delete preset');
    }
  };

  const handleExportPresets = () => {
    try {
      const jsonData = PresetService.exportPresetsToJSON(presets);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-presets-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting presets:', err);
      alert('Failed to export presets');
    }
  };

  const handleImportPresets = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      if (isGuest) {
        const importedData = JSON.parse(text);
        const newPresets = importedData.map((p: any) => ({
          ...p,
          id: `preset-${Date.now()}-${Math.random()}`,
          user_id: 'guest'
        }));
        const updatedPresets = [...presets, ...newPresets];
        PresetService.savePresetsToLocalStorage(updatedPresets);
        setPresets(updatedPresets);
      } else if (userId) {
        const importedPresets = await PresetService.importPresetsFromJSON(userId, text);
        setPresets([...presets, ...importedPresets]);
      }
    } catch (err) {
      console.error('Error importing presets:', err);
      alert('Failed to import presets. Please check the file format.');
    }

    event.target.value = '';
  };

  const handleClickPreset = (preset: Preset) => {
    onAddPreset(preset.elements);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Loading presets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-sm">{error}</p>
          <button
            onClick={loadPresets}
            className="mt-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white">Presets</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExportPresets}
              disabled={presets.length === 0}
              className="p-1 rounded hover:bg-gray-600/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export Presets"
            >
              <Download className="w-3 h-3 text-gray-400" />
            </button>
            <label
              className="p-1 rounded hover:bg-gray-600/50 transition-colors cursor-pointer"
              title="Import Presets"
            >
              <Upload className="w-3 h-3 text-gray-400" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportPresets}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {presets.length} preset{presets.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {presets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Palette className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm mb-1">No presets yet</p>
              <p className="text-xs text-gray-600">
                Select a group and save it as a preset
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group relative bg-gray-700/30 border border-gray-600/30 rounded-lg p-3 hover:bg-gray-600/40 hover:border-yellow-400/30 transition-all duration-200 cursor-pointer"
                onClick={() => handleClickPreset(preset)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-white truncate flex-1 pr-2">
                    {preset.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600/50 transition-all"
                    title="Delete Preset"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>

                {preset.description && (
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    {preset.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {preset.element_count} element{preset.element_count !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Click to add</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetsTab;
