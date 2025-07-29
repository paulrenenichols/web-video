/**
 * @fileoverview Hat configuration constants.
 *
 * Defines available hat types, their properties, and default settings
 * for the hat overlay system.
 */

export interface HatConfig {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  category: 'casual' | 'formal' | 'winter' | 'sports';
  defaultOpacity: number;
  defaultScale: number;
}

export const AVAILABLE_HATS: HatConfig[] = [
  {
    id: 'baseball',
    name: 'Baseball Cap',
    description: 'Classic baseball cap with team logo',
    imagePath: '/assets/hats/baseball.svg',
    category: 'sports',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
  {
    id: 'fedora',
    name: 'Fedora',
    description: 'Classic fedora hat for a sophisticated look',
    imagePath: '/assets/hats/fedora.svg',
    category: 'formal',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
  {
    id: 'cowboy',
    name: 'Cowboy Hat',
    description: 'Western cowboy hat for a rugged appearance',
    imagePath: '/assets/hats/cowboy.svg',
    category: 'casual',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
  {
    id: 'beanie',
    name: 'Beanie',
    description: 'Warm beanie with pom pom for cold weather',
    imagePath: '/assets/hats/beanie.svg',
    category: 'winter',
    defaultOpacity: 0.9,
    defaultScale: 1.0,
  },
]; 