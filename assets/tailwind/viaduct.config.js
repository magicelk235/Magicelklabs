// Theme for the Viaduct page. Mirrors what used to sit in an inline
// `tailwind.config` next to the Play CDN script tag on viaduct/index.html.
// Build the stylesheet with:
//   npx tailwindcss@3.4.16 -c assets/tailwind/viaduct.config.js \
//     -i assets/tailwind/input.css -o viaduct/assets/tailwind.css --minify
module.exports = {
  content: ['./viaduct/index.html'],
  theme: {
    extend: {
      // Colour lives in the page's CSS custom properties, not here: the palette
      // is dark-only and the utilities never referenced it.
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: { squircle: '16px' },
    },
  },
};
