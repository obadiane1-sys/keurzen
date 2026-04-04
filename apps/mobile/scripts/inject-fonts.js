const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const FONTS_SRC = path.join(
  DIST,
  'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts'
);
const FONTS_DEST = path.join(DIST, 'fonts');
const HTML_PATH = path.join(DIST, 'index.html');

if (!fs.existsSync(FONTS_SRC)) {
  console.log('No icon fonts found — skipping injection.');
  process.exit(0);
}

// Copy fonts to /fonts/ (Vercel ignores node_modules paths)
if (!fs.existsSync(FONTS_DEST)) fs.mkdirSync(FONTS_DEST, { recursive: true });

const ttfFiles = fs.readdirSync(FONTS_SRC).filter((f) => f.endsWith('.ttf'));

ttfFiles.forEach((f) => {
  fs.copyFileSync(path.join(FONTS_SRC, f), path.join(FONTS_DEST, f));
});

const fontFaces = ttfFiles
  .map((f) => {
    const name = f.split('.')[0];
    return `@font-face{font-family:'${name}';src:url('/fonts/${f}') format('truetype');font-weight:normal;font-style:normal;}`;
  })
  .join('');

let html = fs.readFileSync(HTML_PATH, 'utf-8');
html = html.replace('</head>', `<style>${fontFaces}</style></head>`);
fs.writeFileSync(HTML_PATH, html);

console.log(`Copied ${ttfFiles.length} fonts to /fonts/ and injected @font-face rules.`);
