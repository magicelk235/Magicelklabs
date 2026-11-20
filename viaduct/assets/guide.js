/* The guides' demonstration: one real recording beside the numbered steps.

   Desktop: the scroll-craft engine scrubs the recording with the wheel. Phones,
   and anyone who asked for reduced motion, get a plain <video> instead: phones
   play it muted on a loop while it is on screen, reduced motion gets controls
   and nothing moves until they press play.

   Either way the steps are the recording's chapters. Each step with a data-t
   (seconds into the clip) lights up while the footage is on it, and pressing
   its number takes the recording to that moment: on desktop by scrolling the
   page to where the engine puts the clip at that time, otherwise by seeking. */
(function () {
  'use strict';

  var demo = document.querySelector('[data-demo]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The same test the engine uses to pick its phone clip.
  var phone = matchMedia('(hover: none) and (pointer: coarse)').matches ||
    matchMedia('(max-width: 860px)').matches;
  var scrub = !!demo && !phone && !reduce;

  if (demo && !scrub) {
    // Undo the act before the engine mounts, so nothing pins and nothing is
    // fetched as a scrub clip.
    var v0 = demo.querySelector('video');
    ['data-sc-act', 'data-sc-span', 'data-sc-dwell'].forEach(function (a) { demo.removeAttribute(a); });
    v0.removeAttribute('data-sc-scrub');
    demo.classList.add('demo--plain');
    if (phone) demo.style.setProperty('--ar', demo.getAttribute('data-phone-ar'));
    v0.poster = v0.getAttribute(phone ? 'data-phone-poster' : 'data-poster');
    v0.src = v0.getAttribute(phone ? 'data-sc-src-mobile' : 'data-sc-src');
    v0.muted = true;
    v0.playsInline = true;
    if (reduce) {
      v0.controls = true;
      v0.preload = 'none';
    } else {
      v0.loop = true;
      v0.preload = 'metadata';
      // Plays while at least half of it is on screen. Low Power Mode refuses
      // autoplay; the controls are the way in then.
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var p = v0.play();
            if (p && p.catch) p.catch(function () { v0.controls = true; });
          } else {
            v0.pause();
          }
        });
      }, { threshold: 0.5 }).observe(v0);
    }
  }

  if (window.ScrollCraft) ScrollCraft.mount(document.body);
  if (!demo) return;

  var video = demo.querySelector('video');
  var steps = [].slice.call(demo.querySelectorAll('.steps li'));
  var marked = steps.filter(function (li) { return li.hasAttribute('data-t'); });
  if (!marked.length) return;
  var times = marked.map(function (li) { return parseFloat(li.getAttribute('data-t')); });

  demo.classList.add('is-tracking');
  var on = null;
  function mark() {
    var t = video.currentTime + 0.05;
    var pick = marked[0];
    for (var i = 0; i < marked.length; i++) if (times[i] <= t) pick = marked[i];
    if (pick === on) return;
    if (on) { on.classList.remove('is-on'); on.removeAttribute('aria-current'); }
    on = pick;
    on.classList.add('is-on');
    on.setAttribute('aria-current', 'step');
  }
  ['timeupdate', 'seeked', 'loadeddata'].forEach(function (ev) { video.addEventListener(ev, mark); });
  mark();

  // The engine's own clip mapping, run backwards: the clip spans the stage's
  // whole on-screen life (or only its pinned stretch, with
  // data-sc-clip-map="travel") with the act's dwell curve applied, so find the
  // dwell input that gives this fraction, then the scroll position for it.
  // Kept inside the pinned stretch so the whole window is on screen when it
  // lands.
  var L = parseFloat(demo.getAttribute('data-sc-dwell')) || 0;
  var travel = demo.getAttribute('data-sc-clip-map') === 'travel';
  function dwell(x) { var c = x - 0.5; return (1 - L) * x + L * (4 * c * c * c + 0.5); }
  function scrollFor(t) {
    var f = Math.min(Math.max(t / (video.duration || 1), 0), 1);
    var lo = 0, hi = 1;
    for (var i = 0; i < 32; i++) { var mid = (lo + hi) / 2; if (dwell(mid) < f) lo = mid; else hi = mid; }
    var vh = window.innerHeight;
    var top = demo.getBoundingClientRect().top + window.scrollY;
    var h = demo.offsetHeight;
    var maxY = document.documentElement.scrollHeight - vh;
    var startY = travel ? top : top - Math.min(vh, top);
    var endY = travel ? top + h - vh : Math.min(top + h, maxY);
    var y = startY + lo * (endY - startY);
    return Math.min(Math.max(y, top), top + h - vh);
  }

  marked.forEach(function (li, i) {
    var btn = li.querySelector('button.step__n');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (scrub) {
        window.scrollTo({ top: scrollFor(times[i] + 0.15), behavior: reduce ? 'auto' : 'smooth' });
      } else {
        video.currentTime = times[i] + 0.05;
        if (!reduce) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      }
    });
  });
})();
