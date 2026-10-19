/* The Viaduct nav (see nav.css): it gets heavier once the page scrolls, and
   in Chromium it turns into real glass. */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var pill = nav && nav.querySelector('.nav-pill');
  if (!pill) return;

  /* ---- Weight on scroll: a 12px sentinel at the top of the page. */
  if ('IntersectionObserver' in window) {
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none';
    document.body.prepend(top);
    new IntersectionObserver(function (es) { nav.classList.toggle('scrolled', !es[0].isIntersecting); }).observe(top);
  }

  /* ---- Glass ------------------------------------------------------------------
     React Bits' GlassSurface, ported the same way as the other product pages.
     A data-URI SVG is the displacement map (a red horizontal ramp and a blue
     vertical ramp, difference-blended, with a soft bright rect inset from the
     edges). Feeding it to feDisplacementMap once per colour channel at slightly
     different scales bends the backdrop at the bar's edges and splits it into
     colour fringes. Only Chromium resolves url() inside backdrop-filter, so
     everyone else keeps the plain blur. */
  var ua = navigator.userAgent;
  var probe = document.createElement('div');
  probe.style.backdropFilter = 'url(#nav-glass)';
  var supported = probe.style.backdropFilter !== '' &&
    !(/Safari/.test(ua) && !/Chrome/.test(ua)) && !/Firefox/.test(ua);
  if (!supported) return;

  var NS = 'http://www.w3.org/2000/svg';
  var defs = document.createElementNS(NS, 'svg');
  defs.setAttribute('class', 'glass-defs');
  defs.setAttribute('aria-hidden', 'true');
  defs.setAttribute('focusable', 'false');
  defs.innerHTML =
    '<defs><filter id="nav-glass" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feImage id="nav-glass-map" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-92" xChannelSelector="R" yChannelSelector="G" result="dRed"/>' +
      '<feColorMatrix in="dRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-88" xChannelSelector="R" yChannelSelector="G" result="dGreen"/>' +
      '<feColorMatrix in="dGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-84" xChannelSelector="R" yChannelSelector="G" result="dBlue"/>' +
      '<feColorMatrix in="dBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>' +
      '<feBlend in="red" in2="green" mode="screen" result="rg"/>' +
      '<feBlend in="rg" in2="blue" mode="screen" result="output"/>' +
      '<feGaussianBlur in="output" stdDeviation="0.7"/>' +
    '</filter></defs>';
  document.body.prepend(defs);
  var map = defs.querySelector('#nav-glass-map');

  function buildMap() {
    var r = pill.getBoundingClientRect();
    var w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return;
    var radius = 16; // nav.css's border-radius, so the refraction follows the real corner
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
  else addEventListener('resize', buildMap);
})();
