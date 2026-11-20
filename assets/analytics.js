/* Visit counting with Umami Cloud (no cookies), and the Google tag that
 * reports Buy clicks to Google Ads as conversions (Google sets cookies).
 *
 * Load in <head> on every page:
 *   <script defer src="/assets/analytics.js"></script>
 * A page with a Content-Security-Policy also needs https://cloud.umami.is in
 * script-src and https://gateway.umami.is (where hits are sent) in connect-src,
 * plus the Google hosts every page's CSP already lists (README.md, Analytics).
 *
 * The Google tag is container GTM-PKW9ZDW9. It loads on magicelklabs.com
 * only, like Umami, so local previews send Google nothing. A Buy click sends
 * the Ads conversion in GOOGLE_ADS_BUY. The link is left to open by itself:
 * the checkout is an overlay or a new page, so the click handler must not
 * navigate the way Google's stock gtag_report_conversion(url) does.
 *
 * Umami records page views, referrers, ?utm_* tags, country, device and browser
 * by itself. It sets no cookies; the only storage it touches is reading
 * localStorage "umami.disabled", so setting that to 1 in a browser stops that
 * browser being counted. data-domains limits counting to the live site, so
 * local previews send nothing.
 *
 * This file adds two events. Each carries only the product, because every
 * property counts against the plan's monthly event quota and Umami already
 * stores the page the click happened on:
 *   Buy       a click on a gumroad.com/l/<product> link ("Lector Translate"
 *             when the link preselects a ?variant=), or on a buy.polar.sh
 *             checkout link, named by its data-product attribute
 *             (data-product="Viaduct Mixed") or else from POLAR_CHECKOUTS
 *   Download  a click on a github.com/<owner>/<repo>/releases/… link (named
 *             after the file, so .../download/Viaduct.dmg is "Viaduct")
 * Both are read from the link itself, so new buttons need no extra markup,
 * apart from a new Polar checkout link, which needs a data-product attribute
 * or a line in POLAR_CHECKOUTS.
 */
(function () {
  var tracker = document.createElement("script");
  tracker.src = "https://cloud.umami.is/script.js";
  tracker.setAttribute("data-website-id", "e68f6430-d62b-4fdb-a63a-26d118ca8721");
  tracker.setAttribute("data-domains", "magicelklabs.com");
  document.head.appendChild(tracker);

  var GOOGLE_TAG = "GTM-PKW9ZDW9";
  var GOOGLE_ADS_BUY = "AW-18552671806/Gaa7CJHmibQdEL6czY5F";
  var gtag = null;
  if (location.hostname === "magicelklabs.com") {
    var gtm = document.createElement("script");
    gtm.async = true;
    gtm.src = "https://www.googletagmanager.com/gtm.js?id=" + GOOGLE_TAG;
    document.head.appendChild(gtm);
    window.dataLayer = window.dataLayer || [];
    // Google's tag reads the arguments object itself, so this can't push an array.
    gtag = function () { window.dataLayer.push(arguments); };
    gtag("js", new Date());
  }

  // A Polar checkout link's path names no product, so a link without a
  // data-product attribute is named from this table.
  var POLAR_CHECKOUTS = {
    "polar_cl_tkgqF9gxvlZNU5Ge769WkrAE6Slzsr5e2PmnI4HV1NT": "Lector Text",
    "polar_cl_DRiORzR9dAEomeWXX9oMsMB5YfOMM0lEn58xm0dzoKs": "Lector Translate",
    "polar_cl_AI6jll9ffzZxapGmXkblVNZEQE0yecYUrLbcU2qceSe": "Lector Upgrade",
    "polar_cl_DfMvRZc8P5OMZIzuY8duXI1SfOvQdELriv42m0La9Dm": "Spyglass Pro",
    "polar_cl_q0t2tPuZCbeIbnkku4ovVpGhCtZZuUeUsCMK52IcjnU": "Spyglass Drive"
  };

  // "lector-upgrade" -> "Lector Upgrade"
  function titleCase(slug) {
    return slug.split("-").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }

  function linkEvent(a) {
    var url;
    try { url = new URL(a.href); } catch (e) { return null; }
    var host = url.hostname;
    var path = url.pathname.split("/").filter(Boolean);
    if ((host === "gumroad.com" || /\.gumroad\.com$/.test(host)) && path[0] === "l" && path[1]) {
      var variant = url.searchParams.get("variant");
      return { name: "Buy", product: titleCase(path[1]) + (variant ? " " + variant : "") };
    }
    if (host === "buy.polar.sh" && path[0]) {
      return { name: "Buy", product: a.getAttribute("data-product") || POLAR_CHECKOUTS[path[0]] || "Polar " + path[0] };
    }
    if (host === "github.com" && path[2] === "releases") {
      var file = path[path.length - 1];
      return { name: "Download", product: /\.(dmg|zip|pkg)$/i.test(file) ? file.replace(/\.[^.]+$/, "") : titleCase(path[1]) };
    }
    return null;
  }

  // Capture phase, so a page script that stops the click still gets counted.
  // auxclick covers a middle-click opening the link in a new tab.
  function onClick(e) {
    if (e.type === "auxclick" && e.button !== 1) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var ev = linkEvent(a);
    if (!ev) return;
    if (window.umami) window.umami.track(ev.name, { product: ev.product });
    if (gtag && ev.name === "Buy") {
      gtag("event", "conversion", { send_to: GOOGLE_ADS_BUY, value: 1.0, currency: "USD", transaction_id: "" });
    }
  }
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);
})();
