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
    let sidebar = document.querySelector("#sidebar");

    // Création dynamique du menu des niveaux
    let levelsMenu = document.createElement("div");
    levelsMenu.id = "levelsMenu";
    levelsMenu.style.display = "none";
    levelsMenu.innerHTML = `
        <h1>Niveaux</h1>
        <button id="btnLevel1">Niveau 1</button>
        <button id="btnLevel2">Niveau 2</button>
        <button id="btnBack">Retour</button>
    `;
    document.body.appendChild(levelsMenu);

    // Création du message de victoire
    let winMessage = document.createElement("div");
    winMessage.id = "winMessage";
    winMessage.innerHTML = "BIEN JOUÉ !<br>VOUS AVEZ FINI !";
    winMessage.style.display = "none";
    document.body.appendChild(winMessage);

    // --- RÉSOLUTION VIRTUELLE ---
    // On définit une taille interne fixe pour le jeu.
    // Tous les calculs de position (x, y) se feront dans cet espace de 1600x1000.
    const GAME_WIDTH = 1600;
    const GAME_HEIGHT = 1000;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    function resizeCanvas() {
        let sidebarWidth = 450;
        let sidebarWidthStartMenu = 0;
        let availableWidth;

        if (menu.style.display !== "none" || levelsMenu.style.display !== "none") {
            availableWidth = window.innerWidth - sidebarWidthStartMenu;
        } else {
            availableWidth = window.innerWidth - sidebarWidth;
        }
        
        let availableHeight = window.innerHeight;

        // On calcule le ratio pour que le canvas rentre dans l'écran sans déformation
        let scale = Math.min(availableWidth / GAME_WIDTH, availableHeight / GAME_HEIGHT);

        // On applique la taille d'affichage via CSS (zoom)
        canvas.style.width = `${GAME_WIDTH * scale}px`;
        canvas.style.height = `${GAME_HEIGHT * scale}px`;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let game = new Game(canvas);
    game.levelElement = document.querySelector("#level");
    await game.init();

    // Configuration du callback de fin de jeu
    game.onFinish = () => {
        menu.style.display = "block";
        sidebar.style.display = "none";
        winMessage.style.display = "block";
        resizeCanvas();
    };

    startBtn.onclick = () => {
        winMessage.style.display = "none"; // On cache le message si on relance
        menu.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(1); // Lance le niveau 1 par défaut
    };

    // Gestion du bouton Exit
    exitBtn.onclick = () => {
        alert("coming soon");
    };

    // Gestion du bouton Levels
    levelsBtn.onclick = () => {
        menu.style.display = "none";
        levelsMenu.style.display = "block";
        resizeCanvas();
    };

    // Gestion des boutons du menu Niveaux
    document.querySelector("#btnLevel1").onclick = () => {
        winMessage.style.display = "none";
        levelsMenu.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(1);
    };
    document.querySelector("#btnLevel2").onclick = () => {
        levelsMenu.style.display = "none";
        winMessage.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(2);
    };
    document.querySelector("#btnBack").onclick = () => {
        levelsMenu.style.display = "none";
        menu.style.display = "block";
        resizeCanvas();
    };
}
