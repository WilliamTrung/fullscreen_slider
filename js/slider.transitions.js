// slider.transitions.js
// GSAP + Pixi.js cinematic transitions (full version with advanced effects)

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

  // Shared displacement map (for glass / liquid-ripple / water-wave)
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
      gsap.set(to, { alpha: 0 });
      gsap.set(to.scale, { x: 0.0, y: to.scale.y });

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
    // BOOK-OPEN (simple two-page spread feel)
    // --------------------------------------------
    "book-open": function (app, from, to, done) {
      gsap.set(to, { alpha: 0 });
      gsap.set(to.scale, { x: 0, y: to.scale.y });

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

    // ------------------------------------------------------------
    // 3D BOOK OPEN (Mesh page bend)
    // ------------------------------------------------------------
    "book-3d": function (app, from, to, done) {
      const w = app.renderer.width;
      const h = app.renderer.height;

      const segX = 20, segY = 4;
      const geometry = new PIXI.MeshGeometry();
      const vertices = [];
      const uvs = [];
      const indices = [];

      for (let iy = 0; iy <= segY; iy++) {
        for (let ix = 0; ix <= segX; ix++) {
          const x = (ix / segX) * w - w / 2;
          const y = (iy / segY) * h - h / 2;
          vertices.push(x, y);
          uvs.push(ix / segX, iy / segY);
        }
      }

      for (let iy = 0; iy < segY; iy++) {
        for (let ix = 0; ix < segX; ix++) {
          const a = iy * (segX + 1) + ix;
          const b = a + 1;
          const c = a + (segX + 1);
          const d = c + 1;
          indices.push(a, b, c, b, d, c);
        }
      }

      geometry.addAttribute('aVertexPosition', vertices)
              .addAttribute('aTextureCoord', uvs)
              .addIndex(indices);

      const mesh = new PIXI.Mesh(
        geometry,
        new PIXI.MeshMaterial(from.texture, { alpha: 1 })
      );
      mesh.position.set(w / 2, h / 2);

      app.stage.addChild(mesh);
      app.stage.removeChild(from);

      gsap.set(to, { alpha: 0, x: w / 2, y: h / 2 });
      app.stage.addChild(to);

      const vertData = mesh.geometry.getBuffer('aVertexPosition').data;

      gsap.to(
        { t: 0 },
        {
          t: 1,
          duration: 1.5,
          ease: "power3.inOut",
          onUpdate: function (self) {
            const progress = self.targets()[0].t;
            const angle = progress * Math.PI * 0.9;

            for (let iy = 0; iy <= segY; iy++) {
              for (let ix = 0; ix <= segX; ix++) {
                const id = (iy * (segX + 1) + ix) * 2;
                const ox = vertices[id];
                const oy = vertices[id + 1];

                const bend = Math.sin((ix / segX) * Math.PI) * progress * 120;

                vertData[id] = ox * Math.cos(angle) - bend;
                vertData[id + 1] = oy;
              }
            }
            mesh.geometry.getBuffer('aVertexPosition').update();
          },
          onComplete: () => {
            gsap.to(to, {
              alpha: 1,
              duration: 0.4,
              ease: "power2.out",
              onComplete: () => {
                mesh.destroy({ children: true, texture: false, baseTexture: false });
                done();
              }
            });
          }
        }
      );
    },

    // ------------------------------------------------------------
    // 3D BOOK CLOSE (reverse of 3D open)
    // ------------------------------------------------------------
    "book-3d-close": function (app, from, to, done) {
      const w = app.renderer.width;
      const h = app.renderer.height;

      const segX = 20, segY = 4;
      const geometry = new PIXI.MeshGeometry();
      const vertices = [];
      const uvs = [];
      const indices = [];

      for (let iy = 0; iy <= segY; iy++) {
        for (let ix = 0; ix <= segX; ix++) {
          const x = (ix / segX) * w - w / 2;
          const y = (iy / segY) * h - h / 2;
          vertices.push(x, y);
          uvs.push(ix / segX, iy / segY);
        }
      }

      for (let iy = 0; iy < segY; iy++) {
        for (let ix = 0; ix < segX; ix++) {
          const a = iy * (segX + 1) + ix;
          const b = a + 1;
          const c = a + (segX + 1);
          const d = c + 1;
          indices.push(a, b, c, b, d, c);
        }
      }

      geometry.addAttribute('aVertexPosition', vertices)
              .addAttribute('aTextureCoord', uvs)
              .addIndex(indices);

      const mesh = new PIXI.Mesh(
        geometry,
        new PIXI.MeshMaterial(to.texture, { alpha: 1 })
      );
      mesh.position.set(w / 2, h / 2);

      app.stage.addChild(mesh);
      app.stage.removeChild(to);

      gsap.set(from, { alpha: 1, x: w / 2, y: h / 2 });
      app.stage.addChild(from);

      const vertData = mesh.geometry.getBuffer('aVertexPosition').data;

      gsap.to(
        { t: 0 },
        {
          t: 1,
          duration: 1.5,
          ease: "power3.inOut",
          onUpdate: function (self) {
            const progress = self.targets()[0].t;
            const angle = (1 - progress) * Math.PI * 0.9;

            for (let iy = 0; iy <= segY; iy++) {
              for (let ix = 0; ix <= segX; ix++) {
                const id = (iy * (segX + 1) + ix) * 2;
                const ox = vertices[id];
                const oy = vertices[id + 1];

                const bend = Math.sin((ix / segX) * Math.PI) * (1 - progress) * 120;

                vertData[id] = ox * Math.cos(angle) - bend;
                vertData[id + 1] = oy;
              }
            }
            mesh.geometry.getBuffer('aVertexPosition').update();
          },
          onComplete: () => {
            gsap.to(from, {
              alpha: 0,
              duration: 0.4,
              ease: "power2.in",
              onComplete: () => {
                app.stage.removeChild(from);
                app.stage.removeChild(mesh);
                mesh.destroy({ children: true, texture: false, baseTexture: false });
                done();
              }
            });
          }
        }
      );
    },

    // --------------------------------------------
    // GLASS-WARP (displacement "glass" effect)
    // --------------------------------------------
    "glass-warp": function (app, from, to, done) {
      const dp = ensureDisplacement(app);
      if (!dp) {
        fade(app, from, to, done);
        return;
      }

      const { sprite, filter } = dp;
      const previousFilters = to.filters ? to.filters.slice() : null;
      to.filters = previousFilters ? previousFilters.concat([filter]) : [filter];

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
    },

    // --------------------------------------------
    // WATER WAVE SHADER-LIKE (using displacement)
    // --------------------------------------------
    "water-wave": function (app, from, to, done) {
      const dp = ensureDisplacement(app);
      if (!dp) {
        fade(app, from, to, done);
        return;
      }

      const { sprite, filter } = dp;
      const previousFilters = to.filters ? to.filters.slice() : null;
      to.filters = previousFilters ? previousFilters.concat([filter]) : [filter];

      gsap.set(to, {
        alpha: 0,
        scale: to.scale.x * 1.02
      });

      gsap.set(filter.scale, { x: 0, y: 80 });

      gsap.to(filter.scale, {
        x: 80,
        y: 0,
        duration: 1.6,
        ease: "sine.inOut"
      });

      gsap.to(sprite, {
        x: sprite.x + 200,
        duration: 1.6,
        ease: "sine.inOut"
      });

      gsap.to(to, {
        alpha: 1,
        duration: 1.4,
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
    // FILM-BURN (Cinematic light leak fade)
    // --------------------------------------------
    "film-burn": function (app, from, to, done) {
      const w = app.renderer.width;
      const h = app.renderer.height;

      const burn = new PIXI.Graphics();
      burn.beginFill(0xffdd88);
      burn.drawRect(0, 0, w, h);
      burn.endFill();
      burn.alpha = 0;
      app.stage.addChild(burn);

      gsap.set(to, { alpha: 0 });
      app.stage.addChild(to);

      const tl = gsap.timeline({
        onComplete: () => {
          app.stage.removeChild(from);
          app.stage.removeChild(burn);
          burn.destroy();
          done();
        }
      });

      tl.to(burn, {
        alpha: 1,
        duration: 0.25,
        ease: "power4.in"
      })
        .to(burn, {
          alpha: 0.7,
          duration: 0.15,
          ease: "power3.out"
        })
        .to(to, {
          alpha: 1,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.3")
        .to(burn, {
          alpha: 0,
          duration: 0.6,
          ease: "power2.out"
        });
    },

    // --------------------------------------------
    // FOG DISSOLVE (atmospheric fade)
    // --------------------------------------------
    "fog-dissolve": function (app, from, to, done) {
      const w = app.renderer.width;
      const h = app.renderer.height;

      const fog = new PIXI.Graphics();
      const color = 0xaaaaaa;
      const alpha = 0.0;
      fog.beginFill(color, alpha);
      fog.drawRect(0, 0, w, h);
      fog.endFill();
      app.stage.addChild(fog);

      gsap.set(to, { alpha: 0 });
      app.stage.addChild(to);

      const tl = gsap.timeline({
        onComplete: () => {
          app.stage.removeChild(from);
          app.stage.removeChild(fog);
          fog.destroy();
          done();
        }
      });

      tl.to(fog, {
        alpha: 0.9,
        duration: 1.0,
        ease: "sine.inOut"
      })
        .to(from, {
          alpha: 0,
          duration: 0.7,
          ease: "power2.in"
        }, "-=0.6")
        .to(to, {
          alpha: 1,
          duration: 1.0,
          ease: "power2.out"
        }, "-=0.3")
        .to(fog, {
          alpha: 0,
          duration: 0.8,
          ease: "power2.out"
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
