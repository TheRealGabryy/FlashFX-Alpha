import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase, Project } from '../lib/supabase';
import { Plus, LogOut, Sparkles, Trash2, ImageIcon, Upload, Download, Settings } from 'lucide-react';
import NewProjectModal from '../components/modals/NewProjectModal';
import DeleteProjectModal from '../components/modals/DeleteProjectModal';
import LoadProjectModal from '../components/modals/LoadProjectModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { ProjectFileService } from '../services/ProjectFileService';
import { StorageService } from '../services/StorageService';
import { StorageIndicator } from '../components/storage/StorageIndicator';

type LocalProject = {
  id: string;
  name: string;
  data: Record<string, any>;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
};

const GUEST_PROJECTS_KEY = 'flashfx_guest_projects';

export const HomePage: React.FC = () => {
  const { user, profile, isGuest, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<(Project | LocalProject)[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | LocalProject | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | LocalProject | null>(null);
  const [showLoadProjectModal, setShowLoadProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [projectFileService] = useState(() => new ProjectFileService());

  useEffect(() => {
    console.log('[HomePage] Auth state changed:', { user: !!user, isGuest, authLoading });

    if (isGuest || (!user && !authLoading)) {
      console.log('[HomePage] Loading guest projects');
      loadGuestProjects();
    } else if (user) {
      console.log('[HomePage] Loading user projects');
      loadProjects();
    }
  }, [user, isGuest, authLoading]);

  // Add timeout mechanism to prevent infinite loading
  useEffect(() => {
    console.log('[HomePage] Setting up loading timeout');
    const timeoutId = setTimeout(() => {
      if (loading || authLoading) {
        console.error('[HomePage] Loading timeout after 10 seconds');
        setLoadTimeout(true);
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading, authLoading]);

  useEffect(() => {
    if (selectedProject) {
      setProjectTitle(selectedProject.name);
    }
  }, [selectedProject]);

  const loadGuestProjects = () => {
    try {
      console.log('[HomePage] Loading guest projects from localStorage');
      setLoading(true);
      const stored = localStorage.getItem(GUEST_PROJECTS_KEY);
      const guestProjects: LocalProject[] = stored ? JSON.parse(stored) : [];
      console.log(`[HomePage] Loaded ${guestProjects.length} guest projects`);
      setProjects(guestProjects);
      if (guestProjects.length > 0) {
        setSelectedProject(guestProjects[0]);
      }
    } catch (error) {
      console.error('[HomePage] Error loading guest projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
      console.log('[HomePage] Guest projects loaded, loading state set to false');
    }
  };

  const saveGuestProjects = (projectsList: LocalProject[]) => {
    try {
      localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(projectsList));
    } catch (error) {
      console.error('Error saving guest projects:', error);
    }
  };

  const loadProjects = async () => {
    try {
      console.log('[HomePage] Loading projects from database for user:', user?.id);
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[HomePage] Error loading projects:', error);
        throw error;
      }

      console.log(`[HomePage] Loaded ${data?.length || 0} projects`);
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error('[HomePage] Exception loading projects:', error);
    } finally {
      setLoading(false);
      console.log('[HomePage] Projects loaded, loading state set to false');
    }
  };

  const handleNewProject = async (name: string, backgroundColor: string) => {
    if (isGuest) {
      const newProject: LocalProject = {
        id: `guest-${Date.now()}`,
        name: name,
        data: { backgroundColor },
        thumbnail: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedProjects = [newProject, ...(projects as LocalProject[])];
      setProjects(updatedProjects);
      setSelectedProject(newProject);
      saveGuestProjects(updatedProjects);
    } else {
      try {
        const projectData = { backgroundColor };
        const projectSize = StorageService.calculateProjectSize(projectData);

        const storageCheck = await StorageService.canUploadProject(user!.id, projectSize);
        if (!storageCheck.canUpload) {
          alert(storageCheck.message || 'Cannot create project: Storage limit exceeded');
          return;
        }

        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user!.id,
            name: name,
            data: projectData,
            size_bytes: projectSize,
          })
          .select()
          .single();

        if (error) throw error;
        setProjects([data, ...projects]);
        setSelectedProject(data);
      } catch (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
      }
    }
  };

  const handleSelectProject = (project: Project | LocalProject) => {
    setSelectedProject(project);
  };

  const handleOpenProject = () => {
    if (selectedProject) {
      navigate(`/editor?project=${selectedProject.id}`);
    }
  };

  const handleDeleteProjectClick = (project: Project | LocalProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    if (isGuest) {
      const updatedProjects = (projects as LocalProject[]).filter(p => p.id !== projectToDelete.id);
      setProjects(updatedProjects);
      saveGuestProjects(updatedProjects);
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
      }
    } else {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectToDelete.id);

        if (error) throw error;
        const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
        setProjects(updatedProjects);
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
    setProjectToDelete(null);
  };

  const handleTitleChange = async (newTitle: string) => {
    if (newTitle.length > 150) return;
    setProjectTitle(newTitle);

    if (selectedProject && newTitle !== selectedProject.name) {
      if (isGuest) {
        const updatedProjects = (projects as LocalProject[]).map(p =>
          p.id === selectedProject.id ? { ...p, name: newTitle, updated_at: new Date().toISOString() } : p
        );
        setProjects(updatedProjects);
        setSelectedProject({ ...selectedProject, name: newTitle });
        saveGuestProjects(updatedProjects);
      } else {
        try {
          const { error } = await supabase
            .from('projects')
            .update({ name: newTitle })
            .eq('id', selectedProject.id);

          if (error) throw error;

          setProjects(projects.map(p =>
            p.id === selectedProject.id ? { ...p, name: newTitle } : p
          ));
          setSelectedProject({ ...selectedProject, name: newTitle });
        } catch (error) {
          console.error('Error updating project title:', error);
        }
      }
    }
  };

  const handleUploadProject = async (file: File) => {
    const result = await projectFileService.loadProject(file);

    if (result.success && result.data) {
      const elements = Object.values(result.data.shapes);
      const newProject = {
        name: result.data.manifest.name,
        data: {
          projectFileLoaded: true,
          elements,
          canvas: result.data.canvas,
          backgroundColor: result.data.canvas.background?.layers[0]?.colorStops[0]?.color || '#1e293b'
        }
      };

      if (isGuest) {
        const localProject: LocalProject = {
          ...newProject,
          id: `guest-${Date.now()}`,
          thumbnail: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updatedProjects = [localProject, ...(projects as LocalProject[])];
        setProjects(updatedProjects);
        saveGuestProjects(updatedProjects);
        navigate(`/editor?project=${localProject.id}`);
      } else {
        try {
          const projectSize = StorageService.calculateProjectSize(newProject.data);

          const storageCheck = await StorageService.canUploadProject(user!.id, projectSize);
          if (!storageCheck.canUpload) {
            alert(storageCheck.message || 'Cannot upload project: Storage limit exceeded');
            return;
          }

          const { data, error } = await supabase
            .from('projects')
            .insert({
              user_id: user!.id,
              name: newProject.name,
              data: newProject.data,
              size_bytes: projectSize,
            })
            .select()
            .single();

          if (error) throw error;
          navigate(`/editor?project=${data.id}`);
        } catch (error) {
          console.error('Error creating project from upload:', error);
          alert('Failed to upload project. Please try again.');
        }
      }
    }
  };

  const handleDownloadProject = async () => {
    if (!selectedProject) return;

    const projectData = selectedProject.data;
    if (!projectData?.elements || projectData.elements.length === 0) {
      alert('This project is empty. Open it in the editor and add some content first.');
      return;
    }

    try {
      const canvas = projectData.canvas || {
        width: 3840,
        height: 2160,
        fps: 30,
        unit: 'px' as const,
        grid: { enabled: true, size: 20, snap: true },
        zoom: 1,
        pan: { x: 0, y: 0 }
      };

      const blob = await projectFileService.saveProject({
        projectName: selectedProject.name,
        elements: projectData.elements,
        canvas,
        userId: user?.id,
        userName: user?.email
      });

      projectFileService.downloadProject(blob, selectedProject.name);
    } catch (error) {
      console.error('Error downloading project:', error);
      alert('Failed to download project. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {!loadTimeout ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-slate-300 text-lg mb-2">
                {authLoading ? 'Initializing...' : 'Loading your workspace...'}
              </p>
              <p className="text-slate-400 text-sm">
                This should only take a moment
              </p>
            </>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="text-amber-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Loading Timeout</h2>
              <p className="text-slate-300 mb-6">
                We're having trouble loading your workspace. This may be due to a slow connection or a temporary issue.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setLoadTimeout(false);
                    setLoading(true);
                    if (user) {
                      loadProjects();
                    } else {
                      loadGuestProjects();
                    }
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('guestMode', 'true');
                    setLoadTimeout(false);
                    navigate('/home');
                    window.location.reload();
                  }}
                  className="w-full border-2 border-slate-600 hover:border-amber-500 bg-slate-800/50 hover:bg-slate-700/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayUsername = isGuest ? 'Guest User' : (profile?.username || profile?.email || 'User');

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      <nav className="relative border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="text-sm text-slate-400">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>

            <div className="flex items-center gap-4">
              {!isGuest && <StorageIndicator variant="compact" />}
              {!isGuest && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/30 border border-slate-600 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-white">@{displayUsername}</span>
                </div>
              )}
              {isGuest ? (
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-700/50 bg-slate-800/20 flex flex-col">
          <div className="p-6 border-b border-slate-700/50 space-y-3">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              NEW PROJECT
            </button>
            <button
              onClick={() => setShowLoadProjectModal(true)}
              className="w-full flex items-center justify-center gap-3 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-white font-medium rounded-xl transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
              UPLOAD PROJECT
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No projects yet</p>
                <p className="text-sm text-slate-500 mt-2">Click "NEW PROJECT" to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedProject?.id === project.id
                        ? 'bg-amber-500/20 border-2 border-amber-500'
                        : 'bg-slate-700/30 hover:bg-slate-700/50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{project.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteProjectClick(project, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-2/3 flex flex-col bg-slate-800/10">
          {selectedProject ? (
            <>
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="w-full max-w-3xl aspect-video bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl border-2 border-slate-700/50 flex items-center justify-center overflow-hidden shadow-2xl">
                  {selectedProject.thumbnail ? (
                    <img
                      src={selectedProject.thumbnail}
                      alt="Project preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-24 h-24 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg font-medium">PREVIEW</p>
                      <p className="text-slate-500 text-sm mt-2">No preview available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-700/50 bg-slate-800/30 p-8">
                <div className="max-w-3xl mx-auto">
                  <label className="block text-sm font-medium text-slate-400 mb-3">
                    Project Title ({projectTitle.length}/150)
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    maxLength={150}
                    placeholder="Enter project title..."
                    className="w-full px-6 py-4 bg-slate-700/50 border-2 border-slate-600 hover:border-slate-500 focus:border-amber-500 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-colors text-lg"
                  />
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={handleOpenProject}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Open in Editor
                    </button>
                    <button
                      onClick={handleDownloadProject}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-white font-medium rounded-lg transition-all duration-200"
                    >
                      <Download className="w-4 h-4" />
                      Download Project
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Project Selected</h3>
                <p className="text-slate-400">Create a new project or select one from the list</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={handleNewProject}
      />

      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name || ''}
      />

      <LoadProjectModal
        isOpen={showLoadProjectModal}
        onClose={() => setShowLoadProjectModal(false)}
        onLoad={handleUploadProject}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
