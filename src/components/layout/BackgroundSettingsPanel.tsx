import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Palette } from 'lucide-react';
import {
  BackgroundConfig,
  GradientLayer,
  ColorStop,
  createDefaultColorStop,
  createDefaultGradientLayer,
  GradientType,
  LinearDirection,
  RadialType,
  BlendMode
} from '../../types/background';

interface BackgroundSettingsPanelProps {
  background: BackgroundConfig;
  onUpdate: (background: BackgroundConfig) => void;
}

const BackgroundSettingsPanel: React.FC<BackgroundSettingsPanelProps> = ({
  background,
  onUpdate
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const toggleLayerExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const addLayer = () => {
    if (background.layers.length >= 4) return;

    const newLayer = createDefaultGradientLayer();
    onUpdate({
      ...background,
      enabled: true,
      layers: [...background.layers, newLayer]
    });
    setExpandedLayers(new Set([...expandedLayers, newLayer.id]));
  };

  const removeLayer = (layerId: string) => {
    const newLayers = background.layers.filter(l => l.id !== layerId);
    onUpdate({
      ...background,
      enabled: newLayers.length > 0,
      layers: newLayers
    });

    const newExpanded = new Set(expandedLayers);
    newExpanded.delete(layerId);
    setExpandedLayers(newExpanded);
  };

  const updateLayer = (layerId: string, updates: Partial<GradientLayer>) => {
    const newLayers = background.layers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    onUpdate({ ...background, layers: newLayers });
  };

  const addColorStop = (layerId: string) => {
    const layer = background.layers.find(l => l.id === layerId);
    if (!layer) return;

    const lastPosition = layer.colorStops.length > 0
      ? Math.max(...layer.colorStops.map(s => s.position))
      : 0;

    const newStop = createDefaultColorStop('#8B5CF6', Math.min(lastPosition + 25, 100));

    updateLayer(layerId, {
      colorStops: [...layer.colorStops, newStop]
    });
  };

  const removeColorStop = (layerId: string, stopId: string) => {
    const layer = background.layers.find(l => l.id === layerId);
    if (!layer || layer.colorStops.length <= 1) return;

    updateLayer(layerId, {
      colorStops: layer.colorStops.filter(s => s.id !== stopId)
    });
  };

  const updateColorStop = (layerId: string, stopId: string, updates: Partial<ColorStop>) => {
    const layer = background.layers.find(l => l.id === layerId);
    if (!layer) return;

    const newStops = layer.colorStops.map(stop =>
      stop.id === stopId ? { ...stop, ...updates } : stop
    );

    updateLayer(layerId, { colorStops: newStops });
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    const index = background.layers.findIndex(l => l.id === layerId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === background.layers.length - 1) return;

    const newLayers = [...background.layers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]];

    onUpdate({ ...background, layers: newLayers });
  };

  const clearBackground = () => {
    onUpdate({
      enabled: false,
      layers: []
    });
    setExpandedLayers(new Set());
  };

  return (
    <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-xl">
      <div className="p-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-yellow-400" />
            Background Settings
          </h3>
        </div>
        <p className="text-xs text-gray-400">
          {background.layers.length === 0 && 'Add colors to create a background'}
          {background.layers.length === 1 && 'Solid color or gradient'}
          {background.layers.length > 1 && `${background.layers.length} gradient layers`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {background.layers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
              <Palette className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500 mb-3">Canvas has transparent background</p>
            <button
              onClick={addLayer}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-xs font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all"
            >
              Add First Color
            </button>
          </div>
        ) : (
          <>
            {background.layers.map((layer, index) => (
              <div
                key={layer.id}
                className="bg-gray-700/30 rounded-lg border border-gray-600/50 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-600/30 transition-colors"
                  onClick={() => toggleLayerExpanded(layer.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium text-white">
                      Layer {index + 1}
                      {layer.colorStops.length === 1 && ' (Solid)'}
                      {layer.colorStops.length > 1 && ` (${layer.type} gradient)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(layer.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-0.5 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3 h-3 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(layer.id, 'down');
                        }}
                        disabled={index === background.layers.length - 1}
                        className="p-0.5 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(layer.id);
                      }}
                      className="p-0.5 rounded hover:bg-red-500/20 transition-colors"
                      title="Remove Layer"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>

                {expandedLayers.has(layer.id) && (
                  <div className="p-3 space-y-3 border-t border-gray-600/50">
                    {layer.colorStops.length > 1 && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-300 block mb-1.5">
                            Gradient Type
                          </label>
                          <select
                            value={layer.type}
                            onChange={(e) => updateLayer(layer.id, { type: e.target.value as GradientType })}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                          >
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                          </select>
                        </div>

                        {layer.type === 'linear' && (
                          <div>
                            <label className="text-xs font-medium text-gray-300 block mb-1.5">
                              Direction
                            </label>
                            <select
                              value={layer.direction || 'top-to-bottom'}
                              onChange={(e) => updateLayer(layer.id, { direction: e.target.value as LinearDirection })}
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                            >
                              <option value="top-to-bottom">Top → Bottom</option>
                              <option value="bottom-to-top">Bottom → Top</option>
                              <option value="left-to-right">Left → Right</option>
                              <option value="right-to-left">Right → Left</option>
                              <option value="diagonal-tl-br">Diagonal ↘</option>
                              <option value="diagonal-tr-bl">Diagonal ↙</option>
                            </select>
                          </div>
                        )}

                        {layer.type === 'radial' && (
                          <div>
                            <label className="text-xs font-medium text-gray-300 block mb-1.5">
                              Position
                            </label>
                            <select
                              value={layer.radialType || 'center'}
                              onChange={(e) => updateLayer(layer.id, { radialType: e.target.value as RadialType })}
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                            >
                              <option value="center">Center</option>
                              <option value="top-left">Top Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-medium text-gray-300 block mb-1.5">
                            Blend Mode
                          </label>
                          <select
                            value={layer.blendMode}
                            onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                          >
                            <option value="normal">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                            <option value="overlay">Overlay</option>
                            <option value="darken">Darken</option>
                            <option value="lighten">Lighten</option>
                            <option value="color-dodge">Color Dodge</option>
                            <option value="color-burn">Color Burn</option>
                            <option value="hard-light">Hard Light</option>
                            <option value="soft-light">Soft Light</option>
                            <option value="difference">Difference</option>
                            <option value="exclusion">Exclusion</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-300">
                          Colors ({layer.colorStops.length})
                        </label>
                        {layer.colorStops.length < 10 && (
                          <button
                            onClick={() => addColorStop(layer.id)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {layer.colorStops.sort((a, b) => a.position - b.position).map((stop) => (
                          <div
                            key={stop.id}
                            className="bg-gray-700/50 rounded p-2 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={stop.color}
                                onChange={(e) => updateColorStop(layer.id, stop.id, { color: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                              />
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={stop.color}
                                  onChange={(e) => updateColorStop(layer.id, stop.id, { color: e.target.value })}
                                  className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                                />
                              </div>
                              {layer.colorStops.length > 1 && (
                                <button
                                  onClick={() => removeColorStop(layer.id, stop.id)}
                                  className="p-1 rounded hover:bg-red-500/20 transition-colors"
                                  title="Remove Color"
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                              )}
                            </div>

                            {layer.colorStops.length > 1 && (
                              <>
                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">
                                    Position: {stop.position}%
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={stop.position}
                                    onChange={(e) => updateColorStop(layer.id, stop.id, { position: Number(e.target.value) })}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">
                                    Opacity: {stop.opacity}%
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={stop.opacity}
                                    onChange={(e) => updateColorStop(layer.id, stop.id, { opacity: Number(e.target.value) })}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {background.layers.length < 4 && (
              <button
                onClick={addLayer}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-yellow-400 hover:text-yellow-400 transition-all flex items-center justify-center gap-2 text-xs font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Gradient Layer ({background.layers.length}/4)
              </button>
            )}

            {background.layers.length > 0 && (
              <button
                onClick={clearBackground}
                className="w-full py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium"
              >
                Clear Background
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BackgroundSettingsPanel;
