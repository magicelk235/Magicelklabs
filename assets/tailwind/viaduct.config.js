// Theme for the Viaduct page. Mirrors what used to sit in an inline
// `tailwind.config` next to the Play CDN script tag on viaduct/index.html.
// Build the stylesheet with:
//   npx tailwindcss@3.4.16 -c assets/tailwind/viaduct.config.js \
//     -i assets/tailwind/input.css -o viaduct/assets/tailwind.css --minify
module.exports = {
  content: ['./viaduct/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#16746F', press: '#0F5551', d: '#21AF9F', dpress: '#1B958A' },
        ok: { DEFAULT: '#1A9D5A', d: '#30D158' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: { squircle: '16px' },
    },
  },
};
