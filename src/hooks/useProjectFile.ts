import { useState, useCallback } from 'react';
import { DesignElement } from '../types/design';
import { ProjectCanvas, LoadProjectResult, SaveProjectOptions } from '../types/projectFile';
import { ProjectFileService } from '../services/ProjectFileService';
import { Animation } from '../types/project';

export interface UseProjectFileOptions {
  onProjectLoaded?: (elements: DesignElement[], canvas: ProjectCanvas) => void;
}

export function useProjectFile(options?: UseProjectFileOptions) {
  const [projectService] = useState(() => new ProjectFileService());
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveProject = useCallback(
    async (saveOptions: SaveProjectOptions): Promise<void> => {
      setIsSaving(true);
      try {
        const blob = await projectService.saveProject(saveOptions);
        projectService.downloadProject(blob, saveOptions.projectName);
        setCurrentProjectName(saveOptions.projectName);
      } catch (error) {
        console.error('Failed to save project:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [projectService]
  );

  const loadProject = useCallback(
    async (file: File): Promise<LoadProjectResult> => {
      setIsLoading(true);
      try {
        const result = await projectService.loadProject(file);

        if (result.success && result.data) {
          const elements = Object.values(result.data.shapes);
          const canvas = result.data.canvas;

          if (options?.onProjectLoaded) {
            options.onProjectLoaded(elements, canvas);
          }

          setCurrentProjectName(result.data.manifest.name);
        }

        return result;
      } catch (error) {
        console.error('Failed to load project:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [projectService, options]
  );

  return {
    saveProject,
    loadProject,
    currentProjectName,
    setCurrentProjectName,
    isSaving,
    isLoading,
  };
}
