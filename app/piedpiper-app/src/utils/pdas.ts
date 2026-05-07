import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./config";

function u64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    buf[i] = Number((value >> BigInt(8 * i)) & 0xffn);
  }
  return buf;
}

export function ubiPoolPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ubi_pool")],
    PROGRAM_ID,
  )[0];
}

export function marketPda(marketId: bigint): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), u64LE(marketId)],
    PROGRAM_ID,
  )[0];
}

export function positionPda(market: PublicKey, user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pos"), market.toBuffer(), user.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function verificationPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("verify"), user.toBuffer()],
    PROGRAM_ID,
  )[0];
}
