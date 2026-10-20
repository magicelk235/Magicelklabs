# Magicelk Labs

The website for Magicelk Labs, a one-person studio building native Mac apps. It's live at [magicelklabs.com](https://magicelklabs.com).

The site is static: hand-written HTML, no framework and no bundler. GitHub Pages serves it straight from `main`. The Spyglass page uses Tailwind, but it's compiled to a plain stylesheet ahead of time rather than loaded from the CDN, so no visitor waits on a script to build the CSS. The Viaduct and Lector pages use plain CSS on the scroll-craft engine (see DESIGN.md, Motion).

## The apps

- **Viaduct** converts Chrome extensions into native Safari ones.
- **Spyglass** gives Quick Look proper previews for Markdown, code, notebooks, archives, apps, Google Drive files and more.
- **Lector** copies or translates the text in any part of the Mac's screen.

## Structure

- `index.html` is the studio landing page.
- `spyglass/` holds the Spyglass product page and its legal pages (privacy, terms, license, security).
- `viaduct/` holds the Viaduct product page, its legal pages, and `viaduct/extensions/`, a set of SEO guide pages with a hub index (one page per popular Chrome extension).
- `lector/` holds the Lector product page and its legal pages.
- `assets/` holds the shared scripts (`motion.js`, `footer.js`, `attribution.js`, which tags Gumroad buy links with where the visitor came from, and `analytics.js`, which loads Umami and counts Buy and Download clicks), the favicons, the web manifest, and `assets/tailwind/`, which holds the Tailwind configs the product stylesheets are built from.
- `DESIGN.md` covers the brand and visual rules. Read it before editing any page.
- `PRODUCT.md` explains what the site is for and how it converts.

## Local preview

Editing a page needs no build step. Serve the folder with any static server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Generated files

Two things in the repo are generated, and each gets committed alongside the change that caused it.

### Extension guides and the sitemap

The guides under `viaduct/extensions/` come from a template. To change them, edit the `EXTENSIONS` list or the template in `viaduct/extensions/build.js`, then regenerate:

```
cd viaduct/extensions
node build.js
```

That writes a `<slug>/index.html` for each extension, the hub `index.html`, and `sitemap.xml` for the whole site. The sitemap is generated, so don't edit it by hand: each `lastmod` comes from the last commit that touched the page, which means regenerating the files doesn't tell crawlers the content changed.

### Viaduct sample extensions

The sample extensions under "Now try yours" on the Viaduct page are real Chrome Web Store packages, read ahead of time by the same `inspect.js` the page runs. To change the list or pick up newer versions, edit `SAMPLES` in `viaduct/assets/samples/build.mjs` and regenerate (needs network access):

```
cd viaduct/assets/samples
node build.mjs
```

That writes `samples.json` and one icon per extension. A new sample also needs its button in the `.picks__list` on `viaduct/index.html`.

## Analytics

Visits are counted with [Umami Cloud](https://cloud.umami.is), which uses no cookies, so the site has no consent banner. Every page loads `/assets/analytics.js` in its `<head>`. That file holds the website ID, loads Umami's tracker, and sends a `Buy` event for clicks on `gumroad.com/l/…` links and a `Download` event for clicks on GitHub release links, each tagged with the product. A new page needs the same `<script defer src="/assets/analytics.js"></script>` tag, and if it has a Content-Security-Policy, `https://cloud.umami.is` in `script-src` and `https://gateway.umami.is` in `connect-src`. The extension guides get both from `viaduct/extensions/build.js`.

Only `magicelklabs.com` is counted, so local previews send nothing. To stop counting your own visits on the live site, run `localStorage.setItem("umami.disabled", 1)` in that browser's console.

## Deployment

Pushing to `main` publishes automatically through GitHub Pages. The custom domain comes from the `CNAME` file (`magicelklabs.com`), and `.nojekyll` tells Pages to serve the files as-is instead of running them through Jekyll.
