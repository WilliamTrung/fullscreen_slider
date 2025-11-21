// slider.utils.js
// Helper utilities for the Pixi + GSAP slider

window.SliderUtils = (function () {
  'use strict';

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Build internal image list from config.images.sources
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

  // Create a PIXI.Sprite fitted to the screen for a given image object {src,...}
  function createFittedSprite(app, img) {
    const sprite = PIXI.Sprite.from(img.src);
    sprite.anchor.set(0.5);

    function fit() {
      const tex = sprite.texture;
      const w = tex.width;
      const h = tex.height;
      const sw = app.renderer.width;
      const sh = app.renderer.height;
      const scale = Math.max(sw / w, sh / h);
      sprite.scale.set(scale);
      sprite.x = sw / 2;
      sprite.y = sh / 2;
    }

    if (!sprite.texture.valid) {
      sprite.texture.baseTexture.on('loaded', fit);
    } else {
      fit();
    }

    sprite.alpha = 0;
    return sprite;
  }

  function fadeOutCaption(captionEls) {
    if (!window.gsap) return;
    window.gsap.to(captionEls, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  function fadeInCaption(captionEls) {
    if (!window.gsap) return;
    window.gsap.fromTo(
      captionEls,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
    );
  }

  function updateCaptionByFilename(captions, filename, captionTitle, captionDesc, captionMeta) {
    const cap = captions[filename];
    if (!cap) {
      captionTitle.textContent = '';
      captionDesc.textContent = '';
      captionMeta.textContent = '';
      return;
    }

    captionTitle.textContent = cap.title ?? '';
    captionDesc.textContent = cap.description ?? '';
    captionMeta.textContent = [cap.author, cap.date].filter(Boolean).join(' • ');
  }

  function updateDebugOverlay(config, debugOverlay, img, effectName) {
    if (!config.debug || !config.debug.enabled) {
      debugOverlay.style.display = 'none';
      return;
    }
    debugOverlay.style.display = 'block';
    debugOverlay.textContent =
      `Index: ${img.index}\n` +
      `File: ${img.filename}\n` +
      `Effect: ${effectName}`;
  }

  function pickTransitionName(config, available) {
    if (!available || !available.length) return 'fade';
    if (config.randomTransitions === false) return available[0];
    const i = Math.floor(Math.random() * available.length);
    return available[i];
  }

  return {
    shuffle,
    buildImageListFromConfig,
    createFittedSprite,
    fadeOutCaption,
    fadeInCaption,
    updateCaptionByFilename,
    updateDebugOverlay,
    pickTransitionName
  };
})();
