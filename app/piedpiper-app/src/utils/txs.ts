/**
 * High-level transaction builders for the prediction_market program.
 * Each function returns a Transaction ready to hand to MWA's
 * signAndSendTransaction.
 */
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getProgram } from "./program";
import {
  marketPda,
  positionPda,
  ubiPoolPda,
  verificationPda,
} from "./pdas";

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

export async function buildRegisterVerificationTx(
  connection: Connection,
  user: PublicKey,
  sgtTokenAccount: PublicKey,
): Promise<Transaction> {
  const program = getProgram(connection, user);
  const ix = await (program.methods as any)
    .registerVerification()
    .accountsStrict({
      verification: verificationPda(user),
      ubiPool: ubiPoolPda(),
      sgtTokenAccount,
      user,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export async function buildPlaceBetTx(
  connection: Connection,
  user: PublicKey,
  marketId: BN,
  side: boolean,
  amountLamports: BN,
): Promise<Transaction> {
  const program = getProgram(connection, user);
  const market = marketPda(marketId);
  const ix = await (program.methods as any)
    .placeBet(side, amountLamports)
    .accountsStrict({
      market,
      position: positionPda(market, user),
      ubiPool: ubiPoolPda(),
      user,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export async function buildClaimWinningsTx(
  connection: Connection,
  user: PublicKey,
  marketId: BN,
): Promise<Transaction> {
  const program = getProgram(connection, user);
  const market = marketPda(marketId);
  const ix = await (program.methods as any)
    .claimWinnings()
    .accountsStrict({
      market,
      position: positionPda(market, user),
      user,
    })
    .instruction();
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export async function buildClaimUbiTx(
  connection: Connection,
  user: PublicKey,
): Promise<Transaction> {
  const program = getProgram(connection, user);
  const ix = await (program.methods as any)
    .claimUbi()
    .accountsStrict({
      ubiPool: ubiPoolPda(),
      verification: verificationPda(user),
      user,
    })
    .instruction();
  return withRecentBlockhash(new Transaction().add(ix), connection, user);
}

export const TOKEN_2022 = TOKEN_2022_PROGRAM_ID;
