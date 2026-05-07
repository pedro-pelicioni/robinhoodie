import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Account, useAuthorization } from "./useAuthorization";
import {
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { SignInPayload } from "@solana-mobile/mobile-wallet-adapter-protocol";

// Seed Vault occasionally invalidates a cached auth_token (after device locks,
// reboot, or extended idle) without the wallet reauthorizing silently. The
// MWA bottom sheet then opens and immediately cancels, surfacing as
// `java.util.concurrent.CancellationException` on the RN side. If we see that
// shape, we wipe the stored auth and let the user retry with a fresh grant.
function isStaleAuthCancellation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return /CancellationException/i.test(msg);
}

export function useMobileWallet() {
  const {
    authorizeSessionWithSignIn,
    authorizeSession,
    freshAuthorizeSession,
    deauthorizeSession,
    clearAuthorization,
  } = useAuthorization();

  const connect = useCallback(async (): Promise<Account> => {
    return await transact(async (wallet) => {
      return await authorizeSession(wallet);
    });
  }, [authorizeSession]);

  const signIn = useCallback(
    async (signInPayload: SignInPayload): Promise<Account> => {
      return await transact(async (wallet) => {
        return await authorizeSessionWithSignIn(wallet, signInPayload);
      });
    },
    [authorizeSession]
  );

  const disconnect = useCallback(async (): Promise<void> => {
    // Best-effort wallet-side deauthorize, but always nuke the local cache so
    // a stale token can't keep the user stuck.
    try {
      await transact(async (wallet) => {
        await deauthorizeSession(wallet);
      });
    } catch {
      // ignore — we still clear our local cache below
    }
    await clearAuthorization();
  }, [deauthorizeSession, clearAuthorization]);

  // Default path uses the cached auth_token (read live from AsyncStorage in
  // authorizeSession). If Seed Vault rejects the cached token, MWA closes
  // the bottom sheet and we surface a `CancellationException` — the entire
  // `transact()` session is dead at that point, so we open a NEW transact()
  // and force a fresh authorize (no auth_token) on the retry. We deliberately
  // do NOT clearAuthorization() in between: that would null out
  // `selectedAccount` and unmount the host screen, killing the new transact.
  const signAndSendTransaction = useCallback(
    async (
      transaction: Transaction | VersionedTransaction,
      minContextSlot: number,
    ): Promise<TransactionSignature> => {
      const run = (fresh: boolean) =>
        transact(async (wallet) => {
          if (fresh) {
            await freshAuthorizeSession(wallet);
          } else {
            await authorizeSession(wallet);
          }
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
            minContextSlot,
          });
          return signatures[0];
        });
      try {
        return await run(false);
      } catch (e) {
        if (!isStaleAuthCancellation(e)) throw e;
        return await run(true);
      }
    },
    [authorizeSession, freshAuthorizeSession]
  );

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      const run = (fresh: boolean) =>
        transact(async (wallet) => {
          const authResult = fresh
            ? await freshAuthorizeSession(wallet)
            : await authorizeSession(wallet);
          const signedMessages = await wallet.signMessages({
            addresses: [authResult.address],
            payloads: [message],
          });
          return signedMessages[0];
        });
      try {
        return await run(false);
      } catch (e) {
        if (!isStaleAuthCancellation(e)) throw e;
        return await run(true);
      }
    },
    [authorizeSession, freshAuthorizeSession]
  );

  return useMemo(
    () => ({
      connect,
      signIn,
      disconnect,
      signAndSendTransaction,
      signMessage,
    }),
    [signAndSendTransaction, signMessage]
  );
}
