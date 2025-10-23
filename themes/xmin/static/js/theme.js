// Consolidated theme functionality
(function () {
  'use strict';

  // Theme toggle functionality
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeText = document.querySelector('.theme-text');

    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      if (themeText) themeText.textContent = 'Light';
    } else if (themeText) {
      themeText.textContent = 'Dark';
    }
  }

  window.toggleTheme = function () {
    const body = document.body;
    const text = document.querySelector('.theme-text');

    if (body.getAttribute('data-theme') === 'dark') {
      body.removeAttribute('data-theme');
      text.textContent = 'Dark';
      localStorage.setItem('theme', 'light');
    } else {
      body.setAttribute('data-theme', 'dark');
      text.textContent = 'Light';
      localStorage.setItem('theme', 'dark');
    }
  };

  // TOC functionality - OutlineWiki left sidebar style
  let tocObserver = null;

  window.toggleTOC = function () {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocToggle = document.getElementById('tocToggle');
    const tocOverlay = document.getElementById('tocOverlay');

    if (!tocSidebar) return;

    const isOpen = tocSidebar.classList.contains('active');

    if (isOpen) {
      closeTOC();
    } else {
      openTOC();
    }
  };

  function openTOC() {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocToggle = document.getElementById('tocToggle');
    const tocOverlay = document.getElementById('tocOverlay');

    if (tocSidebar) {
      tocSidebar.classList.add('active');
      if (tocToggle) tocToggle.classList.add('active');

      // Only use overlay and prevent scroll on mobile
      if (window.innerWidth <= 900) {
        if (tocOverlay) tocOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
  }

  function closeTOC() {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocToggle = document.getElementById('tocToggle');
    const tocOverlay = document.getElementById('tocOverlay');

    if (tocSidebar) {
      tocSidebar.classList.remove('active');
      if (tocToggle) tocToggle.classList.remove('active');

      // Only handle overlay on mobile
      if (tocOverlay) tocOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function initTOC() {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocOverlay = document.getElementById('tocOverlay');

    if (!tocSidebar) return;

    // Close TOC when clicking overlay
    if (tocOverlay) {
      tocOverlay.addEventListener('click', closeTOC);
    }

    // Close TOC when clicking outside on desktop
    document.addEventListener('click', function (e) {
      const tocSidebar = document.getElementById('tocSidebar');
      const tocToggle = document.getElementById('tocToggle');

      if (tocSidebar && tocToggle && tocSidebar.classList.contains('active')) {
        if (!tocSidebar.contains(e.target) && !tocToggle.contains(e.target)) {
          closeTOC();
        }
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeTOC();
      }
    });

    // Initialize active section tracking
    initActiveTracking();

    // Setup smooth scrolling for TOC links
    setupSmoothScrolling();
  }

  function initActiveTracking() {
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id]');
    const tocLinks = document.querySelectorAll('.toc-nav a');

    if (headings.length === 0 || tocLinks.length === 0) return;

    // Create intersection observer for active section tracking
    tocObserver = new IntersectionObserver((entries) => {
      let activeHeading = null;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeHeading = entry.target;
        }
      });

      if (activeHeading) {
        // Remove active class from all links
        tocLinks.forEach(link => {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        });

        // Add active class to current link
        const activeLink = document.querySelector(`.toc-nav a[href="#${activeHeading.id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.setAttribute('aria-current', 'location');
        }
      }
    }, {
      rootMargin: '-64px 0px -70% 0px', // Account for 64px header offset
      threshold: 0.1
    });

    // Observe all headings
    headings.forEach(heading => {
      tocObserver.observe(heading);
    });
  }

  function setupSmoothScrolling() {
    const tocLinks = document.querySelectorAll('.toc-nav a');

    tocLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Calculate offset for fixed header (64px)
          const headerOffset = 64;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Close mobile TOC after clicking
          closeMobileTOC();
        }
      });
    });
  }

  // Initialize on DOM ready
  function init() {
    initTheme();
    initTOC();
  }

  // Cleanup function for TOC observer
  function cleanupTOC() {
    if (tocObserver) {
      tocObserver.disconnect();
      tocObserver = null;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();