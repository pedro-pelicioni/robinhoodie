PIED PIPER — PITCH DECK SOURCE DOCUMENT


Project name

RobinHoodie. Named after the fictional Silicon Valley startup; the wink is intentional — terse, technically literal, slightly mischievous. Tagline candidates in priority order. The first prediction market that cannot exist without a Seeker — hardware-attested personhood unlocks fee-funded UBI. Or shorter. Hardware personhood. Fee-funded UBI. Built on the Seeker. Or shortest. Bet, verify, get paid — only on the Seeker.


One-line description

RobinHoodie is a mobile-first prediction market on Solana whose 2 percent trading fees stream as Universal Basic Income to verified humans, where personhood is proven by physical ownership of a Solana Mobile Seeker phone plus a hardware-isolated biometric signature.


The 30-second pitch

Every Solana prediction market today has the same problem. Bots and sybil farms drain the upside, and there is no good answer to who counts as a real person. We solve both at once. RobinHoodie only runs on a Solana Mobile Seeker. To verify as a human, you must on-chain prove ownership of the Seeker Genesis Token — a Token-2022 NFT minted to every Seeker — and then pass a Seed Vault biometric signature challenge that runs on a hardware-isolated TEE key. Once verified, you can place bets. Two percent of every trade flows to a UBI pool, and verified humans claim a share each epoch. We turn a prediction market into a public-goods machine, and we turn a phone into a personhood credential the rest of Solana can read through the Solana Attestation Service.


The problem

Prediction markets are eating the internet. Polymarket cleared billions of dollars in 2024 and 2025, Kalshi did the same in regulated form. But three problems sit unsolved underneath all of them. First, sybils. There is no cheap on-chain way to know that a wallet is one human, so airdrops and rebates are farmed by farms. Second, no one shares the upside. Trading fees go to the house and the house alone, even though every retail user is generating the volume. Third, the apps are built for desktops first and bolted onto phones, even though the actual end users are on a phone in their pocket for thirty seconds at a time. The mobile dApps that do exist tend to be ports — they treat the phone as a small browser, not as a piece of hardware with a TEE, a fingerprint sensor, and a GPS. Worldcoin tried to solve personhood with a custom orb. We argue the orb already shipped. It is the Solana Mobile Seeker.


The insight

The Seeker is the first phone where every user is required to hold an on-chain credential — the Seeker Genesis Token, a Token-2022 NFT in the group GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te — and where every signature flows through a hardware-isolated Trusted Execution Environment with a fingerprint prompt. That means the Seeker is, by construction, a hardware personhood device. One Seeker, one fingerprint, one human. We did not invent that primitive. Solana Mobile shipped it. We are the first app to make it the entire foundation of a product, not a side-feature.


What we built

A single Anchor program, deployed live to Solana devnet at 6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K, with five PDAs. UbiPool is the fee accumulator and epoch tracker. Market is a binary YES or NO parimutuel market in lamports, with optional geo-fence fields for h3 cell and radius. Position is per-user per-market stake on each side. VerificationRecord is the personhood receipt and holds the last-claim epoch for UBI rate-limiting. DonorRecord is the per-donor running total for any external welfare contributor.

A native Android app, built on the Solana Mobile Expo template, that runs as a signed APK on the Seeker hardware. The app drives every transaction through the Mobile Wallet Adapter, which on Seeker routes through Seed Vault automatically — double-tap power, fingerprint, sign. Four screens. Verify. Markets. UBI claim. History.

A live Glance and Compose home-screen widget, written in pure Kotlin. The widget process polls devnet directly via OkHttp, base64, and a 121-byte UbiPool slice — a Kotlin port of the same hand-rolled Borsh codec the React Native app uses. The widget ticks even when the main app is not running. It updates every thirty minutes. We verified the widget provider is active on the device via dumpsys appwidget.

A published TypeScript SDK, @piedpiper/sdk, that gives any Solana app, server, payroll script, or treasury bot a two-line donation primitive. Welfare companies as a primitive. Confirmed end-to-end on devnet with a one-shot Acme Corp Q2 2026 welfare contribution transaction. The SDK has zero Anchor dependency and runs in browser, Node, and React Native.

An issuer credential on the Solana Foundation's Solana Attestation Service. RobinHoodie is a SAS issuer at credential B95yGf2Hp2Hf7ChhkcvNAxE3rAkxFB23RSLg1x9Mickq with a Personhood schema that publishes wallet, sgt_mint, and verified_at as a 10-year-expiry attestation. Any third-party Solana app can read it with one line — client dot findPiedPiperPersonhood of wallet — without integrating our IDL or paying a runtime sas-lib dependency.


How it works end to end

Step one. The user opens RobinHoodie on a Seeker. The Connect button calls the Mobile Wallet Adapter, which routes into Seed Vault. The user double-taps the power button and presses their fingerprint on the Seeker's TEE-isolated sensor. The wallet pubkey is now visible.

Step two. The app does a deterministic Token-2022 Associated Token Account lookup for the Seeker Genesis Token mint. If the user holds an SGT, a green chip appears that says SGT detected. If not, the verify button stays disabled. No SGT, no personhood, no app.

Step three. The user taps Verify Personhood. MWA presents a signAndSendTransaction request, the biometric prompt fires again, the user confirms, and the program writes a VerificationRecord PDA on-chain. That PDA is the personhood receipt. It is the only proof of life the system needs.

Step four. The user opens the Markets tab and places a bet — say 0.1 SOL on YES on a market called Will BTC be above 100k by EOD. Biometric prompt. Sign. The program splits the deposit. 0.098 SOL lands in the market's YES vault. 0.002 SOL — the 2 percent fee — accrues to UbiPool's distributable counter.

Step five. An admin resolves the market with the YES outcome. The market state flips to settled. The user sees a trophy chip that says You won 0.098 SOL — auto-credited at next epoch. Resolution is admin-only in the MVP; the resolution_type enum and resolver field on Market are designed-for swap points for Switchboard On-Demand or Pyth.

Step six. At the next epoch boundary — five minutes in the demo, configurable in production — the user taps Claim UBI. Biometric prompt. Sign. The program reads UbiPool's accumulated lamports, divides by the count of verified Seeker holders, and pays out one share to the user. A second tap inside the same epoch returns AlreadyClaimed.

Step seven, in parallel, off the user's device. The Acme Corp treasury bot, running anywhere in the world, calls client dot donateInstruction with an amount and a memo. 0.05 SOL flows into the same UbiPool, a DonorRecord PDA is created or incremented, and the memo is on-chain. Acme is now a welfare contributor. No oracle integration, no epoch math, no UBI logic on Acme's side. The SDK does it all.


The novel artifacts

Hardware-attested personhood as a hard gate. Not a soft signal — the app cannot run without an SGT and a biometric. Every signature is a touch on a TEE-isolated key.

The fee-to-UBI loop. Every prediction market trade compounds a public goods pool. Distribution is per-epoch with on-chain double-claim rejection. Trader fees and external donations land in the same counter and are paid to the same set of verified humans on the same schedule.

SAS-published personhood. RobinHoodie is now a credential issuer for any Solana app on the Solana Foundation's attestation service. We are not a closed system. We are infrastructure other apps can call.

The home-screen widget. A live UBI pool counter on the Seeker's home screen, written in pure Kotlin Glance and Compose, ticking every thirty minutes against devnet. No React Native bridge, no main app required. The kind of mobile-native artifact judges literally do not see from any other Solana dApp.

The welfare-companies SDK. Two lines of TypeScript turn any Solana product or treasury into a public-goods contributor with on-chain attribution. We argue this is a primitive — welfare companies — that has not existed before in crypto.

The hand-rolled Borsh codec. We bypass Anchor's buffer-layout-based decoder, which crashes on Hermes — the React Native engine — with Buffer.prototype.readUIntLE is not a function. Our codec is account discriminators plus slice-based field reads, written from scratch, fifty lines per side. The same codec powers the widget and the SDK so they run zero-deps everywhere.

Geo-fenced markets. expo-location on the device, h3 cell and radius fields on the Market PDA, on-device GPS check gating the bet button. The rain-at-the-venue market only takes bets when you are physically near the venue. Demo radius is 50 meters around the Miami Beach Convention Center.


Live, on-chain, on devnet, today

Program ID 6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K. UbiPool PDA pre-funded with 4 SOL plus 0.002 SOL of accrued fees. Two demo markets, one open, one geo-fenced. One signed and confirmed register_verification, one place_bet for 0.1 SOL on YES, one resolve_market YES, one claim_ubi for 0.002 SOL, one donate_to_pool for 0.05 SOL with the Acme Corp memo, one SAS CreateCredential, one SAS CreateSchema, one SAS CreateAttestation. Every transaction has a Solana Explorer link in the README. Six out of six Anchor TypeScript tests passing on the local validator, including cross-epoch UBI claim and double-claim rejection, in seventy-two seconds total. The signed release APK at dist/piedpiper-v0.1.0.apk, sixty-five megabytes, installable on any Seeker via adb install dash r.


Why Solana, why Seeker, why now

Solana is the only chain where the per-trade economics make 2 percent fee skimming for UBI viable — block fees and transaction latency on Ethereum mainnet would eat the spread. Solana Attestation Service is brand new infrastructure shipped by the Solana Foundation in 2025; we are one of the first issuers in production. The Seeker is the first phone with on-chain mandatory ownership of a Token-2022 NFT — we are skating to where Solana Mobile already put the puck. The whole thesis only works on this stack and on this device.


The market

Prediction markets are a multi-billion-dollar liquid category in 2025 and 2026. Polymarket plus Kalshi cleared more than 10 billion dollars in volume during the 2024 US election cycle alone. Solana DeFi protocols pay out billions in points and airdrops a year, almost all of it dissipated to sybils. Universal Basic Income pilots — GiveDirectly, Stockton SEED, Worldcoin's WLD distribution — are credible enough to be running at city scale, but none of them have the funding flywheel we have. We do not need a foundation grant or a token sale to fund our UBI. The market funds itself, every trade.


Business model

The same 2 percent fee that funds UBI can be split. In the MVP it is 100 percent UBI. In the production model the protocol can take, for example, 0.5 percent for treasury and route 1.5 percent to UBI. We have not committed to a number. The point is the lever exists and the contract is upgradable. Welfare companies — corporate or DAO donors who use the SDK — pay nothing to us; they pay into the UBI pool, and we get attribution and an on-chain memo trail in exchange for the credibility of the brand. The brand is the moat.


Defensibility

The Seeker hard gate. Most dApps cannot replicate it without shipping their own phone. Solana Mobile is unlikely to ship competitor hardware in the next eighteen months. The SAS issuer credential. We are now a name that any third-party app can verify against. The SDK adoption flywheel. Each new welfare company integration grows the pool, which grows the per-epoch payout, which grows incentive to verify, which grows the verified-human count, which makes the personhood credential more valuable to integrate against. Every loop reinforces the next.


What is genuinely first-of-its-kind here

A live home-screen widget that polls a Solana program directly from Kotlin. An SAS issuer for personhood backed by a hardware credential. A welfare contribution primitive shipped as an SDK. A prediction market where the public-goods backbone is not a marketing line but the actual flow of funds. A geo-fenced binary market on Solana with an h3 cell on a PDA. A Hermes-safe Borsh codec we open-sourced inside the SDK. None of these existed in production a year ago.


Roadmap

V0.2. Camera plus ML Kit on-device face liveness with an eye-blink challenge, plus a face_hash 32-byte field on VerificationRecord so the same person cannot re-verify on a different wallet by hopping faces. The integration cost is roughly three to four hours, mostly the Expo native module rebuild — documented in code comments above register_verification. SPL token donations through the SDK. A getDonorLeaderboard helper using getProgramAccounts.

V0.3. Switchboard On-Demand or Pyth as the swappable resolver to remove the admin-only resolution constraint. SAS attestation paired with GPS h3-cell rate-limiting for region-based UBI variants. A Bubblegum compressed NFT minted to each donor on first donation as a reputation token.

V1.0. Mainnet deployment. Token-2022 group-membership check against the real Seeker mint. Production fee split. App store submission via npx dapp-store init. White-labeled SDK so other geographies can stand up regional UBI pools that share the personhood credential.


Known limitations we are honest about

Devnet only today. The mock SGT mint replaces the real Token-2022 group on mainnet — production will do a proper group-membership check via unpackMint plus getTokenGroupMemberState rather than a hardcoded mint. Resolution is admin-only. Sybil resistance is partial — SGT-per-device plus one-claim-per-epoch is the current defense; face liveness ships in v0.2. Prediction markets plus gambling-fee-funded UBI is a regulatory grey zone in most jurisdictions; this is research-grade work and not for use in regulated markets without a license.


The team

Solo build. Pedro Saragossy. Built end to end in under twenty-four hours for the EasyA Consensus Hackathon Miami, May 5 to 7, 2026. Anchor program, React Native app, Kotlin widget, TypeScript SDK, SAS issuer credential, scripts, tests, devnet deploy, signed APK, demo video — all shipped solo on a single Seeker.


Why this can win

Three reasons. One, it is the only submission that physically cannot run without the Seeker, which means the demo is unforgeable on a desktop. Two, every novel artifact has a live on-chain transaction backing it — there is no slideware. Three, the home-screen widget plus the SAS issuer credential plus the welfare-companies SDK are three independently fundable products built into one demo. The judges are looking for mobile-native software that uses Solana Mobile primitives in a way no desktop dApp could. We did that, and then we shipped two more orthogonal pieces of infrastructure on top of it.


Submission artifacts

Signed release APK at dist/piedpiper-v0.1.0.apk, sixty-five megabytes, attached to the GitHub Release tagged v0.1.0-hackathon, installable on any Seeker via adb install dash r. Demo slideshow at media/demo.mp4, fifteen seconds, plus three captioned screenshots in media/. Live devnet program with five end-to-end transactions in the README table. Six out of six Anchor TypeScript tests passing on the local validator. A reproducible setup runbook at SETUP.md taking the repo from scaffolded to demoable on a physical Seeker.


Credits and prior art

The Anchor parimutuel structure was inspired by 0xCipherCoder's memecoin_prediction_market under MIT. We added SOL-native vaults, fee accrual, VerificationRecord, UbiPool, geo fields, and the swappable resolver. The mobile scaffold is from solana-mobile's solana-mobile-expo-template. Everything else — the SDK, the widget, the SAS issuer, the codec, the Verification flow, the admin scripts, the seed and settle and donate scripts — is original.


License

MIT.


Closing line for a final slide

We did not build another Solana dApp. We built the first piece of software that proves the Seeker is more than a phone. It is a personhood device, and personhood is the missing primitive in crypto. RobinHoodie is what gets shipped on top.
