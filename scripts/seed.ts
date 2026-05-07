/**
 * Seeds devnet for the demo:
 *   1. Creates a mock SGT (Token-2022 NFT) and mints 1 to a target wallet.
 *      For demo on physical Seeker, pass --seekerPubkey=<base58>.
 *   2. Initializes UbiPool with that mock SGT mint and a short epoch
 *      (default 300s = 5 min) so claims roll over within the demo.
 *   3. Pre-funds UbiPool with 2 SOL so the first claim has visible non-zero amount.
 *   4. Creates one demo market: "Will BTC > $100k by EOD?".
 *
 * Usage:
 *   ts-node scripts/seed.ts --seekerPubkey=<base58>
 */
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccountIdempotent,
  mintTo,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const admin = provider.wallet as anchor.Wallet;

  const seekerArg = parseArg("seekerPubkey");
  const seekerPubkey = seekerArg ? new PublicKey(seekerArg) : admin.publicKey;
  const epochSeconds = new BN(Number(parseArg("epoch") ?? "300")); // 5 min default

  console.log("Admin:", admin.publicKey.toBase58());
  console.log("Seeker (recipient of SGT + UBI test):", seekerPubkey.toBase58());
  console.log("Epoch seconds:", epochSeconds.toNumber());

  // 1. Mint mock SGT (Token-2022) -> seekerPubkey
  console.log("\n[1/4] Creating mock SGT (Token-2022)…");
  const sgtMint = await createMint(
    provider.connection,
    admin.payer,
    admin.publicKey,
    null,
    0,
    Keypair.generate(),
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  console.log("  Mock SGT mint:", sgtMint.toBase58());

  const sgtAta = await createAssociatedTokenAccountIdempotent(
    provider.connection,
    admin.payer,
    sgtMint,
    seekerPubkey,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  await mintTo(
    provider.connection,
    admin.payer,
    sgtMint,
    sgtAta,
    admin.payer,
    1,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  console.log("  Minted 1 SGT to:", sgtAta.toBase58());

  // 2. initialize_ubi_pool
  console.log("\n[2/4] Initializing UbiPool…");
  const ubiPool = PublicKey.findProgramAddressSync(
    [Buffer.from("ubi_pool")],
    program.programId,
  )[0];
  console.log("  UbiPool PDA:", ubiPool.toBase58());
  const existing = await provider.connection.getAccountInfo(ubiPool);
  if (existing) {
    console.log("  UbiPool already initialized — skipping init.");
  } else {
    await program.methods
      .initializeUbiPool(sgtMint, epochSeconds)
      .accountsStrict({
        ubiPool,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // 3. Pre-fund pool with 2 SOL
  console.log("\n[3/4] Pre-funding UbiPool with 2 SOL…");
  const fundTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: admin.publicKey,
      toPubkey: ubiPool,
      lamports: 2 * LAMPORTS_PER_SOL,
    }),
  );
  const fundSig = await provider.sendAndConfirm(fundTx);
  console.log("  Funded; sig:", fundSig);

  // 4a. Create plain demo market
  console.log("\n[4/5] Creating demo market…");
  const marketId = new BN(Date.now()); // unique-ish per run
  const market = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  )[0];
  // 24h window so demos late in the day still find the market open.
  const endTs = new BN(Math.floor(Date.now() / 1000) + 24 * 60 * 60);
  await program.methods
    .createMarket(marketId, "Will BTC > $100k by EOD?", endTs, new BN(0), 0)
    .accountsStrict({
      market,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  Demo market PDA:", market.toBase58());
  console.log("  Market id:", marketId.toString());

  // 4b. Geo-fenced market for the GPS stretch demo (50m radius)
  console.log("\n[5/5] Creating geo-fenced demo market…");
  const geoMarketId = new BN(Date.now() + 1);
  const geoMarket = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), geoMarketId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  )[0];
  await program.methods
    .createMarket(
      geoMarketId,
      "Will it rain at the venue tomorrow?",
      endTs,
      new BN(1),
      50,
    )
    .accountsStrict({
      market: geoMarket,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  Geo market PDA:", geoMarket.toBase58());
  console.log("  Geo market id:", geoMarketId.toString());

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({
    programId: program.programId.toBase58(),
    sgtMint: sgtMint.toBase58(),
    ubiPool: ubiPool.toBase58(),
    market: market.toBase58(),
    marketId: marketId.toString(),
    geoMarket: geoMarket.toBase58(),
    geoMarketId: geoMarketId.toString(),
    seeker: seekerPubkey.toBase58(),
    epochSeconds: epochSeconds.toNumber(),
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
