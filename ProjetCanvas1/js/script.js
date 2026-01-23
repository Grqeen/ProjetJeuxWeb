import Game from "./Game.js";

// Bonne pratique : avoir une fonction appelée une fois
// que la page est prête, que le DOM est chargé, etc.
window.onload = init;

async function init() {
    let canvas = document.querySelector("#myCanvas");
    let menu = document.querySelector("#gameMenu");
    let startBtn = document.querySelector("#startButton");
    let exitBtn = document.querySelector("#exitButton");
    let levelsBtn = document.querySelector("#LevelsButton");

    function resizeCanvas() {
        let sidebarWidth = 450;
        let sidebarWidthStartMenu = 0;
        if (menu.style.display !== "none") {
            canvas.width = window.innerWidth - sidebarWidthStartMenu;
        } else {
            canvas.width = window.innerWidth - sidebarWidth;
        }
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let game = new Game(canvas);
    await game.init();

    startBtn.onclick = () => {
        menu.style.display = "none";
        resizeCanvas();
        game.start();
    };

    // Gestion du bouton Exit
    exitBtn.onclick = () => {
        if (confirm("Voulez-vous vraiment quitter ?")) {
            window.close();
            window.location.href = "about:blank";
        }
    };

    // Gestion du bouton Levels
    levelsBtn.onclick = () => {
        alert("La sélection des niveaux n'est pas encore implémentée.");
    };
}
