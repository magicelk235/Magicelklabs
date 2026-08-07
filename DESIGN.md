# Magicelk Labs — Design System

The brand and visual rules for magicelklabs.com. Follow this when editing any
page under this site. The voice is **built, precise, structural** (the studio
sells small engineered tools; Viaduct is literally named after a bridge).

## Name

Always **Magicelk Labs** — "Magicelk" is one word, capital M. Never "Magic Elk",
"MagicElk", or "magicelk labs".

Individual apps keep their own casing: **Spyglass**, **Viaduct**.

## Typography

- **Display (h1, h2, numerals, wordmarks):** Cabinet Grotesk (Fontshare CDN,
  weights 500/700/800). Headings weight 800, `letter-spacing:-.02em` to
  `-.025em`. No italics anywhere (the family has none; synthesized italics are
  banned).
- **Body / UI:** Inter on the root page, Viaduct, and the extensions pages;
  system stack (SF Pro) on Spyglass and about. h3 and smaller stay in the body
  family unless explicitly `font-display`.
- **Small caps / numerals / labels:** JetBrains Mono at 11–13px with
  `letter-spacing:.06em`–`.16em` for section labels, list numbers, and file
  extensions. Never for running text.
- Emphasis inside headings: color (brass or teal) + weight. Never a second
  family, never italic.

## Colors

Every page shares one construction: a near-black canvas, a surface ladder
(`--canvas` / `--surface` / `--elevated`, plus `--card` on the product pages),
hairlines at 7% white, and `--lip: inset 0 1px 0 rgba(255,255,255,.05)` on
every raised edge instead of a cast shadow.

The two product pages tint the canvas toward their own accent so it reads as
lit rather than stuck on: Viaduct `#070908` (green-black) under teal
`#2DD4BF`, Spyglass `#0A0908` (brown-black) under brass `#D9B679`.

The house page carries no accent at all, and that is the point. It is a shelf:
every app already has cover art, the covers hold all the colour, and the room
around them stays out of the way. Grey-black canvas `#0B0B0C`, surface
`#131315`, ivory `#F5F5F4`, hairlines at 8% white, and nothing else. Links,
buttons, and the favicon M are ivory. Adding an app adds a cover, so it adds
colour without touching the theme.

**Committed color, not timid accents.** Viaduct's brand surfaces are drenched
in deep teal (`linear-gradient(168deg,#0F4D48,#093732)` — the `.hero-band` /
`.pro-panel` / `.cta` gradient), identical in light and dark mode. It carries
the hero, the Pro pricing panel, and the closing CTA. Spyglass keeps its own
teal band (`--teal-top`/`--teal-bot`) with brass CTAs. On-band text: near-white
ink `#F2FBF9`, body `#C6E3DE`, dim `#93C2BB`, bright accent `#6EE0D1`; on-band
primary buttons are white with dark-teal text.

One accent per page. Every page ships dark only; the old light-mode toggles are
gone.

## Signature moves

- **Ruled structure.** Sections are organized by hairline rules: ledger-style
  feature rows (title 4-col / body 8-col), stat rows split by vertical rules,
  numbered columns.
- **Bare numerals.** Process steps use large bare Cabinet Grotesk numerals in
  the accent color, and index rows use small mono numbers. Never numbers
  inside circles or chips.
- **Band bookends.** Product pages open and close on a drenched brand band.
  The house page has none; it ends on the shelf.
- **Ported ambients, not decoration.** WebGL backgrounds are lifted from React
  Bits onto plain WebGL (no React, no ogl): one fullscreen triangle and one
  fragment program, recoloured to the page's own palette, parked by an
  IntersectionObserver whenever the section is off screen or the tab is in the
  background. Viaduct runs SideRays in the hero; the root page runs Threads in
  ivory at half opacity. Neither one follows the cursor. The hero is something
  you read past, so the field drifts on its own clock and ignores the pointer.
- **Glass nav pill.** Every page's nav is the same floating pill with the
  GlassSurface displacement map (`#nav-glass`), Chromium-gated behind
  `html.glassy`, plain `backdrop-filter: blur()` everywhere else.
- **Film grain.** `body::after` at roughly 3% opacity over the whole page, so
  large near-black areas do not band.

## Banned (AI tells — do not reintroduce)

- Gradient-stroke "glow" borders on cards (`.glow-*` masks).
- Radial glow blobs / "crown" halos behind heroes.
- Glassmorphism frames as decoration. The nav pill is the only sanctioned
  backdrop-filter surface.
- Icon-in-rounded-tile bento grids; identical card grids.
- Progress bars with filled tracks as marketing viz.
- Traffic-light dots on fake windows/terminals.
- Floating/looping decorative animation. Two exceptions, both ambient lighting
  rather than moving objects: the `data-mm-ambient` band drift and the ported
  WebGL hero fields.
- Em dashes in visible copy (titles/og tags exempt).
- Italic display type; serif display type.

## Layout

- Content column: `max-width:1120px` (root), `1080px` (about and the legal
  pages), or `max-w-6xl` (product pages); 24px side padding.
- Root: a headline, one line under it, and the shelf. Nothing else. Every
  other block that has been tried here (stat ledger, fact rail, tenet list,
  approach paragraph, closing CTA band) restated the pricing or the pitch a
  second time and was cut. The whole page is 84 words.
- About: left-aligned hero, 4fr/8fr side-label grid, hairline-ruled rows.
- Section headers: left-aligned h2, optional hairline `border-top` rule above.
  Centered composition is reserved for band CTAs on the product pages.

### The shelf

Apps are shown as cover art, two across and one across under 820px. Each cover
is a 1200x630 webp in `assets/<app>-cover.webp`, encoded from the media-kit PNG
with `cwebp -q 86`. Under each cover sits the app name and one sentence, and
nothing else. No index number, no price: the covers are the index, and the
price belongs on the product page where you can act on it.

To add an app, copy one `<a class="book">` and change the cover, the name, the
sentence, and the href. Nothing else. The grid reflows on its own.

## Motion

Apple-grade scroll choreography via GSAP 3.13 (+ ScrollTrigger + SplitText,
jsDelivr CDN) driven by the shared runtime **`/assets/motion.js`**. Pages opt
elements in with data attributes:

- `data-mm="lines"` masked line-by-line headline reveal (SplitText);
  `data-mm="rise" / "fade" / "media"` for blocks and screenshots;
  `data-mm-load` runs at load (above the fold), otherwise on scroll-enter.
- `data-mm-stagger` staggers direct children; `data-mm-parallax` slow drift;
  `data-mm-counter` count-up numerals.
- `data-mm-replay` on a section: entrances inside re-run every time it
  scrolls back into view (used on Viaduct's compat layer); default is once.
- `data-mm-pin` + `data-mm-pin-stage/-item/-panel`: pinned walkthroughs
  (Viaduct's Drop → Convert → Done, Spyglass's file-type gallery). Pin engages
  only ≥1024px + fine pointer; below that the CSS fallback is a static stack
  with per-panel captions.

Continuous "premium" layer (all fine-pointer-gated, all dead under reduced
motion):

- **Lenis inertial scroll** (CDN, wired into GSAP's ticker; anchors route
  through `lenis.scrollTo`).
- `data-mm-ambient="teal|brass"`: two soft light orbs drift slowly inside
  brand bands. This is the ONE sanctioned looping animation; it is band
  luminance, not floating decoration. Keep opacity ≤ .15.
- `data-mm-scrub`: hero media settles smaller as it scrolls away (nest it
  inside the entrance element, never on the same node).
- `data-mm-tilt`: ±4.5° pointer tilt on framed media.
- `data-mm-magnet`: cursor-magnetic primary CTAs.
- `data-mm-spot="teal|brass"`: cursor spotlight wash on cards.
- `.mm-progress`: scroll-progress hairline (accent color), sitting under the
  nav on the product pages. The root page does not use it.

The Threads hero field lives in the root page's own inline script rather than
motion.js, because no other page uses it.

Safety contract: an inline head script adds `html.mm` (skipped under
`prefers-reduced-motion`) and CSS hides `[data-mm]` only under that class;
motion.js reveals everything, and a 2s failsafe strips the class if GSAP never
arrives. motion.js also neutralizes CSS `scroll-behavior:smooth` during
ScrollTrigger refresh, pauses Lenis while ScrollTrigger measures, and calls
`ScrollTrigger.sort()` before refresh (pins are created after entrance
triggers; without the sort, everything below a pin fires ~2000px early).
Re-refreshes on `load`.
Videos pause off-screen and gain controls (no autoplay/loop) under reduced
motion. Hover stays 1–2px lifts; no other decorative loops beyond the ambient
band light.

## App facts (source of truth: Google Drive media kits)

**Spyglass** — Real Quick Look previews for Google Workspace files on macOS.
Press Space on a `.gdoc` / `.gsheet` / `.gslides` / `.gdraw` / `.gform` /
`.gsite` and see the document, not raw JSON. Free tier: branded info cards,
offline, no sign-in. Paid: $12 one-time, rendered first-page previews.
macOS 14+.

**Viaduct** — Run Chrome extensions in Safari, natively. Drop in a `.zip`,
`.crx`, or Chrome Web Store link; Viaduct converts, signs, and installs it into
Safari. Runs in Safari's own engine (keeps battery life). Free for 2
conversions, then $19 one-time (unlimited + auto-resigning). macOS 13+. Beta.

## Assets

- `spyglass/assets/spyglass-appicon-{light,dark}-1024.png` — Spyglass icon.
- `viaduct/assets/viaduct-icon-{light,dark}.png` — Viaduct icon (256px, web).
- `assets/spyglass-cover.webp` and `assets/viaduct-cover.webp` (1200×630) are
  the shelf covers on the root page, encoded from the media-kit social cards
  with `cwebp -q 86`. A new app needs one at the same size.
- Use the light icon on dark surfaces and the dark icon on light surfaces.
- Media-kit screenshots (source: Google Drive → "My Drive/media kits", mounted
  locally) converted with `cwebp -q 82 -resize 1800 0`:
  - `spyglass/assets/spyglass-shot-{docs,sheets,slides,drawings}-{light,dark}.webp`
    (1800×1474) and `spyglass-menubar-{light,dark}.webp` (1400×1567).
  - `viaduct/assets/viaduct-{main,developer}-{light,dark}.webp` and
    `viaduct-step-{select,convert,succeed}-{light,dark}.webp` (1800×1324).
  - `viaduct/assets/viaduct-store-install.mp4` (1600w, ~1.9 MB) + poster: the
    full uncut Chrome-Web-Store-to-Safari install capture.
- Light/dark image pairs swap via Tailwind `block dark:hidden` /
  `hidden dark:block`; never add a bare `display:block` CSS rule on those imgs
  (it outranks Tailwind's `.hidden` and shows both variants at once).

## Build

Static, zero build step, except `viaduct/extensions/build.js` which generates
the 20 extension guides + hub + sitemap: `node build.js` after editing it.
