/* Spyglass page. Decides once whether the pinned acts run, hands the page to
   the scroll engine, and drives the lens act from scroll position. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Pins are for wide screens with a fine pointer. Everywhere else, and under
  // reduced motion, the same markup reads as a plain catalogue.
  var pinned = !reduce && matchMedia('(min-width: 1024px) and (min-height: 620px) and (hover: hover) and (pointer: fine)').matches;

  if (pinned) {
    html.classList.add('lens', 'pin');
    // Drive captions move out of the steps into one stack beside the windows.
    var caps = document.querySelector('.dv-caps');
    Array.prototype.forEach.call(document.querySelectorAll('.dv-steps .dv-cap'), function (c) { caps.appendChild(c); });
    caps.removeAttribute('hidden');
    // The pinned markup is authored as data-pin-*; promote it for the engine.
    ['act', 'span', 'cue', 'reveal', 'reveal-at'].forEach(function (k) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-pin-' + k + ']'), function (el) {
        el.setAttribute('data-sc-' + k, el.getAttribute('data-pin-' + k));
      });
    });
  }

  var sc = window.ScrollCraft ? ScrollCraft.mount(document.body) : null;

  // ── Nav weight ──
  var nav = document.getElementById('nav');
  var navTick = function () { nav.classList.toggle('scrolled', scrollY > 12); };
  navTick();
  addEventListener('scroll', navTick, { passive: true });

  // ── The lens ──
  // Each object has an icon, a preview and a label. Icons queue up to the
  // right of the lens and fade as they cross its rim; as each one dissolves,
  // its preview fades in inside the glass over the one before it, settling
  // from a slight zoom. The previews only drift a little: content that slid
  // the full width of the lens moved up to 8x faster than the scroll and
  // strobed. Labels crossfade in the column the headline leaves. Position t
  // follows the scroll linearly; t = k puts object k under the glass.
  (function () {
    if (!pinned) return;
    var sec = document.getElementById('what');
    var stage = sec.querySelector('.gx-stage');
    var intro = sec.querySelector('.gx-intro');
    var objs = Array.prototype.map.call(sec.querySelectorAll('.gx-obj'), function (li) {
      var pv = li.querySelector('.gx-pv');
      // Where the lens looks on each preview, as fractions of its width and
      // height, and how much it magnifies (preview height over lens diameter).
      var f = (pv.getAttribute('data-focus') || '0.5 0.5').split(' ').map(parseFloat);
      var z = parseFloat(pv.getAttribute('data-zoom')) || 1.3;
      return { li: li, icon: li.querySelector('.gx-icon'), pv: pv, lbl: li.querySelector('.gx-lbl'), fx: f[0], fy: f[1], zoom: Math.max(z, 1), shown: null };
    });
    // Every preview lives inside the lens, which clips them to its circle once,
    // statically, instead of a clip-path recomputed every frame.
    var glass = sec.querySelector('.gx-lens-back.lone');
    objs.forEach(function (o) { glass.appendChild(o.pv); });
    var links = Array.prototype.slice.call(sec.querySelectorAll('.gx-index a'));
    var far = Array.prototype.slice.call(sec.querySelectorAll('.gx-far img'));
    var near = Array.prototype.slice.call(sec.querySelectorAll('.gx-near img'));
    var n = objs.length;
    // t runs from T0 to T1 in step with the scroll, at one speed the whole
    // way. T0 < 0 so the first scroll already moves the queue while the
    // headline steps aside; T1 leaves the last object a little settled room.
    var T0 = -0.6, T1 = n - 1 + 0.25;

    var W, H, r, lx, ly, si, drift, top, travel;
    var farPos = [], nearPos = [];
    var lastY = -1, dirty = true, current = -1;

    // A fixed scatter, so the field looks the same on every visit.
    function rand(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    function layout() {
      W = stage.clientWidth; H = stage.clientHeight;
      r = Math.round(Math.min(H * 0.29, W * 0.2, 300));
      var col = Math.max(40, W / 2 - 640);
      lx = Math.round(Math.max(W * 0.63, col + 456 + r));
      ly = Math.round(H * 0.5);
      si = r * 1.25;
      drift = r * 0.3;
      stage.style.setProperty('--lx', lx + 'px');
      stage.style.setProperty('--ly', ly + 'px');
      stage.style.setProperty('--r', r + 'px');
      // Size each preview for its zoom, and keep its focus point far enough
      // inside that the glass is always full.
      objs.forEach(function (o) {
        var ph = Math.round(r * 2 * o.zoom), pw = Math.round(ph * 1.6);
        var mx = r / pw, my = r / ph;
        o.cx = Math.min(Math.max(o.fx, mx), 1 - mx) * pw;
        o.cy = Math.min(Math.max(o.fy, my), 1 - my) * ph;
        o.pv.style.width = pw + 'px';
        o.pv.style.height = ph + 'px';
        o.pv.style.transformOrigin = o.cx.toFixed(1) + 'px ' + o.cy.toFixed(1) + 'px';
      });
      // The text column stays on plain glass: the far field starts past it.
      var fade = (lx - r - 40) / W * 100;
      var mask = 'linear-gradient(to right, transparent ' + (fade - 6).toFixed(1) + '%, #000 ' + (fade + 8).toFixed(1) + '%)';
      sec.querySelector('.gx-far').style.webkitMaskImage = mask;
      sec.querySelector('.gx-far').style.maskImage = mask;
      farPos = far.map(function (img, i) {
        var s = Math.round(34 + rand(i) * 40);
        // Sprites are padded 1.4x around the icon so the baked blur isn't clipped.
        img.style.width = img.style.height = Math.round(s * 1.4) + 'px';
        return { x: rand(i + 40) * (W + 400), y: 90 + rand(i + 80) * (H - 240 - s), s: s };
      });
      // Near plane: big, out-of-focus icons passing just under the top edge,
      // clear of the labels and the index.
      nearPos = near.map(function (img, i) {
        var s = Math.round(r * (0.9 + rand(i + 7) * 0.4));
        img.style.width = img.style.height = Math.round(s * 1.5) + 'px';
        return { x: (i + rand(i + 3) * 0.5) * (W + s * 2) / near.length, y: -s * (0.5 + rand(i + 11) * 0.12), s: s };
      });
      var rect = sec.getBoundingClientRect();
      top = rect.top + scrollY;
      travel = Math.max(sec.offsetHeight - H, 1);
      dirty = true;
    }

    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
    function wrap(x, m) { return ((x % m) + m) % m; }

    // Linear on purpose. An earlier version slowed the scroll at every object
    // and sped it up between them; under the hand that read as the page
    // sticking and then jumping. Objects still settle, through the fade timing
    // in draw(), not by changing how far the page moves per notch.
    function tOf(p) { return T0 + p * (T1 - T0); }
    function pOf(k) { return (k - T0) / (T1 - T0); }

    function draw() {
      var p = clamp01((scrollY - top) / travel);
      var t = tOf(p);

      // The headline gives way to the first label over the opening scroll.
      var io0 = smooth((t - T0 - 0.04) / 0.16);
      intro.style.opacity = (1 - io0).toFixed(3);
      intro.style.visibility = io0 > 0.99 ? 'hidden' : '';

      for (var k = 0; k < n; k++) {
        var o = objs[k];
        var xi = (k - t) * si;
        // The first object's preview is already in the glass, so its icon never queues.
        var io = k === 0 || xi <= 0 ? 0 : clamp01((xi - r * 0.55) / (r * 0.5)) * clamp01(1 - (xi - (W - lx)) / 160);
        o.icon.style.opacity = io.toFixed(3);
        o.icon.style.transform = 'translate3d(' + (lx + xi - 60).toFixed(1) + 'px,' + (ly - 60) + 'px,0)';

        // d < 0: still arriving; it fades in over the previous preview while
        // its icon crosses the rim. d >= 0: settled, and it stays put under
        // the next one until that one fully covers it.
        var d = t - k;
        var a = k === 0 && d < 0 ? 1 : d < 0 ? smooth((d + 0.62) / 0.36) : (d < 0.8 ? 1 : 0);
        var vis = a > 0.001;
        if (vis !== o.shown) { o.shown = vis; o.pv.style.visibility = vis ? 'visible' : 'hidden'; }
        if (vis) {
          // The last preview has nothing coming after it, so it stops where it settles.
          var dc = d < -1 ? -1 : d > (k === n - 1 ? 0 : 1) ? (k === n - 1 ? 0 : 1) : d;
          var sc = d < 0 && k > 0 ? 1 + 0.06 * smooth(-d / 0.62) : 1;
          o.pv.style.opacity = a.toFixed(3);
          o.pv.style.transform = 'translate3d(' + (r - o.cx - dc * drift).toFixed(1) + 'px,' + (r - o.cy).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
        }

        // Each label holds while its object is nearest the glass and swaps
        // quickly halfway between two objects.
        var lo = smooth((0.5 - Math.abs(d)) / 0.12);
        if (k === 0) lo = Math.min(lo, smooth((t - T0 - 0.12) / 0.12));
        if (k === n - 1 && d > 0) lo = 1;
        o.lbl.style.opacity = lo.toFixed(3);
        o.lbl.style.visibility = lo > 0.02 ? 'visible' : 'hidden';
        o.lbl.style.transform = 'translate3d(0,' + ((t - k) * -14).toFixed(1) + 'px,0)';
      }

      var fm = W + 400;
      for (var i = 0; i < far.length; i++) {
        var fp = farPos[i];
        far[i].style.transform = 'translate3d(' + (wrap(fp.x - t * si * 0.22, fm) - 200).toFixed(1) + 'px,' + fp.y.toFixed(1) + 'px,0)';
      }
      for (var j = 0; j < near.length; j++) {
        var np = nearPos[j], nm = W + np.s * 2;
        near[j].style.transform = 'translate3d(' + (wrap(np.x - t * si * 1.05, nm) - np.s).toFixed(1) + 'px,' + np.y.toFixed(1) + 'px,0)';
      }

      var cur = Math.round(t);
      if (cur !== current) {
        current = cur;
        links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      }
    }

    var running = false;
    function frame() {
      if (!running) return;
      if (dirty || scrollY !== lastY) { lastY = scrollY; dirty = false; draw(); }
      requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }

    // The index jumps along the collection rather than down the page.
    links.forEach(function (a, k) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        scrollTo({ top: Math.round(top + pOf(k) * travel), behavior: 'smooth' });
      });
    });

    layout();
    draw();
    addEventListener('resize', layout, { passive: true });
    addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(sec);
  })();

  // ── Glass nav ──
  // React Bits' GlassSurface on plain SVG: a displacement map built to the
  // pill's size bends the backdrop at its edges. Only Chromium resolves url()
  // inside backdrop-filter, so everyone else keeps the plain blur.
  (function () {
    var pill = document.querySelector('.nav-pill');
    var map = document.getElementById('nav-glass-map');
    if (!pill || !map) return;
    var ua = navigator.userAgent;
    var probe = document.createElement('div');
    probe.style.backdropFilter = 'url(#nav-glass)';
    var ok = probe.style.backdropFilter !== '' && !(/Safari/.test(ua) && !/Chrome/.test(ua)) && !/Firefox/.test(ua);
    if (!ok) return;
    function build() {
      var b = pill.getBoundingClientRect(), w = Math.round(b.width), h = Math.round(b.height);
      if (!w || !h) return;
      var rad = 16, edge = Math.min(w, h) * 0.035;
      var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg"><defs>' +
        '<linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
        '<linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs>' +
        '<rect width="' + w + '" height="' + h + '" fill="black"/>' +
        '<rect width="' + w + '" height="' + h + '" rx="' + rad + '" fill="url(#r)"/>' +
        '<rect width="' + w + '" height="' + h + '" rx="' + rad + '" fill="url(#b)" style="mix-blend-mode:difference"/>' +
        '<rect x="' + edge + '" y="' + edge + '" width="' + (w - edge * 2) + '" height="' + (h - edge * 2) + '" rx="' + rad + '" fill="hsl(0 0% 50% / 0.93)" style="filter:blur(11px)"/></svg>';
      map.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svg));
    }
    build();
    html.classList.add('glassy');
    new ResizeObserver(build).observe(pill);
  })();

  // Layout again once images and fonts have settled the page height.
  if (sc) addEventListener('load', function () { sc.layout(); });
})();
