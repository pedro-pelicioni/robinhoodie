import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Button, Card, Chip, Divider, Text } from "react-native-paper";
import * as Location from "expo-location";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
// bs58 is a transitive dep of @solana/web3.js; no @types/bs58 ships.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bs58 = require("bs58") as { encode(b: Uint8Array): string };

import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../utils/ConnectionProvider";
import { positionPda, verificationPda } from "../utils/pdas";
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

function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export default function BlankScreen() {
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();
  const { connection } = useConnection();
  const [markets, setMarkets] = useState<MarketView[]>([]);
  const [loading, setLoading] = useState(false);
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [verified, setVerified] = useState(false);

  const refresh = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      // Fetch all program accounts whose first 8 bytes match the Market
      // discriminator. Filter pushes the work to the RPC node.
      const raw = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(ACCOUNT_DISC.Market),
            },
          },
        ],
      });
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
      setMarkets(enriched);

      const v = await connection.getAccountInfo(
        verificationPda(selectedAccount.publicKey),
      );
      setVerified(v !== null);
    } catch (e: any) {
      console.error("Refresh markets failed:", e?.message ?? e);
      alertAndLog("Refresh markets failed", e?.message ?? String(e));
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
      // `geo_h3 != 0` is our marker for "geo-fenced"; we resolve to the canonical
      // demo center (`VENUE_GEO`) off-chain.
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
    async (m: MarketView, side: boolean) => {
      if (!selectedAccount) return;
      const raw = betAmounts[m.account.marketId.toString()] ?? "0.1";
      const amountLamports = BigInt(
        Math.floor(parseFloat(raw) * LAMPORTS_PER_SOL),
      );
      if (amountLamports <= 0n) {
        alertAndLog("Invalid amount", "Enter a positive SKR amount");
        return;
      }
      setLoading(true);
      try {
        const tx = await buildPlaceBetTx(
          connection,
          selectedAccount.publicKey,
          m.account.marketId,
          side,
          amountLamports,
        );
        const sig = await signAndSendTransaction(tx, await connection.getSlot());
        await connection.confirmTransaction(sig, "confirmed");
        alertAndLog(`Bet placed (${side ? "YES" : "NO"})`, ellipsify(sig));
        await refresh();
      } catch (e: any) {
        alertAndLog("Bet failed", e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    },
    [selectedAccount, connection, betAmounts, signAndSendTransaction, refresh],
  );

  const onClaimUbi = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const tx = await buildClaimUbiTx(connection, selectedAccount.publicKey);
      const sig = await signAndSendTransaction(tx, await connection.getSlot());
      await connection.confirmTransaction(sig, "confirmed");
      alertAndLog("UBI claimed", ellipsify(sig));
    } catch (e: any) {
      alertAndLog("UBI claim failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, connection, signAndSendTransaction]);

  if (!selectedAccount) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge">Connect a wallet on the Verify tab first.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={styles.title}>
          Markets
        </Text>
        <Button onPress={refresh} mode="text" loading={loading}>
          Refresh
        </Button>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Daily UBI</Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
            Claim your epoch's share of accumulated trading fees.
          </Text>
          <Button
            mode="contained"
            onPress={onClaimUbi}
            disabled={!verified || loading}
            loading={loading}
            style={{ marginTop: 12 }}
          >
            {verified ? "Claim UBI" : "Verify on the Verify tab first"}
          </Button>
        </Card.Content>
      </Card>

      <Divider style={{ marginVertical: 16 }} />

      {loading && markets.length === 0 ? (
        <ActivityIndicator />
      ) : markets.length === 0 ? (
        <Text>No markets yet. Run `yarn seed` from the repo root.</Text>
      ) : (
        markets.map((m) => {
          const id = m.account.marketId.toString();
          const open = m.account.status === 0;
          const settled = m.account.status === 1;
          const outcome = m.account.outcome;
          const inGeo = inRange(m.account.geoH3, m.account.geoRadiusM);
          // We only show whether the user won (or already cashed out) — winnings
          // are batch-distributed by a back-end cron, not a per-market button.
          const winningSideStake = m.position
            ? outcome
              ? m.position.yesLamports
              : m.position.noLamports
            : 0n;
          const isWinner = settled && winningSideStake > 0n;
          const totalPool = m.account.yesLamports + m.account.noLamports;
          const winningPool = outcome ? m.account.yesLamports : m.account.noLamports;
          const projectedPayout =
            isWinner && winningPool > 0n
              ? lamportsToSol((winningSideStake * totalPool) / winningPool)
              : 0;
          const isGeoFenced = m.account.geoH3 !== 0n;
          return (
            <Card key={id} style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{m.account.question}</Text>
                <View style={styles.statusRow}>
                  <Chip
                    icon={open ? "circle" : "check"}
                    style={open ? styles.chipOpen : styles.chipSettled}
                  >
                    {open ? "Open" : `Settled: ${outcome ? "YES" : "NO"}`}
                  </Chip>
                  {isGeoFenced && (
                    <Chip
                      icon="map-marker"
                      style={inGeo ? styles.chipOk : styles.chipBad}
                    >
                      {inGeo ? `In range (${m.account.geoRadiusM}m)` : "Out of range"}
                    </Chip>
                  )}
                </View>
                <Text variant="bodySmall" style={{ marginTop: 8 }}>
                  YES pool: {lamportsToSol(m.account.yesLamports).toFixed(4)} SKR
                  · NO pool: {lamportsToSol(m.account.noLamports).toFixed(4)} SKR
                </Text>
                {open && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Amount in SKR (e.g. 0.1)"
                      placeholderTextColor="#888"
                      keyboardType="decimal-pad"
                      value={betAmounts[id] ?? ""}
                      onChangeText={(t) =>
                        setBetAmounts((p) => ({ ...p, [id]: t }))
                      }
                    />
                    <View style={styles.btnRow}>
                      <Button
                        mode="contained"
                        onPress={() => onPlaceBet(m, true)}
                        disabled={!inGeo || loading}
                        style={styles.btnYes}
                      >
                        YES
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => onPlaceBet(m, false)}
                        disabled={!inGeo || loading}
                        style={styles.btnNo}
                      >
                        NO
                      </Button>
                    </View>
                  </>
                )}
                {isWinner && !m.position?.claimed && (
                  <Chip icon="trophy" style={[styles.chipOk, { marginTop: 12 }]}>
                    You won {projectedPayout.toFixed(4)} SKR — auto-credited at next epoch
                  </Chip>
                )}
                {m.position?.claimed && (
                  <Chip icon="cash" style={{ alignSelf: "flex-start", marginTop: 8 }}>
                    Already credited
                  </Chip>
                )}
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: "700" },
  card: { marginTop: 12 },
  statusRow: { flexDirection: "row", marginTop: 8, gap: 8, flexWrap: "wrap" },
  chipOpen: { backgroundColor: "#1f3a4d" },
  chipSettled: { backgroundColor: "#3a3a3a" },
  chipOk: { backgroundColor: "#1f4d1f" },
  chipBad: { backgroundColor: "#4d1f1f" },
  input: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#222",
    color: "#fff",
  },
  btnRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  btnYes: { flex: 1, backgroundColor: "#2e7d32" },
  btnNo: { flex: 1, backgroundColor: "#c62828" },
});
