// slider.core.js
// Main Pixi + GSAP slideshow engine

(async function () {
  'use strict';

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  const config = await fetch('config.json').then(r => r.json());
  const captions = await fetch('captions.json').then(r => r.json()).catch(() => ({}));

  const sliderEl = document.getElementById('slider');
  const audio = document.getElementById('bgm');
  const captionTitle = document.getElementById('caption-title');
  const captionDesc = document.getElementById('caption-description');
  const captionMeta = document.getElementById('caption-meta');
  const debugOverlay = document.getElementById('debug-overlay');

  if (!window.PIXI) {
    console.error('Pixi.js not found. Slider cannot start.');
    return;
  }

  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x000000
  });
  sliderEl.innerHTML = '';
  sliderEl.appendChild(app.view);

  // Build image list from config
  let imageList = window.SliderUtils.buildImageListFromConfig(config);
  if (!imageList.length) {
    console.warn('No images configured in config.images.sources');
    return;
  }

  if (config.images?.shuffle !== false) {
    window.SliderUtils.shuffle(imageList);
  }

  let currentIdx = 0;
  let currentSprite = null;
  let isAnimating = false;

  function showFirstImage() {
    const img = imageList[currentIdx];
    currentSprite = window.SliderUtils.createFittedSprite(app, img);
    currentSprite.alpha = 1;
    app.stage.addChild(currentSprite);

    window.SliderUtils.updateCaptionByFilename(
      captions,
      img.filename,
      captionTitle,
      captionDesc,
      captionMeta
    );
    window.SliderUtils.fadeInCaption([captionTitle, captionDesc, captionMeta]);
    window.SliderUtils.updateDebugOverlay(config, debugOverlay, img, 'initial');
  }

  // handle resize
  window.addEventListener('resize', () => {
    if (!currentSprite) return;
    const img = imageList[currentIdx];
    const newSprite = window.SliderUtils.createFittedSprite(app, img);
    newSprite.alpha = currentSprite.alpha;
    app.stage.removeChild(currentSprite);
    currentSprite = newSprite;
    app.stage.addChild(currentSprite);
  });

  // Music engine
  async function startMusic() {
    if (!config.music || !Array.isArray(config.music.sources)) return;

    let playlist = [];

    for (let src of config.music.sources) {
      const ok = await fetch(src).then(r => r.ok).catch(() => false);
      if (ok) playlist.push(src);
      else console.warn('Music not found:', src);
    }

    if (!playlist.length) return;

    if (config.music.shuffle) {
      window.SliderUtils.shuffle(playlist);
    }

    let idx = 0;
    function playNext() {
      audio.src = playlist[idx];
      audio.volume = config.music.volume ?? 0.7;
      audio.play().catch(err => console.warn('Music autoplay blocked:', err));
      idx = (idx + 1) % playlist.length;
    }

    audio.addEventListener('ended', playNext);
    playNext();
  }

  function nextSlide() {
    if (isAnimating || !imageList.length) return;

    window.SliderUtils.fadeOutCaption([captionTitle, captionDesc, captionMeta]);

    const fromImg = imageList[currentIdx];
    const fromSprite = currentSprite;

    currentIdx++;
    if (currentIdx >= imageList.length) {
      window.SliderUtils.shuffle(imageList); // shuffle every loop
      currentIdx = 0;
    }

    const toImg = imageList[currentIdx];
    const toSprite = window.SliderUtils.createFittedSprite(app, toImg);
    app.stage.addChild(toSprite);

    const effectName = window.SliderUtils.pickTransitionName(config, config.transitions);
    isAnimating = true;

    window.SliderTransitions.run(effectName, app, fromSprite, toSprite, () => {
      currentSprite = toSprite;
      isAnimating = false;

      window.SliderUtils.updateCaptionByFilename(
        captions,
        toImg.filename,
        captionTitle,
        captionDesc,
        captionMeta
      );
      window.SliderUtils.fadeInCaption([captionTitle, captionDesc, captionMeta]);
      window.SliderUtils.updateDebugOverlay(config, debugOverlay, toImg, effectName);
    });
  }

  // Autoplay
  if (config.autoplay !== false) {
    setInterval(nextSlide, config.delay ?? 5000);
  }

  // Keyboard
  if (config.keyboard?.enabled) {
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        currentIdx = (currentIdx - 2 + imageList.length) % imageList.length;
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (!audio.src) return;
        audio.paused ? audio.play() : audio.pause();
      }
    });
  }

  // Start systems
  showFirstImage();
  startMusic();

})();


// === TV Remote Minimal Controls ===
window.addEventListener("keydown", (ev) => {
    switch(ev.key) {
        case "ArrowRight":
        case "Right":
            window.__sliderNext && window.__sliderNext();
            break;
        case "ArrowLeft":
        case "Left":
            window.__sliderPrev && window.__sliderPrev();
            break;
        case "ArrowUp":
        case "Up":
            window.__toggleDebug && window.__toggleDebug();
            break;
        case "ArrowDown":
        case "Down":
            window.__toggleCaptions && window.__toggleCaptions();
            break;
        case "Enter":
        case "OK":
            window.__toggleAutoplay && window.__toggleAutoplay();
            break;
    }
});
