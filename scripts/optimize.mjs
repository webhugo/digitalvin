#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Running post-build optimizations...');

const publicDir = 'public';

// Optimize HTML files
function optimizeHtml() {
  const htmlFiles = [];
  
  function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findHtmlFiles(filePath);
      } else if (file.endsWith('.html')) {
        htmlFiles.push(filePath);
      }
    });
  }
  
  if (fs.existsSync(publicDir)) {
    findHtmlFiles(publicDir);
    
    let optimizedCount = 0;
    
    htmlFiles.forEach(file => {
      let content = fs.readFileSync(file, 'utf8');
      const originalSize = content.length;
      
      // Remove extra whitespace between HTML tags
      content = content.replace(/>\s+</g, '><');
      
      // Remove comments (but keep conditional comments)
      content = content.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
      
      // Remove empty lines
      content = content.replace(/^\s*\n/gm, '');
      
      const newSize = content.length;
      
      if (newSize < originalSize) {
        fs.writeFileSync(file, content);
        optimizedCount++;
      }
    });
    
    console.log(`✅ Optimized ${optimizedCount} HTML files`);
  }
}

// Add security headers to static files
function addSecurityHeaders() {
  const headersFile = path.join(publicDir, '_headers');
  
  const headers = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/sitemap.xml
  Cache-Control: public, max-age=3600

/robots.txt
  Cache-Control: public, max-age=86400
`;

  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(headersFile, headers);
    console.log('✅ Added security headers');
  }
}

// Generate performance report
function generatePerformanceReport() {
  if (!fs.existsSync(publicDir)) return;
  
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    htmlFiles: 0,
    cssFiles: 0,
    jsFiles: 0,
    imageFiles: 0
  };
  
  function analyzeDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        analyzeDir(filePath);
      } else {
        stats.totalFiles++;
        stats.totalSize += stat.size;
        
        const ext = path.extname(file).toLowerCase();
        if (ext === '.html') stats.htmlFiles++;
        else if (ext === '.css') stats.cssFiles++;
        else if (ext === '.js') stats.jsFiles++;
        else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) stats.imageFiles++;
      }
    });
  }
  
  analyzeDir(publicDir);
  
  console.log('\n📊 Build Statistics:');
  console.log(`   Total files: ${stats.totalFiles}`);
  console.log(`   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   HTML files: ${stats.htmlFiles}`);
  console.log(`   CSS files: ${stats.cssFiles}`);
  console.log(`   JS files: ${stats.jsFiles}`);
  console.log(`   Images: ${stats.imageFiles}`);
}

// Run optimizations
try {
  optimizeHtml();
  addSecurityHeaders();
  generatePerformanceReport();
  console.log('\n🎉 Optimization complete!');
} catch (error) {
  console.error('❌ Optimization failed:', error.message);
  process.exit(1);
}