import React from "react";
import { StyleSheet, View } from "react-native";

import { theme } from "../../theme/tokens";
import { Eyebrow } from "../primitives/Eyebrow";
import { useCluster } from "./cluster-data-access";
import { ClusterRow } from "./cluster-ui";

export default function ClusterPickerFeature() {
  const { selectedCluster, clusters, setSelectedCluster } = useCluster();
  return (
    <View style={styles.wrap}>
      <Eyebrow>Cluster</Eyebrow>
      <View style={styles.list}>
        {clusters.map((cluster) => (
          <ClusterRow
            key={cluster.name}
            cluster={cluster}
            selected={selectedCluster.network === cluster.network}
            onSelect={setSelectedCluster}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: theme.spacing.md,
  },
  list: {
    marginTop: theme.spacing.md,
  },
});
