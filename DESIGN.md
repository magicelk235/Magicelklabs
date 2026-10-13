# Magicelk Labs — Design System

The brand and visual rules for magicelklabs.com. Follow this when editing any
page under this site. The voice is **built, precise, structural** (the studio
sells small engineered tools; Viaduct is literally named after a bridge).

## Name

Always **Magicelk Labs** — "Magicelk" is one word, capital M. Never "Magic Elk",
"MagicElk", or "magicelk labs".

Individual apps keep their own casing: **Spyglass**, **Viaduct**, **Lector**.

## Typography

- **Display (h1, h2, numerals, wordmarks):** Cabinet Grotesk (Fontshare CDN,
  weights 500/700/800). Headings weight 800, `letter-spacing:-.02em` to
  `-.025em`. No italics anywhere (the family has none; synthesized italics are
  banned).
- **Body / UI:** Inter on the root page, Viaduct, and the extensions pages;
  system stack (SF Pro) on Spyglass. h3 and smaller stay in the body
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

The product pages tint the canvas toward their own accent so it reads as
lit rather than stuck on: Viaduct `#070908` (green-black) under teal
`#2DD4BF`, Spyglass `#0A0908` (brown-black) under brass `#D9B679`, Lector
`#0C0808` (maroon-black) under lectern red `#C0544F`, with `#E58A82` for red
text (the accent itself is 4.4:1 on the canvas) and vellum `#F8EAD2` ink.

The house page carries no accent at all, and that is the point. It is a shelf:
every app already has cover art, the covers hold all the colour, and the room
around them stays out of the way. Grey-black canvas `#0B0B0C`, surface
`#131315`, ivory `#F5F5F4`, hairlines at 8% white, and nothing else. Links,
buttons, and the mark are ivory. Adding an app adds a cover, so it adds
colour without touching the theme.

**Committed color, not timid accents.** Viaduct's brand surfaces are drenched
in deep teal (`linear-gradient(168deg,#0F4D48,#093732)`, the `--band-top` /
`--band-bot` pair in `viaduct/assets/viaduct.css`). It floods the store act
the moment the install button flips, and carries the Pro pricing panel. The
rest of the page stays on the green-black canvas, so the flood is the one
colour event on the page. Spyglass keeps its own teal band
(`--teal-top`/`--teal-bot`) with brass CTAs. On-band text: near-white ink
`#F2FBF9`, body `#C6E3DE`, dim `#93C2BB`, bright accent `#6EE0D1`; on-band
primary buttons are white with dark-teal text.

One accent per page. Dark is the only mode the site has: tokens are declared
once in `:root` with `color-scheme:dark`, there is no light palette to override
and no `.dark` class to gate it. Anything that adapts to the reader's colour
scheme is a bug.

## Signature moves

- **Ruled structure.** Sections are organized by hairline rules: ledger-style
  feature rows (title 4-col / body 8-col), stat rows split by vertical rules,
  numbered columns.
- **Bare numerals.** Process steps use large bare Cabinet Grotesk numerals in
  the accent color, and index rows use small mono numbers. Never numbers
  inside circles or chips.
- **No closing band.** Product pages end on the FAQ, then the other apps, then
  the footer. The closing CTA band each page used to have (centered headline,
  Download and Buy) was cut: it repeated the hero's buttons, and the nav pill
  keeps Buy in reach at every scroll position. Do not add one back. The house
  page ends on the shelf.
- **Ported ambients, not decoration.** WebGL backgrounds are lifted from React
  Bits onto plain WebGL (no React, no ogl): one fullscreen triangle and one
  fragment program, recoloured to the page's own palette, parked by an
  IntersectionObserver whenever the section is off screen or the tab is in the
  background. Viaduct runs SideRays in the hero; the root page runs Threads in
  ivory at half opacity; Lector runs LightRays. None of them follows the
  cursor. The hero is something you read past, so the field drifts on its
  own clock and ignores the pointer.
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

- Content column: `max-width:1120px` (root), `1080px` (the legal pages), or
  `max-w-6xl` (product pages); 24px side padding.
- Root: a headline, one line under it, and the shelf. Nothing else. Every
  other block that has been tried here (stat ledger, fact rail, tenet list,
  approach paragraph, closing CTA band) restated the pricing or the pitch a
  second time and was cut. The whole page is 84 words.
- Section headers: left-aligned h2, optional hairline `border-top` rule above.

### The shelf

Apps are shown as cover art, two across and one across under 820px. Each cover
is a 1200x630 webp in `assets/<app>-cover.webp`, encoded from the media-kit PNG
with `cwebp -q 86`. Under each cover sits the app name and one sentence, and
nothing else. No index number, no price: the covers are the index, and the
price belongs on the product page where you can act on it.

To add an app, copy one `<a class="book">` and change the cover, the name, the
sentence, and the href. Nothing else. The grid reflows on its own.

### More from Magicelk Labs

Each product page ends with the other apps as shelf covers, between the FAQ
and the footer, so a visitor on one app can find the rest.
`assets/footer.js` renders it when the script tag carries `data-more="1"`,
from its own `APPS` list minus the app named by `data-product`. Same cover,
name and sentence as the shelf; hover is a 2px lift. Legal pages and the
extension guides do not carry it. A new app is one entry in `APPS` plus one
`<a class="book">` on the root shelf. The footer's "Magicelk Labs" links home.

## Motion

Spyglass and the root page run Apple-grade scroll choreography via GSAP 3.13
(+ ScrollTrigger + SplitText, jsDelivr CDN) driven by the shared runtime
**`/assets/motion.js`**. Pages opt elements in with data attributes:

- `data-mm="lines"` masked line-by-line headline reveal (SplitText);
  `data-mm="rise" / "fade" / "media"` for blocks and screenshots;
  `data-mm-load` runs at load (above the fold), otherwise on scroll-enter.
- `data-mm-stagger` staggers direct children; `data-mm-parallax` slow drift;
  `data-mm-counter` count-up numerals.
- `data-mm-replay` on a section: entrances inside re-run every time it
  scrolls back into view; default is once.
- `data-mm-pin` + `data-mm-pin-stage/-item/-panel`: pinned walkthroughs
  (Spyglass's file-type gallery). Pin engages only ≥1024px + fine pointer;
  below that the CSS fallback is a static stack with per-panel captions.

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

Lector and Viaduct do not use motion.js. Their scroll acts run on the
scroll-craft engine, copied into each app's `assets/scrollcraft.{css,js}` and
never edited; each page's own choreography is in its own
`assets/<app>.{css,js}`. The engine publishes each act's progress as `--sc-p`
and the pages drive their bespoke moves from that in CSS.

Lector: clips scrubbed by the wheel, the pinned example drum, the keycap
pause. Its hero lamp is React Bits' LightRays ported to plain WebGL, and its
headline arrives in Japanese and scrambles into English letter by letter.
Cabinet Grotesk is self-hosted there (`lector/assets/fonts/`).

Viaduct follows one real extension, Dark Reader, through the page:

- **Hero:** a centred headline under SideRays (React Bits, plain WebGL, in
  `viaduct.js`), Download and Get Pro. No product imagery; a layered
  two-screenshot hero was tried and rejected.
- **The store act (`#how`, pinned, the page's peak):** the real Dark Reader
  listing, captured from headless Chrome, which gets the same "Switch to
  Chrome?" card, banner and disabled button that Safari does. The capture is
  cut into planes: header, banner, listing, and the card. The install button
  is markup over the space the capture left empty. The card is dismissed, the
  button lifts out of the page, its word rolls from Chrome to Safari letter by
  letter, the teal band floods in, the button settles back, and then the
  banner fades and the listing (with the button) moves up into its place,
  because with Viaduct installed the page has nothing to nag about. All of it
  is CSS keyed off `--sc-p`; the timings are listed at the top of the `.flip`
  block in `viaduct.css`. `viaduct.js` measures where the lifted button
  travels to and each word's width, so the label stays centred while the
  cell narrows from "Chrome" to "Safari".

- **The install (after the store act, scrubbed):** the media kit's
  `viaduct-install-from-chrome-web-store.mp4`, scrubbed by the wheel: Add to
  Safari clicked, the build, "Installed", Remove from Safari, Dark Reader's
  popup. A scrub clip plays across the stage's whole time on screen, so the
  clip holds its first frame 3.3s and its last 4.4s longer than the
  recording; with `data-sc-span="3"` that puts the click at the start of the
  pin (p ≈ 0.05) and the popup near its end (p ≈ 0.89), and the captions are
  keyed to those moments. Change the span and the holds have to be redone.
- **Compatibility:** each break is struck through and answered as its row
  enters the viewport (`data-sc-in`).
- **Now try yours (`#try`):** the reader drops a .crx, a .zip or a folder
  (onto the plate, in any state) or picks one of six sample extensions beside
  it. `viaduct/assets/inspect.js` reads a dropped package in memory (ZIP
  central directory, CRX2/3 headers, `DecompressionStream`); the samples were
  read by the same script ahead of time, because the page can't fetch from
  the Web Store (`viaduct/assets/samples/`, see the README). The plate shows
  the listing, flips its button the same way, then four counts (permissions,
  site access, Chrome APIs, files) and the names behind them as tags, long
  lists cut short with a "+N more" button, and anything Viaduct will patch.
  Nothing is uploaded.
- **Features:** the heading sticks while the numbered rows scroll past it.
  The grid must stretch its items (no `align-items: start`), or the sticky
  heading's container is no taller than the heading and it never moves.

Under reduced motion the hero rays are off, the flip still happens as a
crossfade (colour, band and word change with scroll; nothing travels), the
listing moves up in one step rather than sliding, and the install clip never
loads: its still is the last frame, with the popup open.

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
`.crx`, or unpacked folder; Viaduct converts, signs, and installs it into
Safari. Runs in Safari's own engine (keeps battery life). Free for 2
conversions, then $19 one-time (unlimited + auto-resigning). macOS 13+. Beta.

**Lector** — Copy or translate any text on your Mac's screen. ⌘⇧2 copies the
text under a crosshair; ⌘⇧1 paints the translation over the original, in
place. Reads Latin, CJK, Cyrillic plus Hebrew, Arabic, the Indic scripts and
more (Apple Vision + bundled Tesseract); translates on the Mac (Apple
Translation + offline Opus-MT packs). Free: 100 grabs and 10 translations a
month. Text $9 one-time (unlimited grabs, 30 translations/month). Translate
$15 one-time (unlimited, plus live translation in beta). Upgrade $6. macOS 15+.

## Assets

- `spyglass/assets/spyglass-appicon-dark-320.png` — Spyglass icon.
- `viaduct/assets/viaduct-icon-dark.png` — Viaduct icon (256px, web).
- `lector/assets/lector-appicon-dark-320.png` — Lector icon (favicon, touch
  icon, manifest); `lector/assets/lector-mark.png` is the lectern alone, for
  the nav pill.
- `assets/spyglass-cover.webp`, `assets/viaduct-cover.webp` and
  `assets/lector-cover.webp` (1200×630) are the shelf covers on the root page, encoded from the media-kit social cards
  with `cwebp -q 86`. A new app needs one at the same size.
- **The mark** is an elk rack rising from a single stem: two beams sweeping up
  and outward, five prongs a side, joined at one point above a short stem. No
  letterform, deliberately. An `M` sitting 9px from the word "Magicelk Labs"
  says the same thing twice; a crest beside the wordmark is a lockup. It ships
  as a 44-vertex polygon, mirror-symmetric to the coordinate, and carries no
  rounded-tile container anywhere we draw one.
  - `assets/mark.svg` — ivory, containerless. The nav pill and any in-page use.
  - `assets/favicon.svg` — same path over the page canvas baked in as a field,
    so the icon still reads on a light tab bar. For `<link rel="icon">`
    **only**: in a page the field would sit as a square behind the nav pill.
  - `assets/touch-icon.svg` → `assets/favicon.png` (512×512) for
    `apple-touch-icon`. Full bleed with square corners and the rack inset to
    76%: iOS applies its own rounded mask, so drawing one here double-rounds it,
    and the field is baked in the same way.
  - The rack needs roughly 28px to read. That is why the nav glyph is 28 and not
    the 22 it was built at. At 16px it is a texture rather than a legible rack,
    which is true of any mark at that size.
- Media-kit screenshots (source: Google Drive → "My Drive/media kits", mounted
  locally) converted with `cwebp -q 82 -resize 1800 0`. Every shot is captured
  with the app in dark mode; the `-dark` suffix is history, there is no second
  variant to swap to.
  - `spyglass/assets/spyglass-shot-{docs,sheets,slides,drawings}-dark.webp`
    (1800×1474) and `spyglass-menubar-dark.webp` (1400×1567).
  - `viaduct/assets/viaduct-{main,developer}-dark.webp` and
    `viaduct-step-{select,convert,succeed}-dark.webp` (1800×1324).
    `viaduct-main-dark.webp` is the exception: re-encoded at 1400×848, cropped
    to the window rect and trimmed below the Choose extension button, because
    the app's own empty space below it was half the height of the slot.
  - `viaduct/assets/viaduct-store-install.mp4` (900×614) + poster: the old
    uncut Chrome-Web-Store-to-Safari install capture. Not on the page: the
    store and the app have both changed since it was recorded.
  - `viaduct/assets/viaduct-install.mp4` (1440×810) and `-m.mp4` (854×480):
    the media kit's `videos/viaduct-install-from-chrome-web-store.mp4`, padded
    and encoded for scrubbing at 20fps, no audio:
    `ffmpeg -i <src> -an -vf "tpad=start_mode=clone:start_duration=3.3:stop_mode=clone:stop_duration=4.4,fps=20,scale=1440:810:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -tune stillimage -crf 25 -g 10 -keyint_min 10 -sc_threshold 0 -movflags +faststart viaduct-install.mp4`
    (phone: `scale=854:480`, `-crf 27 -g 8 -keyint_min 8`).
    `viaduct-install-poster.webp` and `viaduct-install-end.webp` are its first
    and last frames.
  - `viaduct/assets/viaduct-store-{top,banner,body}.webp` (2800 wide),
    `viaduct-store-listing-m.webp` (1136×362, the title block for phones) and
    `viaduct-store-nag.webp` (696×437): the Dark Reader listing on the Chrome
    Web Store, captured at 1440×900 @2x in headless Chrome, which the store
    treats like Safari, with the card and the install button hidden. `top` and
    `banner` are rows 0-224 and 224-480 of that shot; `body` is rows 224-1160
    of a second shot with the banner removed from layout, so the listing in it
    sits 128 CSS px higher. The card is cut from a third shot at its own box.
    Every position in the `.flip` CSS (plane offsets, the 128px shift, the
    button and the card) is in units of that 1400px-wide crop, so a re-capture
    has to re-measure them.
  - `spyglass/assets/spyglass-demo-1440.{webm,mp4}` (1440×1060) is the Finder
    screen recording. Cut its poster straight out of the encode at the same
    size — `ffmpeg -ss 3 -i spyglass-demo-1440.mp4 -frames:v 1 frame.png`, then
    `cwebp -q 82` — so the tile and the first played frame share one ratio and
    one composition. A poster from another capture, or trimmed to a different
    height, shows up as a cropped still that jumps the moment playback starts.

## Build

Static, zero build step, except `viaduct/extensions/build.js` which generates
the 20 extension guides + hub + sitemap: `node build.js` after editing it.
