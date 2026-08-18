# magicelklabs.com

## What this is

The public website of Magicelk Labs, a one-person studio selling focused,
native Mac apps. Static HTML on GitHub Pages (custom domain magicelklabs.com),
zero build step except `viaduct/extensions/build.js`.

## Register

Brand / marketing. Design IS the product here: the site must sell $9–$19
one-time utilities to design-conscious Mac users. Pages: studio landing (`/`),
two product pages (`/spyglass/`, `/viaduct/`), 20 SEO extension guides
+ hub (`/viaduct/extensions/`), privacy pages.

## Audience

Mac users who care how software looks and feels; developers and power users
(Viaduct), Google Workspace users on macOS (Spyglass).

## Conversion paths

- Viaduct: Gumroad buy buttons (`data-gumroad-action="buy"`, product `uadrjp`).
  Landing is also embedded in Gumroad's iframe; do not break the postMessage wiring.
- Spyglass: Gumroad link + free GitHub download.

## Constraints

- Static, no framework, no bundler. Tailwind CDN already on product pages.
- Keep URL slugs, anchor IDs (`#how`, `#features`, `#pricing`, `#faq`, `#get`),
  and Gumroad attributes stable.
- Design system lives in DESIGN.md (editorial studio: Newsreader display serif,
  brass/teal accents, hairline rules, no glass/glow decoration).
