// Simple performance monitoring
(function() {
  'use strict';
  
  // Only run in production
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return;
  }

  // Log Core Web Vitals if available
  function logWebVitals() {
    if ('web-vital' in window) {
      return;
    }

    // Simple performance logging
    window.addEventListener('load', function() {
      setTimeout(function() {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
          const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
          
          // Only log if load time is concerning (>3s)
          if (loadTime > 3000) {
            console.log('Performance:', {
              loadTime: Math.round(loadTime),
              domContentLoaded: Math.round(domContentLoaded),
              url: location.pathname
            });
          }
        }
      }, 1000);
    });
  }

  logWebVitals();
})();