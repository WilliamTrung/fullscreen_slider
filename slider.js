(async function() {

    const config = await fetch("config.json").then(r => r.json());

    const slider = document.getElementById("slider");

    // Load images automatically
    const images = [];
    for (let i = 1; i < 500; i++) {
        const path = `images/${i}.jpg`;
        const exists = await fetch(path).then(r => r.ok).catch(() => false);
        if (!exists) break;
        images.push(path);
    }

    // SHUFFLE BY INDEX
    if (config.images?.shuffle) {
        images.sort(() => Math.random() - 0.5);
    }
    images.forEach(src => {
        const div = document.createElement("div");
        div.className = "slide";
        div.innerHTML = `<img src="${src}">`;
        slider.appendChild(div);
    });

    const slides = document.querySelectorAll(".slide");
    let index = 0;
    slides[0].style.opacity = 1;

    const transitions = config.transitions;

    /* --------------------------
       MUSIC ENGINE
       -------------------------- */
    const audio = document.getElementById("bgm");

    async function startMusic() {
        if (!config.music) return;

        const playlist = config.music.sources;

        if (!playlist || playlist.length === 0) return;

        let order = [...playlist];

        if (config.music.shuffle) {
            order.sort(() => Math.random() - 0.5);
        }

        let idx = 0;

        function playNext() {
            audio.src = order[idx];
            audio.volume = config.music.volume ?? 0.7;

            audio.play().catch(e => console.warn("Autoplay blocked:", e));

            idx = (idx + 1) % order.length;
        }

        audio.addEventListener("ended", playNext);

        playNext();
    }

    startMusic();

    /* --------------------------
       SLIDESHOW ENGINE
       -------------------------- */
    function nextSlide() {
        let current = slides[index];
        current.style.opacity = 0;

        index = (index + 1) % slides.length;
        let next = slides[index];

        next.className = "slide";

        let effect = config.randomTransitions
            ? transitions[Math.floor(Math.random() * transitions.length)]
            : transitions[0];

        next.classList.add(effect);
        next.style.opacity = 1;
    }

    if (config.autoplay) {
        setInterval(nextSlide, config.delay);
    }

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
