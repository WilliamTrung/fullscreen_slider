// slider.transitions.js
// GSAP + Pixi-based transition effects

window.SliderTransitions = (function () {
  'use strict';

  if (!window.gsap) {
    console.warn('GSAP not found. Transitions will not animate.');
  }

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
    gsap.to(to, { alpha: 1, duration: 1.2, ease: 'power2.out' });
    gsap.to(from, {
      alpha: 0,
      duration: 1.2,
      ease: 'power2.in',
      onComplete: () => {
        app.stage.removeChild(from);
        done();
      }
    });
  }

  const transitions = {
    'fade': fade,
    'fade-in': fade,

    'slide-left': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }
      gsap.set(to, {
        alpha: 1,
        x: app.renderer.width * 1.3
      });
      gsap.to(to, {
        x: app.renderer.width / 2,
        duration: 1.2,
        ease: 'power3.out'
      });
      gsap.to(from, {
        x: -app.renderer.width * 0.5,
        alpha: 0,
        duration: 1.2,
        ease: 'power3.in',
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    'slide-right': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }
      gsap.set(to, {
        alpha: 1,
        x: -app.renderer.width * 0.3
      });
      gsap.to(to, {
        x: app.renderer.width / 2,
        duration: 1.2,
        ease: 'power3.out'
      });
      gsap.to(from, {
        x: app.renderer.width * 1.3,
        alpha: 0,
        duration: 1.2,
        ease: 'power3.in',
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    'liquid': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }
      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 1.25,
        skewX: -0.6,
        x: app.renderer.width / 2 + 40
      });

      gsap.set(from, {
        skewX: 0,
        x: app.renderer.width / 2
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        skewX: 0,
        x: app.renderer.width / 2,
        duration: 1.8,
        ease: 'expo.out'
      });

      gsap.to(from, {
        alpha: 0,
        skewX: 0.6,
        x: app.renderer.width / 2 - 120,
        duration: 1.4,
        ease: 'power3.in',
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    'glitch': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }

      gsap.set(to, { alpha: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });

      tl.to(from, {
        x: '+=35',
        duration: 0.04,
        repeat: 6,
        yoyo: true,
        ease: 'none'
      })
        .to(from, {
          x: '-=25',
          duration: 0.05,
          ease: 'power2.inOut'
        })
        .to(from, { alpha: 0, duration: 0.15 })
        .to(to, {
          alpha: 1,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.1');
    },

    'warp': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }

      gsap.set(to, { alpha: 0, scale: to.scale.x * 0.8 });

      gsap.to(from, {
        scale: from.scale.x * 1.3,
        alpha: 0,
        duration: 1.4,
        ease: 'expo.in'
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.4,
        ease: 'expo.out',
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    'ripple': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }
      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.05 });
      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.6,
        ease: 'sine.out'
      });
      gsap.to(from, {
        alpha: 0,
        duration: 1.0,
        ease: 'sine.in',
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    },

    'pixelate': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }

      const blur = new PIXI.filters.BlurFilter(0);
      to.filters = [blur];

      gsap.set(to, { alpha: 0, scale: to.scale.x * 1.2 });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.4,
        ease: 'power2.out'
      });

      gsap.to(blur, {
        blur: 0,
        from: 12,
        duration: 1.4,
        ease: 'power2.out'
      });

      gsap.to(from, {
        alpha: 0,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          app.stage.removeChild(from);
          to.filters = null;
          done();
        }
      });
    },

    'morph': function (app, from, to, done) {
      if (!window.gsap) {
        to.alpha = 1;
        from.alpha = 0;
        app.stage.removeChild(from);
        done();
        return;
      }

      gsap.set(to, { alpha: 0, scale: to.scale.x * 0.8 });

      gsap.to(from, {
        alpha: 0,
        scale: from.scale.x * 1.2,
        duration: 1.2,
        ease: 'power3.in'
      });

      gsap.to(to, {
        alpha: 1,
        scale: to.scale.x,
        duration: 1.3,
        ease: 'power3.out',
        onComplete: () => {
          app.stage.removeChild(from);
          done();
        }
      });
    }
  };

  function run(effectName, app, from, to, done) {
    const fn = transitions[effectName] || fade;
    fn(app, from, to, done);
  }

  return {
    run
  };
})();
