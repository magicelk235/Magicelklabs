#!/usr/bin/env node
// Generates the Viaduct SEO pages: one page per popular Chrome extension with
// no (or partial) Safari presence, the general guide to Chrome extensions in
// Safari, the hub index, and the topic guides under /viaduct/guides/.
// Edit EXTENSIONS, GUIDES or the templates below, then re-run:  node build.js
// Output: ./<slug>/index.html for each extension, ./<GENERAL.slug>/index.html
// (the general guide), ./index.html (hub), ../guides/<slug>/index.html for each
// topic guide, and the site's sitemap.xml.

'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SITE = 'https://magicelklabs.com';
const ROOT = path.join(__dirname, '..', '..');
const STORE = (id) => `https://chromewebstore.google.com/detail/${id}`;

// Every per-extension fact has to be checkable against the extension's store
// listing or release page, Viaduct's own source (../viaduct-app) or its media
// kit's FACT-SHEET.md, never the CLI repo. Leave a field out rather than guess.
//
// desc     = what it is, a noun phrase that reads after "<name>, ".
// category = the hub section it's listed under; related guides prefer it.
// official = the developer's own Safari option: label and url for the link. The
//            label's "(…)" part says where it comes from; the hub's table
//            leaves it out. paid: it costs money and the Chrome version is
//            free. port: an official Safari port of the same extension. note:
//            what to say about choosing it. prompt: Viaduct's list of official
//            versions (SafariAlternatives.swift in viaduct-app) has this Chrome
//            id, so a store install first asks whether you'd rather get that.
// offStore = gone from the Chrome Web Store; the steps link the developer's own
//            package instead of the store listing.
// limit    = what the extension can't do once it runs in Safari: [why, what
//            happens instead]. The second half is the page's lede and goes in
//            the hub's table; without a limit the table says "no known limits".
// h1       = the honest headline when the extension's main job fails in Safari;
//            the title and the JSON-LD headline follow it.
// faq      = a question about this extension, from the media kit.
// fix      = a Safari breakage Viaduct patches in this extension (media kit).
// shot     = a screenshot of it running in Safari, encoded from the media kit.
//            Either one gets the page a row of its own.
// summary  = the meta description, where the composed one would leave out the
//            fact that matters.
// The page's icon is viaduct/assets/icons/<slug>.webp (128px, from the
// extension's own package) when that file exists.
const EXTENSIONS = [
  { slug: 'claude-in-chrome', name: 'Claude in Chrome', id: 'fcoeoabgfenejglbffodgkkbkcdhcgfn',
    desc: "Anthropic's AI assistant that works right in your browser", category: 'AI assistants',
    faq: { q: 'Does sign-in work?',
      a: 'Yes. So do the agent working in its own tab group and the Cowork connection from the Claude desktop app.' },
    summary: 'Claude in Chrome has no official Safari version. Converted by Viaduct, its sign-in, agent tab group and Cowork connection all work in Safari.' },
  { slug: 'ublock-origin', name: 'uBlock Origin', id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
    desc: 'the wide-spectrum content blocker', category: 'Privacy & ad blocking',
    official: { label: 'uBlock Origin Lite (Mac App Store)', url: 'https://apps.apple.com/us/app/ublock-origin-lite/id6745342698',
      note: "Made by uBlock Origin's developer, free, and it blocks requests for real." },
    offStore: { label: 'uBlock Origin releases on GitHub', url: 'https://github.com/gorhill/uBlock/releases' },
    limit: ["uBlock Origin blocks requests in a way Safari doesn't allow.",
      "Converted by Viaduct, it can hide ads on a page but can't stop them loading."],
    summary: "uBlock Origin Lite is its official Safari version. Converted by Viaduct, the full uBlock Origin can hide ads on a page but can't stop them loading." },
  { slug: 'tampermonkey', name: 'Tampermonkey', id: 'dhdgffkkebhmkfjojejmpbldmpobfkfo',
    desc: 'the most popular userscript manager', category: 'Userscripts',
    official: { label: 'Tampermonkey (Mac App Store)', url: 'https://apps.apple.com/us/app/tampermonkey/id6738342400', paid: true, prompt: true } },
  { slug: 'violentmonkey', name: 'Violentmonkey', id: 'jinjaccalgkegednnccohejagnlnfdag',
    desc: 'the open-source userscript manager', category: 'Userscripts' },
  { slug: 'metamask', name: 'MetaMask', id: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
    desc: 'the Ethereum wallet that lives in your browser', category: 'Crypto' },
  { slug: 'return-youtube-dislike', name: 'Return YouTube Dislike', id: 'gebbhagfogifgggkldgodflihgfeippi',
    desc: 'the extension that restores dislike counts on YouTube', category: 'YouTube' },
  { slug: 'sponsorblock', name: 'SponsorBlock', id: 'mnjggcdmjocbbbhaepdhchncahnbgone',
    desc: 'the extension that auto-skips sponsor segments in YouTube videos', category: 'YouTube',
    official: { label: 'SponsorBlock for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/sponsorblock-for-safari/id1573461917', paid: true, prompt: true } },
  { slug: 'stylus', name: 'Stylus', id: 'clngdbkpkpeebahjckkjfobafhncgmne',
    desc: 'custom CSS themes for any website', category: 'Customization' },
  { slug: 'dark-reader', name: 'Dark Reader', id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
    desc: 'dark mode for every website', category: 'Customization',
    official: { label: 'Dark Reader for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/dark-reader-for-safari/id1438243180', paid: true, prompt: true },
    fix: "Safari reports an extension's ID differently from Chrome, so Dark Reader's popup buttons go dead: their messages never reach the background. Viaduct rewrites the ID, and the popup works.",
    shot: { src: '/viaduct/assets/viaduct-dark-reader-safari.webp', width: 1400, height: 1071,
      alt: "Dark Reader's popup open from Safari's toolbar, over its own page on the Chrome Web Store" },
    summary: 'Dark Reader has a paid official Safari version. Viaduct runs the free Chrome one instead and fixes the popup buttons Safari breaks.' },
  { slug: 'clearurls', name: 'ClearURLs', id: 'lckanjgmijmafbedllaakclkaicjfmnk',
    desc: 'the extension that strips tracking parameters from links', category: 'Privacy & ad blocking',
    offStore: { label: 'ClearURLs releases on GitHub', url: 'https://github.com/ClearURLs/Addon/releases' },
    limit: ["ClearURLs cleans most links by rewriting requests as they leave the browser, and Safari doesn't let extensions do that.",
      'Converted by Viaduct, it installs and opens, but most links go through uncleaned.'],
    h1: 'ClearURLs in Safari: it opens, but most links stay uncleaned' },
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
    official: { label: 'Refined GitHub (Mac App Store)', url: 'https://apps.apple.com/us/app/refined-github/id1519867270', port: true } },
  { slug: 'zotero-connector', name: 'Zotero Connector', id: 'ekhagklcjbdpajgpjgmbionohlpdbjgc',
    desc: 'the extension that saves references into Zotero from your browser', category: 'Research',
    official: { label: 'Zotero desktop app (zotero.org)', url: 'https://www.zotero.org/download/', prompt: true,
      note: 'It comes with a Safari connector. If you run Zotero anyway, switch that on first.' } },
  { slug: 'ublacklist', name: 'uBlacklist', id: 'pncfbmialoiaghdehhbnbhkkgmjanfhe',
    desc: 'the extension that removes chosen sites from Google results', category: 'Search',
    official: { label: 'uBlacklist for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/ublacklist-for-safari/id1547912640', port: true } },
  { slug: 'web-archives', name: 'Web Archives', id: 'hkligngkgcpcolhcnkgccglchdafcnao',
    desc: 'one-click lookup of archived page versions (Wayback Machine and more)', category: 'Research',
    official: { label: 'Web Archives for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/web-archives-for-safari/id1603181853', paid: true } },
  { slug: 'user-agent-switcher', name: 'User-Agent Switcher and Manager', id: 'bhchdcejhohfmigjafbampogmaanbfkg',
    desc: "the extension that spoofs or rotates your browser's user agent", category: 'Developer tools' },
  { slug: 'xbrowsersync', name: 'xBrowserSync', id: 'lcbjdhceifofjlpecfpeimnnphbcjgnc',
    desc: 'encrypted bookmark sync across browsers', category: 'Sync',
    offStore: { label: 'xBrowserSync releases on GitHub', url: 'https://github.com/xbrowsersync/app/releases' },
    limit: ["xBrowserSync syncs through the browser's bookmarks API, which Safari doesn't give extensions.",
      "Converted by Viaduct, it installs and opens, but it can't read or change your Safari bookmarks."],
    h1: "xBrowserSync in Safari: it opens, but can't sync bookmarks" },
  { slug: 'vimium', name: 'Vimium', id: 'dbepggeogbaibhgnhhndojpepiihcmeb',
    desc: 'Vim-style keyboard shortcuts for browsing', category: 'Productivity',
    limit: ["Safari doesn't let extensions read your history or bookmarks.",
      "Converted by Viaduct, it can't search your Safari history or bookmarks from the Vomnibar."] },
  { slug: 'enhancer-for-youtube', name: 'Enhancer for YouTube', id: 'ponfpcnoihfmfllpaingbgckeeldkhle',
    desc: 'the extension that adds player controls, shortcuts and themes to YouTube', category: 'YouTube' },
  { slug: 'onetab', name: 'OneTab', id: 'chphlpgkkbolifaimnlloiipkdnihall',
    desc: 'the extension that turns your open tabs into a list', category: 'Productivity',
    official: { label: 'OneTab (Mac App Store)', url: 'https://apps.apple.com/us/app/onetab/id1540160809', port: true, prompt: true } },
  { slug: 'react-developer-tools', name: 'React Developer Tools', id: 'fmkadmapgofadopljbjfkapdkoienihi',
    desc: "the React team's inspector for components and renders", category: 'Developer tools',
    official: { label: 'React Developer Tools standalone app (npm)', url: 'https://github.com/facebook/react/tree/main/packages/react-devtools',
      note: "The React team's own way to debug React in Safari: run npx react-devtools and add its script tag to your page." },
    limit: ["React Developer Tools listens for an Elements panel event that Safari's Web Inspector doesn't have.",
      'Converted by Viaduct, it installs, but its Components and Profiler tabs are unlikely to load.'] },
  { slug: 'vue-devtools', name: 'Vue.js devtools', id: 'nhdogjmejiglipccpnnnanhbledajbpd',
    desc: "Vue's own inspector for components and state", category: 'Developer tools',
    official: { label: 'Vue DevTools Vite plugin (npm)', url: 'https://devtools.vuejs.org/guide/vite-plugin',
      note: "Vue's own option that needs no browser extension: the devtools open inside your app's page." },
    faq: { q: 'Does it work with Vue 2?',
      a: "This version supports Vue 3 only. Vue's docs point Vue 2 projects to the older v6 extension." } },
  { slug: 'redux-devtools', name: 'Redux DevTools', id: 'lmhkpmbekcpmknklioeibfkpmmfibljd',
    desc: 'the debugger for Redux state changes', category: 'Developer tools',
    official: { label: 'Redux DevTools remote (npm)', url: 'https://github.com/reduxjs/redux-devtools/tree/main/packages/redux-devtools-remote',
      note: "Redux's own option for other browsers: your app sends its state to the Redux DevTools monitor." } },
  { slug: 'colorzilla', name: 'ColorZilla', id: 'bhlhnicpbhignbdhedgjhgdocnmhomnp',
    desc: 'the eyedropper and color picker for web pages', category: 'Developer tools' },
  { slug: 'google-translate', name: 'Google Translate', id: 'aapbdbdomjkkjkaonfhkkikfgjllcleb',
    desc: "Google's extension for translating the text you select", category: 'Language',
    faq: { q: "Doesn't Safari translate already?",
      a: "It does, with Apple's own translation, from the Translate button in the address bar. The extension gives you Google's translation of the text you select instead." } },
];

// The Firefox side of each extension, merged in as x.firefox so the Safari
// facts above stay readable. Same sourcing rule.
// official = the developer's own Firefox add-on, checked against the author on
//            addons.mozilla.org and a link from the developer's own site. An
//            extension missing here has none: Video Speed Controller's
//            look-alikes on addons.mozilla.org are not its developer's.
// limit, h1, faq, fix, shot = as above, for Firefox. faq: true reuses the
//            Safari question where the answer doesn't depend on the browser.
const AMO = (name, slug) => ({ label: `${name} for Firefox (addons.mozilla.org)`, url: `https://addons.mozilla.org/firefox/addon/${slug}/` });
const FIREFOX = {
  'ublock-origin': { official: AMO('uBlock Origin', 'ublock-origin') },
  'tampermonkey': { official: AMO('Tampermonkey', 'tampermonkey'),
    fix: "Tampermonkey reads chrome.runtime.id in the world its user scripts run in, and Firefox leaves it out there. Viaduct defines it before any user script loads." },
  'violentmonkey': { official: AMO('Violentmonkey', 'violentmonkey') },
  'metamask': { official: AMO('MetaMask', 'ether-metamask') },
  'return-youtube-dislike': { official: AMO('Return YouTube Dislike', 'return-youtube-dislikes') },
  'sponsorblock': { official: AMO('SponsorBlock', 'sponsorblock') },
  'stylus': { official: AMO('Stylus', 'styl-us') },
  'dark-reader': { official: AMO('Dark Reader', 'darkreader'),
    shot: { src: '/viaduct/assets/viaduct-dark-reader-firefox.webp', width: 1400, height: 1071,
      alt: "Dark Reader's popup open from Firefox's Extensions button, over its own page on the Chrome Web Store" } },
  'clearurls': { official: AMO('ClearURLs', 'clearurls') },
  'decentraleyes': { official: AMO('Decentraleyes', 'decentraleyes') },
  'i-still-dont-care-about-cookies': { official: AMO("I still don't care about cookies", 'istilldontcareaboutcookies') },
  'augmented-steam': { official: AMO('Augmented Steam', 'augmented-steam') },
  'reddit-enhancement-suite': { official: AMO('Reddit Enhancement Suite', 'reddit-enhancement-suite') },
  'refined-github': { official: AMO('Refined GitHub', 'refined-github-') },
  'zotero-connector': { official: { label: 'Zotero Connector for Firefox (zotero.org)', url: 'https://www.zotero.org/download/connectors' } },
  'ublacklist': { official: AMO('uBlacklist', 'ublacklist') },
  'web-archives': { official: AMO('Web Archives', 'view-page-archive') },
  'user-agent-switcher': { official: AMO('User-Agent Switcher and Manager', 'user-agent-string-switcher') },
  'xbrowsersync': { official: AMO('xBrowserSync', 'xbs') },
  'vimium': { official: AMO('Vimium', 'vimium-ff') },
  'enhancer-for-youtube': { official: AMO('Enhancer for YouTube', 'enhancer-for-youtube') },
  'onetab': { official: AMO('OneTab', 'onetab') },
  'react-developer-tools': { official: AMO('React Developer Tools', 'react-devtools') },
  'vue-devtools': { official: AMO('Vue.js devtools', 'vue-js-devtools'), faq: true },
  'redux-devtools': { official: AMO('Redux DevTools', 'reduxdevtools') },
  'colorzilla': { official: AMO('ColorZilla', 'colorzilla') },
};
for (const x of EXTENSIONS) x.firefox = FIREFOX[x.slug] || {};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// desc as a list entry: "the extension that restores dislike counts" reads as
// "Restores dislike counts" beside the name.
const blurb = (x) => cap(x.desc.replace(/^the extension that /, '').replace(/^the /, ''));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const longDate = (iso) => new Date(`${iso}T12:00:00Z`)
  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// lastmod comes from the last commit that touched the page, not from mtime, so
// regenerating these files doesn't tell crawlers the content changed. The
// guides print the same date as "Updated" and as their JSON-LD dateModified, so
// after committing a guide, run this again and commit what it rewrites.
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

// Categories in the order their first extension appears in EXTENSIONS.
function categories() {
  const groups = new Map();
  for (const x of EXTENSIONS) groups.set(x.category, [...(groups.get(x.category) || []), x]);
  return [...groups];
}

// Three other guides: up to two from x's category, then the next guides after x
// in EXTENSIONS, wrapping round. The cap of two leaves every list a slot for the
// guide after it, so no guide goes without a link from another.
function related(x) {
  const i = EXTENSIONS.indexOf(x);
  const after = [...EXTENSIONS.slice(i + 1), ...EXTENSIONS.slice(0, i)];
  const same = after.filter((y) => y.category === x.category).slice(0, 2);
  return [...same, ...after.filter((y) => !same.includes(y))].slice(0, 3);
}

const icon = (slug) => fs.existsSync(path.join(ROOT, 'viaduct', 'assets', 'icons', `${slug}.webp`))
  ? `/viaduct/assets/icons/${slug}.webp` : null;

// Every page holds a Safari and a Firefox version of what differs between the
// browsers. viaduct/assets/browser.js picks one and nav.css hides the other's
// [data-for] elements; the Safari one is the markup default, which is what
// crawlers and visitors without JavaScript get. bx() pairs two runs of inline
// HTML and returns the one string when they don't differ.
const bx = (safari, firefox) => (firefox == null || firefox === safari ? safari
  : `<span data-for="safari">${safari}</span><span data-for="firefox">${firefox}</span>`);

// A label like "Dark Reader for Safari (Mac App Store)" without its source.
const bare = (label) => label.replace(/\s*\([^)]*\)$/, '');

// One extension in the hub's table, with its own icon. Each cell says what it
// holds, so a row still reads right once it stacks on a phone. The limit is the
// guide's own sentence without its "Converted by Viaduct" opening. The official
// version and the limits each get a cell per browser.
const compatRow = (x) => {
  const src = icon(x.slug);
  const officialCell = (o, none, b) => (o
    ? `<td data-for="${b}"><a href="${o.url}" rel="noopener">${esc(bare(o.label))}</a>${o.paid ? ', paid' : ''}</td>`
    : `<td class="no" data-for="${b}">${none}</td>`);
  const limitCell = (l, b) => (l
    ? `<td data-for="${b}">${esc(cap(l[1].replace(/^Converted by Viaduct, it /, '')))}</td>`
    : `<td class="no" data-for="${b}">No known limits</td>`);
  const f = x.firefox || {};
  return `<tr><th scope="row"><a class="ext" href="/viaduct/extensions/${x.slug}/">${src ? `<img src="${src}" width="32" height="32" alt="" loading="lazy" decoding="async" />` : '<span class="ph"></span>'}<b>${esc(x.name)}</b></a></th>${officialCell(x.official, 'No Safari version', 'safari')}${officialCell(f.official, 'No Firefox add-on', 'firefox')}${limitCell(x.limit, 'safari')}${limitCell(f.limit, 'firefox')}</tr>`;
};

// "a, b and c"
const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// Shared page chrome, built on the product page's own system (viaduct.css):
// the same 1152px column, the 4/8 ledger its Compatibility and Features
// sections use, the framed screenshots and the bare teal step numerals. Tokens
// are lifted from ../index.html (the Theme.swift palette).
const CSS = `
/* The pages only ship dark. The canvas is a near-black with a trace of green in
   it, so the teal accent sits on it like something lit, not a sticker on grey. */
:root {
  color-scheme:dark;
  --canvas:#070908; --surface:#0E1211; --elevated:#151A19; --card:#1B211F;
  --ink:#ECF2F0; --body:#A3B0AD; --mute:#85938F;
  --teal:#2DD4BF; --teal-press:#5FE3D2; --on-teal:#04211D;
  --hair:rgba(255,255,255,.075); --hair-soft:rgba(255,255,255,.045);
  --lip:inset 0 1px 0 rgba(255,255,255,.055);
  --ease:cubic-bezier(.16,1,.3,1);
}
* { box-sizing:border-box; }
html { scroll-padding-top:86px; }
body {
  margin:0; background:var(--canvas); color:var(--body);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;
  font-size:16.5px; line-height:1.65; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; overflow-x:hidden;
}
::selection { background:var(--teal); color:var(--on-teal); }
/* Film grain over the whole page. Keeps the near-black from banding and takes
   the plastic off the flat fills. */
body::after {
  content:""; position:fixed; inset:0; z-index:9999; pointer-events:none; opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}
h1,h2,h3 { color:var(--ink); margin:0; font-family:'Cabinet Grotesk',Inter,sans-serif; font-weight:800; letter-spacing:-.025em; line-height:1.08; text-wrap:balance; }
p { margin:0 0 16px; text-wrap:pretty; }
a { color:var(--teal); text-decoration:none; }
a:hover { text-decoration:underline; text-underline-offset:3px; }
strong { color:var(--ink); font-weight:600; }
code { font-family:'JetBrains Mono',ui-monospace,'SFMono-Regular',Menlo,monospace; color:var(--ink); font-size:.86em; padding:1px 5px; border-radius:5px; background:var(--elevated); }
.wrap { max-width:1152px; margin:0 auto; padding:0 24px; }
.btn-teal, .btn-ghost {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-size:15px; padding:11px 22px; text-decoration:none; border-radius:999px;
}
.btn-sm { font-size:13.5px; padding:7px 14px; }
.btn-teal:hover, .btn-ghost:hover { text-decoration:none; }
.btn-teal { background:var(--teal); color:var(--on-teal); font-weight:600; box-shadow:inset 0 1px 0 rgba(255,255,255,.3); transition:transform .22s var(--ease), background .2s; }
.btn-teal:hover { background:var(--teal-press); transform:translateY(-1px); }
.btn-ghost { background:rgba(255,255,255,.05); color:var(--ink); border:1px solid rgba(255,255,255,.12); box-shadow:var(--lip); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); transition:transform .22s var(--ease), border-color .2s, background .2s; }
.btn-ghost:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.2); transform:translateY(-1px); }

/* Page head: crumb, the extension's own icon when there is one, a big
   headline and one paragraph. */
.top { padding:148px 0 72px; }
.crumb { font-size:13.5px; color:var(--mute); margin:0 0 40px; }
.crumb a { color:var(--mute); }
.crumb a:hover { color:var(--ink); }
.top h1 { font-size:clamp(2.5rem,5.4vw,4.25rem); line-height:1.02; max-width:17ch; margin-bottom:24px; }
.lede { font-size:clamp(1.08rem,1.9vw,1.25rem); line-height:1.6; max-width:40rem; margin:0; }
.aside { max-width:40rem; margin:0 0 20px; font-size:15px; }

/* The ledger: each section is a row, its heading held in the left column while
   the body scrolls past on the right. */
.row { display:grid; grid-template-columns:minmax(0,4fr) minmax(0,8fr); gap:24px clamp(40px,5vw,72px); padding:64px 0; border-top:1px solid var(--hair); }
.row > h2 { position:sticky; top:112px; align-self:start; font-size:clamp(1.55rem,2.5vw,2rem); max-width:13ch; }
.row__body { min-width:0; }
.row__body > :last-child, .row__body > [data-for] > :last-child { margin-bottom:0; }
.row__body p { max-width:62ch; }

/* Steps: bare numerals in the accent, hairlines between. In the
   demonstration the numbers of the steps the recording shows are buttons. */
.steps { list-style:none; padding:0; margin:0; }
.steps li { display:grid; grid-template-columns:44px minmax(0,1fr); gap:0 16px; padding:18px 0; border-top:1px solid var(--hair); }
.steps li:last-child { border-bottom:1px solid var(--hair); }
.steps p { margin:0; padding-top:6px; }
.step__n { display:block; width:44px; height:44px; margin:0; padding:0; border:0; background:none; text-align:left; font:800 32px/44px 'Cabinet Grotesk',Inter,sans-serif; color:var(--teal); }
button.step__n { cursor:pointer; border-radius:8px; }
button.step__n:hover { color:var(--teal-press); }
button.step__n:focus-visible { outline:2px solid var(--teal); outline-offset:2px; }

/* The demonstration: the steps on the lead side, the recording framed on the
   trail side, capped by the stage height so the whole window stays on screen
   while the act holds. While it tracks, the step the footage is on is lit
   and the rest fall back to the muted ink. */
.demo { --ar:16 / 9; border-top:1px solid var(--hair); }
.demo__stage {
  display:grid; grid-template-columns:minmax(0,4fr) minmax(0,8fr); grid-template-rows:1fr auto auto 1fr;
  grid-template-areas:". f" "h f" "s f" ". f"; gap:0 clamp(32px,4vw,64px); align-items:center;
  max-width:1152px; margin:0 auto; padding:96px 24px 40px;
}
.demo__stage > h2 { grid-area:h; font-size:clamp(1.55rem,2.5vw,2rem); margin-bottom:20px; }
.demo__stage > .steps { grid-area:s; align-self:start; }
.demo__frame { grid-area:f; justify-self:end; margin:0; width:min(100%, (100svh - 230px) * (var(--ar)) + 14px); }
.demo__slot { position:relative; aspect-ratio:var(--ar); border-radius:11px; overflow:hidden; background:var(--elevated); }
.demo__slot > img, .demo__slot > video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.demo--plain .demo__slot > img { display:none; }
.demo__frame figcaption { padding:10px 6px 4px; font-size:13.5px; color:var(--mute); }
.demo--plain .demo__stage { padding-top:64px; padding-bottom:64px; }
.demo.is-tracking .steps li { color:var(--mute); transition:color .3s var(--ease); }
.demo.is-tracking .steps li strong { color:var(--mute); transition:color .3s var(--ease); }
.demo.is-tracking .steps li .step__n { color:var(--mute); transition:color .3s var(--ease); }
.demo.is-tracking .steps li.is-on, .demo.is-tracking .steps li.is-on strong { color:var(--ink); }
.demo.is-tracking .steps li.is-on .step__n { color:var(--teal); }

/* Screenshots sit in the product page's frame: a lipped surface, 6px of it
   showing round the image. */
.frame { margin:24px 0 0; padding:6px; background:var(--surface); border:1px solid var(--hair); border-radius:16px; box-shadow:var(--lip), 0 24px 60px -30px rgba(0,0,0,.7); }
.frame img { display:block; width:100%; height:auto; border-radius:11px; }

/* Other guides, as one line. */
.more { border-top:1px solid var(--hair); padding:32px 0; margin:0; color:var(--mute); }
.more a { color:var(--ink); }
.more a:hover { color:var(--teal); text-decoration:none; }

/* The padding sits on the summary, so the whole row takes the tap. */
.qa { border-top:1px solid var(--hair); }
details { border-bottom:1px solid var(--hair); }
details summary { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 0; cursor:pointer; font-weight:600; color:var(--ink); list-style:none; }
details summary::-webkit-details-marker { display:none; }
details p { margin:0 0 18px; max-width:62ch; }
.chev { width:20px; height:20px; flex:none; fill:none; stroke:var(--mute); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; transition:transform .3s var(--ease); }
details[open] .chev { transform:rotate(180deg); }

/* Other guides, by name only. */
.names { list-style:none; margin:0; padding:0; columns:2 220px; column-gap:32px; }
.names li { break-inside:avoid; }
.names a { display:block; padding:8px 0; color:var(--ink); }
.names a:hover { color:var(--teal); text-decoration:none; }

.meta { border-top:1px solid var(--hair); padding:32px 0 0; margin-top:8px; font-size:13px; line-height:1.6; color:var(--mute); }
.meta p { max-width:70ch; margin:0 0 8px; }
footer { border-top:1px solid var(--hair); margin-top:72px; padding:32px 0 48px; font-size:13px; color:var(--mute); }

/* Read aloud, not shown. */
.sr { position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

/* Side-by-side tables (the general guide's three ways, the developer guide's
   comparison): phones drop the header row and label each cell instead. */
.ways { width:100%; border-collapse:collapse; table-layout:fixed; font-size:15px; line-height:1.55; }
.ways th, .ways td { text-align:left; vertical-align:baseline; padding:16px 16px 16px 0; border-top:1px solid var(--hair); }
.ways th:last-child, .ways td:last-child { padding-right:0; }
.ways thead th { border-top:0; padding-top:0; font-size:13.5px; font-weight:400; color:var(--mute); }
.ways tbody th { font-weight:600; color:var(--ink); }
.ways tbody tr:last-child > * { border-bottom:1px solid var(--hair); }
.ways td::before { content:attr(data-label); display:none; }

/* The hub's tables: extension, its official Safari version, its limits. */
.compat { width:100%; border-collapse:collapse; table-layout:fixed; font-size:15px; line-height:1.5; }
.compat .c-ext { width:36%; }
.compat .c-off { width:30%; }
.compat thead th { padding:0; border:0; }
.compat tbody th, .compat td { text-align:left; font-weight:400; vertical-align:middle; padding:14px 16px 14px 0; border-top:1px solid var(--hair); }
.compat td:last-child { padding-right:0; }
.compat .ext { display:flex; align-items:center; gap:14px; color:var(--ink); }
.compat .ext img, .compat .ph { width:32px; height:32px; flex:none; }
.compat .ext b { font-weight:600; transition:color .2s; }
.compat .ext:hover { text-decoration:none; }
.compat .ext:hover b { color:var(--teal); }
.compat .no { color:var(--mute); }

pre { margin:20px 0; padding:16px 18px; background:var(--surface); border:1px solid var(--hair); border-radius:12px; box-shadow:var(--lip); white-space:pre-wrap; overflow-x:auto; }
pre code { padding:0; background:none; font-size:13.5px; color:var(--teal); }
/* Broken after one of its hyphens, the tool's name reads as two words. */
pre .nw { white-space:nowrap; }

a:focus-visible, button:focus-visible, summary:focus-visible { outline:2px solid var(--teal); outline-offset:3px; border-radius:6px; }

@media (max-width:860px) {
  .top { padding:124px 0 48px; }
  .crumb { margin-bottom:28px; }
  .row { grid-template-columns:1fr; padding:48px 0; }
  .row > h2 { position:static; max-width:none; }
}
@media (max-width:640px) {
  .demo__stage { grid-template-columns:1fr; grid-template-rows:none; grid-template-areas:"h" "f" "s"; padding-left:0; padding-right:0; }
  .demo__frame { justify-self:stretch; width:auto; margin-bottom:24px; }
  .ways thead { display:none; }
  .ways, .ways tbody, .ways tr, .ways tbody th, .ways td { display:block; width:auto; }
  .ways tbody tr { padding:16px 0; border-top:1px solid var(--hair); }
  .ways tbody tr:last-child { border-bottom:1px solid var(--hair); }
  .ways tbody th, .ways td, .ways tbody tr:last-child > * { padding:0; border:0; }
  .ways td { margin-top:10px; }
  .ways td::before { display:block; font-size:13.5px; color:var(--mute); }
  .compat thead { display:none; }
  .compat, .compat tbody, .compat tr, .compat tbody th, .compat td { display:block; width:auto; }
  .compat tbody tr { padding:16px 0; border-top:1px solid var(--hair); }
  .compat tbody th, .compat td { padding:0; border:0; }
  .compat td { margin:6px 0 0 46px; }
}
/* One-line links in tables and lists; widen what catches a tap. */
@media (pointer:coarse) {
  .compat td a, .names a { position:relative; }
  .compat td a::after { content:""; position:absolute; inset:-13px -6px; }
  .names a { padding:11px 0; }
}
@media (prefers-reduced-motion: reduce) { .btn-teal, .btn-ghost, .chev, .compat .ext b { transition:none; } }
`;

// A ledger row: the heading on the left, everything else on the right. `only`
// keeps the row to one browser's version of the page.
const ledger = (h2, body, id, only) => {
  const hid = `${id || slugify(h2.replace(/<[^>]+>/g, ''))}-h`;
  return `
<section class="row"${id ? ` id="${id}"` : ''}${only ? ` data-for="${only}"` : ''} aria-labelledby="${hid}">
  <h2 id="${hid}">${h2}</h2>
  <div class="row__body">
${body}
  </div>
</section>`;
};

// The head every page opens with, and all it holds: crumb, headline, one
// sentence. The demonstration comes straight after it. `aside` is a line for
// Firefox visitors on a guide that is about Safari.
const pageTop = ({ crumbs, h1, lede, aside }) => `
<div class="top">
  <nav class="crumb" aria-label="Breadcrumb">${crumbs}</nav>
  <h1>${h1}</h1>
  ${aside ? `<p class="aside" data-for="firefox">${aside}</p>
  ` : ''}<p class="lede">${lede}</p>
</div>`;

const SAFARI_ONLY = 'This guide is about Safari. <a href="/viaduct/?browser=firefox">Viaduct converts Chrome extensions for Firefox too.</a>';

const frame = (src, width, height, alt, lazy = true) =>
  `<figure class="frame"><img src="/viaduct/assets/${src}" width="${width}" height="${height}" alt="${alt}"${lazy ? ' loading="lazy"' : ''} decoding="async" /></figure>`;

// faqs: [question, answer HTML, browser] rows. A row with a browser shows only
// in that version of the page.
const faqRow = (faqs) => ledger('Questions', `    <div class="qa">
${faqs.map(([q, a, only]) => `    <details${only ? ` data-for="${only}"` : ''}><summary>${esc(q)}${CHEV}</summary>
      <p>${a}</p></details>`).join('\n')}
    </div>`);

// A question whose answer differs by browser, as the two rows faqRow takes. A
// missing answer leaves that browser's version without the question.
const faqPair = (safari, firefox) => [
  ...(safari ? [[...safari, 'safari']] : []),
  ...(firefox ? [[...firefox, 'firefox']] : []),
];

const namesRow = (h2, links) => ledger(h2, `    <ul class="names">
      ${links.map(([name, href]) => `<li><a href="${href}">${esc(name)}</a></li>`).join('\n      ')}
    </ul>`);

// Other guides, as one line rather than a section of their own.
const moreLine = (links) => `
<nav class="more" aria-label="More guides">More guides: ${andList(links.map(([name, href]) => `<a href="${href}">${esc(name)}</a>`))}.</nav>`;

// The real recordings a demonstration can play, all from the media kit: the
// Dark Reader install from the Chrome Web Store, the drop-and-convert of its
// .crx, and TWP converting (its long build compressed). Each has a scrub
// master, a -phone cut, and -poster first frames (DESIGN.md, Assets).
// `at`: the second in each recording where a step begins, read off its frames.
// `phone`: the size of the -phone cut, cropped in on the action so it reads at
// phone width; phones play it rather than scrub it.
const VIDEOS = {
  store: { file: 'viaduct-install', w: 1440, h: 810, phone: [960, 720], at: { open: 0, click: 6.2, on: 14 },
    label: "Screen recording in Safari: Add to Safari is clicked on the Dark Reader listing in the Chrome Web Store, Viaduct builds and signs it, the button becomes Remove from Safari, and Dark Reader's popup opens from the toolbar." },
  drop: { file: 'viaduct-drop', w: 1260, h: 940, phone: [640, 720], at: { drop: 2.5, convert: 5.2, on: 12 },
    label: "Screen recording of Viaduct: Dark Reader's .crx is dropped on the window, Convert & Install is clicked, and Viaduct builds, signs and installs it." },
  batch: { file: 'viaduct-batch', w: 1388, h: 1016, phone: [686, 720], at: { convert: 0, on: 9 },
    label: 'Screen recording of Viaduct converting TWP - Translate Web Pages: it builds and signs the extension, then shows Installed in Safari.' },
};

// Each extension's own install (viaduct/assets/install/<slug>.mp4, -phone.mp4
// and their posters; DESIGN.md, Assets). Store extensions were recorded by
// clicking Add to Safari on their listing, off-store ones by dropping the
// developer's .zip on Viaduct. recordings.json holds where each step lands in
// each cut. An extension without one plays the Dark Reader install.
const RECORDINGS = JSON.parse(fs.readFileSync(path.join(__dirname, 'recordings.json'), 'utf8'));
const ownRecording = (x) => {
  const r = RECORDINGS[x.slug];
  if (!r) return null;
  // travel: these start and end on still frames, so the clip can sit on them
  // while the stage slides in and out, and every step's moment lands inside
  // the pin.
  if (x.offStore) return { file: `install/${x.slug}`, w: 1260, h: 940, phone: [690, 720], travel: true, at: { drop: r.drop, on: r.on },
    label: `Screen recording of Viaduct: ${x.name}'s .zip is dropped on the window, Convert & Install is clicked, and Viaduct builds, signs and installs it.` };
  return { file: `install/${x.slug}`, w: 1440, h: 810, phone: [960, 540], travel: true, at: { open: 0, click: r.click, on: r.on },
    label: `Screen recording in Safari: Add to Safari is clicked on the ${x.name} listing in the Chrome Web Store, and Viaduct builds, signs and installs it.` };
};

// The same recordings made in Firefox. recordings-firefox.json holds each
// one's step times: a slug per extension, and "_store", "_drop" and "_batch"
// (with w, h, phone and at) for the three shared ones. The files sit beside
// the Safari ones: viaduct-install-firefox*, viaduct-drop-firefox*,
// viaduct-batch-firefox* and install/firefox/<slug>*. A recording counts once
// both its entry and its .mp4 exist; until then the Firefox version of a page
// plays the Safari recording.
const FF_JSON = path.join(__dirname, 'recordings-firefox.json');
const FF_RECORDINGS = fs.existsSync(FF_JSON) ? JSON.parse(fs.readFileSync(FF_JSON, 'utf8')) : {};
const recorded = (file) => fs.existsSync(path.join(ROOT, 'viaduct', 'assets', `${file}.mp4`));
const ffShared = (key, label) => {
  const r = FF_RECORDINGS[`_${key}`];
  const file = `${VIDEOS[key].file}-firefox`;
  return r && recorded(file) ? { file, w: r.w, h: r.h, phone: r.phone, travel: !!r.travel, at: r.at, label } : null;
};
const FF_VIDEOS = {
  store: ffShared('store', "Screen recording in Firefox: Add to Firefox is clicked on the Dark Reader listing in the Chrome Web Store, Viaduct converts and installs it, and Dark Reader's popup opens from Firefox's Extensions button."),
  drop: ffShared('drop', "Screen recording of Viaduct with Firefox chosen: Dark Reader's .crx is dropped on the window, Convert & Install is clicked, and Viaduct converts it and installs it in Firefox."),
  batch: ffShared('batch', 'Screen recording of Viaduct converting TWP - Translate Web Pages with Firefox chosen: it converts the extension, then shows it installed in Firefox.'),
};
const ffRecording = (x) => {
  const r = FF_RECORDINGS[x.slug];
  const file = `install/firefox/${x.slug}`;
  if (!r || !recorded(file)) return null;
  if (x.offStore) return { file, w: r.w || 1260, h: r.h || 940, phone: r.phone || [690, 720], travel: true, at: { drop: r.drop, on: r.on },
    label: `Screen recording of Viaduct with Firefox chosen: ${x.name}'s .zip is dropped on the window, Convert & Install is clicked, and Viaduct converts it and installs it in Firefox.` };
  return { file, w: r.w || 1440, h: r.h || 810, phone: r.phone || [960, 540], travel: true, at: { open: 0, click: r.click, on: r.on },
    label: `Screen recording in Firefox: Add to Firefox is clicked on the ${x.name} listing in the Chrome Web Store, and Viaduct converts and installs it.` };
};
// What the Firefox version of a page says under a recording made in Safari.
const IN_SAFARI = { store: 'Recorded in Safari. In Firefox the button says Add to Firefox.', drop: 'Recorded with Safari chosen.', batch: 'Recorded with Safari chosen.' };

// The Firefox side of a demonstration built on one of the three shared
// recordings: its own heading, steps and note, and the Firefox recording once
// there is one.
const ffDemo = (key, heading, steps, note) => ({ heading, steps, video: FF_VIDEOS[key], note: FF_VIDEOS[key] ? note : IN_SAFARI[key] });

// steps: [html, t] pairs. t is the second in the recording where that step
// starts; a step the recording doesn't show (setup) has none. ffSteps are the
// same steps as Firefox does them, one for one, timed on the recording the
// Firefox version plays.
const stepsList = (steps, ffSteps) => `<ol class="steps">${steps.map(([html, t], i) => {
  const [ffHtml, ffT] = ffSteps ? ffSteps[i] : [];
  return `
      <li${t == null ? '' : ` data-t="${t}"`}${ffT == null || ffT === t ? '' : ` data-ff data-ff-data-t="${ffT}"`}>${t == null
    ? `<span class="step__n" aria-hidden="true">${i + 1}</span>`
    : `<button type="button" class="step__n" aria-label="Show step ${i + 1} in the recording">${i + 1}</button>`}<p>${bx(html, ffHtml)}</p></li>`;
}).join('')}
    </ol>`;

// The page's peak: the steps beside the recording, scrubbed by the wheel on
// desktop (viaduct/assets/guide.js plays it on phones). `note` says what the
// recording shows when it isn't the page's own extension. No dwell: a dwell
// slows the clip while the stage is pinned, which is where every step's moment
// has to land for the steps to track it and for a step's button to reach it.
// `kind` is a VIDEOS key or a recording of the same shape.
// `ff` is the Firefox version: { heading, steps, note, video }. Its recording
// rides on the same elements as data-ff-* attributes, which
// viaductBrowser.swap() copies over before the engine reads them, so each
// version only ever fetches its own clip. The two posters are a lazy pair for
// the same reason: a lazy image that isn't displayed is never fetched.
const demoAct = (heading, kind, steps, note, ff = {}) => {
  const v = typeof kind === 'string' ? VIDEOS[kind] : kind;
  const f = ff.video;
  if (ff.steps && (ff.steps.length !== steps.length || ff.steps.some(([, t], i) => (t == null) !== (steps[i][1] == null)))) {
    throw new Error(`"${heading}": the Firefox steps don't line up with the Safari ones`);
  }
  const base = (r) => `/viaduct/assets/${r.file}`;
  const ffNote = ff.note === undefined ? note : ff.note;
  const caption = (text, only) => (text ? `<figcaption${only ? ` data-for="${only}"` : ''}>${text}</figcaption>` : '');
  return `
<section class="demo" data-demo data-sc-act="scrub" data-sc-span="2.4"${v.travel ? ' data-sc-clip-map="travel"' : ''} data-phone-ar="${v.phone[0]} / ${v.phone[1]}" aria-labelledby="demo-h" style="--ar:${v.w} / ${v.h}"${f ? ` data-ff data-ff-data-sc-clip-map="${f.travel ? 'travel' : 'full'}" data-ff-data-phone-ar="${f.phone[0]} / ${f.phone[1]}" data-ff-style="--ar:${f.w} / ${f.h}"` : ''}>
  <div class="demo__stage" data-sc-stage>
    <h2 id="demo-h">${bx(heading, ff.heading)}</h2>
    ${stepsList(steps, ff.steps)}
    <figure class="frame demo__frame"><div class="demo__slot">
      <img class="sc-stage__poster"${f ? ' data-for="safari" loading="lazy"' : ''} src="${base(v)}-poster.webp" width="${v.w}" height="${v.h}" alt="" />${f ? `
      <img class="sc-stage__poster" data-for="firefox" loading="lazy" src="${base(f)}-poster.webp" width="${f.w}" height="${f.h}" alt="" />` : ''}
      <video data-sc-scrub data-sc-src="${base(v)}.mp4" data-sc-src-mobile="${base(v)}-phone.mp4" data-poster="${base(v)}-poster.webp" data-phone-poster="${base(v)}-phone-poster.webp" width="${v.w}" height="${v.h}" muted playsinline aria-label="${esc(v.label)}"${f ? ` data-ff data-ff-data-sc-src="${base(f)}.mp4" data-ff-data-sc-src-mobile="${base(f)}-phone.mp4" data-ff-data-poster="${base(f)}-poster.webp" data-ff-data-phone-poster="${base(f)}-phone-poster.webp" data-ff-width="${f.w}" data-ff-height="${f.h}" data-ff-aria-label="${esc(f.label)}"` : ''}></video>
    </div>${note === ffNote ? caption(note) : caption(note, 'safari') + caption(ffNote, 'firefox')}</figure>
  </div>
</section>`;
};

// The first step of every demonstration, which the recordings don't show.
const setupStep = (rest) => [`<strong><a href="/viaduct/">Get Viaduct</a> and run its setup.</strong> ${rest}`, null];

// The price, said once, in the one place on each page a reader looks for it.
const PRICE_FAQ = ['What does Viaduct cost?',
  'The first 2 conversions are free, and Viaduct removes them after 7 days. A Safari or Firefox license costs $19 once, converts as many as you like in that browser and keeps them installed. Mixed covers both for $29.'];

// These pages run no inline JavaScript: the scripts are the first-party
// /assets/footer.js, /assets/attribution.js, /assets/analytics.js and
// /viaduct/assets/nav.js, plus the Umami tracker analytics.js loads from
// cloud.umami.is, which reports to gateway.umami.is. The fonts are the site's
// own (/assets/fonts.css). frame-ancestors is ignored when a policy arrives via
// <meta>, so framing is not covered here.
const CSP = "default-src 'self'; script-src 'self' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://gateway.umami.is; form-action 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; upgrade-insecure-requests";

// Social card: one image for the whole section, cropped to the 1.91:1 the
// scrapers want. JPEG rather than the .webp hero because several scrapers still
// refuse to render WebP cards.
const OG_IMAGE = `${SITE}/viaduct/assets/viaduct-og.jpg`;
const OG_IMAGE_W = 1200;
const OG_IMAGE_H = 630;

// The homepage defines this node; the pages here point at it by @id and keep the
// name and url so each block still stands on its own.
const ORG = { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Magicelk Labs', url: `${SITE}/` };

// [name, url] pairs, root first. The last crumb is the page itself and has no url.
const breadcrumbs = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(item && { item }) })),
});

// Escaping "<" keeps a stray "</script>" inside any interpolated string from
// closing the block early.
const ldjson = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

// `demo`: the page has a demonstration, so it loads the scroll-craft engine's
// stylesheet here and the engine with guide.js at the end of the body.
// `ffTitle`: the tab title for the Firefox version, which nav.js applies. The
// <title> itself stays the Safari one, the one that gets indexed.
function head({ title, ffTitle, description, canonical, imageAlt, jsonld, css = '', demo = false }) {
  return `<!DOCTYPE html>
<html lang="en" data-browser="safari">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${CSP}" />
<script src="/viaduct/assets/browser.js?v=1"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>${ffTitle ? `
<meta name="viaduct-title-firefox" content="${esc(ffTitle)}" />` : ''}
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
<link rel="preload" href="/assets/fonts/cabinet-grotesk-800.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/assets/fonts.css?v=1" />
<link rel="stylesheet" href="/viaduct/assets/nav.css?v=4" />${demo ? `
<link rel="stylesheet" href="/viaduct/assets/scrollcraft.css?v=2" />` : ''}
<style>${CSS}${css}</style>
<script type="application/ld+json">
${ldjson(jsonld)}
</script>
<script defer src="/assets/analytics.js"></script>
</head>`;
}

// `updated` is the ISO date the page prints at its foot, beside the trademark
// note; the hub, which has no date, passes none.
function chrome(inner, updated) {
  const demo = inner.includes('data-demo');
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
      <a href="/viaduct/#pricing" class="btn-teal btn-sm">Buy</a>
    </div>
  </nav>
</header>
<main class="wrap">
${inner}
<div class="meta">${updated ? `
  <p>Updated <time datetime="${updated}">${longDate(updated)}</time></p>` : ''}
  <p>All extension names are trademarks of their respective owners. Viaduct is not affiliated with or endorsed by the developers of the extensions listed here, nor by Apple, Google or Mozilla. Viaduct converts extensions locally on your Mac; nothing is redistributed.</p>
</div>
</main>
<div id="site-footer"></div>
<script src="/assets/footer.js" data-product="Viaduct" data-links-only="1" data-links="Viaduct|/viaduct/, All extensions|/viaduct/extensions/, How it works|/viaduct/#how, Privacy|/viaduct/privacy.html, Terms|/viaduct/terms.html"></script>
<noscript>
  <footer style="border-top:1px solid var(--hair);padding:40px 0 56px;font-size:14px;color:var(--mute)">
    <div style="max-width:1080px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:16px">
      <span style="font-family:'Cabinet Grotesk','Inter',sans-serif;font-size:16px;color:var(--ink)"><a href="/" style="color:inherit;text-decoration:none">Magicelk Labs</a> · Viaduct <span style="color:var(--mute);font-family:Inter,sans-serif;font-size:13px">· © 2026</span></span>
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
<script src="/viaduct/assets/nav.js?v=4"></script>
<script src="/assets/attribution.js"></script>${demo ? `
<script src="/viaduct/assets/browser-swap.js?v=1"></script>
<script src="/viaduct/assets/scrollcraft.js?v=2"></script>
<script src="/viaduct/assets/guide.js?v=2"></script>` : ''}
</body>
</html>`;
}

function extensionPage(x) {
  const store = x.offStore ? x.offStore.url : STORE(x.id);
  const canonical = `${SITE}/viaduct/extensions/${x.slug}/`;
  const updated = lastmod(canonical);
  const h1 = x.h1 || `Run ${x.name} in Safari`;
  const title = `${h1} · Viaduct`;
  const status = !x.official ? 'has no official Safari version'
    : x.official.paid ? 'has a paid official Safari version'
    : x.official.port ? 'has an official Safari port'
    : 'has an official Safari option';
  // Built from the extension's own fields. Past 160 characters the desc goes,
  // so the part that says what happens in Safari survives the snippet.
  const tail = x.limit ? x.limit[1]
    : x.official ? `Or run the ${x.official.paid ? 'free ' : ''}Chrome version with Viaduct.`
    : 'Viaduct converts the Chrome version for Safari.';
  const full = `${x.name}, ${x.desc}, ${status}. ${tail}`;
  const description = x.summary || (full.length <= 160 ? full : `${x.name} ${status}. ${tail}`);

  // The card image is Viaduct's own window, so the alt describes that, but names
  // the extension this page is about so no two pages ship the same string.
  const imageAlt = `The Viaduct app window on macOS, its drop target ready to convert the ${x.name} Chrome extension into a native Safari extension`;

  // TechArticle: this page is a how-to for one extension. dateModified is the
  // date the page prints as "Updated"; no author names and no ratings, because
  // nothing on the page sources them.
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: h1,
        description,
        url: canonical,
        inLanguage: 'en-US',
        image: OG_IMAGE,
        dateModified: updated,
        author: ORG,
        publisher: ORG,
        about: {
          '@type': 'SoftwareApplication',
          name: x.name,
          description: blurb(x),
          applicationCategory: 'BrowserApplication',
          url: store,
        },
      },
      breadcrumbs([['Viaduct', `${SITE}/viaduct/`], ['Extensions', `${SITE}/viaduct/extensions/`], [x.name]]),
    ],
  };

  // One sentence under the headline: the limit when there is one, otherwise
  // where it stands against its developer's own Safari version.
  const lede = x.limit ? esc(x.limit[1])
    : x.official?.paid ? `${esc(x.name)} has a paid Safari version. Viaduct runs the free Chrome one instead.`
    : x.official?.port ? 'Its developer makes a Safari version too. Viaduct runs the Chrome one you already know.'
    : x.official ? 'Viaduct converts the Chrome version into a Safari extension on your Mac.'
    : 'It has no Safari version. Viaduct converts the Chrome one into a Safari extension on your Mac.';

  // The Firefox version of the page. Its facts come from x.firefox and from the
  // app's Firefox setup; the title, description and JSON-LD stay Safari's,
  // which is the version crawlers are served.
  const f = x.firefox || {};
  const ffH1 = f.h1 || `Run ${x.name} in Firefox`;
  const ffLede = f.limit ? esc(f.limit[1])
    : f.official ? `${esc(x.name)} has its own Firefox add-on. Viaduct converts the Chrome version when that's the one you want.`
    : 'It has no Firefox add-on. Viaduct converts the Chrome one into an add-on that stays installed after Firefox quits.';

  // Off the store, the package comes from the developer and gets dropped on
  // Viaduct; on it, the store's "Add to Safari" or "Add to Firefox" button
  // does the work. The times are where each step starts in the recording.
  const prompt = x.official?.prompt;
  const own = ownRecording(x);
  const kind = x.offStore ? 'drop' : 'store';
  const rec = own || VIDEOS[kind];
  const ffOwn = ffRecording(x);
  const ffVideo = ffOwn || FF_VIDEOS[kind];
  const ffAt = (ffVideo || rec).at;
  const steps = x.offStore ? [
    setupStep('It walks you through installing Xcode (free) and signing in to it with any Apple ID.'),
    [`<strong>Download the .zip from <a href="${store}" rel="noopener">${esc(x.offStore.label)}</a>.</strong> It's no longer on the Chrome Web Store.`, null],
    ['<strong>Drop the .zip on Viaduct and click Convert &amp; Install.</strong> Building and signing takes a minute or two.', rec.at.drop],
    ['<strong>Switch it on</strong> in Safari → Settings → Extensions.', rec.at.on],
  ] : [
    setupStep('It walks you through installing Xcode (free), signing in to it with any Apple ID and turning on the Add to Safari button.'),
    [`<strong>Open <a href="${store}" rel="noopener">${esc(x.name)} on the Chrome Web Store</a> in Safari.</strong>`, rec.at.open],
    [`<strong>Click Add to Safari${prompt ? ', then Convert Anyway' : ''}.</strong> ${prompt ? 'Viaduct first offers the official Safari version, then ' : 'Viaduct '}downloads, converts and signs it.`, rec.at.click],
    ["<strong>Switch it on</strong> in Safari → Settings → Extensions, and it's in your toolbar.", rec.at.on],
  ];
  const ffSteps = x.offStore ? [
    setupStep('Choose Firefox, and it asks for Full Disk Access so it can reach your Firefox profile.'),
    steps[1],
    ['<strong>Set Browser to Firefox, drop the .zip on Viaduct and click Convert &amp; Install.</strong>', ffAt.drop],
    ["<strong>It's under Firefox's Extensions button.</strong> There's nothing to switch on, and it stays after Firefox quits.", ffAt.on],
  ] : [
    setupStep('Choose Firefox, and it asks for Full Disk Access and turns on the Add to Firefox button.'),
    [`<strong>Open <a href="${store}" rel="noopener">${esc(x.name)} on the Chrome Web Store</a> in Firefox.</strong>`, ffAt.open],
    ['<strong>Click Add to Firefox.</strong> Viaduct downloads and converts it.', ffAt.click],
    ["<strong>It's under Firefox's Extensions button.</strong> There's nothing to switch on, and it stays after Firefox quits.", ffAt.on],
  ];
  const note = own || x.slug === 'dark-reader' ? ''
    : x.offStore ? "Recorded with Dark Reader's .crx. A .zip goes the same way." : 'Recorded with Dark Reader. Every store install goes the same way.';
  const ffNote = !ffVideo ? IN_SAFARI[kind] : ffOwn || x.slug === 'dark-reader' ? '' : note;

  const off = x.official && x.official.label.match(/^(.*?)\s*\(([^)]*)\)$/);
  const officialAnswer = x.official && `Yes: <a href="${x.official.url}" rel="noopener">${esc(off ? off[1] : x.official.label)}</a>${off ? ` (${esc(off[2])}${x.official.paid ? ', paid' : ''})` : ''}. ${x.official.paid
    ? 'The Chrome version is free; buying the Safari one supports its developer.'
    : esc(x.official.note || (prompt ? 'Viaduct offers it before converting the Chrome one.' : ''))}`.trim();
  const ffOff = f.official && f.official.label.match(/^(.*?)\s*\(([^)]*)\)$/);
  const ffOfficialAnswer = f.official && `Yes: <a href="${f.official.url}" rel="noopener">${esc(ffOff ? ffOff[1] : f.official.label)}</a>${ffOff ? ` (${esc(ffOff[2])})` : ''}.${f.official.note ? ` ${esc(f.official.note)}` : ''}`;

  // The row about the extension itself in one browser: a breakage Viaduct
  // patches there, a screenshot of it running there, or both. The screenshot
  // waits for its file.
  const inBrowser = (name, o, only) => {
    const shot = o.shot && fs.existsSync(path.join(ROOT, o.shot.src)) ? o.shot : null;
    return o.fix || shot ? `
${ledger(`${esc(x.name)} in ${name}`, `${o.fix ? `    <p>${esc(o.fix)}</p>` : ''}${shot ? `
    <figure class="frame"><img src="${shot.src}" width="${shot.width}" height="${shot.height}" alt="${esc(shot.alt)}" loading="lazy" decoding="async" /></figure>` : ''}`, null, only)}` : '';
  };
  // faq: true on the Firefox side reuses the Safari question as it is.
  const ffFaq = f.faq === true ? x.faq : f.faq;

  return head({ title, ffTitle: `${ffH1} · Viaduct`, description, canonical, imageAlt, jsonld, demo: true }) + chrome(`${pageTop({
    crumbs: `<a href="/viaduct/">Viaduct</a> / <a href="/viaduct/extensions/">Extensions</a> / ${esc(x.name)}`,
    h1: bx(esc(h1), esc(ffH1)),
    lede: bx(lede, ffLede),
  })}
${demoAct('Install it', rec, steps, note, { steps: ffSteps, video: ffVideo, note: ffNote })}${inBrowser('Safari', x, 'safari')}${inBrowser('Firefox', f, 'firefox')}
${faqRow([
    ...faqPair(x.official && ['Does its developer make one for Safari?', officialAnswer],
      f.official && ['Does its developer make one for Firefox?', ffOfficialAnswer]),
    ...faqPair(x.limit && ["Why doesn't all of it work?", esc(x.limit[0])], f.limit && ["Why doesn't all of it work?", esc(f.limit[0])]),
    ...(x.faq && ffFaq === x.faq ? [[x.faq.q, esc(x.faq.a)]]
      : faqPair(x.faq && [x.faq.q, esc(x.faq.a)], ffFaq && [ffFaq.q, esc(ffFaq.a)])),
    ['Does it stay after Firefox quits?',
      "Yes. Firefox removes any add-on Mozilla didn't sign when it quits, so Viaduct loads yours again each time Firefox opens, with its settings. Viaduct has to stay on in Login Items for that.", 'firefox'],
    ['Is it the real extension, or a clone?', `The real one. Viaduct ${x.offStore
      ? 'converts the package its developers publish'
      : 'downloads the same package Chrome installs from the Web Store'} and adds fixes where ${bx('Safari', 'Firefox')} behaves differently.`],
    ['Will it update itself?', x.offStore
      ? "Not by itself. Viaduct's weekly update check only covers Chrome Web Store installs, so drop each new release on Viaduct yourself."
      : "With a license, yes. Turn on Update Chrome Web Store extensions weekly in Viaduct's settings, and it rebuilds the extension when the store has a new version."],
    PRICE_FAQ,
  ])}
${moreLine([
    ...related(x).map((y) => [y.name, `/viaduct/extensions/${y.slug}/`]),
    [GENERAL.crumb, `/viaduct/extensions/${GENERAL.slug}/`],
    ['every extension', '/viaduct/extensions/'],
  ])}`, updated);
}

// The general guide: what Safari will load, and the three ways to get a Chrome
// extension into it. Apple's packager is described only as Apple's own page
// (APPLE_PACKAGER) documents it; the Viaduct facts come from the same sources
// as the extension guides.
const GENERAL = {
  slug: 'chrome-extensions-in-safari',
  h1: 'How to use Chrome extensions in Safari',
  crumb: 'Chrome extensions in Safari',
};
const APPLE_PACKAGER = 'https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari';
const APPLE_COMPAT = 'https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility';
const APPLE_RUNNING = 'https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension';
const APPLE_ACCOUNT = 'https://developer.apple.com/help/account/basics/about-your-developer-account';

// Topic guides under /viaduct/guides/<slug>/: questions people search for that
// aren't about one extension. Same sourcing rule as EXTENSIONS: Viaduct facts
// from the app as it ships (../viaduct-app) and its media kit, never the CLI;
// Safari and Apple facts from Apple's documentation, linked where they're used.
//
// crumb    = the short name in the breadcrumb and in guide lists.
// title    = the <title> when it should differ from h1 (the search phrase).
// demo     = [heading, recording (a VIDEOS key), steps, note]: the page's peak.
// sections = [heading, HTML body] pairs after it, one ledger row each.
// faqs     = [question, HTML answer] pairs.
// firefox  = the Firefox version of the guide: h1, lede, demo ([heading,
//            steps, note], on the same recording key), and sections and faqs
//            keyed by the Safari heading or question they stand in for. There,
//            a string or [question, answer] is the Firefox wording and false
//            leaves it out of the Firefox version; anything not named is
//            shared. 'safari-only' marks a guide about Safari itself: Firefox
//            visitors get one line pointing at Viaduct for Firefox.
const { store: ST, drop: DR, batch: BA } = Object.fromEntries(Object.entries(VIDEOS).map(([k, v]) => [k, v.at]));
// Step times on whatever the Firefox version plays: its own recording once it
// exists, the Safari one until then.
const { store: FST, drop: FDR, batch: FBA } = Object.fromEntries(Object.keys(VIDEOS).map((k) => [k, (FF_VIDEOS[k] || VIDEOS[k]).at]));
const BATCH_NOTE = 'Recorded converting TWP. Import from Chrome converts each of yours the same way.';
const FF_SETUP = setupStep('Choose Firefox, and it asks for Full Disk Access so it can reach your Firefox profile.');
const FF_DONE = "<strong>It's under Firefox's Extensions button.</strong> There's nothing to switch on, and it stays after Firefox quits.";
const FF_TEMPORARY = 'https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/';

const GUIDES = [
  {
    slug: 'safari-extension-7-day-limit',
    h1: 'Why your Safari extension stops working after 7 days',
    crumb: 'The 7-day limit',
    description: 'Safari forgets Allow unsigned extensions every time it quits, and a free Apple ID signs in 7-day periods. What each limit does, and how Viaduct signs.',
    lede: "Two different limits turn off an extension that didn't come from the App Store. One resets every time Safari quits. The other runs on a 7-day clock.",
    demo: ['Keep it switched on', 'store', [
      setupStep('It walks you through installing Xcode, which is free.'),
      ['<strong>Add your Apple ID in Xcode → Settings → Accounts.</strong> A free one works. Signing in under System Settings is a different thing.', null],
      ["<strong>Click Add to Safari</strong> on the extension's store page. Viaduct signs it with that Apple ID.", ST.click],
      ['<strong>Switch it on.</strong> Signed, it stays on after Safari quits.', ST.on],
    ]],
    sections: [
      ['Safari forgets the setting', `
    <p>Without an Apple signature, an extension only loads while Allow unsigned extensions is on in Safari → Settings → Developer, and <a href="${APPLE_RUNNING}" rel="noopener">Apple's documentation</a> says that setting "resets when you quit Safari". Add Temporary Extension lasts even less: 24 hours, or until you quit.</p>`],
      ['A free Apple ID signs for 7 days', `
    <p><a href="${APPLE_ACCOUNT}" rel="noopener">Apple's account help</a> gives a free Apple ID's personal team 10 app IDs and provisioning profiles that "expire 7 days from issuance". Apple writes that about installing apps on a device and doesn't say how it applies to Safari extensions on a Mac. If a converted extension ever stops loading, convert it again from Recently converted in Viaduct's window.</p>`],
    ],
    faqs: [
      ['Xcode says I have no signing certificate',
        'Xcode makes one only when you ask. In Xcode → Settings → Accounts, select your Apple ID, click Manage Certificates, click + and choose Apple Development. Then convert again.'],
      ['What if I convert without an Apple ID in Xcode?',
        'Viaduct warns you first. If you convert anyway, the extension has no signature, and Safari turns it off every time it quits.'],
      ["Is this the 7 days Viaduct's free plan mentions?",
        "No, that one is Viaduct's own: the free plan converts 2 extensions and removes them after 7 days, however they're signed. A Safari license is $19 once and keeps them."],
    ],
    firefox: 'safari-only',
  },
  {
    slug: 'chrome-extension-to-safari-converter',
    h1: 'Convert any Chrome extension to Safari',
    title: 'Chrome extension to Safari converter for Mac',
    crumb: 'Chrome to Safari converter',
    description: 'Viaduct turns a Chrome extension from the Web Store, a file or your Chrome profile into a signed Safari extension and installs it. The steps, recorded.',
    lede: 'Viaduct is a Mac app that converts a Chrome extension, builds and signs it with Xcode, and installs it in Safari.',
    demo: ['Convert one', 'drop', [
      setupStep('It walks you through installing Xcode (free) and signing in to it with any Apple ID.'),
      ['<strong>Drop the extension on Viaduct.</strong> A .zip, a .crx or an unpacked folder. Viaduct checks it before converting.', DR.drop],
      ['<strong>Click Convert &amp; Install.</strong> Building and signing takes a minute or two.', DR.convert],
      ['<strong>Switch it on</strong> in Safari → Settings → Extensions.', DR.on],
    ]],
    sections: [
      ['Other ways in', `
    <p>From the Chrome Web Store it's one click: once Viaduct is set up, Add to Safari sits where Add to Chrome was. For the extensions you already use, <a href="/viaduct/guides/move-chrome-extensions-to-safari/">Import from Chrome</a> converts them in one batch.</p>`],
      ['What it fixes', `
    <p>Safari runs most of Chrome's extension APIs, but some behave differently. Viaduct patches the differences it knows about, which is why <a href="/viaduct/extensions/dark-reader/">Dark Reader's</a> popup buttons work after conversion. Features built on something Safari doesn't have still won't work: converted <a href="/viaduct/extensions/ublock-origin/">uBlock Origin</a> hides ads but can't stop them loading.</p>`],
    ],
    faqs: [
      ['Do I need Xcode?',
        'Yes. Safari only runs extensions that Xcode has built and signed. Xcode is free, and Viaduct drives it for you, so you never build anything in it yourself.'],
      ['Does Viaduct upload my extension anywhere?',
        'No. It downloads from the Chrome Web Store when you install from there, and converts on your Mac.'],
      PRICE_FAQ,
    ],
    firefox: {
      h1: 'Convert any Chrome extension to Firefox',
      lede: 'Viaduct is a Mac app that converts a Chrome extension into a Firefox add-on, installs it, and keeps it there after Firefox quits.',
      demo: ['Convert one', [
        FF_SETUP,
        ['<strong>Set Browser to Firefox and drop the extension on Viaduct.</strong> A .zip, a .crx or an unpacked folder. Viaduct checks it before converting.', FDR.drop],
        ['<strong>Click Convert &amp; Install.</strong> Firefox needs no Xcode build and no signing.', FDR.convert],
        [FF_DONE, FDR.on],
      ]],
      sections: {
        'Other ways in': `
    <p>From the Chrome Web Store it's one click: once Viaduct is set up, Add to Firefox sits where Add to Chrome was. For the extensions you already use, <a href="/viaduct/guides/move-chrome-extensions-to-safari/">Import from Chrome</a> converts them in one batch.</p>`,
        'What it fixes': `
    <p>Firefox runs most of Chrome's extension APIs, but some are missing or behave differently. Viaduct patches the differences it knows about, which is why <a href="/viaduct/extensions/tampermonkey/">Tampermonkey</a> finds <code>chrome.runtime.id</code> where its user scripts run. Features built on something Firefox doesn't give add-ons, such as web push, still won't work.</p>`,
      },
      faqs: {
        'Do I need Xcode?': ['Do I need Xcode?',
          'No. Xcode is only for Safari. For Firefox, Viaduct needs Full Disk Access and has to stay on in Login Items, so it can load your add-ons each time Firefox opens.'],
      },
    },
  },
  {
    slug: 'move-chrome-extensions-to-safari',
    h1: 'Move your Chrome extensions to Safari',
    crumb: 'Move from Chrome',
    description: 'Switching from Chrome or Brave? Viaduct lists the extensions in every profile, converts the ones you pick for Safari and brings their settings along.',
    lede: 'Viaduct reads the extensions you already have in Chrome and other Chromium browsers, converts the ones you pick and brings their settings along.',
    demo: ['Move them over', 'batch', [
      setupStep('When it asks to read your browsers, click Allow Access.'),
      ['<strong>Choose File → Import from Chrome.</strong> It lists the extensions in Chrome, Brave, Edge, Arc, Vivaldi and Opera, profile by profile.', null],
      ['<strong>Tick the ones you want and click Convert.</strong> Their saved settings come along.', BA.convert],
      ['<strong>Switch them on.</strong> When the batch finishes, click Open Safari Settings.', BA.on],
    ], BATCH_NOTE],
    sections: [
      ['What stays behind', `
    <p>Themes and Chrome apps aren't listed. An extension with an official Safari version starts unticked, with a link to that version. Some rely on Chrome features Safari doesn't have, like <a href="/viaduct/extensions/xbrowsersync/">xBrowserSync</a>, which can't reach Safari's bookmarks. <a href="/viaduct/extensions/">The extension list</a> shows the known limits.</p>`],
    ],
    faqs: [
      ['What about bookmarks, history and passwords?',
        'Safari imports those itself from File → Import From Browser → Google Chrome, as <a href="https://support.apple.com/guide/safari/import-bookmarks-and-passwords-ibrw1015/mac" rel="noopener">Apple describes</a>.'],
      ['Can I move them all on the free plan?',
        'Two of them, kept for 7 days. A Safari license is $19 once and converts the rest, and the import list shows how many of your picks need it.'],
      ['Moving to a new Mac too?',
        "In Viaduct, Settings → Extensions → Move to another Mac exports everything you've converted as one file. Import it on the new Mac and Viaduct converts them again there."],
    ],
    firefox: {
      h1: 'Move your Chrome extensions to Firefox',
      lede: 'Viaduct reads the extensions you already have in Chrome and other Chromium browsers, converts the ones you pick into Firefox add-ons and brings their settings along.',
      demo: ['Move them over', [
        setupStep('Choose Firefox. When it asks to read your browsers, click Allow Access.'),
        ['<strong>Choose File → Import from Chrome and set its picker to Firefox.</strong> It lists the extensions in Chrome, Brave, Edge, Arc, Vivaldi and Opera, profile by profile.', null],
        ['<strong>Tick the ones you want and click Convert.</strong> Their saved settings come along.', FBA.convert],
        ["<strong>Click Open Firefox</strong> when the batch finishes. They're under the Extensions button, with nothing to switch on.", FBA.on],
      ], BATCH_NOTE],
      sections: {
        'What stays behind': `
    <p>Themes and Chrome apps aren't listed. Some extensions rely on Chrome features Firefox doesn't give add-ons. <a href="/viaduct/extensions/">The extension list</a> shows the known limits.</p>`,
      },
      faqs: {
        'What about bookmarks, history and passwords?': ['What about bookmarks, history and passwords?',
          'Firefox imports those itself from Settings → General → Import Browser Data, as <a href="https://support.mozilla.org/en-US/kb/import-bookmarks-google-chrome" rel="noopener">Mozilla describes</a>. For an extension that has a Firefox add-on, that import installs the add-on.'],
        'Can I move them all on the free plan?': ['Can I move them all on the free plan?',
          'Two of them, kept for 7 days. A Firefox license is $19 once and converts the rest, and the import list shows how many of your picks need it.'],
      },
    },
  },
  {
    slug: 'install-crx-file-mac',
    h1: 'Install a .crx file or unpacked extension in Safari on Mac',
    crumb: 'Install a .crx file',
    description: "Safari can't open a .crx file. Viaduct converts a .crx, a .zip or an unpacked extension folder into a Safari extension on your Mac and installs it.",
    lede: "Safari can't open a .crx. Viaduct converts it into a Safari extension and installs it, and does the same for a .zip or an unpacked folder.",
    demo: ['Install it', 'drop', [
      setupStep('It walks you through installing Xcode (free) and signing in to it with any Apple ID.'),
      ['<strong>Drop the .crx, .zip or folder on Viaduct.</strong> Any folder with a <code>manifest.json</code> in it works.', DR.drop],
      ['<strong>Click Convert &amp; Install.</strong> Building and signing takes a minute or two.', DR.convert],
      ['<strong>Switch it on</strong> in Safari → Settings → Extensions.', DR.on],
    ]],
    sections: [
      ['What a .crx is', `
    <p>It's how the Chrome Web Store ships an extension: a zip of its files with a signature header on the front. Safari only runs extensions packaged inside a Mac app that Xcode has built and signed, so a <code>.crx</code> has to be converted first.</p>`],
      ['From GitHub', `
    <p>Download the project's release <code>.zip</code>, or the repository from Code → Download ZIP, and drop that on Viaduct; it finds the <code>manifest.json</code> inside. If the repository only gets one once it's built, run its build steps first and drop the folder they produce.</p>`],
    ],
    faqs: [
      ['Can Safari load it without converting?',
        'Only to test it: with its developer features on, Settings → Developer → Add Temporary Extension loads a folder or .zip, and Safari removes it after 24 hours or when you quit.'],
      ['Will it update itself?',
        'No. A file has nothing to check for updates, so drop each new version on Viaduct. Extensions installed from the Chrome Web Store can update weekly with a license.'],
      PRICE_FAQ,
    ],
    firefox: {
      h1: 'Install a .crx file or unpacked extension in Firefox on Mac',
      lede: "Firefox can't install a .crx. Viaduct converts it into a Firefox add-on and installs it, and does the same for a .zip or an unpacked folder.",
      demo: ['Install it', [
        FF_SETUP,
        ['<strong>Set Browser to Firefox and drop the .crx, .zip or folder on Viaduct.</strong> Any folder with a <code>manifest.json</code> in it works.', FDR.drop],
        ['<strong>Click Convert &amp; Install.</strong> Firefox needs no Xcode build and no signing.', FDR.convert],
        [FF_DONE, FDR.on],
      ]],
      sections: {
        'What a .crx is': `
    <p>It's how the Chrome Web Store ships an extension: a zip of its files with a signature header on the front. Firefox only keeps add-ons Mozilla has signed, and a <code>.crx</code> isn't one, so it has to be converted first.</p>`,
      },
      faqs: {
        'Can Safari load it without converting?': ['Can Firefox load it without converting?',
          `Only for a while. <a href="${FF_TEMPORARY}" rel="noopener">Load Temporary Add-on</a> in about:debugging loads an unpacked extension until you restart Firefox, and Firefox doesn't run a Chrome service worker background as it is.`],
      },
    },
  },
  {
    slug: 'safari-web-extension-converter-alternative',
    h1: "An alternative to Apple's Safari extension converter",
    title: "An alternative to Apple's safari-web-extension-converter",
    crumb: "Apple's converter, compared",
    description: "Apple's safari-web-extension-converter gives you an Xcode project to build, sign and fix. Viaduct converts, signs and installs a Chrome extension in one go.",
    lede: "Apple's tool, now called safari-web-extension-packager, wraps an extension in an Xcode project. Building it, signing it and fixing what Safari runs differently is left to you.",
    css: '.ways.vs thead th { width:37%; } .ways.vs thead th:first-child { width:26%; }',
    demo: ['Viaduct does all of it', 'drop', [
      setupStep('It walks you through installing Xcode (free) and signing in to it with any Apple ID.'),
      ["<strong>Drop the extension's folder on Viaduct.</strong> Or its .zip or .crx.", DR.drop],
      ["<strong>Click Convert &amp; Install.</strong> Viaduct runs Apple's packager, patches what Safari handles differently, then builds and signs the app.", DR.convert],
      ["<strong>Switch it on.</strong> It's installed in Safari, with no Xcode project to keep.", DR.on],
    ]],
    sections: [
      ["What Apple's tool does", `
    <p>It comes with Xcode. Run it in Terminal on the extension's folder:</p>
    <pre><code>xcrun <span class="nw">safari-web-extension-packager</span> /path/to/extension</code></pre>
    <p>It used to be called <code>safari-web-extension-converter</code>. It creates an Xcode project with a Mac or iOS app that installs the extension, and warns about manifest keys Safari doesn't support, as <a href="${APPLE_PACKAGER}" rel="noopener">Apple's guide</a> explains.</p>`],
      ['Side by side', `
    <table class="ways vs">
      <thead><tr><th scope="col"><span class="sr">Step</span></th><th scope="col">Apple's packager</th><th scope="col">Viaduct</th></tr></thead>
      <tbody>${[
        ['Building', 'You open the project and build it in Xcode', 'Builds it with Xcode in the background'],
        ['Signing', 'You choose a team in Xcode', 'Signs with the Apple ID you added to Xcode'],
        ['APIs Safari handles differently', 'Warns about manifest keys and leaves the code as it is', 'Patches them while the extension runs'],
        ['Platforms', 'Mac and iOS', 'Mac only'],
        ['Sharing it', 'Yes, with an Apple Developer Program membership', 'No, it builds for your own Mac'],
      ].map(([step, apple, viaduct]) => `
        <tr><th scope="row">${esc(step)}</th><td data-label="Apple's packager">${esc(apple)}</td><td data-label="Viaduct">${esc(viaduct)}</td></tr>`).join('')}
      </tbody>
    </table>`],
    ],
    faqs: [
      ['Which one should I use?',
        "To publish an extension for other people, Apple's packager and the Apple Developer Program. To run a Chrome extension in your own Safari without keeping an Xcode project, Viaduct."],
      ['Can I get the Xcode project?', "No, Viaduct doesn't hand you one. Use Apple's packager when you want a project to edit."],
      ['Does it convert Manifest V2 extensions?', 'Yes, both V2 and V3.'],
      PRICE_FAQ,
    ],
    firefox: 'safari-only',
  },
  {
    slug: 'arc-to-safari',
    h1: 'Moving from Arc to Safari, extensions included',
    crumb: 'Arc to Safari',
    description: 'Arc stops working on December 22, 2026. Viaduct reads the extensions in your Arc profiles and converts them for Safari, with their settings.',
    lede: "Arc stops working on December 22, 2026. Viaduct converts its extensions for Safari straight from your Arc profile, settings and all.",
    demo: ['Bring its extensions over', 'batch', [
      setupStep('When it asks to read your browsers, click Allow Access.'),
      ['<strong>Choose File → Import from Chrome.</strong> Arc is listed with each of its profiles.', null],
      ['<strong>Tick the extensions and click Convert.</strong> The settings they saved in Arc come along.', BA.convert],
      ['<strong>Switch them on.</strong> When the batch finishes, click Open Safari Settings.', BA.on],
    ], BATCH_NOTE],
    sections: [
      ["What's happening to Arc", `
    <p>The Browser Company announced on October 22, 2026 that Arc for Mac and Windows stops working on December 22, and it's pointing Arc users to Dia. <a href="https://resources.arc.net/hc/en-us/articles/44412972248471-Arc-Sunset-Key-Dates-and-What-to-Expect" rel="noopener">Arc's own timeline</a> has the dates for exporting your data.</p>`],
    ],
    faqs: [
      ['Does Arc have to be open?', "No. Viaduct reads Arc's profile folder on your Mac."],
      ['Will every Arc extension work in Safari?',
        'Most will. Some rely on Chrome features Safari doesn\'t have, and <a href="/viaduct/extensions/">the extension list</a> shows the known ones.'],
      ['What about bookmarks and passwords?',
        'Safari imports those directly only from Chrome and Firefox. Viaduct moves extensions, not browsing data.'],
      PRICE_FAQ,
    ],
    firefox: 'safari-only',
  },
];

const guideLinks = (gs) => gs.map((g) => [g.crumb, `/viaduct/guides/${g.slug}/`]);

function guidePage(g) {
  const canonical = `${SITE}/viaduct/guides/${g.slug}/`;
  const updated = lastmod(canonical);
  const title = `${g.title || g.h1} · Viaduct`;
  const i = GUIDES.indexOf(g);
  const others = [...GUIDES.slice(i + 1), ...GUIDES.slice(0, i)].slice(0, 3);
  const f = typeof g.firefox === 'object' ? g.firefox : null;
  const [heading, kind, steps, note] = g.demo;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: g.h1,
        description: g.description,
        url: canonical,
        inLanguage: 'en-US',
        image: OG_IMAGE,
        dateModified: updated,
        author: ORG,
        publisher: ORG,
        about: { '@type': 'SoftwareApplication', name: 'Safari', applicationCategory: 'BrowserApplication', operatingSystem: 'macOS' },
        mentions: { '@type': 'SoftwareApplication', '@id': `${SITE}/viaduct/#app`, name: 'Viaduct', url: `${SITE}/viaduct/` },
      },
      breadcrumbs([['Viaduct', `${SITE}/viaduct/`], [g.crumb]]),
    ],
  };

  return head({
    title,
    ffTitle: f ? `${f.h1} · Viaduct` : '',
    description: g.description,
    canonical,
    imageAlt: `The Viaduct app window on macOS, which converts Chrome extensions for Safari. Guide: ${g.h1}`,
    jsonld,
    css: g.css,
    demo: true,
  }) + chrome(`${pageTop({
    crumbs: `<a href="/viaduct/">Viaduct</a> / ${esc(g.crumb)}`,
    h1: bx(esc(g.h1), f && esc(f.h1)),
    lede: bx(esc(g.lede), f && esc(f.lede)),
    aside: g.firefox === 'safari-only' ? SAFARI_ONLY : '',
  })}
${demoAct(heading, kind, steps, note, f ? ffDemo(kind, f.demo[0], f.demo[1], f.demo[2]) : {})}
${g.sections.map(([h, body]) => {
    const other = f?.sections?.[h];
    if (other === undefined) return ledger(esc(h), body);
    if (other === false) return ledger(esc(h), body, null, 'safari');
    return ledger(esc(h), `    <div data-for="safari">${body}
    </div>
    <div data-for="firefox">${other}
    </div>`);
  }).join('\n')}
${faqRow(g.faqs.flatMap((qa) => {
    const other = f?.faqs?.[qa[0]];
    return other === undefined ? [qa] : faqPair(qa, other);
  }))}
${moreLine([
    ...guideLinks(others),
    [GENERAL.crumb, `/viaduct/extensions/${GENERAL.slug}/`],
    ['guides for each extension', '/viaduct/extensions/'],
  ])}`, updated);
}

function generalPage() {
  const canonical = `${SITE}/viaduct/extensions/${GENERAL.slug}/`;
  const updated = lastmod(canonical);
  const title = `${GENERAL.h1} on a Mac · Viaduct`;
  const description = "Safari can't install from the Chrome Web Store. Three ways to run a Chrome extension in it: an official Safari version, Apple's Xcode packager, or Viaduct.";

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: GENERAL.h1,
        description,
        url: canonical,
        inLanguage: 'en-US',
        image: OG_IMAGE,
        dateModified: updated,
        author: ORG,
        publisher: ORG,
        about: { '@type': 'SoftwareApplication', name: 'Safari', applicationCategory: 'BrowserApplication', operatingSystem: 'macOS' },
        mentions: { '@type': 'SoftwareApplication', '@id': `${SITE}/viaduct/#app`, name: 'Viaduct', url: `${SITE}/viaduct/` },
      },
      breadcrumbs([['Viaduct', `${SITE}/viaduct/`], ['Extensions', `${SITE}/viaduct/extensions/`], [GENERAL.crumb]]),
    ],
  };

  // Each way: its name, then one cell per column in cols.
  const cols = ["Who it's for", 'What you need', 'What you get'];
  const ways = [
    ['An official Safari version', 'Anyone, if one exists',
      "The App Store, or the developer's site. Some are paid.",
      "The developer's own Safari build, which can differ from the Chrome one"],
    ["Apple's packager", 'Developers', "Xcode and the extension's files",
      "An Xcode project to build and sign yourself. Fixing what Safari doesn't support is up to you."],
    ['Viaduct', 'Everyone else', 'macOS 13 or later, and Xcode (free), which Viaduct runs for you',
      'The Chrome extension itself, converted, signed and installed, with fixes where Safari behaves differently'],
  ];
  const ffWays = [
    ['An official Firefox add-on', 'Anyone, if one exists',
      "addons.mozilla.org, or the developer's site",
      "The developer's own Firefox build, which can differ from the Chrome one"],
    ['Loading it yourself', 'Developers', "The extension's files, with a manifest Firefox accepts",
      'A temporary add-on that Firefox removes when it restarts'],
    ['Viaduct', 'Everyone else', 'macOS 13 or later, and Firefox',
      'The Chrome extension itself, converted and installed, with fixes where Firefox behaves differently. It stays after Firefox quits.'],
  ];
  const waysTable = (rows, only) => `    <table class="ways three" data-for="${only}">
      <thead><tr><th scope="col"><span class="sr">Way</span></th>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(([way, ...cells]) => `
        <tr><th scope="row">${esc(way)}</th>${cells.map((c, i) => `<td data-label="${esc(cols[i])}">${esc(c)}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>`;
  const ffH1 = 'How to use Chrome extensions in Firefox';

  const limited = andList(EXTENSIONS.filter((x) => x.limit)
    .map((x) => `<a href="/viaduct/extensions/${x.slug}/">${esc(x.name)}</a>`));

  return head({
    title,
    ffTitle: `${ffH1} on a Mac · Viaduct`,
    description,
    canonical,
    imageAlt: 'The Viaduct app window on macOS, its drop target ready to take a Chrome extension and make it run in Safari',
    jsonld,
    css: '.ways.three thead th { width:22%; } .ways.three thead th:nth-child(3) { width:24%; } .ways.three thead th:last-child { width:32%; }',
    demo: true,
  }) + chrome(`${pageTop({
    crumbs: `<a href="/viaduct/">Viaduct</a> / <a href="/viaduct/extensions/">Extensions</a> / ${esc(GENERAL.crumb)}`,
    h1: bx(esc(GENERAL.h1), esc(ffH1)),
    lede: bx("Safari can't install from the Chrome Web Store, but most Chrome extensions still run in it once they're packaged inside a Mac app. Viaduct does that from the store page.",
      "Firefox can't install from the Chrome Web Store, and it removes any add-on Mozilla didn't sign when it quits. Viaduct converts a Chrome extension from the store page and keeps it loaded."),
  })}
${demoAct('With Viaduct', 'store', [
    setupStep('It walks you through installing Xcode, signing in to it with any Apple ID and turning on the Add to Safari button.'),
    ['<strong>Open the extension\'s page on the <a href="https://chromewebstore.google.com/" rel="noopener">Chrome Web Store</a> in Safari.</strong>', ST.open],
    ['<strong>Click Add to Safari.</strong> Viaduct downloads, converts and signs it.', ST.click],
    ["<strong>Switch it on</strong> in Safari → Settings → Extensions, and it's in your toolbar.", ST.on],
  ], undefined, ffDemo('store', 'With Viaduct', [
    setupStep('Choose Firefox, and it asks for Full Disk Access and turns on the Add to Firefox button.'),
    ['<strong>Open the extension\'s page on the <a href="https://chromewebstore.google.com/" rel="noopener">Chrome Web Store</a> in Firefox.</strong>', FST.open],
    ['<strong>Click Add to Firefox.</strong> Viaduct downloads and converts it.', FST.click],
    [FF_DONE, FST.on],
  ]))}
${ledger('Three ways', `${waysTable(ways, 'safari')}
${waysTable(ffWays, 'firefox')}
    <p style="margin-top:20px" data-for="safari">Check for an official version first: <a href="/viaduct/extensions/">the extension list</a> shows which popular extensions have one. For Apple's packager, <a href="/viaduct/guides/safari-web-extension-converter-alternative/">the comparison</a> has the command.</p>
    <p style="margin-top:20px" data-for="firefox">Check for an official add-on first: <a href="/viaduct/extensions/">the extension list</a> shows which popular extensions have one. To load one yourself, <a href="${FF_TEMPORARY}" rel="noopener">Mozilla's guide</a> has the steps.</p>`)}
${faqRow([
    ...faqPair(["What won't work in Safari?",
      `Features built on an API Safari doesn't have, such as some sign-in flows or blocking network requests. Viaduct patches many differences, but that's why ${limited} only partly work.`],
    ["What won't work in Firefox?",
      "Features built on something Firefox doesn't give add-ons, such as web push or capturing a tab. Viaduct patches many other differences."]),
    ...faqPair(['Can Safari load an extension without an app?',
      "Only to test it. With Safari's developer features turned on, Settings → Developer → Add Temporary Extension loads a folder or .zip. Safari removes it after 24 hours or when you quit."],
    ['Can Firefox load an extension without Viaduct?',
      "Only for a while. Load Temporary Add-on in about:debugging loads an unpacked extension until you restart Firefox, and Firefox doesn't run a Chrome service worker background as it is."]),
    ...faqPair(['Does this work on iPhone or iPad?',
      "Viaduct is Mac only. On iPhone and iPad, Safari extensions come inside apps, so you need the official version from the App Store, or Apple's packager and an Apple Developer Program membership to build one yourself."],
    ['Does this work on iPhone or iPad?', 'No. Viaduct is Mac only.']),
    PRICE_FAQ,
  ])}
${namesRow('Extensions', EXTENSIONS.map((x) => [x.name, `/viaduct/extensions/${x.slug}/`]))}
${moreLine(guideLinks(GUIDES))}`, updated);
}

function hubPage() {
  const canonical = `${SITE}/viaduct/extensions/`;
  const groups = categories();
  const title = 'Chrome extensions you can run in Safari · Viaduct';
  const description = 'Popular Chrome extensions in Safari, with their official Safari versions, known limits and a guide for each: uBlock Origin, Tampermonkey, MetaMask and more.';
  // The general guide comes first on the page, then the extension guides, then
  // the topic guides.
  const items = [
    [GENERAL.h1, `${SITE}/viaduct/extensions/${GENERAL.slug}/`],
    ...groups.flatMap(([, xs]) => xs).map((x) => [x.h1 || `Run ${x.name} in Safari`, `${SITE}/viaduct/extensions/${x.slug}/`]),
    ...GUIDES.map((g) => [g.h1, `${SITE}/viaduct/guides/${g.slug}/`]),
  ];
  return head({
    title,
    ffTitle: 'Chrome extensions you can run in Firefox · Viaduct',
    description,
    canonical,
    imageAlt: 'The Viaduct app window on macOS, its drop target ready to convert a Chrome extension into a native Safari extension',
    // The hub is an index, not a guide, so it describes itself as a collection and
    // lists the guides it links to, in the order the page shows them, rather than
    // claiming to be one of them.
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: title,
          description,
          url: canonical,
          inLanguage: 'en-US',
          image: OG_IMAGE,
          publisher: ORG,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, url })),
          },
        },
        breadcrumbs([['Viaduct', `${SITE}/viaduct/`], ['Extensions']]),
      ],
    },
  }) + chrome(`${pageTop({
    crumbs: '<a href="/viaduct/">Viaduct</a> / Extensions',
    h1: `Chrome extensions, running in ${bx('Safari', 'Firefox')}`,
    lede: `Each extension here has a guide: whether its developer makes a ${bx('Safari version', 'Firefox add-on')}, what changes once Viaduct converts it, and how to install it. New to this? Start with <a href="/viaduct/extensions/${GENERAL.slug}/">how Chrome extensions get into ${bx('Safari', 'Firefox')}</a>.`,
  })}
${groups.map(([category, xs]) => ledger(esc(category), `    <table class="compat" aria-labelledby="${slugify(category)}-h">
      <colgroup><col class="c-ext" /><col class="c-off" /><col /></colgroup>
      <thead><tr><th scope="col"><span class="sr">Extension</span></th><th scope="col"><span class="sr">${bx('Official Safari version', 'Official Firefox add-on')}</span></th><th scope="col"><span class="sr">Known limits in ${bx('Safari', 'Firefox')}</span></th></tr></thead>
      <tbody>
        ${xs.map(compatRow).join('\n        ')}
      </tbody>
    </table>`, slugify(category))).join('\n')}
${ledger('Guides', `    <ul class="names">
      ${guideLinks(GUIDES).map(([name, href]) => `<li><a href="${href}">${esc(name)}</a></li>`).join('\n      ')}
    </ul>`, 'guides')}
${ledger('Not on the list?', `    <p>Viaduct isn't limited to these. It converts any extension from the Chrome Web Store, a <code>.zip</code>, a <code>.crx</code> or an unpacked folder, and Import from Chrome converts the ones you already have in Chrome, Brave, Edge, Arc and other Chromium browsers. <a href="/viaduct/">See how Viaduct works</a>.</p>`)}`);
}

// ── emit ──
let count = 0;
for (const x of EXTENSIONS) {
  const dir = path.join(__dirname, x.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), extensionPage(x));
  count++;
}
fs.mkdirSync(path.join(__dirname, GENERAL.slug), { recursive: true });
fs.writeFileSync(path.join(__dirname, GENERAL.slug, 'index.html'), generalPage());
fs.writeFileSync(path.join(__dirname, 'index.html'), hubPage());
for (const g of GUIDES) {
  const dir = path.join(ROOT, 'viaduct', 'guides', g.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), guidePage(g));
}

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
  `${SITE}/viaduct/extensions/${GENERAL.slug}/`,
  ...EXTENSIONS.map((x) => `${SITE}/viaduct/extensions/${x.slug}/`),
  ...GUIDES.map((g) => `${SITE}/viaduct/guides/${g.slug}/`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod(u)}</lastmod></url>`).join('\n')}
</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`${count} extension pages, ${GUIDES.length} topic guides, the general guide, the hub and sitemap.xml written.`);
