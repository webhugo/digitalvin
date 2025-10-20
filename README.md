# DigitalVin Blog

A modern, high-performance blog built with Hugo and optimized for speed, SEO, and user experience. This site automatically syncs content from WordPress and deploys to GitHub Pages.

## 🌐 Live Site

- **Production**: [digitalvin.com](https://digitalvin.com)
- **WordPress Backend**: [blog.digitalvin.com](https://blog.digitalvin.com)

## ✨ Features

- **Automated WordPress Sync**: Hourly synchronization of posts via GraphQL
- **Optimized Hugo Theme**: Custom XMin theme with modern enhancements
- **Dark Mode**: Toggle between light and dark themes
- **Table of Contents**: Collapsible TOC for better navigation
- **SEO Optimized**: Comprehensive meta tags, structured data, and sitemap
- **Performance First**: Minified assets, optimized images, and fast loading
- **Responsive Design**: Mobile-first approach with clean typography
- **GitHub Pages Deployment**: Automated CI/CD with GitHub Actions

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WordPress     │───▶│   GitHub Repo    │───▶│  GitHub Pages   │
│ blog.digitalvin │    │   Hugo + XMin    │    │ digitalvin.com  │
│     .com        │    │     Theme        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    GraphQL API            GitHub Actions           Static Site
   (Content Sync)         (Build & Deploy)        (Production)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Hugo Extended v0.151.2+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone --recursive https://github.com/webhugo/digitalvin.git
   cd digitalvin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Sync WordPress content**
   ```bash
   npm run sync
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:1313
   ```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run sync` | Sync posts from WordPress |
| `npm run build` | Build production site with optimizations |
| `npm run dev` | Start development server |
| `npm run serve` | Start Hugo server with drafts |
| `npm run sync-build` | Sync content and build in one command |
| `npm run preview` | Preview with minification |
| `npm run clean` | Clean build artifacts |
| `npm run check` | Validate Hugo configuration |
| `npm run optimize` | Run post-build optimizations |

## 🎨 Theme Customization

The site uses a heavily customized version of the [Hugo XMin theme](https://github.com/yihui/hugo-xmin) with the following enhancements:

### Custom Features Added
- **Dark/Light Mode Toggle**: Persistent theme switching
- **Table of Contents**: Slide-out TOC panel for long posts
- **Enhanced Typography**: Improved readability and spacing
- **Custom CSS Variables**: Easy theme customization
- **Responsive Design**: Mobile-optimized layout
- **Performance Optimizations**: Minified CSS/JS, optimized loading

### Theme Structure
```
themes/xmin/
├── layouts/
│   ├── _partials/
│   │   ├── header.html      # Site header with navigation
│   │   ├── footer.html      # Site footer with scripts
│   │   └── head_custom.html # SEO and performance optimizations
│   ├── single.html          # Blog post template
│   └── list.html           # Post listing template
├── static/
│   ├── css/
│   │   └── style.css       # Main stylesheet with custom variables
│   └── js/
│       ├── theme.js        # Theme functionality (consolidated)
│       └── performance.js  # Performance monitoring
└── theme.toml              # Theme configuration
```

## 🔄 WordPress Integration

### Content Sync Process

The site automatically syncs content from WordPress using a GraphQL API:

1. **Scheduled Sync**: GitHub Actions runs hourly to fetch new posts
2. **Content Processing**: WordPress HTML is cleaned and optimized for Hugo
3. **Frontmatter Generation**: Metadata is extracted and formatted
4. **File Management**: Old posts are removed, new ones are added
5. **Automatic Deployment**: Changes trigger a new site build

### Sync Script Features

- **Enhanced Content Cleaning**: Removes WordPress-specific markup
- **Smart Excerpt Detection**: Identifies manual vs auto-generated excerpts
- **Image Processing**: Optimizes WordPress image blocks
- **Error Handling**: Comprehensive logging and error recovery
- **Reverse Sync**: Removes deleted WordPress posts from Hugo

## 🚀 Deployment

### GitHub Actions Workflow

The site uses a sophisticated CI/CD pipeline:

```yaml
# Triggers
- Push to main branch
- Hourly schedule (WordPress sync)
- Manual dispatch

# Process
1. Checkout code with submodules
2. Setup Node.js and install dependencies
3. Sync WordPress posts
4. Commit new posts (if any)
5. Setup Hugo Extended
6. Build site with minification
7. Run post-build optimizations
8. Deploy to GitHub Pages
```

### Performance Optimizations

- **Asset Minification**: CSS, JS, and HTML compression
- **Image Optimization**: Automatic WebP conversion and resizing
- **Caching Headers**: Optimized cache control for static assets
- **Security Headers**: CSP, HSTS, and other security enhancements
- **Build Statistics**: Performance monitoring and reporting

## 📊 SEO & Analytics

### SEO Features
- **Structured Data**: JSON-LD markup for rich snippets
- **Open Graph**: Social media optimization
- **Twitter Cards**: Enhanced Twitter sharing
- **Canonical URLs**: Proper URL canonicalization
- **Sitemap**: Automatic XML sitemap generation
- **Robots.txt**: Search engine crawling instructions

### Performance Monitoring
- **Core Web Vitals**: Automatic performance tracking
- **Build Analytics**: Size and performance reporting
- **Error Logging**: Client-side error monitoring

## 🔧 Configuration

### Hugo Configuration (`hugo.yaml`)

Key configuration options:

```yaml
baseURL: "https://digitalvin.com/"
theme: "xmin"

# Performance optimizations
minify:
  minifyOutput: true
  
# SEO configuration
sitemap:
  changefreq: "weekly"
  priority: 0.5

# Table of contents
markup:
  tableOfContents:
    startLevel: 2
    endLevel: 4
    ordered: false
```

### Environment Variables

No sensitive environment variables are required for this setup. All configuration is handled through:

- Hugo configuration files
- GitHub repository settings
- WordPress GraphQL endpoint (public)

## 🛡️ Security

### Security Measures
- **No Sensitive Data**: All configuration is public-safe
- **Security Headers**: Comprehensive HTTP security headers
- **Content Security Policy**: Strict CSP implementation
- **Dependency Scanning**: Automated vulnerability checks
- **Minimal Attack Surface**: Static site with no server-side code

### Safe Information
- WordPress GraphQL endpoint is public (read-only)
- No API keys or secrets in repository
- All personal information uses placeholder patterns
- Build process is fully transparent

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test locally (`npm run dev`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow Hugo best practices
- Maintain theme consistency
- Test on multiple devices/browsers
- Ensure accessibility compliance
- Document significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hugo**: Fast and flexible static site generator
- **XMin Theme**: Minimal and elegant Hugo theme by Yihui Xie
- **WordPress**: Content management and GraphQL API
- **GitHub Pages**: Reliable and fast hosting
- **GitHub Actions**: Automated CI/CD pipeline

## 📞 Contact

**Vinay Thoke**
- Website: [digitalvin.com](https://digitalvin.com)
- Bio: [bio.link/vinaythoke](https://bio.link/vinaythoke)
- LinkedIn: [linkedin.com/in/vinaythoke](https://linkedin.com/in/vinaythoke)

---

Built with ❤️ using Hugo, optimized for performance, and deployed with GitHub Actions.