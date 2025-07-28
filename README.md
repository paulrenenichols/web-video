# Web Video Recording Application

A modern, AI-first web application for video recording with real-time facial tracking and overlay capabilities. Built with React, TypeScript, and MediaPipe for Snapchat-like overlay effects.

## 🎯 Project Overview

This application allows users to record videos from their browser with advanced features including:

- **Real-time video recording** with high-quality output
- **Facial tracking** using MediaPipe for precise feature detection
- **Overlay system** for adding glasses and hats to recorded videos
- **Modern UI** with glassmorphic design and smooth animations
- **Production-ready** with comprehensive error handling and optimization

## ✨ Features

### Phase 1: Basic Video Recording

- Camera access and live video feed
- Start/stop recording functionality
- File download with custom naming
- Basic error handling and user guidance

### Phase 2: Facial Tracking

- Real-time facial landmark detection (468 points)
- Visual tracking feedback with outlines and labels
- Multiple face detection support
- Tracking accuracy indicators

### Phase 3: Overlay System

- Glasses overlay with realistic positioning
- Hat overlay with head movement tracking
- Multiple overlay combinations
- Real-time overlay preview

### Phase 4: Advanced Features

- Performance optimization and bundle size reduction
- Advanced overlay customization options
- Multiple recording quality presets
- Export and sharing capabilities

## 🛠 Tech Stack

### Frontend

- **React 18+** with TypeScript 5+
- **Vite** for fast development and building
- **Tailwind CSS 3+** for styling
- **Shadcn/ui** for component library

### Video Processing

- **Web APIs** (MediaDevices, MediaRecorder, Canvas)
- **MediaPipe Face Detection** for facial tracking
- **WebAssembly** for performance optimization

### State Management

- **Zustand** for lightweight state management
- **Custom hooks** for feature-specific logic

### Development Tools

- **ESLint + Prettier** for code quality
- **Vitest** for testing
- **Docker + Docker Compose** for containerization
- **pnpm** for package management

## 🏗 Architecture

### Project Structure

```
web-video/
├── _docs/                    # Project documentation
├── public/                   # Static assets
├── src/                      # Source code
│   ├── components/           # UI components
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── video/           # Video-specific components
│   │   ├── controls/        # Control panel components
│   │   ├── overlays/        # Overlay components
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript definitions
│   ├── constants/           # Application constants
│   └── styles/              # Global styles
├── tests/                   # Test files
└── docker/                  # Docker configuration
```

### Key Components

- **VideoPlayer**: Camera feed display and video element management
- **RecordButton**: Main recording control with state changes
- **FaceTracking**: MediaPipe integration for facial detection
- **OverlaySystem**: Overlay positioning and rendering
- **ControlPanel**: User interface for all controls

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Modern browser with camera support
- HTTPS environment (required for camera access)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd web-video
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Docker Development

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 📖 Development Conventions

### Code Standards

- **File size limit**: Maximum 500 lines per file for AI compatibility
- **Line length**: Maximum 80 characters per line
- **Function length**: Maximum 20 lines per function
- **Documentation**: JSDoc comments for all functions and components
- **TypeScript**: Strict configuration with no implicit any

### File Naming

- **PascalCase**: React components, TypeScript interfaces
- **camelCase**: Functions, variables, file names
- **kebab-case**: CSS classes, HTML attributes
- **UPPER_SNAKE_CASE**: Constants, environment variables

### Component Structure

```typescript
/**
 * @fileoverview Component description and purpose.
 *
 * @component ComponentName
 * @description Detailed description of component functionality.
 */

interface ComponentProps {
  /** Prop description */
  propName: PropType;
}

export const ComponentName: React.FC<ComponentProps> = ({ propName }) => {
  // Component implementation
};
```

### State Management

```typescript
/**
 * @fileoverview Store description and state management.
 */

interface StoreState {
  // State properties
  property: PropertyType;

  // Actions
  action: (param: ParamType) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Implementation
}));
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Test specific file
pnpm test ComponentName.test.tsx
```

### Testing Standards

- **Unit tests**: All components and services
- **Integration tests**: Component interactions
- **E2E tests**: Complete user workflows
- **Coverage target**: 90%+ code coverage

## 🎨 Design System

### Theme

- **Light/Dark mode** support
- **Glassmorphic design** elements
- **Consistent spacing** and typography
- **Accessibility** compliant (WCAG 2.1 AA)

### Colors

- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Danger**: Red (#EF4444)

### Typography

- **Font**: Inter (system fallbacks)
- **Sizes**: 12px to 48px scale
- **Weights**: 300 to 800 range

## 📱 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Required APIs

- MediaDevices API
- MediaRecorder API
- Canvas API
- WebAssembly support

## 🔧 Configuration

### Environment Variables

```bash
# Development
VITE_APP_ENV=development
VITE_APP_API_URL=http://localhost:3000

# Production
VITE_APP_ENV=production
VITE_APP_API_URL=https://api.example.com
```

### Build Configuration

```bash
# Development build
pnpm build:dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

## 📚 Documentation

### Project Documentation

- [`_docs/project-overview.md`](_docs/project-overview.md) - Project goals and phases
- [`_docs/user-flow.md`](_docs/user-flow.md) - User journey and interactions
- [`_docs/tech-stack.md`](_docs/tech-stack.md) - Technology decisions and alternatives
- [`_docs/project-rules.md`](_docs/project-rules.md) - Coding standards and conventions
- [`_docs/ui-rules.md`](_docs/ui-rules.md) - Design principles and UI guidelines
- [`_docs/theme-rules.md`](_docs/theme-rules.md) - Theming system and design tokens

### Development Phases

- [`_docs/phases/setup-phase.md`](_docs/phases/setup-phase.md) - Foundation setup
- [`_docs/phases/mvp-phase.md`](_docs/phases/mvp-phase.md) - Core functionality
- [`_docs/phases/enhancement-phase.md`](_docs/phases/enhancement-phase.md) - Advanced features
- [`_docs/phases/polish-phase.md`](_docs/phases/polish-phase.md) - Production readiness

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `feature/feature-name`
2. Follow coding conventions and standards
3. Write tests for new functionality
4. Update documentation as needed
5. Submit pull request with description

### Code Review Checklist

- [ ] Follows project conventions
- [ ] Includes proper documentation
- [ ] Has appropriate test coverage
- [ ] Passes linting and type checking
- [ ] Performance impact considered

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

- **Camera not working**: Ensure HTTPS and camera permissions
- **Recording fails**: Check browser MediaRecorder support
- **Performance issues**: Verify WebAssembly support

### Getting Help

- Check the [documentation](_docs/) for detailed guides
- Review [existing issues](../../issues) for known problems
- Create a new issue with detailed description and steps to reproduce

---

**Built with ❤️ using modern web technologies for an exceptional user experience.**
