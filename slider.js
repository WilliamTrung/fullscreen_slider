(async function () {

    /********************************************
     * LOAD CONFIG + CAPTIONS
     ********************************************/
    const config = await fetch("config.json").then(r => r.json());
    const captions = await fetch("captions.json")
        .then(r => r.json())
        .catch(() => ({})); // no captions.json = empty object

    const slider = document.getElementById("slider");
    const audio = document.getElementById("bgm");

    const captionTitle = document.getElementById("caption-title");
    const captionDesc  = document.getElementById("caption-description");
    const captionMeta  = document.getElementById("caption-meta");
    const debugOverlay = document.getElementById("debug-overlay");


    /********************************************
     * AUTO-DETECT IMAGES BY INDEX (ANY EXT)
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
                    images.push({
                        index: i,
                        filename: filename,
                        src: path
                    });
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
     * LOAD IMAGES
     ********************************************/
    let imageList = await detectImageSequence();
    imageList.sort((a, b) => a.index - b.index);

    if (config.images?.shuffle !== false)
        shuffle(imageList);

    function buildSlides() {
        slider.innerHTML = "";
        imageList.forEach(img => {
            let div = document.createElement("div");
            div.className = "slide";
            div.innerHTML = `<img src="${img.src}">`;
            slider.appendChild(div);
        });
    }

    buildSlides();
    let slides = document.querySelectorAll(".slide");
    let index = 0;
    slides[0].style.opacity = 1;



    /********************************************
     * MUSIC ENGINE
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
            audio.play().catch(() => {});
            mIndex = (mIndex + 1) % playlist.length;
        }

        audio.addEventListener("ended", playNext);
        playNext();
    }

    startMusic();



    /********************************************
     * TRANSITIONS (from config)
     ********************************************/
    const allTransitions = config.transitions ?? [];


    /********************************************
     * APPLY CAPTION TO CURRENT IMAGE
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
        captionMeta.textContent =
            [cap.author, cap.date].filter(x => x).join(" • ");
    }


    /********************************************
     * UPDATE DEBUG OVERLAY
     ********************************************/
    function updateDebug(img, effect) {
        if (!config.debug?.enabled) {
            debugOverlay.style.display = "none";
            return;
        }

        debugOverlay.style.display = "block";
        debugOverlay.textContent =
            `Index: ${img.index}\n` +
            `File: ${img.filename}\n` +
            `Transition: ${effect}`;
    }



    /********************************************
     * REBUILD SLIDES AFTER SHUFFLE
     ********************************************/
    function rebuildSlides() {
        buildSlides();
        slides = document.querySelectorAll(".slide");
    }



    /********************************************
     * NEXT SLIDE
     ********************************************/
    function nextSlide() {
        let current = slides[index];
        current.style.opacity = 0;

        index++;

        if (index >= slides.length) {
            shuffle(imageList);
            rebuildSlides();
            index = 0;
        }

        let next = slides[index];
        next.className = "slide";

        let effect;
        if (config.randomTransitions !== false) {
            effect = allTransitions[Math.floor(Math.random() * allTransitions.length)];
        } else {
            effect = allTransitions[0];
        }

        next.classList.add(effect);
        next.style.opacity = 1;

        // apply caption + debug info
        updateCaption(imageList[index]);
        updateDebug(imageList[index], effect);
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
                index = (index - 2 + slides.length) % slides.length;
                nextSlide();
            }

            if (e.key === " ") {
                e.preventDefault();
                audio.paused ? audio.play() : audio.pause();
            }
        });
    }

})();
