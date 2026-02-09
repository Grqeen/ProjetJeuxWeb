import Game from "./Game.js";

// Bonne pratique : avoir une fonction appelée une fois
// que la page est prête, que le DOM est chargé, etc.
window.onload = init;

async function init() {
    // Force le scroll en haut au chargement (fix pour le bug de rafraîchissement)
    window.scrollTo(0, 0);

    let canvas = document.querySelector("#myCanvas");
    let menu = document.querySelector("#gameMenu");
    let startBtn = document.querySelector("#startButton");
    let exitBtn = document.querySelector("#exitButton");
    let levelsBtn = document.querySelector("#LevelsButton");
    let sidebar = document.querySelector("#sidebar");
    let restartBtn = document.querySelector("#restartBtn");

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
        <button id="btnLevel3">Niveau 3</button>
        <button id="btnBack">Retour</button>
    `;
    document.body.appendChild(levelsMenu);

    // Création de l'arrière-plan du menu
    let menuBackground = document.createElement("div");
    menuBackground.id = "menuBackground";
    document.body.appendChild(menuBackground);

    // Création du menu de victoire
    let winMenu = document.createElement("div");
    winMenu.id = "winMenu";
    winMenu.style.display = "none";
    winMenu.innerHTML = `
        <h1>BRAVO !</h1>
        <button id="btnWinRestart">Rejouer</button>
        <button id="btnWinHome">Menu Principal</button>
    `;
    document.body.appendChild(winMenu);

    // --- CONFIGURATION VIDÉO ---
    let videoContainer = document.createElement("div");
    Object.assign(videoContainer.style, {
        display: "none",
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        zIndex: "2000",
        alignItems: "center",
        justifyContent: "center"
    });
    
    let videoPlayer = document.createElement("video");
    videoPlayer.src = "assets/video/Blob_Escape_Lore.mp4"; 
    videoPlayer.style.width = "100%";
    videoPlayer.style.height = "100%";
    videoPlayer.style.objectFit = "cover";
    
    // Création du bouton SKIP
    let skipButton = document.createElement("button");
    skipButton.innerText = "SKIP >>";
    Object.assign(skipButton.style, {
        position: "absolute",
        bottom: "30px",
        right: "30px",
        zIndex: "2001",
        fontSize: "40px",
        fontFamily: "'Lilita One', cursive",
        color: "white",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        textShadow: "3px 3px 0 #000",
        transition: "all 0.3s ease"
    });

    // Effets de survol (identiques au menu)
    skipButton.onmouseenter = () => {
        skipButton.style.transform = "scale(1.1) rotate(-3deg)";
        skipButton.style.color = "#ffcc00";
        skipButton.style.textShadow = "3px 3px 0 #b8860b";
    };
    skipButton.onmouseleave = () => {
        skipButton.style.transform = "scale(1) rotate(0deg)";
        skipButton.style.color = "white";
        skipButton.style.textShadow = "3px 3px 0 #000";
    };

    videoContainer.appendChild(videoPlayer);
    videoContainer.appendChild(skipButton);
    document.body.appendChild(videoContainer);

    function playVideo(callback) {
        menu.style.display = "none";
        menuBackground.style.display = "none";
        levelsMenu.style.display = "none";
        winMenu.style.display = "none";
        if (sidebar) sidebar.style.display = "none";

        videoContainer.style.display = "flex";
        videoPlayer.currentTime = 0;
        videoPlayer.play().catch(e => console.log("Erreur lecture vidéo", e));

        const endVideo = () => {
            videoPlayer.pause();
            videoContainer.style.display = "none";
            // Nettoyage des événements
            videoPlayer.onended = null;
            videoPlayer.onclick = null;
            skipButton.onclick = null;
            if (callback) callback();
        };

        videoPlayer.onended = endVideo;
        
        // Clic pour passer la vidéo (Bouton ou Vidéo)
        videoPlayer.onclick = endVideo;
        skipButton.onclick = (e) => {
            e.stopPropagation();
            endVideo();
        };
    }

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
        menu.style.display = "none";
        sidebar.style.display = "none";
        menuBackground.style.display = "block";
        winMenu.style.display = "block";
        resizeCanvas();
    };

    startBtn.onclick = () => {
        winMenu.style.display = "none"; // On cache le menu si on relance
        playVideo(() => {
            if (sidebar) sidebar.style.display = "block";
            resizeCanvas();
            game.start(1); // Lance le niveau 1 par défaut
        });
    };

    // Gestion du bouton Histoire (anciennement Exit)
    exitBtn.onclick = () => {
        playVideo(() => {
            menu.style.display = "flex";
            menuBackground.style.display = "block";
            resizeCanvas();
        });
    };

    // Gestion du bouton Levels
    levelsBtn.onclick = () => {
        menu.style.display = "none";
        levelsMenu.style.display = "block";
        resizeCanvas();
    };

    // Gestion des boutons du menu Niveaux
    document.querySelector("#btnLevel1").onclick = () => {
        winMenu.style.display = "none";
        levelsMenu.style.display = "none";
        menuBackground.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(1);
    };
    document.querySelector("#btnLevel2").onclick = () => {
        levelsMenu.style.display = "none";
        winMenu.style.display = "none";
        menuBackground.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(2);
    };
    document.querySelector("#btnLevel3").onclick = () => {
        levelsMenu.style.display = "none";
        winMenu.style.display = "none";
        menuBackground.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(3);
    };
    document.querySelector("#btnBack").onclick = () => {
        levelsMenu.style.display = "none";
        menu.style.display = "flex";
        resizeCanvas();
    };

    // Gestion des boutons du menu de victoire
    document.querySelector("#btnWinRestart").onclick = () => {
        winMenu.style.display = "none";
        menuBackground.style.display = "none";
        if (sidebar) sidebar.style.display = "block";
        resizeCanvas();
        game.start(1);
    };
    document.querySelector("#btnWinHome").onclick = () => {
        winMenu.style.display = "none";
        menu.style.display = "flex";
        resizeCanvas();
    };

    // Gestion du bouton Recommencer (Sidebar)
    restartBtn.onclick = () => {
        restartBtn.blur(); // Enlève le focus pour ne pas gêner les contrôles clavier
        game.start(game.currentLevel);
    };
}
