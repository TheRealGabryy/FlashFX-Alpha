import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setCanDelete(false);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanDelete(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-red-500/30 shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Delete Project</h2>
                <p className="text-sm text-slate-400">Confirm deletion</p>
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

        <div className="p-6">
          <p className="text-slate-300 text-center mb-4">
            You are about to delete the project
          </p>
          <p className="text-white text-xl font-bold text-center mb-6">
            {projectName}
          </p>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium text-sm">
                This action can't be undone
              </p>
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
            onClick={handleConfirm}
            disabled={!canDelete}
            className={`px-6 py-2.5 font-medium rounded-lg transition-all min-w-[140px] ${
              canDelete
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-red-500/50 text-white/70 cursor-not-allowed'
            }`}
          >
            {canDelete ? 'Confirm Delete' : `Wait ${countdown}s...`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
