# RobinHoodie — Setup (T-X to T-7h checklist)

This is the runbook to take the repo from "scaffolded" → "demoable on your physical Seeker on devnet". Anything you can't run from the assistant session should be run by you in your shell — ideally inside the Claude Code session by prefixing `! ` so the output streams back into the chat.

## 0. Already done in the assistant session

**Code & tests**
- All program / app / scripts / tests / README written
- `anchor build` ✅ — `target/deploy/prediction_market.so` (337 KB) and `target/idl/prediction_market.json` generated
- **`anchor test` ✅ — 6 / 6 passing** (incl. cross-epoch UBI claim + double-claim rejection, 72 s total)
- `npx tsc --noEmit` in `app/piedpiper-app/` ✅ — clean
- End-to-end **localnet** smoke test of the full chain:
  - `solana-test-validator` with our program preloaded
  - `yarn seed --epoch=300` → SGT mint, UbiPool init, 2 SOL pre-fund, 2 demo markets ✅
  - `yarn settle --marketId=… --outcome=true` ✅
- IDL + generated TS types (`PredictionMarket`) copied into `app/piedpiper-app/src/{idl,types}/`
- First commit done (`7cd4d0b chore: scaffold RobinHoodie hackathon prototype`)

**Toolchain installed**
- `yarn`, `eas-cli`, `expo`, `adb`, `openjdk@17` (at `/opt/homebrew/opt/openjdk@17`)
- `anchor-cli` 0.31.1 (at `~/.cargo/bin/anchor`)
- `solana-cli` Agave 3.1.14 + `cargo-build-sbf` + `platform-tools v1.52` at `~/.local/share/solana/install/active_release/bin/` — **add this to your `$PATH`** (the brew-installed `solana` is missing `cargo-build-sbf`; the Anza one wins)
- Solana CLI configured for **devnet**, dev keypair at `~/.config/solana/id.json`, address **`58UM4CdJVF489o89LMWpuboN2wv4oy1RhNQcWWVdu4JW`** (currently 0 SOL — devnet faucet rate-limited my IP for the day)

**Wired program ID** **`6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K`** — keypair at `target/deploy/prediction_market-keypair.json`, referenced from:
- `programs/prediction_market/src/lib.rs` `declare_id!`
- `Anchor.toml` (localnet + devnet)
- `app/piedpiper-app/src/utils/config.ts`
- `app/piedpiper-app/src/idl/prediction_market.json` `address` (and the generated TS types)

## 1. Install Solana platform-tools (BLOCKED IN ASSISTANT SESSION — RUN YOURSELF)

The brew `solana` formula doesn't ship `cargo-build-sbf`. The cleanest fix is the **official Anza installer**, which downloads platform-tools and wires it into PATH. The assistant session is sandboxed against curl-pipe-sh, so run this yourself in the Claude prompt with the `!` prefix:

```bash
! sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

Then add to your shell PATH for this session:

```bash
! export PATH="/Users/pedrosaragossy/.local/share/solana/install/active_release/bin:$PATH" && cargo-build-sbf --version
```

(The installer also installs a separate `solana` binary alongside the brew one — order PATH so the Anza one wins, or `which -a solana` to inspect.)

Alternative if the installer is unreachable: download `platform-tools-osx-aarch64.tar.bz2` from <https://github.com/anza-xyz/platform-tools/releases/latest> (~396 MB), extract to `~/.local/share/solana/install/active_release/bin/sdk/sbf/dependencies/platform-tools/`, and ensure `cargo-build-sbf` is on PATH.

## 2. Set Java 17 PATH for this session

```bash
! export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home && export PATH="$JAVA_HOME/bin:$PATH" && java --version
```

Add to `~/.zshrc` so EAS local builds pick it up later.

## 3. Get devnet SOL (the assistant's IP is faucet-locked for the day)

```bash
! solana address       # → 58UM4CdJVF489o89LMWpuboN2wv4oy1RhNQcWWVdu4JW
```

Open <https://faucet.solana.com> in your browser, paste the address, request **2 SOL** (you'll need ~1.7 for program rent + a buffer for transactions).

```bash
! solana balance       # confirm ≥ 2 SOL before deploying
```

## 4. Build the program (already done; rebuild if you change Rust)

```bash
! yarn build       # = anchor build && yarn prepare:app  (re-copies IDL into app)
! anchor test      # 6/6 passing already, ~72 s
```

## 5. Deploy to devnet

```bash
! anchor deploy --provider.cluster devnet
```

Expect ~1.7 SOL spent on program rent. Note the printed program ID matches the keypair — should be `6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K`.

## 6. Connect your Seeker via USB and seed devnet for it

On the Seeker: enable Developer Options + USB debugging, plug into the Mac, accept the USB debugging prompt.

```bash
! adb devices                              # confirm Seeker shows up
```

Open the Seed Vault Wallet on Seeker, copy its pubkey (long-press the address → copy). Then:

```bash
! ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
  ANCHOR_WALLET=$HOME/.config/solana/id.json \
  yarn seed --seekerPubkey=<paste-the-base58-here> --epoch=300
```

This prints a JSON summary at the bottom — copy the values into the README badges (Mock SGT mint, UbiPool PDA, both demo Market PDAs). For reference, on a localnet smoke test the seed produced output like:

```json
{
  "programId": "6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K",
  "sgtMint": "5di5…cgABq",
  "ubiPool": "2A36…YDiLS",
  "market": "6XkQ…YsSco",
  "geoMarket": "4cQQ…nWXz",
  "seeker": "58UM…u4JW",
  "epochSeconds": 300
}
```

## 7. Pre-fund the Seeker wallet with devnet SOL

The Seeker wallet needs ~0.5 SOL to pay the bet + tx fees. Either:

```bash
! solana airdrop 1 <SEEKER_PUBKEY>
```

…or use <https://faucet.solana.com> with the Seeker pubkey.

## 8. Build + run the dev client on Seeker

```bash
! cd app/piedpiper-app && npx expo run:android --device
```

First build takes 10–25 min. Subsequent rebuilds are ~30s. The dev client APK installs onto the Seeker and the Metro bundler attaches.

When the app opens on the Seeker:
1. **Verify tab** → "Connect Wallet" → Seed Vault prompt → confirm.
2. SGT chip should turn green ("SGT detected").
3. Tap **Verify Personhood** → biometric signMessage prompt → confirm. The "Personhood: Verified" chip should appear.
4. **Markets tab** → place a 0.1 SOL bet on "Will BTC > $100k by EOD?" → biometric prompt → confirm.
5. Open `https://explorer.solana.com/?cluster=devnet` in your browser, paste the UbiPool PDA from step 6 — confirm fee accrual.
6. Settle the market: `! yarn settle -- --marketId=<id-from-seed-output> --outcome=true`
7. Back in app → **Markets** → tap **Claim Winnings**. Should return SOL.
8. **Claim UBI** button → biometric → SOL lands. Tap again → "already claimed this epoch" rejection.

This is the must-ship checkpoint.

## 9. (Stretch) GPS geo-fenced market for the demo

Edit `scripts/seed.ts` after the existing `createMarket` call to add a second market with `geo_h3 = 1` and `geo_radius_m = 50`:

```ts
const marketId2 = new BN(Date.now() + 1);
const market2 = PublicKey.findProgramAddressSync(
  [Buffer.from("market"), marketId2.toArrayLike(Buffer, "le", 8)],
  program.programId,
)[0];
await program.methods
  .createMarket(marketId2, "Will it rain at the venue tomorrow?", endTs, new BN(1), 50)
  .accountsStrict({
    market: market2,
    admin: admin.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

Re-run `yarn seed -- --seekerPubkey=<...>`. The Markets tab will grey the "YES/NO" buttons unless GPS reports you within 50 m of `VENUE_GEO` (Miami Beach Convention Center, hardcoded in `app/.../utils/config.ts` — change if you're elsewhere).

## 10. Build release APK

```bash
! cd app/piedpiper-app && eas build --profile preview --platform android --local
```

10–25 min. Output: `build-*.apk` in the app dir. Install:

```bash
! adb install -r app/piedpiper-app/build-*.apk
```

If EAS local build fails (Gradle / JDK), fallback:

```bash
! cd app/piedpiper-app && npx expo prebuild --platform android && cd android && ./gradlew assembleRelease
```

The signed APK ends up at `app/piedpiper-app/android/app/build/outputs/apk/release/app-release.apk`.

## 11. Record demo video

```bash
! adb shell screenrecord /sdcard/demo.mp4 --time-limit 180
# (perform the demo on Seeker)
! adb pull /sdcard/demo.mp4
```

Record voiceover separately in QuickTime, mux in iMovie. Script in README §"Demo flow".

## 12. Submission checklist

- [ ] Public GitHub repo (`gh repo create piedpiper --public --source=. --push`)
- [ ] GitHub Release `v0.1.0-hackathon` with the signed APK attached
- [ ] Demo video uploaded unlisted to YouTube; link in README
- [ ] README updated with deployed addresses (PROGRAM_ID, UbiPool PDA, demo market PDA, mock SGT mint) + Solana Explorer (devnet) links
- [ ] EasyA submission portal filled out
- [ ] Optional: `npx dapp-store init` if you want to also submit to the Solana dApp Store

## Known gotchas in the repo

- The IDL at `app/piedpiper-app/src/idl/prediction_market.json` is a **placeholder** until you copy the generated one (step 4). The app will throw at runtime until you do.
- `Connection` in the app uses `clusterApiUrl("devnet")` (the public RPC). You will get rate-limited mid-demo — replace `DEVNET_RPC` in `app/.../utils/config.ts` with your Helius key and update `cluster-data-access.tsx` to use it.
- The `register_verification` instruction takes the Token-2022 SGT account directly. The TS test seeds a mock SGT mint; in production you'd Token-2022 group-membership-check against the real Seeker mint. README documents this.
- `claim_ubi` epoch math reads the per-epoch lamports lazily on first claim of a new epoch. If you initialize the pool then claim immediately without any bets, `per_epoch_lamports = 0` and the call rejects with `NoUbiAvailable`. Pre-funding 2 SOL in the seed script avoids this.
