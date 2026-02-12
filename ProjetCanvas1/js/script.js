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
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 20px;">
                <h2 style="font-family: 'Lilita One', cursive; color: #333; font-size: 30px;">Niveau <span id="level">1</span></h2>
            </div>

            <div id="modifiersContainer" style="margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px;">
                <h2 style="font-family: 'Lilita One', cursive; color: #333; font-size: 30px; text-align: center;">Modificateurs</h2>
                
                <div class="mod-group">
                    <label>Vitesse Joueur</label>
                    <div class="mod-inputs">
                        <input type="range" id="speedRange" min="1" max="20" value="5" disabled>
                    </div>
                </div>

                <div class="mod-group">
                    <label>Vitesse Rotation (x)</label>
                    <div class="mod-inputs">
                        <input type="range" id="rotRange" min="0" max="5" step="0.1" value="1" disabled>
                    </div>
                </div>

                <div class="mod-group">
                    <label>Force Bumper</label>
                    <div class="mod-inputs">
                        <input type="range" id="bumpRange" min="0" max="50" value="25" disabled>
                    </div>
                </div>
            </div>

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
        `;
    }
    let restartBtn = document.querySelector("#restartBtn");

    // --- INITIALISATION DU JEU ET DÉTECTION DES NIVEAUX ---
    let game = new Game(canvas);
    game.levelElement = document.querySelector("#level");
    game.timerElement = document.querySelector("#timerValue");
    await game.init();

    // --- GESTION DES MODIFICATEURS ---
    const setupModifier = (rangeId, onChange) => {
        let range = document.querySelector(rangeId);
        if (range) {
            range.oninput = () => { onChange(parseFloat(range.value)); };
        }
    };

    setupModifier("#speedRange", (val) => game.playerSpeed = val);
    setupModifier("#rotRange", (val) => {
        game.rotationMultiplier = val;
        game.applyRotationMultiplier();
    });
    setupModifier("#bumpRange", (val) => game.bumperForce = val);
    // ---------------------------------

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

    // --- CRÉATION DU BOUTON BLOB EDITOR ---
    let editorBtn = document.createElement("button");
    editorBtn.id = "editorButton";
    editorBtn.innerText = "Blob Editor";

    // On l'ajoute à la fin du conteneur pour qu'il soit SOUS le bouton Story
    menuTextContainer.appendChild(editorBtn);

    // Variable globale pour stocker l'objet en cours de déplacement
    let draggedItem = null;

    // Dans js/script.js, à l'intérieur de editorBtn.onclick
    editorBtn.onclick = () => {
        menu.style.display = "none";
        menuBackground.style.display = "none";
        if (sidebar) {
            sidebar.style.display = "block";
            sidebar.innerHTML = `
            <div id="editorHeader" style="display: flex; flex-direction: column; gap: 20px; align-items: center; padding-top: 20px;">
                <button id="btnEditorWall" class="menu-style-button">Mur</button>
                <button id="btnEditorObstacle" class="menu-style-button">Obstacle</button>
            </div>
            <div class="editor-separator" style="height: 4px; background-color: #ffcc00; width: 90%; margin: 30px auto; border-radius: 10px;"></div>
            <div id="editorAssetsContainer" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 10px;">
                <p style="color: #666; font-family: 'Lilita One';">Clique sur Mur ou Obstacle</p>
            </div>
            <button id="btnExitEditor" class="menu-style-button" style="margin-top: auto; background-color: #ff4444; color: white;">Quitter</button>
        `;

            const assetsContainer = document.querySelector("#editorAssetsContainer");

            // --- CLIC SUR LE BOUTON MUR ---
            document.querySelector("#btnEditorWall").onclick = () => {
                assetsContainer.innerHTML = ""; // On vide
                // On crée 3 types : Carré, Rectangle, Cercle
                createAssetPreview(assetsContainer, "square", "Carré", { w: 60, h: 60, type: "rect" });
                createAssetPreview(assetsContainer, "rect", "Rectangle", { w: 120, h: 40, type: "rect" });
                createAssetPreview(assetsContainer, "circle", "Cercle", { r: 35, type: "circle" });
            };

            // --- CLIC SUR LE BOUTON OBSTACLE ---
            document.querySelector("#btnEditorObstacle").onclick = () => {
                assetsContainer.innerHTML = "";
                createAssetPreview(assetsContainer, "triangle", "Bumper", { w: 50, h: 50, type: "bumper" });
            };

            document.querySelector("#btnExitEditor").onclick = () => location.reload();
        }
        resizeCanvas();
        game.start(0);
    };

    // Fonction pour créer les icônes cliquables dans la sidebar
    function createAssetPreview(container, cssClass, label, data) {
        const div = document.createElement("div");
        div.className = `asset-preview ${cssClass}`;
        div.innerHTML = `<span style="pointer-events:none">${label}</span>`;

        // Début du Drag
        div.onmousedown = (e) => {
            draggedItem = data;
            document.body.style.cursor = "grabbing";
        };

        container.appendChild(div);
    }

    // --- GESTION DU DROP SUR LE CANVAS ---
    document.addEventListener("mouseup", async (e) => {
        if (!draggedItem) return;

        let rect = canvas.getBoundingClientRect();
        let x = (e.clientX - rect.left) * (canvas.width / rect.width);
        let y = (e.clientY - rect.top) * (canvas.height / rect.height)s;

        // Si on lâche la souris sur le canvas
        if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
            let newObj;
            const ObstacleClass = (await import("./Obstacle.js")).default;
            const { CircleObstacle } = await import("./Obstacle.js");
            const BumperClass = (await import("./bumper.js")).default;

            if (draggedItem.type === "rect") {
                newObj = new ObstacleClass(x - draggedItem.w / 2, y - draggedItem.h / 2, draggedItem.w, draggedItem.h, "white");
            } else if (draggedItem.type === "circle") {
                // On crée l'obstacle circulaire avec les bonnes coordonnées
                newObj = new CircleObstacle(x, y, draggedItem.r, "white");
            } else if (draggedItem.type === "bumper") {
                newObj = new BumperClass(x - 25, y - 25, 50, 50, "orange", "up");
            }

            if (newObj) game.objetsGraphiques.push(newObj);
        }

        draggedItem = null;
        document.body.style.cursor = "default";
    });
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
    levelsMenu.id = "level-selection";
    levelsMenu.style.display = "none";

    // Conteneur pour les boutons de niveaux (Centré)
    let levelButtonsContainer = document.createElement("div");
    levelButtonsContainer.id = "levels-container";
    levelsMenu.appendChild(levelButtonsContainer);

    // Bouton Retour
    let btnBack = document.createElement("button");
    btnBack.id = "back-to-menu";
    btnBack.innerText = "Retour au Menu";
    levelsMenu.appendChild(btnBack);

    // Bouton Suivant
    let btnNextLevels = document.createElement("button");
    btnNextLevels.id = "next-levels";
    btnNextLevels.innerText = "Suivant >";
    levelsMenu.insertBefore(btnNextLevels, btnBack); // On l'insère avant le bouton retour

    document.body.appendChild(levelsMenu);

    // --- LOGIQUE DE PAGINATION ---
    let currentLevelPage = 0;
    const levelsPerPage = 10;

    function renderLevelButtons() {
        levelButtonsContainer.innerHTML = "";

        let start = currentLevelPage * levelsPerPage + 1;
        let end = Math.min(start + levelsPerPage - 1, maxLevels);

        let leftCol = document.createElement("div");
        leftCol.className = "levelColumn";
        let rightCol = document.createElement("div");
        rightCol.className = "levelColumn";

        for (let i = start; i <= end; i++) {
            let btn = document.createElement("button");
            btn.className = "level-button";
            btn.dataset.level = i;
            btn.innerText = i; // Juste le chiffre

            btn.onclick = () => {
                levelsMenu.style.display = "none";
                winMenu.style.display = "none";
                menuBackground.style.display = "none";
                if (sidebar) sidebar.style.display = "block";
                resizeCanvas();
                game.start(i);
            };

            // 5 premiers à gauche, les autres à droite
            if (i < start + 5) {
                leftCol.appendChild(btn);
            } else {
                rightCol.appendChild(btn);
            }
        }

        levelButtonsContainer.appendChild(leftCol);
        levelButtonsContainer.appendChild(rightCol);

        // Gestion visibilité bouton Suivant
        btnNextLevels.style.display = (end < maxLevels) ? "block" : "none";

        // Gestion bouton Retour (Devient "Précédent" si page > 0)
        if (currentLevelPage > 0) {
            btnBack.innerText = "< Précédent";
        } else {
            btnBack.innerText = "Retour au Menu";
        }
    }

    btnNextLevels.onclick = () => {
        currentLevelPage++;
        renderLevelButtons();
    };

    btnBack.onclick = () => {
        if (currentLevelPage > 0) {
            currentLevelPage--;
            renderLevelButtons();
        } else {
            levelsMenu.style.display = "none";
            menu.style.display = "flex";
            resizeCanvas();
        }
    };

    // Premier affichage
    renderLevelButtons();

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

        // Débloque les modificateurs une fois le jeu terminé
        let modifiers = document.querySelectorAll("#modifiersContainer input");
        modifiers.forEach(input => input.disabled = false);
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
        levelsMenu.style.display = "flex";
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
