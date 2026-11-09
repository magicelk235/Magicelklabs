# magicelklabs.com

## What this is

The public website of Magicelk Labs, a one-person studio selling focused,
native Mac apps. Static HTML on GitHub Pages (custom domain magicelklabs.com),
zero build step except `viaduct/extensions/build.js`.

## Register

Brand / marketing. Design IS the product here: the site must sell $9–$29
one-time utilities, plus Spyglass's optional Spyglass Drive subscription, to
design-conscious Mac users. Pages: studio landing (`/`),
three product pages (`/spyglass/`, `/viaduct/`, `/lector/`), 29 SEO extension guides
+ hub (`/viaduct/extensions/`), 6 topic guides (`/viaduct/guides/`), privacy pages.

## Audience

Mac users who care how software looks and feels; developers and power users
(Viaduct, and Spyglass's format previews), Google Drive users on macOS
(Spyglass's Drive plan), people who keep hitting text on their Mac's screen
they can't select or read (Lector).

## Conversion paths

- Viaduct: free GitHub download, and three Polar checkout links, one product
  each, that open Polar's own checkout page (no embed): Safari ($19), Firefox ($19)
  and Mixed ($29, both browsers). Each carries `data-product="Viaduct Safari"`
  (or `Viaduct Firefox`, `Viaduct Mixed`), which `analytics.js` reports as the
  Buy event's product. Nav, hero and footer Buy links go to `/viaduct/#pricing`.
  Viaduct Pro keys bought on Gumroad still activate and count as Mixed.
- Spyglass: free GitHub download (every format free for 7 days); Get Pro
  ($12 once) and Get Drive ($4/month, 7-day trial) each open their own Polar
  checkout link as Polar's embedded checkout, set up the same way as Lector's
  below. Gumroad keys bought before the move still activate.
- Lector: free GitHub download; Buy Text, Buy Translate and the $6 Text to
  Translate upgrade each open their own Polar checkout link
  (`buy.polar.sh/polar_cl_…`, one product each) as Polar's embedded checkout:
  the links carry `data-polar-checkout` (dark theme) and the page loads the
  pinned `/assets/polar-checkout-0.6.0.js`, so checkout opens in an overlay on
  the page. Its CSP allows `frame-src https://buy.polar.sh https://polar.sh`,
  and the host must stay under Polar's Settings › Embedding (magicelklabs.com
  and localhost:4610 are listed). The plain Buy buttons scroll to the pricing
  cards. Gumroad keys bought before the move still activate.
- Gumroad checkout is Gumroad's own page, full tab. Don't frame it (modal/iframe):
  Gumroad rejects paid orders without its `_gumroad_guid` cookie, which Safari,
  iOS browsers, Brave and Chrome incognito block in a third-party frame.
- Attribution: `/assets/attribution.js` (on every page, so a tag on the landing
  page survives the click through to a product page) remembers where the visit
  came from for the session (`?ref=macapp.supply`, `?utm_*`, or another site's
  referrer) and adds it to every Gumroad link as `referrer=https://macapp.supply/`
  (what Gumroad's Referrers table shows) plus `utm_source`/`utm_medium`/
  `utm_campaign` (Gumroad's UTM links need all three; defaults `referral` /
  `magicelklabs`). Polar checkout links get the same `utm_*` tags, which Polar
  keeps in the order's metadata; with no tag, the referrer's host is the source.
- Analytics: Umami Cloud via `/assets/analytics.js` (cookieless, no consent
  banner). Page views and sources come from Umami itself; the script adds
  `Buy` (Gumroad `/l/` links and Polar checkout links, named by the link's
  `data-product` or else its `POLAR_CHECKOUTS` table) and `Download` (GitHub release links) events
  with a `product` property. The privacy pages disclose it under "This website".

## Constraints

- Static, no framework, no bundler. Tailwind CDN already on product pages.
- Keep URL slugs, anchor IDs (`#how`, `#features`, `#pricing`, `#faq`, `#get`),
  and checkout attributes (`data-gumroad-*`, `data-polar-checkout`,
  `data-product`) stable.
- Design system lives in DESIGN.md (editorial studio: Newsreader display serif,
  brass/teal accents, hairline rules, no glass/glow decoration).
