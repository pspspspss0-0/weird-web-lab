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