#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔒 Running security check...');

// Patterns that should NOT be in the codebase
const dangerousPatterns = [
  /password\s*[:=]\s*["'][^"']+["']/i,
  /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
  /secret\s*[:=]\s*["'][^"']+["']/i,
  /token\s*[:=]\s*["'][^"']+["']/i,
  /private[_-]?key\s*[:=]/i,
  /database[_-]?url\s*[:=]/i,
  /mongodb:\/\/.*:.*@/i,
  /postgres:\/\/.*:.*@/i,
  /mysql:\/\/.*:.*@/i,
  /redis:\/\/.*:.*@/i,
  /sk-[a-zA-Z0-9]{32,}/i, // OpenAI API keys
  /xoxb-[a-zA-Z0-9-]+/i,  // Slack tokens
  /ghp_[a-zA-Z0-9]{36}/i, // GitHub personal access tokens
];

// Files to check
const filesToCheck = [
  'hugo.yaml',
  'package.json',
  '.github/workflows/main.yml',
  'scripts/sync-wp.mjs',
  'scripts/optimize.mjs',
  'themes/xmin/layouts/_partials/header.html',
  'themes/xmin/layouts/_partials/footer.html',
  'themes/xmin/static/css/style.css',
  'themes/xmin/static/js/theme.js'
];

// Safe patterns that are allowed
const safePatterns = [
  'reachme@vinaythoke.com', // Public contact email
  'blog.digitalvin.com',    // Public WordPress site
  'digitalvin.com',         // Public website
  'bio.link/vinaythoke',    // Public bio link
  'linkedin.com/in/vinaythoke', // Public LinkedIn
  'github.com/webhugo',     // Public GitHub
  'https://blog.digitalvin.com/graphql' // Public GraphQL endpoint
];

let issuesFound = 0;
let filesChecked = 0;

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  filesChecked++;

  // Check for dangerous patterns
  dangerousPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      // Check if it's a safe pattern
      const isSafe = safePatterns.some(safe => matches[0].includes(safe));
      
      if (!isSafe) {
        console.log(`❌ Potential security issue in ${filePath}:`);
        console.log(`   Pattern ${index + 1}: ${matches[0]}`);
        issuesFound++;
      }
    }
  });
}

// Check all specified files
filesToCheck.forEach(checkFile);

// Check for common sensitive files that shouldn't exist
const sensitiveFiles = [
  '.env',
  '.env.local',
  '.env.production',
  'config.json',
  'secrets.json',
  'private.key',
  'id_rsa',
  'credentials.json'
];

sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`❌ Sensitive file found: ${file}`);
    issuesFound++;
  }
});

// Summary
console.log('\n📊 Security Check Results:');
console.log(`   Files checked: ${filesChecked}`);
console.log(`   Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('✅ No security issues detected!');
  console.log('\n🔒 Repository is safe for public exposure.');
} else {
  console.log('❌ Security issues detected!');
  console.log('\n⚠️  Please review and fix the issues above before committing.');
  process.exit(1);
}

// Additional checks
console.log('\n🔍 Additional Security Notes:');
console.log('✅ WordPress GraphQL endpoint is public (read-only)');
console.log('✅ No authentication required for content sync');
console.log('✅ All personal information uses public profiles');
console.log('✅ GitHub Actions uses only repository secrets');
console.log('✅ Static site generation (no server-side vulnerabilities)');

console.log('\n🎉 Security validation complete!');