# magicelklabs.com

## What this is

The public website of Magicelk Labs, a one-person studio selling focused,
native Mac apps. Static HTML on GitHub Pages (custom domain magicelklabs.com),
zero build step except `viaduct/extensions/build.js`.

## Register

Brand / marketing. Design IS the product here: the site must sell $9–$19
one-time utilities to design-conscious Mac users. Pages: studio landing (`/`),
three product pages (`/spyglass/`, `/viaduct/`, `/lector/`), 20 SEO extension guides
+ hub (`/viaduct/extensions/`), privacy pages.

## Audience

Mac users who care how software looks and feels; developers and power users
(Viaduct), Google Workspace users on macOS (Spyglass), people who keep hitting
text on their Mac's screen they can't select or read (Lector).

## Conversion paths

- Viaduct: Gumroad buy buttons (`data-gumroad-action="buy"`, product `uadrjp`).
  Landing is also embedded in Gumroad's iframe; do not break the postMessage wiring.
- Spyglass: Gumroad link + free GitHub download.
- Lector: free GitHub download; Buy Text and Buy Translate go straight to
  checkout with the tier preselected (`?variant=Text|Translate&wanted=true`);
  the plain Buy buttons open the product page so Gumroad shows its tier picker;
  the Text to Translate upgrade is its own product (`lector-upgrade`).
- Checkout is Gumroad's own page, full tab. Don't frame it (modal/iframe):
  Gumroad rejects paid orders without its `_gumroad_guid` cookie, which Safari,
  iOS browsers, Brave and Chrome incognito block in a third-party frame.
- Attribution: `/assets/attribution.js` (on every page, so a tag on the landing
  page survives the click through to a product page) remembers where the visit
  came from for the session (`?ref=macapp.supply`, `?utm_*`, or another site's
  referrer) and adds it to every Gumroad link as `referrer=https://macapp.supply/`
  (what Gumroad's Referrers table shows) plus `utm_source`/`utm_medium`/
  `utm_campaign` (Gumroad's UTM links need all three; defaults `referral` /
  `magicelklabs`).
- Analytics: Umami Cloud via `/assets/analytics.js` (cookieless, no consent
  banner). Page views and sources come from Umami itself; the script adds
  `Buy` (Gumroad `/l/` links) and `Download` (GitHub release links) events
  with a `product` property. The privacy pages disclose it under "This website".

## Constraints

- Static, no framework, no bundler. Tailwind CDN already on product pages.
- Keep URL slugs, anchor IDs (`#how`, `#features`, `#pricing`, `#faq`, `#get`),
  and Gumroad attributes stable.
- Design system lives in DESIGN.md (editorial studio: Newsreader display serif,
  brass/teal accents, hairline rules, no glass/glow decoration).
