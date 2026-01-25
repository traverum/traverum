/**
 * Traverum Widget Embed Script
 * 
 * Usage:
 * <div id="traverum-widget"></div>
 * <script src="https://book.traverum.com/embed.js" 
 *         data-hotel="hotel-traverum"
 *         data-mode="section"
  *         data-max-experiences="3"
  *         data-return-url="https://hotel.com/experiences">
 * </script>
 * 
 * The widget URL is automatically detected from the script src.
 * You can also override it with data-widget-url attribute.
 */
(function() {
  'use strict';
  
  // Configuration
  var CONTAINER_ID = 'traverum-widget';
  
  // Get the current script element
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  // Dynamically detect widget URL from script src
  // Extract origin from script src (e.g., https://widget.traverum.com from https://widget.traverum.com/embed.js)
  var scriptSrc = currentScript.src || currentScript.getAttribute('src') || '';
  var WIDGET_URL = '';
  
  if (scriptSrc) {
    try {
      var url = new URL(scriptSrc);
      WIDGET_URL = url.origin;
    } catch (e) {
      // Fallback: try to extract origin manually
      var match = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
      WIDGET_URL = match ? match[1] : window.location.origin;
    }
  } else {
    // Ultimate fallback: use current page origin
    WIDGET_URL = window.location.origin;
  }
  
  // Read configuration from data attributes
  var config = {
    hotel: currentScript.getAttribute('data-hotel'),
    mode: currentScript.getAttribute('data-mode') || 'section',
    maxExperiences: currentScript.getAttribute('data-max-experiences') || '3',
    theme: currentScript.getAttribute('data-theme') || 'light',
    containerId: currentScript.getAttribute('data-container') || CONTAINER_ID,
    widgetUrl: currentScript.getAttribute('data-widget-url') || WIDGET_URL,
    // Where the "Back" button should return the user (defaults to current host page URL)
    returnUrl: currentScript.getAttribute('data-return-url') || window.location.href
  };
  
  // Use data-widget-url if provided, otherwise use detected URL
  WIDGET_URL = config.widgetUrl;
  
  // Validate required config
  if (!config.hotel) {
    console.error('Traverum: data-hotel attribute is required');
    return;
  }
  
  // Find or create container
  var container = document.getElementById(config.containerId);
  if (!container) {
    console.error('Traverum: Container element #' + config.containerId + ' not found');
    return;
  }
  
  // Build iframe URL with cache-busting timestamp
  var iframeSrc = WIDGET_URL + '/' + config.hotel + '?embed=' + config.mode;
  if (config.maxExperiences) {
    iframeSrc += '&max=' + config.maxExperiences;
  }
  if (config.returnUrl) {
    iframeSrc += '&returnUrl=' + encodeURIComponent(config.returnUrl);
  }
  // Add cache-buster to prevent stale iframe content
  iframeSrc += '&_t=' + Date.now();
  
  // Create loading skeleton
  var skeleton = document.createElement('div');
  skeleton.className = 'traverum-skeleton';
  skeleton.innerHTML = '\
    <div class="traverum-skeleton-card"></div>\
    <div class="traverum-skeleton-card"></div>\
    <div class="traverum-skeleton-card"></div>\
  ';
  
  // Add styles
  var styles = document.createElement('style');
  styles.textContent = '\
    .traverum-container {\
      width: 100%;\
      min-height: 200px;\
      position: relative;\
    }\
    .traverum-iframe {\
      width: 100%;\
      border: none;\
      display: block;\
      transition: opacity 0.3s ease;\
    }\
    .traverum-iframe.loading {\
      opacity: 0;\
      position: absolute;\
      top: 0;\
      left: 0;\
    }\
    .traverum-skeleton {\
      display: grid;\
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\
      gap: 20px;\
      padding: 10px 0;\
    }\
    .traverum-skeleton-card {\
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);\
      background-size: 200% 100%;\
      animation: traverum-shimmer 1.5s infinite;\
      border-radius: 12px;\
      height: 320px;\
    }\
    @keyframes traverum-shimmer {\
      0% { background-position: 200% 0; }\
      100% { background-position: -200% 0; }\
    }\
  ';
  document.head.appendChild(styles);
  
  // Create wrapper
  var wrapper = document.createElement('div');
  wrapper.className = 'traverum-container';
  wrapper.appendChild(skeleton);
  
  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.className = 'traverum-iframe loading';
  iframe.src = iframeSrc;
  iframe.title = 'Traverum Experiences Widget';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allowfullscreen', 'true');
  iframe.setAttribute('allow', 'payment');
  
  // Set initial height
  var currentHeight = 400;
  iframe.style.height = currentHeight + 'px';
  
  // Handle iframe load
  iframe.onload = function() {
    // Remove skeleton and show iframe
    if (skeleton.parentNode) {
      skeleton.parentNode.removeChild(skeleton);
    }
    iframe.classList.remove('loading');
    iframe.style.position = 'relative';
  };
  
  wrapper.appendChild(iframe);
  container.appendChild(wrapper);
  
  // Listen for height messages from iframe
  window.addEventListener('message', function(event) {
    // Validate origin in production
    // if (event.origin !== WIDGET_URL) return;
    
    var data = event.data;
    
    if (data && data.type === 'traverum-resize' && typeof data.height === 'number') {
      var newHeight = Math.max(200, data.height);
      if (Math.abs(newHeight - currentHeight) > 10) {
        currentHeight = newHeight;
        iframe.style.height = newHeight + 'px';
      }
    }
    
    // Handle open in new tab request
    if (data && data.type === 'traverum-open') {
      window.open(data.url, '_blank');
    }
  });
  
  // Expose API
  window.TraverumWidget = {
    reload: function() {
      iframe.src = iframe.src;
    },
    setHotel: function(hotelSlug) {
      config.hotel = hotelSlug;
      iframe.src = WIDGET_URL + '/' + hotelSlug + '?embed=' + config.mode;
    }
  };
})();
