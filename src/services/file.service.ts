/**
 * @fileoverview File service for download and save functionality.
 *
 * Handles file download, naming, and user interaction for recorded videos.
 */

import type { FileDownloadOptions, RecordingFormat } from '@/types/recording';

export class FileService {
  /**
   * Generate a default filename with timestamp.
   */
  static generateDefaultFilename(format: RecordingFormat = 'webm'): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    return `recording-${timestamp}.${format}`;
  }

  /**
   * Download a blob as a file with the specified options.
   */
  static downloadFile(blob: Blob, options: FileDownloadOptions): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Get file size in human-readable format.
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from MIME type.
   */
  static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'video/ogg': 'ogg',
    };

    return mimeToExt[mimeType] || 'webm';
  }

  /**
   * Validate filename for download.
   */
  static validateFilename(filename: string): boolean {
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      return false;
    }

    // Check length
    if (filename.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize filename for safe download.
   */
  static sanitizeFilename(filename: string): string {
    // Remove invalid characters
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');

    // Ensure it has an extension
    if (!sanitized.includes('.')) {
      sanitized += '.webm';
    }

    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop();
      const name = sanitized.substring(0, sanitized.lastIndexOf('.'));
      sanitized = name.substring(0, 255 - ext!.length - 1) + '.' + ext;
    }

    return sanitized;
  }

  /**
   * Prompt user for filename with validation.
   */
  static promptForFilename(defaultName: string): string | null {
    const filename = prompt('Enter filename for your recording:', defaultName);

    if (filename === null) {
      return null; // User cancelled
    }

    if (!this.validateFilename(filename)) {
      alert(
        'Invalid filename. Please use only letters, numbers, spaces, and common punctuation.'
      );
      return this.promptForFilename(defaultName);
    }

    return this.sanitizeFilename(filename);
  }

  /**
   * Get recording duration in human-readable format.
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
