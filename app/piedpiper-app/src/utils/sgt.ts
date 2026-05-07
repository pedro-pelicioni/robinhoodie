/**
 * Helpers to detect a Seeker Genesis Token (Token-2022 NFT) in the user's wallet.
 * For the devnet demo we use a mock SGT mint stored on UbiPool — see
 * `scripts/seed.ts`. On mainnet you would instead verify Token-2022 group
 * membership against `SEEKER_GROUP_MINT_MAINNET` via `getTokenGroupMemberState`.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import type { PredictionMarket } from "../types/prediction_market";

export interface SgtStatus {
  hasSgt: boolean;
  sgtMint: PublicKey | null;
  ataAddress: PublicKey | null;
  amount: number;
}

/** Pull the configured mock SGT mint off the UbiPool account. */
export async function fetchConfiguredSgtMint(
  program: Program<PredictionMarket>,
  ubiPool: PublicKey,
): Promise<PublicKey | null> {
  try {
    const pool = await program.account.ubiPool.fetch(ubiPool);
    return pool.sgtMint;
  } catch {
    return null;
  }
}

/** Check whether `user` holds at least 1 of `sgtMint` in any Token-2022 ATA. */
export async function userHasSgt(
  connection: Connection,
  user: PublicKey,
  sgtMint: PublicKey,
): Promise<SgtStatus> {
  const accs = await connection.getParsedTokenAccountsByOwner(user, {
    programId: TOKEN_2022_PROGRAM_ID,
  });
  for (const { pubkey, account } of accs.value) {
    const info = (account.data as any).parsed?.info;
    if (info?.mint === sgtMint.toBase58() && Number(info?.tokenAmount?.uiAmount) >= 1) {
      return {
        hasSgt: true,
        sgtMint,
        ataAddress: pubkey,
        amount: Number(info.tokenAmount.uiAmount),
      };
    }
  }
  return { hasSgt: false, sgtMint, ataAddress: null, amount: 0 };
}
