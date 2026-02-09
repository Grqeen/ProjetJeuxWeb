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

    // Restructuration du menu pour la nouvelle DA (Texte gauche, Image droite)
    let menuTextContainer = document.createElement("div");
    menuTextContainer.id = "menuTextContainer";
    
    // On déplace les éléments existants du menu dans le conteneur de texte
    while (menu.firstChild) {
        menuTextContainer.appendChild(menu.firstChild);
    }
    menu.appendChild(menuTextContainer);

    // Ajout de l'image (blob) sur la droite
    let blobImage = document.createElement("img");
    let gifSource = "assets/images/blobMenu.gif";
    blobImage.src = gifSource;
    blobImage.id = "blobMenuImage";
    menu.appendChild(blobImage);

    // Génération de la version statique (pause)
    let staticSource = "";
    let tempImg = new Image();
    tempImg.src = gifSource;
    tempImg.onload = () => {
        let c = document.createElement("canvas");
        c.width = tempImg.width;
        c.height = tempImg.height;
        c.getContext("2d").drawImage(tempImg, 0, 0);
        staticSource = c.toDataURL();
        blobImage.src = staticSource; // On met en pause par défaut
    };

    blobImage.onmouseenter = () => {
        blobImage.src = gifSource;
    };
    blobImage.onmouseleave = () => {
        if (staticSource) blobImage.src = staticSource;
    };

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

    // Création de l'arrière-plan du menu
    let menuBackground = document.createElement("div");
    menuBackground.id = "menuBackground";
    document.body.appendChild(menuBackground);

    // Création du message de victoire
    let winMessage = document.createElement("div");
    winMessage.id = "winMessage";
    winMessage.innerHTML = "BIEN JOUÉ !<br>VOUS AVEZ FINI !";
    winMessage.style.display = "none";
    document.body.appendChild(winMessage);

    function resizeCanvas() {
        // 1. On fixe une taille INTERNE constante (Pratique "Pro")
        // Tes coordonnées dans levels.js ne bougeront plus jamais !
        canvas.width = 1400; 
        canvas.height = 1000;

        let sidebarWidth = 450;
        // On calcule l'espace disponible
        let availableWidth = window.innerWidth - (sidebar.style.display !== "none" ? sidebarWidth : 0);
        
        // 2. On utilise le CSS pour "étirer" ou "réduire" l'image sans couper le jeu
        canvas.style.width = availableWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        
        // Garde les proportions (évite d'écraser le dessin)
        canvas.style.objectFit = "contain"; 
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
        menuBackground.style.display = "block";
        winMessage.style.display = "block";
        resizeCanvas();
    };

    startBtn.onclick = () => {
        winMessage.style.display = "none"; // On cache le message si on relance
        menu.style.display = "none";
        menuBackground.style.display = "none";
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
        menuBackground.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(1);
    };
    document.querySelector("#btnLevel2").onclick = () => {
        levelsMenu.style.display = "none";
        winMessage.style.display = "none";
        menuBackground.style.display = "none";
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
