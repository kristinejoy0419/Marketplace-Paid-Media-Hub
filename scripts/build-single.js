// Inlines the stylesheet and scripts into dist/hub.html: one file to email, attach or host anywhere.
// Run with: npm run build
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html')
  .replace('<link rel="stylesheet" href="css/hub.css">', () => `<style>\n${read('css/hub.css')}</style>`)
  .replace('<link rel="stylesheet" href="css/marketplace.css">', () => `<style>\n${read('css/marketplace.css')}</style>`)
  .replace('<script src="js/model.js"></script>', () => `<script>\n${read('js/model.js')}</script>`)
  .replace('<script src="js/hub.js"></script>', () => `<script>\n${read('js/hub.js')}</script>`)
  .replace('<script src="js/marketplace.js"></script>', () => `<script>\n${read('js/marketplace.js')}</script>`)
  .replace('src="img/spider.webp"', () => `src="data:image/webp;base64,${fs.readFileSync(path.join(root, 'img/spider.webp')).toString('base64')}"`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'hub.html'), html);
console.log('Wrote dist/hub.html (' + Math.round(html.length / 1024) + ' KB)');
