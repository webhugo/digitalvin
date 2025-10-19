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

// Clean HTML content for better markdown
function cleanContent(content) {
  return content
    .replace(/<p>/g, '\n')
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match, level, text) => {
      return '\n' + '#'.repeat(parseInt(level)) + ' ' + text + '\n';
    })
    .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![${2}](${1})')
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
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

