# @piedpiper/sdk

> Drop-in SDK for "welfare companies" — donate to the Pied Piper UBI pool from any Solana app, server, or payroll script.

```bash
yarn add @piedpiper/sdk @solana/web3.js
```

## What it does

[Pied Piper](../../README.md) is a prediction market on Solana whose 2 % trading fees stream as Universal Basic Income to verified Seeker owners. **This SDK lets anyone — not just bettors — top up the same UBI pool with an on-chain attribution record.**

Use cases:
- Q2 CSR contribution from a corporate treasury (one cron job, one tx, on-chain receipt).
- A non-profit batches monthly donations and gets a public leaderboard PDA.
- A partner dApp donates a slice of its own fees as a public-goods commitment.
- A government or DAO grants matching funds to amplify the trader-funded UBI.

Every donation lands directly in `UbiPool` (devnet `2A36A6Vujy6G9AzUwFp3eg9vfSTWWxYWrsUgtBmYDiLS`) and increments the same `total_lamports` counter that drives epoch payouts to verified humans. A per-donor `DonorRecord` PDA tracks running totals + the most-recent memo.

## Two-line donation

```ts
import { Connection, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { PiedPiperClient } from "@piedpiper/sdk";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const client = new PiedPiperClient(connection);
const donor = Keypair.fromSecretKey(...);   // your treasury keypair

const ix = client.donateInstruction({
  donor: donor.publicKey,
  amountLamports: 1_000_000_000n,            // 1 SOL
  memo: "Acme Corp Q2 2026 welfare contribution",
});
const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [donor]);
console.log("Donation tx:", sig);
```

## Reading state

```ts
const pool = await client.getUbiPool();
console.log("Verified humans:", pool.verifiedCount);
console.log("Total welfare pool:", Number(pool.totalLamports) / 1e9, "SOL");

const record = await client.getDonorRecord(donor.publicKey);
console.log("This donor's lifetime contribution:", Number(record.totalDonated) / 1e9, "SOL");
console.log("Last memo:", record.lastMemo);
```

## How the math flows

```
  partner / corp                                   verified Seeker holders
        │                                                  ▲
        │  donate_to_pool(amount, memo)                    │  claim_ubi
        ▼                                                  │
  ┌────────────┐  fees from every place_bet      ┌────────────────────┐
  │  UbiPool   │ ◀──────────────────────────────  │  per_epoch_lamports │
  │            │   (existing prediction market)   │  = total / verified │
  └────────────┘                                  └────────────────────┘
        │
        └─→ DonorRecord PDA (per-donor running total + last memo)
```

A donation does not directly increase any individual claim — it grows `total_lamports`, which on the next epoch boundary is divided across all currently-verified Seeker holders. Donations and trader fees compound into the same pool.

## Compatibility

- **Solana:** devnet (current deployment) + mainnet-ready (deploy your own copy or wait for ours).
- **Wallets:** any wallet that can sign a `Transaction` — server `Keypair`, browser wallet adapter, Mobile Wallet Adapter, hardware wallets.
- **Encoders:** zero anchor dependency. Hand-rolled Borsh (instruction discriminator + u64 LE + Borsh string), so the SDK runs on Hermes / React Native without `buffer-layout` issues.

## Roadmap

- v0.2: SPL-token donations (currently SOL-only).
- v0.2: `getDonorLeaderboard()` helper using `getProgramAccounts` + `DonorRecord` discriminator.
- v0.3: Reputation NFT mint per donor on first donation (Bubblegum cNFT).

## License

MIT
