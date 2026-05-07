/**
 * @piedpiper/sdk — donate to the Pied Piper UBI pool.
 *
 * Designed for B2B "welfare contributor" integrations. A payroll script,
 * a CSR initiative, or another dApp can send SOL to the UbiPool with an
 * on-chain memo (`reason`) and get a per-donor record back for tax /
 * leaderboard / reputation purposes — all in one tx.
 *
 * Usage:
 *   import { PiedPiperClient } from "@piedpiper/sdk";
 *   const client = new PiedPiperClient(connection);
 *   const ix = client.donateInstruction({
 *     donor: signer.publicKey,
 *     amountLamports: 1_000_000_000n,
 *     memo: "Acme Corp Q2 welfare contribution",
 *   });
 *   const tx = new Transaction().add(ix);
 *   // sign + send via your wallet of choice (MWA, web wallet, server keypair…)
 */
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  type AccountMeta,
} from "@solana/web3.js";

export const DEFAULT_PROGRAM_ID = new PublicKey(
  "6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K",
);

// All discriminators copied from target/idl/prediction_market.json — the
// instruction one is sha256("global:donate_to_pool")[0..8], the account ones
// are sha256("account:<Name>")[0..8].
const IX_DISC_DONATE = new Uint8Array([
  219, 179, 202, 183, 26, 49, 206, 250,
]);
const ACCOUNT_DISC_DONOR = new Uint8Array([
  204, 101, 15, 37, 82, 141, 165, 40,
]);
const ACCOUNT_DISC_POOL = new Uint8Array([
  35, 227, 12, 190, 242, 54, 231, 187,
]);

function u64LE(n: bigint): Uint8Array {
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) out[i] = Number((n >> BigInt(8 * i)) & 0xffn);
  return out;
}

function encodeDonate(amountLamports: bigint, memo: string): Uint8Array {
  const memoBytes = new TextEncoder().encode(memo);
  if (memoBytes.length > 128) throw new Error("memo too long (max 128 bytes)");
  const lenLE = new Uint8Array(4);
  new DataView(lenLE.buffer).setUint32(0, memoBytes.length, true);
  const out = new Uint8Array(
    IX_DISC_DONATE.length + 8 + 4 + memoBytes.length,
  );
  out.set(IX_DISC_DONATE, 0);
  out.set(u64LE(amountLamports), IX_DISC_DONATE.length);
  out.set(lenLE, IX_DISC_DONATE.length + 8);
  out.set(memoBytes, IX_DISC_DONATE.length + 8 + 4);
  return out;
}

export interface DonateArgs {
  donor: PublicKey;
  amountLamports: bigint;
  memo: string;
}

export interface DonorRecord {
  donor: PublicKey;
  totalDonated: bigint;
  lastAmount: bigint;
  firstDonatedAt: bigint;
  lastDonatedAt: bigint;
  lastMemo: string;
}

export interface UbiPool {
  admin: PublicKey;
  sgtMint: PublicKey;
  totalLamports: bigint;
  verifiedCount: bigint;
  currentEpoch: bigint;
  epochStart: bigint;
  perEpochLamports: bigint;
  epochSeconds: bigint;
}

export class PiedPiperClient {
  constructor(
    public readonly connection: Connection,
    public readonly programId: PublicKey = DEFAULT_PROGRAM_ID,
  ) {}

  ubiPoolPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("ubi_pool")],
      this.programId,
    )[0];
  }

  donorRecordPda(donor: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("donor"), donor.toBuffer()],
      this.programId,
    )[0];
  }

  /**
   * Build a `donate_to_pool` instruction. Sign + submit with your wallet.
   * The user must be the `donor` (signer + writable). DonorRecord PDA is
   * created on first donation, updated thereafter.
   */
  donateInstruction(args: DonateArgs): TransactionInstruction {
    const meta = (
      pubkey: PublicKey,
      isSigner: boolean,
      isWritable: boolean,
    ): AccountMeta => ({ pubkey, isSigner, isWritable });
    const keys: AccountMeta[] = [
      meta(this.ubiPoolPda(), false, true),
      meta(this.donorRecordPda(args.donor), false, true),
      meta(args.donor, true, true),
      meta(SystemProgram.programId, false, false),
    ];
    return new TransactionInstruction({
      programId: this.programId,
      keys,
      data: Buffer.from(encodeDonate(args.amountLamports, args.memo)),
    });
  }

  /**
   * Read a donor's running totals + most recent memo. Returns null if the
   * donor has never contributed.
   */
  async getDonorRecord(donor: PublicKey): Promise<DonorRecord | null> {
    const info = await this.connection.getAccountInfo(
      this.donorRecordPda(donor),
      "confirmed",
    );
    if (!info) return null;
    return decodeDonorRecord(new Uint8Array(info.data));
  }

  /**
   * Read the current UbiPool state — useful for showing a live "total
   * accumulated welfare contributions" ticker on a B2B dashboard.
   */
  async getUbiPool(): Promise<UbiPool | null> {
    const info = await this.connection.getAccountInfo(this.ubiPoolPda(), "confirmed");
    if (!info) return null;
    return decodeUbiPool(new Uint8Array(info.data));
  }
}

// ---------------------------------------------------------------------------
// Decoders (hand-rolled — mirrors `app/piedpiper-app/src/utils/codec.ts`)
// ---------------------------------------------------------------------------

function discMatches(data: Uint8Array, expected: Uint8Array): boolean {
  for (let i = 0; i < expected.length; i++) {
    if (data[i] !== expected[i]) return false;
  }
  return true;
}

function readU64(buf: Uint8Array, off: number): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(buf[off + i]) << BigInt(8 * i);
  return v;
}

function readI64(buf: Uint8Array, off: number): bigint {
  const u = readU64(buf, off);
  return u >= 1n << 63n ? u - (1n << 64n) : u;
}

function readU32(buf: Uint8Array, off: number): number {
  return (
    buf[off] |
    (buf[off + 1] << 8) |
    (buf[off + 2] << 16) |
    buf[off + 3] * 0x1000000
  );
}

function decodeDonorRecord(data: Uint8Array): DonorRecord | null {
  if (data.length < 8 || !discMatches(data, ACCOUNT_DISC_DONOR)) return null;
  let off = 8;
  const donor = new PublicKey(data.slice(off, off + 32));
  off += 32;
  const totalDonated = readU64(data, off);
  off += 8;
  const lastAmount = readU64(data, off);
  off += 8;
  const firstDonatedAt = readI64(data, off);
  off += 8;
  const lastDonatedAt = readI64(data, off);
  off += 8;
  const memoLen = readU32(data, off);
  off += 4;
  const lastMemo = new TextDecoder().decode(data.slice(off, off + memoLen));
  return { donor, totalDonated, lastAmount, firstDonatedAt, lastDonatedAt, lastMemo };
}

function decodeUbiPool(data: Uint8Array): UbiPool | null {
  if (data.length < 8 || !discMatches(data, ACCOUNT_DISC_POOL)) return null;
  let off = 8;
  const admin = new PublicKey(data.slice(off, off + 32));
  off += 32;
  const sgtMint = new PublicKey(data.slice(off, off + 32));
  off += 32;
  const totalLamports = readU64(data, off);
  off += 8;
  const verifiedCount = readU64(data, off);
  off += 8;
  const currentEpoch = readU64(data, off);
  off += 8;
  const epochStart = readI64(data, off);
  off += 8;
  const perEpochLamports = readU64(data, off);
  off += 8;
  const epochSeconds = readI64(data, off);
  return {
    admin,
    sgtMint,
    totalLamports,
    verifiedCount,
    currentEpoch,
    epochStart,
    perEpochLamports,
    epochSeconds,
  };
}
