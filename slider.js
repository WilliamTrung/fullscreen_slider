(async function () {

  /********************************************
   * LOAD CONFIG + CAPTIONS
   ********************************************/
  const config = await fetch("config.json").then(r => r.json());
  const captions = await fetch("captions.json")
    .then(r => r.json())
    .catch(() => ({})); // if missing, just no captions

  const sliderEl = document.getElementById("slider");
  const audio = document.getElementById("bgm");

  const captionTitle = document.getElementById("caption-title");
  const captionDesc = document.getElementById("caption-description");
  const captionMeta = document.getElementById("caption-meta");
  const debugOverlay = document.getElementById("debug-overlay");

  /********************************************
   * PIXI APP INIT
   ********************************************/
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x000000
  });

  sliderEl.innerHTML = "";
  sliderEl.appendChild(app.view);

  /********************************************
   * IMAGE DETECTION BY INDEX (ANY EXT)
   ********************************************/
  async function detectImageSequence() {
    const extensions = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"];
    const images = [];

    for (let i = 1; i <= 2000; i++) {
      let found = false;

      for (let ext of extensions) {
        const filename = `${i}.${ext}`;
        const path = `images/${filename}`;

        const exists = await fetch(path)
          .then(r => r.ok)
          .catch(() => false);

        if (exists) {
          images.push({ index: i, filename, src: path });
          found = true;
          break;
        }
      }

      if (!found) break;
    }

    return images;
  }

  /********************************************
   * PERFECT SHUFFLE
   ********************************************/
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /********************************************
   * LOAD IMAGES INTO LIST
   ********************************************/
  let imageList = await detectImageSequence();

  if (imageList.length === 0) {
    console.warn("No images found in /images/");
    return;
  }

  imageList.sort((a, b) => a.index - b.index);

  if (config.images?.shuffle !== false) {
    shuffle(imageList);
  }

  let currentIdx = 0;
  let currentSprite = null;
  let isAnimating = false;

  /********************************************
   * SPRITE CREATION & FIT
   ********************************************/
  function createSpriteFor(img) {
    const sprite = PIXI.Sprite.from(img.src);
    sprite.anchor.set(0.5);

    fitSpriteToScreen(sprite);

    sprite.x = app.renderer.width / 2;
    sprite.y = app.renderer.height / 2;
    sprite.alpha = 0;

    return sprite;
  }

  function fitSpriteToScreen(sprite) {
    if (!sprite.texture.valid) {
      sprite.texture.baseTexture.on("loaded", () => {
        fitSpriteToScreen(sprite);
      });
      return;
    }

    const tex = sprite.texture;
    const imgW = tex.width;
    const imgH = tex.height;
    const screenW = app.renderer.width;
    const screenH = app.renderer.height;

    const scale = Math.max(screenW / imgW, screenH / imgH);
    sprite.scale.set(scale);
  }

  window.addEventListener("resize", () => {
    if (currentSprite) {
      fitSpriteToScreen(currentSprite);
      currentSprite.x = app.renderer.width / 2;
      currentSprite.y = app.renderer.height / 2;
    }
  });

  /********************************************
   * CAPTIONS & DEBUG
   ********************************************/
  function updateCaption(img) {
    const cap = captions[img.index];

    if (!cap) {
      captionTitle.textContent = "";
      captionDesc.textContent = "";
      captionMeta.textContent = "";
      return;
    }

    captionTitle.textContent = cap.title ?? "";
    captionDesc.textContent = cap.description ?? "";
    captionMeta.textContent = [cap.author, cap.date].filter(Boolean).join(" • ");
  }

  function updateDebug(img, effectName) {
    if (!config.debug?.enabled) {
      debugOverlay.style.display = "none";
      return;
    }

    debugOverlay.style.display = "block";
    debugOverlay.textContent =
      `Index: ${img.index}\n` +
      `File: ${img.filename}\n` +
      `Effect: ${effectName}`;
  }

  /********************************************
   * MUSIC ENGINE (LOCAL + URL via music.sources)
   ********************************************/
  async function startMusic() {
    if (!config.music || !Array.isArray(config.music.sources)) return;

    let playlist = [];

    for (let src of config.music.sources) {
      const ok = await fetch(src).then(r => r.ok).catch(() => false);
      if (ok) playlist.push(src);
      else console.warn("Music not found:", src);
    }

    if (playlist.length === 0) return;

    if (config.music.shuffle) shuffle(playlist);

    let mIndex = 0;

    function playNext() {
      audio.src = playlist[mIndex];
      audio.volume = config.music.volume ?? 0.7;
      audio.play().catch(err => console.warn("Music autoplay blocked:", err));
      mIndex = (mIndex + 1) % playlist.length;
    }

    audio.addEventListener("ended", playNext);
    playNext();
  }

  startMusic();

  /********************************************
   * GSAP-POWERED TRANSITIONS ON PIXI SPRITES
   ********************************************/
  const transitionNames = config.transitions ?? [];

  // Helper: generic fade + remove old
  function fadeTransition(from, to, done, duration = 1.5) {
    gsap.set(to, { alpha: 0 });
    gsap.to(to, { alpha: 1, duration, ease: "power2.out" });
    gsap.to(from, {
      alpha: 0,
      duration,
      ease: "power2.in",
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  const transitionMap = {
    "fade": fadeTransition,
    "fade-in": fadeTransition,

    "zoom-blur": (from, to, done) => {
      const blur = new PIXI.filters.BlurFilter(0);
      to.filters = [blur];

      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.15 });
      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.6,
        ease: "power3.out"
      });
      gsap.to(blur, {
        blur: 0,
        from: 20,
        duration: 1.6,
        ease: "power3.out"
      });

      gsap.to(from, {
        alpha: 0,
        duration: 1.2,
        ease: "power2.in",
        onComplete: () => {
          app.stage.removeChild(from);
          to.filters = null;
          done();
        }
      });
    },

    "slide-left": (from, to, done) => {
      gsap.set(to, {
        alpha: 1,
        x: app.renderer.width * 1.5
      });
      gsap.to(to, {
        x: app.renderer.width / 2,
        duration: 1.2,
        ease: "power3.out"
      });
      gsap.to(from, {
        x: -app.renderer.width * 0.5,
        alpha: 0,
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    "slide-right": (from, to, done) => {
      gsap.set(to, {
        alpha: 1,
        x: -app.renderer.width * 0.5
      });
      gsap.to(to, {
        x: app.renderer.width / 2,
        duration: 1.2,
        ease: "power3.out"
      });
      gsap.to(from, {
        x: app.renderer.width * 1.5,
        alpha: 0,
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    "glitch": (from, to, done) => {
      gsap.set(to, { alpha: 0, x: app.renderer.width / 2 });

      const tl = gsap.timeline({
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });

      tl.to(from, { x: "+=20", duration: 0.05, repeat: 4, yoyo: true, ease: "none" })
        .to(from, { alpha: 0, duration: 0.3, ease: "power2.in" }, "end")
        .to(to, { alpha: 1, duration: 0.5, ease: "power2.out" }, "end");
    },

    "warp": (from, to, done) => {
      gsap.set(to, { alpha: 0, scale: to.scale.x * 0.8 });

      gsap.to(from, {
        scale: from.scale.x * 1.3,
        alpha: 0,
        duration: 1.4,
        ease: "expo.in"
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.4,
        ease: "expo.out",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    "page-peel": (from, to, done) => {
      gsap.set(to, { alpha: 1, x: app.renderer.width / 2 });

      gsap.set(from, {
        pivotX: -app.renderer.width / 2,
        x: app.renderer.width / 2,
        y: app.renderer.height / 2
      });

      gsap.to(from, {
        rotation: -Math.PI / 2,
        alpha: 0,
        duration: 1.1,
        ease: "power2.in",
        onComplete: () => {
          app.stage.removeChild(from);
          from.rotation = 0;
          done();
        }
      });
    },

    "liquid": (from, to, done) => {
      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.1, skewX: -0.3 });

      gsap.to(to, {
        alpha: 1,
        skewX: 0,
        scale: to.scale.x,
        duration: 1.6,
        ease: "power3.out"
      });

      gsap.to(from, {
        alpha: 0,
        skewX: 0.4,
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    "ripple": (from, to, done) => {
      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.05 });
      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.6,
        ease: "sine.out"
      });
      gsap.to(from, {
        alpha: 0,
        duration: 1.0,
        ease: "sine.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    "pixelate": (from, to, done) => {
      const blur = new PIXI.filters.BlurFilter(0);
      to.filters = [blur];
      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.2 });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.4,
        ease: "power2.out"
      });
      gsap.to(blur, {
        blur: 0,
        from: 12,
        duration: 1.4,
        ease: "power2.out"
      });

      gsap.to(from, {
        alpha: 0,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
          app.stage.removeChild(from);
          to.filters = null;
          done();
        }
      });
    },

    "morph": (from, to, done) => {
      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 0.8
      });

      gsap.to(from, {
        alpha: 0,
        scale: from.scale.x * 1.2,
        duration: 1.2,
        ease: "power3.in"
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.3,
        ease: "power3.out",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    }
  };

  function pickTransitionName() {
    if (!transitionNames.length) return "fade";
    if (config.randomTransitions === false) return transitionNames[0];
    const idx = Math.floor(Math.random() * transitionNames.length);
    return transitionNames[idx];
  }

  /********************************************
   * INITIAL IMAGE
   ********************************************/
  function showFirstImage() {
    const img = imageList[currentIdx];
    currentSprite = createSpriteFor(img);
    currentSprite.alpha = 1;
    app.stage.addChild(currentSprite);

    updateCaption(img);
    updateDebug(img, "initial");
  }

  showFirstImage();

  /********************************************
   * NEXT SLIDE
   ********************************************/
  function nextSlide() {
    if (isAnimating || imageList.length === 0) return;

    const prevImg = imageList[currentIdx];
    const fromSprite = currentSprite;

    currentIdx++;

    if (currentIdx >= imageList.length) {
      shuffle(imageList);
      currentIdx = 0;
    }

    const nextImg = imageList[currentIdx];
    const toSprite = createSpriteFor(nextImg);
    app.stage.addChild(toSprite);

    const effectName = pickTransitionName();
    const effect = transitionMap[effectName] || fadeTransition;

    isAnimating = true;

    effect(fromSprite, toSprite, () => {
      currentSprite = toSprite;
      isAnimating = false;
      updateCaption(nextImg);
      updateDebug(nextImg, effectName);
    });
  }

  /********************************************
   * AUTOPLAY
   ********************************************/
  if (config.autoplay !== false) {
    setInterval(nextSlide, config.delay ?? 5000);
  }

  /********************************************
   * KEYBOARD CONTROLS
   ********************************************/
  if (config.keyboard?.enabled) {
    document.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") {
        currentIdx = (currentIdx - 2 + imageList.length) % imageList.length;
        nextSlide();
      }
      if (e.key === " ") {
        e.preventDefault();
        if (!audio.src) return;
        audio.paused ? audio.play() : audio.pause();
      }
    });
  }

})();
