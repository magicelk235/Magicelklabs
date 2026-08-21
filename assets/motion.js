/* Magicelk Labs — shared scroll + pointer choreography.
 * GSAP 3.13 + ScrollTrigger + SplitText (+ optional Lenis smooth scroll).
 *
 * Entrance API (visibility gated by html.mm, see below):
 *   data-mm="lines"        headline: masked line-by-line rise with blur-in
 *   data-mm="rise"         fade + 26px rise
 *   data-mm="fade"         fade only
 *   data-mm="media"        screenshots/video: scale 1.045 -> 1 + rise
 *   data-mm-load           run at load instead of on scroll-enter
 *   data-mm-delay="0.15"   extra delay in seconds
 *   data-mm-stagger        parent: direct children rise with 70ms stagger
 *
 * Continuous / pointer API (no visibility gating):
 *   data-mm-parallax=".12" slow vertical drift while scrolling
 *   data-mm-counter="60"   count up to N on enter (suffix via -suffix attr)
 *   data-mm-ambient="teal|brass"  two soft light orbs drift inside the band
 *   data-mm-scrub          hero media: scales down + drifts as it scrolls away
 *   data-mm-tilt           pointer 3D tilt (fine pointers only)
 *   data-mm-magnet         cursor-magnetic button (fine pointers only)
 *   data-mm-spot="teal|brass"  cursor spotlight wash on hover
 *   .mm-progress           nav hairline that fills with scroll progress
 *
 * Pinned sequence: [data-mm-pin] > [data-mm-pin-stage] with [data-mm-pin-item]
 * rail + [data-mm-pin-panel] panels. Pins only >=1024px + fine pointer;
 * otherwise the CSS fallback (stacked panels with captions) stays.
 *
 * Visibility contract: pages add `mm` to <html> in an inline head script
 * (skipped under prefers-reduced-motion). CSS hides [data-mm] only under
 * html.mm. This file reveals everything; the head script's 2s failsafe strips
 * `mm` if GSAP never arrives.
 */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  function bail() {
    docEl.classList.remove('mm');
    window.__mmReady = true;
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) { bail(); return; }
  window.__mmReady = true;

  // If the head script's 2s failsafe already stripped `mm`, content is painted
  // and visible. Running entrances now would yank it back to hidden and
  // re-reveal — a visible flash, and Lighthouse re-records LCP at the late
  // paint (observed 20s+ on throttled mobile). Skip entrances; continuous
  // effects (parallax, pins, tilt, counters) still run.
  var late = !docEl.classList.contains('mm');

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  // Measurement guards. Two things corrupt ScrollTrigger.refresh():
  // 1. CSS `scroll-behavior: smooth` animating programmatic scrolls mid-measure.
  // 2. Lenis's rAF writing lerped scroll positions while ST reverts/measures.
  // So: kill CSS smoothing during refresh (and permanently while Lenis owns
  // scrolling), and pause Lenis for the duration of every refresh.
  ScrollTrigger.addEventListener('refreshInit', function () {
    if (lenis) lenis.stop();
    docEl.style.scrollBehavior = 'auto';
  });
  ScrollTrigger.addEventListener('refresh', function () {
    if (lenis) {
      lenis.start();
      docEl.style.scrollBehavior = 'auto'; // Lenis owns easing; CSS smooth stays off
    } else {
      docEl.style.scrollBehavior = '';
    }
  });

  var EASE = 'expo.out';

  // ---------- injected styles for the continuous layer ----------
  var style = document.createElement('style');
  style.id = 'mm-style';
  style.textContent = [
    '[data-mm-ambient]{position:relative;overflow:hidden}',
    '[data-mm-ambient]>*:not(.mm-glow){position:relative;z-index:1}',
    '.mm-glow{position:absolute;width:58vmax;height:58vmax;border-radius:50%;pointer-events:none;z-index:0;will-change:transform;filter:blur(8px)}',
    '.mm-glow.teal{background:radial-gradient(circle,rgba(110,224,209,.14),transparent 62%)}',
    '.mm-glow.brass{background:radial-gradient(circle,rgba(216,184,137,.13),transparent 62%)}',
    '.mm-spot{position:relative}',
    '.mm-spot::after{content:"";position:absolute;inset:0;border-radius:inherit;opacity:0;transition:opacity .35s ease;pointer-events:none;background:radial-gradient(440px circle at var(--mx,50%) var(--my,40%),var(--spot,rgba(110,224,209,.12)),transparent 65%)}',
    '.mm-spot:hover::after{opacity:1}',
    '.mm-progress{position:absolute;left:0;bottom:-1px;height:2px;width:100%;transform:scaleX(0);transform-origin:0 50%;opacity:0;pointer-events:none}',
    '[data-mm-tilt]{transform-style:preserve-3d}'
  ].join('\n');
  document.head.appendChild(style);

  // ---------- Lenis inertial scrolling (loads if the page includes it) ----------
  var lenis = null;
  if (window.Lenis && fine) {
    docEl.style.scrollBehavior = 'auto'; // Lenis owns easing now
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    // Anchor navigation goes through Lenis so it keeps the same easing. Lenis
    // does its own maths and ignores scroll-padding-top, so read the page's
    // value and land where a plain browser jump would.
    var headroom = parseFloat(getComputedStyle(docEl).scrollPaddingTop) || 0;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -headroom, duration: 1.2 });
      history.pushState(null, '', id);
    });
  }

  // Elements inside a [data-mm-replay] ancestor re-run their entrance every
  // time they scroll back into view; everything else animates once.
  function stFor(el) {
    return el.closest && el.closest('[data-mm-replay]')
      ? { trigger: el, start: 'top 88%', toggleActions: 'restart none restart reset' }
      : { trigger: el, start: 'top 88%', once: true };
  }

  function enter(el, vars, immediate) {
    var from = Object.assign({}, vars.from);
    var to = Object.assign({ ease: EASE, overwrite: 'auto' }, vars.to);
    to.delay = (parseFloat(el.getAttribute('data-mm-delay')) || 0) + (to.delay || 0);
    if (!immediate) {
      to.scrollTrigger = stFor(el);
    }
    gsap.fromTo(el, from, to);
  }

  function run() {
    if (!late) {
    // ---- lines: masked line-by-line headline reveal with blur-in ----
    document.querySelectorAll('[data-mm="lines"]').forEach(function (el) {
      var immediate = el.hasAttribute('data-mm-load');
      if (!hasSplit) {
        enter(el, { from: { autoAlpha: 0, y: 24 }, to: { autoAlpha: 1, y: 0, duration: 1 } }, immediate);
        return;
      }
      var split = new SplitText(el, { type: 'lines', linesClass: 'mm-line' });
      split.lines.forEach(function (line) {
        var wrap = document.createElement('div');
        wrap.style.overflow = 'clip';
        wrap.style.margin = '-0.14em 0';
        wrap.style.padding = '0.14em 0';
        line.parentNode.insertBefore(wrap, line);
        wrap.appendChild(line);
      });
      gsap.set(el, { autoAlpha: 1 });
      gsap.set(split.lines, { yPercent: 112, filter: 'blur(7px)' });
      var vars = {
        yPercent: 0, filter: 'blur(0px)', duration: 1.2, ease: EASE, stagger: 0.09,
        delay: parseFloat(el.getAttribute('data-mm-delay')) || 0,
        clearProps: 'filter'
      };
      if (immediate) gsap.to(split.lines, vars);
      else gsap.to(split.lines, Object.assign(vars, { scrollTrigger: stFor(el) }));
    });

    // ---- rise / fade / media ----
    document.querySelectorAll('[data-mm="rise"]').forEach(function (el) {
      enter(el, { from: { autoAlpha: 0, y: 26 }, to: { autoAlpha: 1, y: 0, duration: 0.95 } }, el.hasAttribute('data-mm-load'));
    });
    document.querySelectorAll('[data-mm="fade"]').forEach(function (el) {
      enter(el, { from: { autoAlpha: 0 }, to: { autoAlpha: 1, duration: 0.9 } }, el.hasAttribute('data-mm-load'));
    });
    document.querySelectorAll('[data-mm="media"]').forEach(function (el) {
      enter(el, { from: { autoAlpha: 0, y: 34, scale: 1.045 }, to: { autoAlpha: 1, y: 0, scale: 1, duration: 1.25 } }, el.hasAttribute('data-mm-load'));
    });

    // ---- staggered children ----
    document.querySelectorAll('[data-mm-stagger]').forEach(function (parent) {
      var kids = Array.prototype.slice.call(parent.children);
      if (!kids.length) return;
      var st = stFor(parent);
      st.start = 'top 86%';
      gsap.fromTo(kids, { autoAlpha: 0, y: 22 }, {
        autoAlpha: 1, y: 0, duration: 0.85, ease: EASE, stagger: 0.07,
        scrollTrigger: st
      });
    });
    } // end !late entrances

    // ---- parallax drift ----
    document.querySelectorAll('[data-mm-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-mm-parallax')) || 0.1;
      gsap.fromTo(el, { yPercent: amt * 100 }, {
        yPercent: -amt * 100, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // ---- counters ----
    document.querySelectorAll('[data-mm-counter]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-mm-counter')) || 0;
      var suffix = el.getAttribute('data-mm-counter-suffix') || '';
      var obj = { v: 0 };
      el.textContent = '0' + suffix;
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'expo.out',
        scrollTrigger: stFor(el),
        onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
      });
    });

    // ---- ambient band light: two soft orbs drifting slowly ----
    document.querySelectorAll('[data-mm-ambient]').forEach(function (band) {
      var tone = band.getAttribute('data-mm-ambient') || 'teal';
      [
        { x: '-18%', y: '-35%', dx: '14%', dy: '-12%', d: 16 },
        { x: '62%',  y: '30%',  dx: '44%', dy: '8%',  d: 21 }
      ].forEach(function (cfg) {
        var g = document.createElement('div');
        g.className = 'mm-glow ' + tone;
        g.setAttribute('aria-hidden', 'true');
        band.prepend(g);
        gsap.set(g, { left: cfg.x, top: cfg.y });
        gsap.to(g, {
          x: '+=' + (parseFloat(cfg.dx) * 4), y: '+=' + (parseFloat(cfg.dy) * 4),
          duration: cfg.d, repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
    });

    // ---- hero media scrub: settles smaller as you scroll past (Apple move) ----
    document.querySelectorAll('[data-mm-scrub]').forEach(function (el) {
      gsap.fromTo(el, { scale: 1, y: 0 }, {
        scale: 0.965, y: -18, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 55%', end: 'bottom top', scrub: true }
      });
    });

    // ---- pointer tilt on framed media ----
    if (fine) {
      document.querySelectorAll('[data-mm-tilt]').forEach(function (el) {
        gsap.set(el, { transformPerspective: 900 });
        var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
        var ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 4.5);
          rx(((e.clientY - r.top) / r.height - 0.5) * -4.5);
        });
        el.addEventListener('mouseleave', function () { rx(0); ry(0); });
      });

      // ---- magnetic buttons ----
      // Measure the button's rest position on enter (before it has any
      // translate) and clamp the pull so the element never slides out from
      // under the cursor. Measuring the live rect each move fed the transform
      // back into itself and let the button escape the pointer, which made the
      // cursor flicker between pointer and default along the edges.
      document.querySelectorAll('[data-mm-magnet]').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        var cx = 0, cy = 0, maxX = 0, maxY = 0;
        function measure() {
          // strip the current translate so we read the true rest center
          var x = gsap.getProperty(btn, 'x') || 0, y = gsap.getProperty(btn, 'y') || 0;
          var r = btn.getBoundingClientRect();
          cx = r.left - x + r.width / 2;
          cy = r.top - y + r.height / 2;
          maxX = r.width * 0.18;   // keep the pull well inside the button
          maxY = r.height * 0.18;
        }
        function clamp(v, m) { return v > m ? m : (v < -m ? -m : v); }
        btn.addEventListener('mouseenter', measure);
        btn.addEventListener('mousemove', function (e) {
          xTo(clamp((e.clientX - cx) * 0.22, maxX));
          yTo(clamp((e.clientY - cy) * 0.3, maxY));
        });
        btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
      });

      // ---- cursor spotlight wash ----
      document.querySelectorAll('[data-mm-spot]').forEach(function (card) {
        card.classList.add('mm-spot');
        if (card.getAttribute('data-mm-spot') === 'brass') {
          card.style.setProperty('--spot', 'rgba(216,184,137,.13)');
        }
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }

    // ---- nav scroll-progress hairline ----
    document.querySelectorAll('.mm-progress').forEach(function (bar) {
      gsap.set(bar, { opacity: 1 });
      gsap.to(bar, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 40, end: 'max', scrub: 0.3 }
      });
    });

    // ---- pinned sequences ----
    var canPin = window.matchMedia('(min-width: 1024px)').matches && fine;
    document.querySelectorAll('[data-mm-pin]').forEach(function (wrap) {
      var stage = wrap.querySelector('[data-mm-pin-stage]');
      var items = wrap.querySelectorAll('[data-mm-pin-item]');
      var panels = wrap.querySelectorAll('[data-mm-pin-panel]');
      if (!stage || panels.length < 2) return;
      if (!canPin) { wrap.classList.add('mm-pin-static'); return; }

      wrap.classList.add('mm-pin-live');
      var n = panels.length;
      gsap.set(panels, { autoAlpha: 0, y: 18, scale: 0.985 });
      gsap.set(panels[0], { autoAlpha: 1, y: 0, scale: 1 });
      if (items[0]) items[0].classList.add('is-active');

      var current = 0;
      function activate(idx) {
        if (idx === current) return;
        gsap.to(panels[current], { autoAlpha: 0, y: -14, scale: 0.99, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
        gsap.fromTo(panels[idx], { autoAlpha: 0, y: 18, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: EASE, overwrite: 'auto' });
        items.forEach(function (it, i) { it.classList.toggle('is-active', i === idx); });
        current = idx;
      }

      ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: function () { return '+=' + (n * 85) + '%'; },
        pin: stage,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var idx = Math.min(n - 1, Math.floor(self.progress * n));
          activate(idx);
        }
      });
    });

    // Pins are created after the entrance triggers above; without a sort,
    // refresh runs in creation order and the pin spacer's 2000+px offset never
    // reaches triggers below the pin, so they fire while still off-screen.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    // Late layout shifts (images, fonts, an in-flight smooth scroll at init)
    // can leave stale measurements; re-measure once things settle, and once
    // more if any pin still reads an impossible negative start.
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    setTimeout(function () {
      var broken = ScrollTrigger.getAll().some(function (t) { return t.start < -5; });
      if (broken) ScrollTrigger.refresh();
    }, 700);
  }

  // Fonts change line breaks — wait for them before splitting headlines.
  if (document.fonts && document.fonts.ready) {
    var started = false;
    var kick = function () { if (!started) { started = true; run(); } };
    document.fonts.ready.then(kick);
    setTimeout(kick, 900); // don't wait forever on a slow font CDN
  } else {
    run();
  }
})();
