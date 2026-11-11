/* Viaduct page behaviour on top of the scrollcraft engine. The engine owns
   scroll and publishes each act's progress as --sc-p; the store act's
   choreography is CSS reading that value. This file owns the letter split
   and word widths for the rolling button, where the lifted button travels
   to, the extension wall, and the hero's light rays. The nav is nav.js. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The page holds a Safari and a Firefox word for the rolling button. Only the
     one showing may stay in the roll: the split and the width measurement
     below take the first .roll__to they find. */
  var other = document.documentElement.getAttribute('data-browser') === 'firefox' ? 'safari' : 'firefox';
  Array.prototype.forEach.call(document.querySelectorAll('.roll [data-for="' + other + '"]'), function (el) { el.remove(); });

  /* ---- Rolling words ----------------------------------------------------------
     Each word in a .roll is split into letters that carry their index, so the
     CSS can stagger them. Runs before the engine mounts so its first frame
     already has the letters. Screen readers get the word, not the letters. */
  function splitRoll(scope) {
    var words = scope.querySelectorAll('.roll__from, .roll__to');
    for (var w = 0; w < words.length; w++) {
      var el = words[w];
      if (el.dataset.split) continue;
      var text = el.textContent;
      el.textContent = '';
      el.dataset.split = '1';
      for (var i = 0; i < text.length; i++) {
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.style.setProperty('--i', i);
        ch.setAttribute('aria-hidden', 'true');
        ch.textContent = text.charAt(i);
        el.appendChild(ch);
      }
      var label = document.createElement('span');
      label.className = 'sr-only';
      label.textContent = text;
      el.appendChild(label);
    }
  }
  splitRoll(document);

  /* Each word's width in em, so the CSS can narrow the cell from one word to
     the other as it rolls and the label stays centred. Words inside hidden
     elements measure 0 and are skipped until they are shown. */
  function measureRolls(scope) {
    var rolls = scope.querySelectorAll('.roll');
    for (var k = 0; k < rolls.length; k++) {
      var r = rolls[k];
      var from = r.querySelector('.roll__from'), to = r.querySelector('.roll__to');
      var fs = parseFloat(getComputedStyle(r).fontSize);
      if (!fs || !from.offsetWidth || !to.offsetWidth) continue;
      r.style.setProperty('--wf', (from.offsetWidth / fs).toFixed(3) + 'em');
      r.style.setProperty('--wt', (to.offsetWidth / fs).toFixed(3) + 'em');
      r.classList.add('is-measured');
    }
  }
  measureRolls(document);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureRolls(document); });

  ScrollCraft.mount(document.body);

  /* ---- Where the lifted button goes ----------------------------------------------
     The button lifts out of the listing to the middle of the capture and grows
     to a size worth reading, then settles back. The CSS multiplies these three
     by the lift progress; this only measures them. offsetLeft/Top ignore
     transforms, so a measurement taken mid-lift is still the resting slot. */
  (function () {
    var shot = document.getElementById('flip-shot');
    var btn = document.getElementById('flip-btn');
    if (!shot || !btn) return;
    function measure() {
      var w = shot.clientWidth, h = shot.clientHeight;
      if (!w || !h) return;
      var cx = btn.offsetLeft + btn.offsetWidth / 2;
      var cy = btn.offsetTop + btn.offsetHeight / 2;
      var font = parseFloat(getComputedStyle(btn).fontSize) || 14;
      var phone = innerWidth <= 720;
      var target = phone ? 24 : Math.min(46, Math.max(28, innerWidth * 0.03));
      var ty = phone ? h * 0.42 : h * 0.5;
      btn.style.setProperty('--lx', (w / 2 - cx).toFixed(1) + 'px');
      btn.style.setProperty('--ly', (ty - cy).toFixed(1) + 'px');
      btn.style.setProperty('--ls', (target / font).toFixed(3));
    }
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(shot);
    else addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  })();

  /* ---- The extension reel ----------------------------------------------------------
     One frame plays the 22 recordings back to back. Each icon under it is a
     link to that extension's guide, which is what it stays without this
     script; here it becomes a button that jumps the reel to its recording,
     and a click with a modifier key still opens the guide. Nothing is fetched
     until the frame is on screen, and it plays muted only while it is and the
     tab is visible. With reduced motion or Save-Data it gets controls and
     never starts on its own; when a recording ends the next one is loaded. */
  (function () {
    var video = document.getElementById('reel-video');
    var strip = document.querySelector('.reel__strip');
    var icons = document.querySelectorAll('.reel__icon[data-ext]');
    if (!video || !strip || !icons.length) return;
    var still = reduce || !!(navigator.connection && navigator.connection.saveData);
    var index = 0;
    var loaded = false;
    var onScreen = !window.IntersectionObserver;
    if (still) video.controls = true;

    // Where the recordings live and which browser they were made in. On the
    // Firefox version browser.js has already swapped both.
    var dir = video.getAttribute('data-dir') || './assets/install/';
    var where = video.getAttribute('data-in') || 'Safari';
    var did = where === 'Firefox' ? 'converts and installs it.' : 'builds, signs and installs it.';
    // The still shown before the reel reaches the screen. Set here rather than
    // in the markup so each version fetches only its own.
    video.poster = dir + icons[0].getAttribute('data-ext') + '-poster.webp';

    function show(i) {
      icons[index].style.removeProperty('--p');
      index = i;
      var slug = icons[i].getAttribute('data-ext');
      var name = icons[i].querySelector('img').alt;
      video.poster = dir + slug + '-poster.webp';
      video.src = dir + slug + '.mp4';
      video.setAttribute('aria-label', 'Screen recording in ' + where + ': Add to ' + where + ' is clicked on the ' + name +
        ' listing in the Chrome Web Store, and Viaduct ' + did);
      for (var k = 0; k < icons.length; k++) icons[k].setAttribute('aria-pressed', String(k === i));
      // Where the row scrolls (phones), bring the lit icon to its middle
      // without moving the page.
      if (strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({
          left: icons[i].offsetLeft - (strip.clientWidth - icons[i].offsetWidth) / 2,
          behavior: reduce ? 'auto' : 'smooth'
        });
      }
      loaded = true;
    }
    function play() {
      if (still || !onScreen || document.hidden) return;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    function jump(i) {
      // Pressing the one already playing starts it again.
      if (i === index && loaded) video.currentTime = 0;
      else show(i);
      play();
    }

    video.addEventListener('timeupdate', function () {
      if (video.duration) icons[index].style.setProperty('--p', (video.currentTime / video.duration).toFixed(3));
    });
    video.addEventListener('ended', function () {
      show((index + 1) % icons.length);
      play();
    });

    Array.prototype.forEach.call(icons, function (t, i) {
      t.setAttribute('role', 'button');
      t.setAttribute('aria-pressed', String(i === index));
      t.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        jump(i);
      });
      // A link answers Enter on its own; a button also answers Space.
      t.addEventListener('keydown', function (e) { if (e.key === ' ') e.preventDefault(); });
      t.addEventListener('keyup', function (e) { if (e.key === ' ') jump(i); });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause();
      else play();
    });
    if (!window.IntersectionObserver) return;
    new IntersectionObserver(function (entries) {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (!onScreen) { video.pause(); return; }
      if (!loaded) show(index);
      play();
    }, { threshold: 0.35 }).observe(video);
  })();

  /* ---- Hero light rays ----------------------------------------------------------
     The SideRays shader from React Bits, lifted off React/ogl onto plain WebGL:
     one fullscreen triangle, one fragment program. Origin is fixed to the
     top-right and opacity lives in CSS, so those three uniforms are gone. The
     loop parks itself whenever the hero is off screen; this page argues for
     battery life, so it shouldn't spin the GPU while you read the pricing.
     Without a GPU the shader runs on the CPU and stalls the page, so a
     software renderer keeps the static hero. failIfMajorPerformanceCaveat
     turns most of them away, but headless Chrome, which Lighthouse runs in,
     still hands out SwiftShader, so the renderer's name is checked as well. */
  (function () {
    var cv = document.getElementById('hero-rays');
    if (!cv || reduce) return;
    var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!gl) return;
    var renderer = gl.getParameter(gl.RENDERER);
    if (renderer === 'WebKit WebGL') {
      var info = gl.getExtension('WEBGL_debug_renderer_info');
      if (info) renderer = gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
    }
    if (/swiftshader|llvmpipe|softpipe|lavapipe|software|basic render/i.test(renderer)) return;

    var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FRAG = [
      'precision highp float;',
      'uniform float iTime, iSpeed, iIntensity, iSpread, iTilt, iSaturation, iBlend, iFalloff;',
      'uniform vec2 iResolution;',
      'uniform vec3 iRayColor1, iRayColor2;',
      'float rayStrength(vec2 src, vec2 dir, vec2 coord, float a, float b, float sp){',
      '  vec2 d = coord - src;',
      '  float c = dot(normalize(d), dir);',
      '  return clamp((0.45 + 0.15 * sin(c * a + iTime * sp)) + (0.3 + 0.2 * cos(-c * b + iTime * sp)), 0.0, 1.0)',
      '       * clamp((iResolution.x - length(d)) / iResolution.x, 0.5, 1.0);',
      '}',
      'void main(){',
      '  vec2 fc = gl_FragCoord.xy;',
      '  vec2 coord = vec2(fc.x, iResolution.y - fc.y);',
      '  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);',
      '  float t = iTilt * 3.14159265 / 180.0, cs = cos(t), sn = sin(t);',
      '  vec2 rel = coord - rayPos;',
      '  vec2 tc = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;',
      '  float hs = iSpread * 0.275;',
      '  vec2 d1 = normalize(vec2(cos(0.785398 + hs), sin(0.785398 + hs)));',
      '  vec2 d2 = normalize(vec2(cos(0.785398 - hs), sin(0.785398 - hs)));',
      '  vec4 r1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, d1, tc, 36.2214, 21.11349, iSpeed);',
      '  vec4 r2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, d2, tc, 22.3991, 18.0234, iSpeed * 0.2);',
      '  vec4 col = r1 * (1.0 - iBlend) * 0.9 + r2 * iBlend * 0.9;',
      '  float dist = length(fc - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;',
      '  col.rgb *= iIntensity * 0.4 / pow(max(dist, 0.001), iFalloff);',
      '  float g = dot(col.rgb, vec3(0.299, 0.587, 0.114));',
      '  col.rgb = clamp(mix(vec3(g), col.rgb, iSaturation), 0.0, 1.0);',
      '  gl_FragColor = vec4(col.rgb, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));',
      '}'
    ].join('\n');

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    function u(name) { return gl.getUniformLocation(prog, name); }
    // Two teals rather than the stock yellow/blue, tuned down: this is lighting
    // on the span, not a light show of its own.
    gl.uniform3f(u('iRayColor1'), 0.176, 0.831, 0.749);  // #2DD4BF
    gl.uniform3f(u('iRayColor2'), 0.078, 0.514, 0.478);  // #14837A
    gl.uniform1f(u('iSpeed'), 1.8);
    gl.uniform1f(u('iIntensity'), 3.4);
    // Wide spread is what separates the beams. Narrow values collapse them into
    // a single corner glow.
    gl.uniform1f(u('iSpread'), 6.5);
    gl.uniform1f(u('iTilt'), -8.0);
    gl.uniform1f(u('iSaturation'), 1.2);
    gl.uniform1f(u('iBlend'), 0.6);
    // Paired with the intensity above: enough falloff that the corner nearest
    // the source doesn't clamp to flat white and swallow the banding.
    gl.uniform1f(u('iFalloff'), 1.2);
    var uTime = u('iTime'), uRes = u('iResolution');

    // The rays are a soft gradient, so they render at 0.75 canvas pixels per
    // CSS pixel and the browser scales them up: a quarter of the fill of 1.5x,
    // with no visible difference on 2x and 3x screens.
    var dpr = 0.75;
    function resize() {
      var w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uRes, cv.width, cv.height);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv);
    else addEventListener('resize', resize);

    var raf = 0, running = false;
    function frame(t) {
      gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }

    // Run only when the hero is both on screen and in the foreground tab.
    var onScreen = true;
    function sync() { (onScreen && !document.hidden) ? start() : stop(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; sync(); }).observe(cv);
    }
    document.addEventListener('visibilitychange', sync);
    sync();
    requestAnimationFrame(function () { cv.classList.add('lit'); });
  })();
})();
