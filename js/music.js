// music.js
// Dedicated music engine extracted from slider.core.js (no SliderUtils dependency)

(function () {
  'use strict';

  const audioEl = document.getElementById('bgm');

  // Local shuffle (independent)
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function loadConfig() {
    try {
      return await fetch('config.json').then(r => r.json());
    } catch (e) {
      console.error('Unable to load config.json for music engine');
      return null;
    }
  }

  loadConfig().then(config => {
    if (!config || !audioEl) return;
    if (!config.music || !Array.isArray(config.music.sources) || !config.music.sources.length) return;

    let musicSources = config.music.sources.slice();

    if (config.music.shuffle) {
      musicSources = shuffleArray(musicSources);
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
  });

})();
