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
 * brand line (e.g. "Magicelk Labs · Spyglass · © 2026"). The brand name
 * always links home to /.
 *
 * On a product page, add data-more="1" to render a "More from Magicelk Labs"
 * strip above the footer: every app in APPS except the one named by
 * data-product, shown as its shelf cover. A new app is one entry in APPS.
 */
(function () {
  var APPS = [
    {
      name: "Spyglass",
      href: "/spyglass/",
      cover: "/assets/spyglass-cover.webp",
      alt: "Spyglass showing a Google Doc in Quick Look instead of raw JSON",
      line: "Press Space on a .gdoc and read the document instead of the JSON sitting on disk."
    },
    {
      name: "Viaduct",
      href: "/viaduct/",
      cover: "/assets/viaduct-cover.webp",
      alt: "The Viaduct cover: Run any Chrome extension, now native in Safari, beside the app window's drop zone",
      line: "Drop in a Chrome extension and get a signed Safari one back, without opening Xcode."
    },
    {
      name: "Lector",
      href: "/lector/",
      cover: "/assets/lector-cover.webp",
      alt: "The Lector cover: Japanese Wikipedia on a Mac with Lector's English translation painted over the article",
      line: "Press a shortcut and the text on your screen is copied, or translated in place, on your Mac."
    }
  ];

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
    links.push({ label: "About", href: "/about/" });
    links.push({ label: "Contact", href: contact });
    links.push({ label: "GitHub", href: github });
  }

  var accent = "var(--accent,var(--brass,var(--teal,currentColor)))";
  if (!document.getElementById("mel-footer-style")) {
    var css = document.createElement("style");
    css.id = "mel-footer-style";
    css.textContent = [
      ".mel-footer{border-top:1px solid var(--hair);padding:40px 0 56px;font-size:14px;color:var(--mute)}",
      ".mel-footer .mel-wrap{max-width:1080px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:16px}",
      ".mel-footer .mel-mark{font-family:'Cabinet Grotesk','Inter',sans-serif;font-size:16px;color:var(--ink)}",
      ".mel-footer .mel-mark a{color:inherit;text-decoration:none;transition:color .15s}",
      ".mel-footer .mel-mark a:hover{color:" + accent + "}",
      ".mel-footer .mel-mark .mel-year{color:var(--mute);font-family:Inter,sans-serif;font-size:13px}",
      ".mel-footer .mel-links{display:flex;gap:20px;flex-wrap:wrap}",
      ".mel-footer .mel-links a{color:var(--mute);font-weight:500;text-decoration:none;transition:color .15s}",
      ".mel-footer .mel-links a:hover{color:" + accent + "}",
      ".mel-more{padding:clamp(64px,10vh,112px) 0 clamp(56px,8vh,88px)}",
      ".mel-more .mel-wrap{max-width:1080px;margin:0 auto;padding:0 24px}",
      ".mel-more h2{font-family:'Cabinet Grotesk','Inter',sans-serif;font-size:clamp(26px,3.2vw,34px);font-weight:800;letter-spacing:-.02em;line-height:1.1;color:var(--ink);margin:0;padding-bottom:20px;border-bottom:1px solid var(--hair)}",
      ".mel-more-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(24px,4vw,44px);margin-top:clamp(28px,4vh,44px)}",
      ".mel-app{display:block;color:inherit;text-decoration:none;border-radius:14px}",
      ".mel-app:focus-visible{outline:2px solid " + accent + ";outline-offset:4px}",
      ".mel-cover{border-radius:14px;overflow:hidden;background:var(--surface);border:1px solid var(--hair);box-shadow:var(--lip);transition:transform .45s cubic-bezier(.16,1,.3,1),border-color .3s}",
      ".mel-cover img{display:block;width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover}",
      ".mel-app:hover .mel-cover{transform:translateY(-2px);border-color:rgba(255,255,255,.18)}",
      ".mel-app h3{font-family:'Cabinet Grotesk','Inter',sans-serif;font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.2;color:var(--ink);margin:16px 0 0}",
      ".mel-app p{font-size:15px;line-height:1.55;color:var(--body,var(--mute));margin:6px 0 0;max-width:40ch}",
      "@media(max-width:820px){.mel-more-grid{grid-template-columns:1fr}}",
      "@media(prefers-reduced-motion:reduce){.mel-cover{transition:none}.mel-app:hover .mel-cover{transform:none}}"
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
      '<span class="mel-mark"><a href="/">' + brand + "</a>" + productHtml +
        ' <span class="mel-year">· © ' + year + "</span></span>" +
      '<div class="mel-links">' + linksHtml + "</div>" +
    "</div>";

  var nodes = [];
  if (d.more === "1") {
    var others = APPS.filter(function (app) { return app.name !== product; });
    if (others.length) {
      var more = document.createElement("section");
      more.className = "mel-more";
      more.setAttribute("aria-labelledby", "mel-more-title");
      more.innerHTML =
        '<div class="mel-wrap">' +
          '<h2 id="mel-more-title">More from Magicelk Labs</h2>' +
          '<div class="mel-more-grid">' +
            others.map(function (app) {
              return '<a class="mel-app" href="' + app.href + '">' +
                '<div class="mel-cover"><img src="' + app.cover + '" alt="' + app.alt +
                  '" width="1200" height="630" loading="lazy" decoding="async"></div>' +
                "<h3>" + app.name + "</h3>" +
                "<p>" + app.line + "</p>" +
              "</a>";
            }).join("") +
          "</div>" +
        "</div>";
      nodes.push(more);
    }
  }
  nodes.push(footer);

  // Render where an explicit placeholder sits, else at end of body.
  var mount = document.getElementById("site-footer");
  if (mount) mount.replaceWith.apply(mount, nodes);
  else nodes.forEach(function (n) { document.body.appendChild(n); });
})();
