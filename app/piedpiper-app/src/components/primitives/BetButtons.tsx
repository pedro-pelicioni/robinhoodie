import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "../../theme/tokens";
import { Eyebrow } from "./Eyebrow";

type Side = "yes" | "no";

interface BetButtonsProps {
  yesPool: string;
  noPool: string;
  selected: Side | null;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (side: Side) => void;
  onConfirm: (side: Side) => void;
  style?: ViewStyle;
}

export function BetButtons({
  yesPool,
  noPool,
  selected,
  disabled,
  loading,
  onSelect,
  onConfirm,
  style,
}: BetButtonsProps) {
  return (
    <View style={[styles.row, style]}>
      <BetSide
        label="YES"
        pool={yesPool}
        side="yes"
        selected={selected === "yes"}
        otherSelected={selected === "no"}
        disabled={!!disabled}
        loading={!!loading && selected === "yes"}
        onSelect={() => onSelect("yes")}
        onConfirm={() => onConfirm("yes")}
      />
      <BetSide
        label="NO"
        pool={noPool}
        side="no"
        selected={selected === "no"}
        otherSelected={selected === "yes"}
        disabled={!!disabled}
        loading={!!loading && selected === "no"}
        onSelect={() => onSelect("no")}
        onConfirm={() => onConfirm("no")}
      />
    </View>
  );
}

interface BetSideProps {
  label: string;
  pool: string;
  side: Side;
  selected: boolean;
  otherSelected: boolean;
  disabled: boolean;
  loading: boolean;
  onSelect: () => void;
  onConfirm: () => void;
}

function BetSide({
  label,
  pool,
  side,
  selected,
  otherSelected,
  disabled,
  loading,
  onSelect,
  onConfirm,
}: BetSideProps) {
  const palette = side === "yes" ? yesPalette : noPalette;
  const tint = otherSelected
    ? palette.quiet
    : selected
      ? palette.deep
      : palette.base;
  const onPress = selected ? onConfirm : onSelect;
  const inactive = disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.side,
        { backgroundColor: tint },
        pressed && !inactive && { backgroundColor: palette.deep },
        inactive && styles.disabled,
      ]}
      android_ripple={{ color: palette.deep, borderless: false }}
    >
      <Eyebrow style={[styles.eyebrow, { color: palette.eyebrow }]}>
        {selected ? "TAP TO CONFIRM" : label}
      </Eyebrow>
      <Text style={[styles.pool, { color: palette.text }]} allowFontScaling={false}>
        {loading ? "…" : pool}
      </Text>
      <Text style={[styles.unit, { color: palette.text }]} allowFontScaling={false}>
        SKR pool
      </Text>
    </Pressable>
  );
}

const yesPalette = {
  base: theme.palette.stateKelp,
  deep: theme.palette.stateKelpDeep,
  quiet: theme.palette.stateKelpQuiet,
  eyebrow: "rgba(21, 17, 13, 0.75)",
  text: theme.palette.ashCoal,
};

const noPalette = {
  base: theme.palette.stateTerra,
  deep: theme.palette.stateTerraDeep,
  quiet: theme.palette.stateTerraQuiet,
  eyebrow: "rgba(21, 17, 13, 0.75)",
  text: theme.palette.ashCoal,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  side: {
    flex: 1,
    height: 96,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: "space-between",
  },
  disabled: {
    opacity: 0.5,
  },
  eyebrow: {
    letterSpacing: 0.72,
  },
  pool: {
    ...theme.type.numericHeadline,
  },
  unit: {
    ...theme.type.numericCaption,
    opacity: 0.7,
  },
});
