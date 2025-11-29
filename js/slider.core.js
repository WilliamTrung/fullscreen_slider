// slider.core.js
// CSS-only fullscreen slider for TV (no Pixi, no GSAP)

(async function () {
  'use strict';

  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  const config = await fetch('config.json').then(r => r.json());
  console.log(config);
  const captionsMap = await fetch('captions.json').then(r => r.json()).catch(() => ({}));

  const sliderEl        = document.getElementById('slider');
  const captionTitleEl  = document.getElementById('caption-title');
  const captionDescEl   = document.getElementById('caption-description');
  const captionMetaEl   = document.getElementById('caption-meta');
  const debugEl         = document.getElementById('debug-overlay');
  const audioEl         = document.getElementById('bgm');

  if (!sliderEl) {
    console.error('Missing #slider element');
    return;
  }

  const images = window.SliderUtils.buildImageListFromConfig(config);
  if (!images.length) {
    console.error('No images configured in config.json');
    return;
  }

  // Shuffle initial order if enabled
  if (config.images && config.images.shuffle) {
    window.SliderUtils.shuffle(images);
  }

  const availableTransitions = Array.isArray(config.transitions) ? config.transitions.slice() : ['fade'];

  // Build two slide layers for cross-fade / slide transitions
  const slideA = document.createElement('div');
  slideA.className = 'slide';
  const slideB = document.createElement('div');
  slideB.className = 'slide';

  sliderEl.appendChild(slideA);
  sliderEl.appendChild(slideB);

  let currentEl = slideA;
  let nextEl = slideB;
  let currentIndex = 0;
  let isTransitioning = false;
  let autoplay = !!config.autoplay;
  let autoplayTimer = null;

  // --- Music engine (local + URL) ---
  if (audioEl && config.music && Array.isArray(config.music.sources) && config.music.sources.length) {
    let musicSources = config.music.sources.slice();
    if (config.music.shuffle) {
      window.SliderUtils.shuffle(musicSources);
    }
    let musicIndex = 0;

    function playNextTrack() {
      if (!musicSources.length) return;
      const src = musicSources[musicIndex % musicSources.length];
      musicIndex++;
      audioEl.src = src;
      if (typeof config.music.volume === 'number') {
        audioEl.volume = Math.min(1, Math.max(0, config.music.volume));
      }
      audioEl.play().catch(() => {});
    }

    audioEl.addEventListener('ended', playNextTrack);
    playNextTrack();

    window.__toggleMusic = function () {
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
      } else {
        audioEl.pause();
      }
    };
  }

  function setSlideImage(el, img) {
    el.style.backgroundImage = `url('${img.src}')`;
    el.dataset.index = String(img.index);
    el.dataset.filename = img.filename;
  }

  function getCurrentImage() {
    return images[currentIndex % images.length];
  }

  function getNextIndex(delta) {
    const len = images.length;
    return (currentIndex + delta + len) % len;
  }

  function updateCaptionsForImage(img) {
    if (!captionTitleEl || !captionDescEl || !captionMetaEl) return;
    const cap = window.SliderUtils.getCaptionForFilename(captionsMap, img.filename) || {};

    captionTitleEl.textContent = cap.title || '';
    captionDescEl.textContent  = cap.description || '';
    const metaParts = [];
    if (cap.author) metaParts.push(cap.author);
    if (cap.date) metaParts.push(cap.date);
    captionMetaEl.textContent = metaParts.join(' • ');

    // Simple fade-in animation via CSS class
    captionTitleEl.classList.remove('caption-fade-in');
    captionDescEl.classList.remove('caption-fade-in');
    captionMetaEl.classList.remove('caption-fade-in');
    void captionTitleEl.offsetWidth;
    captionTitleEl.classList.add('caption-fade-in');
    captionDescEl.classList.add('caption-fade-in');
    captionMetaEl.classList.add('caption-fade-in');
  }

  function showInitial() {
    const img = getCurrentImage();
    setSlideImage(currentEl, img);
    currentEl.style.opacity = '1';
    nextEl.style.opacity = '0';
    updateCaptionsForImage(img);
    window.SliderUtils.updateDebugOverlay(debugEl, config.debug && config.debug.enabled, img, '(initial)');
  }

  function scheduleAutoplay() {
    clearTimeout(autoplayTimer);
    if (!autoplay) return;
    const delay = typeof config.delay === 'number' ? config.delay : 4000;
    autoplayTimer = setTimeout(() => goTo(1), delay);
  }

  function goTo(delta) {
    if (isTransitioning) return;
    isTransitioning = true;

    const fromImg = getCurrentImage();
    currentIndex = getNextIndex(delta);
    const toImg = getCurrentImage();

    setSlideImage(nextEl, toImg);

    const effectName = window.SliderUtils.pickTransitionName(config, availableTransitions);
    window.SliderUtils.updateDebugOverlay(debugEl, config.debug && config.debug.enabled, toImg, effectName);

    window.SliderTransitions.run(effectName, currentEl, nextEl, () => {
      // Swap roles
      const tmp = currentEl;
      currentEl = nextEl;
      nextEl = tmp;

      updateCaptionsForImage(toImg);
      isTransitioning = false;
      scheduleAutoplay();
    });
  }

  // Keyboard controls (PC)
  if (config.keyboard && config.keyboard.enabled !== false) {
    window.addEventListener('keydown', (ev) => {
      switch (ev.key) {
        case 'ArrowRight':
        case 'Right':
          goTo(1);
          break;
        case 'ArrowLeft':
        case 'Left':
          goTo(-1);
          break;
        case ' ':
          autoplay = !autoplay;
          scheduleAutoplay();
          break;
      }
    });
  }

  // Minimal TV remote controls (Left/Right/Up/Down/OK)
  window.__sliderNext = () => goTo(1);
  window.__sliderPrev = () => goTo(-1);
  window.__toggleAutoplay = () => {
    autoplay = !autoplay;
    scheduleAutoplay();
  };
  window.__toggleDebug = () => {
    if (!debugEl) return;
    const enabled = !(config.debug && config.debug.enabled === false);
    const currentlyVisible = debugEl.style.display === 'block';
    if (currentlyVisible) {
      debugEl.style.display = 'none';
    } else {
      const img = getCurrentImage();
      window.SliderUtils.updateDebugOverlay(debugEl, enabled, img, '(manual)');
    }
  };
  window.__toggleCaptions = () => {
    const container = document.querySelector('.caption-container');
    if (!container) return;
    const hidden = container.style.display === 'none';
    container.style.display = hidden ? 'block' : 'none';
  };

  window.addEventListener('keydown', (ev) => {
    switch (ev.key) {
      case 'ArrowRight':
      case 'Right':
        window.__sliderNext();
        break;
      case 'ArrowLeft':
      case 'Left':
        window.__sliderPrev();
        break;
      case 'ArrowUp':
      case 'Up':
        window.__toggleDebug();
        break;
      case 'ArrowDown':
      case 'Down':
        window.__toggleCaptions();
        break;
      case 'Enter':
      case 'OK':
        window.__toggleAutoplay();
        break;
    }
  });

  showInitial();
  scheduleAutoplay();
})();
