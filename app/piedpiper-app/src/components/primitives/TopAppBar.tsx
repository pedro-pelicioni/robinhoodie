import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { theme } from "../../theme/tokens";

interface TopAppBarProps {
  title: string;
  onLeftPress?: () => void;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  right?: React.ReactNode;
}

export function TopAppBar({ title, onLeftPress, leftIcon, right }: TopAppBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {leftIcon ? (
          <Pressable
            onPress={onLeftPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={leftIcon}
              size={22}
              color={theme.textPrimary}
            />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.bgDeep,
    flexDirection: "row",
    alignItems: "center",
  },
  side: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: theme.bgLifted,
  },
  title: {
    ...theme.type.title,
    color: theme.textPrimary,
    flex: 1,
    textAlign: "center",
  },
});
