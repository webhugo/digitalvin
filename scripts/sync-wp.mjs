import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const GRAPHQL_ENDPOINT = "https://blog.digitalvin.com/graphql";
const OUTPUT_DIR = "content/post";

// Enhanced GraphQL query with additional fields for better content processing
const query = `
{
  posts(first: 50, where: { status: PUBLISH }) {
    nodes {
      title
      content(format: RENDERED)
      date
      slug
      excerpt(format: RENDERED)
      author {
        node {
          name
          slug
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
          caption
          description
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      tags {
        nodes {
          name
          slug
        }
      }
    }
  }
}
`;

// Enhanced content processing for Hugo/Xmin theme compatibility
function cleanContent(content) {
  if (!content) return '';

  let cleaned = content;

  // Handle WordPress block editor content
  // Remove WordPress preformatted blocks (both complete and incomplete)
  cleaned = cleaned.replace(/^\s*<pre[^>]*class="wp-block-preformatted"[^>]*>([\s\S]*?)<\/pre>\s*$/gm, '$1');
  cleaned = cleaned.replace(/^\s*<pre[^>]*class="wp-block-preformatted"[^>]*>([\s\S]*)$/gm, '$1');

  // Clean up WordPress-specific HTML entities and formatting
  cleaned = cleaned.replace(/&#8217;/g, "'");
  cleaned = cleaned.replace(/&#8216;/g, "'");
  cleaned = cleaned.replace(/&#8220;/g, '"');
  cleaned = cleaned.replace(/&#8221;/g, '"');
  cleaned = cleaned.replace(/&#8211;/g, '–');
  cleaned = cleaned.replace(/&#8212;/g, '—');
  cleaned = cleaned.replace(/&hellip;/g, '…');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');

  // Convert WordPress blocks to Hugo-friendly HTML
  // Handle WordPress image blocks
  cleaned = cleaned.replace(
    /<figure class="wp-block-image[^"]*"[^>]*>\s*<img([^>]+)>\s*(?:<figcaption[^>]*>(.*?)<\/figcaption>)?\s*<\/figure>/g,
    (_, imgAttrs, caption) => {
      if (caption) {
        return `<figure>\n<img${imgAttrs}>\n<figcaption>${caption}</figcaption>\n</figure>`;
      }
      return `<img${imgAttrs}>`;
    }
  );

  // Handle WordPress quote blocks
  cleaned = cleaned.replace(
    /<blockquote class="wp-block-quote[^"]*"[^>]*>([\s\S]*?)<\/blockquote>/g,
    '<blockquote>$1</blockquote>'
  );

  // Handle WordPress code blocks
  cleaned = cleaned.replace(
    /<pre class="wp-block-code[^"]*"[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g,
    '<pre><code>$1</code></pre>'
  );

  // Remove WordPress-specific CSS classes while preserving structure
  cleaned = cleaned.replace(/class="wp-block-[^"]*"/g, '');
  cleaned = cleaned.replace(/class=""/g, '');

  // Convert <br> tags to proper line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/g, '\n');
  cleaned = cleaned.replace(/<br>/g, '\n');

  // Clean up extra whitespace and line breaks
  cleaned = cleaned.replace(/^(\n)+/g, '').replace(/(\n)+$/g, '');
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Limit to max 2 consecutive line breaks

  return cleaned.trim();
}

// Escape YAML special characters in strings
function escapeYaml(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"').replace(/\n/g, ' ');
}

// Get existing Hugo post files
function getExistingPosts() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return [];
  }

  return fs.readdirSync(OUTPUT_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
}

// Delete posts that no longer exist in WordPress
function deleteRemovedPosts(wordPressSlugs, existingSlugs) {
  const deletedPosts = [];

  existingSlugs.forEach(slug => {
    if (!wordPressSlugs.includes(slug)) {
      const filename = `${OUTPUT_DIR}/${slug}.md`;
      const publicPostDir = `public/post/${slug}`;

      try {
        // Delete markdown file
        fs.unlinkSync(filename);

        // Delete public folder for this post if it exists
        if (fs.existsSync(publicPostDir)) {
          fs.rmSync(publicPostDir, { recursive: true, force: true });
        }

        deletedPosts.push(slug);
      } catch (error) {
        console.error(`❌ Failed to delete ${slug}:`, error.message);
      }
    }
  });

  return deletedPosts;
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

    // Get existing posts before sync
    const existingSlugs = getExistingPosts();
    const wordPressSlugs = data.posts.nodes.map(post => post.slug);

    let newPosts = 0;
    let updatedPosts = 0;

    // Sync WordPress posts
    data.posts.nodes.forEach(post => {
      const filename = `${OUTPUT_DIR}/${post.slug}.md`;
      const fileExists = fs.existsSync(filename);

      // Enhanced excerpt processing with better auto-generation detection
      const rawExcerpt = post.excerpt || '';
      const cleanExcerpt = rawExcerpt
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&hellip;/g, '…')
        .replace(/\[&hellip;\]/g, '…')
        .replace(/&nbsp;/g, ' ')
        .trim();

      // Detect auto-generated excerpts (WordPress typically auto-generates these patterns)
      const isAutoGenerated = !rawExcerpt ||
        rawExcerpt.includes('[&hellip;]') ||
        rawExcerpt.includes('&hellip;') ||
        cleanExcerpt.includes('…') ||
        cleanExcerpt.endsWith('…') ||
        rawExcerpt.includes('[...]') ||
        rawExcerpt.includes('...') ||
        cleanExcerpt.trim() === '' ||
        cleanExcerpt.length < 30 ||
        cleanExcerpt.length > 500 ||
        cleanExcerpt.split(' ').length < 10;

      // Only use excerpt if it appears to be manually written
      const hasManualExcerpt = !isAutoGenerated;

      // Enhanced frontmatter with additional Hugo/SEO fields
      const frontmatter = {
        title: escapeYaml(post.title),
        date: post.date,
        slug: post.slug,
        excerpt: hasManualExcerpt ? escapeYaml(cleanExcerpt) : '',
        description: hasManualExcerpt ? escapeYaml(cleanExcerpt) : '',
        author: post.author?.node?.name ? escapeYaml(post.author.node.name) : '',
        featured_image: post.featuredImage?.node?.sourceUrl || '',
        featured_image_alt: escapeYaml(post.featuredImage?.node?.altText) || '',
        featured_image_caption: escapeYaml(post.featuredImage?.node?.caption) || '',
        categories: post.categories.nodes.map(cat => escapeYaml(cat.name)),
        tags: post.tags.nodes.map(tag => escapeYaml(tag.name)),
        draft: false,
        type: 'post'
      };

      const cleanedContent = cleanContent(post.content);

      // Generate Hugo-compatible frontmatter
      const markdown = `---
title: "${frontmatter.title}"
date: ${frontmatter.date}
slug: "${frontmatter.slug}"${frontmatter.excerpt ? `
excerpt: "${frontmatter.excerpt}"` : ''}${frontmatter.description ? `
description: "${frontmatter.description}"` : ''}${frontmatter.author ? `
author: "${frontmatter.author}"` : ''}
featured_image: "${frontmatter.featured_image}"
featured_image_alt: "${frontmatter.featured_image_alt}"${frontmatter.featured_image_caption ? `
featured_image_caption: "${frontmatter.featured_image_caption}"` : ''}
categories: [${frontmatter.categories.map(cat => `"${cat}"`).join(", ")}]
tags: [${frontmatter.tags.map(tag => `"${tag}"`).join(", ")}]
draft: ${frontmatter.draft}
type: "${frontmatter.type}"
---

${cleanedContent}
`;

      fs.writeFileSync(filename, markdown);

      if (fileExists) {
        updatedPosts++;
      } else {
        newPosts++;
      }
    });

    // Delete posts that no longer exist in WordPress (reverse sync)
    const deletedPosts = deleteRemovedPosts(wordPressSlugs, existingSlugs);

    console.log(`✅ Sync complete! ${newPosts} new posts, ${updatedPosts} updated posts, ${deletedPosts.length} deleted posts`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncWordPressPosts();