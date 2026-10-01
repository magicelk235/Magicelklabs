/* Traffic-source attribution for Gumroad sales.
 *
 * Load near the end of <body> on every page a visitor can land on (after
 * footer.js, whose links it also tags):
 *   <script src="/assets/attribution.js"></script>
 *
 * A visit that arrives tagged (?ref=macapp.supply, or
 * ?utm_source=…&utm_medium=…&utm_campaign=…) or from another site
 * (document.referrer) is remembered in sessionStorage for the rest of the
 * visit, so it survives browsing from the landing page to a product page.
 * Every gumroad.com/l/<product> link then carries it to Gumroad:
 *   - referrer=https://<source>/  Gumroad's Analytics > Referrers shows the
 *     host of this URL, so the sale is credited to macapp.supply instead of
 *     magicelklabs.com. Gumroad keeps it through the ?wanted=true redirect and
 *     the product page's own checkout button.
 *   - utm_source/utm_medium/utm_campaign  Gumroad's UTM links only record a
 *     visit when all three are present, so medium and campaign default to
 *     "referral" and "magicelklabs" when the inbound link had only ?ref=.
 */
(function () {
  var KEY = "mel-source";
  var UTM_EXTRA = ["utm_medium", "utm_campaign", "utm_term", "utm_content"];

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function save(s) {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  // Record the source of this visit. An explicit tag or a new arrival from
  // another site replaces what's stored; moving between our own pages keeps it.
  var external = "";
  try {
    if (document.referrer && new URL(document.referrer).host !== location.host) external = document.referrer;
  } catch (e) {}
  var q = new URLSearchParams(location.search);
  var tag = q.get("ref") || q.get("utm_source");
  if (tag) {
    var s = { source: tag };
    UTM_EXTRA.forEach(function (k) { if (q.get(k)) s[k] = q.get(k); });
    if (external) s.referrer = external;
    save(s);
  } else if (external) {
    save({ referrer: external });
  }
  var visit = load();
  if (!visit) return;

  // "macapp.supply", "https://macapp.supply/apps", "My Newsletter" -> a host.
  function sourceHost(tag) {
    return tag.toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split(/[\/?#]/)[0]
      .replace(/[^a-z0-9.-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  }

  function gumroadProduct(href) {
    var url;
    try { url = new URL(href); } catch (e) { return null; }
    var host = url.hostname;
    if (url.protocol !== "https:") return null;
    if (host !== "gumroad.com" && !/\.gumroad\.com$/.test(host)) return null;
    if (url.pathname.indexOf("/l/") !== 0) return null;
    return url;
  }

  // A tag that names a site ("macapp.supply") becomes the referrer outright.
  // A bare label ("reddit", "newsletter") is only used when the browser gave
  // no real referrer, which would be the more precise source.
  var host = visit.source ? sourceHost(visit.source) : "";
  var referrer = host && (host.indexOf(".") !== -1 || !visit.referrer) ? "https://" + host + "/" : visit.referrer;

  document.querySelectorAll("a[href]").forEach(function (a) {
    var url = gumroadProduct(a.href);
    if (!url) return;
    if (referrer) url.searchParams.set("referrer", referrer);
    if (visit.source) {
      url.searchParams.set("utm_source", visit.source);
      url.searchParams.set("utm_medium", visit.utm_medium || "referral");
      url.searchParams.set("utm_campaign", visit.utm_campaign || "magicelklabs");
      if (visit.utm_term) url.searchParams.set("utm_term", visit.utm_term);
      if (visit.utm_content) url.searchParams.set("utm_content", visit.utm_content);
    }
    a.href = url.toString();
  });
})();
