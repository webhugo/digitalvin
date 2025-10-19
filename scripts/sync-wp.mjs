import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const GRAPHQL_ENDPOINT = "https://blog.digitalvin.com/graphql";
const OUTPUT_DIR = "content/post";

const query = `
{
  posts(first: 50, where: { status: PUBLISH }) {
    nodes {
      title
      content
      date
      slug
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          name
        }
      }
      tags {
        nodes {
          name
        }
      }
    }
  }
}
`;

// Enhanced HTML to Markdown conversion with rich formatting support
function cleanContent(content) {
  return content
    // Handle code blocks first (before other replacements)
    .replace(/<pre[^>]*><code[^>]*class="language-([^"]*)"[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
      const cleanCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
      return `\n\`\`\`${lang}\n${cleanCode}\n\`\`\`\n`;
    })
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      const cleanCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
      return `\n\`\`\`\n${cleanCode}\n\`\`\`\n`;
    })
    // Handle inline code
    .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
    
    // Handle blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (match, content) => {
      const cleanQuote = content
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/^\s+|\s+$/g, '')
        .split('\n')
        .map(line => line.trim() ? `> ${line.trim()}` : '>')
        .join('\n');
      return `\n${cleanQuote}\n`;
    })
    
    // Handle tables
    .replace(/<table[^>]*>([\s\S]*?)<\/table>/g, (match, tableContent) => {
      let markdown = '\n';
      const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
      
      rows.forEach((row, index) => {
        const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g) || [];
        const cellContents = cells.map(cell => 
          cell.replace(/<t[hd][^>]*>|<\/t[hd]>/g, '').replace(/<[^>]*>/g, '').trim()
        );
        
        markdown += '| ' + cellContents.join(' | ') + ' |\n';
        
        // Add separator after header row
        if (index === 0) {
          markdown += '|' + cellContents.map(() => '---').join('|') + '|\n';
        }
      });
      
      return markdown + '\n';
    })
    
    // Handle lists - unordered
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, listContent) => {
      const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || [];
      const markdown = items.map(item => {
        const cleanItem = item
          .replace(/<li[^>]*>|<\/li>/g, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        return `- ${cleanItem}`;
      }).join('\n');
      return `\n${markdown}\n`;
    })
    
    // Handle lists - ordered
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, listContent) => {
      const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || [];
      const markdown = items.map((item, index) => {
        const cleanItem = item
          .replace(/<li[^>]*>|<\/li>/g, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        return `${index + 1}. ${cleanItem}`;
      }).join('\n');
      return `\n${markdown}\n`;
    })
    
    // Handle headings
    .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g, (match, level, text) => {
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      return '\n' + '#'.repeat(parseInt(level)) + ' ' + cleanText + '\n';
    })
    
    // Handle horizontal rules
    .replace(/<hr[^>]*\/?>/g, '\n---\n')
    
    // Handle text formatting
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
    .replace(/<del[^>]*>(.*?)<\/del>/g, '~~$1~~')
    .replace(/<s[^>]*>(.*?)<\/s>/g, '~~$1~~')
    .replace(/<strike[^>]*>(.*?)<\/strike>/g, '~~$1~~')
    
    // Handle links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    
    // Handle math expressions (preserve LaTeX)
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')  // Display math \[ \] to $$ $$
    .replace(/\\\(([\s\S]*?)\\\)/g, '\\($1\\)') // Inline math \( \) - keep as is
    
    // Handle images
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/g, '![$1]($2)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![]($1)')
    
    // Handle line breaks and paragraphs
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '\n')
    
    // Handle divs (convert to line breaks)
    .replace(/<div[^>]*>/g, '\n')
    .replace(/<\/div>/g, '\n')
    
    // Clean up HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean up whitespace and newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double
    .replace(/^\s+|\s+$/g, '') // Trim start/end
    .replace(/[ \t]+$/gm, '') // Remove trailing spaces
    .trim();
}

// Escape YAML special characters in strings
function escapeYaml(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"').replace(/\n/g, ' ');
}

async function syncWordPressPosts() {
  try {
    console.log('🔄 Fetching posts from WordPress...');

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Hugo-Sync-Bot/1.0"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('❌ GraphQL errors:', errors);
      return;
    }

    if (!data?.posts?.nodes) {
      console.error('❌ No posts data received');
      return;
    }

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let newPosts = 0;
    let updatedPosts = 0;

    data.posts.nodes.forEach(post => {
      const filename = `${OUTPUT_DIR}/${post.slug}.md`;
      const fileExists = fs.existsSync(filename);

      const frontmatter = {
        title: escapeYaml(post.title),
        date: post.date,
        slug: post.slug,
        excerpt: escapeYaml(post.excerpt),
        featured_image: post.featuredImage?.node?.sourceUrl || '',
        featured_image_alt: escapeYaml(post.featuredImage?.node?.altText) || '',
        categories: post.categories.nodes.map(cat => escapeYaml(cat.name)),
        tags: post.tags.nodes.map(tag => escapeYaml(tag.name))
      };

      const cleanedContent = cleanContent(post.content);

      const markdown = `---
title: "${frontmatter.title}"
date: ${frontmatter.date}
slug: "${frontmatter.slug}"
excerpt: "${frontmatter.excerpt}"
featured_image: "${frontmatter.featured_image}"
featured_image_alt: "${frontmatter.featured_image_alt}"
categories: [${frontmatter.categories.map(cat => `"${cat}"`).join(", ")}]
tags: [${frontmatter.tags.map(tag => `"${tag}"`).join(", ")}]
---

${cleanedContent}
`;

      fs.writeFileSync(filename, markdown);

      if (fileExists) {
        updatedPosts++;
        console.log(`📝 Updated: ${post.slug}`);
      } else {
        newPosts++;
        console.log(`✨ New post: ${post.slug}`);
      }
    });

    console.log(`✅ Sync complete! ${newPosts} new posts, ${updatedPosts} updated posts`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncWordPressPosts();

