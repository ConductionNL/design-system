/*
 * include.js — runtime component loader for the Conduction Design System.
 *
 * Pages drop a placeholder anywhere in the document:
 *   <div data-include="components/top-navbar.html"></div>
 *
 * On DOMContentLoaded this script fetches each referenced HTML file, lifts its
 * <style> blocks into the host document's <head>, and replaces the placeholder
 * with the body markup. Editing a component file then updates every page that
 * references it — no build step needed.
 *
 * Requires HTTP serving (file:// won't work because of fetch CORS).
 */
(async function () {
  const placeholders = document.querySelectorAll('[data-include]');
  if (!placeholders.length) return;

  await Promise.all([...placeholders].map(async (el) => {
    const url = el.getAttribute('data-include');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      doc.head.querySelectorAll('style').forEach((styleEl) => {
        const id = 'inc-style-' + url.replace(/[^a-z0-9]+/gi, '-');
        if (document.getElementById(id)) return;
        const clone = styleEl.cloneNode(true);
        clone.id = id;
        document.head.appendChild(clone);
      });

      // Pull scripts out of the body before we splat the markup in:
      // scripts inserted via innerHTML are inert (browser security), so
      // we re-create them as live <script> elements after.
      const body = doc.body.cloneNode(true);
      const scripts = [...body.querySelectorAll('script')];
      scripts.forEach((s) => s.remove());

      el.outerHTML = body.innerHTML;

      // Re-attach scripts as live elements so inline code (e.g. the
      // canal-footer skyline randomiser) actually executes. Order is
      // preserved by chaining `load` events on src scripts.
      for (const s of scripts) {
        const live = document.createElement('script');
        for (const attr of s.attributes) live.setAttribute(attr.name, attr.value);
        if (s.src) {
          live.async = false;
        } else {
          live.textContent = s.textContent;
        }
        document.body.appendChild(live);
      }
    } catch (err) {
      el.innerHTML = '<!-- include failed: ' + url + ' (' + err.message + ') -->';
      console.error('include.js failed for', url, err);
    }
  }));

  // Pages can declare <body data-current="apps"> to highlight the matching
  // top-navbar link after the navbar is injected.
  const current = document.body.getAttribute('data-current');
  if (current) {
    document.querySelector('.nav-links a[data-section="' + current + '"]')?.classList.add('current');
  }

  document.dispatchEvent(new CustomEvent('includes:ready'));
})();
