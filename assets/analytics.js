/* Visit counting with Umami Cloud. No cookies.
 *
 * Load in <head> on every page:
 *   <script defer src="/assets/analytics.js"></script>
 * A page with a Content-Security-Policy also needs https://cloud.umami.is in
 * script-src and https://gateway.umami.is (where hits are sent) in connect-src.
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
 *             when the link preselects a ?variant=)
 *   Download  a click on a github.com/<owner>/<repo>/releases/… link (named
 *             after the file, so .../download/Viaduct.dmg is "Viaduct")
 * Both are read from the link itself, so new buttons need no extra markup.
 */
(function () {
  var tracker = document.createElement("script");
  tracker.src = "https://cloud.umami.is/script.js";
  tracker.setAttribute("data-website-id", "e68f6430-d62b-4fdb-a63a-26d118ca8721");
  tracker.setAttribute("data-domains", "magicelklabs.com");
  document.head.appendChild(tracker);

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
    if (!a || !window.umami) return;
    var ev = linkEvent(a);
    if (ev) window.umami.track(ev.name, { product: ev.product });
  }
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);
})();
