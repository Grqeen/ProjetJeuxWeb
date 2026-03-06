import Game from "./Game.js";
import { getMousePos } from "./utils.js";
import Obstacle, {
  RotatingObstacle,
  CircleObstacle,
  MovingObstacle,
} from "./Obstacle.js";
import bumper from "./bumper.js";
import fin from "./fin.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import fadingDoor from "./fadingDoor.js";
import keypad from "./keypad.js";
import Player from "./Player.js";
import teleporter from "./teleporter.js";
import Fan from "./Fan.js";

// init
window.onload = init;

// couleurs
const colorMap = {
  red: "#ff0000",
  white: "#ffffff",
  black: "#000000",
  orange: "#ffa500",
  blue: "#0000ff",
  purple: "#800080",
  green: "#008000",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  pink: "#ffc0cb",
  gray: "#808080",
};

async function init() {
  // scroll haut
  window.scrollTo(0, 0);

  let canvas = document.querySelector("#myCanvas");
  let menu = document.querySelector("#gameMenu");
  let startBtn = document.querySelector("#startButton");
  let exitBtn = document.querySelector("#exitButton");
  let levelsBtn = document.querySelector("#LevelsButton");
  let sidebar = document.querySelector("#sidebar");

  // sidebar
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

            <div id="livesContainer" style="margin-top: 15px; text-align: center;">
                <div class="timer-label">VIES</div>
                <div id="livesValue" style="font-size: 30px; text-shadow: 2px 2px 0 #000;">❤️❤️❤️</div>
            </div>
            <button id="btnExitLevel" class="menu-style-button" style="margin-top: auto; margin-bottom: 20px; align-self: center; background-color: #ff4444; color: white;">Quitter</button>
        `;
  }
  let restartBtn = document.querySelector("#restartBtn");
  let btnExitLevel = document.querySelector("#btnExitLevel");

  // musique
  const menuMusic = new Audio("assets/sounds/menu.mp3");
  menuMusic.loop = true;
  menuMusic.volume = 0.5;
  const gameMusic = new Audio("assets/sounds/ingame.mp3");
  gameMusic.loop = true;
  gameMusic.volume = 0.5;

  let currentMusicState = "menu";

  function playMusic(state) {
    currentMusicState = state;
    if (state === "menu") {
      gameMusic.pause();
      gameMusic.currentTime = 0;
      menuMusic.play().catch(() => {});
    } else if (state === "game") {
      menuMusic.pause();
      menuMusic.currentTime = 0;
      gameMusic.play().catch(() => {});
    } else if (state === "stop") {
      menuMusic.pause();
      gameMusic.pause();
    }
  }

    // --- GESTION DU VOLUME (UI) ---
    let volumeContainer = document.createElement("div");
    volumeContainer.id = "volumeContainer";
    Object.assign(volumeContainer.style, {
        position: "fixed",
        bottom: "20px",
        left: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: "10000", // Très haut pour être au-dessus de tout
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: "8px 15px",
        borderRadius: "25px",
        backdropFilter: "blur(5px)",
        border: "1px solid rgba(255,255,255,0.3)"
    });

    let volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.id = "volumeSlider";
    volumeSlider.min = "0";
    volumeSlider.max = "1";
    volumeSlider.step = "0.01";
    volumeSlider.value = "0.5";
    volumeSlider.style.width = "80px";
    volumeSlider.style.cursor = "pointer";
    volumeSlider.style.accentColor = "#ffcc00";

    let volumeIcon = document.createElement("span");
    volumeIcon.innerText = "🔊";
    volumeIcon.style.fontSize = "24px";
    volumeIcon.style.cursor = "pointer";
    volumeIcon.style.userSelect = "none";
    volumeIcon.style.color = "white";

    volumeContainer.appendChild(volumeSlider);
    volumeContainer.appendChild(volumeIcon);
    document.body.appendChild(volumeContainer);

    let previousVolume = 0.5;
    let isMuted = false;

    volumeSlider.oninput = (e) => {
        let vol = parseFloat(e.target.value);
        menuMusic.volume = vol;
        gameMusic.volume = vol;
        if (typeof videoPlayer !== 'undefined') videoPlayer.volume = vol;
        if (vol > 0) {
            isMuted = false;
            volumeIcon.innerText = "🔊";
            previousVolume = vol;
        } else {
            isMuted = true;
            volumeIcon.innerText = "🔇";
        }
    };

    volumeIcon.onclick = () => {
        if (isMuted) {
            isMuted = false;
            let vol = previousVolume || 0.5;
            if (vol === 0) vol = 0.5;
            menuMusic.volume = vol;
            gameMusic.volume = vol;
            volumeSlider.value = vol;
            if (typeof videoPlayer !== 'undefined') videoPlayer.volume = vol;
            volumeIcon.innerText = "🔊";
        } else {
            isMuted = true;
            previousVolume = parseFloat(volumeSlider.value);
            menuMusic.volume = 0;
            gameMusic.volume = 0;
            if (typeof videoPlayer !== 'undefined') videoPlayer.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.innerText = "🔇";
        }
    };

    // --- INITIALISATION DU JEU ET DÉTECTION DES NIVEAUX ---
    let game = new Game(canvas);
    game.levelElement = document.querySelector("#level");
    game.timerElement = document.querySelector("#timerValue");
    await game.init();

    // --- GESTION DE L'AFFICHAGE DES VIES ---
    const livesValue = document.querySelector("#livesValue");
    function updateLives() {
        let hearts = "";
        for(let i = 0; i < game.lives; i++) hearts += "❤️";
        if (livesValue) livesValue.innerText = hearts;
    }

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
  game.objetsGraphiques = []; // reset
  console.log("Niveaux détectés : " + maxLevels);

  // bouton story
  if (exitBtn) exitBtn.innerText = "Story";

  const unlockAudio = () => {
    if (currentMusicState === "menu" && menuMusic.paused) {
      menuMusic.play().catch(() => {});
    } else if (currentMusicState === "game" && gameMusic.paused) {
      gameMusic.play().catch(() => {});
    }
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
  };
  document.addEventListener("click", unlockAudio);
  document.addEventListener("keydown", unlockAudio);

  // scores
  let bestTimes = {}; // temps

  function updateLeaderboards() {
    // html tableau
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
      let totalDisplay =
        count === maxLevels && maxLevels > 0 ? total.toFixed(2) + "s" : "-";
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

  editorBtn.onclick = () => {
    menu.style.display = "none";
    menuBackground.style.display = "none";
    if (sidebar) {
      playMusic("menu");
      sidebar.style.display = "flex";
      sidebar.innerHTML = `
            <div id="editorHeader" style="display: flex; flex-direction: column; gap: 20px; align-items: center; padding-top: 20px;">
                <button id="btnEditorWall" class="menu-style-button">Wall</button>
                <button id="btnEditorObstacle" class="menu-style-button">Obstacle</button>
                <button id="btnEditorModifiers" class="menu-style-button">Modifiers</button>
            </div>
            <div class="editor-separator" style="height: 4px; background-color: #ffcc00; width: 90%; margin: 30px auto; border-radius: 10px;"></div>
            <div id="editorAssetsContainer" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 10px;">
                <p style="color: #666; font-family: 'Lilita One';">Clique sur Mur ou Obstacle</p>
            </div>
            
            <!-- PANNEAU PROPRIÉTÉS -->
            <div id="editorProperties" style="display:none; border-top: 2px solid #ccc; padding-top: 10px; margin-top: 20px;">
                <h3 style="font-family: 'Lilita One'; text-align: center;">Propriétés</h3>
                <div class="mod-group"><label>Largeur (W)</label><input type="number" id="propW"></div>
                <div class="mod-group"><label>Hauteur (H)</label><input type="number" id="propH"></div>
                <div class="mod-group"><label>Rotation (°)</label><input type="number" id="propRot"></div>
                <div class="mod-group"><label>Couleur</label><input type="color" id="propColor" style="width:100%; height:30px; cursor:pointer;"></div>
                <div class="mod-group" id="divRotSpeed" style="display:none;"><label>Vitesse Rot.</label><input type="number" id="propRotSpeed" step="0.01"></div>
                <div class="mod-group" id="divLinkId" style="display:none;"><label>ID Liaison</label><input type="number" id="propLinkId"></div>
                
                <!-- Propriétés Moving Obstacle -->
                <div class="mod-group" id="divMoveProps" style="display:none;">
                    <label>Dist X</label><input type="number" id="propDistX">
                    <label>Dist Y</label><input type="number" id="propDistY">
                    <label>Vitesse</label><input type="number" id="propMoveSpeed" step="0.01">
                </div>
                <!-- Propriétés Teleporter -->
                <div class="mod-group" id="divTeleportProps" style="display:none;">
                    <label>Dest X</label><input type="number" id="propDestX">
                    <label>Dest Y</label><input type="number" id="propDestY">
                </div>
                <!-- Propriétés Fan -->
                <div class="mod-group" id="divFanProps" style="display:none;">
                    <label>Force Vent</label><input type="number" id="propFanForce" step="0.1">
                </div>
                
                <div class="mod-group" style="display:flex; justify-content: space-between; margin-top:10px;">
                    <button id="btnLayerDown" style="width:48%; cursor:pointer; padding:5px;">Arr. Plan</button>
                    <button id="btnLayerUp" style="width:48%; cursor:pointer; padding:5px;">Av. Plan</button>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button id="btnDeleteObj" style="background: #ff0000; color: white; border: 3px solid #990000; padding: 10px; border-radius: 8px; cursor: pointer; font-family: 'Lilita One'; font-size: 20px; width: 100%; box-shadow: 0 4px 0 #990000; text-transform: uppercase;">Supprimer</button>
                </div>
            </div>

            <button id="btnExportLevel" class="menu-style-button" style="margin-top: auto; margin-bottom: 10px; align-self: center; background-color: #4CAF50; color: white; border-color: #2E7D32; box-shadow: 0 4px 0 #2E7D32;">Exporter JSON</button>
            <button id="btnExitEditor" class="menu-style-button" style="margin-bottom: 20px; align-self: center; background-color: #ff4444; color: white;">Quitter</button>
        `;

            const assetsContainer = document.querySelector("#editorAssetsContainer");

            // --- CLIC SUR LE BOUTON MUR ---
            document.querySelector("#btnEditorWall").onclick = () => {
                assetsContainer.innerHTML = ""; // On vide
                // On crée 3 types : Carré, Rectangle, Cercle
                createAssetPreview(assetsContainer, "square", "Square", { w: 60, h: 60, type: "rect" });
                createAssetPreview(assetsContainer, "rect", "Rectangle", { w: 120, h: 40, type: "rect" });
                createAssetPreview(assetsContainer, "rect", "Wall V", { w: 40, h: 120, type: "rect" });
                createAssetPreview(assetsContainer, "circle", "Circle", { r: 35, type: "circle" });
            };

            // --- CLIC SUR LE BOUTON OBSTACLE ---
            document.querySelector("#btnEditorObstacle").onclick = () => {
                assetsContainer.innerHTML = "";
                createAssetPreview(assetsContainer, "triangle", "Bumper", { w: 50, h: 50, type: "bumper" });
                createAssetPreview(assetsContainer, "rect", "Cross", { w: 200, h: 20, type: "rotating" });
                createAssetPreview(assetsContainer, "circle", "Goal", { w: 80, h: 80, type: "fin" });
                createAssetPreview(assetsContainer, "rect", "Moving", { w: 60, h: 20, type: "moving" });
                createAssetPreview(assetsContainer, "rect", "Teleporter", { w: 40, h: 40, type: "teleporter" });
                createAssetPreview(assetsContainer, "rect", "Fan", { w: 50, h: 50, type: "fan" });
            };

            // --- CLIC SUR LE BOUTON MODIFICATEURS ---
            document.querySelector("#btnEditorModifiers").onclick = () => {
                assetsContainer.innerHTML = "";
                createAssetPreview(assetsContainer, "square", "Speed", { w: 30, h: 30, type: "speed" });
                createAssetPreview(assetsContainer, "square", "Size", { w: 30, h: 30, type: "size" });
                createAssetPreview(assetsContainer, "rect", "Door", { w: 20, h: 100, type: "door" });
                createAssetPreview(assetsContainer, "square", "Key", { w: 30, h: 30, type: "keypad" });
            };

            document.querySelector("#btnExitEditor").onclick = () => location.reload();

            // --- GESTION DES INPUTS DE PROPRIÉTÉS ---
            const propW = document.querySelector("#propW");
            const propH = document.querySelector("#propH");
            const propRot = document.querySelector("#propRot");
            const propColor = document.querySelector("#propColor");
            const btnLayerUp = document.querySelector("#btnLayerUp");
            const btnLayerDown = document.querySelector("#btnLayerDown");
            const propRotSpeed = document.querySelector("#propRotSpeed");
            const divRotSpeed = document.querySelector("#divRotSpeed");
            const propLinkId = document.querySelector("#propLinkId");
            const divLinkId = document.querySelector("#divLinkId");
            const btnDelete = document.querySelector("#btnDeleteObj");
            const propsPanel = document.querySelector("#editorProperties");
            
            const divMoveProps = document.querySelector("#divMoveProps");
            const propDistX = document.querySelector("#propDistX");
            const propDistY = document.querySelector("#propDistY");
            const propMoveSpeed = document.querySelector("#propMoveSpeed");
            const divTeleportProps = document.querySelector("#divTeleportProps");
            const propDestX = document.querySelector("#propDestX");
            const propDestY = document.querySelector("#propDestY");
            const divFanProps = document.querySelector("#divFanProps");
            const propFanForce = document.querySelector("#propFanForce");
            const btnExport = document.querySelector("#btnExportLevel");

            function updateInputs() {
                if (!game.selectedObject) {
                    propsPanel.style.display = "none";
                    return;
                }
                propsPanel.style.display = "block";

                // On empêche la suppression du joueur (on cache le bouton)
                if (game.selectedObject === game.player) {
                    btnDelete.style.display = "none";
                } else {
                    btnDelete.style.display = "block";
                }

                propW.value = Math.round(game.selectedObject.w);
                propH.value = Math.round(game.selectedObject.h);
                // Conversion radians -> degrés pour l'affichage
                let angleDeg = (game.selectedObject.angle || 0) * (180 / Math.PI);
                propRot.value = Math.round(angleDeg);

                // Gestion Couleur
                let c = game.selectedObject.couleur || "#000000";
                // Si c'est un nom de couleur, on convertit en hex
                if (!c.startsWith("#")) {
                    c = colorMap[c.toLowerCase()] || "#000000";
                }
                propColor.value = c;

                // Gestion Vitesse Rotation (si l'objet a cette propriété)
                if (game.selectedObject.angleSpeed !== undefined) {
                    divRotSpeed.style.display = "block";
                    propRotSpeed.value = game.selectedObject.angleSpeed;
                } else {
                    divRotSpeed.style.display = "none";
                }

                // Gestion ID Liaison (pour Portes et Keypads)
                if (game.selectedObject.id !== undefined) {
                    divLinkId.style.display = "block";
                    propLinkId.value = game.selectedObject.id;
                } else {
                    divLinkId.style.display = "none";
                }

                // Gestion Moving Obstacle
                if (game.selectedObject instanceof MovingObstacle) {
                    divMoveProps.style.display = "block";
                    propDistX.value = game.selectedObject.distX;
                    propDistY.value = game.selectedObject.distY;
                    propMoveSpeed.value = game.selectedObject.speed;
                } else {
                    divMoveProps.style.display = "none";
                }

                // Gestion Teleporter
                if (game.selectedObject instanceof teleporter) {
                    divTeleportProps.style.display = "block";
                    propDestX.value = game.selectedObject.destinationX;
                    propDestY.value = game.selectedObject.destinationY;
                } else {
                    divTeleportProps.style.display = "none";
                }

                // Gestion Fan
                if (game.selectedObject instanceof Fan) {
                    divFanProps.style.display = "block";
                    propFanForce.value = game.selectedObject.force;
                } else {
                    divFanProps.style.display = "none";
                }
            }

            propW.oninput = () => { 
                if (game.selectedObject) {
                    let val = parseFloat(propW.value);
                    if (isNaN(val) || val < 1) val = 1;
                    game.selectedObject.w = val;
                }
            };
            propH.oninput = () => { 
                if (game.selectedObject) {
                    let val = parseFloat(propH.value);
                    if (isNaN(val) || val < 1) val = 1;
                    game.selectedObject.h = val;
                }
            };
            propRot.oninput = () => { 
                if (game.selectedObject) {
                    // Conversion degrés -> radians
                    game.selectedObject.angle = parseFloat(propRot.value) * (Math.PI / 180);
                }
            };
            propColor.oninput = () => {
                if (game.selectedObject) game.selectedObject.couleur = propColor.value;
            };
            propRotSpeed.oninput = () => {
                if (game.selectedObject && game.selectedObject.angleSpeed !== undefined) {
                    game.selectedObject.angleSpeed = parseFloat(propRotSpeed.value);
                    if (game.selectedObject.initialAngleSpeed !== undefined) {
                        game.selectedObject.initialAngleSpeed = parseFloat(propRotSpeed.value);
                    }
                }
            };
            propLinkId.oninput = () => {
                if (game.selectedObject && game.selectedObject.id !== undefined) {
                    game.selectedObject.id = parseInt(propLinkId.value);
                }
            };
            propDistX.oninput = () => { if (game.selectedObject instanceof MovingObstacle) game.selectedObject.distX = parseFloat(propDistX.value); };
            propDistY.oninput = () => { if (game.selectedObject instanceof MovingObstacle) game.selectedObject.distY = parseFloat(propDistY.value); };
            propMoveSpeed.oninput = () => { if (game.selectedObject instanceof MovingObstacle) game.selectedObject.speed = parseFloat(propMoveSpeed.value); };
            
            propDestX.oninput = () => { if (game.selectedObject instanceof teleporter) game.selectedObject.destinationX = parseFloat(propDestX.value); };
            propDestY.oninput = () => { if (game.selectedObject instanceof teleporter) game.selectedObject.destinationY = parseFloat(propDestY.value); };
            propFanForce.oninput = () => { if (game.selectedObject instanceof Fan) game.selectedObject.force = parseFloat(propFanForce.value); };

            btnDelete.onclick = () => {
                if (game.selectedObject && game.selectedObject !== game.player) {
                    const index = game.objetsGraphiques.indexOf(game.selectedObject);
                    if (index > -1) {
                        game.objetsGraphiques.splice(index, 1);
                        game.selectedObject = null;
                        updateInputs();
                    }
                }
            };

            // --- GESTION DES CALQUES (Z-INDEX) ---
            btnLayerUp.onclick = () => {
                if (game.selectedObject) {
                    const idx = game.objetsGraphiques.indexOf(game.selectedObject);
                    if (idx < game.objetsGraphiques.length - 1) {
                        // On échange avec l'élément suivant
                        [game.objetsGraphiques[idx], game.objetsGraphiques[idx+1]] = [game.objetsGraphiques[idx+1], game.objetsGraphiques[idx]];
                    }
                }
            };
            btnLayerDown.onclick = () => {
                if (game.selectedObject) {
                    const idx = game.objetsGraphiques.indexOf(game.selectedObject);
                    if (idx > 0) {
                        // On échange avec l'élément précédent
                        [game.objetsGraphiques[idx], game.objetsGraphiques[idx-1]] = [game.objetsGraphiques[idx-1], game.objetsGraphiques[idx]];
                    }
                }
            };

            // Raccourci clavier : Touche Suppr pour supprimer l'objet sélectionné
            window.addEventListener("keydown", (e) => {
                if (e.key === "Delete") {
                    // On évite de supprimer si on est en train d'écrire dans un input
                    if (document.activeElement.tagName === "INPUT") return;
                    btnDelete.click();
                }
            });

            // --- COPIER / COLLER (Ctrl+C / Ctrl+V) ---
            let clipboard = null;

            function getObjectData(obj) {
                let type = "rect";
                let extra = {};

                if (obj instanceof Player) {
                    type = "player";
                } else if (obj instanceof CircleObstacle) {
                    type = "circle";
                    extra.r = obj.radius;
                } else if (obj instanceof RotatingObstacle) {
                    type = "rotating";
                    extra.angleSpeed = obj.initialAngleSpeed || obj.angleSpeed;
                    extra.angle = obj.angle;
                } else if (obj instanceof bumper) {
                    type = "bumper";
                    extra.direction = obj.direction;
                } else if (obj instanceof fin) {
                    type = "fin";
                } else if (obj instanceof speedPotion) {
                    type = "speed";
                    extra.vitesse = obj.vitesse;
                    extra.temps = obj.temps;
                } else if (obj instanceof sizePotion) {
                    type = "size";
                    extra.tailleW = obj.tailleW;
                    extra.tailleH = obj.tailleH;
                } else if (obj instanceof fadingDoor) {
                    type = "door";
                    extra.timer = obj.timer;
                    extra.id = obj.id;
                } else if (obj instanceof keypad) {
                    type = "keypad";
                    extra.temps = obj.temps;
                    extra.id = obj.id;
                } else if (obj instanceof MovingObstacle) {
                    type = "moving";
                    extra.distX = obj.distX;
                    extra.distY = obj.distY;
                    extra.speed = obj.speed;
                } else if (obj instanceof teleporter) {
                    type = "teleporter";
                    extra.destinationX = obj.destinationX;
                    extra.destinationY = obj.destinationY;
                } else if (obj instanceof Fan) {
                    type = "fan";
                    extra.force = obj.force;
                }
                return { type, x: obj.x, y: obj.y, w: obj.w, h: obj.h, couleur: obj.couleur, angle: obj.angle || 0, ...extra };
            }

            function createObjectFromData(data) {
                let newObj;
                if (data.type === "rect") {
                    newObj = new Obstacle(data.x, data.y, data.w, data.h, data.couleur);
                } else if (data.type === "circle") {
                    newObj = new CircleObstacle(data.x, data.y, data.r, data.couleur);
                } else if (data.type === "rotating") {
                    newObj = new RotatingObstacle(data.x, data.y, data.w, data.h, data.couleur, data.angleSpeed, data.angle);
                } else if (data.type === "bumper") {
                    newObj = new bumper(data.x, data.y, data.w, data.h, data.couleur, data.direction);
                } else if (data.type === "fin") {
                    newObj = new fin(data.x, data.y, data.w, data.h, data.couleur, "assets/images/portal.png");
                } else if (data.type === "speed") {
                    newObj = new speedPotion(data.x, data.y, data.w, data.h, data.couleur, data.vitesse, data.temps);
                } else if (data.type === "size") {
                    newObj = new sizePotion(data.x, data.y, data.w, data.h, data.couleur, data.tailleW, data.tailleH);
                } else if (data.type === "door") {
                    newObj = new fadingDoor(data.x, data.y, data.w, data.h, data.couleur, data.timer, data.id);
                } else if (data.type === "keypad") {
                    newObj = new keypad(data.x, data.y, data.w, data.h, data.couleur, data.temps, data.id);
                } else if (data.type === "moving") {
                    newObj = new MovingObstacle(data.x, data.y, data.w, data.h, data.couleur, data.distX, data.distY, data.speed);
                } else if (data.type === "teleporter") {
                    newObj = new teleporter(data.x, data.y, data.w, data.h, data.couleur, data.destinationX, data.destinationY);
                } else if (data.type === "fan") {
                    newObj = new Fan(data.x, data.y, data.w, data.h, data.couleur, data.force);
                }
                
                if (newObj && data.angle && !(newObj instanceof RotatingObstacle)) {
                    newObj.angle = data.angle;
                }
                return newObj;
            }

      window.addEventListener("keydown", (e) => {
        // ctrl c
        if (e.ctrlKey && e.key === "c") {
          if (game.selectedObject && game.selectedObject !== game.player) {
            clipboard = getObjectData(game.selectedObject);
          }
        }
        // ctrl v
        if (e.ctrlKey && e.key === "v") {
          if (clipboard) {
            let newObj = createObjectFromData(clipboard);
            if (newObj) {
              newObj.x += 20; // decalage
              newObj.y += 20;
              game.objetsGraphiques.push(newObj);
              game.selectedObject = newObj;
              updateInputs();
            }
          }
        }
      });

      // export json
      btnExport.onclick = () => {
        const levelData = game.objetsGraphiques.map((obj) =>
          getObjectData(obj),
        );
        const blob = new Blob([JSON.stringify(levelData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "mon_niveau_blob.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
      };

      // variables drag
      let isDraggingSelected = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let resizingHandle = null;

      // selection
      canvas.onmousedown = (e) => {
        if (draggedItem) return; // ignore drag menu

        let pos = getMousePos(canvas, e);
        let x = pos.x;
        let y = pos.y;

        // check poignee
        if (game.selectedObject) {
          let obj = game.selectedObject;
          let cx,
            cy,
            angle = obj.angle || 0;

          // calcul local
          if (obj instanceof RotatingObstacle || obj instanceof Player) {
            cx = obj.x;
            cy = obj.y;
          } else if (obj.radius) {
            cx = obj.x;
            cy = obj.y;
            angle = 0;
          } else {
            // standard
            cx = obj.x + obj.w / 2;
            cy = obj.y + obj.h / 2;
          }

          // souris locale
          let dx = x - cx;
          let dy = y - cy;
          let localX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
          let localY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

          // collision poignee
          let hitDist = 12;

          if (obj.radius) {
            if (Math.hypot(localX - obj.radius, localY) < hitDist)
              resizingHandle = "radius";
          } else {
            let hw = obj.w / 2;
            let hh = obj.h / 2;
            if (Math.hypot(localX - hw, localY - hh) < hitDist)
              resizingHandle = "corner";
            else if (Math.hypot(localX - hw, localY) < hitDist)
              resizingHandle = "right";
            else if (Math.hypot(localX, localY - hh) < hitDist)
              resizingHandle = "bottom";
          }

          if (resizingHandle) return; // resize start
        }

        // cherche objet
        game.selectedObject = null;
        for (let i = game.objetsGraphiques.length - 1; i >= 0; i--) {
          let obj = game.objetsGraphiques[i];

          // detection type
          let isCentered =
            obj instanceof Player ||
            obj instanceof RotatingObstacle ||
            obj instanceof CircleObstacle;
          let minX, maxX, minY, maxY;

          if (isCentered) {
            let hw = obj instanceof CircleObstacle ? obj.radius : obj.w / 2;
            let hh = obj instanceof CircleObstacle ? obj.radius : obj.h / 2;
            minX = obj.x - hw;
            maxX = obj.x + hw;
            minY = obj.y - hh;
            maxY = obj.y + hh;
          } else {
            minX = obj.x;
            maxX = obj.x + obj.w;
            minY = obj.y;
            maxY = obj.y + obj.h;
          }

          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            game.selectedObject = obj;
            break;
          }
        }
        updateInputs();

        // init drag
        if (game.selectedObject) {
          isDraggingSelected = true;
          dragOffsetX = x - game.selectedObject.x;
          dragOffsetY = y - game.selectedObject.y;
        }
      };

      canvas.onmousemove = (e) => {
        let pos = getMousePos(canvas, e);
        let x = pos.x;
        let y = pos.y;
        // resize
        if (resizingHandle && game.selectedObject) {
          let obj = game.selectedObject;
          let cx,
            cy,
            angle = obj.angle || 0;

          if (obj instanceof RotatingObstacle || obj instanceof Player) {
            cx = obj.x;
            cy = obj.y;
          } else if (obj.radius) {
            cx = obj.x;
            cy = obj.y;
            angle = 0;
          } else {
            cx = obj.x + obj.w / 2;
            cy = obj.y + obj.h / 2;
          }

          let dx = x - cx;
          let dy = y - cy;
          let localX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
          let localY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

          if (resizingHandle === "radius") {
            obj.radius = Math.max(10, localX);
          } else {
            // resize w
            if (resizingHandle === "right" || resizingHandle === "corner") {
              let newW = Math.max(10, Math.abs(localX) * 2);

              // fix centre
              if (!(obj instanceof RotatingObstacle || obj instanceof Player)) {
                let oldW = obj.w;
                obj.w = newW;
                obj.x -= (newW - oldW) / 2;
              } else {
                obj.w = newW;
              }
            }
            if (resizingHandle === "bottom" || resizingHandle === "corner") {
              let newH = Math.max(10, Math.abs(localY) * 2);

              if (!(obj instanceof RotatingObstacle || obj instanceof Player)) {
                let oldH = obj.h;
                obj.h = newH;
                obj.y -= (newH - oldH) / 2;
              } else {
                obj.h = newH;
              }
            }
          }
          updateInputs();
          return;
        }

        if (isDraggingSelected && game.selectedObject) {
          game.selectedObject.x = x - dragOffsetX;
          game.selectedObject.y = y - dragOffsetY;
          // update start
          if (game.selectedObject instanceof MovingObstacle) {
            game.selectedObject.startX = game.selectedObject.x;
            game.selectedObject.startY = game.selectedObject.y;
          }
        }
      };

      canvas.onmouseup = () => {
        isDraggingSelected = false;
        resizingHandle = null;
      };

      document.addEventListener("mouseup", () => {
        isDraggingSelected = false;
        resizingHandle = null;
      });
    }
    resizeCanvas();
    game.start(0);
  };

  // Fonction pour créer les icônes cliquables dans la sidebar
  function createAssetPreview(container, cssClass, label, data) {
    const div = document.createElement("div");
    div.className = `asset-preview`;

    // Ajustement du style pour que le texte soit bien visible en dessous
    div.style.width = "80px";
    div.style.height = "auto";
    div.style.minHeight = "80px";
    div.style.padding = "5px";

    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.gap = "5px";

    // canvas preview
    const cvs = document.createElement("canvas");
    cvs.width = 50;
    cvs.height = 50;
    const ctx = cvs.getContext("2d");

    // dessin
    ctx.clearRect(0, 0, 50, 50);

    if (data.type === "rect") {
      ctx.fillStyle = "white";
      let w = Math.min(40, data.w);
      let h = Math.min(40, data.h);
      if (data.w > data.h) h = w * (data.h / data.w);
      else w = h * (data.w / data.h);
      ctx.fillRect(25 - w / 2, 25 - h / 2, w, h);
    } else if (data.type === "circle") {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(25, 25, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (data.type === "bumper") {
      // image
      let img = new Image();
      img.src = "assets/images/bumper.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "rotating") {
      ctx.fillStyle = "red";
      ctx.translate(25, 25);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-20, -4, 40, 8);
      ctx.fillRect(-4, -20, 8, 40);
    } else if (data.type === "fin") {
      let img = new Image();
      img.src = "assets/images/portal.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "speed") {
      let img = new Image();
      img.src = "assets/images/citron.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "size") {
      let img = new Image();
      img.src = "assets/images/orange.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "door") {
      let img = new Image();
      img.src = "assets/images/laser.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "keypad") {
      let img = new Image();
      img.src = "assets/images/fadingdoor.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "moving") {
      let img = new Image();
      img.src = "assets/images/metalblock.png";
      img.onload = () => {
        ctx.drawImage(img, 0, 15, 50, 20);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("↔", 15, 32);
      };
    } else if (data.type === "teleporter") {
      let img = new Image();
      img.src = "assets/images/teleporter.png";
      img.onload = () => ctx.drawImage(img, 0, 0, 50, 50);
    } else if (data.type === "fan") {
      ctx.fillStyle = "#555";
      ctx.fillRect(5, 5, 40, 40);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(5, 5, 40, 40);
      ctx.fillStyle = "cyan";
      ctx.translate(25, 25);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-18, -4, 36, 8);
      ctx.fillRect(-4, -18, 8, 36);
    }

    div.appendChild(cvs);

    const lbl = document.createElement("span");
    lbl.innerText = label;
    lbl.style.fontSize = "11px";
    lbl.style.pointerEvents = "none";
    lbl.style.textAlign = "center";
    div.appendChild(lbl);

    // start drag
    div.onmousedown = (e) => {
      draggedItem = data;
      document.body.style.cursor = "grabbing";

      // ghost
      const ghost = document.createElement("div");
      ghost.style.position = "fixed";
      ghost.style.pointerEvents = "none";
      ghost.style.zIndex = "10000";
      ghost.style.opacity = "0.8";
      ghost.style.border = "2px solid white";
      ghost.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";

      // style
      let w, h;
      if (data.r) {
        w = data.r * 2;
        h = data.r * 2;
        ghost.style.borderRadius = "50%";
      } else {
        w = data.w;
        h = data.h;
      }

      if (data.type === "fin") ghost.style.borderRadius = "50%";

      ghost.style.width = w + "px";
      ghost.style.height = h + "px";

      // On utilise l'image du canvas de prévisualisation comme skin pour le drag
      ghost.style.backgroundImage = `url(${cvs.toDataURL()})`;
      ghost.style.backgroundSize = "100% 100%";
      ghost.style.backgroundRepeat = "no-repeat";
      ghost.style.backgroundColor = "transparent";

      // centre souris
      ghost.style.left = e.clientX - w / 2 + "px";
      ghost.style.top = e.clientY - h / 2 + "px";

      document.body.appendChild(ghost);

      const moveGhost = (ev) => {
        ghost.style.left = ev.clientX - w / 2 + "px";
        ghost.style.top = ev.clientY - h / 2 + "px";
      };

      const removeGhost = () => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        document.removeEventListener("mousemove", moveGhost);
        document.removeEventListener("mouseup", removeGhost);
      };

      document.addEventListener("mousemove", moveGhost);
      document.addEventListener("mouseup", removeGhost);
    };

    container.appendChild(div);
  }

  // drop
  document.addEventListener("mouseup", async (e) => {
    if (!draggedItem) return;

    let pos = getMousePos(canvas, e);
    let x = pos.x;
    let y = pos.y;

    // drop canvas
    if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
      let newObj;

      if (draggedItem.type === "rect") {
        newObj = new Obstacle(
          x - draggedItem.w / 2,
          y - draggedItem.h / 2,
          draggedItem.w,
          draggedItem.h,
          "white",
        );
      } else if (draggedItem.type === "circle") {
        // cercle
        newObj = new CircleObstacle(x, y, draggedItem.r, "white");
      } else if (draggedItem.type === "bumper") {
        newObj = new bumper(x - 25, y - 25, 50, 50, "orange", "up");
      } else if (draggedItem.type === "rotating") {
        newObj = new RotatingObstacle(
          x,
          y,
          draggedItem.w,
          draggedItem.h,
          "red",
          0.02,
        );
      } else if (draggedItem.type === "fin") {
        newObj = new fin(
          x - 40,
          y - 40,
          80,
          80,
          "green",
          "assets/images/portal.png",
        );
      } else if (draggedItem.type === "speed") {
        newObj = new speedPotion(x - 15, y - 15, 30, 30, "cyan", 5, 3000);
      } else if (draggedItem.type === "size") {
        newObj = new sizePotion(x - 15, y - 15, 30, 30, "magenta", -40, -40);
      } else if (draggedItem.type === "door") {
        newObj = new fadingDoor(x - 10, y - 50, 20, 100, 3000, 1);
      } else if (draggedItem.type === "keypad") {
        newObj = new keypad(x - 15, y - 15, 30, 30, 3000, 1);
      } else if (draggedItem.type === "moving") {
        newObj = new MovingObstacle(
          x - 30,
          y - 10,
          60,
          20,
          "purple",
          100,
          0,
          0.05,
        );
      } else if (draggedItem.type === "teleporter") {
        newObj = new teleporter(x - 20, y - 20, 40, 40, "blue", 100, 100);
      } else if (draggedItem.type === "fan") {
        newObj = new Fan(
            x - 25,
            y - 25,
            50,
            50,
            "cyan",
            2);
      }

      if (newObj) game.objetsGraphiques.push(newObj);
    }

    draggedItem = null;
    document.body.style.cursor = "default";
  });
  // leaderboard
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

  // image blob
  let blobImage = document.createElement("img");
  let gifSource = "assets/images/blobMenu.gif";
  blobImage.src = gifSource;
  blobImage.id = "blobMenuImage";
  menu.appendChild(blobImage);

  // pause gif
  let staticSource = "";
  let tempImg = new Image();
  tempImg.src = gifSource;
  tempImg.onload = () => {
    let c = document.createElement("canvas");
    c.width = tempImg.width;
    c.height = tempImg.height;
    c.getContext("2d").drawImage(tempImg, 0, 0);
    staticSource = c.toDataURL();
    blobImage.src = staticSource; // pause defaut
  };

  blobImage.onmouseenter = () => {
    blobImage.src = gifSource;
  };
  blobImage.onmouseleave = () => {
    if (staticSource) blobImage.src = staticSource;
  };

  // menu niveaux
  let levelsMenu = document.createElement("div");
  levelsMenu.id = "level-selection";
  levelsMenu.style.display = "none";

  // conteneur
  let levelButtonsContainer = document.createElement("div");
  levelButtonsContainer.id = "levels-container";
  levelsMenu.appendChild(levelButtonsContainer);

  // retour
  let btnBack = document.createElement("button");
  btnBack.id = "back-to-menu";
  btnBack.innerText = "Retour au Menu";
  levelsMenu.appendChild(btnBack);

  // suivant
  let btnNextLevels = document.createElement("button");
  btnNextLevels.id = "next-levels";
  btnNextLevels.innerText = "Suivant >";
  levelsMenu.insertBefore(btnNextLevels, btnBack); // avant retour

  // import json
  let btnImport = document.createElement("button");
  btnImport.id = "btnImportLevel";
  btnImport.innerText = "Importer JSON";
  // style
  btnImport.className = "menu-style-button";
  btnImport.style.marginTop = "10px";
  btnImport.style.backgroundColor = "#2196F3"; // Bleu
  btnImport.style.color = "white";
  btnImport.style.borderColor = "#0b7dda";

  levelsMenu.appendChild(btnImport);

  let fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  btnImport.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        maxLevels++;
        game.levels.registerCustomLevel(maxLevels, data);
        currentLevelPage = Math.floor((maxLevels - 1) / levelsPerPage);
        renderLevelButtons();
        updateLeaderboards();
        alert("Niveau importé avec succès ! (Niveau " + maxLevels + ")");
      } catch (err) {
        console.error("Erreur JSON", err);
        alert("Fichier invalide !");
      }
    };
    reader.readAsText(file);
    fileInput.value = ""; // reset
  };

  document.body.appendChild(levelsMenu);

  // pagination
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
      btn.innerText = i; // chiffre

      btn.onclick = () => {
        levelsMenu.style.display = "none";
        winMenu.style.display = "none";
        menuBackground.style.display = "none";
        if (sidebar) sidebar.style.display = "flex";
        resizeCanvas();
        playMusic("game");
        game.lives = 3;
        updateLives();
        game.start(i);
      };

      // colonnes
      if (i < start + 5) {
        leftCol.appendChild(btn);
      } else {
        rightCol.appendChild(btn);
      }
    }

    levelButtonsContainer.appendChild(leftCol);
    levelButtonsContainer.appendChild(rightCol);

    // bouton suivant
    btnNextLevels.style.display = end < maxLevels ? "block" : "none";

    // bouton retour
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

  // affichage
  renderLevelButtons();

  // bg menu
  let menuBackground = document.createElement("div");
  menuBackground.id = "menuBackground";
  document.body.appendChild(menuBackground);

  // menu win
  let winMenu = document.createElement("div");
  winMenu.id = "winMenu";
  winMenu.style.display = "none";
  winMenu.innerHTML = `
        <h1>BRAVO !</h1>
        <button id="btnWinRestart">Rejouer</button>
        <button id="btnWinHome">Menu Principal</button>
    `;
  document.body.appendChild(winMenu);

  // video
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
    justifyContent: "center",
  });

  let videoPlayer = document.createElement("video");
  videoPlayer.src = "assets/video/Blob_Escape_Lore.mp4";
  videoPlayer.style.width = "100%";
  videoPlayer.style.height = "100%";
  videoPlayer.style.objectFit = "cover";
  if (typeof volumeSlider !== 'undefined') videoPlayer.volume = parseFloat(volumeSlider.value);

  // skip
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
    transition: "all 0.3s ease",
  });

  // hover
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
    playMusic("stop");
    menu.style.display = "none";
    menuBackground.style.display = "none";
    levelsMenu.style.display = "none";
    leaderboardMenu.style.display = "none";
    winMenu.style.display = "none";
    if (sidebar) sidebar.style.display = "none";

    videoContainer.style.display = "flex";
    videoPlayer.currentTime = 0;
    videoPlayer.play().catch((e) => console.log("Erreur lecture vidéo", e));

    const endVideo = () => {
      videoPlayer.pause();
      videoContainer.style.display = "none";
      // clean
      videoPlayer.onended = null;
      videoPlayer.onclick = null;
      skipButton.onclick = null;
      if (callback) callback();
    };

    videoPlayer.onended = endVideo;
    // click skip
    videoPlayer.onclick = endVideo;
    skipButton.onclick = (e) => {
      e.stopPropagation();
      endVideo();
    };
  }

  function resizeCanvas() {
    // taille fixe
    canvas.width = 1400;
    canvas.height = 1000;

    let sidebarWidth = 450;
    // espace dispo
    let availableWidth =
      window.innerWidth - (sidebar.style.display !== "none" ? sidebarWidth : 0);

    // css stretch
    canvas.style.width = availableWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    // proportions
    canvas.style.objectFit = "contain";
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // init leaderboard
  updateLeaderboards();

  // callback scores
  game.onLevelComplete = (level, time) => {
    // meilleur temps
    if (!bestTimes[level] || time < bestTimes[level]) {
      bestTimes[level] = time;
      updateLeaderboards();
    }
  };

  // callback fin
  game.onFinish = () => {
    menu.style.display = "none";
    sidebar.style.display = "none";
    menuBackground.style.display = "block";
    winMenu.style.display = "block";
    resizeCanvas();
    playMusic("menu");

    // unlock modifs
    let modifiers = document.querySelectorAll("#modifiersContainer input");
    modifiers.forEach((input) => (input.disabled = false));
  };

  startBtn.onclick = () => {
    winMenu.style.display = "none"; // cache menu
    playVideo(() => {
      if (sidebar) sidebar.style.display = "flex";
      resizeCanvas();
      playMusic("game");
      game.lives = 3;
      updateLives();
      game.start(1); // niveau 1
    });
  };

  // story
  exitBtn.onclick = () => {
    playVideo(() => {
      menu.style.display = "flex";
      menuBackground.style.display = "block";
      resizeCanvas();
      playMusic("menu");
    });
  };

  // levels
  levelsBtn.onclick = () => {
    menu.style.display = "none";
    levelsMenu.style.display = "flex";
    resizeCanvas();
    playMusic("menu");
  };

  // leaderboard
  leaderboardBtn.onclick = () => {
    menu.style.display = "none";
    leaderboardMenu.style.display = "block";
    resizeCanvas();
    playMusic("menu");
  };

  // retour
  document.querySelector("#btnLeaderboardBack").onclick = () => {
    leaderboardMenu.style.display = "none";
    menu.style.display = "flex";
    resizeCanvas();
  };

  // boutons win
  document.querySelector("#btnWinRestart").onclick = () => {
    winMenu.style.display = "none";
    menuBackground.style.display = "none";
    if (sidebar) sidebar.style.display = "flex";
    resizeCanvas();
    playMusic("game");
    game.lives = 3;
    updateLives();
    game.start(1);
  };
  document.querySelector("#btnWinHome").onclick = () => {
    winMenu.style.display = "none";
    menu.style.display = "flex";
    resizeCanvas();
  };

  // restart
  restartBtn.onclick = () => {
    restartBtn.blur(); // blur
    if (game.lives > 0) {
      game.lives--;
      updateLives();
      if (game.lives === 0) {
        alert("Game Over !");
        if (btnExitLevel) btnExitLevel.click();
      } else {
        game.start(game.currentLevel);
      }
    }
  };

  // quitter
  if (btnExitLevel) {
    btnExitLevel.onclick = () => {
      game.running = false;
      if (game.removeCountdownOverlay) game.removeCountdownOverlay();
      menu.style.display = "flex";
      menuBackground.style.display = "block";
      if (sidebar) sidebar.style.display = "none";
      resizeCanvas();
      playMusic("menu");
    };
  }
}
