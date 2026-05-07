import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "../../theme/tokens";
import { Eyebrow } from "./Eyebrow";

interface HeroValueBlockProps {
  eyebrow: string;
  value: string;
  unit?: string;
  caption?: string;
  tone?: "default" | "amber";
  size?: "display" | "headline";
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function HeroValueBlock({
  eyebrow,
  value,
  unit,
  caption,
  tone = "amber",
  size = "display",
  children,
  style,
}: HeroValueBlockProps) {
  const valueStyle =
    size === "display" ? styles.valueDisplay : styles.valueHeadline;
  const unitStyle =
    size === "display" ? styles.unitDisplay : styles.unitHeadline;

  return (
    <View style={[styles.block, style]}>
      <Eyebrow tone={tone === "amber" ? "amber" : "default"}>{eyebrow}</Eyebrow>
      <View style={styles.valueRow}>
        <Text
          style={[
            valueStyle,
            { color: tone === "amber" ? theme.accent : theme.textPrimary },
          ]}
          allowFontScaling={false}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            style={[
              unitStyle,
              { color: tone === "amber" ? theme.accent : theme.textSecondary },
            ]}
            allowFontScaling={false}
          >
            {unit}
          </Text>
        ) : null}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: theme.spacing.xxl,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: theme.spacing.sm,
  },
  valueDisplay: {
    ...theme.type.numericDisplay,
  },
  valueHeadline: {
    ...theme.type.numericHeadline,
  },
  unitDisplay: {
    ...theme.type.numericTitle,
    fontSize: 18,
    marginLeft: theme.spacing.sm,
    opacity: 0.7,
  },
  unitHeadline: {
    ...theme.type.numericBody,
    marginLeft: theme.spacing.sm,
    opacity: 0.7,
  },
  caption: {
    ...theme.type.body,
    color: theme.textSecondary,
    marginTop: theme.spacing.sm,
  },
});
