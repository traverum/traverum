/**
 * Traverum Widget — Shadow DOM Embed
 * 
 * Usage:
 *   <traverum-widget hotel="hotel-slug" max="3"></traverum-widget>
 *   <script src="https://book.traverum.com/embed.js" async></script>
 *
 * Attributes:
 *   hotel            (required)  Hotel slug
 *   max              (optional)  Max experiences to show  (default 6)
 *   button-label     (optional)  CTA label                (default "See all experiences")
 *   hide-title       (optional)  Hide title/subtitle      (default false)
 *
 * CSS custom-property overrides (set on the host element):
 *   --trv-accent, --trv-text, --trv-bg, --trv-radius,
 *   --trv-font-heading, --trv-font-body
 */
(function () {
  'use strict';
  
  /* ───────── Detect widget base URL from script src ───────── */
  var scriptEl = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  
  var WIDGET_URL = '';
  var scriptSrc = (scriptEl && (scriptEl.src || scriptEl.getAttribute('src'))) || '';
  if (scriptSrc) {
    try { WIDGET_URL = new URL(scriptSrc).origin; }
    catch (_) {
      var m = scriptSrc.match(/^(https?:\/\/[^/]+)/);
      WIDGET_URL = m ? m[1] : location.origin;
    }
  } else {
    WIDGET_URL = location.origin;
  }

  /* ───────── Font injection helper ───────── */
  var injectedFonts = {};
  function injectGoogleFont(family) {
    if (!family || injectedFonts[family]) return;
    // Only inject known Google-style names (skip system-ui etc.)
    var clean = family.split(',')[0].trim().replace(/['"]/g, '');
    if (/system-ui|sans-serif|serif|monospace|inherit|initial/i.test(clean)) return;
    injectedFonts[clean] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(clean) + ':wght@200;300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  /* ───────── Price formatter ───────── */
  function formatPrice(cents, currency) {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }

  /* ───────── Duration formatter ───────── */
  function formatDuration(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), r = min % 60;
    return r === 0 ? h + 'h' : h + 'h ' + r + 'min';
  }

  /* ───────── Darken hex colour helper ───────── */
  function darken(hex, pct) {
    pct = pct || 12;
    var c = hex.replace('#', '');
    var r = parseInt(c.substring(0, 2), 16);
    var g = parseInt(c.substring(2, 4), 16);
    var b = parseInt(c.substring(4, 6), 16);
    var d = function (v) { return Math.max(0, Math.floor(v * (1 - pct / 100))); };
    var h = function (v) { return v.toString(16).padStart(2, '0'); };
    return '#' + h(d(r)) + h(d(g)) + h(d(b));
  }

  /* ───────── Contrast: light text on dark bg or vice versa ───────── */
  function textOnBg(hex) {
    var c = hex.replace('#', '');
    var r = parseInt(c.substring(0, 2), 16);
    var g = parseInt(c.substring(2, 4), 16);
    var b = parseInt(c.substring(4, 6), 16);
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#000000' : '#ffffff';
  }

  /* ───────── Skeleton HTML ───────── */
  function skeletonHTML(n) {
    var cards = '';
    for (var i = 0; i < (n || 3); i++) {
      cards += '<div class="trv-skeleton-card"></div>';
    }
    return '<div class="trv-skeleton">' + cards + '</div>';
  }

  /* ═══════════════════════════════════════════════════════════
     Web Component: <traverum-widget>
     ═══════════════════════════════════════════════════════════ */
  class TraverumWidget extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      var hotel = this.getAttribute('hotel');
      if (!hotel) {
        this._shadow.innerHTML = '<p style="color:red">Traverum: missing <code>hotel</code> attribute</p>';
        return;
      }

      var max = parseInt(this.getAttribute('max') || '6', 10);
      var hideTitle = this.hasAttribute('hide-title');
      var buttonLabel = this.getAttribute('button-label') || 'See all experiences';

      // Show skeleton immediately
      this._shadow.innerHTML = this._baseStyles() + skeletonHTML(Math.min(max, 3));

      // Fetch data (add timestamp to bust cache during development)
      var cacheBuster = window.location.hostname === 'localhost' ? '&_t=' + Date.now() : '';
      var apiUrl = WIDGET_URL + '/api/embed/' + encodeURIComponent(hotel) + '?max=' + max + cacheBuster;
      var self = this;

      fetch(apiUrl)
        .then(function (r) {
          if (!r.ok) {
            console.error('Traverum widget API error:', r.status, r.statusText, 'URL:', apiUrl);
            throw new Error('HTTP ' + r.status + ': ' + r.statusText);
          }
          return r.json();
        })
        .then(function (data) {
          if (!data || !data.experiences) {
            console.warn('Traverum widget: No experiences data received', data);
          }
          self._render(data, hotel, hideTitle, buttonLabel);
        })
        .catch(function () {
          // Hotel inactive or not found — render nothing (widget hidden from site)
          self._shadow.innerHTML = '';
        });
    }

    /* ── Render the widget ── */
    _render(data, hotelSlug, hideTitle, buttonLabel) {
      var theme = data.theme;
      var widget = data.widget;
      var experiences = data.experiences || [];

      // Inject Google Fonts into the host document <head>
      injectGoogleFont(theme.headingFontFamily);
      injectGoogleFont(theme.bodyFontFamily);

      var accent = theme.accentColor;
      var accentHover = darken(accent);
      var accentFg = textOnBg(accent);
      var headingColor = theme.headingColor || theme.textColor;
      var textColor = theme.textColor;
      var bgColor = theme.backgroundColor;
      var cardRadius = theme.cardRadius;
      var headingFont = theme.headingFontFamily;
      var bodyFont = theme.bodyFontFamily;
      var headingWeight = theme.headingFontWeight || '200';
      var basePx = parseInt(theme.fontSizeBase) || 16;

      // Spacing & alignment
      var textAlign = theme.textAlign || 'left';
      var sectionPadding = theme.sectionPadding || '0';
      var titleMargin = theme.titleMargin || '24px';
      var gridGap = theme.gridGap || '20px';
      var ctaMargin = theme.ctaMargin || '28px';
      var gridMinWidth = theme.gridMinWidth || '280px';
      
      // Debug logging
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        console.log('Traverum widget theme:', {
          textAlign: textAlign,
          sectionPadding: sectionPadding,
          titleMargin: titleMargin,
          gridGap: gridGap,
        });
      }

      var bookingBase = WIDGET_URL + '/' + hotelSlug;

      // Build scoped CSS
      var css = '\n' +
        ':host {\n' +
        '  display: block;\n' +
        '  --_accent: var(--trv-accent, ' + accent + ');\n' +
        '  --_accent-hover: var(--trv-accent-hover, ' + accentHover + ');\n' +
        '  --_accent-fg: var(--trv-accent-fg, ' + accentFg + ');\n' +
        '  --_heading-text: var(--trv-heading-text, ' + headingColor + ');\n' +
        '  --_text: var(--trv-text, ' + textColor + ');\n' +
        '  --_bg: var(--trv-bg, ' + bgColor + ');\n' +
        '  --_radius: var(--trv-radius, ' + cardRadius + ');\n' +
        '  --_font-heading: var(--trv-font-heading, ' + headingFont + ');\n' +
        '  --_font-body: var(--trv-font-body, ' + bodyFont + ');\n' +
        '  --_heading-weight: var(--trv-heading-weight, ' + headingWeight + ');\n' +
        '  --_base-px: var(--trv-base-px, ' + basePx + 'px);\n' +
        '  --_text-align: var(--trv-text-align, ' + textAlign + ');\n' +
        '  --_section-padding: var(--trv-section-padding, ' + sectionPadding + ');\n' +
        '  --_title-margin: var(--trv-title-margin, ' + titleMargin + ');\n' +
        '  --_grid-gap: var(--trv-grid-gap, ' + gridGap + ');\n' +
        '  --_cta-margin: var(--trv-cta-margin, ' + ctaMargin + ');\n' +
        '  --_grid-min: var(--trv-grid-columns, ' + gridMinWidth + ');\n' +
        '  font-family: var(--_font-body);\n' +
        '  font-size: var(--_base-px);\n' +
        '  color: var(--_text);\n' +
        '  line-height: 1.5;\n' +
        '  box-sizing: border-box;\n' +
        '  padding: var(--_section-padding);\n' +
        '}\n' +
        '*, *::before, *::after { box-sizing: border-box; }\n' +

        /* ── Header ── */
        '.trv-header {\n' +
        '  margin-bottom: var(--_title-margin);\n' +
        '  text-align: var(--_text-align);\n' +
        '}\n' +
        '.trv-title {\n' +
        '  font-family: var(--_font-heading);\n' +
        '  font-weight: var(--_heading-weight);\n' +
        '  font-size: clamp(1.5rem, 3vw, 2.5rem);\n' +
        '  margin: 0 0 0.25rem;\n' +
        '  color: var(--_heading-text);\n' +
        '  line-height: 1.2;\n' +
        '}\n' +
        '.trv-subtitle {\n' +
        '  font-size: calc(var(--_base-px) * 1.125);\n' +
        '  color: var(--_text);\n' +
        '  opacity: 0.65;\n' +
        '  margin: 0;\n' +
        '}\n' +

        /* ── Grid ── */
        (textAlign === 'center'
          ? '.trv-grid {\n' +
            '  display: flex;\n' +
            '  flex-wrap: wrap;\n' +
            '  justify-content: center;\n' +
            '  gap: var(--_grid-gap);\n' +
            '}\n' +
            '.trv-grid > * {\n' +
            '  width: var(--_grid-min);\n' +
            '  max-width: 100%;\n' +
            '}\n'
          : '.trv-grid {\n' +
            '  display: grid;\n' +
            '  grid-template-columns: repeat(auto-fill, minmax(var(--_grid-min), 1fr));\n' +
            '  gap: var(--_grid-gap);\n' +
            '}\n'
        ) +

        /* ── Card ── */
        '.trv-card {\n' +
        '  display: block;\n' +
        '  border-radius: var(--_radius);\n' +
        '  overflow: hidden;\n' +
        '  text-decoration: none;\n' +
        '  color: inherit;\n' +
        '  background: var(--_bg);\n' +
        '  border: 1px solid rgba(0,0,0,0.08);\n' +
        '  transition: box-shadow 0.2s ease;\n' +
        '  cursor: pointer;\n' +
        '}\n' +
        '.trv-card:hover {\n' +
        '  box-shadow: 0 2px 8px rgba(0,0,0,0.08);\n' +
        '}\n' +
        '.trv-card:focus-visible {\n' +
        '  outline: 2px solid var(--_accent);\n' +
        '  outline-offset: 2px;\n' +
        '}\n' +

        /* ── Image ── */
        '.trv-img-wrap {\n' +
        '  position: relative;\n' +
        '  width: 100%;\n' +
        '  padding-bottom: 66.67%;\n' +    /* 3:2 aspect ratio */
        '  overflow: hidden;\n' +
        '  background: #f0f0f0;\n' +
        '}\n' +
        '.trv-img {\n' +
        '  position: absolute;\n' +
        '  inset: 0;\n' +
        '  width: 100%;\n' +
        '  height: 100%;\n' +
        '  object-fit: cover;\n' +
        '}\n' +
        '.trv-img-overlay {\n' +
        '  position: absolute;\n' +
        '  inset: 0;\n' +
        '  background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%);\n' +
        '}\n' +
        '.trv-card-title {\n' +
        '  position: absolute;\n' +
        '  bottom: 0.875rem;\n' +
        '  left: 0.875rem;\n' +
        '  right: 0.875rem;\n' +
        '  font-family: var(--_font-heading);\n' +
        '  font-weight: 500;\n' +
        '  font-size: calc(var(--_base-px) * 1.125);\n' +
        '  color: #fff;\n' +
        '  margin: 0;\n' +
        '  line-height: 1.3;\n' +
        '  text-shadow: 0 1px 3px rgba(0,0,0,0.3);\n' +
        '}\n' +

        /* ── Card body ── */
        '.trv-body {\n' +
        '  padding: 0.75rem 0.875rem;\n' +
        '  display: flex;\n' +
        '  justify-content: space-between;\n' +
        '  align-items: center;\n' +
        '}\n' +
        '.trv-meta {\n' +
        '  font-size: calc(var(--_base-px) * 0.8125);\n' +
        '  color: var(--_text);\n' +
        '  opacity: 0.55;\n' +
        '}\n' +
        '.trv-price {\n' +
        '  font-weight: 600;\n' +
        '  font-size: calc(var(--_base-px) * 0.9375);\n' +
        '  color: var(--_accent);\n' +
        '  white-space: nowrap;\n' +
        '}\n' +
        '.trv-price-suffix {\n' +
        '  font-weight: 400;\n' +
        '  font-size: calc(var(--_base-px) * 0.75);\n' +
        '  opacity: 0.7;\n' +
        '}\n' +

        /* ── CTA button ── */
        '.trv-cta-wrap { text-align: var(--_text-align); margin-top: var(--_cta-margin); }\n' +
        '.trv-cta {\n' +
        '  display: inline-flex;\n' +
        '  align-items: center;\n' +
        '  gap: 0.5rem;\n' +
        '  padding: 0.75rem 1.75rem;\n' +
        '  font-family: var(--_font-body);\n' +
        '  font-weight: 500;\n' +
        '  font-size: calc(var(--_base-px) * 0.9375);\n' +
        '  color: var(--_accent-fg);\n' +
        '  background: var(--_accent);\n' +
        '  border: none;\n' +
        '  border-radius: calc(var(--_radius) * 0.667);\n' +
        '  cursor: pointer;\n' +
        '  text-decoration: none;\n' +
        '  transition: background 0.15s ease;\n' +
        '}\n' +
        '.trv-cta:hover { background: var(--_accent-hover); }\n' +
        '.trv-cta svg { width: 1em; height: 1em; }\n' +

        /* ── Skeleton ── */
        '.trv-skeleton {\n' +
        '  display: grid;\n' +
        '  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n' +
        '  gap: 20px;\n' +
        '}\n' +
        '.trv-skeleton-card {\n' +
        '  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);\n' +
        '  background-size: 200% 100%;\n' +
        '  animation: trv-shimmer 1.5s infinite;\n' +
        '  border-radius: var(--_radius, 12px);\n' +
        '  height: 300px;\n' +
        '}\n' +
        '@keyframes trv-shimmer {\n' +
        '  0% { background-position: 200% 0; }\n' +
        '  100% { background-position: -200% 0; }\n' +
        '}\n' +

        /* ── Error ── */
        '.trv-error {\n' +
        '  text-align: center;\n' +
        '  padding: 2rem;\n' +
        '  color: #666;\n' +
        '  font-size: 0.875rem;\n' +
        '}\n' +

        /* ── Empty ── */
        '.trv-empty {\n' +
        '  text-align: var(--_text-align);\n' +
        '  padding: 3rem 1rem;\n' +
        '  color: var(--_text);\n' +
        '  opacity: 0.5;\n' +
        '}\n' +

        /* ── Fade-in animation ── */
        '.trv-fade-in {\n' +
        '  animation: trv-fade 0.3s ease forwards;\n' +
        '}\n' +
        '@keyframes trv-fade {\n' +
        '  from { opacity: 0; transform: translateY(10px); }\n' +
        '  to   { opacity: 1; transform: translateY(0); }\n' +
        '}\n' +

        /* ── Powered by ── */
        '.trv-powered {\n' +
        '  text-align: var(--_text-align);\n' +
        '  margin-top: 1.25rem;\n' +
        '  font-size: 0.7rem;\n' +
        '  opacity: 0.35;\n' +
        '}\n' +
        '.trv-powered a {\n' +
        '  color: inherit;\n' +
        '  text-decoration: none;\n' +
        '}\n' +
        '.trv-powered a:hover { opacity: 0.8; }\n';

      // Build HTML
      var html = '';

      // Title / subtitle
      if (!hideTitle && widget.titleEnabled) {
        html += '<div class="trv-header">';
        html += '<h2 class="trv-title">' + this._esc(widget.title) + '</h2>';
        if (widget.subtitle) {
          html += '<p class="trv-subtitle">' + this._esc(widget.subtitle) + '</p>';
        }
        html += '</div>';
      }

      if (experiences.length === 0) {
        html += '<div class="trv-empty">No experiences available yet.</div>';
      } else {
        // Cards grid
        html += '<div class="trv-grid">';
        for (var i = 0; i < experiences.length; i++) {
          var exp = experiences[i];
          var href = bookingBase + '/' + exp.slug + '?embed=full';
          var delay = (i * 60) + 'ms';

          html += '<a class="trv-card trv-fade-in" href="' + this._esc(href) + '" target="_blank" rel="noopener noreferrer" style="animation-delay:' + delay + '">';

          // Image
          html += '<div class="trv-img-wrap">';
          if (exp.coverImage) {
            html += '<img class="trv-img" src="' + this._esc(exp.coverImage) + '" alt="' + this._esc(exp.title) + '" loading="lazy">';
          }
          html += '<div class="trv-img-overlay"></div>';
          html += '<h3 class="trv-card-title">' + this._esc(exp.title) + '</h3>';
          html += '</div>';

          // Body
          html += '<div class="trv-body">';
          html += '<span class="trv-meta">' + formatDuration(exp.durationMinutes) + '</span>';
          html += '<span class="trv-price">' + formatPrice(exp.priceCents, exp.currency);
          if (exp.priceSuffix) {
            html += ' <span class="trv-price-suffix">' + this._esc(exp.priceSuffix) + '</span>';
          }
          html += '</span>';
          html += '</div>';

          html += '</a>';
        }
        html += '</div>';

        // "See all" CTA if there are more experiences
        if (widget.totalExperiences > experiences.length) {
          var ctaHref = bookingBase + '?embed=full';
          html += '<div class="trv-cta-wrap">';
          html += '<a class="trv-cta" href="' + this._esc(ctaHref) + '" target="_blank" rel="noopener noreferrer">';
          html += this._esc(buttonLabel);
          html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
          html += '</a>';
          html += '</div>';
        }
      }

      // Powered by
      html += '<div class="trv-powered"><a href="https://traverum.com" target="_blank" rel="noopener noreferrer">Powered by Traverum</a></div>';

      this._shadow.innerHTML = '<style>' + css + '</style>' + html;
    }

    /* ── Escape HTML ── */
    _esc(s) {
      if (!s) return '';
      var d = document.createElement('div');
      d.appendChild(document.createTextNode(s));
      return d.innerHTML;
    }

    /* ── Base styles (used during skeleton phase) ── */
    _baseStyles() {
      return '<style>' +
        ':host { display: block; font-family: system-ui, sans-serif; }' +
        '*, *::before, *::after { box-sizing: border-box; }' +
        '.trv-skeleton {' +
        '  display: grid;' +
        '  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));' +
        '  gap: 20px;' +
        '}' +
        '.trv-skeleton-card {' +
        '  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);' +
        '  background-size: 200% 100%;' +
        '  animation: trv-shimmer 1.5s infinite;' +
        '  border-radius: 12px;' +
        '  height: 300px;' +
        '}' +
        '@keyframes trv-shimmer {' +
        '  0% { background-position: 200% 0; }' +
        '  100% { background-position: -200% 0; }' +
        '}' +
        '.trv-error { text-align:center; padding:2rem; color:#666; font-size:0.875rem; }' +
        '</style>';
    }
  }

  /* Register custom element (guard against double-registration) */
  if (!customElements.get('traverum-widget')) {
    try {
      customElements.define('traverum-widget', TraverumWidget);
      console.log('Traverum widget: Custom element registered');
    } catch (err) {
      console.error('Traverum widget: Failed to register custom element', err);
    }
  } else {
    console.log('Traverum widget: Custom element already registered');
  }

  /* ─── WordPress compatibility: Auto-initialize if custom element was stripped ─── */
  /* WordPress sanitizes HTML and may remove unknown custom elements */
  (function wordpressCompat() {
    // Wait for DOM to be ready
    function initWidgets() {
      // Find all traverum-widget elements (if they survived sanitization)
      var existingWidgets = document.querySelectorAll('traverum-widget');
      
      // Also check for divs with data attributes (WordPress fallback)
      var fallbackContainers = document.querySelectorAll('[data-traverum-hotel]');
      
      // Process existing widgets
      existingWidgets.forEach(function(widget) {
        // Widget already exists, it will initialize via connectedCallback
        if (!widget.hasAttribute('hotel')) {
          var hotel = widget.getAttribute('data-hotel') || widget.getAttribute('data-traverum-hotel');
          if (hotel) widget.setAttribute('hotel', hotel);
        }
      });
      
      // Process fallback containers (WordPress stripped the custom element)
      fallbackContainers.forEach(function(container) {
        if (container.tagName.toLowerCase() === 'traverum-widget') return; // Already a widget
        
        var hotel = container.getAttribute('data-traverum-hotel') || container.getAttribute('data-hotel');
        if (!hotel) return;
        
        var max = container.getAttribute('data-max') || container.getAttribute('data-max-experiences') || '3';
        
        // Create widget element
        var widget = document.createElement('traverum-widget');
        widget.setAttribute('hotel', hotel);
        widget.setAttribute('max', max);
        
        // Replace container with widget
        if (container.parentNode) {
          container.parentNode.replaceChild(widget, container);
        }
      });
      
      // Also check script tag for data attributes (legacy pattern)
      if (scriptEl) {
        var scriptHotel = scriptEl.getAttribute('data-hotel');
        if (scriptHotel) {
          // Look for any container that might need initialization
          var containers = document.querySelectorAll('[id*="traverum"], [class*="traverum"]');
          containers.forEach(function(container) {
            if (container.tagName.toLowerCase() !== 'traverum-widget' && !container.hasAttribute('data-traverum-initialized')) {
              var widget = document.createElement('traverum-widget');
              widget.setAttribute('hotel', scriptHotel);
              widget.setAttribute('max', scriptEl.getAttribute('data-max-experiences') || '3');
              container.setAttribute('data-traverum-initialized', 'true');
              container.appendChild(widget);
            }
          });
        }
      }
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidgets);
    } else {
      initWidgets();
    }
    
    // Also try after a short delay (in case WordPress modifies DOM after load)
    setTimeout(initWidgets, 100);
    setTimeout(initWidgets, 500);
  })();

  /* ─── Public API ─── */
  window.TraverumWidget = {
    version: '2.0.0',
    reload: function (selector) {
      var els = document.querySelectorAll(selector || 'traverum-widget');
      els.forEach(function (el) {
        // Re-trigger connectedCallback by removing and re-adding
        var parent = el.parentNode;
        var next = el.nextSibling;
        parent.removeChild(el);
        parent.insertBefore(el, next);
      });
    },
  };
})();
