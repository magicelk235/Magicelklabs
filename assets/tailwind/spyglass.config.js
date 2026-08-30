// Theme for the Spyglass page. Mirrors what used to sit in an inline
// `tailwind.config` next to the Play CDN script tag on spyglass/index.html.
// Build the stylesheet with:
//   npx tailwindcss@3.4.16 -c assets/tailwind/spyglass.config.js \
//     -i assets/tailwind/input.css -o spyglass/assets/tailwind.css --minify
module.exports = {
  content: ['./spyglass/index.html'],
  theme: {
    extend: {
      // Colour lives in the page's CSS custom properties, not here: the palette
      // is dark-only and the utilities never referenced it.
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
};
