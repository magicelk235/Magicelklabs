/* Global site footer.
 *
 * One footer for every page. Drop this near the end of <body>:
 *   <script src="/assets/footer.js"></script>
 *
 * Renders: brand + copyright on the left, links on the right. Uses the site's
 * existing CSS vars (--ink, --mute, --hair), and picks up whichever accent the
 * host page defines: --accent on the house pages, --brass on Spyglass,
 * --teal on Viaduct.
 *
 * Defaults to Contact + GitHub. To add page-specific links (e.g. Privacy /
 * Terms on a product page), set data-links on the script tag as a
 * "Label|href" list separated by commas. Those extra links render before
 * the two defaults:
 *
 *   <script src="/assets/footer.js"
 *           data-links="Privacy|./privacy.html, Terms|./terms.html"></script>
 *
 * Override the defaults entirely with data-links-only="1", or point Contact /
 * GitHub elsewhere with data-contact / data-github. Change the brand or year
 * with data-brand / data-year. Set data-product to add a product name to the
 * brand line (e.g. "Magicelk Labs · Spyglass · © 2026").
 */
(function () {
  var script = document.currentScript;
  var d = script ? script.dataset : {};

  var brand = d.brand || "Magicelk Labs";
  var product = d.product || "";
  var year = d.year || "2026";
  var contact = d.contact || "mailto:support@magicelklabs.com";
  var github = d.github || "https://github.com/magicelk235";

  // Extra links from data-links: "Label|href, Label|href"
  var links = [];
  if (d.links) {
    d.links.split(",").forEach(function (pair) {
      var parts = pair.split("|");
      var label = (parts[0] || "").trim();
      var href = (parts[1] || "").trim();
      if (label && href) links.push({ label: label, href: href });
    });
  }
  // Defaults appended unless the page opts out.
  if (d.linksOnly !== "1") {
    links.push({ label: "Contact", href: contact });
    links.push({ label: "GitHub", href: github });
  }

  if (!document.getElementById("mel-footer-style")) {
    var css = document.createElement("style");
    css.id = "mel-footer-style";
    css.textContent = [
      ".mel-footer{border-top:1px solid var(--hair);padding:40px 0 56px;font-size:14px;color:var(--mute)}",
      ".mel-footer .mel-wrap{max-width:1080px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:16px}",
      ".mel-footer .mel-mark{font-family:'Cabinet Grotesk','Inter',sans-serif;font-size:16px;color:var(--ink)}",
      ".mel-footer .mel-mark .mel-year{color:var(--mute);font-family:Inter,sans-serif;font-size:13px}",
      ".mel-footer .mel-links{display:flex;gap:20px;flex-wrap:wrap}",
      ".mel-footer .mel-links a{color:var(--mute);font-weight:500;text-decoration:none;transition:color .15s}",
      ".mel-footer .mel-links a:hover{color:var(--accent,var(--brass,var(--teal,inherit)))}"
    ].join("");
    document.head.appendChild(css);
  }

  var linksHtml = links.map(function (l) {
    return '<a href="' + l.href + '">' + l.label + "</a>";
  }).join("");

  var footer = document.createElement("footer");
  footer.className = "mel-footer";
  var productHtml = product ? " · " + product : "";
  footer.innerHTML =
    '<div class="mel-wrap">' +
      '<span class="mel-mark">' + brand + productHtml +
        ' <span class="mel-year">· © ' + year + "</span></span>" +
      '<div class="mel-links">' + linksHtml + "</div>" +
    "</div>";

  // Render where an explicit placeholder sits, else at end of body.
  var mount = document.getElementById("site-footer");
  if (mount) mount.replaceWith(footer);
  else document.body.appendChild(footer);
})();
