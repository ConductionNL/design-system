/* ============================================================
   cn-deck.js — Conduction slide-deck custom elements
   ------------------------------------------------------------
   <cn-deck>            wraps a deck; auto-numbers slides
                        ("03 / 16"), adds a Present control,
                        and runs a fit-to-screen present mode
                        (arrow / space / PageUp-Down / Esc).
   <cn-slide layout=".."  the 16:9 canvas. Renders its light-DOM
              eyebrow=".."> children as-is and injects the eyebrow +
                        any layout-inherent hex decoration.

   No build step, no shadow DOM — content stays authorable HTML,
   styled by cn-deck.css. Drop both files in and write slides.

   Layouts: title intro agenda content stats quote section
            horizons spotlight comparison columns questions
            image timeline contact logo-wall
   ============================================================ */
(function () {
  'use strict';

  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------------------------------- <cn-slide> */
  class CnSlide extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      var layout = this.getAttribute('layout') || 'content';

      // Eyebrow (top-left mono kicker)
      var eb = this.getAttribute('eyebrow');
      if (eb && !this.querySelector(':scope > .cn-eyebrow')) {
        var e = document.createElement('span');
        e.className = 'cn-eyebrow';
        e.textContent = eb;
        this.prepend(e);
      }

      // Layout-inherent hex decoration (opt out with the `nodeco` attr)
      if (!this.hasAttribute('nodeco')) this._decorate(layout);
    }

    _decorate(layout) {
      // Brand-mark decoration: orange hex + white C on cobalt slides;
      // the white outline mark on the dark contact slide.
      var src;
      if (layout === 'title' || layout === 'section' || layout === 'image') {
        src = '../../brand/assets/avatar-conduction-orange.svg';
      } else if (layout === 'contact') {
        src = '../../brand/assets/avatar-conduction-white.svg';
      } else {
        return;
      }
      var span = document.createElement('span');
      span.className = 'cn-deco-mark';
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      span.appendChild(img);
      this.prepend(span);
    }
  }

  /* ---------------------------------- <cn-deck> */
  class CnDeck extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this._idx = 0;
      this._onKey = this._key.bind(this);
      this._onResize = this._fit.bind(this);
      // Defer until <cn-slide> children have upgraded.
      requestAnimationFrame(this.number.bind(this));
      if (!this.hasAttribute('no-present-button')) this._addButton();
    }

    get slides() {
      return Array.prototype.slice.call(this.querySelectorAll(':scope > cn-slide'));
    }

    number() {
      var slides = this.slides;
      var total = this.hasAttribute('total') ? parseInt(this.getAttribute('total'), 10) : slides.length;
      slides.forEach(function (sl, i) {
        var p = sl.querySelector(':scope > .cn-pgnum');
        if (!p) {
          p = document.createElement('span');
          p.className = 'cn-pgnum';
          sl.appendChild(p);
        }
        p.textContent = pad(i + 1) + ' / ' + pad(total);
      });
    }

    _addButton() {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '▶ Present';
      b.setAttribute('aria-label', 'Start presentation');
      b.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:50;' +
        'font:600 13px/1 var(--conduction-typography-font-family-body),sans-serif;' +
        'color:#fff;background:var(--c-orange-knvb);border:0;border-radius:var(--radius-pill);' +
        'padding:10px 18px;cursor:pointer;';
      b.className = 'cn-present-btn';
      var self = this;
      b.addEventListener('click', function () { self.present(); });
      this._btn = b;
      document.body.appendChild(b);
    }

    present(startIndex) {
      this._idx = startIndex || 0;
      this.classList.add('cn-present');
      if (this._btn) this._btn.style.display = 'none';
      this._fit();
      this._show();
      document.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      if (this.requestFullscreen) this.requestFullscreen().catch(function () {});
      document.addEventListener('fullscreenchange', this._fsHandler = function () {
        if (!document.fullscreenElement) this.exit();
      }.bind(this));
    }

    exit() {
      this.classList.remove('cn-present');
      if (this._btn) this._btn.style.display = '';
      document.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      if (this._fsHandler) document.removeEventListener('fullscreenchange', this._fsHandler);
      this.slides.forEach(function (s) { s.classList.remove('is-current'); });
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    }

    _fit() {
      var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      this.style.setProperty('--cn-present-scale', s);
    }

    _show() {
      var idx = this._idx;
      this.slides.forEach(function (s, i) { s.classList.toggle('is-current', i === idx); });
    }

    next() { this._idx = Math.min(this._idx + 1, this.slides.length - 1); this._show(); }
    prev() { this._idx = Math.max(this._idx - 1, 0); this._show(); }

    _key(e) {
      if (e.key === 'Escape') { this.exit(); }
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); this.next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); this.prev(); }
    }
  }

  if (!customElements.get('cn-slide')) customElements.define('cn-slide', CnSlide);
  if (!customElements.get('cn-deck')) customElements.define('cn-deck', CnDeck);
})();
