/**
 * Verifies a wallet's Pied Piper personhood via SAS — what a third-party
 * Solana app would do. Uses ONLY @solana/web3.js + @piedpiper/sdk; no
 * sas-lib runtime dep, no kit, no Anchor.
 *
 * Usage:
 *   ts-node scripts/sas-verify.ts --user=7f6NooL9bqu1NGFctqNqi1nMVFtnM3GvF7HZ11YzX7iY
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { PiedPiperClient } from "../packages/sdk/src/index";

function arg(name: string): string | undefined {
  const p = `--${name}=`;
  return process.argv.find((a) => a.startsWith(p))?.slice(p.length);
}

async function main() {
  const userArg = arg("user");
  if (!userArg) {
    console.error("Required: --user=<wallet-pubkey>");
    process.exit(1);
  }
  const user = new PublicKey(userArg);
  const rpc = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const client = new PiedPiperClient(connection);

  console.log("Querying Pied Piper personhood for", user.toBase58());
  const att = await client.findPiedPiperPersonhood(user);
  if (!att) {
    console.log("\n❌ No personhood attestation. Wallet is not a Pied Piper-verified human.");
    process.exit(1);
  }

  console.log("\n✅ Personhood verified");
  console.log(JSON.stringify({
    attestation: att.attestation.toBase58(),
    wallet: att.wallet.toBase58(),
    sgtMint: att.sgtMint.toBase58(),
    verifiedAt: new Date(Number(att.verifiedAt) * 1000).toISOString(),
    expiry: new Date(Number(att.expiry) * 1000).toISOString(),
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
