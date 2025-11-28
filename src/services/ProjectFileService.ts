import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { DesignElement } from '../types/design';
import { Animation } from '../types/project';
import {
  ProjectManifest,
  ProjectCanvas,
  ProjectProperties,
  ShapeKeyframes,
  AssetManifest,
  AssetReference,
  FontReference,
  ProjectFileStructure,
  LoadProjectResult,
  SaveProjectOptions,
} from '../types/projectFile';
import {
  hashBlob,
  hashBase64,
  base64ToBlob,
  getFileExtension,
  getMimeTypeFromBase64,
  sanitizeFilename,
} from '../utils/hashUtils';

export class ProjectFileService {
  private static readonly SCHEMA_VERSION = 1;
  private static readonly FILE_EXTENSION = '.ffxproj';

  public async saveProject(options: SaveProjectOptions): Promise<Blob> {
    const zip = new JSZip();
    const projectId = uuidv4();
    const now = new Date().toISOString();

    const assetData = await this.extractAssets(options.elements);

    const manifest: ProjectManifest = {
      schemaVersion: ProjectFileService.SCHEMA_VERSION,
      proj_id: projectId,
      name: options.projectName,
      createdAt: now,
      updatedAt: now,
      author: options.userId ? {
        id: options.userId,
        name: options.userName || undefined,
      } : undefined,
      folders: {
        canvas: '/canvas',
        shapes: '/shapes',
        keyframes: '/keyframes',
        properties: '/properties',
        assets: '/assets',
      },
      counts: {
        elements: options.elements.length,
        animations: options.animations ? Object.keys(options.animations).length : 0,
        images: Object.keys(assetData.assetManifest.images).length,
        fonts: Object.keys(assetData.assetManifest.fonts).length,
        videos: Object.keys(assetData.assetManifest.videos).length,
      },
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    zip.file('canvas/canvas.json', JSON.stringify(options.canvas, null, 2));

    const properties: ProjectProperties = {
      defaultEasing: options.properties?.defaultEasing || 'ease-in-out',
      exportDefaults: options.properties?.exportDefaults || {
        format: 'png',
        quality: 0.95,
      },
      autosaveIntervalMs: options.properties?.autosaveIntervalMs || 30000,
      editor: {
        gridSnap: options.properties?.editor?.gridSnap ?? options.canvas.grid.snap,
        showRulers: options.properties?.editor?.showRulers ?? false,
        showGrid: options.properties?.editor?.showGrid ?? options.canvas.grid.enabled,
      },
      metadata: {
        tags: options.properties?.metadata?.tags || [],
        description: options.properties?.metadata?.description || '',
        thumbnail: options.properties?.metadata?.thumbnail || null,
        protected: options.properties?.metadata?.protected || false,
        versionLabel: options.properties?.metadata?.versionLabel || 'v1.0',
      },
    };

    zip.file('properties/properties.json', JSON.stringify(properties, null, 2));

    for (const element of options.elements) {
      const updatedElement = await this.updateElementAssetReferences(
        element,
        assetData.assetManifest
      );
      const filename = `shapes/${sanitizeFilename(element.id)}.json`;
      zip.file(filename, JSON.stringify(updatedElement, null, 2));
    }

    if (options.animations) {
      const elementAnimations: Record<string, Animation[]> = {};

      for (const [animId, animation] of Object.entries(options.animations)) {
        const elementId = animation.elementId;
        if (!elementAnimations[elementId]) {
          elementAnimations[elementId] = [];
        }
        elementAnimations[elementId].push(animation);
      }

      for (const [elementId, animations] of Object.entries(elementAnimations)) {
        const keyframes: ShapeKeyframes = {
          elementId,
          animations,
        };
        const filename = `keyframes/${sanitizeFilename(elementId)}_keyframes.json`;
        zip.file(filename, JSON.stringify(keyframes, null, 2));
      }
    }

    zip.file('assets/manifest.json', JSON.stringify(assetData.assetManifest, null, 2));

    for (const [hash, blob] of Object.entries(assetData.images)) {
      zip.file(`assets/images/${hash}`, blob);
    }

    for (const [hash, blob] of Object.entries(assetData.fonts)) {
      zip.file(`assets/fonts/${hash}`, blob);
    }

    for (const [hash, blob] of Object.entries(assetData.videos)) {
      zip.file(`assets/videos/${hash}`, blob);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
  }

  public async loadProject(file: File): Promise<LoadProjectResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const zip = await JSZip.loadAsync(file);

      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        errors.push('Missing manifest.json');
        return { success: false, errors };
      }

      const manifestContent = await manifestFile.async('string');
      const manifest: ProjectManifest = JSON.parse(manifestContent);

      if (manifest.schemaVersion > ProjectFileService.SCHEMA_VERSION) {
        errors.push(
          `Project was created with a newer version (schema v${manifest.schemaVersion}). Please update FlashFX.`
        );
        return { success: false, errors };
      }

      const canvasFile = zip.file('canvas/canvas.json');
      if (!canvasFile) {
        errors.push('Missing canvas/canvas.json');
        return { success: false, errors };
      }
      const canvasContent = await canvasFile.async('string');
      const canvas: ProjectCanvas = JSON.parse(canvasContent);

      const propertiesFile = zip.file('properties/properties.json');
      let properties: ProjectProperties;
      if (propertiesFile) {
        const propertiesContent = await propertiesFile.async('string');
        properties = JSON.parse(propertiesContent);
      } else {
        warnings.push('Missing properties.json, using defaults');
        properties = this.getDefaultProperties();
      }

      const assetManifestFile = zip.file('assets/manifest.json');
      let assetManifest: AssetManifest;
      if (assetManifestFile) {
        const assetManifestContent = await assetManifestFile.async('string');
        assetManifest = JSON.parse(assetManifestContent);
      } else {
        warnings.push('Missing assets/manifest.json, no assets loaded');
        assetManifest = { images: {}, fonts: {}, videos: {} };
      }

      const loadedAssets = await this.loadAssets(zip, assetManifest);

      const shapes: Record<string, DesignElement> = {};
      const shapesFolder = zip.folder('shapes');
      if (shapesFolder) {
        const shapeFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
        shapesFolder.forEach((relativePath, file) => {
          if (relativePath.endsWith('.json')) {
            shapeFiles.push({ name: relativePath, file });
          }
        });

        for (const { file } of shapeFiles) {
          try {
            const shapeContent = await file.async('string');
            const shape: DesignElement = JSON.parse(shapeContent);
            const restoredShape = await this.restoreElementAssetReferences(
              shape,
              loadedAssets,
              assetManifest
            );
            shapes[shape.id] = restoredShape;
          } catch (err) {
            warnings.push(`Failed to load shape from ${file.name}: ${err}`);
          }
        }
      }

      const keyframes: Record<string, ShapeKeyframes> = {};
      const keyframesFolder = zip.folder('keyframes');
      if (keyframesFolder) {
        const keyframeFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
        keyframesFolder.forEach((relativePath, file) => {
          if (relativePath.endsWith('.json')) {
            keyframeFiles.push({ name: relativePath, file });
          }
        });

        for (const { file } of keyframeFiles) {
          try {
            const keyframeContent = await file.async('string');
            const shapeKeyframes: ShapeKeyframes = JSON.parse(keyframeContent);
            keyframes[shapeKeyframes.elementId] = shapeKeyframes;
          } catch (err) {
            warnings.push(`Failed to load keyframes from ${file.name}: ${err}`);
          }
        }
      }

      const structure: ProjectFileStructure = {
        manifest,
        canvas,
        properties,
        shapes,
        keyframes,
        assets: loadedAssets,
        assetManifest,
      };

      return {
        success: true,
        data: structure,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (err) {
      errors.push(`Failed to load project: ${err}`);
      return { success: false, errors };
    }
  }

  private async extractAssets(elements: DesignElement[]): Promise<{
    images: Record<string, Blob>;
    fonts: Record<string, Blob>;
    videos: Record<string, Blob>;
    assetManifest: AssetManifest;
  }> {
    const images: Record<string, Blob> = {};
    const fonts: Record<string, Blob> = {};
    const videos: Record<string, Blob> = {};
    const assetManifest: AssetManifest = {
      images: {},
      fonts: {},
      videos: {},
    };

    for (const element of elements) {
      if (element.type === 'image' && element.imageData) {
        try {
          const blob = await base64ToBlob(element.imageData);
          const hash = await hashBlob(blob);
          const mimeType = getMimeTypeFromBase64(element.imageData);
          const extension = mimeType ? getFileExtension(mimeType) : 'png';
          const filename = `${hash}.${extension}`;

          if (!images[filename]) {
            images[filename] = blob;
            assetManifest.images[element.id] = {
              hash,
              filename,
              originalName: element.name || 'image',
              width: element.originalWidth,
              height: element.originalHeight,
              format: extension,
            };
          }
        } catch (err) {
          console.warn(`Failed to extract image from element ${element.id}:`, err);
        }
      }

      if (element.children) {
        const childAssets = await this.extractAssets(element.children);
        Object.assign(images, childAssets.images);
        Object.assign(fonts, childAssets.fonts);
        Object.assign(videos, childAssets.videos);
        Object.assign(assetManifest.images, childAssets.assetManifest.images);
        Object.assign(assetManifest.fonts, childAssets.assetManifest.fonts);
        Object.assign(assetManifest.videos, childAssets.assetManifest.videos);
      }
    }

    return { images, fonts, videos, assetManifest };
  }

  private async updateElementAssetReferences(
    element: DesignElement,
    assetManifest: AssetManifest
  ): Promise<DesignElement> {
    const updated = { ...element };

    if (updated.type === 'image' && updated.imageData) {
      const assetRef = assetManifest.images[element.id];
      if (assetRef) {
        updated.imageData = `@asset:images/${assetRef.filename}`;
      }
    }

    if (updated.children) {
      updated.children = await Promise.all(
        updated.children.map((child) => this.updateElementAssetReferences(child, assetManifest))
      );
    }

    return updated;
  }

  private async loadAssets(
    zip: JSZip,
    assetManifest: AssetManifest
  ): Promise<{
    images: Record<string, Blob>;
    fonts: Record<string, Blob>;
    videos: Record<string, Blob>;
  }> {
    const images: Record<string, Blob> = {};
    const fonts: Record<string, Blob> = {};
    const videos: Record<string, Blob> = {};

    for (const [elementId, assetRef] of Object.entries(assetManifest.images)) {
      const file = zip.file(`assets/images/${assetRef.filename}`);
      if (file) {
        const blob = await file.async('blob');
        images[elementId] = blob;
      }
    }

    for (const [elementId, fontRef] of Object.entries(assetManifest.fonts)) {
      const file = zip.file(`assets/fonts/${fontRef.filename}`);
      if (file) {
        const blob = await file.async('blob');
        fonts[elementId] = blob;
      }
    }

    for (const [elementId, assetRef] of Object.entries(assetManifest.videos)) {
      const file = zip.file(`assets/videos/${assetRef.filename}`);
      if (file) {
        const blob = await file.async('blob');
        videos[elementId] = blob;
      }
    }

    return { images, fonts, videos };
  }

  private async restoreElementAssetReferences(
    element: DesignElement,
    loadedAssets: {
      images: Record<string, Blob>;
      fonts: Record<string, Blob>;
      videos: Record<string, Blob>;
    },
    assetManifest: AssetManifest
  ): Promise<DesignElement> {
    const restored = { ...element };

    if (restored.type === 'image' && restored.imageData?.startsWith('@asset:')) {
      const blob = loadedAssets.images[element.id];
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        restored.imageData = base64;
      }
    }

    if (restored.children) {
      restored.children = await Promise.all(
        restored.children.map((child) =>
          this.restoreElementAssetReferences(child, loadedAssets, assetManifest)
        )
      );
    }

    return restored;
  }

  private getDefaultProperties(): ProjectProperties {
    return {
      defaultEasing: 'ease-in-out',
      exportDefaults: {
        format: 'png',
        quality: 0.95,
      },
      autosaveIntervalMs: 30000,
      editor: {
        gridSnap: true,
        showRulers: false,
        showGrid: true,
      },
      metadata: {
        tags: [],
        description: '',
        thumbnail: null,
        protected: false,
        versionLabel: 'v1.0',
      },
    };
  }

  public downloadProject(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith(ProjectFileService.FILE_EXTENSION)
      ? filename
      : `${filename}${ProjectFileService.FILE_EXTENSION}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
