# Product

## Register

product

## Users

Solana Mobile **Seeker** holders — people who own the device and its Seeker Genesis Token (SGT). Ownership of the hardware is the only way into the app: no SGT, no personhood, no UBI claim, no bet.

In practice this splits into two contexts:

- **Hackathon judges and Solana-Mobile early adopters** (current submission audience) — opening the APK on a real Seeker for the first time, evaluating whether the personhood gate, the UBI loop, and the home-screen widget feel like first-class mobile-native software rather than a porting exercise.
- **Verified human users** (longer-term audience) — phone in hand, on the move, often opening the app for thirty seconds at a time to glance at the UBI pool, place a small bet on a geo-fenced market, or confirm a biometric claim. The Seeker fingerprint sensor is part of every meaningful interaction.

The job to be done on any single screen is small and well-defined: *verify that I am human*, *see what the pool is worth*, *take or settle a bet*, *claim my share*. Density of explanation belongs in the README; the app itself is meant to feel direct.

## Product Purpose

A mobile-first prediction market on Solana whose 2 % trading fees stream as Universal Basic Income to verified humans, where personhood is proven cryptographically by Seeker hardware ownership plus a biometric Seed Vault signature.

The product also exposes itself outward through `@piedpiper/sdk` and a Solana Attestation Service issuer credential, so that any other Solana app, payroll script, or treasury bot can both donate to the same UBI pool ("welfare companies as a primitive") and consume Pied Piper personhood without integrating the IDL.

Success is when the app feels less like "another Solana dApp" and more like a piece of the Seeker — when the fee → UBI loop, the biometric gate, and the live home-screen widget combine into something that could not exist on any other phone.

## Brand Personality

**Bold, mobile-native, kinetic.** The interface speaks with confidence through scale rather than chrome: monolithic typographic blocks, single-color floods, hero numbers that own the screen the way Cash App's balance does. Slightly mischievous — the project is named after a fictional Silicon Valley startup and knows it — but the wink is in microcopy and density, never in flourish.

Voice: terse, technically literal, occasionally dry. UBI claims and pool balances are stated as facts, not celebrated. The app trusts the user to read a number and a verb.

Emotionally the product should evoke **immediacy** (the biometric prompt is the user-visible proof that a real human is at the device), **legitimacy** (personhood and welfare are weighty words; the visuals carry that weight without sermonising), and **kinetic confidence** (mobile-native, fingerprint-driven, almost tactile).

## Anti-references

- **Stock Material Design 3 / react-native-paper defaults.** The current scaffold inherits MD3 surfaces, neutral purples, and Android chip styling. Any screen that still reads as "default Material" has failed.
- **SaaS-cream landing pages.** Off-white backgrounds, Inter, soft drop shadows, gradient blob heroes, three-column feature cards — the YC-startup template. Pied Piper is not a SaaS company; it is a piece of mobile hardware software.
- **Crypto-casino / degen aesthetic.** Neon-green-on-black, candy gradients, animated coin glyphs, Pump.fun hype copy. Bold ≠ degen-neon, and a UBI-funded prediction market cannot read as a casino skin without contradicting its own thesis.
- **Polymarket clone.** White + blue + percentage-bar chart language. Different category, different commitments; do not borrow it by reflex.

## Design Principles

1. **Confidence through scale, not chrome.** Hero numbers carry meaning. The pool balance, the SOL amount, the epoch counter, the percentage — these are first-class typography, not labels nested inside cards. If a screen has more chrome than content, rebuild it.
2. **Hardware is the verb.** Every transaction is a biometric touch on a TEE-isolated key. Interfaces should treat the Seeker fingerprint, Seed Vault, and SGT as protagonists, not hide them behind a generic "Sign" button. Personhood, biometric, and SGT-detected states deserve more than chips.
3. **Monolithic, not modular.** No card grids of identical tiles, no nested cards, no SaaS-template panels. Each screen states one thing loudly and supports it with a small number of decisive secondary elements.
4. **Public-goods backbone, not casino skin.** UBI and welfare are the moral foundation of the product; the visuals carry that seriousness while still feeling kinetic. Money-app boldness, not gambling-app boldness.
5. **Mobile-first means thumb-first.** Primary actions sit where a thumb lands on a Seeker held one-handed. Density that works on a 27-inch monitor does not work here. Test every screen by holding the device, not by zooming a Figma frame.

## Accessibility & Inclusion

- **WCAG 2.1 AA, dark-first.** The default theme is dark — it matches the on-the-go Seeker context, and the fingerprint-driven flow is happiest against a dark canvas. AA contrast on all text and meaningful UI surfaces; brand color floods must still meet AA when text overlays them.
- **Reduced motion respected.** All kinetic touches (pool counters animating, biometric pulse, transition curves) honour `prefers-reduced-motion` with non-animated equivalents that preserve meaning.
- **No motion-only state.** Verification, settled, and claim states must be readable from a still screenshot — color and animation are reinforcement, not the only signal.
- **Numeric legibility.** SOL amounts and percentages use tabular numerals where possible so values do not jitter as they update; this is an a11y win for low-vision users and a craft win for everyone.
- **Hardware fallback messaging.** When the user is missing the SGT, missing the Seed Vault, or out of geo-range, the message is explicit and humane — not a generic "permission denied" or red toast.
