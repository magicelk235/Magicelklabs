/*
 * Reads a Chrome extension (.crx, .zip, or unpacked folder) entirely in the
 * browser and summarises what Viaduct will see. No network, no workers.
 *
 * window.ViaductInspect = { fromFiles(fileList), fromDataTransfer(dt), revoke(report) }
 */
(function () {
  'use strict';

  var JS_SCAN_CAP = 25 * 1024 * 1024;

  var MSG = {
    notPackage: "That isn't a Chrome extension package.",
    zipUnsupported: "This zip uses a format the page can't read (ZIP64 or encrypted). Viaduct itself will still open it.",
    zipMethod: "This zip uses a compression method the page can't read. Viaduct itself will still open it.",
    zipDamaged: 'That package looks damaged or incomplete.',
    crxVersion: "That CRX uses a header version the page can't read. Viaduct itself will still open it.",
    oneAtATime: 'Drop one extension at a time.',
    nothing: 'Drop a .crx or .zip file, or an unpacked extension folder.',
    folderNoManifest: 'That folder has no manifest.json.',
    packageNoManifest: 'That package has no manifest.json.',
    badManifest: "The manifest.json in that package isn't valid JSON.",
    noInflate: "This browser can't unpack zip files. Try a current version of Safari, Chrome, or Firefox.",
    folderRead: "The page couldn't read that folder.",
    generic: "The page couldn't read that package."
  };

  // Top-level chrome.* / browser.* extension API namespaces.
  var NAMESPACES = [
    'accessibilityFeatures', 'action', 'alarms', 'audio', 'bookmarks', 'browserAction', 'browserSettings',
    'browsingData', 'captivePortal', 'certificateProvider', 'commands', 'contentSettings', 'contextMenus',
    'contextualIdentities', 'cookies', 'debugger', 'declarativeContent', 'declarativeNetRequest',
    'declarativeWebRequest', 'desktopCapture', 'devtools', 'dns', 'documentScan', 'dom', 'downloads',
    'enterprise', 'extension', 'fileBrowserHandler', 'fileSystemProvider', 'find', 'fontSettings', 'gcm',
    'history', 'i18n', 'identity', 'idle', 'input', 'instanceID', 'loginState', 'management', 'menus',
    'notifications', 'offscreen', 'omnibox', 'pageAction', 'pageCapture', 'permissions', 'pkcs11',
    'platformKeys', 'power', 'printerProvider', 'printing', 'printingMetrics', 'privacy', 'processes',
    'proxy', 'readingList', 'runtime', 'scripting', 'search', 'sessions', 'sidePanel', 'sidebarAction',
    'storage', 'system', 'tabCapture', 'tabGroups', 'tabs', 'theme', 'topSites', 'tts', 'ttsEngine',
    'userScripts', 'vpnProvider', 'wallpaper', 'webAuthenticationProxy', 'webNavigation', 'webRequest',
    'windows'
  ];
  var NAMESPACE_SET = new Set(NAMESPACES);

  var ICON_MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon', bmp: 'image/bmp'
  };

  function userError(message) {
    var e = new Error(message);
    e.viaductUserFacing = true;
    return e;
  }

  // Public entry points only ever reject with short, user-facing messages.
  function guard(promise) {
    return promise.catch(function (e) {
      if (e && e.viaductUserFacing) throw e;
      var wrapped = new Error(MSG.generic);
      wrapped.cause = e;
      throw wrapped;
    });
  }

  // ---------------------------------------------------------------------------
  // Byte helpers

  function readBlob(blob) {
    return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 0x1000000; }

  var utf8 = new TextDecoder('utf-8');
  var utf8Fatal = new TextDecoder('utf-8', { fatal: true });

  function latin1(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return s;
  }

  function decodeName(bytes, isUtf8) {
    if (isUtf8) return utf8.decode(bytes);
    // Unflagged names are nominally CP437, but most tools write UTF-8 anyway.
    try { return utf8Fatal.decode(bytes); } catch (e) { return latin1(bytes); }
  }

  // ---------------------------------------------------------------------------
  // Paths

  function normalizePath(p) {
    p = String(p).replace(/\\/g, '/');
    var out = [];
    p.split('/').forEach(function (seg) {
      if (seg === '' || seg === '.') return;
      if (seg === '..') { out.pop(); return; }
      out.push(seg);
    });
    return out.join('/');
  }

  function isJunk(path) {
    var segs = path.split('/');
    return segs[0] === '__MACOSX' || segs[segs.length - 1] === '.DS_Store';
  }

  function extOf(path) {
    var base = path.slice(path.lastIndexOf('/') + 1);
    var dot = base.lastIndexOf('.');
    return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
  }

  // ---------------------------------------------------------------------------
  // ZIP

  function inflateRaw(blob) {
    var ds;
    try { ds = new DecompressionStream('deflate-raw'); } catch (e) { return Promise.reject(userError(MSG.noInflate)); }
    return new Response(blob.stream().pipeThrough(ds)).arrayBuffer()
      .then(function (b) { return new Uint8Array(b); }, function () { throw userError(MSG.zipDamaged); });
  }

  function findEocd(blob) {
    var tailLen = Math.min(blob.size, 22 + 65535);
    var base = blob.size - tailLen;
    return readBlob(blob.slice(base)).then(function (tail) {
      for (var i = tail.length - 22; i >= 0; i--) {
        if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
          var commentLen = u16(tail, i + 20);
          if (i + 22 + commentLen > tail.length) continue;
          return { pos: base + i, rec: tail.subarray(i, i + 22), before: tail.subarray(Math.max(0, i - 20), i) };
        }
      }
      return null;
    });
  }

  // Returns [{ path, size, read() }] for every file entry in the zip.
  function readZip(blob) {
    return findEocd(blob).then(function (eocd) {
      if (!eocd) throw userError(MSG.notPackage);
      var r = eocd.rec;
      var count = u16(r, 10);
      var cdSize = u32(r, 12);
      var cdOffset = u32(r, 16);
      var b = eocd.before;
      var hasZip64Locator = b.length === 20 && u32(b, 0) === 0x07064b50;
      if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff || hasZip64Locator) {
        throw userError(MSG.zipUnsupported);
      }
      if (cdSize === 0) return [];
      // Tolerate archives with data prepended after creation (offsets then
      // count from the original start): the directory ends right at the EOCD.
      var shift = eocd.pos - cdSize - cdOffset;
      if (shift < 0) throw userError(MSG.zipDamaged);
      return readBlob(blob.slice(cdOffset + shift, cdOffset + shift + cdSize)).then(function (cd) {
        return parseCentralDirectory(blob, cd, shift);
      });
    });
  }

  function parseCentralDirectory(blob, cd, shift) {
    var entries = [];
    var o = 0;
    while (o + 46 <= cd.length && u32(cd, o) === 0x02014b50) {
      var flags = u16(cd, o + 8);
      var method = u16(cd, o + 10);
      var csize = u32(cd, o + 20);
      var usize = u32(cd, o + 24);
      var nameLen = u16(cd, o + 28);
      var extraLen = u16(cd, o + 30);
      var commentLen = u16(cd, o + 32);
      var localOffset = u32(cd, o + 42);
      if (o + 46 + nameLen > cd.length) throw userError(MSG.zipDamaged);
      var rawName = decodeName(cd.subarray(o + 46, o + 46 + nameLen), (flags & 0x800) !== 0);
      o += 46 + nameLen + extraLen + commentLen;

      if (flags & 1) throw userError(MSG.zipUnsupported);
      if (csize === 0xffffffff || usize === 0xffffffff || localOffset === 0xffffffff) throw userError(MSG.zipUnsupported);
      var isDir = /[\\/]$/.test(rawName);
      var path = normalizePath(rawName);
      if (isDir || !path || isJunk(path)) continue;
      entries.push(zipEntry(blob, path, method, csize, usize, localOffset + shift));
    }
    return entries;
  }

  function zipEntry(blob, path, method, csize, usize, localOffset) {
    return {
      path: path,
      size: usize,
      read: function () {
        if (method !== 0 && method !== 8) return Promise.reject(userError(MSG.zipMethod));
        return readBlob(blob.slice(localOffset, localOffset + 30)).then(function (h) {
          if (h.length < 30 || u32(h, 0) !== 0x04034b50) throw userError(MSG.zipDamaged);
          var start = localOffset + 30 + u16(h, 26) + u16(h, 28);
          var data = blob.slice(start, start + csize);
          return method === 0 ? readBlob(data) : inflateRaw(data);
        });
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Package sniffing (by magic bytes, never by filename)

  function readPackageFile(file) {
    return readBlob(file.slice(0, 16)).then(function (h) {
      if (h.length >= 4 && h[0] === 0x43 && h[1] === 0x72 && h[2] === 0x32 && h[3] === 0x34) {
        if (h.length < 12) throw userError(MSG.zipDamaged);
        var version = u32(h, 4);
        var headerLen;
        if (version === 2) {
          if (h.length < 16) throw userError(MSG.zipDamaged);
          headerLen = 16 + u32(h, 8) + u32(h, 12);
        } else if (version === 3) {
          headerLen = 12 + u32(h, 8);
        } else {
          throw userError(MSG.crxVersion);
        }
        if (headerLen > file.size) throw userError(MSG.zipDamaged);
        return readZip(file.slice(headerLen)).then(function (entries) { return { source: 'crx', entries: entries }; });
      }
      return readZip(file).then(function (entries) { return { source: 'zip', entries: entries }; });
    });
  }

  // ---------------------------------------------------------------------------
  // Folders

  function fileEntry(path, file) {
    return { path: path, size: file.size, read: function () { return readBlob(file); } };
  }

  function entriesFromFileList(files) {
    var out = [];
    files.forEach(function (f) {
      var path = normalizePath(f.webkitRelativePath || f.name);
      if (path && !isJunk(path)) out.push(fileEntry(path, f));
    });
    return out;
  }

  function callbackPromise(fn) {
    return new Promise(function (resolve, reject) { fn(resolve, reject); });
  }

  function walkDirectory(dirEntry, out) {
    var reader = dirEntry.createReader();
    var children = [];
    // readEntries returns results in batches; keep calling until it returns [].
    function next() {
      return callbackPromise(function (ok, bad) { reader.readEntries(ok, bad); }).then(function (batch) {
        if (!batch.length) return;
        children.push.apply(children, batch);
        return next();
      });
    }
    return next().then(function () {
      return children.reduce(function (p, child) {
        return p.then(function () {
          if (child.isDirectory) return walkDirectory(child, out);
          if (!child.isFile) return;
          var path = normalizePath(child.fullPath);
          if (!path || isJunk(path)) return;
          return callbackPromise(function (ok, bad) { child.file(ok, bad); }).then(function (f) {
            out.push(fileEntry(path, f));
          });
        });
      }, Promise.resolve());
    });
  }

  // ---------------------------------------------------------------------------
  // Package index rooted at the shallowest manifest.json

  function buildPackage(source, entries) {
    var manifestPath = null;
    var depth = Infinity;
    entries.forEach(function (e) {
      var segs = e.path.split('/');
      if (segs[segs.length - 1] !== 'manifest.json') return;
      if (segs.length < depth || (segs.length === depth && e.path < manifestPath)) {
        depth = segs.length;
        manifestPath = e.path;
      }
    });
    if (manifestPath === null) throw userError(source === 'folder' ? MSG.folderNoManifest : MSG.packageNoManifest);
    var prefix = manifestPath.slice(0, manifestPath.length - 'manifest.json'.length);

    var files = new Map();
    var lower = new Map();
    entries.forEach(function (e) {
      if (e.path.slice(0, prefix.length) !== prefix) return;
      var rel = e.path.slice(prefix.length);
      if (files.has(rel)) return;
      var entry = { path: rel, size: e.size, read: e.read };
      files.set(rel, entry);
      var key = rel.toLowerCase();
      if (!lower.has(key)) lower.set(key, entry);
    });
    return {
      source: source,
      files: files,
      exact: function (p) { return files.get(p) || null; },
      find: function (p) { return files.get(p) || lower.get(p.toLowerCase()) || null; }
    };
  }

  // ---------------------------------------------------------------------------
  // JSON with BOM / comments / trailing commas

  function stripJsonExtras(s) {
    var out = [];
    var start = 0;
    var i = 0;
    var n = s.length;
    while (i < n) {
      var c = s.charCodeAt(i);
      if (c === 34) { // string literal
        i++;
        while (i < n) {
          var d = s.charCodeAt(i);
          if (d === 92) { i += 2; continue; }
          i++;
          if (d === 34) break;
        }
        continue;
      }
      if (c === 47 && s.charCodeAt(i + 1) === 47) { // line comment
        out.push(s.slice(start, i));
        var nl = s.indexOf('\n', i);
        i = start = nl < 0 ? n : nl;
        continue;
      }
      if (c === 47 && s.charCodeAt(i + 1) === 42) { // block comment
        out.push(s.slice(start, i), ' ');
        var end = s.indexOf('*/', i + 2);
        i = start = end < 0 ? n : end + 2;
        continue;
      }
      if (c === 44) { // drop a trailing comma before } or ]
        var j = i + 1;
        while (j < n && /\s/.test(s[j])) j++;
        if (s[j] === '}' || s[j] === ']') {
          out.push(s.slice(start, i));
          start = i + 1;
        }
      }
      i++;
    }
    out.push(s.slice(start));
    return out.join('');
  }

  function parseJsonLoose(bytes) {
    var text = utf8.decode(bytes).replace(/^\uFEFF/, '');
    try { return JSON.parse(text); } catch (e) { return JSON.parse(stripJsonExtras(text)); }
  }

  // ---------------------------------------------------------------------------
  // Locale resolution

  function loadMessages(pkg, locale) {
    if (!locale) return Promise.resolve(null);
    var variants = [locale, locale.replace(/-/g, '_')];
    var entry = null;
    for (var i = 0; i < variants.length && !entry; i++) entry = pkg.find('_locales/' + variants[i] + '/messages.json');
    if (!entry) return Promise.resolve(null);
    return entry.read().then(function (bytes) {
      var json = parseJsonLoose(bytes);
      var map = new Map();
      if (json && typeof json === 'object') {
        Object.keys(json).forEach(function (k) {
          var v = json[k];
          if (v && typeof v.message === 'string') map.set(k.toLowerCase(), v.message);
        });
      }
      return map;
    }).catch(function () { return null; });
  }

  var MSG_RE = /__MSG_([A-Za-z0-9_@]+)__/g;

  function needsLocale(s) { return typeof s === 'string' && s.indexOf('__MSG_') !== -1; }

  function resolveMessage(s, tables) {
    if (typeof s !== 'string') return '';
    return s.replace(MSG_RE, function (_, key) {
      var k = key.toLowerCase();
      for (var i = 0; i < tables.length; i++) {
        if (tables[i] && tables[i].has(k)) return tables[i].get(k);
      }
      return key;
    });
  }

  // ---------------------------------------------------------------------------
  // Manifest analysis

  function isHostPattern(s) {
    return s === '<all_urls>' || /^[a-z*][a-z0-9+.*-]*:\/\//i.test(s);
  }

  function strings(v) {
    if (typeof v === 'string') return [v];
    return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : [];
  }

  function sortedUnique(arr) {
    return Array.from(new Set(arr)).sort();
  }

  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }

  function iconCandidates(m) {
    var sources = [m.icons];
    ['action', 'browser_action', 'page_action'].forEach(function (k) {
      var a = obj(m[k]);
      if (a) sources.push(a.default_icon);
    });
    var out = [];
    sources.forEach(function (src) {
      if (typeof src === 'string') { out.push({ size: 0, path: src }); return; }
      if (!obj(src)) return;
      Object.keys(src)
        .filter(function (k) { return typeof src[k] === 'string'; })
        .map(function (k) { return { size: parseFloat(k) || 0, path: src[k] }; })
        .sort(function (a, b) { return b.size - a.size; })
        .forEach(function (c) { out.push(c); });
    });
    return out;
  }

  function referencedPaths(m) {
    var refs = [];
    function add(v) { strings(v).forEach(function (s) { refs.push(s); }); }
    function addPage(v) { strings(v).forEach(function (s) { refs.push(s.replace(/[?#].*$/, '')); }); }

    var bg = obj(m.background);
    if (bg) {
      add(bg.service_worker);
      add(bg.scripts);
      addPage(bg.page);
    }
    (Array.isArray(m.content_scripts) ? m.content_scripts : []).forEach(function (cs) {
      if (!obj(cs)) return;
      add(cs.js);
      add(cs.css);
    });
    ['action', 'browser_action', 'page_action'].forEach(function (k) {
      var a = obj(m[k]);
      if (!a) return;
      addPage(a.default_popup);
      var icon = a.default_icon;
      if (typeof icon === 'string') add(icon);
      else if (obj(icon)) Object.keys(icon).forEach(function (s) { add(icon[s]); });
    });
    addPage(m.options_page);
    if (obj(m.options_ui)) addPage(m.options_ui.page);
    addPage(m.devtools_page);
    if (obj(m.icons)) Object.keys(m.icons).forEach(function (s) { add(m.icons[s]); });
    if (obj(m.side_panel)) addPage(m.side_panel.default_path);
    (Array.isArray(m.web_accessible_resources) ? m.web_accessible_resources : []).forEach(function (w) {
      if (typeof w === 'string') add(w);
      else if (obj(w)) add(w.resources);
    });

    var seen = new Set();
    var out = [];
    refs.forEach(function (r) {
      if (!r || r.indexOf('*') !== -1 || /^[a-z][a-z0-9+.-]*:/i.test(r)) return;
      var p = normalizePath(r);
      if (p && !seen.has(p)) { seen.add(p); out.push(p); }
    });
    return out;
  }

  function loadIcon(pkg, m) {
    var cands = iconCandidates(m);
    for (var i = 0; i < cands.length; i++) {
      var entry = pkg.find(normalizePath(cands[i].path));
      if (!entry) continue;
      var type = ICON_MIME[extOf(entry.path)] || 'image/png';
      return entry.read().then(function (bytes) {
        return URL.createObjectURL(new Blob([bytes], { type: type }));
      }).catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  var NS_RE = /(?:^|[^\w$])(?:chrome|browser)\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)|(?:^|[^\w$])(?:chrome|browser)\s*(?:\?\.)?\[\s*(['"`])([A-Za-z_$][\w$]*)\2\s*\]/g;

  function scanNamespaces(pkg, firstPaths) {
    var found = new Set();
    var total = 0;
    var truncated = false;
    var order = [];
    var queued = new Set();
    function queue(e) {
      if (e && !queued.has(e.path) && /^m?js$/.test(extOf(e.path))) { queued.add(e.path); order.push(e); }
    }
    firstPaths.forEach(function (p) { queue(pkg.find(p)); });
    Array.from(pkg.files.keys()).sort().forEach(function (p) { queue(pkg.files.get(p)); });

    return order.reduce(function (p, entry) {
      return p.then(function () {
        if (truncated) return;
        if (total + entry.size > JS_SCAN_CAP) { truncated = true; return; }
        total += entry.size;
        return entry.read().then(function (bytes) {
          var text = utf8.decode(bytes);
          NS_RE.lastIndex = 0;
          var m;
          while ((m = NS_RE.exec(text))) {
            var name = m[1] || m[3];
            if (NAMESPACE_SET.has(name)) found.add(name);
          }
        }, function (e) {
          if (e && e.viaductUserFacing && e.message === MSG.noInflate) throw e;
        });
      });
    }, Promise.resolve()).then(function () {
      return { namespaces: Array.from(found).sort(), truncated: truncated };
    });
  }

  function analyze(pkg) {
    var manifestEntry = pkg.exact('manifest.json');
    return manifestEntry.read().then(function (bytes) {
      var m;
      try { m = parseJsonLoose(bytes); } catch (e) { throw userError(MSG.badManifest); }
      if (!obj(m)) throw userError(MSG.badManifest);

      var defaultLocale = typeof m.default_locale === 'string' ? m.default_locale : '';
      var wantLocale = needsLocale(m.name) || needsLocale(m.description);
      var localesP = wantLocale
        ? Promise.all([
          loadMessages(pkg, defaultLocale),
          defaultLocale.toLowerCase() === 'en' ? null : loadMessages(pkg, 'en')
        ])
        : Promise.resolve([]);

      var refs = referencedPaths(m);
      var caseMismatches = [];
      var missing = [];
      refs.forEach(function (p) {
        if (pkg.exact(p)) return;
        var alt = pkg.find(p);
        if (alt) caseMismatches.push({ ref: p, actual: alt.path });
        else missing.push(p);
      });

      var perms = [];
      var hosts = [];
      (Array.isArray(m.permissions) ? m.permissions : []).forEach(function (p) {
        if (typeof p === 'string') (isHostPattern(p) ? hosts : perms).push(p);
        else if (obj(p)) Object.keys(p).forEach(function (k) { perms.push(k); });
      });
      strings(m.host_permissions).forEach(function (h) { hosts.push(h); });
      var contentScripts = Array.isArray(m.content_scripts) ? m.content_scripts : [];
      contentScripts.forEach(function (cs) {
        if (obj(cs)) strings(cs.matches).forEach(function (h) { hosts.push(h); });
      });

      var bg = obj(m.background);
      var background = null;
      if (bg) {
        if (typeof bg.service_worker === 'string') background = 'service_worker';
        else if (Array.isArray(bg.scripts) && bg.scripts.length) background = 'scripts';
        else if (typeof bg.page === 'string') background = 'page';
      }

      var mv = m.manifest_version === 2 || m.manifest_version === 3 ? m.manifest_version : null;

      return Promise.all([localesP, scanNamespaces(pkg, refs), loadIcon(pkg, m)]).then(function (r) {
        var tables = r[0];
        return {
          source: pkg.source,
          name: resolveMessage(m.name, tables),
          version: typeof m.version === 'string' ? m.version : (m.version == null ? '' : String(m.version)),
          description: resolveMessage(m.description, tables),
          manifestVersion: mv,
          iconUrl: r[2],
          background: background,
          permissions: sortedUnique(perms),
          hostPermissions: sortedUnique(hosts),
          contentScripts: contentScripts.length,
          namespaces: r[1].namespaces,
          files: pkg.files.size,
          caseMismatches: caseMismatches,
          missing: missing,
          truncatedScan: r[1].truncated
        };
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Public API

  function fromSingleFile(file) {
    return readPackageFile(file).then(function (p) { return analyze(buildPackage(p.source, p.entries)); });
  }

  function fromFiles(fileList) {
    return guard(Promise.resolve().then(function () {
      var files = Array.prototype.slice.call(fileList || []);
      if (!files.length) throw userError(MSG.nothing);
      var isFolder = files.some(function (f) { return (f.webkitRelativePath || '').indexOf('/') !== -1; });
      if (isFolder) return analyze(buildPackage('folder', entriesFromFileList(files)));
      if (files.length > 1) throw userError(MSG.oneAtATime);
      return fromSingleFile(files[0]);
    }));
  }

  function fromDataTransfer(dt) {
    // Items are only readable during the drop event, so capture everything
    // synchronously before the first await.
    var picked = [];
    var items = dt && dt.items ? Array.prototype.slice.call(dt.items) : [];
    items.forEach(function (item) {
      if (item.kind !== 'file') return;
      var entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
      picked.push({ entry: entry, file: item.getAsFile() });
    });
    if (!items.length && dt && dt.files) {
      Array.prototype.slice.call(dt.files).forEach(function (f) { picked.push({ entry: null, file: f }); });
    }

    return guard(Promise.resolve().then(function () {
      if (!picked.length) throw userError(MSG.nothing);
      if (picked.length > 1) throw userError(MSG.oneAtATime);
      var p = picked[0];
      if (p.entry && p.entry.isDirectory) {
        var out = [];
        return walkDirectory(p.entry, out).then(function () {
          return analyze(buildPackage('folder', out));
        }, function () { throw userError(MSG.folderRead); });
      }
      if (p.file) return fromSingleFile(p.file);
      if (p.entry && p.entry.isFile) {
        return callbackPromise(function (ok, bad) { p.entry.file(ok, bad); }).then(fromSingleFile);
      }
      throw userError(MSG.nothing);
    }));
  }

  function revoke(report) {
    if (report && report.iconUrl) {
      URL.revokeObjectURL(report.iconUrl);
      report.iconUrl = null;
    }
  }

  window.ViaductInspect = { fromFiles: fromFiles, fromDataTransfer: fromDataTransfer, revoke: revoke };
})();
