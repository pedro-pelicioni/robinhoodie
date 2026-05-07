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
import BN from "bn.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../utils/ConnectionProvider";
import { getProgram } from "../utils/program";
import { positionPda, verificationPda } from "../utils/pdas";
import {
  buildClaimUbiTx,
  buildClaimWinningsTx,
  buildPlaceBetTx,
} from "../utils/txs";
import { alertAndLog } from "../utils/alertAndLog";
import { ellipsify } from "../utils/ellipsify";
import { VENUE_GEO } from "../utils/config";

interface MarketView {
  account: any;
  publicKey: any;
  marketId: BN;
  position?: any;
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
      const program = getProgram(connection, selectedAccount.publicKey);
      const all = (await program.account.market.all()) as any[];
      const enriched: MarketView[] = await Promise.all(
        all.map(async (m) => {
          const view: MarketView = {
            account: m.account,
            publicKey: m.publicKey,
            marketId: m.account.marketId as BN,
          };
          try {
            view.position = await program.account.position.fetch(
              positionPda(m.publicKey, selectedAccount.publicKey),
            );
          } catch {
            // no position yet
          }
          return view;
        }),
      );
      enriched.sort((a, b) => a.account.status - b.account.status);
      setMarkets(enriched);
      const v = await connection.getAccountInfo(
        verificationPda(selectedAccount.publicKey),
      );
      setVerified(v !== null);
    } catch (e: any) {
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
    (geoH3: BN, radiusM: number): boolean => {
      // The on-chain `geo_h3 != 0` is a marker that this is a geo-fenced market;
      // we resolve to the canonical demo center (`VENUE_GEO`) off-chain.
      if (geoH3.eqn(0) || radiusM === 0) return true;
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
      const raw = betAmounts[m.marketId.toString()] ?? "0.1";
      const amount = new BN(Math.floor(parseFloat(raw) * LAMPORTS_PER_SOL));
      if (amount.lten(0)) {
        alertAndLog("Invalid amount", "Enter a positive SOL amount");
        return;
      }
      setLoading(true);
      try {
        const tx = await buildPlaceBetTx(
          connection,
          selectedAccount.publicKey,
          m.marketId,
          side,
          amount,
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

  const onClaimWinnings = useCallback(
    async (m: MarketView) => {
      if (!selectedAccount) return;
      setLoading(true);
      try {
        const tx = await buildClaimWinningsTx(
          connection,
          selectedAccount.publicKey,
          m.marketId,
        );
        const sig = await signAndSendTransaction(tx, await connection.getSlot());
        await connection.confirmTransaction(sig, "confirmed");
        alertAndLog("Winnings claimed", ellipsify(sig));
        await refresh();
      } catch (e: any) {
        alertAndLog("Claim failed", e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    },
    [selectedAccount, connection, signAndSendTransaction, refresh],
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
          const id = m.marketId.toString();
          const geoH3 = m.account.geoH3 as BN;
          const radiusM = (m.account.geoRadiusM as number) ?? 0;
          const open = m.account.status === 0;
          const settled = m.account.status === 1;
          const outcome: boolean = m.account.outcome;
          const yes = (m.account.yesLamports as BN).toString();
          const no = (m.account.noLamports as BN).toString();
          const inGeo = inRange(geoH3, radiusM);
          const winningSideStake = m.position
            ? outcome
              ? (m.position.yesLamports as BN)
              : (m.position.noLamports as BN)
            : new BN(0);
          const canClaimWinnings =
            settled && !m.position?.claimed && winningSideStake.gt(new BN(0));
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
                  {!geoH3.eqn(0) && (
                    <Chip
                      icon="map-marker"
                      style={inGeo ? styles.chipOk : styles.chipBad}
                    >
                      {inGeo ? `In range (${radiusM}m)` : "Out of range"}
                    </Chip>
                  )}
                </View>
                <Text variant="bodySmall" style={{ marginTop: 8 }}>
                  YES pool: {(parseInt(yes) / LAMPORTS_PER_SOL).toFixed(4)} SOL ·
                  NO pool: {(parseInt(no) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </Text>
                {open && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Amount in SOL (e.g. 0.1)"
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
                {canClaimWinnings && (
                  <Button
                    mode="contained-tonal"
                    onPress={() => onClaimWinnings(m)}
                    style={{ marginTop: 12 }}
                  >
                    Claim Winnings
                  </Button>
                )}
                {m.position?.claimed && (
                  <Chip icon="cash" style={{ alignSelf: "flex-start", marginTop: 8 }}>
                    Already claimed
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
