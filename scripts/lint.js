/**
 * Verification Script: Syntax & Code Integrity Lint
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running code lint and syntax checks...');

const filesToCheck = [
  'index.html',
  'styles.css',
  'stopwatch.js',
  'app.js',
  'test/stopwatch.test.js',
];

let hasErrors = false;

for (const file of filesToCheck) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing required file: ${file}`);
    hasErrors = true;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Check 1: Non-empty
  if (content.trim().length === 0) {
    console.error(`❌ File is empty: ${file}`);
    hasErrors = true;
    continue;
  }

  // Check 2: HTML specific checks
  if (file.endsWith('.html')) {
    if (!content.includes('<!DOCTYPE html>')) {
      console.error(`❌ ${file} missing DOCTYPE declaration`);
      hasErrors = true;
    }
    if (!content.includes('lang="en"')) {
      console.error(`❌ ${file} missing lang attribute`);
      hasErrors = true;
    }
    if (!content.includes('<meta name="viewport"')) {
      console.error(`❌ ${file} missing responsive viewport meta`);
      hasErrors = true;
    }
  }

  // Check 3: JS syntax check via node --check
  if (file.endsWith('.js')) {
    try {
      execSync(`node --check ${fullPath}`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`❌ Syntax error in ${file}:`, err.message);
      hasErrors = true;
    }
  }

  console.log(`  ✔ Verified: ${file}`);
}

if (hasErrors) {
  console.error('\n💥 Lint verification failed with errors.');
  process.exit(1);
} else {
  console.log('\n✨ All lint and syntax checks passed cleanly!');
}
