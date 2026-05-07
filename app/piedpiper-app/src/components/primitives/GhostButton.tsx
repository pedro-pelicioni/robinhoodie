import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { theme } from "../../theme/tokens";

interface GhostButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: "md" | "sm";
  style?: ViewStyle;
}

export function GhostButton({
  label,
  onPress,
  disabled,
  loading,
  iconName,
  size = "md",
  style,
}: GhostButtonProps) {
  const isInactive = disabled || loading;
  const isSmall = size === "sm";

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.button,
        isSmall && styles.buttonSm,
        pressed && !isInactive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      android_ripple={{ color: theme.bgLifted, borderless: false }}
    >
      {loading ? (
        <ActivityIndicator color={theme.textPrimary} size="small" />
      ) : (
        <>
          {iconName ? (
            <MaterialCommunityIcons
              name={iconName}
              size={isSmall ? 14 : 16}
              color={disabled ? theme.textTertiary : theme.textPrimary}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isSmall && styles.labelSm,
              disabled && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonSm: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  pressed: {
    backgroundColor: theme.bgLifted,
  },
  disabled: {
    borderColor: theme.bgLifted,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  label: {
    ...theme.type.bodyMedium,
    color: theme.textPrimary,
  },
  labelSm: {
    fontSize: 13,
    lineHeight: 16,
  },
  labelDisabled: {
    color: theme.textTertiary,
  },
});
