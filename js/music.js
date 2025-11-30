// music.js — LG webOS Safe Edition (NO fetch)

(function () {
    'use strict';

    const audio = document.getElementById("bgm");
    const titleEl = document.getElementById("music-title");
    const discEl  = document.getElementById("music-disc");

    if (!audio) return;

    // 🔧 HARD-CODE YOUR MUSIC FILES HERE
    // Make sure these paths match your TV's file structure!
    const config = {
        music: {
            sources: [
                "./music/all_of_me.mp3",
                "./music/enchanted.mp3",
                "./music/love_story.mp3",
                "./music/you_belong_with_me.mp3"
            ],
            shuffle: true,
            volume: 1
        }
    };

    // Local shuffle (webOS-safe)
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        return arr;
    }

    // Extract display name from file
    function readableName(src) {
        if (!src) return "";
        const name = src.split("/").pop();
        return name.replace(/\.[^/.]+$/, ""); // remove extension
    }

    let list = config.music.sources.slice();
    if (config.music.shuffle) list = shuffle(list);

    let index = 0;

    function playNext() {
        const src = list[index % list.length];
        index++;

        audio.src = src;
        audio.volume = config.music.volume || 1;

        if (titleEl) titleEl.textContent = readableName(src);
        if (discEl) discEl.style.animationPlayState = "running";

        audio.play().catch(() => {
            console.log("webOS blocked autoplay. User must click once.");
        });
    }

    audio.addEventListener("ended", playNext);

    audio.addEventListener("pause", () => {
        if (discEl) discEl.style.animationPlayState = "paused";
    });

    audio.addEventListener("play", () => {
        if (discEl) discEl.style.animationPlayState = "running";
    });

    // Initial play
    playNext();

})();
