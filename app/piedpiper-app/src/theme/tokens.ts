/**
 * Pied Piper design tokens. Normative values for color, spacing, radius,
 * and typography. Resolved from DESIGN.md ("The Hardware Marquee").
 *
 * Dark-first; light theme is an accessibility companion not yet shipped.
 */

export const palette = {
  signalAmber: "#E27726",
  signalAmberDeep: "#B85F1B",
  signalAmberQuiet: "#7A4A22",

  ashCoal: "#15110D",
  ashGraphite: "#1F1A14",
  ashCharcoal: "#2A2520",
  ashLine: "#3A332C",
  ashMist: "#85786A",
  ashFog: "#B5A89A",
  ashBone: "#F2EDE5",

  stateKelp: "#5B8A5E",
  stateKelpDeep: "#3F6643",
  stateKelpQuiet: "#2C3D2E",

  stateTerra: "#A85C3F",
  stateTerraDeep: "#7C422C",
  stateTerraQuiet: "#4A2C20",

  stateError: "#C04A2E",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 20,
  lg: 32,
} as const;

export const fonts = {
  sans: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
  },
  mono: {
    regular: "JetBrainsMono_400Regular",
    medium: "JetBrainsMono_500Medium",
  },
} as const;

export const type = {
  display: {
    fontFamily: fonts.sans.semibold,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.1,
  },
  headline: {
    fontFamily: fonts.sans.semibold,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fonts.sans.semibold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.72,
  },
  numericDisplay: {
    fontFamily: fonts.mono.medium,
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -0.9,
  },
  numericHeadline: {
    fontFamily: fonts.mono.medium,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  numericTitle: {
    fontFamily: fonts.mono.medium,
    fontSize: 22,
    lineHeight: 26,
  },
  numericBody: {
    fontFamily: fonts.mono.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  numericCaption: {
    fontFamily: fonts.mono.regular,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  pulse: 800,
} as const;

export const theme = {
  isDark: true,
  palette,
  spacing,
  radius,
  fonts,
  type,
  motion,
  bg: palette.ashGraphite,
  bgDeep: palette.ashCoal,
  bgLifted: palette.ashCharcoal,
  textPrimary: palette.ashBone,
  textSecondary: palette.ashFog,
  textTertiary: palette.ashMist,
  border: palette.ashLine,
  accent: palette.signalAmber,
  accentDeep: palette.signalAmberDeep,
  accentQuiet: palette.signalAmberQuiet,
} as const;

export type Theme = typeof theme;
