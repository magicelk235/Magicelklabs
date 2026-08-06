# Magicelk Labs

The website for Magicelk Labs, a one-person studio building focused, native Mac
apps. Live at [magicelklabs.com](https://magicelklabs.com).

It's a static site: hand-written HTML with Tailwind loaded from a CDN, no
framework and no bundler. GitHub Pages serves it straight from `main`.

## The apps it sells

- **Viaduct** — converts Chrome extensions into native Safari ones.
- **Spyglass** — Quick Look previews for Google Workspace files on macOS.

## Structure

- `index.html` — studio landing page
- `about/` — about the studio
- `spyglass/` — Spyglass product page plus its legal pages (privacy, terms,
  license, security)
- `viaduct/` — Viaduct product page, its legal pages, and
  `viaduct/extensions/`: a set of SEO guide pages (one per popular Chrome
  extension) with a hub index
- `assets/` — shared scripts (`motion.js`, `footer.js`)
- `DESIGN.md` — brand and visual rules; read this before editing any page
- `PRODUCT.md` — what the site is for and how it converts

## Local preview

The pages have no build step. Serve the folder with any static server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## The one generated section

The extension guides under `viaduct/extensions/` are generated. Edit the
`EXTENSIONS` list or the template in `viaduct/extensions/build.js`, then
regenerate:

```
cd viaduct/extensions
node build.js
```

That writes `<slug>/index.html` for each extension plus the hub `index.html`.
Commit the output along with your change.

## Deployment

Pushing to `main` publishes automatically through GitHub Pages. The custom
domain comes from the `CNAME` file (`magicelklabs.com`), and `.nojekyll` tells
Pages to serve the files as-is instead of running them through Jekyll.
