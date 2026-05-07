/**
 * Build an Anchor `Program` instance that can produce instructions but uses
 * Mobile Wallet Adapter for signing.
 *
 * The provider's `signTransaction` / `signAllTransactions` are stubbed with
 * a thrower — callers MUST go through `useMobileWallet().signAndSendTransaction`
 * to submit the built tx. We use anchor only as an instruction builder + IDL
 * decoder to avoid the bundle / RN-compat risk of routing send through anchor.
 */
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import idl from "../idl/prediction_market.json";
import type { PredictionMarket } from "../types/prediction_market";
import { PROGRAM_ID } from "./config";

export type PredictionMarketIdl = typeof idl;

class StubWallet {
  constructor(public publicKey: PublicKey) {}
  async signTransaction<T extends Transaction>(_tx: T): Promise<T> {
    throw new Error("StubWallet: use MWA signAndSendTransaction instead");
  }
  async signAllTransactions<T extends Transaction>(_txs: T[]): Promise<T[]> {
    throw new Error("StubWallet: use MWA signAndSendTransaction instead");
  }
}

export function getProgram(
  connection: Connection,
  user: PublicKey,
): Program<PredictionMarket> {
  const provider = new AnchorProvider(connection, new StubWallet(user) as any, {
    commitment: "confirmed",
  });
  return new Program(idl as PredictionMarket, provider);
}

export { PROGRAM_ID };
