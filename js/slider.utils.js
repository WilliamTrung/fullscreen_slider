// slider.utils.js
// Helper utilities for CSS-based fullscreen slider

window.SliderUtils = (function () {
  'use strict';

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Build internal image list from config.images.sources
  // { images: { sources: [ "images/1.jpg", ... ], shuffle: bool } }
  function buildImageListFromConfig(config) {
    const sources = (config.images && Array.isArray(config.images.sources))
      ? config.images.sources
      : [];

    return sources.map((src, idx) => {
      const parts = src.split('/');
      const filename = parts[parts.length - 1];
      return {
        index: idx,
        filename,
        src
      };
    });
  }

  function getCaptionForFilename(captionsMap, filename) {
    if (!captionsMap || !filename) return null;
    // captions.json keys are just filenames: "1.jpg": { ... }
    return captionsMap[filename] || null;
  }

  function pickTransitionName(config, available) {
    if (!available || !available.length) return 'fade';
    if (config.randomTransitions === false) return available[0];
    const i = Math.floor(Math.random() * available.length);
    return available[i];
  }

  function updateDebugOverlay(debugEl, enabled, img, effectName) {
    if (!debugEl) return;
    if (!enabled || !img) {
      debugEl.style.display = 'none';
      return;
    }
    debugEl.style.display = 'block';
    debugEl.textContent =
      `Index: ${img.index}\n` +
      `File: ${img.filename}\n` +
      `Effect: ${effectName}`;
  }

  return {
    shuffle,
    buildImageListFromConfig,
    getCaptionForFilename,
    pickTransitionName,
    updateDebugOverlay
  };
})();
