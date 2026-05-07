# Pied Piper

> **Hackathon prototype** — built solo in <24h for **EasyA Consensus Hackathon Miami, May 5–7, 2026**.
> Devnet only. Not for production use.

A mobile-first **prediction market on Solana** whose 2 % trading fees stream as **Universal Basic Income** to verified humans — where "verified human" means *cryptographically proven to own a [Solana Mobile Seeker](https://solanamobile.com/seeker)*.

The app cannot run without a Seeker. Personhood is gated on on-chain ownership of the device's **Seeker Genesis Token** (SGT, a Token-2022 NFT in the group `GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te`) plus a Mobile Wallet Adapter `signMessage` challenge that flows through Seed Vault's hardware-backed biometric prompt.

> *The first prediction market that cannot exist without a Seeker — hardware-attested personhood unlocks fee-funded UBI.*

## Why Seeker

| Layer | Role in Pied Piper |
| --- | --- |
| Mobile Wallet Adapter (MWA) | All transaction signing; on Seeker, MWA routes through Seed Vault automatically (double-tap power + fingerprint). |
| Seeker Genesis Token (SGT) | The hard requirement. No SGT in your wallet → no UBI claim. One claim per SGT keeps sybil rooms in check without re-doing KYC. |
| Seed Vault TEE | Hardware-isolated keys; the biometric prompt for every signature is the user-visible proof that a real human is at the device. |
| GPS *(stretch)* | Geo-fenced markets — e.g. a 50 m-radius market that only opens within Miami Beach Convention Center. |

## Architecture

Single Anchor program (`prediction_market`, devnet) with five PDAs:

| PDA | Seeds | Purpose |
| --- | --- | --- |
| `UbiPool` | `[b"ubi_pool"]` | Fee accumulator, epoch tracker, holds `sgt_mint` + `epoch_seconds` config. |
| `Market` | `[b"market", market_id_le]` | Binary YES/NO parimutuel market in lamports. Optional `geo_h3` + `geo_radius_m` for geo-fenced markets. |
| `Position` | `[b"pos", market, user]` | Per-user, per-market stake on each side. |
| `VerificationRecord` | `[b"verify", user]` | Personhood receipt; `last_claim_epoch` for UBI claim rate-limit. |

Resolution is **Admin-only for the MVP** — the `resolution_type` enum + `resolver` field on `Market` are designed-for, not implemented swap-points for Switchboard On-Demand or Pyth.

UBI distribution is **per-epoch (`epoch_seconds` configurable; demo uses 5 min)**. On the first claim of a new epoch, `per_epoch_lamports = pool.total_lamports / verified_count` is snapshotted and each verified holder can claim once per epoch.

## Devnet deployment

| Artifact | Address |
| --- | --- |
| Program ID | _(filled at deploy time)_ |
| UbiPool PDA | _(filled at seed time)_ |
| Demo market PDA | _(filled at seed time)_ |
| Mock SGT mint | _(filled at seed time — Token-2022)_ |

Verify on [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet).

## Run locally

```bash
# 1. Devnet config + airdrop
solana config set -u devnet
solana airdrop 5

# 2. Build + deploy program
anchor build
anchor deploy --provider.cluster devnet

# 3. Seed devnet (mints mock SGT to your Seeker wallet, creates demo market)
yarn seed -- --seekerPubkey=<base58-of-seeker-wallet> --epoch=300

# 4. Start the dev client on the connected Seeker
cd app/piedpiper-app
yarn
npx expo run:android --device

# 5. Build the release APK (10–25 min)
eas build --profile preview --platform android --local
adb install -r build-*.apk
```

## Demo flow

1. Open app → "Connect Wallet" → MWA invokes Seed Vault.
2. App detects mock SGT via `getTokenAccountsByOwner` filtered by Token-2022 program + the seeded SGT mint.
3. "Verify Personhood" → MWA `signMessage` (biometric prompt) → submits `register_verification` → `VerificationRecord` PDA exists on-chain.
4. "Place Bet" 0.1 SOL on demo market → SOL leaves wallet, 2 % accrues to `UbiPool`.
5. Admin resolves via `yarn settle -- --marketId=<id> --outcome=true` → `claim_winnings` returns SOL.
6. "Claim UBI" → SOL lands → second tap → "already claimed this epoch" rejected.

## Known limitations

- **Devnet only.** Mock SGT mint replaces the real `GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te` group on mainnet. Production would do a Token-2022 group-membership check via `unpackMint` + `getTokenGroupMemberState`, not a single hardcoded mint.
- **Admin-only resolution.** Switchboard On-Demand / Pyth are designed-for via the `resolution_type` enum but not wired up.
- **Sybil resistance is partial.** SGT-per-device + 1-claim-per-epoch is the current defense; future work: SAS attestation, ML Kit liveness, GPS H3-cell rate-limiting.
- **Prediction-market + gambling-fee-funded UBI is a regulatory grey zone.** This is research; not for use in regulated jurisdictions.

## Credits

- Anchor parimutuel structure inspired by [`0xCipherCoder/memecoin_prediction_market`](https://github.com/0xCipherCoder/memecoin_prediction_market) (MIT). Our additions: SOL-native vaults, fee accrual, `VerificationRecord`, `UbiPool`, geo-fields, swappable resolver.
- Mobile scaffold from [`solana-mobile/solana-mobile-expo-template`](https://github.com/solana-mobile/solana-mobile-expo-template).

## License

MIT
