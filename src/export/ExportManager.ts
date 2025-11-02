import { DesignElement } from '../types/design';
import { CanvasExporter } from './CanvasExporter';
import { ShapeExporter } from './ShapeExporter';
import { ZipExporter } from './ZipExporter';

export interface ExportProgress {
  current: number;
  total: number;
  status: 'idle' | 'exporting' | 'completed' | 'error';
  message: string;
  error?: string;
}

export type ExportMode = 'canvas' | 'zip' | 'selection';

export interface ExportConfig {
  mode: ExportMode;
  projectName: string;
  canvasWidth: number;
  canvasHeight: number;
  customWidth?: number;
  customHeight?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export class ExportManager {
  private canvasExporter: CanvasExporter;
  private shapeExporter: ShapeExporter;
  private zipExporter: ZipExporter;
  private progressCallback?: (progress: ExportProgress) => void;

  constructor() {
    this.canvasExporter = new CanvasExporter();
    this.shapeExporter = new ShapeExporter();
    this.zipExporter = new ZipExporter();
  }

  setProgressCallback(callback: (progress: ExportProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(progress: Partial<ExportProgress>) {
    if (this.progressCallback) {
      const currentProgress: ExportProgress = {
        current: progress.current || 0,
        total: progress.total || 0,
        status: progress.status || 'idle',
        message: progress.message || '',
        error: progress.error
      };
      this.progressCallback(currentProgress);
    }
  }

  async exportCanvas(config: ExportConfig, elements: DesignElement[]): Promise<void> {
    try {
      this.updateProgress({
        status: 'exporting',
        current: 0,
        total: 1,
        message: 'Exporting entire canvas...'
      });

      const width = config.customWidth || config.canvasWidth;
      const height = config.customHeight || config.canvasHeight;
      const format = config.format || 'png';

      await this.canvasExporter.exportFullCanvas(
        elements,
        width,
        height,
        format,
        config.projectName,
        config.quality
      );

      this.updateProgress({
        status: 'completed',
        current: 1,
        total: 1,
        message: 'Canvas exported successfully'
      });
    } catch (error) {
      this.updateProgress({
        status: 'error',
        current: 0,
        total: 1,
        message: 'Export failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async exportShapesAsZip(
    config: ExportConfig,
    elements: DesignElement[]
  ): Promise<void> {
    try {
      const visibleShapes = elements.filter(el => el.visible && el.type !== 'group');
      const total = visibleShapes.length;

      if (total === 0) {
        throw new Error('No visible shapes to export');
      }

      this.updateProgress({
        status: 'exporting',
        current: 0,
        total,
        message: 'Starting export...'
      });

      const exportedBlobs: { name: string; blob: Blob }[] = [];

      for (let i = 0; i < visibleShapes.length; i++) {
        const shape = visibleShapes[i];

        this.updateProgress({
          status: 'exporting',
          current: i,
          total,
          message: `Exporting shape ${i + 1}/${total}: ${shape.name}`
        });

        const blob = await this.shapeExporter.exportShape(
          shape,
          config.canvasWidth,
          config.canvasHeight,
          elements
        );

        const fileName = `${config.projectName}_shape_${String(i).padStart(2, '0')}.png`;
        exportedBlobs.push({ name: fileName, blob });
      }

      this.updateProgress({
        status: 'exporting',
        current: total,
        total,
        message: 'Creating ZIP file...'
      });

      await this.zipExporter.createAndDownloadZip(
        exportedBlobs,
        `${config.projectName}_shapes.zip`
      );

      this.updateProgress({
        status: 'completed',
        current: total,
        total,
        message: `Successfully exported ${total} shapes`
      });
    } catch (error) {
      this.updateProgress({
        status: 'error',
        current: 0,
        total: 0,
        message: 'Export failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async exportSelection(
    config: ExportConfig,
    selectedElements: DesignElement[],
    allElements: DesignElement[]
  ): Promise<void> {
    if (selectedElements.length === 0) {
      throw new Error('No elements selected');
    }

    if (selectedElements.length === 1) {
      try {
        this.updateProgress({
          status: 'exporting',
          current: 0,
          total: 1,
          message: `Exporting ${selectedElements[0].name}...`
        });

        const blob = await this.shapeExporter.exportShape(
          selectedElements[0],
          config.canvasWidth,
          config.canvasHeight,
          allElements
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedElements[0].name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.updateProgress({
          status: 'completed',
          current: 1,
          total: 1,
          message: 'Export completed'
        });
      } catch (error) {
        this.updateProgress({
          status: 'error',
          current: 0,
          total: 1,
          message: 'Export failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } else {
      const total = selectedElements.length;

      try {
        this.updateProgress({
          status: 'exporting',
          current: 0,
          total,
          message: 'Starting export...'
        });

        const exportedBlobs: { name: string; blob: Blob }[] = [];

        for (let i = 0; i < selectedElements.length; i++) {
          const shape = selectedElements[i];

          this.updateProgress({
            status: 'exporting',
            current: i,
            total,
            message: `Exporting ${i + 1}/${total}: ${shape.name}`
          });

          const blob = await this.shapeExporter.exportShape(
            shape,
            config.canvasWidth,
            config.canvasHeight,
            allElements
          );

          const fileName = `${shape.name}.png`;
          exportedBlobs.push({ name: fileName, blob });
        }

        this.updateProgress({
          status: 'exporting',
          current: total,
          total,
          message: 'Creating ZIP file...'
        });

        await this.zipExporter.createAndDownloadZip(
          exportedBlobs,
          `${config.projectName}_selection.zip`
        );

        this.updateProgress({
          status: 'completed',
          current: total,
          total,
          message: `Successfully exported ${total} elements`
        });
      } catch (error) {
        this.updateProgress({
          status: 'error',
          current: 0,
          total,
          message: 'Export failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }
  }

  estimateTime(elementCount: number): number {
    const secondsPerElement = 0.5;
    return Math.ceil(elementCount * secondsPerElement);
  }
}
