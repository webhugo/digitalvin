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

  // TOC functionality
  window.toggleTOC = function() {
    const toc = document.getElementById('toc');
    const overlay = document.getElementById('tocOverlay');
    const toggle = document.querySelector('.toc-toggle');
    
    if (toc && overlay) {
      const isOpen = toc.classList.contains('open');
      
      if (isOpen) {
        closeTOC();
      } else {
        toc.classList.add('open');
        overlay.classList.add('active');
        toggle.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
  };

  window.closeTOC = function() {
    const toc = document.getElementById('toc');
    const overlay = document.getElementById('tocOverlay');
    const toggle = document.querySelector('.toc-toggle');
    
    if (toc && overlay) {
      toc.classList.remove('open');
      overlay.classList.remove('active');
      toggle.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Initialize on DOM ready
  function init() {
    initTheme();
    initTOC();
  }

  // TOC initialization and active section tracking
  function initTOC() {
    const tocLinks = document.querySelectorAll('.toc a');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    // Smooth scroll for TOC links
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Close TOC after clicking a link
          closeTOC();
        }
      });
    });

    // Track active section while scrolling
    if (headings.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const id = entry.target.id;
          const tocLink = document.querySelector(`.toc a[href="#${id}"]`);
          
          if (tocLink) {
            if (entry.isIntersecting) {
              // Remove active class from all links
              tocLinks.forEach(link => link.classList.remove('active'));
              // Add active class to current link
              tocLink.classList.add('active');
            }
          }
        });
      }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      });

      headings.forEach(heading => {
        if (heading.id) {
          observer.observe(heading);
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeTOC();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();