#!/usr/bin/env node
// Builds the sample extensions offered under "Now try yours" on the Viaduct
// page. Each one is downloaded from the Chrome Web Store as a .crx and read by
// the same assets/inspect.js the page runs, so a sample shows exactly what the
// page would show if the visitor dropped that file in. The page can't fetch
// the packages itself (the store has no CORS and the page's CSP only allows
// its own origin), so the results ship as samples.json plus one icon each.
//
//   cd viaduct/assets/samples && node build.mjs
//
// Needs Node 20+ and network access. Re-run when a sample should pick up a
// newer version, or after editing SAMPLES.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { resolveObjectURL } from 'node:buffer';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// slug matches the guide under /viaduct/extensions/<slug>/.
const SAMPLES = [
  { slug: 'dark-reader', id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh' },
  { slug: 'tampermonkey', id: 'dhdgffkkebhmkfjojejmpbldmpobfkfo' },
  { slug: 'sponsorblock', id: 'mnjggcdmjocbbbhaepdhchncahnbgone' },
  { slug: 'return-youtube-dislike', id: 'gebbhagfogifgggkldgodflihgfeippi' },
  { slug: 'video-speed-controller', id: 'nffaoalbilbmmfgbnbgppjihopabppdk' },
  { slug: 'stylus', id: 'clngdbkpkpeebahjckkjfobafhncgmne' },
];

const crxUrl = (id) => 'https://clients2.google.com/service/update2/crx?response=redirect' +
  '&prodversion=130.0&acceptformat=crx2,crx3&x=id%3D' + id + '%26uc';

globalThis.window = globalThis;
vm.runInThisContext(fs.readFileSync(path.join(HERE, '..', 'inspect.js'), 'utf8'), { filename: 'inspect.js' });
const inspect = globalThis.ViaductInspect;

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/webp': 'webp' };

const out = [];
for (const s of SAMPLES) {
  const res = await fetch(crxUrl(s.id), { redirect: 'follow' });
  if (!res.ok) throw new Error(`${s.slug}: download failed with ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const report = await inspect.fromFiles([new File([bytes], s.slug + '.crx')]);

  let icon = null;
  if (report.iconUrl) {
    const blob = resolveObjectURL(report.iconUrl);
    const ext = EXT[blob.type] || 'png';
    icon = `assets/samples/${s.slug}.${ext}`;
    fs.writeFileSync(path.join(HERE, `${s.slug}.${ext}`), Buffer.from(await blob.arrayBuffer()));
    inspect.revoke(report);
  }
  delete report.iconUrl;
  out.push({ slug: s.slug, icon, ...report });
  console.log(`${s.slug}: ${report.name} ${report.version}, ${report.namespaces.length} APIs, ${(bytes.length / 1e6).toFixed(1)} MB`);
}
fs.writeFileSync(path.join(HERE, 'samples.json'), JSON.stringify(out) + '\n');
