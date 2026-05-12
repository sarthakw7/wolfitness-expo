export const spacing = {
  0: 0,
  0.5: 4,
  1: 8,
  1.5: 12,
  2: 16,
  2.5: 20,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  8: 64,
  container: 24,
  gutter: 16,
  section: 48,
} as const;

export type AppSpacing = keyof typeof spacing;
