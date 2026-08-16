#!/usr/bin/env node
// Generates the /viaduct/extensions/ SEO pages: one page per popular Chrome
// extension with no (or partial) Safari presence, plus the hub index.
// Edit EXTENSIONS or the template below, then re-run:  node build.js
// Output: ./<slug>/index.html for each extension + ./index.html (hub).

'use strict';
const fs = require('fs');
const path = require('path');

const SITE = 'https://magicelklabs.com';
const STORE = (id) => `https://chromewebstore.google.com/detail/${id}`;

// official = an official Safari version exists; the page must say so and link it.
const EXTENSIONS = [
  { slug: 'claude-in-chrome', name: 'Claude in Chrome', id: 'fcoeoabgfenejglbffodgkkbkcdhcgfn',
    desc: 'Anthropic’s AI assistant that works right in your browser', category: 'AI assistants' },
  { slug: 'ublock-origin', name: 'uBlock Origin', id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
    desc: 'the wide-spectrum content blocker', category: 'Privacy & ad blocking' },
  { slug: 'tampermonkey', name: 'Tampermonkey', id: 'dhdgffkkebhmkfjojejmpbldmpobfkfo',
    desc: 'the most popular userscript manager', category: 'Userscripts' },
  { slug: 'violentmonkey', name: 'Violentmonkey', id: 'jinjaccalgkegednnccohejagnlnfdag',
    desc: 'the open-source userscript manager', category: 'Userscripts' },
  { slug: 'metamask', name: 'MetaMask', id: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
    desc: 'the Ethereum wallet that lives in your browser', category: 'Crypto' },
  { slug: 'return-youtube-dislike', name: 'Return YouTube Dislike', id: 'gebbhagfogifgggkldgodflihgfeippi',
    desc: 'the extension that restores dislike counts on YouTube', category: 'YouTube' },
  { slug: 'sponsorblock', name: 'SponsorBlock', id: 'mnjggcdmjocbbbhaepdhchncahnbgone',
    desc: 'the extension that auto-skips sponsor segments in YouTube videos', category: 'YouTube' },
  { slug: 'stylus', name: 'Stylus', id: 'clngdbkpkpeebahjckkjfobafhncgmne',
    desc: 'custom CSS themes for any website', category: 'Customization' },
  { slug: 'dark-reader', name: 'Dark Reader', id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
    desc: 'dark mode for every website', category: 'Customization',
    official: { label: 'Dark Reader for Safari (Mac App Store)', url: 'https://apps.apple.com/us/app/dark-reader-for-safari/id1438243180',
      note: 'Dark Reader ships an official paid Safari version. If you just want Dark Reader, buy it; it supports the developer. Viaduct is for running the free Chrome build, or for the day you want an extension that has no Safari port at all.' } },
  { slug: 'clearurls', name: 'ClearURLs', id: 'lckanjgmijmafbedllaakclkaicjfmnk',
    desc: 'the extension that strips tracking parameters from links', category: 'Privacy & ad blocking' },
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
    desc: 'one-click lookup of archived page versions (Wayback Machine and more)', category: 'Research' },
  { slug: 'user-agent-switcher', name: 'User-Agent Switcher and Manager', id: 'bhchdcejhohfmigjafbampogmaanbfkg',
    desc: 'spoof or rotate your browser’s user agent', category: 'Developer tools' },
  { slug: 'xbrowsersync', name: 'xBrowserSync', id: 'lcbjdhceifofjlpecfpeimnnphbcjgnc',
    desc: 'encrypted bookmark sync across browsers', category: 'Sync' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Shared page chrome. Tokens are lifted from ../index.html (the Theme.swift palette).
const CSS = `
:root {
  --canvas:#F5F5F7; --surface:#FFFFFF; --elevated:#F0F0F2; --card:#EAEAEC;
  --ink:#1D1D1F; --body:#3A3A3C; --mute:#6E6E73; --ash:#9A9AA0; --stone:#BFBFC4;
  --teal:#16746F; --teal-press:#0F5551; --on-teal:#FFFFFF;
  --ok:#1A9D5A; --bad:#E5484D;
  --hair:rgba(0,0,0,.10); --hair-soft:rgba(0,0,0,.05); --hair-strong:rgba(0,0,0,.16);
  --glow:rgba(22,116,111,.10); --brass:var(--teal);
  --lip:inset 0 1px 0 rgba(255,255,255,.6);
}
/* The pages only ship dark. The canvas is a near-black with a trace of green in
   it, so the teal accent sits on it like something lit, not a sticker on grey. */
html.dark {
  --canvas:#070908; --surface:#0E1211; --elevated:#151A19; --card:#1B211F;
  --ink:#ECF2F0; --body:#9DAAA7; --mute:#6B7A77; --ash:#4E5B58; --stone:#333D3B;
  --teal:#2DD4BF; --teal-press:#5FE3D2; --on-teal:#04211D;
  --ok:#30D158; --bad:#FF6369;
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
/* Nav: a floating glass pill. Real glass here means an SVG displacement map fed
   to backdrop-filter, so the pill refracts what passes under it and splits colour
   at its edges. Chromium only, so .glassy is set by script and the blur below
   stays as the fallback. The blur is kept in the chain (the original drops it) or
   nav text sits on top of whatever is scrolling past and stops being readable. */
#nav { position:fixed; top:12px; left:0; right:0; z-index:50; padding:0 12px; }
@media (min-width:640px) { #nav { top:16px; padding:0 20px; } }
.nav-pill {
  position:relative; max-width:64rem; margin:0 auto; height:54px;
  padding:0 8px 0 16px; display:flex; align-items:center; justify-content:space-between; gap:16px;
  background:rgba(14,18,17,.55); border:1px solid rgba(255,255,255,.08);
  border-radius:999px; box-shadow:var(--lip);
  -webkit-backdrop-filter:blur(20px) saturate(160%); backdrop-filter:blur(20px) saturate(160%);
  transition:background .3s, border-color .3s;
}
@media (min-width:640px) { .nav-pill { padding:0 10px 0 20px; } }
#nav.scrolled .nav-pill { background:rgba(14,18,17,.82); border-color:rgba(255,255,255,.12); }
.glass-defs { position:absolute; width:0; height:0; overflow:hidden; }
html.glassy .nav-pill {
  background:rgba(14,18,17,.30);
  backdrop-filter:url(#nav-glass) blur(9px) saturate(1.5);
  box-shadow:inset 0 0 2px 1px rgba(255,255,255,.30), inset 0 0 12px 4px rgba(255,255,255,.10), var(--lip);
}
html.glassy #nav.scrolled .nav-pill { background:rgba(14,18,17,.58); }
.nav-link { color:var(--body); transition:color .2s; text-decoration:none; }
.nav-link:hover { color:var(--ink); text-decoration:none; }
.nav-brand { display:flex; align-items:center; gap:8px; flex-shrink:0; text-decoration:none; }
.nav-brand:hover { text-decoration:none; }
.nav-brand img { width:21px; height:21px; flex-shrink:0; display:block; }
.nav-brand span { font-family:'Cabinet Grotesk',Inter,sans-serif; font-weight:700; font-size:19px; color:var(--ink); letter-spacing:-.02em; line-height:1; }
.nav-mid { display:none; position:absolute; left:50%; transform:translateX(-50%); align-items:center; gap:28px; font-size:14px; font-weight:500; }
@media (min-width:768px) { .nav-mid { display:flex; } }
.nav-actions { display:flex; align-items:center; gap:8px; }
.nav-dl { display:none; }
@media (min-width:640px) { .nav-dl { display:inline-flex; } }
.btn-teal, .btn-ghost, .btn-cyan, .btn-light {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-size:15px; padding:11px 22px; text-decoration:none;
}
.btn-teal:hover, .btn-ghost:hover, .btn-cyan:hover, .btn-light:hover { text-decoration:none; }
.btn-teal { background:var(--teal); color:var(--on-teal); font-weight:600; border-radius:999px; box-shadow:inset 0 1px 0 rgba(255,255,255,.3); transition:transform .22s cubic-bezier(.2,.8,.2,1), background .2s, box-shadow .25s; }
.btn-teal:hover { background:var(--teal-press); transform:translateY(-1px); box-shadow:inset 0 1px 0 rgba(255,255,255,.3), 0 6px 28px -6px rgba(45,212,191,.55); }
.btn-teal:active { transform:translateY(0) scale(.99); }
.btn-ghost { background:rgba(255,255,255,.05); color:var(--ink); border:1px solid rgba(255,255,255,.12); border-radius:999px; box-shadow:var(--lip); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); transition:transform .22s cubic-bezier(.2,.8,.2,1), border-color .2s, background .2s; }
.btn-ghost:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.2); transform:translateY(-1px); }
.btn-ghost:active { transform:translateY(0) scale(.99); }
.btn-cyan { background:#0B7A70; color:#E8FCF8; font-weight:600; border-radius:999px; box-shadow:inset 0 1px 0 rgba(255,255,255,.16); transition:transform .22s cubic-bezier(.2,.8,.2,1), background .2s, box-shadow .25s; }
.btn-cyan:hover { background:#0F958A; transform:translateY(-1px); box-shadow:inset 0 1px 0 rgba(255,255,255,.16), 0 6px 28px -6px rgba(15,149,138,.6); }
.btn-cyan:active { transform:translateY(0) scale(.99); }
.btn-light { background:#F2F5F4; color:#06110F; font-weight:600; border-radius:999px; transition:transform .22s cubic-bezier(.2,.8,.2,1), background .2s; }
.btn-light:hover { background:#fff; transform:translateY(-1px); }
.btn-light:active { transform:translateY(0) scale(.99); }
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
.cta { text-align:center; padding:56px 24px; border-radius:18px;
  background:linear-gradient(168deg,#0C302C 0%,#0A1E1C 58%,#08110F 100%);
  border:1px solid rgba(45,212,191,.22); box-shadow:inset 0 1px 0 rgba(45,212,191,.16); }
.cta h2 { margin-bottom:8px; color:#EEFBF8; }
.cta p { margin:0 0 22px; color:#7FA39D; }
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

function head({ title, description, canonical }) {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<link rel="icon" type="image/png" href="/viaduct/assets/viaduct-icon-dark.png" />
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${canonical}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&display=swap" rel="stylesheet" />
<style>${CSS}</style>
</head>`;
}

const NAV_JS = `
(function(){
  'use strict';
  var nav = document.getElementById('nav');
  var onScroll = function(){ if(nav) nav.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // Glass nav: a data-URI SVG is the displacement map (a red horizontal ramp and
  // a blue vertical ramp, difference-blended, with a soft bright rect inset from
  // the edges). Feeding that to feDisplacementMap once per colour channel at
  // slightly different scales bends the backdrop at the pill's edges and splits
  // it into colour fringes. Only Chromium resolves url() inside backdrop-filter,
  // so everyone else keeps the plain blur.
  (function(){
    var pill = document.querySelector('.nav-pill');
    var map = document.getElementById('nav-glass-map');
    if (!pill || !map) return;
    var ua = navigator.userAgent;
    var probe = document.createElement('div');
    probe.style.backdropFilter = 'url(#nav-glass)';
    var supported = probe.style.backdropFilter !== '' &&
      !(/Safari/.test(ua) && !/Chrome/.test(ua)) && !/Firefox/.test(ua);
    if (!supported) return;
    function buildMap(){
      var r = pill.getBoundingClientRect();
      var w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) return;
      var radius = Math.min(999, h / 2);
      var edge = Math.min(w, h) * 0.035;
      var svg =
        '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
          '<defs>' +
            '<linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%">' +
              '<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
            '<linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%">' +
              '<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>' +
          '</defs>' +
          '<rect width="' + w + '" height="' + h + '" fill="black"/>' +
          '<rect width="' + w + '" height="' + h + '" rx="' + radius + '" fill="url(#r)"/>' +
          '<rect width="' + w + '" height="' + h + '" rx="' + radius + '" fill="url(#b)" style="mix-blend-mode:difference"/>' +
          '<rect x="' + edge + '" y="' + edge + '" width="' + (w - edge * 2) + '" height="' + (h - edge * 2) + '"' +
            ' rx="' + radius + '" fill="hsl(0 0% 50% / 0.93)" style="filter:blur(11px)"/>' +
        '</svg>';
      map.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svg));
    }
    buildMap();
    document.documentElement.classList.add('glassy');
    if (window.ResizeObserver) new ResizeObserver(buildMap).observe(pill);
    else window.addEventListener('resize', buildMap);
  })();

  // Inbound links tag the visit (?ref=... or ?utm_source=...). Gumroad only logs
  // the UTM params it receives at checkout, so carry them onto the buy links.
  (function(){
    var incoming = new URLSearchParams(window.location.search);
    var ref = incoming.get('ref');
    var params = new URLSearchParams();
    if (ref && !incoming.get('utm_source')) params.set('utm_source', ref);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){
      var v = incoming.get(k); if (v) params.set(k, v);
    });
    var qs = params.toString();
    if (!qs) return;
    document.querySelectorAll('a[href*="gumroad.com/l/viaduct"]').forEach(function(a){
      a.href += (a.href.indexOf('?') === -1 ? '?' : '&') + qs;
    });
  })();
})();
`;

function chrome(inner) {
  return `
<body>
<svg class="glass-defs" aria-hidden="true" focusable="false">
  <defs>
    <filter id="nav-glass" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage id="nav-glass-map" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="-180" xChannelSelector="R" yChannelSelector="G" result="dRed" />
      <feColorMatrix in="dRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="-170" xChannelSelector="R" yChannelSelector="G" result="dGreen" />
      <feColorMatrix in="dGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="-160" xChannelSelector="R" yChannelSelector="G" result="dBlue" />
      <feColorMatrix in="dBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
      <feBlend in="red" in2="green" mode="screen" result="rg" />
      <feBlend in="rg" in2="blue" mode="screen" result="output" />
      <feGaussianBlur in="output" stdDeviation="0.7" />
    </filter>
  </defs>
</svg>
<header id="nav">
  <nav class="nav-pill" aria-label="Primary">
    <a href="/viaduct/" class="nav-brand" aria-label="Viaduct home">
      <img src="/viaduct/assets/viaduct-appicon.png" alt="" aria-hidden="true" width="21" height="21" />
      <span>Viaduct</span>
    </a>
    <div class="nav-mid">
      <a href="/viaduct/#how" class="nav-link">How it works</a>
      <a href="/viaduct/#features" class="nav-link">Features</a>
      <a href="/viaduct/#pricing" class="nav-link">Pricing</a>
      <a href="/viaduct/#faq" class="nav-link">FAQ</a>
    </div>
    <div class="nav-actions">
      <a href="https://github.com/magicelk235/viaduct-app/releases/latest/download/Viaduct.dmg" class="btn-ghost nav-dl" style="font-size:13.5px;padding:7px 14px">Download</a>
      <a data-gumroad-action="buy" data-gumroad-price="19" href="https://gumroad.com/l/viaduct" class="btn-cyan" style="font-size:13.5px;padding:7px 14px">Get Pro</a>
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
<script>${NAV_JS}</script>
</body>
</html>`;
}

function extensionPage(x) {
  const store = STORE(x.id);
  const canonical = `${SITE}/viaduct/extensions/${x.slug}/`;
  const title = `Run ${x.name} in Safari · Viaduct`;
  const description = x.official
    ? `${x.name} on Safari: what the official option covers, and how to run the Chrome version natively in Safari with Viaduct.`
    : `${x.name} has no Safari version. Viaduct converts the real Chrome extension into a native Safari extension. One click, no terminal.`;

  const officialBlock = x.official ? `
<section>
  <div class="card callout">
    <strong style="color:var(--ink)">Good news first: an official option exists.</strong>
    <p style="margin:8px 0 0">${esc(x.official.note)}<br />
    → <a href="${x.official.url}" rel="noopener">${esc(x.official.label)}</a></p>
  </div>
</section>` : '';

  const noPortLede = x.official
    ? `There's an official Safari option for ${x.name} (linked below). There's also
       Viaduct, which runs the actual Chrome build in Safari, the same way it runs the
       thousands of extensions that never got a port.`
    : `${x.name}, ${x.desc}, has no official Safari version. Safari can't load Chrome
       extensions: it uses its own native <code>.appex</code> format that must be built,
       code-signed, and registered with macOS. Viaduct does all of that for you.`;

  return head({ title, description, canonical }) + chrome(`
<div class="crumb"><a href="/viaduct/extensions/">Extensions</a> / ${esc(x.name)}</div>
<div class="hero">
  <span class="tag">${esc(x.category)}</span>
  <h1>Run ${esc(x.name)} in Safari</h1>
  <p class="lede">${noPortLede}</p>
</div>
${officialBlock}
<section>
  <h2>The whole process, three steps</h2>
  <ol class="steps">
    <li><strong><a href="/viaduct/">Get Viaduct</a></strong>. Free for your first 2 conversions, and it installs a small Safari extension that upgrades the Chrome Web Store.</li>
    <li><strong>Open ${esc(x.name)}'s Chrome Web Store page in Safari.</strong><br />
        <a href="${store}" rel="noopener">${esc(x.name)} on the Chrome Web Store →</a></li>
    <li><strong>Click "Add to Safari."</strong> The store's "Add to Chrome" button becomes "Add to Safari." One click: Viaduct fetches ${esc(x.name)}, converts it to a native Safari extension, signs it, and installs it. It appears in Safari's toolbar like any native extension.</li>
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
  <p>Viaduct downloads the exact ${esc(x.name)} package published on the Chrome Web
  Store (same code, same version) and rebuilds it as a native Safari Web Extension
  (<code>.appex</code>). It handles the conversion, the code-signing, and the macOS
  registration that normally require Xcode wrangling and a terminal. Because the result
  runs inside Safari's own engine, you keep Safari's battery life. No second Chromium
  process runs in the background.</p>
  <p>Safari supports the same WebExtension API family that Chrome extensions are built
  on, so most extensions work as-is. Some Chrome-only APIs have no Safari equivalent,
  and Viaduct's built-in Analyze check tells you before you convert.</p>
</section>
<section>
  <h2>Questions</h2>
  <details><summary>Is this the real ${esc(x.name)}, or a clone?</summary>
    <p>The real one. Viaduct converts the exact package its developers published on the
    Chrome Web Store. Nothing is modified, hosted, or redistributed; the conversion
    happens locally on your Mac.</p></details>
  <details><summary>Will it stop working after a week?</summary>
    <p>Free Apple accounts sign extensions for about 7 days. Viaduct Pro auto-re-signs
    converted extensions in the background before they lapse, so they never silently
    disappear.</p></details>
  <details><summary>What do I need?</summary>
    <p>macOS 13+, on Apple Silicon or Intel. Viaduct is a universal app, so one download
    runs natively on either chip. Node is bundled inside Viaduct, so there's nothing
    to install. Xcode is required (free, from the App Store) because Apple offers no other
    way to code-sign a Safari extension on a free account; Viaduct checks on first run and
    links the install if it's missing.</p></details>
  <details><summary>What does Viaduct cost?</summary>
    <p>Free for your first 2 conversions. Pro is $19 one-time: unlimited conversions
    plus auto-re-signing. The conversion engine is source-available (PolyForm Shield).</p></details>
</section>
<section>
  <div class="cta">
    <h2>${esc(x.name)} in Safari, two minutes from now.</h2>
    <p>Free for your first 2 conversions · Pro $19 one-time · macOS 13+</p>
    <a class="btn-light" href="/viaduct/">Get Viaduct</a>
  </div>
</section>`);
}

function hubPage() {
  const canonical = `${SITE}/viaduct/extensions/`;
  const tiles = EXTENSIONS.map((x) =>
    `<a class="row" href="/viaduct/extensions/${x.slug}/"><b>${esc(x.name)}</b><span class="d">${esc(x.desc.charAt(0).toUpperCase() + x.desc.slice(1))}</span><span class="c">${esc(x.category)}</span></a>`
  ).join('\n    ');
  return head({
    title: 'Chrome extensions you can run in Safari · Viaduct',
    description: 'Per-extension guides for running popular Chrome extensions natively in Safari with Viaduct: uBlock Origin, Tampermonkey, MetaMask, SponsorBlock, and more.',
    canonical,
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
  <code>.crx</code>, or Chrome Web Store link. <a href="/viaduct/">See how it works →</a></p>
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

// sitemap for the whole viaduct section
const urls = [
  `${SITE}/`,
  `${SITE}/about/`,
  `${SITE}/spyglass/`,
  `${SITE}/viaduct/`,
  `${SITE}/viaduct/extensions/`,
  ...EXTENSIONS.map((x) => `${SITE}/viaduct/extensions/${x.slug}/`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>\n`;
fs.writeFileSync(path.join(__dirname, '..', '..', 'sitemap.xml'), sitemap);

console.log(`${count} extension pages + hub + sitemap.xml written.`);
