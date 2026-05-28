/* Feature grid — touch fallback for the hover tooltip.

   Devices without native hover (phones, tablets) never trigger CSS :hover,
   so tooltips would be invisible. This script adds tap-to-toggle on those
   devices, leaving desktop hover untouched.

   Tap an .item to open its tip. Tap elsewhere (or another .item) to close.
   Idempotent, runs on DOMContentLoaded. */

(function () {
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  if (supportsHover) return;

  document.addEventListener('click', (e) => {
    const item = e.target.closest('.feature-grid .item');
    document.querySelectorAll('.feature-grid .item.tip-open').forEach((el) => {
      if (el !== item) el.classList.remove('tip-open');
    });
    if (item) item.classList.toggle('tip-open');
  });
})();
