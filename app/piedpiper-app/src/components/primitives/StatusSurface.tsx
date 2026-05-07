import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { theme } from "../../theme/tokens";
import { Eyebrow } from "./Eyebrow";

type Tone = "neutral" | "amber" | "kelp" | "terra" | "muted";

interface StatusSurfaceProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: Tone;
  size?: "md" | "sm";
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function StatusSurface({
  eyebrow,
  title,
  subtitle,
  iconName,
  tone = "neutral",
  size = "md",
  children,
  style,
}: StatusSurfaceProps) {
  const isSmall = size === "sm";
  const palette = palettesByTone[tone];

  return (
    <View
      style={[
        styles.block,
        isSmall && styles.blockSm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        {iconName ? (
          <MaterialCommunityIcons
            name={iconName}
            size={isSmall ? 16 : 22}
            color={palette.icon}
            style={styles.icon}
          />
        ) : null}
        <View style={styles.text}>
          {eyebrow ? <Eyebrow tone={toneToEyebrow(tone)}>{eyebrow}</Eyebrow> : null}
          <Text
            style={[
              isSmall ? styles.titleSm : styles.title,
              { color: palette.title },
            ]}
            numberOfLines={isSmall ? 1 : 2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.subtitle }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function toneToEyebrow(tone: Tone): "default" | "amber" | "kelp" | "terra" {
  if (tone === "amber") return "amber";
  if (tone === "kelp") return "kelp";
  if (tone === "terra") return "terra";
  return "default";
}

const palettesByTone: Record<
  Tone,
  { bg: string; border: string; icon: string; title: string; subtitle: string }
> = {
  neutral: {
    bg: theme.bgLifted,
    border: "transparent",
    icon: theme.textPrimary,
    title: theme.textPrimary,
    subtitle: theme.textSecondary,
  },
  amber: {
    bg: theme.accent,
    border: theme.accent,
    icon: theme.palette.ashCoal,
    title: theme.palette.ashCoal,
    subtitle: "rgba(21, 17, 13, 0.7)",
  },
  kelp: {
    bg: theme.palette.stateKelpQuiet,
    border: theme.palette.stateKelp,
    icon: theme.palette.stateKelp,
    title: theme.textPrimary,
    subtitle: theme.textSecondary,
  },
  terra: {
    bg: theme.palette.stateTerraQuiet,
    border: theme.palette.stateTerra,
    icon: theme.palette.stateTerra,
    title: theme.textPrimary,
    subtitle: theme.textSecondary,
  },
  muted: {
    bg: theme.bgLifted,
    border: theme.border,
    icon: theme.textTertiary,
    title: theme.textSecondary,
    subtitle: theme.textTertiary,
  },
};

const styles = StyleSheet.create({
  block: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
  },
  blockSm: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  text: {
    flex: 1,
  },
  title: {
    ...theme.type.title,
    marginTop: 4,
  },
  titleSm: {
    ...theme.type.bodyMedium,
  },
  subtitle: {
    ...theme.type.body,
    fontSize: 13,
    marginTop: 4,
  },
});
