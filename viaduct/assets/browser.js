/* Which version of a Viaduct page to show: Safari or Firefox. Loaded blocking
   in <head>, before the stylesheets, so the page never paints the wrong one.
   Sets html[data-browser]; nav.css hides the other browser's [data-for]
   elements and nav.js draws the switch. */
(function () {
  'use strict';

  var KEY = 'viaduct-browser';

  function valid(b) { return b === 'safari' || b === 'firefox' ? b : null; }

  // Private modes can throw on any localStorage access.
  function saved() {
    try { return valid(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function save(b) {
    try { localStorage.setItem(KEY, b); return true; } catch (e) { return false; }
  }

  function fromUrl() {
    var m = /[?&]browser=([^&#]*)/.exec(location.search);
    return m ? valid(m[1].toLowerCase()) : null;
  }

  function detect() {
    var ua = navigator.userAgent || '';
    // Crawlers keep the Safari page, the one search engines already index.
    if (/bot|crawl|spider|slurp|mediapartners|lighthouse|facebookexternalhit|embedly|preview/i.test(ua)) return 'safari';
    if (/Firefox\/|FxiOS\//.test(ua)) return 'firefox';
    if (/Safari\//.test(ua) && !/Chrome|Chromium|CriOS|EdgiOS|EdgA?\/|OPR\/|OPiOS|SamsungBrowser|YaBrowser|Vivaldi/.test(ua)) return 'safari';
    // Another browser on an Apple device has Safari next to it. iPadOS reports
    // itself as Macintosh, so it is covered here too.
    if (/Macintosh|Mac OS X|iPhone|iPad|iPod/.test(ua)) return 'safari';
    if (navigator.userAgentData && navigator.userAgentData.platform === 'macOS') return 'safari';
    return 'firefox';
  }

  var asked = fromUrl();
  if (asked) save(asked);
  var current = asked || saved() || detect();
  document.documentElement.setAttribute('data-browser', current);

  // The product page's headline switch reloads into the other version and
  // leaves this mark, the hero light's clock, so the hero neither plays its
  // entrance a second time nor starts its light over.
  try {
    var swapped = sessionStorage.getItem('viaduct-swapped');
    if (swapped) {
      sessionStorage.removeItem('viaduct-swapped');
      document.documentElement.setAttribute('data-swapped', swapped);
    }
  } catch (e) {}

  function withBrowserParam(b) {
    var search = location.search.replace(/([?&])browser=[^&#]*&?/g, '$1').replace(/[?&]$/, '');
    if (b) search += (search ? '&' : '?') + 'browser=' + b;
    return location.pathname + search + location.hash;
  }

  window.viaductBrowser = {
    current: current,

    /* Save the choice and reload. The engine measures its pinned sections once,
       so the other version has to load fresh rather than swap in place. Where
       the choice can't be saved, it rides in the URL instead. */
    choose: function (b) {
      if (!valid(b) || b === current) return;
      var url = withBrowserParam(save(b) ? null : b);
      var here = location.pathname + location.search + location.hash;
      if (url !== here) {
        if (history.scrollRestoration) history.scrollRestoration = 'auto';
        location.replace(url);
      } else {
        location.reload();
      }
    },

    /* On the Firefox version, copy each data-ff-<attr> onto <attr> for the
       elements marked data-ff. Runs before the scroll engine reads them, so the
       engine only ever sees the active browser's sources. */
    swap: function () {
      if (current !== 'firefox') return;
      var els = document.querySelectorAll('[data-ff]');
      for (var i = 0; i < els.length; i++) {
        var attrs = [].slice.call(els[i].attributes);
        for (var j = 0; j < attrs.length; j++) {
          if (attrs[j].name.indexOf('data-ff-') === 0) els[i].setAttribute(attrs[j].name.slice(8), attrs[j].value);
        }
      }
    }
  };
})();
