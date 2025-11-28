import { DesignElement } from './design';
import { Animation } from './project';
import { BackgroundConfig } from './background';

export interface ProjectManifest {
  schemaVersion: number;
  proj_id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name?: string;
  };
  folders: {
    canvas: string;
    shapes: string;
    keyframes: string;
    properties: string;
    assets: string;
  };
  counts: {
    elements: number;
    animations: number;
    images: number;
    fonts: number;
    videos: number;
  };
}

export interface ProjectCanvas {
  width: number;
  height: number;
  fps: number;
  unit: 'px' | 'percent';
  background?: BackgroundConfig;
  grid: {
    enabled: boolean;
    size: number;
    snap: boolean;
  };
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface ProjectProperties {
  defaultEasing: string;
  exportDefaults: {
    format: 'webm' | 'mp4' | 'png';
    quality: number;
  };
  autosaveIntervalMs: number;
  editor: {
    gridSnap: boolean;
    showRulers: boolean;
    showGrid: boolean;
  };
  metadata: {
    tags: string[];
    description: string;
    thumbnail: string | null;
    protected: boolean;
    versionLabel: string;
  };
}

export interface ShapeKeyframes {
  elementId: string;
  animations: Animation[];
}

export interface AssetReference {
  hash: string;
  filename: string;
  originalName?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface FontReference {
  hash: string;
  filename: string;
  family: string;
  name: string;
}

export interface AssetManifest {
  images: Record<string, AssetReference>;
  fonts: Record<string, FontReference>;
  videos: Record<string, AssetReference>;
}

export interface ProjectFileStructure {
  manifest: ProjectManifest;
  canvas: ProjectCanvas;
  properties: ProjectProperties;
  shapes: Record<string, DesignElement>;
  keyframes: Record<string, ShapeKeyframes>;
  assets: {
    images: Record<string, Blob>;
    fonts: Record<string, Blob>;
    videos: Record<string, Blob>;
  };
  assetManifest: AssetManifest;
}

export interface LoadProjectResult {
  success: boolean;
  data?: ProjectFileStructure;
  errors?: string[];
  warnings?: string[];
}

export interface SaveProjectOptions {
  projectName: string;
  elements: DesignElement[];
  canvas: ProjectCanvas;
  properties?: Partial<ProjectProperties>;
  animations?: Record<string, Animation>;
  userId?: string | null;
  userName?: string | null;
}
