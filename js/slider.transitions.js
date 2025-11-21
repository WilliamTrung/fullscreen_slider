// slider.transitions.js
// GSAP + Pixi.js cinematic transitions (stable + advanced version)

window.SliderTransitions = (function () {
  'use strict';

  if (!window.gsap) {
    console.warn("GSAP not loaded; transitions will be static.");
  }

  // --------------------------------------------------
  // Shared helpers
  // --------------------------------------------------

  // Base fade transition
  function fade(app, from, to, done) {
    if (!window.gsap) {
      to.alpha = 1;
      from.alpha = 0;
      app.stage.removeChild(from);
      done();
      return;
    }

    gsap.set(to, { alpha: 0 });

    gsap.to(to, {
      alpha: 1,
      duration: 1.2,
      ease: "power2.out"
    });

    gsap.to(from, {
      alpha: 0,
      duration: 1.2,
      ease: "power2.in",
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  // Shared displacement map (for glass / liquid ripple)
  let displacementSprite = null;
  let displacementFilter = null;

  function ensureDisplacement(app) {
    if (!window.PIXI || !PIXI.filters || !PIXI.filters.DisplacementFilter) {
      return null;
    }

    if (!displacementSprite) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // simple noise texture
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      const tex = PIXI.Texture.from(canvas);
      displacementSprite = new PIXI.Sprite(tex);
      displacementSprite.anchor.set(0.5);

      // repeat wrap so we can move it
      if (tex.baseTexture && PIXI.WRAP_MODES) {
        tex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
      }

      displacementSprite.x = app.renderer.width / 2;
      displacementSprite.y = app.renderer.height / 2;
      displacementSprite.scale.set(3);
      displacementSprite.alpha = 1;

      app.stage.addChild(displacementSprite);
      displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
    } else if (!displacementSprite.parent) {
      app.stage.addChild(displacementSprite);
    }

    return { sprite: displacementSprite, filter: displacementFilter };
  }

  // --------------------------------------------------
  // Transitions map
  // --------------------------------------------------
  const transitions = {

    // --------------------------------------------
    // FADE (base)
    // --------------------------------------------
    "fade": fade,
    "fade-in": fade,

    // --------------------------------------------
    // SLIDE LEFT
    // --------------------------------------------
    "slide-left": function (app, from, to, done) {
      gsap.set(to, {
        alpha: 1,
        x: app.renderer.width * 1.3
      });

      gsap.to(to, {
        x: app.renderer.width / 2,
        duration: 1.2,
        ease: "power3.out"
      });

      gsap.to(from, {
        x: -app.renderer.width * 0.6,
        alpha: 0,
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    // --------------------------------------------
    // SLIDE RIGHT
    // --------------------------------------------
    "slide-right": function (app, from, to, done) {
      gsap.set(to, {
        alpha: 1,
        x: -app.renderer.width * 0.6
      });

      gsap.to(to, {
        x: app.renderer.width / 2,
        duration: 1.2,
        ease: "power3.out"
      });

      gsap.to(from, {
        x: app.renderer.width * 1.3,
        alpha: 0,
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    // --------------------------------------------
    // LIQUID (strong, patched for Pixi v7)
    // --------------------------------------------
    "liquid": function (app, from, to, done) {
      to.skew.set(0, 0);
      from.skew.set(0, 0);

      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 1.25,
        x: app.renderer.width / 2 + 60
      });

      gsap.set(to.skew, { x: -0.6 });
      gsap.set(from.skew, { x: 0 });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        x: app.renderer.width / 2,
        duration: 1.8,
        ease: "expo.out"
      });

      gsap.to(to.skew, {
        x: 0,
        duration: 1.8,
        ease: "expo.out"
      });

      gsap.to(from, {
        alpha: 0,
        x: app.renderer.width / 2 - 120,
        duration: 1.3
      });

      gsap.to(from.skew, {
        x: 0.6,
        duration: 1.3,
        ease: "power3.in",
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    // --------------------------------------------
    // GLITCH (strong, safe)
    // --------------------------------------------
    "glitch": function (app, from, to, done) {
      gsap.set(to, { alpha: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });

      tl.to(from, {
        x: "+=50",
        duration: 0.03,
        repeat: 5,
        yoyo: true,
        ease: "none"
      })
        .to(from, {
          x: "-=30",
          duration: 0.04,
          ease: "none"
        })
        .to(from, {
          alpha: 0,
          duration: 0.1
        })
        .to(to, {
          alpha: 1,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.1");
    },

    // --------------------------------------------
    // WARP (zoom warp)
    // --------------------------------------------
    "warp": function (app, from, to, done) {
      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 0.8
      });

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

    // --------------------------------------------
    // RIPPLE (simple wave-style)
    // --------------------------------------------
    "ripple": function (app, from, to, done) {
      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 1.05
      });

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

    // --------------------------------------------
    // PIXELATE (blur-based fake)
    // --------------------------------------------
    "pixelate": function (app, from, to, done) {
      if (!PIXI.filters || !PIXI.filters.BlurFilter) {
        // fallback to simple fade if filter not available
        fade(app, from, to, done);
        return;
      }

      if (!to.filters) to.filters = [];

      const blur = new PIXI.filters.BlurFilter(0);
      to.filters = [blur];

      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 1.2
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.3,
        ease: "power2.out"
      });

      gsap.fromTo(
        blur,
        { blur: 20 },
        {
          blur: 0,
          duration: 1.3,
          ease: "power2.out"
        }
      );

      gsap.to(from, {
        alpha: 0,
        duration: 0.9,
        ease: "power2.in",
        onComplete: () => {
          app.stage.removeChild(from);
          to.filters = null;
          done();
        }
      });
    },

    // --------------------------------------------
    // MORPH
    // --------------------------------------------
    "morph": function (app, from, to, done) {
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
    },

    // --------------------------------------------
    // PAGE-FOLD (page turn–style)
    // --------------------------------------------
    "page-fold": function (app, from, to, done) {
      // Start new slide squashed horizontally
      gsap.set(to, { alpha: 0 });
      gsap.set(to.scale, { x: 0.0, y: to.scale.y });

      // From slide folds away
      gsap.to(from.scale, {
        x: 0,
        duration: 0.7,
        ease: "power2.in"
      });

      gsap.to(from, {
        alpha: 0,
        duration: 0.7,
        ease: "power2.in"
      });

      // Then new slide unfolds
      gsap.to(to.scale, {
        x: to.scale.x,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.3
      });

      gsap.to(to, {
        alpha: 1,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.3,
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    // --------------------------------------------
    // BOOK-OPEN (two-page spread feel)
    // --------------------------------------------
    "book-open": function (app, from, to, done) {
      // from: fold out left
      gsap.set(from.pivot, { x: 0, y: 0 }); // pivot at center via anchor
      gsap.to(from.scale, {
        x: 0,
        duration: 0.8,
        ease: "power2.in"
      });
      gsap.to(from, {
        alpha: 0,
        duration: 0.8,
        ease: "power2.in"
      });

      // to: unfold from center
      gsap.set(to, { alpha: 0 });
      gsap.set(to.scale, { x: 0, y: to.scale.y });

      gsap.to(to.scale, {
        x: to.scale.x,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.2
      });

      gsap.to(to, {
        alpha: 1,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.2,
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    // --------------------------------------------
    // GLASS-WARP (displacement "glass" effect)
    // --------------------------------------------
    "glass-warp": function (app, from, to, done) {
      const dp = ensureDisplacement(app);
      if (!dp) {
        // fallback if DisplacementFilter unavailable
        fade(app, from, to, done);
        return;
      }

      const { sprite, filter } = dp;
      const previousFilters = to.filters ? to.filters.slice() : null;
      to.filters = previousFilters ? previousFilters.concat([filter]) : [filter];

      // start subtle glass warp
      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.02 });
      gsap.set(filter.scale, { x: 80, y: 80 });

      gsap.to(sprite, {
        x: sprite.x + 120,
        y: sprite.y + 60,
        duration: 1.5,
        ease: "sine.inOut"
      });

      gsap.to(filter.scale, {
        x: 0,
        y: 0,
        duration: 1.5,
        ease: "power2.out"
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.3,
        ease: "power2.out"
      });

      gsap.to(from, {
        alpha: 0,
        duration: 1.0,
        ease: "power2.in",
        onComplete: () => {
          app.stage.removeChild(from);
          to.filters = previousFilters;
          done();
        }
      });
    },

    // --------------------------------------------
    // LIQUID-RIPPLE (displacement-based)
    // --------------------------------------------
    "liquid-ripple": function (app, from, to, done) {
      const dp = ensureDisplacement(app);
      if (!dp) {
        // fallback if DisplacementFilter unavailable
        fade(app, from, to, done);
        return;
      }

      const { sprite, filter } = dp;
      const previousFilters = to.filters ? to.filters.slice() : null;
      to.filters = previousFilters ? previousFilters.concat([filter]) : [filter];

      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 1.05
      });
      gsap.set(filter.scale, { x: 120, y: 120 });

      gsap.to(sprite, {
        x: sprite.x + 150,
        y: sprite.y + 80,
        duration: 1.8,
        ease: "sine.inOut"
      });

      gsap.to(filter.scale, {
        x: 0,
        y: 0,
        duration: 1.8,
        ease: "power3.out"
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.6,
        ease: "power3.out"
      });

      gsap.to(from, {
        alpha: 0,
        duration: 1.1,
        ease: "power2.in",
        onComplete: () => {
          app.stage.removeChild(from);
          to.filters = previousFilters;
          done();
        }
      });
    }

  }; // end transitions map

  // --------------------------------------------------
  // Public API
  // --------------------------------------------------
  function run(effectName, app, from, to, done) {
    const effect = transitions[effectName] || fade;
    effect(app, from, to, done);
  }

  return {
    run
  };
})();
