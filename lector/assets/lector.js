/* Lector page behaviour on top of the scrollcraft engine. The engine owns
   scroll. This file owns the nav, the autoplaying demo, the translating
   headline, the glass nav, the hero lamp and the band light. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  ScrollCraft.mount(document.body);

  /* ---- Nav weight on scroll ------------------------------------------------ */
  var nav = document.getElementById('nav');
  if (nav && 'IntersectionObserver' in window) {
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none';
    document.body.prepend(top);
    new IntersectionObserver(function (es) { nav.classList.toggle('scrolled', !es[0].isIntersecting); }).observe(top);
  }

  /* ---- Headline: translated in place -----------------------------------------
     After a beat in Japanese, each line scrambles through glyphs from the
     scripts Lector reads and resolves into English from left to right. Every
     letter that lands takes the lamplight sweep. */
  (function () {
    var h1 = document.getElementById('hero-h1');
    if (!h1 || h1.dataset.translate !== '1') return;
    var GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZabdeghkmnpqrstwyzアカサタナハマヤラワあかさたなはまやらわБГДЖЗИЛПФЦЧШЭЮЯΔΘΛΞΠΣΦΨΩאבגדהוזחטיכלמנספצקרשתابتثجحخدذرزسشصضطظعغفقكلمنهوي';
    function pick() { return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)); }
    function translate(line, startAt) {
      var text = line.dataset.text;
      setTimeout(function () {
        line.lang = 'en';
        line.classList.remove('tl-in');
        line.textContent = '';
        var cells = [];
        for (var i = 0; i < text.length; i++) {
          var c = document.createElement('span');
          if (text[i] === ' ') { c.textContent = ' '; }
          else { c.className = 's'; c.textContent = pick(); }
          line.appendChild(c);
          cells.push(c);
        }
        var next = 0, ticks = 0;
        var timer = setInterval(function () {
          ticks++;
          // Three scramble-only frames, then one letter lands per frame.
          if (ticks > 3) {
            while (next < text.length && text[next] === ' ') next++;
            if (next < text.length) {
              cells[next].textContent = text[next];
              cells[next].className = 'hit';
              next++;
            }
          }
          for (var j = next; j < text.length; j++) if (text[j] !== ' ') cells[j].textContent = pick();
          if (next >= text.length) clearInterval(timer);
        }, 42);
      }, startAt);
    }
    var lines = h1.querySelectorAll('.tl');
    for (var i = 0; i < lines.length; i++) translate(lines[i], 1250 + i * 320);
  })();

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

  /* ---- Hero lamp ---------------------------------------------------------------
     React Bits' LightRays on plain WebGL: one fullscreen triangle, one fragment
     program. Origin fixed to top centre, pointer influence removed (the hero is
     read past, not played with), opacity in CSS. The loop parks whenever the
     hero is off screen or the tab is in the background. */
  (function () {
    var cv = document.getElementById('hero-rays');
    if (!cv || reduce) return;
    var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FRAG = [
      'precision highp float;',
      'uniform float iTime;',
      'uniform vec2 iResolution, rayPos, rayDir;',
      'uniform vec3 raysColor;',
      'uniform float raysSpeed, lightSpread, rayLength, fadeDistance, noiseAmount, distortion;',
      'float noise(vec2 st){ return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }',
      'float rayStrength(vec2 src, vec2 dir, vec2 coord, float a, float b, float sp){',
      '  vec2 d = coord - src;',
      '  float c = dot(normalize(d), dir);',
      '  float dc = c + distortion * sin(iTime * 2.0 + length(d) * 0.01) * 0.2;',
      '  float spread = pow(max(dc, 0.0), 1.0 / max(lightSpread, 0.001));',
      '  float dist = length(d);',
      '  float maxD = iResolution.x * rayLength;',
      '  float lenFall = clamp((maxD - dist) / maxD, 0.0, 1.0);',
      '  float fade = clamp((iResolution.x * fadeDistance - dist) / (iResolution.x * fadeDistance), 0.5, 1.0);',
      '  float base = clamp((0.45 + 0.15 * sin(dc * a + iTime * sp)) + (0.3 + 0.2 * cos(-dc * b + iTime * sp)), 0.0, 1.0);',
      '  return base * lenFall * fade * spread;',
      '}',
      'void main(){',
      '  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);',
      '  vec4 c = vec4(1.0) * rayStrength(rayPos, rayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed)* 0.5',
      '         + vec4(1.0) * rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed) * 0.4;',
      '  float n = noise(coord * 0.01 + iTime * 0.1);',
      '  c.rgb *= (1.0 - noiseAmount + noiseAmount * n);',
      '  float br = 1.0 - (coord.y / iResolution.y);',
      '  c.x *= 0.1 + br * 0.8;',
      '  c.y *= 0.3 + br * 0.6;',
      '  c.z *= 0.5 + br * 0.5;',
      '  c.rgb *= raysColor;',
      '  gl_FragColor = c;',
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
    // Lamplight: the shader drains red toward the bottom of the frame, so the
    // colour starts warmer than the target and cools to amber as it falls.
    gl.uniform3f(u('raysColor'), 1.0, 0.80, 0.66);
    gl.uniform1f(u('raysSpeed'), 0.6);
    gl.uniform1f(u('lightSpread'), 0.75);
    gl.uniform1f(u('rayLength'), 1.25);
    gl.uniform1f(u('fadeDistance'), 1.0);
    gl.uniform1f(u('noiseAmount'), 0.06);
    gl.uniform1f(u('distortion'), 0.04);
    gl.uniform2f(u('rayDir'), 0, 1);
    var uTime = u('iTime'), uRes = u('iResolution'), uPos = u('rayPos');

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform2f(uPos, cv.width * 0.5, -0.2 * cv.height);
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
    var onScreen = true;
    function syncRays() { (onScreen && !document.hidden) ? start() : stop(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; syncRays(); }).observe(cv);
    }
    document.addEventListener('visibilitychange', syncRays);
    syncRays();
    requestAnimationFrame(function () { cv.classList.add('lit'); });
  })();

  /* ---- Band light --------------------------------------------------------------
     The two orbs in the closing band drift only while the band is on screen. */
  (function () {
    var band = document.getElementById('band');
    if (!band) return;
    if (reduce) { band.classList.add('lit'); return; }
    if (!('IntersectionObserver' in window)) { band.classList.add('lit'); return; }
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      band.classList.toggle('parked', !on);
      if (on) band.classList.add('lit');
    }).observe(band);
    document.addEventListener('visibilitychange', function () { band.classList.toggle('parked', document.hidden); });
  })();
})();
