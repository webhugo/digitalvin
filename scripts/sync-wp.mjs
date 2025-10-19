import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const query = `
{
    posts(first: 10, where: { status: PUBLISH }) {
    nodes {
      title
      content
      date
      slug
      featuredImage {
        node {
          sourceUrl
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

fetch("https://blog.digitalvin.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query })
})
  .then(res => res.json())
  .then(({ data }) => {
    const outputDir = "digitalvin/content/post";
    fs.mkdirSync(outputDir, { recursive: true });

    data.posts.nodes.forEach(post => {

const md = `---
title: "${post.title}"
date: ${post.date}
slug: "${post.slug}"
featured_image: "${post.featuredImage?.node?.sourceUrl || ''}"
categories: [${post.categories.nodes.map(cat => `"${cat.name}"`).join(", ")}]
tags: [${post.tags.nodes.map(tag => `"${tag.name}"`).join(", ")}]
---

${post.content}
`;

     fs.writeFileSync(`${outputDir}/${post.slug}.md`, md);
    });
  });

