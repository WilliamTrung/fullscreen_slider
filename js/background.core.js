// background.core.js — LG webOS SAFE EDITION
(function () {
    'use strict';

    var bg = document.getElementById("bg-container");
    if (!bg) {
        console.log("No #bg-container element found.");
        return;
    }

    // Set the background image manually (webOS safe)
    // Make sure this path exists on USB or hosting!
    var imgPath = "./images/background/backgroundImages.jpg";

    // Preload image to avoid flicker
    var img = new Image();
    img.onload = function () {
        bg.style.backgroundImage = "url('" + imgPath + "')";
        bg.style.opacity = "1"; // fade in
    };
    img.onerror = function () {
        console.log("Could not load background image:", imgPath);
    };
    img.src = imgPath;

    // --- TV-safe gentle zoom animation ---
    // No filter(), no blur(), no WebAudio → 100% safe.
    var scale = 1;
    var growing = true;

    function animate() {
        // Soft zoom range (1.0 → 1.05)
        if (growing) {
            scale += 0.0005;
            if (scale >= 1.05) growing = false;
        } else {
            scale -= 0.0005;
            if (scale <= 1.0) growing = true;
        }

        bg.style.transform = "scale(" + scale.toFixed(3) + ")";

        requestAnimationFrame(animate);
    }

    // Start animation
    animate();

})();
