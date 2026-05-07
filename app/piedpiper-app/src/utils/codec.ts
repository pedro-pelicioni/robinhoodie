/**
 * Hand-rolled Borsh encoders + decoders for our prediction-market accounts and
 * instructions. We avoid `@coral-xyz/anchor`'s `BorshAccountsCoder` and
 * `BorshInstructionCoder` because anchor's browser bundle calls
 * `Buffer.prototype.readUIntLE` via `buffer-layout`, which throws on Hermes
 * (the Buffer instance returned by web3.js' `getAccountInfo` doesn't have
 * those methods).
 *
 * Layouts MUST match `programs/prediction_market/src/lib.rs` exactly. Account
 * + instruction discriminators come from `target/idl/prediction_market.json`.
 */
import { PublicKey } from "@solana/web3.js";

export const ACCOUNT_DISC = {
  Market: new Uint8Array([219, 190, 213, 55, 0, 227, 198, 154]),
  Position: new Uint8Array([170, 188, 143, 228, 122, 64, 247, 208]),
  UbiPool: new Uint8Array([35, 227, 12, 190, 242, 54, 231, 187]),
  VerificationRecord: new Uint8Array([247, 14, 72, 93, 184, 36, 154, 215]),
};

export const IX_DISC = {
  initializeUbiPool: new Uint8Array([130, 77, 185, 203, 192, 106, 140, 74]),
  createMarket: new Uint8Array([103, 226, 97, 235, 200, 188, 251, 254]),
  placeBet: new Uint8Array([222, 62, 67, 220, 63, 166, 126, 33]),
  registerVerification: new Uint8Array([210, 43, 96, 166, 146, 44, 101, 235]),
  resolveMarket: new Uint8Array([155, 23, 80, 173, 46, 74, 23, 239]),
  claimWinnings: new Uint8Array([161, 215, 24, 59, 14, 236, 242, 221]),
  claimUbi: new Uint8Array([64, 169, 95, 14, 86, 53, 145, 231]),
};

// ---------------------------------------------------------------------------
// Low-level reader helpers (work on plain Uint8Array)
// ---------------------------------------------------------------------------

class Reader {
  constructor(public buf: Uint8Array, public off: number = 0) {}
  u8(): number {
    return this.buf[this.off++];
  }
  bool(): boolean {
    return this.u8() !== 0;
  }
  u32(): number {
    const v =
      this.buf[this.off] |
      (this.buf[this.off + 1] << 8) |
      (this.buf[this.off + 2] << 16) |
      (this.buf[this.off + 3] * 0x1000000); // avoid sign bit on bit 31
    this.off += 4;
    return v;
  }
  u64(): bigint {
    let lo = 0n;
    let hi = 0n;
    for (let i = 0; i < 4; i++) lo |= BigInt(this.buf[this.off + i]) << BigInt(8 * i);
    for (let i = 0; i < 4; i++) hi |= BigInt(this.buf[this.off + 4 + i]) << BigInt(8 * i);
    this.off += 8;
    return (hi << 32n) | lo;
  }
  i64(): bigint {
    const u = this.u64();
    // Reinterpret as signed two's complement
    return u >= 1n << 63n ? u - (1n << 64n) : u;
  }
  pubkey(): PublicKey {
    const slice = this.buf.slice(this.off, this.off + 32);
    this.off += 32;
    return new PublicKey(slice);
  }
  string(): string {
    const len = this.u32();
    const slice = this.buf.slice(this.off, this.off + len);
    this.off += len;
    return new TextDecoder().decode(slice);
  }
  skip(n: number) {
    this.off += n;
  }
}

function discMatches(data: Uint8Array, expected: Uint8Array): boolean {
  if (data.length < expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (data[i] !== expected[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Account decoders
// ---------------------------------------------------------------------------

export interface Market {
  marketId: bigint;
  creator: PublicKey;
  question: string;
  endTs: bigint;
  yesLamports: bigint;
  noLamports: bigint;
  feeLamports: bigint;
  status: number;
  outcome: boolean;
  resolver: PublicKey;
  resolutionType: number;
  geoH3: bigint;
  geoRadiusM: number;
  bump: number;
}

export function decodeMarket(data: Uint8Array): Market | null {
  if (!discMatches(data, ACCOUNT_DISC.Market)) return null;
  const r = new Reader(data, 8);
  const marketId = r.u64();
  const creator = r.pubkey();
  const question = r.string();
  const endTs = r.i64();
  const yesLamports = r.u64();
  const noLamports = r.u64();
  const feeLamports = r.u64();
  const status = r.u8();
  const outcome = r.bool();
  const resolver = r.pubkey();
  const resolutionType = r.u8();
  const geoH3 = r.u64();
  const geoRadiusM = r.u32();
  const bump = r.u8();
  return {
    marketId,
    creator,
    question,
    endTs,
    yesLamports,
    noLamports,
    feeLamports,
    status,
    outcome,
    resolver,
    resolutionType,
    geoH3,
    geoRadiusM,
    bump,
  };
}

export interface Position {
  user: PublicKey;
  market: PublicKey;
  yesLamports: bigint;
  noLamports: bigint;
  claimed: boolean;
  bump: number;
}

export function decodePosition(data: Uint8Array): Position | null {
  if (!discMatches(data, ACCOUNT_DISC.Position)) return null;
  const r = new Reader(data, 8);
  return {
    user: r.pubkey(),
    market: r.pubkey(),
    yesLamports: r.u64(),
    noLamports: r.u64(),
    claimed: r.bool(),
    bump: r.u8(),
  };
}

// ---------------------------------------------------------------------------
// Instruction encoders
// ---------------------------------------------------------------------------

function u64LE(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    buf[i] = Number((value >> BigInt(8 * i)) & 0xffn);
  }
  return buf;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/** placeBet(side: bool, amount: u64) */
export function encodePlaceBet(side: boolean, amountLamports: bigint): Uint8Array {
  return concat([
    IX_DISC.placeBet,
    new Uint8Array([side ? 1 : 0]),
    u64LE(amountLamports),
  ]);
}

/** claimWinnings() */
export function encodeClaimWinnings(): Uint8Array {
  return new Uint8Array(IX_DISC.claimWinnings);
}

/** claimUbi() */
export function encodeClaimUbi(): Uint8Array {
  return new Uint8Array(IX_DISC.claimUbi);
}

/** registerVerification() */
export function encodeRegisterVerification(): Uint8Array {
  return new Uint8Array(IX_DISC.registerVerification);
}
