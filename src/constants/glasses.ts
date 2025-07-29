/**
 * @fileoverview Glasses configuration constants.
 *
 * Defines available glasses types, their properties, and file paths.
 */

export interface GlassesConfig {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  category: 'classic' | 'modern' | 'vintage' | 'sunglasses';
  defaultOpacity: number;
  defaultScale: number;
}

/**
 * Available glasses configurations
 */
export const AVAILABLE_GLASSES: GlassesConfig[] = [
  {
    id: 'classic',
    name: 'Classic Rectangular',
    description: 'Timeless rectangular frames',
    imagePath: '/assets/glasses/classic.svg',
    category: 'classic',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
  {
    id: 'round',
    name: 'Round Vintage',
    description: 'Vintage round frames',
    imagePath: '/assets/glasses/round.svg',
    category: 'vintage',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
  {
    id: 'aviator',
    name: 'Aviator Sunglasses',
    description: 'Classic aviator style',
    imagePath: '/assets/glasses/aviator.svg',
    category: 'sunglasses',
    defaultOpacity: 0.8,
    defaultScale: 1.0,
  },
  {
    id: 'cat-eye',
    name: 'Cat Eye',
    description: 'Elegant cat-eye frames',
    imagePath: '/assets/glasses/cat-eye.svg',
    category: 'vintage',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
  {
    id: 'geometric',
    name: 'Geometric Modern',
    description: 'Modern angular frames',
    imagePath: '/assets/glasses/geometric.svg',
    category: 'modern',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
];

/**
 * Get glasses config by ID
 */
export const getGlassesConfig = (id: string): GlassesConfig | undefined => {
  return AVAILABLE_GLASSES.find(glasses => glasses.id === id);
};

/**
 * Get glasses by category
 */
export const getGlassesByCategory = (category: GlassesConfig['category']): GlassesConfig[] => {
  return AVAILABLE_GLASSES.filter(glasses => glasses.category === category);
};

/**
 * Get all categories
 */
export const getGlassesCategories = (): GlassesConfig['category'][] => {
  return [...new Set(AVAILABLE_GLASSES.map(glasses => glasses.category))];
}; 