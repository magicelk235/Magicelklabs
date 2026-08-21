# Magicelk Labs

The website for Magicelk Labs, a one-person studio building native Mac apps. It's live at [magicelklabs.com](https://magicelklabs.com).

The site is static: hand-written HTML, no framework and no bundler. GitHub Pages serves it straight from `main`. The two product pages use Tailwind, but it's compiled to a plain stylesheet ahead of time rather than loaded from the CDN, so no visitor waits on a script to build the CSS.

## The apps

- **Viaduct** converts Chrome extensions into native Safari ones.
- **Spyglass** adds Quick Look previews for Google Workspace files on macOS.

## Structure

- `index.html` is the studio landing page.
- `spyglass/` holds the Spyglass product page and its legal pages (privacy, terms, license, security).
- `viaduct/` holds the Viaduct product page, its legal pages, and `viaduct/extensions/`, a set of SEO guide pages with a hub index (one page per popular Chrome extension).
- `assets/` holds the shared scripts (`motion.js`, `footer.js`), the favicons, the web manifest, and `assets/tailwind/`, which holds the Tailwind configs the product stylesheets are built from.
- `DESIGN.md` covers the brand and visual rules. Read it before editing any page.
- `PRODUCT.md` explains what the site is for and how it converts.

## Local preview

Editing a page needs no build step. Serve the folder with any static server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Generated files

Two things in the repo are generated, and both get committed alongside the change that caused them.

### Extension guides and the sitemap

The guides under `viaduct/extensions/` come from a template. To change them, edit the `EXTENSIONS` list or the template in `viaduct/extensions/build.js`, then regenerate:

```
cd viaduct/extensions
node build.js
```

That writes a `<slug>/index.html` for each extension, the hub `index.html`, and `sitemap.xml` for the whole site. The sitemap is generated, so don't edit it by hand: each `lastmod` comes from the last commit that touched the page, which means regenerating the files doesn't tell crawlers the content changed.

### Product stylesheets

`spyglass/index.html` and `viaduct/index.html` load `assets/tailwind.css`, built from the configs in `assets/tailwind/`. Rebuild after adding or changing a utility class on either page, or the new class will do nothing:

```
npx tailwindcss@3.4.16 -c assets/tailwind/spyglass.config.js -i assets/tailwind/input.css -o spyglass/assets/tailwind.css --minify
npx tailwindcss@3.4.16 -c assets/tailwind/viaduct.config.js  -i assets/tailwind/input.css -o viaduct/assets/tailwind.css  --minify
```

Each config only scans its own page, so the two stylesheets stay small and independent. The `<link>` sits after each page's inline `<style>` on purpose: the Play CDN used to inject its stylesheet at the end of `<head>`, and the pages were written expecting utilities to win over the inline rules.

## Deployment

Pushing to `main` publishes automatically through GitHub Pages. The custom domain comes from the `CNAME` file (`magicelklabs.com`), and `.nojekyll` tells Pages to serve the files as-is instead of running them through Jekyll.
