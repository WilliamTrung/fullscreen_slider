// music.js
(function () {
  'use strict';

  const audioEl = document.getElementById('bgm');
  const titleEl = document.getElementById('music-title');
  const discEl  = document.getElementById('music-disc');

  // Local shuffle
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Extract readable music name
  function getMusicName(src) {
    if (!src) return "";
    const parts = src.split('/').pop().split('.');
    parts.pop(); // remove extension
    return decodeURIComponent(parts.join('.'));
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

      // Update “music title”
      titleEl.textContent = getMusicName(src);

      // Disc spinning always ON (pause if music paused)
      discEl.style.animationPlayState = "running";

      if (typeof config.music.volume === 'number') {
        audioEl.volume = Math.min(1, Math.max(0, config.music.volume));
      }

      audioEl.play()
        .catch(() => {});
    }

    // Auto play next
    audioEl.addEventListener('ended', playNextTrack);

    // If user pauses → stop spinning
    audioEl.addEventListener('pause', () => {
      discEl.style.animationPlayState = "paused";
    });

    audioEl.addEventListener('play', () => {
      discEl.style.animationPlayState = "running";
    });

    // First track
    playNextTrack();

    // Toggle from outside
    window.__toggleMusic = function () {
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
      } else {
        audioEl.pause();
      }
    };
  });

})();
