import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
// bs58 is a transitive dep of @solana/web3.js; no @types/bs58 ships.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bs58 = require("bs58") as { encode(b: Uint8Array): string };

import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../utils/ConnectionProvider";
import { positionPda, ubiPoolPda, verificationPda } from "../utils/pdas";
import { PROGRAM_ID } from "../utils/config";
import {
  ACCOUNT_DISC,
  type Market,
  type Position,
  decodeMarket,
  decodePosition,
} from "../utils/codec";
import { buildClaimUbiTx, buildPlaceBetTx } from "../utils/txs";
import { alertAndLog } from "../utils/alertAndLog";
import { ellipsify } from "../utils/ellipsify";
import { VENUE_GEO } from "../utils/config";
import { refreshUbiWidget } from "../utils/widgetBridge";

import { theme } from "../theme/tokens";
import { Screen } from "../components/primitives/Screen";
import { T } from "../components/primitives/Display";
import { Eyebrow } from "../components/primitives/Eyebrow";
import { HeroValueBlock } from "../components/primitives/HeroValueBlock";
import { StatusSurface } from "../components/primitives/StatusSurface";
import { BetButtons } from "../components/primitives/BetButtons";
import { AmountChips } from "../components/primitives/AmountChips";
import { PrimaryButton } from "../components/primitives/PrimaryButton";
import { GhostButton } from "../components/primitives/GhostButton";

type Side = "yes" | "no";

interface MarketView {
  account: Market;
  publicKey: PublicKey;
  position?: Position;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function lamportsToSol(lamports: bigint | number): number {
  const n = typeof lamports === "bigint" ? Number(lamports) : lamports;
  return n / LAMPORTS_PER_SOL;
}

function formatSol(n: number, dp = 4): string {
  return n.toFixed(dp);
}

export default function BlankScreen() {
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();
  const { connection } = useConnection();
  const [markets, setMarkets] = useState<MarketView[]>([]);
  const [poolLamports, setPoolLamports] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});
  const [selectedSides, setSelectedSides] = useState<Record<string, Side | null>>(
    {},
  );
  const [pendingMarketId, setPendingMarketId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [verified, setVerified] = useState(false);
  const [claimingUbi, setClaimingUbi] = useState(false);
  const [claimableLamports, setClaimableLamports] = useState<number>(0);
  const [verifiedHumans, setVerifiedHumans] = useState<number>(0);

  const refresh = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const [raw, poolBalance, poolInfo, verifyAcc] = await Promise.all([
        connection.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { memcmp: { offset: 0, bytes: bs58.encode(ACCOUNT_DISC.Market) } },
          ],
        }),
        connection.getBalance(ubiPoolPda(), "confirmed"),
        connection.getAccountInfo(ubiPoolPda(), "confirmed"),
        connection.getAccountInfo(verificationPda(selectedAccount.publicKey)),
      ]);

      const enriched: MarketView[] = [];
      for (const { pubkey, account } of raw) {
        const m = decodeMarket(new Uint8Array(account.data));
        if (!m) continue;
        const view: MarketView = { account: m, publicKey: pubkey };
        const posInfo = await connection.getAccountInfo(
          positionPda(pubkey, selectedAccount.publicKey),
          "confirmed",
        );
        if (posInfo) {
          const pos = decodePosition(new Uint8Array(posInfo.data));
          if (pos) view.position = pos;
        }
        enriched.push(view);
      }
      enriched.sort((a, b) => a.account.status - b.account.status);
      // Drop legacy geo-fenced markets seeded with the old 50 m radius.
      const visible = enriched.filter(
        (v) => v.account.geoH3 === 0n || v.account.geoRadiusM >= 1000,
      );
      setMarkets(visible);
      setPoolLamports(poolBalance);
      setVerified(verifyAcc !== null);

      // Decode just the fields we need from UbiPool to compute the actual
      // claimable amount, mirroring `claim_ubi` in lib.rs:
      //   if (now/epoch_seconds) > pool.current_epoch:
      //     pool.total_lamports / max(verified_count, 1)   (next claim rolls)
      //   else:
      //     pool.per_epoch_lamports                         (already snapshot)
      //
      // Layout: 8 disc | 32 admin | 32 sgt_mint | 8 total | 8 verified |
      //         8 cur_epoch | 8 epoch_start | 8 per_epoch | 8 epoch_seconds | 1 bump
      if (poolInfo && poolInfo.data.length >= 121) {
        const data = poolInfo.data;
        const totalLamports = data.readBigUInt64LE(72);
        const verifiedCount = data.readBigUInt64LE(80);
        const currentEpoch = data.readBigUInt64LE(88);
        const perEpochLamports = data.readBigUInt64LE(104);
        const epochSeconds = data.readBigInt64LE(112);
        const nowEpoch =
          epochSeconds > 0n
            ? BigInt(Math.floor(Date.now() / 1000)) / epochSeconds
            : 0n;
        const count = verifiedCount > 0n ? verifiedCount : 1n;
        const claimable =
          nowEpoch > currentEpoch ? totalLamports / count : perEpochLamports;
        setClaimableLamports(Number(claimable));
        setVerifiedHumans(Number(verifiedCount));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alertAndLog("Refresh markets failed", msg);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // GPS for the geo-fenced markets stretch goal.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    })().catch(() => {});
  }, []);

  const inRange = useCallback(
    (geoH3: bigint, radiusM: number): boolean => {
      if (geoH3 === 0n || radiusM === 0) return true;
      if (!coords) return false;
      return (
        haversineMeters(coords.lat, coords.lon, VENUE_GEO.lat, VENUE_GEO.lon) <=
        radiusM
      );
    },
    [coords],
  );

  const onPlaceBet = useCallback(
    async (m: MarketView, side: Side) => {
      if (!selectedAccount) return;
      const id = m.account.marketId.toString();
      const raw = betAmounts[id] ?? "0.1";
      const parsed = parseFloat(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        alertAndLog("Invalid amount", "Enter a positive SKR amount");
        return;
      }
      const amountLamports = BigInt(Math.floor(parsed * LAMPORTS_PER_SOL));
      setPendingMarketId(id);
      try {
        const tx = await buildPlaceBetTx(
          connection,
          selectedAccount.publicKey,
          m.account.marketId,
          side === "yes",
          amountLamports,
        );
        const sig = await signAndSendTransaction(
          tx,
          await connection.getSlot(),
        );
        await connection.confirmTransaction(sig, "confirmed");
        alertAndLog(`Bet placed (${side.toUpperCase()})`, ellipsify(sig));
        setSelectedSides((p) => ({ ...p, [id]: null }));
        await refresh();
        void refreshUbiWidget();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        alertAndLog("Bet failed", msg);
      } finally {
        setPendingMarketId(null);
      }
    },
    [selectedAccount, connection, betAmounts, signAndSendTransaction, refresh],
  );

  const onClaimUbi = useCallback(async () => {
    if (!selectedAccount) return;
    setClaimingUbi(true);
    try {
      const tx = await buildClaimUbiTx(connection, selectedAccount.publicKey);
      const sig = await signAndSendTransaction(tx, await connection.getSlot());
      await connection.confirmTransaction(sig, "confirmed");
      alertAndLog("UBI claimed", ellipsify(sig));
      await refresh();
      void refreshUbiWidget();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alertAndLog("UBI claim failed", msg);
    } finally {
      setClaimingUbi(false);
    }
  }, [selectedAccount, connection, signAndSendTransaction, refresh]);

  const totalPool = useMemo(
    () =>
      poolLamports !== null ? formatSol(lamportsToSol(poolLamports), 3) : "—",
    [poolLamports],
  );
  const claimable = useMemo(
    () => formatSol(lamportsToSol(claimableLamports), 4),
    [claimableLamports],
  );

  if (!selectedAccount) {
    return (
      <Screen>
        <StatusSurface
          eyebrow="Wallet"
          title="Connect on the Verify tab first"
          subtitle="RobinHoodie's markets are gated on Seeker personhood."
          iconName="wallet-outline"
          tone="muted"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heroWrap}>
        <HeroValueBlock
          eyebrow="Your epoch share"
          value={claimable}
          unit="SKR"
          caption={
            verified
              ? `Pool ${totalPool} SKR · ${verifiedHumans} verified ${verifiedHumans === 1 ? "human" : "humans"} · only fees + welfare donations distribute.`
              : "Verify on the Verify tab to start claiming your epoch share."
          }
        />
        <PrimaryButton
          label={
            verified
              ? claimingUbi
                ? "Claiming…"
                : "Claim UBI"
              : "Verify on the Verify tab"
          }
          caption={verified ? "Biometric required · claim_ubi" : undefined}
          onPress={onClaimUbi}
          disabled={!verified || claimingUbi}
          loading={claimingUbi}
        />
      </View>

      <View style={styles.marketsHeader}>
        <Eyebrow>Markets</Eyebrow>
        <GhostButton
          label="Refresh"
          iconName="refresh"
          size="sm"
          onPress={refresh}
          loading={loading && markets.length > 0}
        />
      </View>

      {markets.length === 0 && !loading ? (
        <StatusSurface
          eyebrow="Empty"
          title="No markets yet"
          subtitle="Run yarn seed from the repo root to populate devnet."
          iconName="information-outline"
          tone="muted"
        />
      ) : null}

      <View style={styles.list}>
        {markets.map((m) => {
          const id = m.account.marketId.toString();
          const open = m.account.status === 0;
          const settled = m.account.status === 1;
          const outcome = m.account.outcome;
          const inGeo = inRange(m.account.geoH3, m.account.geoRadiusM);
          const isGeoFenced = m.account.geoH3 !== 0n;
          const winningSideStake = m.position
            ? outcome
              ? m.position.yesLamports
              : m.position.noLamports
            : 0n;
          const isWinner = settled && winningSideStake > 0n;
          const totalMarketPool =
            m.account.yesLamports + m.account.noLamports;
          const winningPool = outcome
            ? m.account.yesLamports
            : m.account.noLamports;
          const projectedPayout =
            isWinner && winningPool > 0n
              ? lamportsToSol((winningSideStake * totalMarketPool) / winningPool)
              : 0;

          const yesPool = formatSol(lamportsToSol(m.account.yesLamports), 3);
          const noPool = formatSol(lamportsToSol(m.account.noLamports), 3);

          const selected = selectedSides[id] ?? null;
          const amount = betAmounts[id] ?? "0.1";
          const pendingHere = pendingMarketId === id;
          const betDisabled =
            !verified || !inGeo || pendingHere || loading;

          return (
            <View key={id} style={styles.marketBlock}>
              <T variant="title" tone="primary">
                {m.account.question}
              </T>

              <View style={styles.statusRow}>
                <StatusSurface
                  size="sm"
                  title={open ? "Open" : `Settled · ${outcome ? "YES" : "NO"}`}
                  iconName={open ? "circle-outline" : "check-circle"}
                  tone={open ? "neutral" : outcome ? "kelp" : "terra"}
                  style={styles.statusItem}
                />
                {isGeoFenced ? (
                  <StatusSurface
                    size="sm"
                    title={
                      inGeo
                        ? `In range (${m.account.geoRadiusM} m)`
                        : "Out of range"
                    }
                    iconName={inGeo ? "map-marker-check" : "map-marker-off"}
                    tone={inGeo ? "kelp" : "terra"}
                    style={styles.statusItem}
                  />
                ) : null}
              </View>

              <View style={styles.poolRow}>
                <PoolStat label="YES pool" value={yesPool} unit="SKR" tone="kelp" />
                <View style={styles.poolDivider} />
                <PoolStat label="NO pool" value={noPool} unit="SKR" tone="terra" />
              </View>

              {open ? (
                <View style={styles.betBlock}>
                  <Eyebrow>Stake</Eyebrow>
                  <AmountChips
                    value={amount}
                    onChange={(next) =>
                      setBetAmounts((p) => ({ ...p, [id]: next }))
                    }
                    style={styles.amountChips}
                  />
                  <BetButtons
                    yesPool={yesPool}
                    noPool={noPool}
                    selected={selected}
                    disabled={betDisabled}
                    loading={pendingHere}
                    onSelect={(side) =>
                      setSelectedSides((p) => ({ ...p, [id]: side }))
                    }
                    onConfirm={(side) => onPlaceBet(m, side)}
                    style={styles.betButtons}
                  />
                  {!verified ? (
                    <T
                      variant="numericCaption"
                      tone="tertiary"
                      style={styles.betHint}
                    >
                      verify on the Verify tab to bet
                    </T>
                  ) : !inGeo ? (
                    <T
                      variant="numericCaption"
                      tone="tertiary"
                      style={styles.betHint}
                    >
                      bets open within {m.account.geoRadiusM} m of the venue
                    </T>
                  ) : selected ? (
                    <T variant="numericCaption" tone="amber" style={styles.betHint}>
                      tap {selected.toUpperCase()} again to confirm · place_bet
                    </T>
                  ) : null}
                </View>
              ) : null}

              {isWinner && !m.position?.claimed ? (
                <StatusSurface
                  eyebrow="You won"
                  title={`${formatSol(projectedPayout)} SKR`}
                  subtitle="Auto-credited at next epoch."
                  iconName="trophy-variant"
                  tone="amber"
                  style={styles.wonBlock}
                />
              ) : null}

              {m.position?.claimed ? (
                <StatusSurface
                  size="sm"
                  title="Already credited"
                  iconName="cash-check"
                  tone="muted"
                  style={styles.wonBlock}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

interface PoolStatProps {
  label: string;
  value: string;
  unit: string;
  tone: "kelp" | "terra";
}

function PoolStat({ label, value, unit, tone }: PoolStatProps) {
  return (
    <View style={styles.poolStat}>
      <Eyebrow tone={tone}>{label}</Eyebrow>
      <View style={styles.poolValueRow}>
        <T variant="numericTitle" tone="primary">
          {value}
        </T>
        <T variant="numericCaption" tone="tertiary" style={styles.poolUnit}>
          {unit}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  marketsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.xl,
  },
  marketBlock: {
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  statusItem: {
    flexShrink: 1,
  },
  poolRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: theme.spacing.lg,
    backgroundColor: theme.bgLifted,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
  },
  poolDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: theme.spacing.md,
  },
  poolStat: {
    flex: 1,
  },
  poolValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  poolUnit: {
    marginLeft: 4,
  },
  betBlock: {
    marginTop: theme.spacing.lg,
  },
  amountChips: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  betButtons: {
    marginTop: theme.spacing.xs,
  },
  betHint: {
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  wonBlock: {
    marginTop: theme.spacing.lg,
  },
});
