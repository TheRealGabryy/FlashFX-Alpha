import React, { useState } from 'react';
import { X, Settings, Grid, Keyboard, FileDown, Save, Zap, Monitor, Film, Globe, Magnet, Palette } from 'lucide-react';
import { GridSettings } from '../../hooks/useGridSystem';

interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  gridSettings: GridSettings;
  updateGridSettings: (updates: Partial<GridSettings>) => void;
  shapeSnapEnabled?: boolean;
  onToggleShapeSnap?: () => void;
}

type SettingsTab = 'project' | 'grid' | 'shortcuts' | 'export' | 'backup' | 'performance';

const EditorSettingsModal: React.FC<EditorSettingsModalProps> = ({
  isOpen,
  onClose,
  projectName,
  onProjectNameChange,
  gridSettings,
  updateGridSettings,
  shapeSnapEnabled = true,
  onToggleShapeSnap
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('project');
  const [resolution, setResolution] = useState<'4k' | '2k' | '1080p' | '720p'>('4k');
  const [frameRate, setFrameRate] = useState<120 | 60 | 30 | 24>(60);
  const [language, setLanguage] = useState<'English' | 'Italian' | 'Spanish' | 'French'>('English');

  const [exportFormat, setExportFormat] = useState<'MP4' | 'MOV' | 'WebM' | 'GIF'>('MP4');
  const [renderEngine, setRenderEngine] = useState<'Software' | 'GPU' | 'Hybrid'>('GPU');
  const [sampleRate, setSampleRate] = useState<44100 | 48000>(48000);
  const [bitrate, setBitrate] = useState<128 | 192 | 256 | 320>(256);
  const [channels, setChannels] = useState<'Mono' | 'Stereo'>('Stereo');

  const [autoSaveInterval, setAutoSaveInterval] = useState<1 | 5 | 10>(5);
  const [crashRecovery, setCrashRecovery] = useState(true);

  const [gpuAcceleration, setGpuAcceleration] = useState(true);
  const [cacheSize, setCacheSize] = useState<512 | 1024 | 2048 | 4096>(1024);
  const [playbackQuality, setPlaybackQuality] = useState<'Full' | 'Half' | 'Quarter'>('Full');
  const [backgroundRendering, setBackgroundRendering] = useState(true);

  if (!isOpen) return null;

  const tabs = [
    { id: 'project' as SettingsTab, label: 'Project', icon: Settings },
    { id: 'grid' as SettingsTab, label: 'Grid', icon: Grid },
    { id: 'shortcuts' as SettingsTab, label: 'Shortcuts', icon: Keyboard },
    { id: 'export' as SettingsTab, label: 'Export', icon: FileDown },
    { id: 'backup' as SettingsTab, label: 'Backup', icon: Save },
    { id: 'performance' as SettingsTab, label: 'Performance', icon: Zap }
  ];

  const resolutionMap = {
    '4k': { width: 3840, height: 2160, label: '4K (3840 × 2160)' },
    '2k': { width: 2560, height: 1440, label: '2K (2560 × 1440)' },
    '1080p': { width: 1920, height: 1080, label: '1080p (1920 × 1080)' },
    '720p': { width: 1280, height: 720, label: '720p (1280 × 720)' }
  };

  const renderProjectSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-2">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all"
          placeholder="Enter project name"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3 flex items-center">
          <Monitor className="w-4 h-4 mr-2" />
          Canvas Resolution
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(resolutionMap).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setResolution(key as typeof resolution)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                resolution === key
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium text-sm">{key.toUpperCase()}</div>
              <div className="text-xs text-gray-400 mt-1">{value.width} × {value.height}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3 flex items-center">
          <Film className="w-4 h-4 mr-2" />
          Frame Rate (FPS)
        </label>
        <div className="grid grid-cols-4 gap-3">
          {[120, 60, 30, 24].map((fps) => (
            <button
              key={fps}
              onClick={() => setFrameRate(fps as typeof frameRate)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                frameRate === fps
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium">{fps}</div>
              <div className="text-xs text-gray-400">fps</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3 flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Language
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['English', 'Italian', 'Spanish', 'French'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang as typeof language)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                language === lang
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium text-sm">{lang}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGridSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Grid Dimensions
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-2">Columns</label>
            <input
              type="number"
              min="2"
              max="50"
              value={gridSettings.columns}
              onChange={(e) => updateGridSettings({ columns: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Rows</label>
            <input
              type="number"
              min="2"
              max="50"
              value={gridSettings.rows}
              onChange={(e) => updateGridSettings({ rows: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Appearance
        </h3>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Grid Color</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={gridSettings.color}
              onChange={(e) => updateGridSettings({ color: e.target.value })}
              className="w-12 h-12 rounded-lg cursor-pointer border border-gray-600"
            />
            <input
              type="text"
              value={gridSettings.color}
              onChange={(e) => updateGridSettings({ color: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">
            Opacity: {Math.round(gridSettings.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={gridSettings.opacity}
            onChange={(e) => updateGridSettings({ opacity: Number(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-white">Show Grid</div>
            <div className="text-xs text-gray-400">Display grid lines on canvas</div>
          </div>
          <button
            onClick={() => updateGridSettings({ enabled: !gridSettings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              gridSettings.enabled ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                gridSettings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-white">Snap to Grid</div>
            <div className="text-xs text-gray-400">Align shapes to grid intersections</div>
          </div>
          <button
            onClick={() => updateGridSettings({ snapEnabled: !gridSettings.snapEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              gridSettings.snapEnabled ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                gridSettings.snapEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {onToggleShapeSnap && (
          <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
            <div>
              <div className="text-sm font-medium text-white flex items-center">
                <Magnet className="w-4 h-4 mr-2" />
                Shape Snapping
              </div>
              <div className="text-xs text-gray-400">Enable snapping between shapes</div>
            </div>
            <button
              onClick={onToggleShapeSnap}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shapeSnapEnabled ? 'bg-yellow-400' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shapeSnapEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="text-xs text-blue-400 space-y-1">
          <div><strong>Cell Size:</strong> {Math.round(3840 / gridSettings.columns)}px × {Math.round(2160 / gridSettings.rows)}px</div>
          <div><strong>Total Cells:</strong> {gridSettings.columns * gridSettings.rows}</div>
        </div>
      </div>
    </div>
  );

  const renderShortcuts = () => {
    const shortcutCategories = [
      {
        title: 'Shape Creation',
        shortcuts: [
          { key: 'Q', description: 'Add Rectangle' },
          { key: 'W', description: 'Add Circle' },
          { key: 'E', description: 'Add Text' },
          { key: 'R', description: 'Add Button' },
          { key: 'T', description: 'Add Chat Bubble' },
          { key: 'Y', description: 'Add Chat Frame' },
          { key: 'U', description: 'Add Line' },
        ]
      },
      {
        title: 'View Controls',
        shortcuts: [
          { key: '+', description: 'Zoom In (5%)' },
          { key: '-', description: 'Zoom Out (5%)' },
          { key: 'G', description: 'Toggle Grid' },
        ]
      },
      {
        title: 'Edit Operations',
        shortcuts: [
          { key: 'Ctrl + Z', description: 'Undo' },
          { key: 'Ctrl + Shift + Z', description: 'Redo' },
          { key: 'Ctrl + Y', description: 'Redo (Alternative)' },
          { key: 'Ctrl + D', description: 'Duplicate' },
          { key: 'Delete / Backspace', description: 'Delete Selected' },
        ]
      },
      {
        title: 'Selection',
        shortcuts: [
          { key: 'Ctrl + A', description: 'Select All' },
          { key: 'Escape', description: 'Deselect All' },
          { key: 'Ctrl + G', description: 'Group Selected' },
          { key: 'Ctrl + Shift + G', description: 'Ungroup Selected' },
        ]
      },
      {
        title: 'Navigation',
        shortcuts: [
          { key: '←↑↓→', description: 'Nudge (1px)' },
          { key: 'Shift + ←↑↓→', description: 'Nudge (10px)' },
        ]
      },
      {
        title: 'Advanced',
        shortcuts: [
          { key: 'Ctrl + E', description: 'Export' },
          { key: 'Ctrl + ;', description: 'Toggle Snapping' },
        ]
      }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Keyboard className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">Keyboard Shortcuts</p>
              <p className="text-xs text-blue-400/80">
                Shape shortcuts are disabled when typing in text fields. Press the key directly without any modifiers.
              </p>
            </div>
          </div>
        </div>

        {shortcutCategories.map((category, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center">
              {category.title}
            </h3>
            <div className="space-y-2">
              {category.shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-sm text-gray-300">{shortcut.description}</span>
                  <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md text-xs font-mono text-yellow-400 shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-4 bg-gray-700/20 border border-gray-600/30 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Tips</h3>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• Shape shortcuts work only when not typing in text fields</li>
            <li>• Use Shift with arrow keys for larger movements</li>
            <li>• Combine Ctrl/Cmd with keys for advanced operations</li>
            <li>• Zoom shortcuts work anywhere in the editor</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderExportSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3">Default Export Format</label>
        <div className="grid grid-cols-4 gap-3">
          {['MP4', 'MOV', 'WebM', 'GIF'].map((format) => (
            <button
              key={format}
              onClick={() => setExportFormat(format as typeof exportFormat)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                exportFormat === format
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium text-sm">{format}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3">Render Engine</label>
        <div className="grid grid-cols-3 gap-3">
          {['Software', 'GPU', 'Hybrid'].map((engine) => (
            <button
              key={engine}
              onClick={() => setRenderEngine(engine as typeof renderEngine)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                renderEngine === engine
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium text-sm">{engine}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Audio Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-2">Sample Rate</label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(Number(e.target.value) as typeof sampleRate)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value={44100}>44.1 kHz</option>
              <option value={48000}>48 kHz</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Bitrate</label>
            <select
              value={bitrate}
              onChange={(e) => setBitrate(Number(e.target.value) as typeof bitrate)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value={128}>128 kbps</option>
              <option value={192}>192 kbps</option>
              <option value={256}>256 kbps</option>
              <option value={320}>320 kbps</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Channels</label>
          <div className="grid grid-cols-2 gap-3">
            {['Mono', 'Stereo'].map((channel) => (
              <button
                key={channel}
                onClick={() => setChannels(channel as typeof channels)}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  channels === channel
                    ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                    : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
                }`}
              >
                <div className="font-medium text-sm">{channel}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3">Auto-Save Interval</label>
        <div className="grid grid-cols-3 gap-3">
          {[1, 5, 10].map((interval) => (
            <button
              key={interval}
              onClick={() => setAutoSaveInterval(interval as typeof autoSaveInterval)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                autoSaveInterval === interval
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium">{interval}</div>
              <div className="text-xs text-gray-400">min</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-white">Crash Recovery</div>
            <div className="text-xs text-gray-400">Enable automatic session restore</div>
          </div>
          <button
            onClick={() => setCrashRecovery(!crashRecovery)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              crashRecovery ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                crashRecovery ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 rounded-lg text-white transition-all text-left">
          <div className="font-medium text-sm">Manual Backup</div>
          <div className="text-xs text-gray-400 mt-1">Export project backup</div>
        </button>

        <button className="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 rounded-lg text-white transition-all text-left">
          <div className="font-medium text-sm">Backup Restore</div>
          <div className="text-xs text-gray-400 mt-1">Load from backup history</div>
        </button>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-white">GPU Acceleration</div>
            <div className="text-xs text-gray-400">Use hardware acceleration for rendering</div>
          </div>
          <button
            onClick={() => setGpuAcceleration(!gpuAcceleration)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              gpuAcceleration ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                gpuAcceleration ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-white">Background Rendering</div>
            <div className="text-xs text-gray-400">Render while working on other tasks</div>
          </div>
          <button
            onClick={() => setBackgroundRendering(!backgroundRendering)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              backgroundRendering ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                backgroundRendering ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3">Cache Size (MB)</label>
        <div className="grid grid-cols-4 gap-3">
          {[512, 1024, 2048, 4096].map((size) => (
            <button
              key={size}
              onClick={() => setCacheSize(size as typeof cacheSize)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                cacheSize === size
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium text-sm">{size}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 block mb-3">Playback Quality</label>
        <div className="grid grid-cols-3 gap-3">
          {['Full', 'Half', 'Quarter'].map((quality) => (
            <button
              key={quality}
              onClick={() => setPlaybackQuality(quality as typeof playbackQuality)}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                playbackQuality === quality
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-600/40'
              }`}
            >
              <div className="font-medium text-sm">{quality}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'project':
        return renderProjectSettings();
      case 'grid':
        return renderGridSettings();
      case 'shortcuts':
        return renderShortcuts();
      case 'export':
        return renderExportSettings();
      case 'backup':
        return renderBackupSettings();
      case 'performance':
        return renderPerformanceSettings();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700/50 flex flex-col">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">Editor Settings</h2>
            <p className="text-sm text-gray-400 mt-1">Configure your workspace</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {tabs.find(t => t.id === activeTab)?.label} Settings
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'project' && 'Configure project properties'}
                {activeTab === 'grid' && 'Customize grid system'}
                {activeTab === 'shortcuts' && 'Keyboard shortcuts reference'}
                {activeTab === 'export' && 'Configure export and rendering'}
                {activeTab === 'backup' && 'Manage backups and recovery'}
                {activeTab === 'performance' && 'Optimize performance settings'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorSettingsModal;
