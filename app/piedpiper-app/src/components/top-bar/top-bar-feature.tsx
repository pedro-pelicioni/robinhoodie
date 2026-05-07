import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

import { theme } from "../../theme/tokens";
import { TopAppBar } from "../primitives/TopAppBar";
import { Eyebrow } from "../primitives/Eyebrow";
import { useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { useCluster } from "../cluster/cluster-data-access";
import { ellipsify } from "../../utils/ellipsify";

export function TopBar() {
  const navigation = useNavigation();
  const { selectedAccount } = useAuthorization();
  const { connect, disconnect } = useMobileWallet();
  const { getExplorerUrl } = useCluster();
  const [menuOpen, setMenuOpen] = useState(false);

  const onWalletPress = () => {
    if (selectedAccount) setMenuOpen(true);
    else void connect();
  };

  const copyAddress = async () => {
    if (selectedAccount) {
      await Clipboard.setStringAsync(selectedAccount.publicKey.toBase58());
    }
    setMenuOpen(false);
  };

  const viewExplorer = () => {
    if (selectedAccount) {
      Linking.openURL(
        getExplorerUrl(`account/${selectedAccount.publicKey.toBase58()}`),
      );
    }
    setMenuOpen(false);
  };

  const onDisconnect = async () => {
    setMenuOpen(false);
    await disconnect();
  };

  return (
    <>
      <TopAppBar
        title="RobinHoodie"
        right={
          <View style={styles.rightRow}>
            <Pressable
              onPress={onWalletPress}
              style={({ pressed }) => [
                styles.walletPill,
                pressed && styles.walletPillPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={14}
                color={theme.textPrimary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.walletLabel}>
                {selectedAccount
                  ? ellipsify(selectedAccount.publicKey.toBase58(), 4)
                  : "Connect"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Settings" as never)}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.iconBtnPressed,
              ]}
              hitSlop={6}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={theme.textPrimary}
              />
            </Pressable>
          </View>
        }
      />
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            <Eyebrow style={styles.menuEyebrow}>Wallet</Eyebrow>
            {selectedAccount ? (
              <Text style={styles.menuAddr} numberOfLines={1}>
                {selectedAccount.publicKey.toBase58()}
              </Text>
            ) : null}
            <MenuRow
              icon="content-copy"
              label="Copy address"
              onPress={copyAddress}
            />
            <MenuRow
              icon="open-in-new"
              label="View on Explorer"
              onPress={viewExplorer}
            />
            <MenuRow
              icon="link-off"
              label="Disconnect"
              onPress={onDisconnect}
              tone="terra"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

interface MenuRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "default" | "terra";
}

function MenuRow({ icon, label, onPress, tone = "default" }: MenuRowProps) {
  const color = tone === "terra" ? theme.palette.stateTerra : theme.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={color}
        style={{ marginRight: theme.spacing.md }}
      />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
  },
  walletPillPressed: {
    backgroundColor: theme.bgLifted,
  },
  walletLabel: {
    ...theme.type.numericCaption,
    color: theme.textPrimary,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: {
    backgroundColor: theme.bgLifted,
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(13, 11, 9, 0.7)",
    justifyContent: "flex-start",
    paddingTop: 80,
    paddingHorizontal: theme.spacing.lg,
  },
  menu: {
    backgroundColor: theme.bgLifted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  menuEyebrow: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  menuAddr: {
    ...theme.type.numericCaption,
    color: theme.textSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    paddingTop: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  menuRowPressed: {
    backgroundColor: theme.border,
  },
  menuLabel: {
    ...theme.type.bodyMedium,
  },
});
