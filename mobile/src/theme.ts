/**
 * Design tokens ported from the web app's frontend/src/styles/tokens.css
 * (the "Kiln"/clay design system). Web-only concepts — CSS custom-property
 * shadows, cubic-bezier easings, web font stacks — are dropped or simplified;
 * React Native shadows use elevation/shadow* props at the component level.
 */

export const colors = {
  // Clay neutrals
  clay50: "#F6F2EA",
  clay100: "#ECE6DA",
  clay200: "#E0D7C6",
  clay300: "#CFC2AB",
  clay400: "#B7A488",
  clay500: "#98856A",
  clay600: "#76654E",
  clay700: "#574A39",
  clay800: "#3B3228",
  clay900: "#251F18",

  // Terracotta (brand)
  brand: "#C2693F",
  brandSoft: "#F4D6C7",
  brandSoftFg: "#864226",

  // Semantic aliases
  surfacePage: "#ECE6DA",
  surfaceCard: "#F6F2EA",
  surfaceSunken: "#E0D7C6",
  surfaceRaised: "#FFFFFF",
  textStrong: "#251F18",
  textBody: "#3B3228",
  textMuted: "#76654E",
  textSubtle: "#98856A",
  textOnBrand: "#FFF6EF",
  textLink: "#A8552F",
  borderSoft: "#DDD3C2",
  borderStrong: "#C7B89F",
  success: "#4E9E57",
  warning: "#E0B33D",
  danger: "#B14730",
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;
