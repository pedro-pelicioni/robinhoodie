import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "../../theme/tokens";

const PRESETS = ["0.05", "0.1", "0.5"] as const;

interface AmountChipsProps {
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  style?: ViewStyle;
}

export function AmountChips({
  value,
  onChange,
  unit = "SKR",
  style,
}: AmountChipsProps) {
  const [otherOpen, setOtherOpen] = useState(false);
  const isPreset = (PRESETS as readonly string[]).includes(value);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        {PRESETS.map((preset) => {
          const selected = value === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => {
                onChange(preset);
                setOtherOpen(false);
              }}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && !selected && styles.chipPressed,
              ]}
            >
              <Text
                style={[styles.chipValue, selected && styles.chipValueSelected]}
                allowFontScaling={false}
              >
                {preset}
              </Text>
              <Text
                style={[styles.chipUnit, selected && styles.chipUnitSelected]}
                allowFontScaling={false}
              >
                {unit}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setOtherOpen((p) => !p)}
          style={({ pressed }) => [
            styles.chip,
            otherOpen && styles.chipSelected,
            !isPreset && value && styles.chipSelected,
            pressed && styles.chipPressed,
          ]}
        >
          <Text
            style={[
              styles.chipValue,
              (otherOpen || (!isPreset && !!value)) && styles.chipValueSelected,
            ]}
            allowFontScaling={false}
          >
            {!isPreset && value ? value : "other"}
          </Text>
          <Text
            style={[
              styles.chipUnit,
              (otherOpen || (!isPreset && !!value)) && styles.chipUnitSelected,
            ]}
            allowFontScaling={false}
          >
            {!isPreset && value ? unit : "set…"}
          </Text>
        </Pressable>
      </View>
      {otherOpen ? (
        <TextInput
          value={isPreset ? "" : value}
          onChangeText={onChange}
          placeholder={`Custom ${unit} amount`}
          placeholderTextColor={theme.textTertiary}
          keyboardType="decimal-pad"
          style={styles.input}
          autoFocus
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.bgLifted,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  chipPressed: {
    backgroundColor: theme.border,
  },
  chipSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  chipValue: {
    ...theme.type.numericBody,
    color: theme.textPrimary,
  },
  chipValueSelected: {
    color: theme.palette.ashCoal,
  },
  chipUnit: {
    ...theme.type.label,
    color: theme.textSecondary,
    marginTop: 2,
  },
  chipUnitSelected: {
    color: theme.palette.ashCoal,
    opacity: 0.7,
  },
  input: {
    ...theme.type.numericBody,
    color: theme.textPrimary,
    backgroundColor: theme.bgLifted,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
