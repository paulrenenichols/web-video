/**
 * @fileoverview Performance monitoring component.
 *
 * Displays real-time performance metrics including memory usage,
 * frame rate, and optimization suggestions.
 */

import React from 'react';
import { usePerformance } from '@/hooks/usePerformance';

interface PerformanceMonitorProps {
  /** Whether to show the monitor */
  isVisible?: boolean;
  /** Position of the monitor */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = import.meta.env.DEV,
  position = 'top-right',
}) => {
  const {
    memoryInfo,
    frameRateInfo,
    isMemoryExceeded,
    isMonitoringEnabled,
    suggestions,
    startFrameRateMonitoring,
    stopFrameRateMonitoring,
    clearMetrics,
    getPerformanceReport,
  } = usePerformance();

  const [showDetails, setShowDetails] = React.useState(false);
  const [isFrameRateMonitoring, setIsFrameRateMonitoring] = React.useState(false);

  React.useEffect(() => {
    if (isMonitoringEnabled && !isFrameRateMonitoring) {
      startFrameRateMonitoring();
      setIsFrameRateMonitoring(true);
    }

    return () => {
      if (isFrameRateMonitoring) {
        stopFrameRateMonitoring();
        setIsFrameRateMonitoring(false);
      }
    };
  }, [isMonitoringEnabled, isFrameRateMonitoring, startFrameRateMonitoring, stopFrameRateMonitoring]);

  if (!isVisible || !isMonitoringEnabled) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getMemoryColor = () => {
    if (!memoryInfo) return 'text-gray-400';
    const usagePercent = (memoryInfo.usedJSHeapSizeMB / memoryInfo.jsHeapSizeLimitMB) * 100;
    if (usagePercent > 80) return 'text-red-500';
    if (usagePercent > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getFrameRateColor = () => {
    if (!frameRateInfo) return 'text-gray-400';
    if (frameRateInfo.fps < 30) return 'text-red-500';
    if (frameRateInfo.fps < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleGenerateReport = () => {
    const report = getPerformanceReport();
    console.log('Performance Report:', report);
    
    // Create a downloadable report
    const reportBlob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(reportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm font-mono max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide">Performance</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
            <button
              onClick={clearMetrics}
              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="mb-2">
          <div className="flex justify-between items-center">
            <span className="text-xs">Memory:</span>
            <span className={`text-xs font-bold ${getMemoryColor()}`}>
              {memoryInfo ? `${memoryInfo.usedJSHeapSizeMB}MB` : 'N/A'}
            </span>
          </div>
          {memoryInfo && (
            <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(memoryInfo.usedJSHeapSizeMB / memoryInfo.jsHeapSizeLimitMB) * 100}%`,
                  backgroundColor: isMemoryExceeded ? '#ef4444' : '#10b981',
                }}
              />
            </div>
          )}
        </div>

        {/* Frame Rate */}
        <div className="mb-2">
          <div className="flex justify-between items-center">
            <span className="text-xs">FPS:</span>
            <span className={`text-xs font-bold ${getFrameRateColor()}`}>
              {frameRateInfo ? `${frameRateInfo.fps.toFixed(1)}` : 'N/A'}
            </span>
          </div>
          {frameRateInfo && frameRateInfo.droppedFrames > 0 && (
            <div className="text-xs text-red-400">
              Dropped: {frameRateInfo.droppedFrames}
            </div>
          )}
        </div>

        {/* Memory Warning */}
        {isMemoryExceeded && (
          <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded mb-2">
            ⚠️ Memory usage exceeded threshold
          </div>
        )}

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="space-y-2">
              {/* Memory Details */}
              {memoryInfo && (
                <div>
                  <div className="text-xs text-gray-400">Memory Details:</div>
                  <div className="text-xs">
                    Used: {memoryInfo.usedJSHeapSizeMB}MB / {memoryInfo.jsHeapSizeLimitMB}MB
                  </div>
                  <div className="text-xs">
                    Total: {memoryInfo.totalJSHeapSizeMB}MB
                  </div>
                </div>
              )}

              {/* Frame Rate Details */}
              {frameRateInfo && (
                <div>
                  <div className="text-xs text-gray-400">Frame Details:</div>
                  <div className="text-xs">
                    Frame Time: {frameRateInfo.frameTime}ms
                  </div>
                  <div className="text-xs">
                    Total Frames: {frameRateInfo.totalFrames}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400">Suggestions:</div>
                  <ul className="text-xs text-yellow-400 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateReport}
                  className="w-full text-xs px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
                >
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 