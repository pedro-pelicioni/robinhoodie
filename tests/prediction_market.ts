import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";

describe("prediction_market", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const admin = provider.wallet as anchor.Wallet;

  let sgtMint: PublicKey;
  let userKp: Keypair;
  let userSgtAta: PublicKey;
  const marketId = new BN(1);
  const epochSeconds = new BN(60); // 60-sec epochs for tests

  const ubiPoolPda = PublicKey.findProgramAddressSync(
    [Buffer.from("ubi_pool")],
    program.programId,
  )[0];

  const marketPda = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  )[0];

  before(async () => {
    userKp = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(userKp.publicKey, 5 * LAMPORTS_PER_SOL),
    );

    sgtMint = await createMint(
      provider.connection,
      admin.payer,
      admin.publicKey,
      null,
      0,
      Keypair.generate(),
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    userSgtAta = await createAssociatedTokenAccount(
      provider.connection,
      admin.payer,
      sgtMint,
      userKp.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    await mintTo(
      provider.connection,
      admin.payer,
      sgtMint,
      userSgtAta,
      admin.payer,
      1,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
  });

  it("initializes UBI pool", async () => {
    await program.methods
      .initializeUbiPool(sgtMint, epochSeconds)
      .accountsStrict({
        ubiPool: ubiPoolPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const pool = await program.account.ubiPool.fetch(ubiPoolPda);
    expect(pool.sgtMint.toBase58()).to.eq(sgtMint.toBase58());
    expect(pool.epochSeconds.toNumber()).to.eq(60);
  });

  it("creates a market", async () => {
    const endTs = new BN(Math.floor(Date.now() / 1000) + 3600);
    await program.methods
      .createMarket(marketId, "Will BTC > $100k by EOD?", endTs, new BN(0), 0)
      .accountsStrict({
        market: marketPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const m = await program.account.market.fetch(marketPda);
    expect(m.status).to.eq(0);
  });

  it("registers verification using SGT", async () => {
    const verifyPda = PublicKey.findProgramAddressSync(
      [Buffer.from("verify"), userKp.publicKey.toBuffer()],
      program.programId,
    )[0];
    await program.methods
      .registerVerification()
      .accountsStrict({
        verification: verifyPda,
        ubiPool: ubiPoolPda,
        sgtTokenAccount: userSgtAta,
        user: userKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKp])
      .rpc();
    const v = await program.account.verificationRecord.fetch(verifyPda);
    expect(v.authority.toBase58()).to.eq(userKp.publicKey.toBase58());
    const pool = await program.account.ubiPool.fetch(ubiPoolPda);
    expect(pool.verifiedCount.toNumber()).to.eq(1);
  });

  it("places a bet, accruing fee to UBI pool", async () => {
    const positionPda = PublicKey.findProgramAddressSync(
      [Buffer.from("pos"), marketPda.toBuffer(), userKp.publicKey.toBuffer()],
      program.programId,
    )[0];
    const before = await provider.connection.getBalance(ubiPoolPda);
    await program.methods
      .placeBet(true, new BN(LAMPORTS_PER_SOL))
      .accountsStrict({
        market: marketPda,
        position: positionPda,
        ubiPool: ubiPoolPda,
        user: userKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKp])
      .rpc();
    const after = await provider.connection.getBalance(ubiPoolPda);
    expect(after - before).to.eq(0.02 * LAMPORTS_PER_SOL); // 2% fee
  });

  it("admin resolves market and user claims winnings", async () => {
    await program.methods
      .resolveMarket(true)
      .accountsStrict({ market: marketPda, resolver: admin.publicKey })
      .rpc();
    const positionPda = PublicKey.findProgramAddressSync(
      [Buffer.from("pos"), marketPda.toBuffer(), userKp.publicKey.toBuffer()],
      program.programId,
    )[0];
    await program.methods
      .claimWinnings()
      .accountsStrict({ market: marketPda, position: positionPda, user: userKp.publicKey })
      .signers([userKp])
      .rpc();
    const p = await program.account.position.fetch(positionPda);
    expect(p.claimed).to.eq(true);
  });

  it("claims UBI for current epoch (and rejects double claim)", async () => {
    await new Promise((r) => setTimeout(r, 65_000)); // wait one epoch
    const verifyPda = PublicKey.findProgramAddressSync(
      [Buffer.from("verify"), userKp.publicKey.toBuffer()],
      program.programId,
    )[0];
    await program.methods
      .claimUbi()
      .accountsStrict({
        ubiPool: ubiPoolPda,
        verification: verifyPda,
        user: userKp.publicKey,
      })
      .signers([userKp])
      .rpc();
    let threw = false;
    try {
      await program.methods
        .claimUbi()
        .accountsStrict({
          ubiPool: ubiPoolPda,
          verification: verifyPda,
          user: userKp.publicKey,
        })
        .signers([userKp])
        .rpc();
    } catch {
      threw = true;
    }
    expect(threw).to.eq(true);
  }).timeout(120_000);
});
