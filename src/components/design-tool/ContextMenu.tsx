import React from 'react';
import { Copy, Trash2, Download, Edit } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  elementId: string | null;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  elementId,
  onClose,
  onDuplicate,
  onDelete
}) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const menuItems = elementId ? [
    {
      icon: Edit,
      label: 'Edit',
      action: () => {
        // Element is already selected, properties panel will show
      }
    },
    {
      icon: Copy,
      label: 'Duplicate',
      action: () => onDuplicate(elementId)
    },
    {
      icon: Download,
      label: 'Export as PNG',
      action: () => {
        // This would trigger the export functionality
      }
    },
    {
      icon: Trash2,
      label: 'Delete',
      action: () => onDelete(elementId),
      danger: true
    }
  ] : [
    {
      icon: Edit,
      label: 'Paste',
      action: () => {
        // Paste functionality
      },
      disabled: true
    }
  ];

  return (
    <div
      className="fixed z-50 bg-gray-800 rounded-lg border border-gray-700 shadow-xl min-w-[160px] py-2"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -10px)'
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => handleAction(item.action)}
          disabled={item.disabled}
          className={`w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-700 transition-colors ${
            item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'
          } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <item.icon className="w-4 h-4" />
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;