(async function () {

    /********************************************
     * CONFIG LOADING
     ********************************************/
    const config = await fetch("config.json").then(r => r.json());

    const slider = document.getElementById("slider");
    const audio = document.getElementById("bgm");


    /********************************************
     * IMAGE AUTO-DETECTION (jpg/png/webp/jpeg/gif)
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
     * PERFECT SHUFFLE (Fisher-Yates)
     ********************************************/
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }


    /********************************************
     * LOAD ALL IMAGES
     ********************************************/
    let imageList = await detectImages();

    if (config.images?.shuffle !== false) {
        shuffle(imageList); // shuffle on startup
    }

    // Create slide elements
    imageList.forEach(src => {
        let div = document.createElement("div");
        div.className = "slide";
        div.innerHTML = `<img src="${src}">`;
        slider.appendChild(div);
    });

    const slides = document.querySelectorAll(".slide");

    let index = 0;
    slides[0].style.opacity = 1;


    /********************************************
     * MUSIC ENGINE (LOCAL + REMOTE MIXED)
     ********************************************/
    async function loadLocalMusicFiles() {
        const local = [];

        // detect local files named 1.mp3, 2.mp3, ...
        for (let i = 1; i <= 500; i++) {
            const path = `music/${i}.mp3`;

            const exists = await fetch(path)
                .then(r => r.ok)
                .catch(() => false);

            if (exists) local.push(path);
        }
        return local;
    }

    async function startMusic() {
        if (!config.music) return;

        const remote = config.music.remoteSources ?? [];
        const local = await loadLocalMusicFiles();

        // FULL MUSIC POOL
        let playlist = [...local, ...remote];

        if (playlist.length === 0) return;

        if (config.music.shuffle) {
            shuffle(playlist);
        }

        let musicIndex = 0;

        function playNext() {
            audio.src = playlist[musicIndex];
            audio.volume = config.music.volume ?? 0.7;

            audio.play().catch(err => console.log("Music autoplay blocked"));

            musicIndex = (musicIndex + 1) % playlist.length;
        }

        audio.addEventListener("ended", playNext);

        playNext();
    }

    startMusic();



    /********************************************
     * ALL TRANSITIONS (including new ones)
     ********************************************/
    const allTransitions = [
        "fade-in",
        "slide-left",
        "slide-right",
        "push-left",
        "push-right",
        "zoom-in",
        "zoom-out",
        "wipe-left",
        "wipe-right",
        "split-horizontal",
        "split-vertical",
        "flip-horizontal",
        "flip-vertical",
        "cube-rotate",
        "curtain-open",

        // NEW REQUESTED TRANSITIONS
        "checkerboard",
        "random-stripes",
        "page-turn",
        "book-open",
        "water-ripple",
        "glass-distort",
        "ken-burns"
    ];


    /********************************************
     * NEXT SLIDE FUNCTION (SHUFFLE EVERY LOOP)
     ********************************************/
    function nextSlide() {
        let current = slides[index];
        current.style.opacity = 0;

        index++;

        // If we reached the end → shuffle again and reset
        if (index >= slides.length) {
            shuffle(imageList);
            shuffleSlidesToMatchNewOrder();
            index = 0;
        }

        let next = slides[index];

        next.className = "slide";

        // Random transition
        let effect = allTransitions[Math.floor(Math.random() * allTransitions.length)];
        next.classList.add(effect);

        next.style.opacity = 1;
    }


    /********************************************
     * REORDER slides DOM to match reshuffled list
     ********************************************/
    function shuffleSlidesToMatchNewOrder() {
        slider.innerHTML = "";
        imageList.forEach(src => {
            let div = document.createElement("div");
            div.className = "slide";
            div.innerHTML = `<img src="${src}">`;
            slider.appendChild(div);
        });
        // Refresh NodeList
        slides = document.querySelectorAll(".slide");
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
