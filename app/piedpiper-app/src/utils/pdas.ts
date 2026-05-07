import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./config";

export function ubiPoolPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ubi_pool")],
    PROGRAM_ID,
  )[0];
}

export function marketPda(marketId: BN): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
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
