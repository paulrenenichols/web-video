/**
 * @fileoverview Performance monitoring React hook.
 *
 * Provides real-time performance monitoring, memory tracking,
 * and optimization suggestions for the application.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPerformanceConfig, PERFORMANCE_METRICS, PERFORMANCE_EVENTS } from '@/config/performance';
import {
  getMemoryInfo,
  isMemoryUsageExceeded,
  recordCustomMetric,
  createPerformanceObserver,
  shouldSamplePerformance,
  PerformanceMetric,
  MemoryInfo,
  FrameRateInfo,
  calculateFrameRate,
} from '@/utils/performance';

/**
 * Performance monitoring state
 */
interface PerformanceState {
  /** Current memory usage information */
  memoryInfo: MemoryInfo | null;
  /** Current frame rate information */
  frameRateInfo: FrameRateInfo | null;
  /** Performance metrics history */
  metrics: PerformanceMetric[];
  /** Whether memory usage exceeds threshold */
  isMemoryExceeded: boolean;
  /** Whether performance monitoring is enabled */
  isMonitoringEnabled: boolean;
  /** Performance optimization suggestions */
  suggestions: string[];
}

/**
 * Performance monitoring actions
 */
interface PerformanceActions {
  /** Record a custom performance metric */
  recordMetric: (name: string, value: number, unit?: string, metadata?: Record<string, any>) => void;
  /** Start frame rate monitoring */
  startFrameRateMonitoring: () => void;
  /** Stop frame rate monitoring */
  stopFrameRateMonitoring: () => void;
  /** Clear performance metrics */
  clearMetrics: () => void;
  /** Get performance report */
  getPerformanceReport: () => PerformanceReport;
}

/**
 * Performance report interface
 */
interface PerformanceReport {
  /** Summary of performance metrics */
  summary: {
    averageMemoryUsage: number;
    averageFrameRate: number;
    totalMetrics: number;
    memoryWarnings: number;
    performanceIssues: number;
  };
  /** Detailed metrics */
  metrics: PerformanceMetric[];
  /** Optimization suggestions */
  suggestions: string[];
  /** Timestamp of report generation */
  timestamp: number;
}

/**
 * Performance monitoring hook
 */
export const usePerformance = (): PerformanceState & PerformanceActions => {
  const config = getPerformanceConfig();
  const [state, setState] = useState<PerformanceState>({
    memoryInfo: null,
    frameRateInfo: null,
    metrics: [],
    isMemoryExceeded: false,
    isMonitoringEnabled: config.monitoring.enabled,
    suggestions: [],
  });

  const frameTimestampsRef = useRef<number[]>([]);
  const frameRateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const memoryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  /**
   * Update memory information
   */
  const updateMemoryInfo = useCallback(() => {
    const memoryInfo = getMemoryInfo();
    const isExceeded = isMemoryUsageExceeded();
    
    setState(prev => ({
      ...prev,
      memoryInfo,
      isMemoryExceeded: isExceeded,
    }));

    if (memoryInfo) {
      recordCustomMetric(
        PERFORMANCE_METRICS.MEMORY_USAGE,
        memoryInfo.usedJSHeapSizeMB,
        'MB',
        { total: memoryInfo.totalJSHeapSizeMB, limit: memoryInfo.jsHeapSizeLimitMB }
      );
    }

    if (isExceeded) {
      const event = new CustomEvent(PERFORMANCE_EVENTS.MEMORY_WARNING, {
        detail: { memoryInfo, threshold: config.thresholds.maxMemoryUsage },
      });
      window.dispatchEvent(event);
    }
  }, [config.thresholds.maxMemoryUsage]);

  /**
   * Update frame rate information
   */
  const updateFrameRate = useCallback(() => {
    const frameRateInfo = calculateFrameRate(frameTimestampsRef.current);
    
    setState(prev => ({
      ...prev,
      frameRateInfo,
    }));

    if (frameRateInfo.fps > 0) {
      recordCustomMetric(
        PERFORMANCE_METRICS.VIDEO_FPS,
        frameRateInfo.fps,
        'fps',
        { droppedFrames: frameRateInfo.droppedFrames, totalFrames: frameRateInfo.totalFrames }
      );
    }
  }, []);

  /**
   * Record a frame timestamp for FPS calculation
   */
  const recordFrame = useCallback(() => {
    if (shouldSamplePerformance()) {
      frameTimestampsRef.current.push(performance.now());
      
      // Keep only last 60 frames for calculation
      if (frameTimestampsRef.current.length > 60) {
        frameTimestampsRef.current = frameTimestampsRef.current.slice(-60);
      }
    }
  }, []);

  /**
   * Start frame rate monitoring
   */
  const startFrameRateMonitoring = useCallback(() => {
    if (frameRateIntervalRef.current) {
      clearInterval(frameRateIntervalRef.current);
    }

    frameRateIntervalRef.current = setInterval(() => {
      recordFrame();
      updateFrameRate();
    }, 1000); // Update every second
  }, [recordFrame, updateFrameRate]);

  /**
   * Stop frame rate monitoring
   */
  const stopFrameRateMonitoring = useCallback(() => {
    if (frameRateIntervalRef.current) {
      clearInterval(frameRateIntervalRef.current);
      frameRateIntervalRef.current = null;
    }
  }, []);

  /**
   * Record a custom performance metric
   */
  const recordMetric = useCallback((
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>
  ) => {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata: metadata || undefined,
    };

    setState(prev => ({
      ...prev,
      metrics: [...prev.metrics, metric].slice(-100), // Keep last 100 metrics
    }));

    recordCustomMetric(name, value, unit, metadata);
  }, []);

  /**
   * Clear performance metrics
   */
  const clearMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      metrics: [],
    }));
  }, []);

  /**
   * Generate performance suggestions
   */
  const generateSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (state.memoryInfo && state.memoryInfo.usedJSHeapSizeMB > config.thresholds.maxMemoryUsage * 0.8) {
      suggestions.push('Memory usage is approaching the limit. Consider optimizing memory usage.');
    }
    
    if (state.frameRateInfo && state.frameRateInfo.fps < config.thresholds.targetFrameRate * 0.9) {
      suggestions.push('Frame rate is below target. Consider optimizing rendering performance.');
    }
    
    if (state.frameRateInfo && state.frameRateInfo.droppedFrames > 0) {
      suggestions.push('Frames are being dropped. Consider reducing processing load.');
    }

    setState(prev => ({
      ...prev,
      suggestions,
    }));
  }, [state.memoryInfo, state.frameRateInfo, config.thresholds]);

  /**
   * Get performance report
   */
  const getPerformanceReport = useCallback((): PerformanceReport => {
    const memoryMetrics = state.metrics.filter(m => m.name === PERFORMANCE_METRICS.MEMORY_USAGE);
    const fpsMetrics = state.metrics.filter(m => m.name === PERFORMANCE_METRICS.VIDEO_FPS);
    
    const averageMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : 0;
    
    const averageFrameRate = fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length
      : 0;
    
    const memoryWarnings = state.metrics.filter(m => 
      m.name === PERFORMANCE_METRICS.MEMORY_USAGE && m.value > config.thresholds.maxMemoryUsage * 0.8
    ).length;
    
    const performanceIssues = state.metrics.filter(m => 
      m.name === PERFORMANCE_METRICS.VIDEO_FPS && m.value < config.thresholds.targetFrameRate * 0.9
    ).length;

    return {
      summary: {
        averageMemoryUsage,
        averageFrameRate,
        totalMetrics: state.metrics.length,
        memoryWarnings,
        performanceIssues,
      },
      metrics: state.metrics,
      suggestions: state.suggestions,
      timestamp: Date.now(),
    };
  }, [state.metrics, state.suggestions, config.thresholds]);

  // Initialize performance monitoring
  useEffect(() => {
    if (!config.monitoring.enabled) {
      return;
    }

    // Set up memory monitoring
    updateMemoryInfo();
    memoryIntervalRef.current = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    // Set up performance observer for web vitals
    if ('PerformanceObserver' in window) {
      try {
        performanceObserverRef.current = createPerformanceObserver(
          ['navigation', 'measure', 'paint'],
          (entries) => {
            entries.getEntries().forEach((entry: PerformanceEntry) => {
              if (entry.entryType === 'navigation') {
                const navEntry = entry as PerformanceNavigationTiming;
                recordMetric(PERFORMANCE_METRICS.INITIAL_LOAD_TIME, navEntry.loadEventEnd - navEntry.loadEventStart);
              }
            });
          }
        );
      } catch (error) {
        console.warn('Failed to set up performance observer:', error);
      }
    }

    // Set up event listeners for custom metrics
    const handleMetricRecorded = (event: CustomEvent) => {
      const metric = event.detail as PerformanceMetric;
      setState(prev => ({
        ...prev,
        metrics: [...prev.metrics, metric].slice(-100),
      }));
    };

    window.addEventListener('performance:metric-recorded', handleMetricRecorded as EventListener);

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
      if (frameRateIntervalRef.current) {
        clearInterval(frameRateIntervalRef.current);
      }
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
      window.removeEventListener('performance:metric-recorded', handleMetricRecorded as EventListener);
    };
  }, [config.monitoring.enabled, updateMemoryInfo, recordMetric]);

  // Generate suggestions when metrics change
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  return {
    ...state,
    recordMetric,
    startFrameRateMonitoring,
    stopFrameRateMonitoring,
    clearMetrics,
    getPerformanceReport,
  };
}; 