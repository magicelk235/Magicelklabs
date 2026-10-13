# Magicelk Labs

The website for Magicelk Labs, a one-person studio building native Mac apps. It's live at [magicelklabs.com](https://magicelklabs.com).

The site is static: hand-written HTML, no framework and no bundler. GitHub Pages serves it straight from `main`. The Spyglass page uses Tailwind, but it's compiled to a plain stylesheet ahead of time rather than loaded from the CDN, so no visitor waits on a script to build the CSS. The Viaduct and Lector pages use plain CSS on the scroll-craft engine (see DESIGN.md, Motion).

## The apps

- **Viaduct** converts Chrome extensions into native Safari ones.
- **Spyglass** adds Quick Look previews for Google Workspace files on macOS.

## Structure

- `index.html` is the studio landing page.
- `spyglass/` holds the Spyglass product page and its legal pages (privacy, terms, license, security).
- `viaduct/` holds the Viaduct product page, its legal pages, and `viaduct/extensions/`, a set of SEO guide pages with a hub index (one page per popular Chrome extension).
- `assets/` holds the shared scripts (`motion.js`, `footer.js`, and `attribution.js`, which tags Gumroad buy links with where the visitor came from), the favicons, the web manifest, and `assets/tailwind/`, which holds the Tailwind configs the product stylesheets are built from.
- `DESIGN.md` covers the brand and visual rules. Read it before editing any page.
- `PRODUCT.md` explains what the site is for and how it converts.

## Local preview

Editing a page needs no build step. Serve the folder with any static server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Generated files

Three things in the repo are generated, and each gets committed alongside the change that caused it.

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

### Spyglass stylesheet

`spyglass/index.html` loads `assets/tailwind.css`, built from the config in `assets/tailwind/`. Rebuild after adding or changing a utility class on the page, or the new class will do nothing:

```
npx tailwindcss@3.4.16 -c assets/tailwind/spyglass.config.js -i assets/tailwind/input.css -o spyglass/assets/tailwind.css --minify
```

The config only scans its own page, so the stylesheet stays small. The `<link>` sits after the page's inline `<style>` on purpose: the Play CDN used to inject its stylesheet at the end of `<head>`, and the page was written expecting utilities to win over the inline rules.

## Deployment

Pushing to `main` publishes automatically through GitHub Pages. The custom domain comes from the `CNAME` file (`magicelklabs.com`), and `.nojekyll` tells Pages to serve the files as-is instead of running them through Jekyll.
