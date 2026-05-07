---
name: RobinHoodie
description: A Seeker-hardware-native prediction market whose 2 % fees stream as UBI to verified humans.
colors:
  signal-amber: "#E27726"
  signal-amber-deep: "#B85F1B"
  signal-amber-quiet: "#7A4A22"
  ash-coal: "#15110D"
  ash-graphite: "#1F1A14"
  ash-charcoal: "#2A2520"
  ash-line: "#3A332C"
  ash-mist: "#85786A"
  ash-fog: "#B5A89A"
  ash-bone: "#F2EDE5"
  state-kelp: "#5B8A5E"
  state-kelp-deep: "#3F6643"
  state-kelp-quiet: "#2C3D2E"
  state-terra: "#A85C3F"
  state-terra-deep: "#7C422C"
  state-terra-quiet: "#4A2C20"
  state-error: "#C04A2E"
typography:
  display:
    fontFamily: "Inter_600SemiBold, Inter, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter_600SemiBold, Inter, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter_600SemiBold, Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Inter_400Regular, Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  bodyMedium:
    fontFamily: "Inter_500Medium, Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Inter_500Medium, Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
  numericDisplay:
    fontFamily: "JetBrainsMono_500Medium, JetBrainsMono, ui-monospace"
    fontSize: "56px"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  numericHeadline:
    fontFamily: "JetBrainsMono_500Medium, JetBrainsMono, ui-monospace"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.1
  numericBody:
    fontFamily: "JetBrainsMono_400Regular, JetBrainsMono, ui-monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  numericCaption:
    fontFamily: "JetBrainsMono_400Regular, JetBrainsMono, ui-monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  none: "0px"
  sm: "8px"
  md: "20px"
  lg: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
  hero: "64px"
components:
  primary-button:
    backgroundColor: "{colors.signal-amber}"
    textColor: "{colors.ash-coal}"
    rounded: "{rounded.lg}"
    height: "56px"
    padding: "0 24px"
    typography: "{typography.bodyMedium}"
  primary-button-pressed:
    backgroundColor: "{colors.signal-amber-deep}"
    textColor: "{colors.ash-coal}"
  primary-button-disabled:
    backgroundColor: "{colors.signal-amber-quiet}"
    textColor: "{colors.ash-mist}"
  ghost-button:
    backgroundColor: "transparent"
    textColor: "{colors.ash-bone}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 16px"
    typography: "{typography.bodyMedium}"
  status-surface:
    backgroundColor: "{colors.ash-charcoal}"
    textColor: "{colors.ash-bone}"
    rounded: "{rounded.md}"
    padding: "16px"
  status-surface-amber:
    backgroundColor: "{colors.signal-amber}"
    textColor: "{colors.ash-coal}"
    rounded: "{rounded.md}"
    padding: "16px"
  status-surface-kelp:
    backgroundColor: "{colors.state-kelp-quiet}"
    textColor: "{colors.ash-bone}"
    rounded: "{rounded.md}"
    padding: "16px"
  status-surface-terra:
    backgroundColor: "{colors.state-terra-quiet}"
    textColor: "{colors.ash-bone}"
    rounded: "{rounded.md}"
    padding: "16px"
  bet-yes:
    backgroundColor: "{colors.state-kelp}"
    textColor: "{colors.ash-coal}"
    rounded: "{rounded.md}"
    height: "96px"
  bet-no:
    backgroundColor: "{colors.state-terra}"
    textColor: "{colors.ash-coal}"
    rounded: "{rounded.md}"
    height: "96px"
  amount-chip:
    backgroundColor: "{colors.ash-charcoal}"
    textColor: "{colors.ash-bone}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  amount-chip-selected:
    backgroundColor: "{colors.signal-amber}"
    textColor: "{colors.ash-coal}"
    rounded: "{rounded.sm}"
  hash-display:
    backgroundColor: "transparent"
    textColor: "{colors.ash-fog}"
    typography: "{typography.numericBody}"
  hero-value-block:
    backgroundColor: "transparent"
    textColor: "{colors.signal-amber}"
    typography: "{typography.numericDisplay}"
  top-app-bar:
    backgroundColor: "{colors.ash-coal}"
    textColor: "{colors.ash-bone}"
    height: "56px"
---

# Design System: RobinHoodie

## 1. Overview

**Creative North Star: "The Hardware Marquee"**

RobinHoodie looks like a piece of the Seeker, not a generic dApp dropped onto Android. The aesthetic borrows from money-app boldness (Cash App's monolithic single-color screen, early Robinhood's hyper-confident state pages) and from the hardware itself (Seeker stock UI, Solana Saga's hardware-as-canvas posture). Picture a backlit transit marquee, a digital ticker on a railway platform, a treasury terminal: amber values burning on a near-black surface, every number stated as a fact, no decoration competing with the value being shown.

The system is **dark-first** for an honest reason: the user is a Seeker holder in transit, glancing one-handed at an OLED in evening light to see whether their UBI claim posted. Light theme exists for accessibility and for situations where the device is propped on a desk, but the canonical surface is dark. **Color strategy is Committed**: a single deep amber carries 30 to 60 % of any meaningful screen, and it carries one meaning only, value. **Typography is single-technical-sans plus tabular mono for numerics**, because every screen has at least one number that must read as a fact, not jitter as it updates. **Motion is responsive**: state changes, feedback, biometric pulse, pool counter ticks. No orchestrated entrances, no scroll choreography, no decorative motion.

This system explicitly rejects: stock Material Design 3 surfaces and react-native-paper defaults; SaaS-cream landing-page templates with off-white backgrounds and gradient blob heroes; crypto-casino / Pump.fun aesthetics (neon green on black, candy gradients, animated coins); Polymarket's white-blue percentage-bar visual language; Phantom-style purple-gradient wallet glassmorphism; and Material You dynamic theming that bends brand color to the device wallpaper.

**Key Characteristics:**

- Dark-first. Amber on near-black. Light theme is accessibility, not the canonical surface.
- Committed color strategy: one signal hue carries every meaningful screen.
- Tabular mono numerics. SKR amounts, hashes, and percentages never jitter.
- Tonal layering instead of shadows. Depth comes from charcoal-vs-graphite-vs-coal lifts.
- No card grids. Each screen states one thing loudly, supports it with a small number of decisive secondaries.
- Hardware (fingerprint, SGT, Seed Vault) is first-class typography and surface, never relegated to chips.

## 2. Colors

The palette has two moods: signal (amber, exclusively for value and primary action) and ash (a tonally-lifted family of warm-tinted neutrals that build the surface, the type, and the borders).

### Primary

- **Signal Amber** (`#E27726`, oklch ≈ 72 % 0.18 60): the project's only saturated color. Used for the primary CTA, the verified-personhood state, the live pool balance, the "your bet won" trophy chip, the biometric pulse halo. **Reserved for value.** Never decoration, never section dividers, never icon fills outside a value context.
- **Signal Amber Deep** (`#B85F1B`): pressed / active state for primary surfaces; a 1-step tonal compression of the primary.
- **Signal Amber Quiet** (`#7A4A22`): disabled / unreachable amber; chroma drops and lightness drops together so the value reads as not-yet-available rather than as a faint accent on the surface.

### Secondary

This system has no decorative secondary color. The "second voice" is **state**, not decoration. Bet outcomes, error states, and successful claims live in the state palette below.

### Tertiary

Omitted by design. A tertiary accent would compete with Signal Amber and dilute the Committed strategy.

### Neutral (Ash family, tinted toward amber at chroma ≈ 0.005 to 0.008)

- **Ash Coal** (`#15110D`): the deepest layer. Modal scrim, the surface behind a hero block, status-bar and top-app-bar background.
- **Ash Graphite** (`#1F1A14`): canonical screen background. The default ground.
- **Ash Charcoal** (`#2A2520`): tonally-lifted surface. Where a card would be, this layer goes one step warmer instead.
- **Ash Line** (`#3A332C`): subtle divider and border. Always 1 dp; never thicker.
- **Ash Mist** (`#85786A`): tertiary / disabled text. Caption-level information.
- **Ash Fog** (`#B5A89A`): secondary text. Subtitles, supporting copy.
- **Ash Bone** (`#F2EDE5`): primary text on dark. The dominant text color. Never `#fff`.

### State (semantic only, never decoration)

- **State Kelp** (`#5B8A5E`, deep `#3F6643`, quiet `#2C3D2E`): YES bets, settled-yes outcome, success confirmations. A moss-green that is deliberately not Polymarket-green and not Cash-App-green.
- **State Terra** (`#A85C3F`, deep `#7C422C`, quiet `#4A2C20`): NO bets, settled-no outcome, declined biometric. A rust/terracotta that is deliberately not Robinhood-red.
- **State Error** (`#C04A2E`): genuine errors only (transaction failed, network unreachable). Slightly hotter than Terra so the two read as distinct.

### Light theme (a11y companion, not the canonical surface)

A near-symmetric inversion: Ash Bone becomes background, Ash Graphite becomes text, Signal Amber holds its hue but drops chroma slightly to retain WCAG AA on a near-white field. Hex values resolved during implementation.

### Named Rules

**The Amber Rule.** Signal Amber represents value. The pool balance, the primary action, the verified state, the won-bet trophy. If amber appears anywhere it is not stating a value, the design is wrong. No amber decoration, no amber dividers, no amber icon fills outside a value context.

**The No-Black Rule.** No `#000000`. No `#ffffff`. Every neutral is tinted toward amber at chroma ≈ 0.005 to 0.008. A RobinHoodie "black" is amber-tinted Ash Coal; a RobinHoodie "white" is warm Ash Bone.

**The State-Is-Information Rule.** Kelp, Terra, and Error never appear as decoration. Each one means a specific thing: outcome, declined, failed. If a screen has a kelp accent that does not stand for "this resolved YES," delete it.

## 3. Typography

**Display / Body / Label Font:** **Inter** (variable, 400 / 500 / 600), bundled via `@expo-google-fonts/inter`. One family carries headings, buttons, labels, and body across the app. System fallback stack: `Inter, system-ui, sans-serif`.

**Numeric / Hash Font:** **JetBrains Mono** (400 / 500), bundled via `@expo-google-fonts/jetbrains-mono`. Used for SKR amounts, percentages, epoch counters, transaction hashes, addresses. Fallback: `JetBrainsMono, ui-monospace`.

**Character:** the sans is technical, restrained, slightly compressed in the heavier weights. The mono is mature and round-ish, not stencil-sharp; it must coexist with the sans without screaming "code editor." Together they read as money-app meets settlement-receipt: declarative, factual, dry.

### Hierarchy

- **Display** (semibold, ~56 dp, line-height 1.0, letter-spacing -0.02 em): the hero pool balance, the won-bet amount, the screen-anchor moment. One per screen, sometimes zero.
- **Headline** (semibold, ~36 dp, line-height 1.05, letter-spacing -0.015 em): screen titles ("Markets", "Personhood", "Verified").
- **Title** (semibold, ~22 dp, line-height 1.2, letter-spacing -0.005 em): block headings within a screen.
- **Body** (regular, ~15 dp, line-height 1.5): supporting paragraphs, descriptions. Cap prose at 65 to 75 ch where prose appears.
- **Label** (medium, ~12 dp, letter-spacing 0.06 em, uppercase): eyebrow labels above values, button text, status pills. Used sparingly.
- **Numeric Display** (mono medium, tabular, ~56 dp): pool balance, won-bet amount, epoch counter. Tabular figures (`tnum` / fixed-pitch) are non-negotiable. The number must not jitter.
- **Numeric Body** (mono regular, tabular, ~15 dp): SKR amounts inline, tx hashes, addresses, timestamps.

### Named Rules

**The Tabular Rule.** Every digit that represents a value uses the mono family with tabular figures. SKR amounts, percentages, epoch numbers, lamport counts, slot heights, market IDs. A jittering counter is a craft failure and an accessibility failure.

**The One Voice Rule.** One sans family across the whole app. No display serif, no editorial pairing, no accent typeface. Hierarchy is built from weight (regular vs semibold) and scale (1.4 ratio between steps), never from a second voice.

**The Sans-For-Words Rule.** Words live in the sans. Numbers live in the mono. A hash address (mostly hex digits) lives in the mono. A button label ("Place Bet") lives in the sans. When the two meet inline ("0.098 SKR on YES"), the SKR amount is mono and the rest is sans.

## 4. Elevation

RobinHoodie does not use shadows. The system is **flat with tonal layering**: depth comes from a small set of progressively-lifted neutrals (Ash Coal, Ash Graphite, Ash Charcoal) rather than from drop-shadows or blur. Modal sheets and elevated surfaces shift one tonal step warmer; they do not float on a shadow.

The two reasons: shadows on a near-black surface look muddy at best and Material at worst; and tonal layering reads correctly under the dark-first OLED context where shadows fight the panel's own black point.

### Shadow Vocabulary

None. Any `box-shadow` other than focus-ring or biometric-pulse halo is wrong.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth is a tonal step, not a shadow. The only sanctioned shadow-like effects are (a) the biometric-pulse halo on the active fingerprint moment, and (b) the focus ring on keyboard focus, both expressed as a 1 to 2 dp soft glow in Signal Amber Quiet at low alpha.

**The Glassmorphism Ban.** No `backdrop-filter: blur` on surfaces by default. The Seeker's OLED handles solid color better than blurred translucency; glass surfaces here read as Phantom-wallet-adjacent, which is a named anti-reference.

## 5. Components

Each component leads with a one-line character description. Exact dp values, transition durations, and CSS / RN snippets resolved during implementation.

### Primary Action Button

The marquee's call-to-action; amber, large, square-rounded, declarative.

- **Shape:** generously rounded (`rounded.lg`, target ≈ 28 to 32 dp). Closer to a Cash-App pill than a Material chip.
- **Primary state:** Signal Amber background, Ash Coal text, semibold sans label, ~16 dp internal vertical padding, full screen-width on the action surface or 80 % when paired.
- **Pressed:** Signal Amber Deep background, no scale change, 100 ms ease-out transition.
- **Disabled:** Signal Amber Quiet background, Ash Mist text, no opacity hack.
- **Loading:** label fades to 50 %, mono progress glyph (tabular dot ellipsis) appears; no centered spinner.

### Ghost / Secondary Button

Used sparingly; amber is the voice of action, ghost is the voice of "you can also."

- **Shape:** same `rounded.lg`.
- **Background:** transparent on Ash Graphite, 1 dp Ash Line border.
- **Text:** Ash Bone, semibold sans.
- **Pressed:** background lifts to Ash Charcoal; border stays.

### Hero Value Block

The signature component. Replaces the Card-with-icon-and-heading pattern across the app.

- **Layout:** full-width block on Ash Graphite, no border, no shadow, 32 dp top + bottom padding, 24 dp horizontal.
- **Eyebrow Label:** small uppercase Label in Ash Fog ("UBI POOL", "YOUR STAKE", "EPOCH 5927174").
- **Value:** Numeric Display in Signal Amber, tabular mono, bottom-aligned to a generous baseline.
- **Caption:** optional Body line in Ash Fog beneath ("auto-credited at next epoch", "claim opens in 2 min 14 s").
- **No card chrome.** No border, no rounded box. The block is a typographic event, not a container.

### Status Surface (replaces Material Chip for first-class states)

For Personhood, SGT-detected, Verified, Geo-fence-matched. Hardware states earn a full block, not a chip.

- **Layout:** half-width or full-width block on Ash Charcoal, 20 dp internal padding, `rounded.md` (≈ 20 dp).
- **Iconography:** monochromatic line glyph in Ash Bone or Signal Amber (state-dependent), 20 dp.
- **Label:** Title-scale sans, the state stated as a fact ("Verified", "SGT detected", "Geo-fence: in range").
- **Sub-label:** Body in Ash Fog, optional metadata ("Seeker 7f6N…X7iY", "10-year attestation").

### Inline Status Chip (legacy, low-stakes only)

When a status is genuinely incidental (filters, sort options, secondary tags), a chip is allowed.

- **Shape:** `rounded.sm` (≈ 8 dp).
- **Background:** Ash Charcoal; selected = Signal Amber; never a full-saturation YES/NO chip outside the bet button.
- **Text:** Label-scale sans.

### Bet Button (YES / NO)

The defining decision; two equal blocks, opposing semantic colors, no chrome between them.

- **Layout:** full-width row, 50 / 50 split, 4 dp gutter.
- **YES:** State Kelp background, Ash Coal text, mono SKR amount, sans verb. Pressed lifts to a deeper kelp.
- **NO:** State Terra background, Ash Coal text, mono SKR amount, sans verb. Pressed lifts to a deeper terra.
- **Selected:** the chosen side stays at full saturation; the other fades to its own quiet variant.
- **Per-side amount:** mono tabular, large, top-aligned in the block.

### Biometric Surface

The verify / claim moment. The user-visible proof that a real human is at the device.

- **Layout:** centered, full-screen-width vertical block, Ash Graphite background, no border.
- **Center glyph:** large fingerprint glyph, ~96 dp, in Ash Bone at rest, animating to Signal Amber on activation with a soft halo (1 to 2 dp Amber Quiet glow).
- **Pulse:** 800 ms ease-out-quart loop while waiting for sensor. Honors `prefers-reduced-motion`: glow becomes static when reduced motion is set.
- **Caption:** Title-scale sans below ("Hold to sign", "Touch fingerprint to register").
- **Sub-caption:** mono Numeric Body line stating the on-chain action ("register_verification", "claim_ubi", "place_bet").

### Hash / Address Display

Tx hashes and Solana pubkeys appear constantly. They earn their own treatment.

- **Format:** `7f6N…X7iY` (4 + ellipsis + 4) by default; full hash on press-to-reveal.
- **Type:** mono Body in Ash Fog.
- **Affordance:** tap copies; subtle Ash Charcoal background flash on copy, label briefly switches to "copied".

### Top App Bar (navigation)

Minimal. The screen is the marquee, not the chrome.

- **Layout:** 56 dp tall, Ash Coal background (one step deeper than the screen), no border.
- **Title:** Title-scale sans in Ash Bone, left-aligned.
- **Right slot:** at most one icon (settings or wallet); no overflow menu.
- **Bottom tabs (if present):** monochromatic Ash Mist line glyphs; selected tab uses Signal Amber and a 2 dp Amber bar above the label.

## 6. Do's and Don'ts

### Do:

- **Do** treat Signal Amber as a value indicator, exclusively. Pool balances, primary actions, verified states, won-bet amounts.
- **Do** use tabular mono figures (`tnum`) for every digit that represents a value; SKR amounts and hashes must never jitter.
- **Do** use tonal layering (Ash Coal, Graphite, Charcoal) to convey depth; flat at rest, one tonal step on lift.
- **Do** give Personhood, SGT-detected, and Verified states a full Status Surface block, not a chip.
- **Do** put the primary action where a Seeker thumb lands one-handed; bottom-anchored on every action screen.
- **Do** state on-chain verbs in mono in the biometric caption (`register_verification`, `claim_ubi`, `place_bet`); the user is signing a fact, name the fact.
- **Do** respect `prefers-reduced-motion`; biometric pulse and pool counter ticks have non-animated equivalents that preserve meaning.

### Don't:

- **Don't** ship react-native-paper MD3 surfaces, neutral purples, or default Material chips. The current scaffold is the anti-reference.
- **Don't** drop SaaS-cream landing-page tropes into the app: off-white backgrounds, gradient blob heroes, soft drop-shadows, three-column feature cards, Inter on cream.
- **Don't** drift into crypto-casino aesthetics: no neon-on-black, no animated coin glyphs, no candy gradients, no Pump.fun-hype copy. Bold is not degen-neon.
- **Don't** clone Polymarket's white + blue + percentage-bar language by reflex. Different category, different commitments.
- **Don't** reach for Phantom / Solflare visual cues: purple gradients, glassmorphism cards, gradient text. The Glassmorphism Ban applies.
- **Don't** use `box-shadow` on surfaces. Depth is tonal, not shadowed. The only sanctioned glow is biometric pulse and focus ring.
- **Don't** use `border-left` greater than 1 dp as a colored stripe on cards, list items, or alerts. The shared absolute ban applies; replace with full borders, leading numbers, or nothing.
- **Don't** apply `background-clip: text` with a gradient. Emphasis comes from weight or size, never gradient text.
- **Don't** stack identical card grids of icon-plus-heading-plus-text. The Monolith Rule replaces them with one big block per screen.
- **Don't** open a modal as the first thought. Inline progressive disclosure first; modal only when the action genuinely interrupts the task.
- **Don't** put a display-scale value in anything other than the mono numeric family. A display-scale word is a Headline; a display-scale number is a Numeric Display.
- **Don't** use `#000000` or `#ffffff`. Every neutral is amber-tinted at chroma ≈ 0.005 to 0.008.
- **Don't** let Material You / dynamic color override the brand palette. The amber is a commitment, not a wallpaper accident.
