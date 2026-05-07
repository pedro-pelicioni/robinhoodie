/**
 * One-shot SAS (Solana Attestation Service) bootstrap for Pied Piper.
 *
 * Creates Pied Piper as an SAS *credential issuer* on devnet, declares the
 * "Personhood" schema, and issues the first attestation for the verified
 * Seeker wallet. After this runs, ANY other Solana app can read our personhood
 * proof via `deriveAttestationPda + fetchAttestation` — no need to integrate
 * the prediction_market IDL.
 *
 * Schema: { wallet: String (base58), sgt_mint: String (base58), verified_at: i64 }
 * (SAS' compact layout doesn't carry Pubkey natively; base58 String is the
 * cross-app-readable choice.)
 *
 * Usage:
 *   ANCHOR_WALLET=$HOME/.config/solana/id.json \
 *   ts-node scripts/sas-issue.ts \
 *     --user=7f6NooL9bqu1NGFctqNqi1nMVFtnM3GvF7HZ11YzX7iY \
 *     --sgtMint=DpGjpCVXLk4MiYySSh3AbVxYzcvM8quuiqjNoBxB5Co
 *
 * SAS program ID: 22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG
 * Docs: https://github.com/solana-foundation/solana-attestation-service
 */
import * as fs from "fs";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  appendTransactionMessageInstruction,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageFeePayer,
  createTransactionMessage,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  createKeyPairSignerFromBytes,
  pipe,
  type KeyPairSigner,
  type Address,
} from "@solana/kit";
import {
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  fetchSchema,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  getCreateAttestationInstruction,
  serializeAttestationData,
} from "sas-lib";

function arg(name: string): string | undefined {
  const p = `--${name}=`;
  return process.argv.find((a) => a.startsWith(p))?.slice(p.length);
}

const RPC_HTTP = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
const RPC_WS = RPC_HTTP.replace("https://", "wss://").replace("http://", "ws://");
const WALLET = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;

// Schema: 3 fields, all SAS compact-layout type ids.
//   12 = String (base58 pubkey)
//   8  = i64    (unix timestamp)
const PERSONHOOD_SCHEMA = {
  wallet: 12,
  sgt_mint: 12,
  verified_at: 8,
} as const;
const CREDENTIAL_NAME = "PiedPiper";
const SCHEMA_NAME = "Personhood";

async function main() {
  const userArg = arg("user");
  const sgtMintArg = arg("sgtMint");
  if (!userArg || !sgtMintArg) {
    console.error("Required: --user=<seeker-pubkey> --sgtMint=<token-2022-mint>");
    process.exit(1);
  }
  const userAddress = userArg as Address;
  const sgtMintAddress = sgtMintArg as Address;

  const rpc = createSolanaRpc(RPC_HTTP);
  const rpcSubs = createSolanaRpcSubscriptions(RPC_WS);
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: rpcSubs });

  const secret = Uint8Array.from(JSON.parse(fs.readFileSync(WALLET, "utf-8")));
  const authority: KeyPairSigner = await createKeyPairSignerFromBytes(secret);
  console.log("Authority:", authority.address);
  console.log("User (subject):", userAddress);
  console.log("SGT mint:", sgtMintAddress);

  // --- 1. Credential -------------------------------------------------------
  const [credentialPda] = await deriveCredentialPda({
    authority: authority.address,
    name: CREDENTIAL_NAME,
  });
  console.log("\nCredential PDA:", credentialPda);

  await runIfMissing(rpc, credentialPda, async () => {
    const ix = getCreateCredentialInstruction({
      payer: authority,
      authority,
      credential: credentialPda,
      name: CREDENTIAL_NAME,
      signers: [authority.address],
    });
    const sig = await submit(rpc, sendAndConfirm, authority, ix);
    console.log("  Created credential. Sig:", sig);
  });

  // --- 2. Schema -----------------------------------------------------------
  const SCHEMA_VERSION = 1;
  const [schemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });
  console.log("\nSchema PDA:", schemaPda);

  await runIfMissing(rpc, schemaPda, async () => {
    const ix = getCreateSchemaInstruction({
      payer: authority,
      authority,
      credential: credentialPda,
      schema: schemaPda,
      name: SCHEMA_NAME,
      description: "Pied Piper personhood: SGT-attested, biometric-signed wallet.",
      layout: new Uint8Array(Object.values(PERSONHOOD_SCHEMA)),
      fieldNames: Object.keys(PERSONHOOD_SCHEMA),
    });
    const sig = await submit(rpc, sendAndConfirm, authority, ix);
    console.log("  Created schema. Sig:", sig);
  });

  // --- 3. Attestation for the user ----------------------------------------
  // Use the user's address as the unique nonce → one attestation per wallet.
  const nonce = userAddress;
  const [attestationPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: schemaPda,
    nonce,
  });
  console.log("\nAttestation PDA:", attestationPda);

  const schemaAcc = await fetchSchema(rpc, schemaPda);
  const data = serializeAttestationData(schemaAcc.data, {
    wallet: userAddress,
    sgt_mint: sgtMintAddress,
    verified_at: BigInt(Math.floor(Date.now() / 1000)),
  });

  // Ten-year expiry (SAS uses i64 unix seconds)
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60);

  const ix = getCreateAttestationInstruction({
    payer: authority,
    authority,
    credential: credentialPda,
    schema: schemaPda,
    attestation: attestationPda,
    nonce,
    data,
    expiry,
  });
  const sig = await submit(rpc, sendAndConfirm, authority, ix);
  console.log("  Issued attestation. Sig:", sig);

  console.log("\n=== SAS BOOTSTRAP COMPLETE ===");
  console.log(JSON.stringify({
    sasProgram: "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG",
    issuer: authority.address,
    credentialName: CREDENTIAL_NAME,
    credential: credentialPda,
    schemaName: SCHEMA_NAME,
    schemaVersion: SCHEMA_VERSION,
    schema: schemaPda,
    schemaLayout: PERSONHOOD_SCHEMA,
    attestation: attestationPda,
    subjectWallet: userAddress,
  }, null, 2));
}

async function runIfMissing(rpc: any, addr: Address, fn: () => Promise<void>) {
  const info = await rpc.getAccountInfo(addr, { encoding: "base64" }).send();
  if (info?.value) {
    console.log("  Already exists, skipping create.");
    return;
  }
  await fn();
}

async function submit(
  rpc: any,
  sendAndConfirm: ReturnType<typeof sendAndConfirmTransactionFactory>,
  signer: KeyPairSigner,
  instruction: any,
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const tx = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayer(signer.address, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstruction(instruction, m),
  );
  const signed = await signTransactionMessageWithSigners(tx);
  await sendAndConfirm(signed, { commitment: "confirmed" });
  return getSignatureFromTransaction(signed);
}

main().catch((e) => { console.error(e); process.exit(1); });
