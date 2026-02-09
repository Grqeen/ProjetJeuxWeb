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
    
    // --- RECONSTRUCTION DE LA SIDEBAR (Déplacé au début pour l'init du jeu) ---
    if (sidebar) {
        sidebar.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="font-family: 'Lilita One', cursive; color: #333; font-size: 30px;">Contrôles</h2>
            </div>
            <button id="restartBtn">Recommencer</button>
            
            <div class="keyboard-grid">
                <div class="key-up"><kbd>↑</kbd></div>
                <div class="key-left"><kbd>←</kbd></div>
                <div class="key-down"><kbd>↓</kbd></div>
                <div class="key-right"><kbd>→</kbd></div>
            </div>

            <div id="timerContainer">
                <div class="timer-label">TEMPS</div>
                <div id="timerValue">00:00</div>
            </div>

            <div id="leaderboardContainer">
                <h3>Temps par niveau</h3>
                <table id="leaderboardTable">
                    <thead>
                        <tr><th>Niveau</th><th>Temps</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
    }
    let restartBtn = document.querySelector("#restartBtn");

    // --- INITIALISATION DU JEU ET DÉTECTION DES NIVEAUX ---
    let game = new Game(canvas);
    game.levelElement = document.querySelector("#level");
    game.timerElement = document.querySelector("#timerValue");
    await game.init();

    // Détection automatique du nombre de niveaux
    let maxLevels = 0;
    while (true) {
        game.levels.load(maxLevels + 1);
        if (game.objetsGraphiques.length === 0) break;
        maxLevels++;
    }
    game.objetsGraphiques = []; // Reset après détection
    console.log("Niveaux détectés : " + maxLevels);

    // Renommage du bouton Histoire en Story
    if (exitBtn) exitBtn.innerText = "Story";

    // --- GESTION DES MEILLEURS SCORES ---
    let bestTimes = {}; // Stocke les meilleurs temps : { 1: 12.5, 2: 10.0 }

    function updateLeaderboards() {
        // Fonction pour générer le HTML des lignes du tableau
        const generateRows = () => {
            let html = "";
            let total = 0;
            let count = 0;
            for (let level = 1; level <= maxLevels; level++) {
                let time = bestTimes[level];
                if (time) {
                    total += time;
                    count++;
                    html += `<tr><td>${level}</td><td>${time.toFixed(2)}s</td></tr>`;
                } else {
                    html += `<tr><td>${level}</td><td>-</td></tr>`;
                }
            }
            // Ajout de la ligne TOTAL
            let totalDisplay = (count === maxLevels && maxLevels > 0) ? total.toFixed(2) + "s" : "-";
            html += `<tr style="border-top: 2px solid #ffcc00; font-weight: bold;"><td>TOTAL</td><td>${totalDisplay}</td></tr>`;
            return html;
        };

        // 1. Mise à jour du leaderboard de la Sidebar
        let sidebarTable = document.querySelector("#leaderboardTable tbody");
        if (sidebarTable) sidebarTable.innerHTML = generateRows();

        // 2. Mise à jour du leaderboard du Menu Principal
        let menuTable = document.querySelector("#menuLeaderboardTable tbody");
        if (menuTable) menuTable.innerHTML = generateRows();
    }
    // ------------------------------------

    // Restructuration du menu pour la nouvelle DA (Texte gauche, Image droite)
    let menuTextContainer = document.createElement("div");
    menuTextContainer.id = "menuTextContainer";
    
    // On déplace les éléments existants du menu dans le conteneur de texte
    while (menu.firstChild) {
        menuTextContainer.appendChild(menu.firstChild);
    }
    menu.appendChild(menuTextContainer);

    // Création du bouton LeaderBoard
    let leaderboardBtn = document.createElement("button");
    leaderboardBtn.id = "leaderboardButton";
    leaderboardBtn.innerText = "LeaderBoard";
    // On l'insère avant le bouton Exit (qui est le dernier enfant pour l'instant)
    menuTextContainer.insertBefore(leaderboardBtn, exitBtn);

    // Création de l'écran LeaderBoard (caché par défaut)
    let leaderboardMenu = document.createElement("div");
    leaderboardMenu.id = "leaderboardMenu";
    leaderboardMenu.style.display = "none";
    leaderboardMenu.innerHTML = `
        <h1>Meilleurs Temps</h1>
        <div id="leaderboardListContainer">
            <table id="menuLeaderboardTable">
                <thead><tr><th>Niveau</th><th>Temps</th></tr></thead>
                <tbody></tbody>
            </table>
        </div>
        <button id="btnLeaderboardBack">Retour</button>
    `;
    document.body.appendChild(leaderboardMenu);

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

    // Création dynamique du menu des niveaux (Basé sur maxLevels)
    let levelsMenu = document.createElement("div");
    levelsMenu.id = "levelsMenu";
    levelsMenu.style.display = "none";
    let levelsHtml = `<h1>Niveaux</h1>`;
    for (let i = 1; i <= maxLevels; i++) {
        levelsHtml += `<button class="btnLevel" data-level="${i}">Niveau ${i}</button>`;
    }
    levelsHtml += `<button id="btnBack">Retour</button>`;
    levelsMenu.innerHTML = levelsHtml;
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
        leaderboardMenu.style.display = "none";
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

    // Initialisation de l'affichage du leaderboard (pour afficher les niveaux vides au début)
    updateLeaderboards();

    // Configuration du callback pour les scores
    game.onLevelComplete = (level, time) => {
        // Si pas de temps enregistré ou si le nouveau temps est meilleur (plus petit)
        if (!bestTimes[level] || time < bestTimes[level]) {
            bestTimes[level] = time;
            updateLeaderboards();
        }
    };

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

    // Gestion du bouton Story (anciennement Exit/Histoire)
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

    // Gestion du bouton LeaderBoard
    leaderboardBtn.onclick = () => {
        menu.style.display = "none";
        leaderboardMenu.style.display = "block";
        resizeCanvas();
    };

    // Gestion du bouton Retour du LeaderBoard
    document.querySelector("#btnLeaderboardBack").onclick = () => {
        leaderboardMenu.style.display = "none";
        menu.style.display = "flex";
        resizeCanvas();
    };

    // Gestion des boutons du menu Niveaux (Dynamique)
    document.querySelectorAll(".btnLevel").forEach(btn => {
        btn.onclick = () => {
            let level = parseInt(btn.dataset.level);
            levelsMenu.style.display = "none";
            winMenu.style.display = "none";
            menuBackground.style.display = "none";
            if (sidebar) sidebar.style.display = "block";
            resizeCanvas();
            game.start(level);
        };
    });

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
