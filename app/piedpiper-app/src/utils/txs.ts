/**
 * Transaction builders for the prediction_market program — assembled by hand
 * (no anchor `methods.x().instruction()`) because anchor's borsh + buffer-layout
 * code path crashes on Hermes. We build raw `TransactionInstruction`s with
 * known discriminators (see `codec.ts`).
 *
 * Each function returns a Transaction with `feePayer` and `recentBlockhash`
 * set, ready to hand to MWA's signAndSendTransaction.
 */
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type AccountMeta,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID } from "./config";
import {
  marketPda,
  positionPda,
  ubiPoolPda,
  verificationPda,
} from "./pdas";
import {
  encodeClaimUbi,
  encodeClaimWinnings,
  encodePlaceBet,
  encodeRegisterVerification,
} from "./codec";

async function withRecentBlockhash(
  tx: Transaction,
  connection: Connection,
  feePayer: PublicKey,
): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = feePayer;
  return tx;
}

const meta = (
  pubkey: PublicKey,
  isSigner: boolean,
  isWritable: boolean,
): AccountMeta => ({ pubkey, isSigner, isWritable });

export async function buildRegisterVerificationTx(
  connection: Connection,
  user: PublicKey,
  sgtTokenAccount: PublicKey,
): Promise<Transaction> {
  // Account order MUST match the `RegisterVerification<'info>` struct in lib.rs:
  //   verification, ubi_pool, sgt_token_account, user, system_program
  const keys: AccountMeta[] = [
    meta(verificationPda(user), false, true),
    meta(ubiPoolPda(), false, true),
    meta(sgtTokenAccount, false, false),
    meta(user, true, true),
    meta(SystemProgram.programId, false, false),
  ];
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: Buffer.from(encodeRegisterVerification()),
  });
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export async function buildPlaceBetTx(
  connection: Connection,
  user: PublicKey,
  marketId: bigint,
  side: boolean,
  amountLamports: bigint,
): Promise<Transaction> {
  const market = marketPda(marketId);
  // PlaceBet account order: market, position, ubi_pool, user, system_program
  const keys: AccountMeta[] = [
    meta(market, false, true),
    meta(positionPda(market, user), false, true),
    meta(ubiPoolPda(), false, true),
    meta(user, true, true),
    meta(SystemProgram.programId, false, false),
  ];
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: Buffer.from(encodePlaceBet(side, amountLamports)),
  });
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export async function buildClaimWinningsTx(
  connection: Connection,
  user: PublicKey,
  marketId: bigint,
): Promise<Transaction> {
  const market = marketPda(marketId);
  // ClaimWinnings account order: market, position, user
  const keys: AccountMeta[] = [
    meta(market, false, true),
    meta(positionPda(market, user), false, true),
    meta(user, true, true),
  ];
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: Buffer.from(encodeClaimWinnings()),
  });
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export async function buildClaimUbiTx(
  connection: Connection,
  user: PublicKey,
): Promise<Transaction> {
  // ClaimUbi account order: ubi_pool, verification, user
  const keys: AccountMeta[] = [
    meta(ubiPoolPda(), false, true),
    meta(verificationPda(user), false, true),
    meta(user, true, true),
  ];
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: Buffer.from(encodeClaimUbi()),
  });
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export const TOKEN_2022 = TOKEN_2022_PROGRAM_ID;
