import React, { useState } from 'react';
import { X, Palette } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, backgroundColor: string) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [projectName, setProjectName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');

  const handleCreate = () => {
    if (projectName.trim()) {
      onCreate(projectName, backgroundColor);
      setProjectName('');
      setBackgroundColor('#1e293b');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && projectName.trim()) {
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">New Project</h2>
                <p className="text-sm text-slate-400">Create a new project</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter project name..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Background Color
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-20 h-12 rounded-lg cursor-pointer border-2 border-slate-600 bg-slate-700"
                />
              </div>
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono text-sm"
              />
            </div>
            <div className="mt-3 p-4 rounded-lg border-2 border-slate-600" style={{ backgroundColor }}>
              <p className="text-sm text-center text-white/70 font-medium">Preview</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className={`px-6 py-2.5 font-medium rounded-lg transition-all ${
              projectName.trim()
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
