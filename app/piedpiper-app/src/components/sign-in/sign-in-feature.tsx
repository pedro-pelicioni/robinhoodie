import { StyleSheet, View } from "react-native";

import { theme } from "../../theme/tokens";
import { ConnectButton, SignInButton } from "./sign-in-ui";

export function SignInFeature() {
  return (
    <View style={styles.group}>
      <ConnectButton />
      <SignInButton />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
