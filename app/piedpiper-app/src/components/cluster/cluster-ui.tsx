import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { theme } from "../../theme/tokens";
import { Cluster } from "./cluster-data-access";

interface ClusterRowProps {
  cluster: Cluster;
  selected: boolean;
  onSelect: (cluster: Cluster) => void;
}

export function ClusterRow({ cluster, selected, onSelect }: ClusterRowProps) {
  return (
    <Pressable
      onPress={() => onSelect(cluster)}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && !selected && styles.rowPressed,
      ]}
    >
      <View style={styles.text}>
        <Text style={[styles.name, selected && styles.nameSelected]}>
          {cluster.name}
        </Text>
        <Text style={styles.endpoint} numberOfLines={1}>
          {cluster.endpoint}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={selected ? "check-circle" : "circle-outline"}
        size={22}
        color={selected ? theme.accent : theme.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.bgLifted,
    marginBottom: theme.spacing.sm,
  },
  rowSelected: {
    backgroundColor: theme.bgLifted,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  rowPressed: {
    backgroundColor: theme.border,
  },
  text: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  name: {
    ...theme.type.title,
    fontSize: 17,
    color: theme.textPrimary,
  },
  nameSelected: {
    color: theme.accent,
  },
  endpoint: {
    ...theme.type.numericCaption,
    color: theme.textTertiary,
    marginTop: 2,
  },
});
