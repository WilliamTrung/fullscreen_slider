const bg = document.getElementById("bg-container");
const audio = document.getElementById("bgm");

// --- Audio setup ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);

// Resume audio on user interaction (browser requirement)
document.addEventListener("click", () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (audio.paused) audio.play();
});


// --- Music-reactive blur engine ---
function animate() {
    analyser.getByteFrequencyData(dataArray);

    // Focus on lower frequencies (bass → beats)
    const bassRange = dataArray.slice(0, 32);  // 0–32 bins = bass
    const bassAvg = bassRange.reduce((a, b) => a + b, 0) / bassRange.length;

    // Normalize (0 … 255 → 0 … 1)
    const level = bassAvg / 255;

    // Blur range: 0px (quiet) → 14px (strong beat)
    const blur = (level * 2).toFixed(1);

    // Brightness slightly increases on beat (optional)
    const brightness = 1 + level * 0.01;

    bg.style.filter = `blur(${blur}px) brightness(${brightness})`;

    requestAnimationFrame(animate);
}

animate();
