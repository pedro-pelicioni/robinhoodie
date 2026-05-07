/**
 * Admin script to resolve a market.
 *
 * Usage:
 *   ts-node scripts/settle.ts --marketId=<u64> --outcome=true|false
 */
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { PublicKey } from "@solana/web3.js";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const admin = provider.wallet as anchor.Wallet;

  const marketIdArg = parseArg("marketId");
  if (!marketIdArg) throw new Error("Pass --marketId=<u64>");
  const marketId = new BN(marketIdArg);
  const outcome = (parseArg("outcome") ?? "true").toLowerCase() === "true";

  const market = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  )[0];

  console.log("Market PDA:", market.toBase58());
  console.log("Resolving outcome =", outcome);

  const sig = await program.methods
    .resolveMarket(outcome)
    .accountsStrict({ market, resolver: admin.publicKey })
    .rpc();

  console.log("Resolved. Sig:", sig);
}

main().catch((e) => { console.error(e); process.exit(1); });
