const themeButton = document.getElementById("themeButton");
const surpriseButton = document.getElementById("surpriseButton");

const colors = [
    "#bd8cff",
    "#64d8f2",
    "#ff8fbd",
    "#a5e887",
    "#ffbf69"
];

let currentColor = 0;

themeButton.addEventListener("click", () => {
    currentColor = (currentColor + 1) % colors.length;

    document.documentElement.style.setProperty(
        "--accent",
        colors[currentColor]
    );
});

const surprises = [
    "The internet needs more weird ideas.",
    "Your next idea might be your best one.",
    "Curiosity is a feature, not a bug.",
    "What if we made something impossible?",
    "Keep experimenting. Break the ordinary."
];

surpriseButton.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * surprises.length);

    const intro = document.querySelector(".intro");

    intro.textContent = surprises[randomIndex];

    intro.animate(
        [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" }
        ],
        {
            duration: 350,
            easing: "ease-out"
        }
    );
});

(() => {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mouse = {
    x: -1000,
    y: -1000,
    radius: 130
  };

  let width = 0;
  let height = 0;
  let particles = [];
  let animationId;

  const particleCount = 65;
  const connectionDistance = 125;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles = Array.from(
      { length: particleCount },
      () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.8 + 0.7
      })
    );

    drawParticles();
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    const color = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--accent").trim() || "#bd8cff";

    // Move particles and react to the mouse
    particles.forEach((p) => {
      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distance = Math.hypot(dx, dy);

        if (distance < mouse.radius && distance > 0) {
          const force = (mouse.radius - distance) / mouse.radius;

          p.x += (dx / distance) * force * 1.5;
          p.y += (dy / distance) * force * 1.5;
        }
      }

      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
    });

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];

        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);

          ctx.strokeStyle = color;
          ctx.globalAlpha = (1 - distance / connectionDistance) * 0.25;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // Draw glowing points
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      ctx.globalAlpha = 0.75;
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  function animate() {
    drawParticles();
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  window.addEventListener("blur", () => {
    cancelAnimationFrame(animationId);
  });

  window.addEventListener("focus", () => {
    if (!reduceMotion) animate();
  });

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();

  if (!reduceMotion) animate();
})();
