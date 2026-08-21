// Theme for the Spyglass page. Mirrors what used to sit in an inline
// `tailwind.config` next to the Play CDN script tag on spyglass/index.html.
// Build the stylesheet with:
//   npx tailwindcss@3.4.16 -c assets/tailwind/spyglass.config.js \
//     -i assets/tailwind/input.css -o spyglass/assets/tailwind.css --minify
module.exports = {
  content: ['./spyglass/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brass: { DEFAULT: '#B8945F', press: '#A47E48', d: '#D9B679' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
};
