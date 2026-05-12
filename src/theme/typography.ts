export const fontFamily = {
  heading: "ArchivoNarrow",
  headingMedium: "ArchivoNarrow_600SemiBold",
  headingBold: "ArchivoNarrow_700Bold",
  body: "Manrope",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
} as const;

export const typography = {
  displayLg: {
    fontFamily: fontFamily.headingBold,
    fontSize: 48,
    lineHeight: 53,
    letterSpacing: -0.96,
  },
  headlineXl: {
    fontFamily: fontFamily.headingBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.32,
  },
  headlineLg: {
    fontFamily: fontFamily.headingMedium,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0.48,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 29,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  labelMd: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  labelSm: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.96,
    textTransform: "uppercase",
  },
} as const;

export type TypographyVariant = keyof typeof typography;
