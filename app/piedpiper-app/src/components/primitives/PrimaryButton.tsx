import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "../../theme/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  caption?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  caption,
  fullWidth = true,
  style,
}: PrimaryButtonProps) {
  const isInactive = disabled || loading;

  return (
    <View style={[fullWidth && styles.full, style]}>
      <Pressable
        onPress={onPress}
        disabled={isInactive}
        style={({ pressed }) => [
          styles.button,
          pressed && !isInactive && styles.pressed,
          disabled && styles.disabled,
        ]}
        android_ripple={{ color: theme.palette.signalAmberDeep, borderless: false }}
      >
        {loading ? (
          <ActivityIndicator color={theme.palette.ashCoal} size="small" />
        ) : (
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {label}
          </Text>
        )}
      </Pressable>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    alignSelf: "stretch",
  },
  button: {
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  pressed: {
    backgroundColor: theme.accentDeep,
  },
  disabled: {
    backgroundColor: theme.accentQuiet,
  },
  label: {
    ...theme.type.bodyMedium,
    fontSize: 16,
    color: theme.palette.ashCoal,
  },
  labelDisabled: {
    color: theme.textTertiary,
  },
  caption: {
    ...theme.type.numericCaption,
    color: theme.textTertiary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
});
