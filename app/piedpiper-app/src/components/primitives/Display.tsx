import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

import { theme } from "../../theme/tokens";

type Variant =
  | "display"
  | "headline"
  | "title"
  | "body"
  | "bodyMedium"
  | "label"
  | "numericDisplay"
  | "numericHeadline"
  | "numericTitle"
  | "numericBody"
  | "numericCaption";

interface TProps extends TextProps {
  variant: Variant;
  tone?: "primary" | "secondary" | "tertiary" | "amber" | "kelp" | "terra";
  children?: React.ReactNode;
}

export function T({ variant, tone = "primary", style, children, ...rest }: TProps) {
  const colorStyle = toneStyles[tone];
  return (
    <Text
      allowFontScaling={false}
      style={[styles[variant], colorStyle, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: theme.type.display,
  headline: theme.type.headline,
  title: theme.type.title,
  body: theme.type.body,
  bodyMedium: theme.type.bodyMedium,
  label: theme.type.label,
  numericDisplay: theme.type.numericDisplay,
  numericHeadline: theme.type.numericHeadline,
  numericTitle: theme.type.numericTitle,
  numericBody: theme.type.numericBody,
  numericCaption: theme.type.numericCaption,
});

const toneStyles = {
  primary: { color: theme.textPrimary },
  secondary: { color: theme.textSecondary },
  tertiary: { color: theme.textTertiary },
  amber: { color: theme.accent },
  kelp: { color: theme.palette.stateKelp },
  terra: { color: theme.palette.stateTerra },
} as const;
