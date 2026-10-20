#!/usr/bin/env node
// Generates the /viaduct/extensions/ SEO pages: one page per popular Chrome
// extension with no (or partial) Safari presence, plus the hub index.
// Edit EXTENSIONS or the template below, then re-run:  node build.js
// Output: ./<slug>/index.html for each extension + ./index.html (hub).

'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SITE = 'https://magicelklabs.com';
const STORE = (id) => `https://chromewebstore.google.com/detail/${id}`;

// official = an official Safari version exists; the page must say so and link it.
// offStore = gone from the Chrome Web Store; the steps link the developer's own
// package instead of the store listing.
// limit = what the extension can't do once it runs in Safari; shown before the steps.
const EXTENSIONS = [
  { slug: 'claude-in-chrome', name: 'Claude in Chrome', id: 'fcoeoabgfenejglbffodgkkbkcdhcgfn',
    desc: 'Anthropic’s AI assistant that works right in your browser', category: 'AI assistants' },
  { slug: 'ublock-origin', name: 'uBlock Origin', id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
    desc: 'the wide-spectrum content blocker', category: 'Privacy & ad blocking',
    official: { label: 'uBlock Origin Lite (Mac App Store)', url: 'https://apps.apple.com/us/app/ublock-origin-lite/id6745342698',
      note: 'uBlock Origin’s developer makes uBlock Origin Lite for Safari, free on the Mac App Store, and it blocks requests for real. The full uBlock Origin blocks requests in a way Safari doesn’t allow, so converted it can hide ads on a page but can’t stop them loading.' },
    offStore: { label: 'uBlock Origin releases on GitHub', url: 'https://github.com/gorhill/uBlock/releases' } },
  { slug: 'tampermonkey', name: 'Tampermonkey', id: 'dhdgffkkebhmkfjojejmpbldmpobfkfo',
    desc: 'the most popular userscript manager', category: 'Userscripts',
    official: { label: 'Tampermonkey (Mac App Store)', url: 'https://apps.apple.com/us/app/tampermonkey/id6738342400',
      note: 'Tampermonkey ships an official paid Safari version. If you just want Tampermonkey, buy it; it supports the developer. Viaduct is for running the free Chrome build, or for extensions with no Safari port at all.' } },
  { slug: 'violentmonkey', name: 'Violentmonkey', id: 'jinjaccalgkegednnccohejagnlnfdag',
    desc: 'the open-source userscript manager', category: 'Userscripts' },
  { slug: 'metamask', name: 'MetaMask', id: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
    desc: 'the Ethereum wallet that lives in your browser', category: 'Crypto' },
  { slug: 'return-youtube-dislike', name: 'Return YouTube Dislike', id: 'gebbhagfogifgggkldgodflihgfeippi',
    desc: 'the extension that restores dislike counts on YouTube', category: 'YouTube' },
  { slug: 'sponsorblock', name: 'SponsorBlock', id: 'mnjggcdmjocbbbhaepdhchncahnbgone',
    desc: 'the extension that auto-skips sponsor segments in YouTube videos', category: 'YouTube',
    official: { label: 'SponsorBlock for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/sponsorblock-for-safari/id1573461917',
      note: 'SponsorBlock ships an official paid Safari version. If you just want SponsorBlock, buy it; it supports the developer. Viaduct is for running the free Chrome build, or for extensions with no Safari port at all.' } },
  { slug: 'stylus', name: 'Stylus', id: 'clngdbkpkpeebahjckkjfobafhncgmne',
    desc: 'custom CSS themes for any website', category: 'Customization' },
  { slug: 'dark-reader', name: 'Dark Reader', id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
    desc: 'dark mode for every website', category: 'Customization',
    official: { label: 'Dark Reader for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/dark-reader-for-safari/id1438243180',
      note: 'Dark Reader ships an official paid Safari version. If you just want Dark Reader, buy it; it supports the developer. Viaduct is for running the free Chrome build, or for the day you want an extension that has no Safari port at all.' } },
  { slug: 'clearurls', name: 'ClearURLs', id: 'lckanjgmijmafbedllaakclkaicjfmnk',
    desc: 'the extension that strips tracking parameters from links', category: 'Privacy & ad blocking',
    offStore: { label: 'ClearURLs releases on GitHub', url: 'https://github.com/ClearURLs/Addon/releases' },
    limit: 'ClearURLs cleans most links by rewriting requests as they leave the browser, and Safari doesn’t let extensions do that. Converted, it installs and opens, but most links go through uncleaned.' },
  { slug: 'decentraleyes', name: 'Decentraleyes', id: 'ldpochfccmkkmhdbclfhpagapcfdljkj',
    desc: 'local CDN emulation that blocks tracking requests', category: 'Privacy & ad blocking' },
  { slug: 'i-still-dont-care-about-cookies', name: "I still don't care about cookies", id: 'edibdbjcniadpccecjdfdjjppcpchdlm',
    desc: 'the extension that auto-dismisses cookie banners', category: 'Privacy & ad blocking' },
  { slug: 'video-speed-controller', name: 'Video Speed Controller', id: 'nffaoalbilbmmfgbnbgppjihopabppdk',
    desc: 'fine-grained speed control for any HTML5 video', category: 'Media' },
  { slug: 'augmented-steam', name: 'Augmented Steam', id: 'dnhpnfgdlenaccegplpojghhmaamnnfp',
    desc: 'price history and store upgrades for Steam', category: 'Gaming' },
  { slug: 'reddit-enhancement-suite', name: 'Reddit Enhancement Suite', id: 'kbmfpngjjgdllneeigpgjifpgocmfgmb',
    desc: 'the power-user toolkit for Reddit', category: 'Social' },
  { slug: 'refined-github', name: 'Refined GitHub', id: 'hlepfoohegkhhmjieoechaddaejaokhf',
    desc: 'dozens of quality-of-life improvements for GitHub', category: 'Developer tools',
    official: { label: 'Refined GitHub (Mac App Store)', url: 'https://apps.apple.com/us/app/refined-github/id1519867270',
      note: 'Refined GitHub has an official Safari port on the Mac App Store. If that works for you, use it. Viaduct is for running the Chrome build directly, or for extensions with no port at all.' } },
  { slug: 'zotero-connector', name: 'Zotero Connector', id: 'ekhagklcjbdpajgpjgmbionohlpdbjgc',
    desc: 'save references into Zotero from your browser', category: 'Research',
    official: { label: 'Zotero desktop app (bundles a Safari extension)', url: 'https://www.zotero.org/download/',
      note: 'Zotero bundles a Safari connector with its desktop app. If you run Zotero anyway, enable that first. Viaduct is for running the standalone Chrome connector, or any extension with no Safari option.' } },
  { slug: 'ublacklist', name: 'uBlacklist', id: 'pncfbmialoiaghdehhbnbhkkgmjanfhe',
    desc: 'the extension that removes chosen sites from Google results', category: 'Search',
    official: { label: 'uBlacklist for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/ublacklist-for-safari/id1547912640',
      note: 'uBlacklist has an official Safari port on the Mac App Store. If that covers you, use it. Viaduct is for running the Chrome build directly, or for extensions with no port at all.' } },
  { slug: 'web-archives', name: 'Web Archives', id: 'hkligngkgcpcolhcnkgccglchdafcnao',
    desc: 'one-click lookup of archived page versions (Wayback Machine and more)', category: 'Research',
    official: { label: 'Web Archives for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/web-archives-for-safari/id1603181853',
      note: 'Web Archives ships an official paid Safari version. If you just want Web Archives, buy it; it supports the developer. Viaduct is for running the free Chrome build, or for extensions with no Safari port at all.' } },
  { slug: 'user-agent-switcher', name: 'User-Agent Switcher and Manager', id: 'bhchdcejhohfmigjafbampogmaanbfkg',
    desc: 'spoof or rotate your browser’s user agent', category: 'Developer tools' },
  { slug: 'xbrowsersync', name: 'xBrowserSync', id: 'lcbjdhceifofjlpecfpeimnnphbcjgnc',
    desc: 'encrypted bookmark sync across browsers', category: 'Sync',
    offStore: { label: 'xBrowserSync releases on GitHub', url: 'https://github.com/xbrowsersync/app/releases' },
    limit: 'xBrowserSync syncs through the browser’s bookmarks API, which Safari doesn’t give extensions. Converted, it installs and opens, but it can’t read or change your Safari bookmarks.' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Shared page chrome. Tokens are lifted from ../index.html (the Theme.swift palette).
const CSS = `
/* The pages only ship dark. The canvas is a near-black with a trace of green in
   it, so the teal accent sits on it like something lit, not a sticker on grey. */
:root {
  color-scheme:dark;
  --canvas:#070908; --surface:#0E1211; --elevated:#151A19; --card:#1B211F;
  --ink:#ECF2F0; --body:#A3B0AD; --mute:#85938F; --ash:#4E5B58; --stone:#333D3B;
  --teal:#2DD4BF; --teal-press:#5FE3D2; --on-teal:#04211D;
  --ok:#30D158; --bad:#FF7A7F;
  --hair:rgba(255,255,255,.075); --hair-soft:rgba(255,255,255,.045); --hair-strong:rgba(255,255,255,.14);
  --glow:rgba(45,212,191,.09); --brass:var(--teal);
  --lip:inset 0 1px 0 rgba(255,255,255,.055);
}
* { box-sizing:border-box; }
body {
  margin:0; background:var(--canvas); color:var(--body);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;
  line-height:1.6; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; overflow-x:hidden;
}
::selection { background:var(--teal); color:var(--on-teal); }
/* Film grain over the whole page. Keeps the near-black from banding on the big
   gradients and takes the plastic off the flat fills. */
body::after {
  content:""; position:fixed; inset:0; z-index:9999; pointer-events:none; opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}
h1,h2,h3 { color:var(--ink); letter-spacing:-.02em; line-height:1.15; }
h1,h2 { font-family:'Cabinet Grotesk',Inter,sans-serif; font-weight:800; letter-spacing:-.025em; }
a { color:var(--teal); text-decoration:none; }
a:hover { text-decoration:underline; }
code { font-family:'JetBrains Mono',ui-monospace,'SFMono-Regular','SF Mono',Menlo,monospace; color:var(--teal); font-size:.92em; }
.wrap { max-width:760px; margin:0 auto; padding:0 24px; }
main.wrap { padding-top:110px; padding-bottom:24px; }
.btn-teal, .btn-ghost {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-size:15px; padding:11px 22px; text-decoration:none;
}
.btn-sm { font-size:13.5px; padding:7px 14px; }
.btn-teal:hover, .btn-ghost:hover { text-decoration:none; }
.btn-teal { background:var(--teal); color:var(--on-teal); font-weight:600; border-radius:999px; box-shadow:inset 0 1px 0 rgba(255,255,255,.3); transition:transform .22s cubic-bezier(.2,.8,.2,1), background .2s, box-shadow .25s; }
.btn-teal:hover { background:var(--teal-press); transform:translateY(-1px); box-shadow:inset 0 1px 0 rgba(255,255,255,.3), 0 6px 28px -6px rgba(45,212,191,.55); }
.btn-teal:active { transform:translateY(0) scale(.99); }
.btn-ghost { background:rgba(255,255,255,.05); color:var(--ink); border:1px solid rgba(255,255,255,.12); border-radius:999px; box-shadow:var(--lip); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); transition:transform .22s cubic-bezier(.2,.8,.2,1), border-color .2s, background .2s; }
.btn-ghost:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.2); transform:translateY(-1px); }
.btn-ghost:active { transform:translateY(0) scale(.99); }
.crumb { font-size:13px; color:var(--mute); margin:0 0 14px; }
.crumb a { color:var(--mute); }
.hero h1 { font-size:clamp(2.2rem,5.5vw,3.4rem); margin:0 0 16px; text-wrap:balance; }
.hero p.lede { font-size:18px; max-width:56ch; }
.card { background:var(--surface); border:1px solid var(--hair); border-radius:14px; padding:24px; box-shadow:var(--lip); }
.callout { border:1px solid color-mix(in srgb, var(--teal) 45%, transparent); background:color-mix(in srgb, var(--teal) 8%, var(--surface)); }
.steps { counter-reset:step; list-style:none; padding:0; margin:0; border-bottom:1px solid var(--hair); }
.steps li { counter-increment:step; border-top:1px solid var(--hair); padding:22px 0 22px 58px; position:relative; }
.steps li::before {
  content:counter(step); position:absolute; left:2px; top:16px;
  font-family:'Cabinet Grotesk',Inter,sans-serif; font-weight:800; font-size:30px; color:var(--teal);
}
.steps li strong { color:var(--ink); }
section { margin:56px 0; }
h2 { font-size:clamp(1.5rem,3.4vw,2rem); margin:0 0 16px; }
main > section > h2 { border-top:1px solid var(--hair); padding-top:28px; }
details { border-bottom:1px solid var(--hair); padding:14px 0; }
details summary { cursor:pointer; font-weight:600; color:var(--ink); list-style:none; }
details summary::-webkit-details-marker { display:none; }
details p { margin:10px 0 0; font-size:15px; }
footer { border-top:1px solid var(--hair); margin-top:72px; padding:32px 0 48px; font-size:13px; color:var(--mute); }
footer .links { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:16px; }
footer .links a { color:var(--mute); }
footer .links a:hover { color:var(--teal); }
.legal { max-width:760px; margin:64px auto 0; padding:0 24px; font-size:12.5px; line-height:1.6; color:var(--mute); }
.legal a { color:var(--mute); }
.index { margin:0; padding:0; list-style:none; }
.index a.row { display:grid; grid-template-columns:240px 1fr auto; gap:20px; align-items:baseline; padding:16px 12px; margin:0 -12px; border-top:1px solid var(--hair); color:inherit; transition:background .2s; }
.index a.row:last-child { border-bottom:1px solid var(--hair); }
.index a.row:hover { background:var(--glow); text-decoration:none; }
.index .row b { font-family:'Cabinet Grotesk',Inter,sans-serif; font-size:16px; font-weight:700; color:var(--ink); }
.index .row .d { font-size:14px; color:var(--mute); }
.index .row .c { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--teal); white-space:nowrap; }
@media (max-width:640px) { .index a.row { grid-template-columns:1fr; gap:4px; } .index .row .c { order:-1; } }
.tag { display:inline-block; font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--teal); margin-bottom:8px; }
a:focus-visible, button:focus-visible, summary:focus-visible { outline:2px solid var(--teal); outline-offset:3px; border-radius:6px; }
`;

// These pages run no inline JavaScript: the scripts are the first-party
// /assets/footer.js, /assets/attribution.js, /assets/analytics.js and
// /viaduct/assets/nav.js, plus the Umami tracker analytics.js loads from
// cloud.umami.is, which reports to gateway.umami.is. frame-ancestors is ignored
// when a policy arrives via <meta>, so framing is not covered here.
const CSP = "default-src 'self'; script-src 'self' https://cloud.umami.is; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com https://api.fontshare.com; img-src 'self' data:; media-src 'self'; connect-src 'self' https://gateway.umami.is; form-action 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; upgrade-insecure-requests";

// Social card: one image for the whole section, cropped to the 1.91:1 the
// scrapers want. JPEG rather than the .webp hero because several scrapers still
// refuse to render WebP cards.
const OG_IMAGE = `${SITE}/viaduct/assets/viaduct-og.jpg`;
const OG_IMAGE_W = 1200;
const OG_IMAGE_H = 630;

// Escaping "<" keeps a stray "</script>" inside any interpolated string from
// closing the block early.
const ldjson = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

function head({ title, description, canonical, imageAlt, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${CSP}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<link rel="icon" type="image/png" href="/viaduct/assets/viaduct-icon-dark.png" />
<link rel="apple-touch-icon" href="/viaduct/assets/viaduct-icon-dark.png" />
<link rel="manifest" href="/viaduct/assets/viaduct.webmanifest" />
<meta name="theme-color" content="#070908" />
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:site_name" content="Magicelk Labs" />
<meta property="og:locale" content="en_US" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="${OG_IMAGE_W}" />
<meta property="og:image:height" content="${OG_IMAGE_H}" />
<meta property="og:image:alt" content="${esc(imageAlt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/viaduct/assets/nav.css?v=1" />
<style>${CSS}</style>
<script type="application/ld+json">
${ldjson(jsonld)}
</script>
<script defer src="/assets/analytics.js"></script>
</head>`;
}

function chrome(inner) {
  return `
<body>
<header id="nav" class="nav">
  <nav class="nav-pill" aria-label="Primary">
    <a href="/viaduct/" class="brand" aria-label="Viaduct home">
      <img src="/viaduct/assets/viaduct-appicon.png" width="21" height="21" alt="">
      <span>Viaduct</span>
    </a>
    <div class="nav-links">
      <a href="/viaduct/#how">How it works</a>
      <a href="/viaduct/#features">Features</a>
      <a href="/viaduct/#pricing">Pricing</a>
      <a href="/viaduct/#faq">FAQ</a>
    </div>
    <div class="nav-actions">
      <a href="https://github.com/magicelk235/viaduct-app/releases/latest/download/Viaduct.dmg" class="btn-ghost btn-sm nav-download">Download</a>
      <a data-gumroad-action="buy" data-gumroad-price="19" href="https://gumroad.com/l/viaduct" class="btn-teal btn-sm">Get Pro</a>
    </div>
  </nav>
</header>
<main class="wrap">
${inner}
</main>
<p class="legal">All extension names are trademarks of their respective owners. Viaduct is not
affiliated with or endorsed by the developers of the extensions listed here, nor by Apple or
Google. Viaduct converts extensions locally on your Mac; nothing is redistributed.</p>
<div id="site-footer"></div>
<script src="/assets/footer.js" data-product="Viaduct" data-links-only="1" data-links="Viaduct|/viaduct/, All extensions|/viaduct/extensions/, How it works|/viaduct/#how, Privacy|/viaduct/privacy.html, Terms|/viaduct/terms.html"></script>
<noscript>
  <footer style="border-top:1px solid var(--hair);padding:40px 0 56px;font-size:14px;color:var(--mute)">
    <div style="max-width:1080px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:16px">
      <span style="font-family:'Cabinet Grotesk','Inter',sans-serif;font-size:16px;color:var(--ink)">Magicelk Labs · Viaduct <span style="color:var(--mute);font-family:Inter,sans-serif;font-size:13px">· © 2026</span></span>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <a href="/viaduct/" style="color:var(--mute);font-weight:500;text-decoration:none">Viaduct</a>
        <a href="/viaduct/extensions/" style="color:var(--mute);font-weight:500;text-decoration:none">All extensions</a>
        <a href="/viaduct/#how" style="color:var(--mute);font-weight:500;text-decoration:none">How it works</a>
        <a href="/viaduct/privacy.html" style="color:var(--mute);font-weight:500;text-decoration:none">Privacy</a>
        <a href="/viaduct/terms.html" style="color:var(--mute);font-weight:500;text-decoration:none">Terms</a>
      </div>
    </div>
  </footer>
</noscript>
<script src="/viaduct/assets/nav.js?v=1"></script>
<script src="/assets/attribution.js"></script>
</body>
</html>`;
}

function extensionPage(x) {
  const store = x.offStore ? x.offStore.url : STORE(x.id);
  const canonical = `${SITE}/viaduct/extensions/${x.slug}/`;
  const title = `Run ${x.name} in Safari · Viaduct`;
  const description = x.official
    ? `${x.name} on Safari: what the official option covers, and how to run the Chrome version natively in Safari with Viaduct.`
    : `${x.name} has no Safari version. Viaduct converts the real Chrome extension into a native Safari extension. ${x.offStore ? 'You never open a terminal.' : 'One click, no terminal.'}`;

  // The card image is Viaduct's own window, so the alt describes that, but names
  // the extension this page is about so no two pages ship the same string.
  const imageAlt = `The Viaduct app window on macOS, its drop target ready to convert the ${x.name} Chrome extension into a native Safari extension`;

  // TechArticle: this page is a how-to for one extension. No dates, no author
  // names, and no ratings, because nothing on the page sources them.
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: canonical,
    inLanguage: 'en-US',
    image: OG_IMAGE,
    author: { '@type': 'Organization', name: 'Magicelk Labs', url: SITE },
    publisher: { '@type': 'Organization', name: 'Magicelk Labs', url: SITE },
    about: {
      '@type': 'SoftwareApplication',
      name: x.name,
      description: x.desc.charAt(0).toUpperCase() + x.desc.slice(1),
      applicationCategory: 'BrowserApplication',
      url: store,
    },
  };

  const officialBlock = x.official ? `
<section>
  <div class="card callout">
    <strong style="color:var(--ink)">Good news first: an official option exists.</strong>
    <p style="margin:8px 0 0">${esc(x.official.note)}<br />
    → <a href="${x.official.url}" rel="noopener">${esc(x.official.label)}</a></p>
  </div>
</section>` : '';

  const limitBlock = x.limit ? `
<section>
  <div class="card callout">
    <strong style="color:var(--ink)">What won't work in Safari</strong>
    <p style="margin:8px 0 0">${esc(x.limit)}</p>
  </div>
</section>` : '';

  const noPortLede = x.official
    ? `There's an official Safari option for ${x.name} (linked below). There's also
       Viaduct, which runs the actual Chrome build in Safari, the same way it runs the
       thousands of extensions that never got a port.`
    : `${x.name}, ${x.desc}, has no official Safari version. Safari can't load Chrome
       extensions: it uses its own native <code>.appex</code> format that must be built,
       code-signed, and registered with macOS. Viaduct does all of that for you.`;

  // Off the store, the package comes from the developer and gets dropped on
  // Viaduct; on it, the store's "Add to Safari" button does the work.
  const steps = x.offStore ? `
    <li><strong><a href="/viaduct/">Get Viaduct</a></strong>. Free for your first 2 conversions.</li>
    <li><strong>Download ${esc(x.name)}'s Chromium package from its developer.</strong> It's no longer on the Chrome Web Store.<br />
        <a href="${store}" rel="noopener">${esc(x.offStore.label)} →</a></li>
    <li><strong>Drop it on Viaduct.</strong> Viaduct converts ${esc(x.name)} to a native Safari extension, signs it, and installs it. Switch it on once in Safari's settings and it appears in the toolbar, like any other extension.</li>` : `
    <li><strong><a href="/viaduct/">Get Viaduct</a></strong>. Free for your first 2 conversions. Turn on its small Safari extension once, and it upgrades the Chrome Web Store.</li>
    <li><strong>Open ${esc(x.name)}'s Chrome Web Store page in Safari.</strong><br />
        <a href="${store}" rel="noopener">${esc(x.name)} on the Chrome Web Store →</a></li>
    <li><strong>Click "Add to Safari."</strong> The store's "Add to Chrome" button becomes "Add to Safari." ${x.official
      ? 'If Viaduct points you to the official version first, choose Convert Anyway. It then fetches'
      : 'One click: Viaduct fetches'} ${esc(x.name)}, converts it to a native Safari extension, signs it, and installs it. Switch it on once in Safari's settings and it appears in the toolbar, like any other extension.</li>`;
  const source = x.offStore
    ? `takes the exact ${esc(x.name)} package its developers publish`
    : `downloads the exact ${esc(x.name)} package published on the Chrome Web Store`;

  return head({ title, description, canonical, imageAlt, jsonld }) + chrome(`
<div class="crumb"><a href="/viaduct/extensions/">Extensions</a> / ${esc(x.name)}</div>
<div class="hero">
  <span class="tag">${esc(x.category)}</span>
  <h1>Run ${esc(x.name)} in Safari</h1>
  <p class="lede">${noPortLede}</p>
</div>
${officialBlock}${limitBlock}
<section>
  <h2>The whole process, three steps</h2>
  <ol class="steps">${steps}
  </ol>
</section>

<!-- MEDIA-SLOT: ${x.slug}. Uncomment and fill after testing this extension.
<section>
  <h2>${esc(x.name)} running in Safari</h2>
  <figure class="card" style="padding:12px">
    <img src="media/${x.slug}-safari.png" alt="${esc(x.name)} running natively in Safari" style="width:100%;border-radius:8px;display:block" />
    <figcaption style="font-size:13px;color:var(--mute);margin-top:8px">${esc(x.name)}, converted by Viaduct, running in Safari's own engine.</figcaption>
  </figure>
</section>
-->

<section>
  <h2>What's actually happening</h2>
  <p>Viaduct ${source} (same code, same version) and rebuilds it as a native Safari Web Extension
  (<code>.appex</code>). It handles the conversion, the code-signing, and the macOS
  registration that normally require Xcode wrangling and a terminal. Because the result
  runs inside Safari's own engine, you keep Safari's battery life. No second Chromium
  process runs in the background.</p>
  <p>Safari supports the same WebExtension API family that Chrome extensions are built
  on, and Viaduct patches the places where Safari behaves differently, so most extensions
  work. Some Chrome-only APIs have no Safari equivalent, and
  the features built on them won't work. If an extension can't work in Safari at all,
  Viaduct tells you before you convert.</p>
</section>
<section>
  <h2>Questions</h2>
  <details><summary>Is this the real ${esc(x.name)}, or a clone?</summary>
    <p>The real one. Viaduct converts the exact package its developers published${x.offStore ? '' : ' on the Chrome Web Store'}
    and adds the fixes Safari needs to run it. Nothing is hosted or redistributed; the
    conversion happens locally on your Mac.</p></details>
  <details><summary>Will it stop working after a week?</summary>
    <p>On the free plan, yes: Viaduct removes converted extensions after 7 days.
    Viaduct Pro keeps them installed for good.</p></details>
  <details><summary>I already use ${esc(x.name)} in Chrome. Do my settings come with it?</summary>
    <p>Usually, if it's installed in Chrome, Brave, Edge, Arc, Vivaldi, Opera or Chromium on
    the same Mac. Viaduct reads its saved settings from the browser and brings them into
    the Safari version. Import from Chrome in Viaduct lists everything you have installed
    there and converts the ones you pick in one batch.</p></details>
  <details><summary>What do I need?</summary>
    <p>macOS 13+, on Apple Silicon or Intel. Viaduct is a universal app, so one download
    runs natively on either chip. Node is bundled inside Viaduct, so there's nothing
    to install. Xcode is required (free, from the App Store), with an Apple ID signed in
    (a free one works), because Apple offers no other way to code-sign a Safari extension
    on a free account. Viaduct's first-launch setup walks you through both.</p></details>
  <details><summary>What does Viaduct cost?</summary>
    <p>Free for your first 2 conversions, which Viaduct removes after 7 days. Pro is $19
    one-time: unlimited conversions, and your extensions stay installed. The conversion
    engine is source-available (PolyForm Shield).</p></details>
</section>`);
}

function hubPage() {
  const canonical = `${SITE}/viaduct/extensions/`;
  const tiles = EXTENSIONS.map((x) =>
    `<a class="row" href="/viaduct/extensions/${x.slug}/"><b>${esc(x.name)}</b><span class="d">${esc(x.desc.charAt(0).toUpperCase() + x.desc.slice(1))}</span><span class="c">${esc(x.category)}</span></a>`
  ).join('\n    ');
  const title = 'Chrome extensions you can run in Safari · Viaduct';
  const description = 'Per-extension guides for running popular Chrome extensions natively in Safari with Viaduct: uBlock Origin, Tampermonkey, MetaMask, SponsorBlock, and more.';
  return head({
    title,
    description,
    canonical,
    imageAlt: 'The Viaduct app window on macOS, its drop target ready to convert a Chrome extension into a native Safari extension',
    // The hub is an index, not a guide, so it describes itself as a collection and
    // lists the guides it links to rather than claiming to be one of them.
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: canonical,
      inLanguage: 'en-US',
      image: OG_IMAGE,
      publisher: { '@type': 'Organization', name: 'Magicelk Labs', url: SITE },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: EXTENSIONS.length,
        itemListElement: EXTENSIONS.map((x, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `Run ${x.name} in Safari`,
          url: `${SITE}/viaduct/extensions/${x.slug}/`,
        })),
      },
    },
  }) + chrome(`
<div class="hero">
  <h1>Chrome extensions,<br />running in Safari</h1>
  <p class="lede">Safari can't load Chrome extensions. Viaduct converts them into
  native Safari extensions, signed and installed in one click. Guides for the
  extensions people miss most:</p>
</div>
<section>
  <div class="index">
    ${tiles}
  </div>
</section>
<section>
  <p class="lede" style="font-size:15px;color:var(--mute)">Missing one? Viaduct isn't
  limited to this list. It converts any extension from a <code>.zip</code>,
  <code>.crx</code>, or unpacked folder, and Import from Chrome converts the ones you
  already have in Chrome, Brave, Edge, Arc and other Chromium browsers.
  <a href="/viaduct/">See how it works →</a></p>
</section>`);
}

// ── emit ──
let count = 0;
for (const x of EXTENSIONS) {
  const dir = path.join(__dirname, x.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), extensionPage(x));
  count++;
}
fs.writeFileSync(path.join(__dirname, 'index.html'), hubPage());

// Sitemap for the whole site, not just the viaduct section. This is the only
// generator that writes it, so anything added here by hand gets overwritten on
// the next run.
const LEGAL = ['privacy', 'terms', 'license', 'security'];
const urls = [
  `${SITE}/`,
  `${SITE}/about/`,
  `${SITE}/spyglass/`,
  ...LEGAL.map((p) => `${SITE}/spyglass/${p}.html`),
  `${SITE}/viaduct/`,
  ...LEGAL.map((p) => `${SITE}/viaduct/${p}.html`),
  `${SITE}/lector/`,
  ...LEGAL.map((p) => `${SITE}/lector/${p}.html`),
  `${SITE}/viaduct/extensions/`,
  ...EXTENSIONS.map((x) => `${SITE}/viaduct/extensions/${x.slug}/`),
];

// lastmod comes from the last commit that touched the page, not from mtime, so
// regenerating these files doesn't tell crawlers the content changed.
const ROOT = path.join(__dirname, '..', '..');
function lastmod(url) {
  let rel = url.slice(`${SITE}/`.length);
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  // Uncommitted page: fall back to today rather than emitting an empty element.
  return date || new Date().toISOString().slice(0, 10);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod(u)}</lastmod></url>`).join('\n')}
</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`${count} extension pages + hub + sitemap.xml written.`);
