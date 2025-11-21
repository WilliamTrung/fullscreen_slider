// slider.transitions.js
// Apply CSS-based transitions between two .slide elements

window.SliderTransitions = (function () {
  'use strict';

  // Map logical effect names from config.json to CSS class names
  const EFFECT_CLASS = {
    'fade':             { incoming: 'fade-in',       outgoing: 'fade-out' },
    'crossfade':        { incoming: 'fade-in',       outgoing: 'fade-out' },
    'slide-left':       { incoming: 'slide-left',    outgoing: 'push-left' },
    'slide-right':      { incoming: 'slide-right',   outgoing: 'push-right' },
    'zoom-in':          { incoming: 'zoom-in',       outgoing: 'fade-out' },
    'zoom-out':         { incoming: 'zoom-out',      outgoing: 'fade-out' },
    'kenburns':         { incoming: 'kenburns',      outgoing: 'fade-out' },
    'rotate':           { incoming: 'rotate-in',     outgoing: 'fade-out' },
    'blur-fade':        { incoming: 'blur-fade',     outgoing: 'fade-out' },

    // Extra ones already present in style.css (optional)
    'wipe-left':        { incoming: 'wipe-left',     outgoing: 'fade-out' },
    'wipe-right':       { incoming: 'wipe-right',    outgoing: 'fade-out' },
    'split-horizontal': { incoming: 'split-horizontal', outgoing: 'fade-out' },
    'split-vertical':   { incoming: 'split-vertical',   outgoing: 'fade-out' },
    'flip-horizontal':  { incoming: 'flip-horizontal',  outgoing: 'fade-out' },
    'flip-vertical':    { incoming: 'flip-vertical',    outgoing: 'fade-out' },
    'cube-rotate':      { incoming: 'cube-rotate',      outgoing: 'fade-out' },
    'curtain-open':     { incoming: 'curtain-open',     outgoing: 'fade-out' },
    'checkerboard':     { incoming: 'checkerboard',     outgoing: 'fade-out' },
    'stripes':          { incoming: 'stripes',          outgoing: 'fade-out' },
    'book-open':        { incoming: 'book-open',        outgoing: 'fade-out' },
    'water-ripple':     { incoming: 'water-ripple',     outgoing: 'fade-out' }
  };

  function clearEffectClasses(el) {
    if (!el) return;
    el.className = 'slide';
  }

  function run(effectName, currentEl, nextEl, onDone) {
    if (!currentEl || !nextEl) {
      if (onDone) onDone();
      return;
    }

    const mapping = EFFECT_CLASS[effectName] || EFFECT_CLASS['fade'];
    const inClass  = mapping.incoming;
    const outClass = mapping.outgoing;

    clearEffectClasses(currentEl);
    clearEffectClasses(nextEl);

    // Ensure starting state
    nextEl.style.opacity = '1';
    currentEl.style.opacity = '1';

    // Force reflow so animations restart
    void currentEl.offsetWidth;

    let finished = 0;
    const needed = 2;

    function handleDone() {
      finished++;
      if (finished >= needed) {
        // After animation, hide old slide
        currentEl.style.opacity = '0';
        currentEl.className = 'slide';
        nextEl.className = 'slide';
        if (onDone) onDone();
      }
    }

    function addAnim(el, cls) {
      if (!el || !cls) return handleDone();
      function onAnimEnd(e) {
        if (e.target !== el) return;
        el.removeEventListener('animationend', onAnimEnd);
        handleDone();
      }
      el.addEventListener('animationend', onAnimEnd);
      el.classList.add(cls);
    }

    addAnim(nextEl, inClass);
    addAnim(currentEl, outClass);
  }

  return { run };
})();
