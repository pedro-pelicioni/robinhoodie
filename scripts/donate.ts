/**
 * Smoke-test the @piedpiper/sdk donate flow against the deployed devnet
 * program. Sends a 0.05 SOL donation with a memo from the dev wallet.
 *
 * Usage:
 *   ANCHOR_WALLET=$HOME/.config/solana/id.json \
 *   ts-node scripts/donate.ts --amount=0.05 --memo="Acme Corp Q2 welfare contribution"
 */
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";
import { PiedPiperClient } from "../packages/sdk/src/index";

function arg(name: string): string | undefined {
  const p = `--${name}=`;
  return process.argv.find((a) => a.startsWith(p))?.slice(p.length);
}

async function main() {
  const rpc = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
  const walletPath = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;
  const amountSol = parseFloat(arg("amount") ?? "0.05");
  const memo = arg("memo") ?? "Acme Corp Q2 welfare contribution";

  const connection = new Connection(rpc, "confirmed");
  const donor = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8"))),
  );

  console.log("Donor:", donor.publicKey.toBase58());
  console.log("Amount:", amountSol, "SOL");
  console.log("Memo:", memo);

  const client = new PiedPiperClient(connection);
  console.log("UbiPool PDA:", client.ubiPoolPda().toBase58());
  console.log("DonorRecord PDA:", client.donorRecordPda(donor.publicKey).toBase58());

  const ix = client.donateInstruction({
    donor: donor.publicKey,
    amountLamports: BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL)),
    memo,
  });

  const sig = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(ix),
    [donor],
    { commitment: "confirmed" },
  );
  console.log("\nDonation tx:", sig);

  const record = await client.getDonorRecord(donor.publicKey);
  if (record) {
    console.log("\nDonor record:");
    console.log("  total_donated:", Number(record.totalDonated) / LAMPORTS_PER_SOL, "SOL");
    console.log("  last_amount  :", Number(record.lastAmount) / LAMPORTS_PER_SOL, "SOL");
    console.log("  last_memo    :", record.lastMemo);
    console.log("  first_at     :", new Date(Number(record.firstDonatedAt) * 1000).toISOString());
    console.log("  last_at      :", new Date(Number(record.lastDonatedAt) * 1000).toISOString());
  }

  const pool = await client.getUbiPool();
  if (pool) {
    console.log("\nUbiPool:");
    console.log("  total_lamports     :", Number(pool.totalLamports) / LAMPORTS_PER_SOL, "SOL (counter)");
    console.log("  verified_count     :", Number(pool.verifiedCount));
    console.log("  per_epoch_lamports :", Number(pool.perEpochLamports) / LAMPORTS_PER_SOL, "SOL");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
