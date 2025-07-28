# Project Rules and Code Organization

This document defines the coding standards, file structure, naming conventions, and organizational principles for the AI-first video recording application codebase.

## Directory Structure

### **Root Level Organization**

```
web-video/
├── _docs/                    # Project documentation
├── public/                   # Static assets
├── src/                      # Source code
├── tests/                    # Test files
├── docker/                   # Docker configuration
├── scripts/                  # Build and utility scripts
├── .github/                  # GitHub workflows
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── docker-compose.yml
└── README.md
```

### **Source Code Structure (`src/`)**

```
src/
├── components/               # Reusable UI components
│   ├── ui/                   # Shadcn/ui components
│   ├── video/                # Video-specific components
│   ├── controls/             # Control panel components
│   ├── overlays/             # Overlay and facial tracking components
│   └── layout/               # Layout and navigation components
├── hooks/                    # Custom React hooks
│   ├── video/                # Video recording hooks
│   ├── media/                # Media device hooks
│   ├── tracking/             # Facial tracking hooks
│   └── overlays/             # Overlay management hooks
├── stores/                   # State management (Zustand)
│   ├── video-store.ts        # Video recording state
│   ├── tracking-store.ts     # Facial tracking state
│   ├── overlay-store.ts      # Overlay state
│   └── ui-store.ts           # UI state
├── services/                 # Business logic and external services
│   ├── media/                # Media device services
│   ├── recording/            # Video recording services
│   ├── tracking/             # Facial tracking services
│   └── file/                 # File handling services
├── utils/                    # Utility functions
│   ├── video/                # Video processing utilities
│   ├── tracking/             # Facial tracking utilities
│   ├── file/                 # File handling utilities
│   └── common/               # General utilities
├── types/                    # TypeScript type definitions
│   ├── video.ts              # Video-related types
│   ├── tracking.ts           # Facial tracking types
│   ├── overlay.ts            # Overlay types
│   └── common.ts             # Common types
├── constants/                # Application constants
│   ├── video.ts              # Video constants
│   ├── tracking.ts           # Tracking constants
│   ├── ui.ts                 # UI constants
│   └── config.ts             # App configuration
├── styles/                   # Global styles and theme
│   ├── globals.css           # Global CSS
│   ├── theme.css             # Theme variables
│   └── components.css        # Component styles
├── pages/                    # Page components (if using routing)
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
└── vite-env.d.ts            # Vite type definitions
```

### **Component Organization**

```
components/
├── ui/                       # Base UI components (Shadcn/ui)
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── dropdown/
│   ├── modal/
│   └── index.ts
├── video/                    # Video-specific components
│   ├── VideoPlayer/
│   │   ├── VideoPlayer.tsx
│   │   ├── VideoPlayer.test.tsx
│   │   ├── VideoPlayer.types.ts
│   │   └── index.ts
│   ├── VideoControls/
│   ├── VideoOverlay/
│   └── index.ts
├── controls/                 # Control panel components
│   ├── RecordButton/
│   ├── TrackingToggle/
│   ├── OverlayControls/
│   └── index.ts
├── overlays/                 # Overlay components
│   ├── GlassesOverlay/
│   ├── HatOverlay/
│   ├── FaceTracking/
│   └── index.ts
└── layout/                   # Layout components
    ├── Header/
    ├── Footer/
    ├── Sidebar/
    └── index.ts
```

## File Naming Conventions

### **General Rules**

- **PascalCase**: React components, TypeScript interfaces, classes
- **camelCase**: Functions, variables, file names (non-components)
- **kebab-case**: CSS classes, HTML attributes, URLs
- **UPPER_SNAKE_CASE**: Constants, environment variables

### **Component Files**

```
ComponentName.tsx              # Main component file
ComponentName.test.tsx         # Test file
ComponentName.types.ts         # Type definitions
ComponentName.styles.css       # Component-specific styles
index.ts                       # Barrel export file
```

### **Hook Files**

```
useHookName.ts                 # Custom hook
useHookName.test.ts            # Hook tests
useHookName.types.ts           # Hook type definitions
```

### **Service Files**

```
serviceName.service.ts         # Service implementation
serviceName.types.ts           # Service types
serviceName.test.ts            # Service tests
```

### **Store Files**

```
storeName.store.ts             # Zustand store
storeName.types.ts             # Store types
storeName.test.ts              # Store tests
```

## File Content Standards

### **File Header Documentation**

Every file must begin with a descriptive header comment:

```typescript
/**
 * @fileoverview Video recording component that handles camera input and recording functionality.
 *
 * This component provides:
 * - Camera feed display
 * - Recording start/stop functionality
 * - File download capabilities
 * - Integration with facial tracking
 *
 * @author Your Name
 * @version 1.0.0
 * @since 2024-01-01
 */

import React from "react";
// ... rest of the file
```

### **Function Documentation (JSDoc/TSDoc)**

All functions must be documented with comprehensive JSDoc comments:

````typescript
/**
 * Starts video recording with the specified settings.
 *
 * @description Initiates video recording using the MediaRecorder API with the given
 * configuration. Handles both video and audio streams, manages recording state,
 * and provides real-time feedback to the user.
 *
 * @param {RecordingConfig} config - Configuration object for recording settings
 * @param {number} config.quality - Video quality (0.1 to 1.0)
 * @param {string} config.format - Output format ('webm', 'mp4', etc.)
 * @param {boolean} config.includeAudio - Whether to include audio in recording
 *
 * @returns {Promise<RecordingResult>} Promise that resolves with recording result
 *
 * @throws {MediaError} When camera or microphone access is denied
 * @throws {RecordingError} When recording fails to start
 *
 * @example
 * ```typescript
 * const result = await startRecording({
 *   quality: 0.8,
 *   format: 'webm',
 *   includeAudio: true
 * });
 * ```
 *
 * @since 1.0.0
 * @author Your Name
 */
async function startRecording(config: RecordingConfig): Promise<RecordingResult> {
  // Implementation
}
````

### **Component Documentation**

React components must include comprehensive documentation:

````typescript
/**
 * Video recording component with facial tracking and overlay support.
 *
 * @component VideoRecorder
 * @description Main component for video recording functionality. Integrates
 * camera feed, recording controls, facial tracking, and overlay management
 * into a single cohesive interface.
 *
 * @example
 * ```tsx
 * <VideoRecorder
 *   onRecordingStart={handleRecordingStart}
 *   onRecordingStop={handleRecordingStop}
 *   enableTracking={true}
 *   overlays={['glasses', 'hat']}
 * />
 * ```
 */
interface VideoRecorderProps {
  /** Callback fired when recording starts */
  onRecordingStart?: (config: RecordingConfig) => void;
  /** Callback fired when recording stops */
  onRecordingStop?: (result: RecordingResult) => void;
  /** Whether to enable facial tracking */
  enableTracking?: boolean;
  /** Array of overlay types to enable */
  overlays?: OverlayType[];
  /** Custom CSS class name */
  className?: string;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onRecordingStart,
  onRecordingStop,
  enableTracking = false,
  overlays = [],
  className,
}) => {
  // Component implementation
};
````

## Code Organization Rules

### **Line Limit Enforcement**

- **Maximum 500 lines per file**: Enforces modularity and readability
- **Maximum 80 characters per line**: Ensures compatibility with various tools
- **Maximum 20 lines per function**: Promotes single responsibility principle

### **Import Organization**

```typescript
// 1. External libraries (React, third-party)
import React, { useState, useEffect } from "react";
import { zustand } from "zustand";

// 2. Internal modules (absolute imports)
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useVideoStore } from "@/stores/video-store";

// 3. Relative imports (same directory or nearby)
import { Button } from "./Button";
import { VideoTypes } from "../types/video";

// 4. Type imports
import type { VideoConfig } from "@/types/video";
```

### **Export Organization**

```typescript
// 1. Named exports (preferred for components)
export { VideoRecorder } from "./VideoRecorder";
export { VideoPlayer } from "./VideoPlayer";

// 2. Default exports (for main component files)
export default VideoRecorder;

// 3. Type exports
export type { VideoRecorderProps } from "./VideoRecorder.types";
```

## TypeScript Standards

### **Type Definitions**

- **Interfaces**: For object shapes and component props
- **Types**: For unions, intersections, and complex types
- **Enums**: Avoid in favor of const assertions

```typescript
// ✅ Preferred: Interface for object shapes
interface RecordingConfig {
  quality: number;
  format: VideoFormat;
  includeAudio: boolean;
}

// ✅ Preferred: Type for unions
type VideoFormat = "webm" | "mp4" | "avi";

// ✅ Preferred: Const assertion instead of enum
const OVERLAY_TYPES = {
  GLASSES: "glasses",
  HAT: "hat",
  MASK: "mask",
} as const;

type OverlayType = (typeof OVERLAY_TYPES)[keyof typeof OVERLAY_TYPES];
```

### **Strict TypeScript Configuration**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## State Management Rules

### **Zustand Store Structure**

```typescript
/**
 * @fileoverview Video recording state management using Zustand.
 *
 * Manages:
 * - Recording state (idle, recording, paused, stopped)
 * - Video configuration
 * - Recording metadata
 * - Error states
 */

interface VideoState {
  // State properties
  isRecording: boolean;
  recordingTime: number;
  videoConfig: VideoConfig;
  error: string | null;

  // Actions
  startRecording: (config: VideoConfig) => Promise<void>;
  stopRecording: () => Promise<RecordingResult>;
  setError: (error: string) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  // Initial state
  isRecording: false,
  recordingTime: 0,
  videoConfig: DEFAULT_CONFIG,
  error: null,

  // Actions
  startRecording: async (config) => {
    // Implementation
  },

  stopRecording: async () => {
    // Implementation
  },

  setError: (error) => set({ error }),

  reset: () =>
    set({
      isRecording: false,
      recordingTime: 0,
      error: null,
    }),
}));
```

## Testing Standards

### **Test File Organization**

```typescript
/**
 * @fileoverview Tests for VideoRecorder component.
 *
 * Tests:
 * - Component rendering
 * - User interactions
 * - State changes
 * - Error handling
 * - Integration with stores
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { VideoRecorder } from "./VideoRecorder";

describe("VideoRecorder", () => {
  describe("rendering", () => {
    it("should render video feed when camera is available", () => {
      // Test implementation
    });
  });

  describe("recording functionality", () => {
    it("should start recording when record button is clicked", async () => {
      // Test implementation
    });
  });
});
```

### **Test Naming Conventions**

- **Describe blocks**: Component or function name
- **Test cases**: Descriptive action or scenario
- **Use present tense**: "should", "can", "will"

## Performance Guidelines

### **Code Splitting**

- **Route-based splitting**: Each page loads independently
- **Component-based splitting**: Heavy components loaded on demand
- **Library splitting**: Third-party libraries in separate chunks

### **Optimization Rules**

- **Memoization**: Use React.memo for expensive components
- **Callback optimization**: Use useCallback for event handlers
- **Effect optimization**: Use useMemo for expensive calculations
- **Bundle analysis**: Regular bundle size monitoring

## Accessibility Standards

### **WCAG 2.1 AA Compliance**

- **Semantic HTML**: Proper use of HTML elements
- **ARIA labels**: Descriptive labels for interactive elements
- **Keyboard navigation**: Full keyboard accessibility
- **Color contrast**: Minimum 4.5:1 ratio
- **Focus management**: Clear focus indicators

### **Implementation Checklist**

```typescript
// ✅ Proper semantic HTML
<button
  aria-label="Start video recording"
  aria-describedby="recording-help"
  onClick={handleRecordingStart}
>
  Record
</button>

// ✅ ARIA support
<div role="status" aria-live="polite">
  {recordingStatus}
</div>
```

## Error Handling

### **Error Boundaries**

```typescript
/**
 * @fileoverview Error boundary for video recording components.
 *
 * Catches and handles errors in the video recording component tree,
 * providing fallback UI and error reporting.
 */

class VideoErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Implementation
}
```

### **Error Types**

- **User errors**: Invalid input, permission denied
- **System errors**: Network issues, device unavailable
- **Application errors**: State inconsistencies, unexpected behavior

## Documentation Standards

### **README Structure**

```markdown
# Project Name

Brief description of the video recording application.

## Features

- Video recording with facial tracking
- Overlay support (glasses, hat)
- Real-time processing
- File download capabilities

## Getting Started

Installation and setup instructions.

## Architecture

High-level overview of the codebase structure.

## Contributing

Development guidelines and contribution process.
```

### **API Documentation**

- **OpenAPI/Swagger**: For any backend APIs
- **JSDoc**: For all public functions and components
- **Storybook**: For component documentation and testing

## Git Workflow

### **Branch Naming**

- `feature/video-recording`: New features
- `fix/recording-bug`: Bug fixes
- `refactor/state-management`: Code refactoring
- `docs/api-documentation`: Documentation updates

### **Commit Messages**

```
feat: add facial tracking overlay support

- Implement glasses and hat overlay components
- Add overlay positioning based on facial landmarks
- Integrate with MediaPipe face detection
- Add overlay toggle controls

Closes #123
```

### **Pull Request Template**

- **Description**: What changes were made
- **Testing**: How to test the changes
- **Screenshots**: Visual changes (if applicable)
- **Checklist**: Pre-merge verification items

This comprehensive set of rules ensures the codebase remains modular, scalable, and AI-friendly while maintaining high code quality and developer productivity.
