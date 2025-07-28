# Theme Rules and Design Tokens

This document defines the complete theming system for the web video recording application, including color palettes, typography, spacing, and design tokens for both light and dark modes.

## Color System

### **Primary Colors**

#### Light Mode

```css
/* Primary Brand Colors */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6; /* Main Primary */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
--primary-950: #172554;
```

#### Dark Mode

```css
/* Primary Brand Colors - Dark */
--primary-50: #172554;
--primary-100: #1e3a8a;
--primary-200: #1e40af;
--primary-300: #1d4ed8;
--primary-400: #2563eb;
--primary-500: #3b82f6; /* Main Primary */
--primary-600: #60a5fa;
--primary-700: #93c5fd;
--primary-800: #bfdbfe;
--primary-900: #dbeafe;
--primary-950: #eff6ff;
```

### **Semantic Colors**

#### Success Colors

```css
/* Light Mode */
--success-50: #ecfdf5;
--success-100: #d1fae5;
--success-500: #10b981; /* Main Success */
--success-600: #059669;
--success-700: #047857;

/* Dark Mode */
--success-50: #064e3b;
--success-100: #065f46;
--success-500: #10b981; /* Main Success */
--success-600: #34d399;
--success-700: #6ee7b7;
```

#### Warning Colors

```css
/* Light Mode */
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b; /* Main Warning */
--warning-600: #d97706;
--warning-700: #b45309;

/* Dark Mode */
--warning-50: #451a03;
--warning-100: #78350f;
--warning-500: #f59e0b; /* Main Warning */
--warning-600: #fbbf24;
--warning-700: #fcd34d;
```

#### Danger Colors

```css
/* Light Mode */
--danger-50: #fef2f2;
--danger-100: #fee2e2;
--danger-500: #ef4444; /* Main Danger */
--danger-600: #dc2626;
--danger-700: #b91c1c;

/* Dark Mode */
--danger-50: #450a0a;
--danger-100: #7f1d1d;
--danger-500: #ef4444; /* Main Danger */
--danger-600: #f87171;
--danger-700: #fca5a5;
```

#### Info Colors

```css
/* Light Mode */
--info-50: #ecfeff;
--info-100: #cffafe;
--info-500: #06b6d4; /* Main Info */
--info-600: #0891b2;
--info-700: #0e7490;

/* Dark Mode */
--info-50: #164e63;
--info-100: #155e75;
--info-500: #06b6d4; /* Main Info */
--info-600: #22d3ee;
--info-700: #67e8f9;
```

### **Neutral Colors**

#### Light Mode

```css
/* Background Colors */
--background: #ffffff;
--background-secondary: #f8fafc;
--background-tertiary: #f1f5f9;

/* Surface Colors */
--surface: #ffffff;
--surface-secondary: #f8fafc;
--surface-tertiary: #f1f5f9;

/* Border Colors */
--border: #e2e8f0;
--border-secondary: #cbd5e1;
--border-tertiary: #94a3b8;

/* Text Colors */
--text-primary: #1e293b;
--text-secondary: #475569;
--text-tertiary: #64748b;
--text-inverse: #ffffff;

/* Overlay Colors */
--overlay: rgba(0, 0, 0, 0.1);
--overlay-secondary: rgba(0, 0, 0, 0.05);
```

#### Dark Mode

```css
/* Background Colors */
--background: #0f172a;
--background-secondary: #1e293b;
--background-tertiary: #334155;

/* Surface Colors */
--surface: #1e293b;
--surface-secondary: #334155;
--surface-tertiary: #475569;

/* Border Colors */
--border: #334155;
--border-secondary: #475569;
--border-tertiary: #64748b;

/* Text Colors */
--text-primary: #f8fafc;
--text-secondary: #cbd5e1;
--text-tertiary: #94a3b8;
--text-inverse: #0f172a;

/* Overlay Colors */
--overlay: rgba(0, 0, 0, 0.3);
--overlay-secondary: rgba(0, 0, 0, 0.2);
```

### **Glassmorphic Colors**

#### Light Mode

```css
/* Glassmorphic Effects */
--glass-bg: rgba(255, 255, 255, 0.8);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-shadow: rgba(0, 0, 0, 0.1);
```

#### Dark Mode

```css
/* Glassmorphic Effects */
--glass-bg: rgba(30, 41, 59, 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: rgba(0, 0, 0, 0.3);
```

## Typography System

### **Font Family**

```css
/* Primary Font Stack */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace;
```

### **Font Sizes**

```css
/* Typography Scale */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */
```

### **Font Weights**

```css
/* Font Weight Scale */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### **Line Heights**

```css
/* Line Height Scale */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### **Typography Classes**

```css
/* Heading Styles */
.heading-1 {
  @apply text-4xl font-bold leading-tight;
}

.heading-2 {
  @apply text-3xl font-semibold leading-tight;
}

.heading-3 {
  @apply text-2xl font-semibold leading-snug;
}

.heading-4 {
  @apply text-xl font-medium leading-snug;
}

/* Body Text Styles */
.body-large {
  @apply text-lg leading-relaxed;
}

.body-normal {
  @apply text-base leading-normal;
}

.body-small {
  @apply text-sm leading-normal;
}

.body-xs {
  @apply text-xs leading-normal;
}

/* Caption Styles */
.caption {
  @apply text-sm font-medium text-text-tertiary;
}

.caption-small {
  @apply text-xs font-medium text-text-tertiary;
}
```

## Spacing System

### **Spacing Scale**

```css
/* Spacing Tokens */
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
```

### **Component Spacing**

```css
/* Component-Specific Spacing */
--container-padding: var(--space-6);
--section-spacing: var(--space-12);
--card-padding: var(--space-6);
--button-padding-x: var(--space-6);
--button-padding-y: var(--space-3);
--input-padding: var(--space-3);
```

## Border Radius System

### **Border Radius Scale**

```css
/* Border Radius Tokens */
--radius-none: 0;
--radius-sm: 0.125rem; /* 2px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-3xl: 1.5rem; /* 24px */
--radius-full: 9999px;
```

### **Component Border Radius**

```css
/* Component-Specific Border Radius */
--button-radius: var(--radius-lg);
--card-radius: var(--radius-xl);
--input-radius: var(--radius-md);
--modal-radius: var(--radius-2xl);
--video-radius: var(--radius-xl);
```

## Shadow System

### **Shadow Scale**

```css
/* Shadow Tokens */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### **Dark Mode Shadows**

```css
/* Dark Mode Shadow Tokens */
--shadow-sm-dark: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md-dark: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
--shadow-lg-dark: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
--shadow-xl-dark: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
--shadow-2xl-dark: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
```

## Animation System

### **Duration Scale**

```css
/* Animation Duration Tokens */
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### **Easing Functions**

```css
/* Easing Function Tokens */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### **Animation Classes**

```css
/* Common Animation Classes */
.animate-fade-in {
  @apply transition-opacity duration-200 ease-out;
}

.animate-slide-up {
  @apply transition-transform duration-300 ease-out;
}

.animate-scale {
  @apply transition-transform duration-150 ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## Z-Index System

### **Z-Index Scale**

```css
/* Z-Index Tokens */
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
--z-toast: 1080;
```

## Breakpoint System

### **Responsive Breakpoints**

```css
/* Breakpoint Tokens */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## CSS Custom Properties Usage

### **Theme Implementation**

```css
/* Root Theme Variables */
:root {
  /* Import all color tokens */
  /* Import all typography tokens */
  /* Import all spacing tokens */
  /* Import all other design tokens */
}

/* Dark Mode Override */
[data-theme="dark"] {
  /* Override with dark mode values */
}

/* System Theme Detection */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* Auto dark mode values */
  }
}
```

This comprehensive theming system provides a consistent, scalable foundation for the video recording application across both light and dark modes, ensuring excellent accessibility and user experience.
