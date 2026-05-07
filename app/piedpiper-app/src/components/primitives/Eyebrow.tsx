import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

import { theme } from "../../theme/tokens";

interface EyebrowProps extends TextProps {
  children: React.ReactNode;
  tone?: "default" | "amber" | "kelp" | "terra";
}

export function Eyebrow({
  children,
  tone = "default",
  style,
  ...rest
}: EyebrowProps) {
  const colorStyle =
    tone === "amber"
      ? { color: theme.accent }
      : tone === "kelp"
        ? { color: theme.palette.stateKelp }
        : tone === "terra"
          ? { color: theme.palette.stateTerra }
          : { color: theme.textSecondary };

  return (
    <Text style={[styles.eyebrow, colorStyle, style]} {...rest}>
      {typeof children === "string" ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...theme.type.label,
  },
});
