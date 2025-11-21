// slider.transitions.js - mid-level effects only (no heavy shaders)

window.SliderTransitions = (function () {
  'use strict';

  if (!window.gsap) {
    console.warn('GSAP not found, transitions will not animate.');
  }

  // Simple helpers
  function safeAddBlur(target) {
    try {
      if (window.PIXI && PIXI.filters && PIXI.filters.BlurFilter) {
        const blur = new PIXI.filters.BlurFilter(0);
        target.filters = [blur];
        return blur;
      }
    } catch (e) {
      console.warn('BlurFilter not available:', e);
    }
    return null;
  }

  function clearFilters(target) {
    if (!target) return;
    try { target.filters = null; } catch (e) {}
  }

  // --- Basic effects ---

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
      duration: 1.0,
      ease: 'power2.out'
    });

    gsap.to(from, {
      alpha: 0,
      duration: 1.0,
      ease: 'power2.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  // Crossfade = a little faster fade
  function crossfade(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }

    gsap.set(to, { alpha: 0 });

    gsap.to(to, {
      alpha: 1,
      duration: 0.9,
      ease: 'power2.out'
    });

    gsap.to(from, {
      alpha: 0,
      duration: 0.9,
      ease: 'power2.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  function slideLeft(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }
    const w = app.renderer.width;

    gsap.set(to, { x: w + w * 0.3, alpha: 1 });

    gsap.to(to, {
      x: w / 2,
      duration: 1.0,
      ease: 'power3.out'
    });

    gsap.to(from, {
      x: -w * 0.4,
      alpha: 0,
      duration: 1.0,
      ease: 'power3.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  function slideRight(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }
    const w = app.renderer.width;

    gsap.set(to, { x: -w * 0.3, alpha: 1 });

    gsap.to(to, {
      x: w / 2,
      duration: 1.0,
      ease: 'power3.out'
    });

    gsap.to(from, {
      x: w + w * 0.4,
      alpha: 0,
      duration: 1.0,
      ease: 'power3.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  // --- Zoom / Ken Burns style ---

  // Gentle zoom-in on next, zoom-out on previous
  function zoomIn(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }

    const baseScaleTo = to.scale.x;
    const baseScaleFrom = from.scale.x;

    gsap.set(to, {
      alpha: 0,
      scale: baseScaleTo * 1.05
    });

    gsap.to(to, {
      alpha: 1,
      scale: baseScaleTo,
      duration: 1.4,
      ease: 'power2.out'
    });

    gsap.to(from, {
      alpha: 0,
      scale: baseScaleFrom * 0.98,
      duration: 1.2,
      ease: 'power2.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  function zoomOut(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }

    const baseScaleTo = to.scale.x;
    const baseScaleFrom = from.scale.x;

    gsap.set(to, {
      alpha: 0,
      scale: baseScaleTo * 0.95
    });

    gsap.to(to, {
      alpha: 1,
      scale: baseScaleTo * 1.02,
      duration: 1.4,
      ease: 'power2.out'
    });

    gsap.to(from, {
      alpha: 0,
      scale: baseScaleFrom * 1.05,
      duration: 1.2,
      ease: 'power2.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  // Ken Burns: subtle pan + zoom while crossfading
  function kenBurns(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }

    const w = app.renderer.width;
    const h = app.renderer.height;

    const baseScaleTo = to.scale.x;
    const baseScaleFrom = from.scale.x;

    // start next slide slightly zoomed and off-center
    gsap.set(to, {
      alpha: 0,
      scale: baseScaleTo * 1.05,
      x: w / 2 - w * 0.03,
      y: h / 2 + h * 0.03
    });

    const tl = gsap.timeline({
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });

    tl.to(to, {
      alpha: 1,
      duration: 1.0,
      ease: 'power2.out'
    }, 0);

    tl.to(to, {
      scale: baseScaleTo * 1.08,
      x: w / 2 + w * 0.02,
      y: h / 2 - h * 0.02,
      duration: 3.0,
      ease: 'sine.inOut'
    }, 0);

    tl.to(from, {
      alpha: 0,
      scale: baseScaleFrom * 1.02,
      x: w / 2 - w * 0.02,
      y: h / 2 + h * 0.02,
      duration: 1.5,
      ease: 'power2.in'
    }, 0);
  }

  // --- Rotate ---

  function rotate(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }

    gsap.set(to, {
      alpha: 0,
      rotation: -0.08
    });

    gsap.to(to, {
      alpha: 1,
      rotation: 0,
      duration: 1.2,
      ease: 'power3.out'
    });

    gsap.to(from, {
      alpha: 0,
      rotation: 0.1,
      duration: 1.0,
      ease: 'power3.in',
      onComplete: () => {
        from.rotation = 0;
        app.stage.removeChild(from);
        done();
      }
    });
  }

  // --- Blur + fade (medium effect, still light) ---

  function blurFade(app, from, to, done) {
    if (!window.gsap) {
      fade(app, from, to, done);
      return;
    }

    const blurTo = safeAddBlur(to);

    gsap.set(to, { alpha: 0 });

    if (blurTo) {
      blurTo.blur = 8;
      gsap.to(blurTo, {
        blur: 0,
        duration: 1.2,
        ease: 'power2.out'
      });
    }

    gsap.to(to, {
      alpha: 1,
      duration: 1.2,
      ease: 'power2.out'
    });

    gsap.to(from, {
      alpha: 0,
      duration: 0.9,
      ease: 'power2.in',
      onComplete: () => {
        clearFilters(to);
        app.stage.removeChild(from);
        done();
      }
    });
  }

  const transitions = {
    'fade': fade,
    'crossfade': crossfade,
    'slide-left': slideLeft,
    'slide-right': slideRight,
    'zoom-in': zoomIn,
    'zoom-out': zoomOut,
    'kenburns': kenBurns,
    'rotate': rotate,
    'blur-fade': blurFade
  };

  function run(name, app, from, to, done) {
    const fn = transitions[name] || fade;
    fn(app, from, to, done);
  }

  return {
    run
  };
})();
