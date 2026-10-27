// Inlines the stylesheet and scripts into dist/hub.html: one file to email, attach or host anywhere.
// Run with: npm run build
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html')
  .replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${read('css/styles.css')}</style>`)
  .replace('<script src="js/model.js"></script>', () => `<script>\n${read('js/model.js')}</script>`)
  .replace('<script src="js/app.js"></script>', () => `<script>\n${read('js/app.js')}</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'hub.html'), html);
console.log('Wrote dist/hub.html (' + Math.round(html.length / 1024) + ' KB)');
