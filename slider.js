(async function () {

    /********************************************
     * LOAD CONFIG
     ********************************************/
    const config = await fetch("config.json").then(r => r.json());

    const slider = document.getElementById("slider");
    const audio = document.getElementById("bgm");


    /********************************************
     * AUTO-DETECT IMAGES (ALL FORMATS)
     ********************************************/
    async function detectImages() {
        const formats = ["jpg", "jpeg", "png", "webp", "gif"];
        const list = [];

        for (let i = 1; i <= 2000; i++) {
            let found = false;

            for (let ext of formats) {
                const path = `images/${i}.${ext}`;

                const exists = await fetch(path)
                    .then(r => r.ok)
                    .catch(() => false);

                if (exists) {
                    list.push(path);
                    found = true;
                    break;
                }
            }

            if (!found) break;
        }
        return list;
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
     * LOAD IMAGES + SHUFFLE AT STARTUP
     ********************************************/
    let imageList = await detectImages();

    if (config.images?.shuffle !== false) {
        shuffle(imageList);
    }

    // Build slide elements
    imageList.forEach(src => {
        let div = document.createElement("div");
        div.className = "slide";
        div.innerHTML = `<img src="${src}">`;
        slider.appendChild(div);
    });

    let slides = document.querySelectorAll(".slide");
    let index = 0;
    slides[0].style.opacity = 1;



    /********************************************
     * 🎵 MUSIC ENGINE (LOCAL + REMOTE via sources[])
     ********************************************/
    async function startMusic() {
        if (!config.music || !Array.isArray(config.music.sources)) return;

        let playlist = [];

        // Validate all music URLs or local files
        for (let src of config.music.sources) {
            const exists = await fetch(src)
                .then(r => r.ok)
                .catch(() => false);

            if (exists) {
                playlist.push(src);
            } else {
                console.warn("Music not found:", src);
            }
        }

        if (playlist.length === 0) {
            console.warn("No valid music sources!");
            return;
        }

        // Shuffle playlist
        if (config.music.shuffle) {
            shuffle(playlist);
        }

        let mIndex = 0;

        function playNext() {
            audio.src = playlist[mIndex];
            audio.volume = config.music.volume ?? 0.7;
            audio.play().catch(err => console.warn("Music autoplay blocked:", err));
            mIndex = (mIndex + 1) % playlist.length;
        }

        audio.addEventListener("ended", playNext);
        playNext(); // start now
    }

    startMusic();



    /********************************************
     * TRANSITIONS FROM CONFIG
     ********************************************/
    const allTransitions = config.transitions ?? [];



    /********************************************
     * SLIDESHOW ENGINE (SHUFFLE EACH LOOP)
     ********************************************/
    function rebuildSlides() {
        slider.innerHTML = "";
        imageList.forEach(src => {
            let d = document.createElement("div");
            d.className = "slide";
            d.innerHTML = `<img src="${src}">`;
            slider.appendChild(d);
        });
        slides = document.querySelectorAll(".slide");
    }

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
        });
    }

})();
