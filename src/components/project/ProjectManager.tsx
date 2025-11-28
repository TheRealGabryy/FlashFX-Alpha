import React, { useState } from 'react';
import { Save, FolderOpen } from 'lucide-react';
import SaveProjectModal from '../modals/SaveProjectModal';
import LoadProjectModal from '../modals/LoadProjectModal';
import { DesignElement } from '../../types/design';
import { ProjectCanvas, SaveProjectOptions } from '../../types/projectFile';
import { useProjectFile } from '../../hooks/useProjectFile';

interface ProjectManagerProps {
  elements: DesignElement[];
  canvas: ProjectCanvas;
  userId?: string | null;
  userName?: string | null;
  onProjectLoaded: (elements: DesignElement[], canvas: ProjectCanvas) => void;
  children: (handlers: {
    handleSaveClick: () => void;
    handleLoadClick: () => void;
    currentProjectName: string;
  }) => React.ReactNode;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  elements,
  canvas,
  userId,
  userName,
  onProjectLoaded,
  children,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const { saveProject, loadProject, currentProjectName, setCurrentProjectName } = useProjectFile({
    onProjectLoaded,
  });

  const handleSave = async (projectName: string) => {
    const options: SaveProjectOptions = {
      projectName,
      elements,
      canvas,
      userId: userId || undefined,
      userName: userName || undefined,
    };

    await saveProject(options);
  };

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleLoadClick = () => {
    setShowLoadModal(true);
  };

  return (
    <>
      {children({
        handleSaveClick,
        handleLoadClick,
        currentProjectName,
      })}

      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        currentProjectName={currentProjectName}
      />

      <LoadProjectModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={loadProject}
      />
    </>
  );
};

export default ProjectManager;
