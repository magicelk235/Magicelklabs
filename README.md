# Magicelk Labs

The website for Magicelk Labs, a one-person studio building native Mac apps. It's live at [magicelklabs.com](https://magicelklabs.com).

The site is static: hand-written HTML with Tailwind loaded from a CDN. No framework, no bundler. GitHub Pages serves it straight from `main`.

## The apps

- **Viaduct** converts Chrome extensions into native Safari ones.
- **Spyglass** adds Quick Look previews for Google Workspace files on macOS.

## Structure

- `index.html` is the studio landing page.
- `spyglass/` holds the Spyglass product page and its legal pages (privacy, terms, license, security).
- `viaduct/` holds the Viaduct product page, its legal pages, and `viaduct/extensions/`, a set of SEO guide pages with a hub index (one page per popular Chrome extension).
- `assets/` holds the shared scripts (`motion.js`, `footer.js`) and favicons.
- `DESIGN.md` covers the brand and visual rules. Read it before editing any page.
- `PRODUCT.md` explains what the site is for and how it converts.

## Local preview

There's no build step. Serve the folder with any static server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## The one generated section

The extension guides under `viaduct/extensions/` are generated. To change them, edit the `EXTENSIONS` list or the template in `viaduct/extensions/build.js`, then regenerate:

```
cd viaduct/extensions
node build.js
```

That writes a `<slug>/index.html` for each extension plus the hub `index.html`. Commit the output along with your change.

## Deployment

Pushing to `main` publishes automatically through GitHub Pages. The custom domain comes from the `CNAME` file (`magicelklabs.com`), and `.nojekyll` tells Pages to serve the files as-is instead of running them through Jekyll.
