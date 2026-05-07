import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../utils/ConnectionProvider";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { fetchConfiguredSgtMint, userHasSgt, type SgtStatus } from "../utils/sgt";
import { ubiPoolPda, verificationPda } from "../utils/pdas";
import { buildRegisterVerificationTx } from "../utils/txs";
import { alertAndLog } from "../utils/alertAndLog";
import { ellipsify } from "../utils/ellipsify";

import { theme } from "../theme/tokens";
import { Screen } from "../components/primitives/Screen";
import { T } from "../components/primitives/Display";
import { Eyebrow } from "../components/primitives/Eyebrow";
import { HashDisplay } from "../components/primitives/HashDisplay";
import { StatusSurface } from "../components/primitives/StatusSurface";
import { BiometricSurface } from "../components/primitives/BiometricSurface";
import { PrimaryButton } from "../components/primitives/PrimaryButton";
import { GhostButton } from "../components/primitives/GhostButton";

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [status, setStatus] = useState<SgtStatus | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [poolMissing, setPoolMissing] = useState(false);

  const refresh = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setPoolMissing(false);
    try {
      const sgtMint = await fetchConfiguredSgtMint(connection, ubiPoolPda());
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alertAndLog("Refresh failed", msg);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onVerify = useCallback(async () => {
    if (!selectedAccount || !status?.ataAddress) return;
    setSigning(true);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alertAndLog("Verify failed", msg);
    } finally {
      setSigning(false);
    }
  }, [selectedAccount, status, connection, signAndSendTransaction, refresh]);

  if (!selectedAccount) {
    return (
      <Screen>
        <View style={styles.discBlock}>
          <Eyebrow>Personhood</Eyebrow>
          <T variant="display" tone="amber" style={styles.discValue}>
            Hold the line
          </T>
          <T variant="body" tone="secondary" style={styles.discCaption}>
            Connect a Solana Mobile wallet. RobinHoodie requires a Seeker
            Genesis Token to enter; no SGT, no UBI claim, no bet.
          </T>
        </View>
        <SignInFeature />
      </Screen>
    );
  }

  if (poolMissing) {
    return (
      <Screen>
        <StatusSurface
          eyebrow="Setup"
          title="UBI pool not initialised"
          subtitle="Run the seed script for this wallet, then refresh."
          iconName="alert-octagon-outline"
          tone="terra"
        />
        <View style={styles.codeBlock}>
          <Eyebrow>Run from repo root</Eyebrow>
          <T variant="numericBody" tone="secondary" style={styles.codeText}>
            yarn seed --seekerPubkey={ellipsify(selectedAccount.publicKey.toBase58(), 6)}
          </T>
        </View>
        <GhostButton
          label="Refresh"
          iconName="refresh"
          onPress={refresh}
          loading={loading}
          style={{ marginTop: theme.spacing.lg }}
        />
      </Screen>
    );
  }

  const hasSgt = !!status?.hasSgt;
  const isVerified = verified === true;
  const showBiometric = hasSgt && !isVerified;

  return (
    <Screen>
      <View style={styles.headerBlock}>
        <Eyebrow>Wallet</Eyebrow>
        <HashDisplay
          value={selectedAccount.publicKey.toBase58()}
          style={styles.walletHash}
        />
      </View>

      <View style={styles.stack}>
        <StatusSurface
          eyebrow={hasSgt ? "Seeker Genesis Token" : "No SGT"}
          title={hasSgt ? "SGT detected" : "No SGT in this wallet"}
          subtitle={
            hasSgt && status?.sgtMint
              ? `Mint ${ellipsify(status.sgtMint.toBase58())}`
              : "RobinHoodie requires a Seeker Genesis Token. Get a Solana Mobile Seeker, then return."
          }
          iconName={hasSgt ? "shield-check" : "shield-off-outline"}
          tone={hasSgt ? "kelp" : "terra"}
        />

        <StatusSurface
          eyebrow={isVerified ? "Verified human" : "Personhood"}
          title={isVerified ? "Verified" : "Not yet verified"}
          subtitle={
            isVerified
              ? "Your VerificationRecord PDA is on-chain. UBI claims are now open."
              : hasSgt
                ? "Sign register_verification with biometrics to commit personhood on-chain."
                : "Verification requires SGT first."
          }
          iconName={isVerified ? "check-decagram" : "fingerprint"}
          tone={isVerified ? "kelp" : "neutral"}
        />
      </View>

      {showBiometric ? (
        <View style={styles.biometricBlock}>
          <BiometricSurface
            caption="Hold to sign"
            verb="register_verification"
            active={!signing}
          />
          <PrimaryButton
            label={signing ? "Signing…" : "Verify Personhood"}
            caption="Biometric required · writes VerificationRecord PDA"
            onPress={onVerify}
            disabled={signing || loading}
            loading={signing}
            style={styles.cta}
          />
        </View>
      ) : null}

      {!showBiometric && !isVerified ? (
        <View style={styles.cta}>
          <GhostButton
            label="Refresh status"
            iconName="refresh"
            onPress={refresh}
            loading={loading}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  discBlock: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  discValue: {
    fontSize: 44,
    lineHeight: 46,
    marginTop: theme.spacing.sm,
  },
  discCaption: {
    marginTop: theme.spacing.md,
    maxWidth: 320,
  },
  headerBlock: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  walletHash: {
    marginTop: 6,
  },
  stack: {
    gap: theme.spacing.md,
  },
  biometricBlock: {
    marginTop: theme.spacing.xl,
  },
  cta: {
    marginTop: theme.spacing.xl,
  },
  codeBlock: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.bgLifted,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  codeText: {
    marginTop: theme.spacing.xs,
  },
});
