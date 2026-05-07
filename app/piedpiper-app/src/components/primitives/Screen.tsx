import React from "react";
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";

import { theme } from "../../theme/tokens";

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  scrollViewProps?: ScrollViewProps;
  padded?: boolean;
}

export function Screen({
  children,
  scroll = true,
  scrollViewProps,
  padded = true,
  style,
  ...rest
}: ScreenProps) {
  if (scroll) {
    return (
      <ScrollView
        style={[styles.shell, style]}
        contentContainerStyle={[padded && styles.contentPadded]}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View
      style={[styles.shell, padded && styles.contentPadded, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  contentPadded: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
});
