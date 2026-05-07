/**
 * Pied Piper devnet config — values updated by `scripts/seed.ts` output.
 * The `PROGRAM_ID` placeholder is replaced after `anchor deploy` via
 * `declare_id!` macro in the program; the seed values come from the seed run.
 */
import { PublicKey } from "@solana/web3.js";

// Replaced after `anchor deploy` (see Anchor.toml).
export const PROGRAM_ID = new PublicKey(
  "6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K",
);

// Reference only: real Seeker Genesis Token group mint on mainnet.
// On devnet we use a mock SGT mint stored on the UbiPool account.
export const SEEKER_GROUP_MINT_MAINNET = new PublicKey(
  "GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te",
);

// Stretch: a 1 km geo-fenced market centered on Miami Beach Convention Center
// (the EasyA Consensus venue 2026-05-05..05-07).
export const VENUE_GEO = { lat: 25.7951, lon: -80.134, radiusM: 1000 };

// Helius devnet (free tier) — replace with your own if you hit rate limits.
export const DEVNET_RPC =
  "https://devnet.helius-rpc.com/?api-key=YOUR_KEY";
