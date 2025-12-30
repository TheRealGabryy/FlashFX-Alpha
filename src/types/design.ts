export interface DesignElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'button' | 'chat-bubble' | 'chat-frame' | 'input' | 'toggle' | 'modal' | 'progress' | 'group' | 'line' | 'image';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  
  // Style properties
  fill: string;
  gradientEnabled?: boolean;
  gradientType?: 'linear' | 'radial';
  gradientColors?: Array<{ color: string; position: number; id: string }>;
  gradientAngle?: number;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  shadow: {
    blur: number;
    color: string;
    x: number;
    y: number;
  };
  
  // Text properties (for text elements)
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  wordSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
  
  // Line properties (for line elements)
  lineType?: 'line' | 'arrow' | 'pen';
  points?: Array<{ x: number; y: number; smooth?: boolean; radius?: number }>;
  cornerRadius?: number; // Global corner radius for line connections
  pointCornerRadii?: number[]; // Per-point corner radius values
  arrowStart?: boolean;
  arrowEnd?: boolean;
  arrowheadType?: 'triangle' | 'circle' | 'bar' | 'diamond';
  arrowheadSize?: number;
  lineCap?: 'round' | 'butt' | 'square';
  lineJoin?: 'round' | 'bevel' | 'miter';
  dashArray?: number[];
  dashIntensity?: number;
  smoothing?: number;
  trimStart?: number;
  trimEnd?: number;
  closePath?: boolean;
  autoScaleArrows?: boolean;
  
  // UI-specific properties
  variant?: string;
  isActive?: boolean;
  progress?: number;
  
  // Group properties
  children?: DesignElement[];
  parentId?: string;

  // Image properties (for image elements)
  imageData?: string; // base64 or blob URL
  originalWidth?: number;
  originalHeight?: number;
  aspectRatioLocked?: boolean;
  filters?: ImageFilters;
  blendMode?: BlendMode;
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Video/Clip properties (for video editing mode)
  clipProperties?: ClipProperties;
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface ImageFilters {
  // Basic Adjustments
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  exposure: number; // -100 to 100
  gamma: number; // 0.1 to 3.0 (default 1.0)
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  vibrance: number; // -100 to 100
  saturation: number; // -100 to 100

  // HSL Adjustments
  hue: number; // -180 to 180
  lightness: number; // -100 to 100
  grayscale: number; // 0 to 100
  invert: boolean;
  sepia: number; // 0 to 100

  // Color Balance
  shadowsRed: number; // -100 to 100
  shadowsGreen: number; // -100 to 100
  shadowsBlue: number; // -100 to 100
  midtonesRed: number; // -100 to 100
  midtonesGreen: number; // -100 to 100
  midtonesBlue: number; // -100 to 100
  highlightsRed: number; // -100 to 100
  highlightsGreen: number; // -100 to 100
  highlightsBlue: number; // -100 to 100

  // Levels
  levelsBlackPoint: number; // 0 to 255
  levelsMidPoint: number; // 0.1 to 9.99 (default 1.0)
  levelsWhitePoint: number; // 0 to 255

  // RGB Channels
  redChannel: number; // -100 to 100
  greenChannel: number; // -100 to 100
  blueChannel: number; // -100 to 100

  // Blur Effects
  gaussianBlur: number; // 0 to 100
  motionBlurAngle: number; // 0 to 360
  motionBlurDistance: number; // 0 to 100
  radialBlurAmount: number; // 0 to 100
  radialBlurCenterX: number; // 0 to 1 (percentage)
  radialBlurCenterY: number; // 0 to 1 (percentage)
  boxBlur: number; // 0 to 100
  surfaceBlur: number; // 0 to 100

  // Sharpen
  unsharpAmount: number; // 0 to 100
  unsharpRadius: number; // 0 to 100
  unsharpThreshold: number; // 0 to 100
  sharpen: number; // 0 to 100
  clarity: number; // -100 to 100

  // Noise
  addNoise: number; // 0 to 100
  noiseType: 'uniform' | 'gaussian' | 'monochrome';
  reduceNoise: number; // 0 to 100
  median: number; // 0 to 100

  // Distortion
  rippleAmplitude: number; // -100 to 100
  rippleWavelength: number; // 1 to 100
  twirlAngle: number; // -360 to 360
  twirlRadius: number; // 0 to 100
  waveHorizontal: number; // -100 to 100
  waveVertical: number; // -100 to 100
  spherize: number; // -100 to 100
  pinch: number; // -100 to 100
  bulge: number; // 0 to 100

  // Lens Effects
  vignetteAmount: number; // 0 to 100
  vignetteRoundness: number; // 0 to 100
  vignetteFeather: number; // 0 to 100
  lensFlare: number; // 0 to 100
  lensFlareX: number; // 0 to 1
  lensFlareY: number; // 0 to 1
  chromaticAberration: number; // 0 to 100
  lensDistortion: number; // -100 to 100

  // Stylize
  oilPaintBrush: number; // 0 to 100
  oilPaintDetail: number; // 0 to 100
  cartoonEdge: number; // 0 to 100
  cartoonColors: number; // 2 to 20
  glowingEdgesWidth: number; // 0 to 100
  glowingEdgesIntensity: number; // 0 to 100
  sketchDetail: number; // 0 to 100
  sketchShading: number; // 0 to 100
  watercolorGranularity: number; // 0 to 100
  watercolorIntensity: number; // 0 to 100
  embossAngle: number; // 0 to 360
  embossAmount: number; // 0 to 100
  edgeDetection: number; // 0 to 100
  pixelate: number; // 1 to 100
  mosaic: number; // 1 to 100

  // Special Effects
  posterize: number; // 2 to 256
  solarize: number; // 0 to 255
  threshold: number; // 0 to 255
  halftone: number; // 0 to 100
  crystallize: number; // 0 to 100;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  selectedTool: string;
}

export interface ClipProperties {
  startTime: number;
  duration: number;
  endTime: number;
  trackIndex: number;
  locked: boolean;
  muted: boolean;
  color?: string;
  speed: number;
  fadeIn?: number;
  fadeOut?: number;
  animations?: ClipAnimation[];
}

export interface ClipAnimation {
  id: string;
  property: 'x' | 'y' | 'rotation' | 'scale' | 'opacity' | 'width' | 'height';
  keyframes: ClipKeyframe[];
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface ClipKeyframe {
  time: number;
  value: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface VideoTrack {
  id: string;
  name: string;
  elementId: string;
  visible: boolean;
  locked: boolean;
  height: number;
}

export interface VideoTimeline {
  duration: number;
  currentTime: number;
  fps: number;
  tracks: VideoTrack[];
  isPlaying: boolean;
  loop: boolean;
}