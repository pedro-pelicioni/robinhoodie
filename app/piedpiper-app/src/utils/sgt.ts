/**
 * Helpers to detect a Seeker Genesis Token (Token-2022 NFT) in the user's wallet.
 * For the devnet demo we use a mock SGT mint stored on UbiPool — see
 * `scripts/seed.ts`. On mainnet you would instead verify Token-2022 group
 * membership against `SEEKER_GROUP_MINT_MAINNET` via `getTokenGroupMemberState`.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export interface SgtStatus {
  hasSgt: boolean;
  sgtMint: PublicKey | null;
  ataAddress: PublicKey | null;
  amount: number;
}

/**
 * Pull the configured mock SGT mint off the UbiPool account.
 *
 * We slice the bytes by hand instead of going through anchor's
 * BorshAccountsCoder because anchor's browser bundle uses
 * `Buffer.prototype.readUIntLE` via buffer-layout, which fails on Hermes when
 * the AccountInfo data lands as a Uint8Array rather than a Buffer instance.
 *
 * UbiPool layout (matches `programs/prediction_market/src/lib.rs`):
 *   [0..8)    anchor discriminator
 *   [8..40)   admin            : Pubkey
 *   [40..72)  sgt_mint         : Pubkey
 *   [72..80)  total_lamports   : u64 LE
 *   [80..88)  verified_count   : u64 LE
 *   [88..96)  current_epoch    : u64 LE
 *   [96..104) epoch_start      : i64 LE
 *   [104..112) per_epoch_lamports : u64 LE
 *   [112..120) epoch_seconds   : i64 LE
 *   [120..121) bump            : u8
 */
export async function fetchConfiguredSgtMint(
  connection: Connection,
  ubiPool: PublicKey,
): Promise<PublicKey | null> {
  try {
    const info = await connection.getAccountInfo(ubiPool, "confirmed");
    if (!info || info.data.length < 72) return null;
    const data = info.data;
    return new PublicKey(data.slice(40, 72));
  } catch (e: any) {
    console.error("fetchConfiguredSgtMint failed:", e?.message ?? e);
    return null;
  }
}

/**
 * Check whether `user` holds at least 1 of `sgtMint` via direct ATA lookup.
 *
 * Why not getParsedTokenAccountsByOwner: web3.js's parser stumbles on Token-2022
 * extensions (immutableOwner, etc.) on Hermes, returning an empty value array
 * even when the SGT exists on-chain. We deterministically derive the ATA and
 * decode the relevant fields by hand.
 */
export async function userHasSgt(
  connection: Connection,
  user: PublicKey,
  sgtMint: PublicKey,
): Promise<SgtStatus> {
  const ata = getAssociatedTokenAddressSync(
    sgtMint,
    user,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const info = await connection.getAccountInfo(ata, "confirmed");
  if (!info || info.owner.toBase58() !== TOKEN_2022_PROGRAM_ID.toBase58()) {
    return { hasSgt: false, sgtMint, ataAddress: null, amount: 0 };
  }
  // SPL Token Account layout (first 165 bytes are the same in classic + 2022):
  //   [0..32)   mint (Pubkey)
  //   [32..64)  owner (Pubkey)
  //   [64..72)  amount (u64 LE)
  const data = info.data;
  if (data.length < 72) {
    return { hasSgt: false, sgtMint, ataAddress: ata, amount: 0 };
  }
  const accountMint = new PublicKey(data.slice(0, 32));
  if (!accountMint.equals(sgtMint)) {
    return { hasSgt: false, sgtMint, ataAddress: ata, amount: 0 };
  }
  // Read u64 little-endian as Number (safe for amounts < 2^53)
  let amount = 0;
  for (let i = 0; i < 8; i++) {
    amount += data[64 + i] * Math.pow(2, 8 * i);
  }
  return {
    hasSgt: amount >= 1,
    sgtMint,
    ataAddress: ata,
    amount,
  };
}
