// Consolidated theme functionality
(function() {
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

  window.toggleTheme = function() {
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

  function initTOC() {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocMobileToggle = document.getElementById('tocMobileToggle');
    const tocOverlay = document.getElementById('tocOverlay');
    
    if (!tocSidebar) return;

    // Mobile toggle functionality
    if (tocMobileToggle) {
      tocMobileToggle.addEventListener('click', function() {
        const isOpen = tocSidebar.classList.contains('mobile-open');
        if (isOpen) {
          closeMobileTOC();
        } else {
          openMobileTOC();
        }
      });
    }

    // Close mobile TOC when clicking overlay
    if (tocOverlay) {
      tocOverlay.addEventListener('click', closeMobileTOC);
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeMobileTOC();
      }
    });

    // Initialize active section tracking
    initActiveTracking();
    
    // Setup smooth scrolling for TOC links
    setupSmoothScrolling();
  }

  function openMobileTOC() {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocOverlay = document.getElementById('tocOverlay');
    
    if (tocSidebar && tocOverlay) {
      tocSidebar.classList.add('mobile-open');
      tocOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileTOC() {
    const tocSidebar = document.getElementById('tocSidebar');
    const tocOverlay = document.getElementById('tocOverlay');
    
    if (tocSidebar && tocOverlay) {
      tocSidebar.classList.remove('mobile-open');
      tocOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
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
      link.addEventListener('click', function(e) {
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