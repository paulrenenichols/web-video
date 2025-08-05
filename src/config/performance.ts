/**
 * @fileoverview Performance configuration and monitoring settings.
 *
 * Defines performance thresholds, monitoring parameters,
 * and optimization settings for the application.
 */

export interface PerformanceConfig {
  /** Performance thresholds for monitoring */
  thresholds: {
    /** Initial load time threshold in milliseconds */
    initialLoadTime: number;
    /** Video processing frame rate threshold */
    targetFrameRate: number;
    /** Memory usage threshold in MB */
    maxMemoryUsage: number;
    /** Bundle size threshold in KB */
    maxBundleSize: number;
    /** Audio-video sync latency threshold in milliseconds */
    maxSyncLatency: number;
  };
  
  /** Monitoring settings */
  monitoring: {
    /** Enable performance monitoring */
    enabled: boolean;
    /** Sampling rate for performance metrics (0-1) */
    samplingRate: number;
    /** Metrics to track */
    metrics: string[];
    /** Performance observer options */
    observerOptions: PerformanceObserverInit;
  };
  
  /** Optimization settings */
  optimization: {
    /** Enable code splitting */
    codeSplitting: boolean;
    /** Enable lazy loading */
    lazyLoading: boolean;
    /** Enable tree shaking */
    treeShaking: boolean;
    /** Web Worker settings */
    webWorkers: {
      enabled: boolean;
      maxWorkers: number;
      workerTimeout: number;
    };
  };
}

/**
 * Default performance configuration
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  thresholds: {
    initialLoadTime: 3000, // 3 seconds
    targetFrameRate: 60, // 60 FPS
    maxMemoryUsage: 512, // 512 MB
    maxBundleSize: 1000, // 1 MB
    maxSyncLatency: 50, // 50ms
  },
  monitoring: {
    enabled: true,
    samplingRate: 1.0, // 100% sampling
    metrics: [
      'FCP', // First Contentful Paint
      'LCP', // Largest Contentful Paint
      'FID', // First Input Delay
      'CLS', // Cumulative Layout Shift
      'TTFB', // Time to First Byte
      'custom:video-fps', // Custom video FPS metric
      'custom:memory-usage', // Custom memory usage metric
      'custom:bundle-size', // Custom bundle size metric
    ],
    observerOptions: {
      entryTypes: ['navigation', 'measure', 'paint'],
    },
  },
  optimization: {
    codeSplitting: true,
    lazyLoading: true,
    treeShaking: true,
    webWorkers: {
      enabled: true,
      maxWorkers: 4,
      workerTimeout: 30000, // 30 seconds
    },
  },
};

/**
 * Development performance configuration
 */
export const developmentPerformanceConfig: PerformanceConfig = {
  ...defaultPerformanceConfig,
  monitoring: {
    ...defaultPerformanceConfig.monitoring,
    samplingRate: 0.1, // 10% sampling in development
  },
  optimization: {
    ...defaultPerformanceConfig.optimization,
    webWorkers: {
      ...defaultPerformanceConfig.optimization.webWorkers,
      enabled: false, // Disable Web Workers in development for easier debugging
    },
  },
};

/**
 * Get performance configuration based on environment
 */
export const getPerformanceConfig = (): PerformanceConfig => {
  if (import.meta.env.DEV) {
    return developmentPerformanceConfig;
  }
  return defaultPerformanceConfig;
};

/**
 * Performance metric names
 */
export const PERFORMANCE_METRICS = {
  INITIAL_LOAD_TIME: 'initial-load-time',
  VIDEO_FPS: 'video-fps',
  MEMORY_USAGE: 'memory-usage',
  BUNDLE_SIZE: 'bundle-size',
  AUDIO_VIDEO_SYNC: 'audio-video-sync',
  FACIAL_TRACKING_PERFORMANCE: 'facial-tracking-performance',
  RECORDING_PERFORMANCE: 'recording-performance',
  UI_RESPONSIVENESS: 'ui-responsiveness',
} as const;

/**
 * Performance event types
 */
export const PERFORMANCE_EVENTS = {
  METRIC_RECORDED: 'performance:metric-recorded',
  THRESHOLD_EXCEEDED: 'performance:threshold-exceeded',
  OPTIMIZATION_SUGGESTED: 'performance:optimization-suggested',
  MEMORY_WARNING: 'performance:memory-warning',
} as const; 