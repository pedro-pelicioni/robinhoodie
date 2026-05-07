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

/**
 * Pied Piper's published Solana Attestation Service (SAS) anchor —
 * any Solana app can verify a user's personhood by deriving the attestation
 * PDA from these and calling `findPiedPiperPersonhood`.
 *
 * SAS program: 22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG
 * Schema fields: { wallet: String, sgt_mint: String, verified_at: i64 }
 */
export const SAS_PROGRAM_ID = new PublicKey(
  "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG",
);
export const PIEDPIPER_SAS_CREDENTIAL = new PublicKey(
  "B95yGf2Hp2Hf7ChhkcvNAxE3rAkxFB23RSLg1x9Mickq",
);
export const PIEDPIPER_SAS_SCHEMA = new PublicKey(
  "AYKSbtfTyppWvozgvedXC4GQzfdRdD7zbsGB96M8Crti",
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

export interface PersonhoodAttestation {
  /** SAS attestation account address — proof tx if you want to link it. */
  attestation: PublicKey;
  /** Subject wallet (the verified human). */
  wallet: PublicKey;
  /** The Token-2022 SGT mint that was held at verify time. */
  sgtMint: PublicKey;
  /** Unix timestamp (i64). */
  verifiedAt: bigint;
  /** SAS attestation expiry. */
  expiry: bigint;
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
   * Verify a user's personhood via Pied Piper's published SAS attestation.
   *
   * This is the **interop primitive**: any Solana dApp can call this to check
   * "is this wallet a Pied Piper-attested human?" without needing to integrate
   * the prediction_market IDL. Returns null if no attestation exists for that
   * wallet.
   *
   * Under the hood: derives the attestation PDA from
   *   `[ "attestation", credential, schema, nonce(=user) ]`
   * (SAS-spec PDA seeds), fetches the account, decodes the published schema
   * fields by hand. No `sas-lib` runtime dep required by callers.
   */
  async findPiedPiperPersonhood(user: PublicKey): Promise<PersonhoodAttestation | null> {
    const [attestationPda] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("attestation"),
        PIEDPIPER_SAS_CREDENTIAL.toBuffer(),
        PIEDPIPER_SAS_SCHEMA.toBuffer(),
        user.toBuffer(),
      ],
      SAS_PROGRAM_ID,
    );
    const info = await this.connection.getAccountInfo(attestationPda, "confirmed");
    if (!info) return null;
    return decodePersonhoodAttestation(attestationPda, new Uint8Array(info.data));
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

/**
 * Decode an SAS Attestation account.
 *
 * SAS account layout (1-byte struct discriminator + bare Borsh fields):
 *   [0]              : u8 struct version / discriminator (always 0x02 today)
 *   [1..33)          : nonce      (Pubkey)
 *   [33..65)         : credential (Pubkey)
 *   [65..97)         : schema     (Pubkey)
 *   [97..101)        : data_len   (u32 LE)
 *   [101..101+len)   : data       (bytes — schema-specific Borsh payload)
 *   then             : signer (Pubkey, 32) | expiry (i64 LE) | tokenAccount (Pubkey, 32)
 *
 * Within `data`, our Personhood schema is three Borsh-serialized fields:
 *   wallet:      String (u32 LE len + utf-8 bytes — base58 pubkey)
 *   sgt_mint:    String (same)
 *   verified_at: i64 LE
 */
function decodePersonhoodAttestation(
  attestation: PublicKey,
  bytes: Uint8Array,
): PersonhoodAttestation | null {
  if (bytes.length < 1 + 32 * 4 + 4 + 8) return null;
  let off = 1;     // skip 1-byte struct discriminator
  off += 32;       // skip nonce (we already know it — it's the user)
  off += 32;       // skip credential
  off += 32;       // skip schema
  const dataLen = readU32(bytes, off);
  off += 4;
  if (off + dataLen + 32 + 8 + 32 > bytes.length) return null;
  const data = bytes.slice(off, off + dataLen);
  off += dataLen;
  off += 32;       // signer
  const expiry = readI64(bytes, off);

  // Inner Borsh personhood payload
  let p = 0;
  const walletLen = readU32(data, p); p += 4;
  const wallet = new PublicKey(new TextDecoder().decode(data.slice(p, p + walletLen)));
  p += walletLen;
  const sgtMintLen = readU32(data, p); p += 4;
  const sgtMint = new PublicKey(new TextDecoder().decode(data.slice(p, p + sgtMintLen)));
  p += sgtMintLen;
  const verifiedAt = readI64(data, p);

  return { attestation, wallet, sgtMint, verifiedAt, expiry };
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
