
(() => {
    "use strict";

    // ==========================================
    // 1. ELEMENTS
    // ==========================================
    const canvas = document.getElementById("particleCanvas");
    const themeButton = document.getElementById("themeButton");
    const surpriseButton = document.getElementById("surpriseButton");
    const toast = document.getElementById("toast");

    // Stop safely if the canvas is missing.
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // ==========================================
    // 2. PARTICLE SETTINGS
    // ==========================================
    const mouse = {
        x: -1000,
        y: -1000,
        radius: 130
    };

    let width = 0;
    let height = 0;
    let particles = [];
    let pulses = [];
    let animationId = null;
    let toastTimer = null;

let particleCount = 65;
let connectionDistance = 125;
let movementSpeed = 1;

const pulseSettings = {
  speed: 5,
  force: 4,
  color: "#ffffff"
};

    // ==========================================
    // 3. CREATE PARTICLES
    // ==========================================
    function createParticle() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.65,
            vy: (Math.random() - 0.5) * 0.65,
            radius: Math.random() * 1.7 + 0.8
        };
    }

    function resizeCanvas() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        particles = Array.from(
            { length: particleCount },
            createParticle
        );

        drawParticles();
    }

    // ==========================================
    // 4. READ THE CURRENT THEME COLOR
    // ==========================================
    function getAccentColor() {
        return (
            getComputedStyle(document.documentElement)
                .getPropertyValue("--accent")
                .trim() || "#bd8cff"
        );
    }

    // ==========================================
    // 5. DRAW PARTICLES AND CONNECTIONS
    // ==========================================
    function drawParticles() {
        ctx.clearRect(0, 0, width, height);

        const accentColor = getAccentColor();

        // Move particles and react to the mouse.
        for (const p of particles) {
            if (!reduceMotion) {
               p.x += p.vx * movementSpeed;
               p.y += p.vy * movementSpeed;
            }

            // Bounce off the screen edges.
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            p.x = Math.max(0, Math.min(width, p.x));
            p.y = Math.max(0, Math.min(height, p.y));

            // Push particles gently away from the mouse.
            if (!reduceMotion) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const distance = Math.hypot(dx, dy);

                if (distance < mouse.radius && distance > 0) {
                    const strength = (mouse.radius - distance) / mouse.radius;

                    p.x += (dx / distance) * strength * 2;
                    p.y += (dy / distance) * strength * 2;
                }
            }
        }

        // Connect particles that are close together.
        ctx.lineWidth = 0.7;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i];
                const b = particles[j];

                const distance = Math.hypot(
                    a.x - b.x,
                    a.y - b.y
                );

                if (distance < connectionDistance) {
                    const opacity = 1 - distance / connectionDistance;

                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = accentColor;
                    ctx.globalAlpha = opacity * 0.38;
                    ctx.stroke();
                }
            }
        }

        ctx.globalAlpha = 1;

        // Draw expanding rings created by clicks.
        for (const pulse of pulses) {
            const progress = Math.min(
                pulse.radius / Math.hypot(width, height),
                1
            );

            ctx.beginPath();
            ctx.arc(
                pulse.x,
                pulse.y,
                pulse.radius,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = pulseSettings.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = Math.max(0, 1 - progress);
            ctx.shadowBlur = 14;
            ctx.shadowColor = pulseSettings.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;

        // Draw glowing particles.
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.85;
            ctx.shadowBlur = 8;
            ctx.shadowColor = accentColor;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
    }

    // ==========================================
    // 6. UPDATE CLICK PULSES
    // ==========================================
    function updatePulses() {
        if (reduceMotion) return;

        for (const pulse of pulses) {
            pulse.radius += pulseSettings.speed;

            for (let i = 0; i < particles.length; i++) {
                // Each particle reacts only once to each pulse.
                if (pulse.hitParticles.has(i)) continue;

                const p = particles[i];
                const dx = p.x - pulse.x;
                const dy = p.y - pulse.y;
                const distance = Math.hypot(dx, dy);

                if (
                    distance > 0 &&
                    Math.abs(distance - pulse.radius) < pulseSettings.speed
                ) {
                    p.vx += (dx / distance) * pulseSettings.force * 0.08;
                    p.vy += (dy / distance) * pulseSettings.force * 0.08;

                    // Prevent particles from accelerating too much.
                    p.vx = Math.max(-2.5, Math.min(2.5, p.vx));
                    p.vy = Math.max(-2.5, Math.min(2.5, p.vy));

                    pulse.hitParticles.add(i);
                }
            }
        }

        // Remove pulses that have expanded beyond the screen.
        const maxRadius = Math.hypot(width, height);

        pulses = pulses.filter(
            (pulse) => pulse.radius < maxRadius
        );
    }

    // ==========================================
    // 7. ANIMATION LOOP
    // ==========================================
    function animate() {
        updatePulses();
        drawParticles();
        animationId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (reduceMotion || animationId !== null) return;
        animationId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // ==========================================
    // 8. CLICK TO CREATE A PULSE
    // ==========================================
    window.addEventListener("click", (event) => {
        // Don't create a pulse when using buttons, links or controls.
        if (
            event.target.closest(
                "button, a, input, textarea, select, label"
            )
        ) {
            return;
        }

        pulses.push({
            x: event.clientX,
            y: event.clientY,
            radius: 0,
            hitParticles: new Set()
        });

        // With reduced motion enabled, show a static ring.
        if (reduceMotion) {
            drawParticles();
        }
    });

    // ==========================================
    // 9. MOUSE INTERACTION
    // ==========================================
    window.addEventListener("pointermove", (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    window.addEventListener("blur", () => {
        mouse.x = -1000;
        mouse.y = -1000;
        stopAnimation();
    });

    window.addEventListener("focus", () => {
        startAnimation();
    });

    window.addEventListener("resize", resizeCanvas);

    // ==========================================
    // 10. CHANGE THE SITE'S ACCENT COLOR
    // ==========================================
    const themeColors = [
        "#bd8cff",
        "#ff8fc9",
        "#79cfff",
        "#8ef5b1",
        "#ffb86b"
    ];

    let currentTheme = 0;

    if (themeButton) {
        themeButton.addEventListener("click", () => {
            currentTheme = (currentTheme + 1) % themeColors.length;

            document.documentElement.style.setProperty(
                "--accent",
                themeColors[currentTheme]
            );

            drawParticles();
        });
    }

    // ==========================================
    // 11. SURPRISE MESSAGE
    // ==========================================
    const surpriseMessages = [
        "✨ You're someone's favorite plot twist.",
        "🌌 Somewhere, a star is doing its own thing. Just like you.",
        "🌀 Plot twist: you're allowed to start over.",
        "💜 Weird is just wonderful without permission.",
        "⚡ Your next idea might be your best one yet.",
        "👾 Error 404: ordinary vibes not found.",
        "🌱 Tiny progress is still progress. Keep going."
    ];

    if (surpriseButton && toast) {
        surpriseButton.addEventListener("click", () => {
            const message =
                surpriseMessages[
                    Math.floor(Math.random() * surpriseMessages.length)
                    ];

            toast.textContent = message;
            toast.classList.add("show");

            if (toastTimer !== null) {
                clearTimeout(toastTimer);
            }

            toastTimer = setTimeout(() => {
                toast.classList.remove("show");
                toastTimer = null;
            }, 3200);
        });
    }

    // ==========================================
    // 12. START EVERYTHING
    // ==========================================
    // LIVE LAB CONTROLS
const controlsToggle = document.getElementById("controlsToggle");
const controlPanel = document.getElementById("controlPanel");

const densityControl = document.getElementById("densityControl");
const speedControl = document.getElementById("speedControl");
const linksControl = document.getElementById("linksControl");
const pulseControl = document.getElementById("pulseControl");
const accentControl = document.getElementById("accentControl");
const resetControls = document.getElementById("resetControls");

const densityValue = document.getElementById("densityValue");
const speedValue = document.getElementById("speedValue");
const linksValue = document.getElementById("linksValue");
const pulseValue = document.getElementById("pulseValue");

if (controlsToggle && controlPanel) {
  controlsToggle.addEventListener("click", () => {
    const willOpen = controlPanel.hidden;
    controlPanel.hidden = !willOpen;
    controlsToggle.setAttribute("aria-expanded", String(willOpen));

    if (willOpen) {
      controlPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  });
}

function syncControlValues() {
  if (densityValue) {
    densityValue.textContent = particleCount;
  }

  if (speedValue) {
    speedValue.textContent = movementSpeed.toFixed(1) + "×";
  }

  if (linksValue) {
    linksValue.textContent = connectionDistance + " px";
  }

  if (pulseValue) {
    pulseValue.textContent = pulseSettings.force;
  }
}

if (densityControl) {
  densityControl.addEventListener("input", () => {
    particleCount = Number(densityControl.value);

    while (particles.length < particleCount) {
      particles.push(createParticle());
    }

    particles.length = particleCount;

    syncControlValues();
    drawParticles();
  });
}

if (speedControl) {
  speedControl.addEventListener("input", () => {
    movementSpeed = Number(speedControl.value);
    syncControlValues();
  });
}

if (linksControl) {
  linksControl.addEventListener("input", () => {
    connectionDistance = Number(linksControl.value);
    syncControlValues();
    drawParticles();
  });
}

if (pulseControl) {
  pulseControl.addEventListener("input", () => {
    pulseSettings.force = Number(pulseControl.value);
    syncControlValues();
  });
}

if (accentControl) {
  accentControl.addEventListener("change", () => {
    const color = accentControl.value;

    document.documentElement.style.setProperty("--accent", color);
    drawParticles();
  });
}

if (resetControls) {
  resetControls.addEventListener("click", () => {
    particleCount = 65;
    movementSpeed = 1;
    connectionDistance = 125;
    pulseSettings.force = 4;

    if (densityControl) densityControl.value = "65";
    if (speedControl) speedControl.value = "1";
    if (linksControl) linksControl.value = "125";
    if (pulseControl) pulseControl.value = "4";

    if (accentControl) {
      accentControl.value = "#bd8cff";
      document.documentElement.style.setProperty(
        "--accent",
        "#bd8cff"
      );
    }

    while (particles.length < particleCount) {
      particles.push(createParticle());
    }

    particles.length = particleCount;
    syncControlValues();
    drawParticles();
  });
}

syncControlValues();
    resizeCanvas();
    startAnimation();
})();
