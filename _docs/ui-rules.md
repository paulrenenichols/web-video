# UI Rules and Design Principles

This document outlines the design principles, interaction patterns, and UI guidelines for the web video recording application.

## Core Design Principles

### 1. **Clarity and Focus**

- **Principle**: The video feed should be the primary focus of the interface
- **Application**: Minimize UI elements that compete with the video content
- **Implementation**: Use generous white space, subtle borders, and minimal visual noise
- **Why Important**: Users need to see themselves clearly for recording and overlay positioning

### 2. **Immediate Feedback**

- **Principle**: Users should instantly know the state of the application
- **Application**: Clear visual indicators for recording status, face tracking, and overlay states
- **Implementation**: Color-coded status indicators, prominent state changes, real-time updates
- **Why Important**: Real-time applications require immediate state awareness

### 3. **Progressive Disclosure**

- **Principle**: Show basic features first, reveal advanced features as needed
- **Application**: Start with simple recording, then reveal face tracking, then overlays
- **Implementation**: Collapsible panels, contextual help, feature discovery
- **Why Important**: Reduces cognitive load and learning curve

### 4. **Accessibility and Inclusivity**

- **Principle**: Design for users with varying abilities and technical comfort
- **Application**: Large, clear buttons, high contrast, keyboard navigation
- **Implementation**: WCAG 2.1 AA compliance, semantic HTML, screen reader support
- **Why Important**: Video recording apps are used by diverse audiences

### 5. **Performance-First Design**

- **Principle**: UI should not interfere with video processing performance
- **Application**: Lightweight animations, efficient rendering, minimal DOM manipulation
- **Implementation**: CSS transforms, hardware acceleration, optimized re-renders
- **Why Important**: Video processing is resource-intensive

## Style Recommendation: Minimalist with Subtle Glassmorphic Elements

### **Rationale:**

1. **Video-First**: Minimalist base keeps focus on video feed
2. **Modern Touch**: Subtle glassmorphic effects on controls add contemporary feel
3. **Performance**: Lightweight design won't impact video processing
4. **Accessibility**: High contrast and clear hierarchy

### **Implementation Strategy:**

- **Main Interface**: Clean, minimal design with generous white space
- **Control Panel**: Subtle glassmorphic effects with backdrop blur
- **Video Container**: Simple border and shadow for definition
- **Buttons**: Clear, high-contrast design with hover states
- **Overlays**: Semi-transparent with clear boundaries

## Component-Specific Design Rules

### **Video Container**

```css
/* Clean, defined video area */
.video-container {
  @apply bg-gray-50 dark:bg-gray-900 rounded-xl shadow-sm 
         border border-gray-200 dark:border-gray-700
         overflow-hidden relative;
}
```

**Design Rules:**

- Rounded corners (12px) for modern feel
- Subtle shadow for depth without distraction
- Clean border for definition
- Overflow hidden for clean edges
- Relative positioning for overlay positioning

### **Record Button**

```css
/* High-contrast, prominent recording control */
.record-button {
  @apply bg-red-500 hover:bg-red-600 active:bg-red-700
         text-white px-8 py-4 rounded-lg 
         transition-all duration-200 font-semibold
         shadow-lg hover:shadow-xl
         focus:ring-4 focus:ring-red-200 dark:focus:ring-red-800;
}

.record-button.recording {
  @apply bg-gray-600 hover:bg-gray-700 active:bg-gray-800
         animate-pulse;
}
```

**Design Rules:**

- High contrast red for recording state
- Large, prominent size for easy access
- Clear state changes (color, text, animation)
- Focus states for accessibility
- Pulsing animation during recording

### **Control Panel**

```css
/* Subtle glassmorphic control area */
.control-panel {
  @apply backdrop-blur-md bg-white/80 dark:bg-gray-900/80
         border border-white/30 dark:border-gray-700/30
         rounded-xl shadow-lg p-6
         transition-all duration-300;
}
```

**Design Rules:**

- Subtle transparency for modern feel
- Backdrop blur for depth
- Organized layout with consistent spacing
- Smooth transitions for state changes
- Non-intrusive design

### **Overlay Controls**

```css
/* Collapsible, non-intrusive overlay controls */
.overlay-controls {
  @apply bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
         border border-gray-200 dark:border-gray-600
         rounded-lg shadow-md p-4
         transition-all duration-200;
}

.overlay-checkbox {
  @apply flex items-center space-x-3 p-2 rounded-md
         hover:bg-gray-50 dark:hover:bg-gray-700
         transition-colors duration-150;
}
```

**Design Rules:**

- Collapsible design to save space
- Clear visual hierarchy
- Hover states for interactivity
- Consistent with overall design language
- Accessible checkbox design

### **Status Indicators**

```css
/* Clear, color-coded status feedback */
.status-indicator {
  @apply inline-flex items-center space-x-2 px-3 py-1 rounded-full
         text-sm font-medium;
}

.status-recording {
  @apply bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200;
}

.status-tracking {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200;
}

.status-ready {
  @apply bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200;
}
```

**Design Rules:**

- Color-coded for quick recognition
- Consistent sizing and spacing
- Clear contrast ratios
- Semantic color usage

## Interaction Patterns

### **Button Interactions**

- **Hover**: Subtle scale (1.02) and shadow increase
- **Active**: Scale down (0.98) for tactile feedback
- **Focus**: Ring outline for accessibility
- **Disabled**: Reduced opacity and no interactions

### **Form Controls**

- **Input Focus**: Border color change and subtle glow
- **Validation**: Color-coded feedback (green/red)
- **Loading**: Skeleton states or spinners
- **Error**: Clear error messages with actionable text

### **Modal/Dialog Design**

- **Backdrop**: Semi-transparent overlay with blur
- **Content**: Centered with subtle shadow and rounded corners
- **Close**: Clear close button or escape key
- **Focus Trap**: Maintains focus within modal

### **Loading States**

- **Skeleton**: Placeholder content with subtle animation
- **Spinner**: Centered loading indicator for short waits
- **Progress**: Progress bar for longer operations
- **Text**: Clear loading messages

## Responsive Design Rules

### **Mobile-First Approach**

- **Touch Targets**: Minimum 44px for all interactive elements
- **Spacing**: Generous spacing for touch interaction
- **Typography**: Readable font sizes (16px minimum)
- **Navigation**: Thumb-friendly control placement

### **Desktop Enhancements**

- **Hover States**: Enhanced hover effects
- **Keyboard Navigation**: Full keyboard support
- **Multi-column Layout**: Efficient use of screen space
- **Advanced Controls**: Additional features for power users

## Animation Guidelines

### **Performance-First Animations**

- **CSS Transforms**: Use transform instead of position/width/height
- **Hardware Acceleration**: Use will-change for complex animations
- **Duration**: 150-300ms for most interactions
- **Easing**: Ease-out for natural feel

### **Animation Types**

- **Micro-interactions**: Subtle feedback for user actions
- **State Transitions**: Smooth changes between states
- **Loading**: Purposeful loading animations
- **Focus**: Clear focus indicators

## Accessibility Requirements

### **WCAG 2.1 AA Compliance**

- **Color Contrast**: Minimum 4.5:1 for normal text
- **Focus Indicators**: Visible focus states for all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels

### **Implementation Checklist**

- [ ] All interactive elements are keyboard accessible
- [ ] Color is not the only way to convey information
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Focus order is logical and intuitive
- [ ] Error messages are clear and actionable

## Error Handling Design

### **Error States**

- **Clear Messaging**: User-friendly error descriptions
- **Actionable Solutions**: Provide next steps for resolution
- **Visual Hierarchy**: Error messages stand out appropriately
- **Recovery Options**: Clear paths to resolve issues

### **Empty States**

- **Helpful Content**: Guide users on what to do next
- **Visual Interest**: Appropriate illustrations or icons
- **Clear Actions**: Prominent call-to-action buttons
- **Contextual Help**: Relevant tips and suggestions

This design system ensures a consistent, accessible, and performant user experience across all phases of the video recording application.
