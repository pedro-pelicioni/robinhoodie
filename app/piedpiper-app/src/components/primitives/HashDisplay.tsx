import React, { useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { theme } from "../../theme/tokens";
import { ellipsify } from "../../utils/ellipsify";

interface HashDisplayProps {
  value: string;
  size?: "body" | "caption";
  showIcon?: boolean;
  style?: ViewStyle;
}

export function HashDisplay({
  value,
  size = "body",
  showIcon = true,
  style,
}: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const onPress = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [value]);

  const typeStyle =
    size === "caption" ? theme.type.numericCaption : theme.type.numericBody;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        style,
      ]}
      hitSlop={6}
    >
      <Text style={[typeStyle, styles.text]}>
        {copied ? "copied" : ellipsify(value)}
      </Text>
      {showIcon && (
        <MaterialCommunityIcons
          name={copied ? "check" : "content-copy"}
          size={size === "caption" ? 12 : 14}
          color={theme.textTertiary}
          style={styles.icon}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginHorizontal: -6,
    borderRadius: theme.radius.sm,
  },
  pressed: {
    backgroundColor: theme.bgLifted,
  },
  text: {
    color: theme.textSecondary,
  },
  icon: {
    marginLeft: 6,
  },
});
