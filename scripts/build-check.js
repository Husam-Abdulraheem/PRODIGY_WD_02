/**
 * Verification Script: Production Build & Asset Integrity Check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('📦 Running build and asset integrity check...');

const requiredAssets = [
  { file: 'index.html', minSize: 1000 },
  { file: 'styles.css', minSize: 200 },
  { file: 'css/themes.css', minSize: 2000 },
  { file: 'css/base.css', minSize: 500 },
  { file: 'css/dial.css', minSize: 500 },
  { file: 'css/components.css', minSize: 2000 },
  { file: 'css/responsive.css', minSize: 300 },
  { file: 'stopwatch.js', minSize: 1000 },
  { file: 'app.js', minSize: 2000 },
  { file: 'README.md', minSize: 500 },
];

let buildFailed = false;

for (const { file, minSize } of requiredAssets) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Build check failed: Missing asset ${file}`);
    buildFailed = true;
    continue;
  }

  const stats = fs.statSync(filePath);
  if (stats.size < minSize) {
    console.error(`❌ Asset ${file} is unexpectedly small (${stats.size} bytes < ${minSize} bytes)`);
    buildFailed = true;
  } else {
    console.log(`  ✔ Asset ok: ${file} (${stats.size} bytes)`);
  }
}

// Check index.html asset references
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
if (!htmlContent.includes('styles.css')) {
  console.error('❌ index.html does not link to styles.css');
  buildFailed = true;
}
if (!htmlContent.includes('app.js')) {
  console.error('❌ index.html does not link to app.js');
  buildFailed = true;
}

if (buildFailed) {
  console.error('\n💥 Build verification failed.');
  process.exit(1);
} else {
  console.log('\n🚀 Build check passed! All assets verified and ready for deployment.');
}
