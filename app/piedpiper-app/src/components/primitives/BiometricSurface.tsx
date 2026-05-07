import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { theme } from "../../theme/tokens";

interface BiometricSurfaceProps {
  caption: string;
  verb?: string;
  active?: boolean;
  style?: ViewStyle;
}

export function BiometricSurface({
  caption,
  verb,
  active,
  style,
}: BiometricSurfaceProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) reduceMotionRef.current = enabled;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active || reduceMotionRef.current) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: theme.motion.pulse,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <View style={[styles.block, style]}>
      <View style={styles.glyphWrap}>
        {active ? (
          <Animated.View
            style={[
              styles.halo,
              { transform: [{ scale: haloScale }], opacity: haloOpacity },
            ]}
          />
        ) : null}
        <MaterialCommunityIcons
          name="fingerprint"
          size={88}
          color={active ? theme.accent : theme.textSecondary}
        />
      </View>
      <Text style={styles.caption}>{caption}</Text>
      {verb ? <Text style={styles.verb}>{verb}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  glyphWrap: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.accent,
  },
  caption: {
    ...theme.type.title,
    color: theme.textPrimary,
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  verb: {
    ...theme.type.numericCaption,
    color: theme.textTertiary,
    marginTop: theme.spacing.sm,
  },
});
