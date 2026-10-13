/* Viaduct page behaviour on top of the scrollcraft engine. The engine owns
   scroll and publishes each act's progress as --sc-p; the store act's
   choreography is CSS reading that value. This file owns the nav, the glass,
   the letter split and word widths for the rolling button, where the lifted
   button travels to, the extension plate, and the hero's light rays. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---- Nav weight on scroll ---------------------------------------------------- */
  var nav = document.getElementById('nav');
  if (nav && 'IntersectionObserver' in window) {
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none';
    document.body.prepend(top);
    new IntersectionObserver(function (es) { nav.classList.toggle('scrolled', !es[0].isIntersecting); }).observe(top);
  }

  /* ---- Glass nav --------------------------------------------------------------
     React Bits' GlassSurface, ported the same way as the other product pages.
     Only Chromium resolves url() inside backdrop-filter, so everyone else
     keeps the plain blur. */
  (function () {
    var pill = document.querySelector('.nav-pill');
    var map = document.getElementById('nav-glass-map');
    if (!pill || !map) return;
    var ua = navigator.userAgent;
    var probe = document.createElement('div');
    probe.style.backdropFilter = 'url(#nav-glass)';
    var supported = probe.style.backdropFilter !== '' &&
      !(/Safari/.test(ua) && !/Chrome/.test(ua)) && !/Firefox/.test(ua);
    if (!supported) return;
    function buildMap() {
      var r = pill.getBoundingClientRect();
      var w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) return;
      var radius = 16;
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
    root.classList.add('glassy');
    if (window.ResizeObserver) new ResizeObserver(buildMap).observe(pill);
    else addEventListener('resize', buildMap);
  })();

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

  /* ---- The extension plate ----------------------------------------------------------
     The reader drops their own extension (or picks a sample) and it goes
     through the same first step Dark Reader did: Viaduct reads its manifest,
     and its button flips. assets/inspect.js does the reading, in memory; the
     samples were read by the same script ahead of time (assets/samples/).
     This only draws the result. Every string from a package is set as text,
     never as markup. */
  (function () {
    var plate = document.getElementById('plate');
    if (!plate || !window.ViaductInspect) return;
    var I = window.ViaductInspect;
    var fileIn = document.getElementById('pick-file');
    var dirIn = document.getElementById('pick-folder');
    var picks = document.querySelectorAll('.pick[data-sample]');
    var errEl = document.getElementById('plate-error');
    var icon = document.getElementById('r-icon');
    var nameEl = document.getElementById('r-name');
    var metaEl = document.getElementById('r-meta');
    var descEl = document.getElementById('r-desc');
    var stats = document.getElementById('r-stats');
    var groups = document.getElementById('r-groups');
    var btn = document.getElementById('r-btn');
    var current = null;
    var runId = 0;
    var flipTimer = 0;
    // The same puzzle mark as the empty plate, for packages whose icon is
    // missing or won't decode.
    var PUZZLE = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 36 36"><path fill="#4FB8AA" d="' +
      plate.querySelector('.plate__icon path').getAttribute('d') + '"/></svg>');
    icon.addEventListener('error', function () { if (icon.src !== PUZZLE) icon.src = PUZZLE; });

    function setState(s) { plate.setAttribute('data-state', s); }

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }

    function stat(label, value) {
      var d = el('div');
      d.appendChild(el('dt', null, label));
      d.appendChild(el('dd', null, String(value)));
      stats.appendChild(d);
    }

    // A titled group of tags. Long lists show the first `cap` and a button
    // that reveals the rest in place; a button that hides one or two tags
    // costs more room than it saves, so short overflows show in full.
    function tagGroup(title, items, cap) {
      var g = el('div', 'group');
      g.appendChild(el('h4', 'group__title', title));
      var ul = el('ul', 'tags');
      ul.tabIndex = -1;
      function add(list) { list.forEach(function (t) { var li = el('li'); li.appendChild(el('span', 'tag', t)); ul.appendChild(li); }); }
      if (items.length - cap < 3) cap = items.length;
      add(items.slice(0, cap));
      if (items.length > cap) {
        var li = el('li');
        var more = el('button', 'tag tag--more', '+' + (items.length - cap) + ' more');
        more.type = 'button';
        more.setAttribute('aria-label', 'Show all ' + items.length + ' ' + title.toLowerCase());
        more.addEventListener('click', function () {
          ul.removeChild(li);
          add(items.slice(cap));
          ul.focus();
        });
        li.appendChild(more);
        ul.appendChild(li);
      }
      g.appendChild(ul);
      groups.appendChild(g);
      return g;
    }

    function note(kind, label, text) {
      var p = el('p', 'note' + (kind === 'bad' ? ' is-bad' : ''));
      p.appendChild(el('b', null, label));
      p.appendChild(el('span', null, text));
      return p;
    }

    function list(items, max) {
      if (items.length <= max) return items.join(', ');
      return items.slice(0, max).join(', ') + ', and ' + (items.length - max) + ' more';
    }

    var BACKGROUND = { service_worker: 'service worker', scripts: 'background scripts', page: 'background page' };

    function render(r) {
      current = r;
      icon.src = r.iconUrl || PUZZLE;
      nameEl.textContent = r.name || 'Unnamed extension';
      var meta = [];
      if (r.version) meta.push('Version ' + r.version);
      if (r.manifestVersion) meta.push('Manifest V' + r.manifestVersion);
      if (r.background) meta.push(BACKGROUND[r.background]);
      metaEl.textContent = meta.join(' · ');
      descEl.textContent = r.description || '';
      descEl.hidden = !r.description;

      var all = r.hostPermissions.some(function (h) { return h === '<all_urls>' || h === '*://*/*'; });
      stats.textContent = '';
      stat('Permissions', r.permissions.length);
      stat('Site access', all ? 'All' : r.hostPermissions.length || 'None');
      stat('Chrome APIs', r.namespaces.length);
      stat('Files', r.files);

      groups.textContent = '';
      if (r.permissions.length) tagGroup('Permissions', r.permissions, 10);
      if (!all && r.hostPermissions.length) tagGroup('Sites', r.hostPermissions, 6);
      if (r.namespaces.length) {
        var g = tagGroup('Chrome APIs', r.namespaces, 12);
        if (r.truncatedScan) g.appendChild(el('p', 'group__note', 'From the first 25 MB of its scripts.'));
      }

      // What the compatibility layer above will do for this one.
      var notes = [];
      if (r.manifestVersion === 3 && r.background === 'service_worker') {
        notes.push(note('patch', 'Patched', 'Safari omits onInstalled and parts of self.registration. Viaduct backfills them, so the worker loads.'));
      }
      if (r.caseMismatches.length) {
        var pairs = r.caseMismatches.map(function (m) { return m.ref + ' is really ' + m.actual; });
        notes.push(note('patch', 'Patched', 'The manifest\u2019s letter case doesn\u2019t match the files (' + list(pairs, 3) +
          '). Safari is case sensitive here; Viaduct normalizes the casing.'));
      }
      if (r.missing.length) {
        notes.push(note('bad', 'Missing', 'The manifest names ' + list(r.missing, 3) +
          (r.missing.length === 1 ? ', which isn\u2019t' : ', which aren\u2019t') + ' in the package.'));
      }
      if (notes.length) {
        var ng = el('div', 'group');
        notes.forEach(function (n) { ng.appendChild(n); });
        groups.appendChild(ng);
      }

      setState('result');
      measureRolls(plate);
      btn.classList.remove('is-flipped');
      // Let the reader see it arrive as a Chrome extension before it flips.
      clearTimeout(flipTimer);
      flipTimer = setTimeout(function () { btn.classList.add('is-flipped'); }, reduce ? 0 : 650);
    }

    function fail(e) {
      errEl.textContent = (e && e.message) || 'The page couldn\u2019t read that package.';
      setState('error');
    }

    // Only the latest request draws, so a slow package can't overwrite a
    // sample picked after it.
    function run(promise) {
      var id = ++runId;
      if (current) { I.revoke(current); current = null; }
      clearTimeout(flipTimer);
      setState('busy');
      promise.then(function (r) { if (id === runId) render(r); else I.revoke(r); },
                   function (e) { if (id === runId) fail(e); });
    }

    function press(which) {
      for (var i = 0; i < picks.length; i++) picks[i].setAttribute('aria-pressed', String(picks[i] === which));
    }

    var samples = null;
    function sample(slug) {
      samples = samples || fetch('./assets/samples/samples.json').then(function (res) {
        if (!res.ok) throw new Error('The samples didn\u2019t load. Drop in your own instead.');
        return res.json();
      });
      return samples.then(function (all) {
        for (var i = 0; i < all.length; i++) {
          if (all[i].slug !== slug) continue;
          var r = JSON.parse(JSON.stringify(all[i]));
          r.iconUrl = r.icon;
          return r;
        }
        throw new Error('That sample is missing.');
      }, function (e) { samples = null; throw e; });
    }
    Array.prototype.forEach.call(picks, function (b) {
      b.addEventListener('click', function () { press(b); run(sample(b.getAttribute('data-sample'))); });
    });

    // Copy the files out before clearing the input, so picking the same file
    // again still fires a change.
    function fromInput(input) {
      if (!input.files.length) return;
      var files = Array.prototype.slice.call(input.files);
      input.value = '';
      press(null);
      run(I.fromFiles(files));
    }
    fileIn.addEventListener('change', function () { fromInput(fileIn); });
    dirIn.addEventListener('change', function () { fromInput(dirIn); });

    // Drag and drop, in any state. The plate takes the drop; anywhere else on
    // the page a stray drop is swallowed so the browser doesn't open the file.
    var depth = 0;
    plate.addEventListener('dragenter', function (e) { e.preventDefault(); depth++; plate.classList.add('is-over'); });
    plate.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    plate.addEventListener('dragleave', function () { if (--depth <= 0) { depth = 0; plate.classList.remove('is-over'); } });
    plate.addEventListener('drop', function (e) {
      e.preventDefault();
      depth = 0; plate.classList.remove('is-over');
      press(null);
      run(I.fromDataTransfer(e.dataTransfer));
    });
    addEventListener('dragover', function (e) { if (!plate.contains(e.target)) { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; } });
    addEventListener('drop', function (e) { if (!plate.contains(e.target)) e.preventDefault(); });
  })();

  /* ---- Hero light rays ----------------------------------------------------------
     The SideRays shader from React Bits, lifted off React/ogl onto plain WebGL:
     one fullscreen triangle, one fragment program. Origin is fixed to the
     top-right and opacity lives in CSS, so those three uniforms are gone. The
     loop parks itself whenever the hero is off screen; this page argues for
     battery life, so it shouldn't spin the GPU while you read the pricing. */
  (function () {
    var cv = document.getElementById('hero-rays');
    if (!cv || reduce) return;
    var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;

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

    // 1.5x is plenty for a soft gradient, and it costs half the fill of 2x.
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
