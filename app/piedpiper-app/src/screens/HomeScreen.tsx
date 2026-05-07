import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../utils/ConnectionProvider";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { ellipsify } from "../utils/ellipsify";
import { fetchConfiguredSgtMint, userHasSgt, type SgtStatus } from "../utils/sgt";
import { getProgram } from "../utils/program";
import { ubiPoolPda, verificationPda } from "../utils/pdas";
import { buildRegisterVerificationTx } from "../utils/txs";
import { alertAndLog } from "../utils/alertAndLog";

/**
 * VerifyScreen — formerly HomeScreen. The required onboarding flow:
 *  1. Connect Mobile Wallet Adapter.
 *  2. Confirm wallet holds the configured SGT (Token-2022 NFT).
 *  3. Sign on-chain `register_verification` to commit a VerificationRecord PDA.
 */
export function HomeScreen() {
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SgtStatus | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [poolMissing, setPoolMissing] = useState(false);

  const refresh = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setPoolMissing(false);
    try {
      const program = getProgram(connection, selectedAccount.publicKey);
      const sgtMint = await fetchConfiguredSgtMint(program, ubiPoolPda());
      if (!sgtMint) {
        setPoolMissing(true);
        setStatus(null);
        setVerified(null);
        return;
      }
      const sgt = await userHasSgt(connection, selectedAccount.publicKey, sgtMint);
      setStatus(sgt);
      const v = await connection.getAccountInfo(verificationPda(selectedAccount.publicKey));
      setVerified(v !== null);
    } catch (e: any) {
      alertAndLog("Refresh failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onVerify = useCallback(async () => {
    if (!selectedAccount || !status?.ataAddress) return;
    setLoading(true);
    try {
      const tx = await buildRegisterVerificationTx(
        connection,
        selectedAccount.publicKey,
        status.ataAddress,
      );
      const minSlot = await connection.getSlot();
      const sig = await signAndSendTransaction(tx, minSlot);
      await connection.confirmTransaction(sig, "confirmed");
      alertAndLog("Verified", `Tx: ${ellipsify(sig)}`);
      await refresh();
    } catch (e: any) {
      alertAndLog("Verify failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, status, connection, signAndSendTransaction, refresh]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text variant="displaySmall" style={styles.title}>
        Pied Piper
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        A prediction market that funds UBI for verified Seeker owners.
      </Text>

      {!selectedAccount ? (
        <View style={{ marginTop: 24 }}>
          <SignInFeature />
        </View>
      ) : poolMissing ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">UBI pool not initialized</Text>
            <Text variant="bodyMedium">
              Run `yarn seed --seekerPubkey={selectedAccount.publicKey.toBase58()}`
              from the repo root to set up devnet for this wallet.
            </Text>
            <Button onPress={refresh} mode="contained-tonal" style={{ marginTop: 12 }}>
              Refresh
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Wallet</Text>
              <Text variant="bodyMedium">{ellipsify(selectedAccount.publicKey.toBase58())}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Seeker Genesis Token</Text>
              {loading && status === null ? (
                <ActivityIndicator style={{ marginTop: 8 }} />
              ) : status?.hasSgt ? (
                <Chip icon="check" style={styles.chipOk}>
                  SGT detected ({ellipsify(status.sgtMint!.toBase58())})
                </Chip>
              ) : (
                <Chip icon="close" style={styles.chipBad}>
                  No SGT in this wallet
                </Chip>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Personhood</Text>
              {verified ? (
                <Chip icon="check-decagram" style={styles.chipOk}>
                  Verified
                </Chip>
              ) : (
                <>
                  <Chip icon="alert" style={styles.chipBad}>
                    Not verified
                  </Chip>
                  <Button
                    mode="contained"
                    style={{ marginTop: 12 }}
                    disabled={!status?.hasSgt || loading}
                    onPress={onVerify}
                    loading={loading}
                  >
                    Verify Personhood
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16 },
  title: { fontWeight: "700" },
  subtitle: { marginTop: 4, opacity: 0.7 },
  card: { marginTop: 16 },
  chipOk: { alignSelf: "flex-start", marginTop: 8, backgroundColor: "#1f4d1f" },
  chipBad: { alignSelf: "flex-start", marginTop: 8, backgroundColor: "#4d1f1f" },
});
