import { getHeight, limitRadius, waterLevel } from "./utils.js";
import { createTerrain } from "./terrain.js";
import { createPlayer } from "./player.js";
import { createMonsters } from "./monsters.js";
import { createTrees } from "./trees.js";
import { createSewer } from "./sewer.js";
import { createGrass } from "./grass.js";
import { createBirds, updateBirds } from "./birds.js";
import { createWater } from "./water.js";
import { createBuildings } from "./buildings.js";
import { createBridges } from "./bridges.js";
import { createMenuScene } from "./menu.js";

// Configuration globale du jeu
export const gameSettings = {
    fullscreen: false,
    quality: "high", // low, medium, high, custom
    resolution: 1.0, // 1.0 = High, 2.0 = Low (HardwareScalingLevel)
    keys: {
        forward: "z",
        backward: "s",
        left: "q",
        right: "d",
        sprint: "shift",
        showFps: true // Nouvelle option pour afficher ou masquer les FPS
    }
};

window.addEventListener('DOMContentLoaded', function () {
    // Vérification de sécurité : on s'assure que Babylon GUI est chargé
    if (!BABYLON.GUI) {
        alert("Erreur critique : La librairie Babylon.js GUI est manquante.\nVeuillez ajouter <script src='https://cdn.babylonjs.com/gui/babylon.gui.min.js'></script> dans votre fichier HTML.");
        throw new Error("Babylon.js GUI not found");
    }

    const canvas = document.getElementById("myCanvas");
    const engine = new BABYLON.Engine(canvas, true);

    // Déclaration anticipée pour l'utiliser dans createGameScene
    let isGamePaused = false;
    const togglePause = () => { isGamePaused = !isGamePaused; };

    const createGameScene = function () {
        const scene = new BABYLON.Scene(engine);
        
        // ACTIVER LES COLLISIONS GLOBALES
        scene.collisionsEnabled = true;

        // Caméra plus proche et orientée vers le centre pour l'intro
        const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, 1.0, 8, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        
        // Empêche la caméra de passer sous le sol (Beta < 90 degrés environ)
        camera.upperBetaLimit = Math.PI / 2 - 0.05;

        // UI JEU (FPS) - Créé ici car il faut une scène active
        const gameUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene);
        const fpsText = new BABYLON.GUI.TextBlock();
        fpsText.text = "0 FPS";
        fpsText.color = "yellow";
        fpsText.fontSize = 24;
        fpsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        fpsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        fpsText.left = "10px";
        fpsText.top = "10px";
        fpsText.isVisible = gameSettings.showFps;
        gameUI.addControl(fpsText);

        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Création du terrain
        createTerrain(scene);

        // Création du joueur
        const stickman = createPlayer(scene);
        
        // ACTIVER LES COLLISIONS SUR LE JOUEUR
        stickman.checkCollisions = true;
        // Ajustement de l'ellipsoïde pour correspondre à l'échelle 0.6 du joueur
        // Hauteur visuelle ~3m (5 * 0.6) -> On met une hitbox de 1.8m (Rayon 0.9)
        stickman.ellipsoid = new BABYLON.Vector3(0.25, 0.9, 0.25); 
        stickman.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0); // Base à 0 (Pieds)
        
        // Position de départ : SOUS la map (dans les égouts)
        stickman.position = new BABYLON.Vector3(0, -5, 0);
        
        // Note : On ne verrouille pas la caméra sur le stickman tout de suite pour bien voir l'égout

        // Création des monstres
        const monsters = createMonsters(scene, 15);

        // Création des arbres (200 arbres)
        createTrees(scene, 200);

        // Création de l'entrée des égouts
        const { cover } = createSewer(scene);

        // Création de l'herbe (4000 touffes)
        createGrass(scene, 1000);

        // Création des oiseaux
        const birds = createBirds(scene, 50);

        // Création de l'eau
        createWater(scene);

        // Création des bâtiments (30 bâtiments)
        createBuildings(scene, 30);

        // Création des ponts cassés (10 ponts)
        createBridges(scene, 10);

        // Gestion des entrées
        const inputMap = {};
        window.addEventListener("keydown", (evt) => {
            inputMap[evt.key.toLowerCase()] = true; // Convertit tout en minuscule pour éviter les bugs avec Maj
        });
        window.addEventListener("keyup", (evt) => {
            inputMap[evt.key.toLowerCase()] = false;
        });
        // Arrête tout mouvement si on quitte la fenêtre (Alt-Tab ou clic ailleurs)
        window.addEventListener("blur", () => {
            for (const key in inputMap) inputMap[key] = false;
        });

        // --- SYSTÈME DE PAUSE / PARAMÈTRES (ÉCHAP) ---
        const pauseTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("PauseUI", true, scene);

        const pausePanel = new BABYLON.GUI.StackPanel();
        pausePanel.width = "450px"; // Plus large pour les touches
        pausePanel.background = "#2c3e50";
        pausePanel.paddingTop = "10px";
        pausePanel.paddingBottom = "10px";
        pausePanel.cornerRadius = 20;
        pausePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        pausePanel.isVisible = false;
        pauseTexture.addControl(pausePanel);

        const createHeader = (text) => {
            const header = new BABYLON.GUI.TextBlock();
            header.text = text;
            header.color = "white";
            header.fontSize = 24;
            header.height = "40px";
            header.fontWeight = "bold";
            return header;
        };

        pausePanel.addControl(createHeader("PAUSE - PARAMÈTRES"));

        // -- Option Plein Écran et FPS --
        const videoRow = new BABYLON.GUI.StackPanel();
        videoRow.isVertical = false;
        videoRow.height = "40px";
        pausePanel.addControl(videoRow);

        const fsCheckbox = new BABYLON.GUI.Checkbox();
        fsCheckbox.width = "20px"; fsCheckbox.height = "20px";
        fsCheckbox.isChecked = gameSettings.fullscreen;
        fsCheckbox.color = "#3498db";
        fsCheckbox.onIsCheckedChangedObservable.add(v => {
            gameSettings.fullscreen = v;
            if (v) engine.enterFullscreen(); else engine.exitFullscreen();
        });
        videoRow.addControl(fsCheckbox);

        const fsLabel = new BABYLON.GUI.TextBlock();
        fsLabel.text = " Plein Écran  |  FPS ";
        fsLabel.color = "white"; fsLabel.width = "150px";
        videoRow.addControl(fsLabel);

        const fpsCheckbox = new BABYLON.GUI.Checkbox();
        fpsCheckbox.width = "20px"; fpsCheckbox.height = "20px";
        fpsCheckbox.isChecked = gameSettings.showFps;
        fpsCheckbox.color = "#3498db";
        fpsCheckbox.onIsCheckedChangedObservable.add(v => gameSettings.showFps = v);
        videoRow.addControl(fpsCheckbox);

        // -- Qualité Graphique --
        pausePanel.addControl(createHeader("QUALITÉ"));
        const qRow = new BABYLON.GUI.StackPanel();
        qRow.isVertical = false; qRow.height = "40px";
        pausePanel.addControl(qRow);

        ["Low", "Medium", "High"].forEach(q => {
            const btn = BABYLON.GUI.Button.CreateSimpleButton("q"+q, q);
            btn.width = "80px"; btn.height = "30px"; btn.color = "white";
            btn.background = gameSettings.quality.toLowerCase() === q.toLowerCase() ? "#3498db" : "#7f8c8d";
            btn.onPointerUpObservable.add(() => {
                gameSettings.quality = q.toLowerCase();
                if (q === "Low") gameSettings.resolution = 2.0;
                else if (q === "Medium") gameSettings.resolution = 1.5;
                else gameSettings.resolution = 1.0;
                // Note: La mise à jour visuelle des boutons demanderait une boucle ici
            });
            qRow.addControl(btn);
        });

        // -- Liste des Touches (Version compacte) --
        pausePanel.addControl(createHeader("TOUCHES"));
        const keysContainer = new BABYLON.GUI.ScrollViewer();
        keysContainer.width = "400px"; keysContainer.height = "150px";
        keysContainer.background = "#34495e";
        pausePanel.addControl(keysContainer);

        const keysList = new BABYLON.GUI.StackPanel();
        keysContainer.addControl(keysList);

        const addKeySetting = (label, prop) => {
            const row = new BABYLON.GUI.StackPanel();
            row.isVertical = false; row.height = "35px";
            const t = new BABYLON.GUI.TextBlock();
            t.text = label; t.color = "white"; t.width = "180px";
            row.addControl(t);
            const b = BABYLON.GUI.Button.CreateSimpleButton("k"+prop, gameSettings.keys[prop].toUpperCase());
            b.width = "100px"; b.height = "25px"; b.color = "white"; b.background = "#95a5a6";
            b.onPointerUpObservable.add(() => {
                b.textBlock.text = "...";
                const listener = (e) => {
                    gameSettings.keys[prop] = e.key.toLowerCase();
                    b.textBlock.text = e.key.toUpperCase();
                    window.removeEventListener("keydown", listener);
                };
                window.addEventListener("keydown", listener);
            });
            row.addControl(b);
            keysList.addControl(row);
        };
        addKeySetting("Avancer", "forward");
        addKeySetting("Reculer", "backward");
        addKeySetting("Gauche", "left");
        addKeySetting("Droite", "right");
        addKeySetting("Sprint", "sprint");

        const resumeBtn = BABYLON.GUI.Button.CreateSimpleButton("resume", "REPRENDRE");
        resumeBtn.height = "40px"; resumeBtn.width = "200px"; resumeBtn.color = "white";
        resumeBtn.background = "#27ae60"; resumeBtn.marginTop = "10px";
        resumeBtn.onPointerUpObservable.add(() => {
            isGamePaused = false;
            pausePanel.isVisible = false;
        });
        pausePanel.addControl(resumeBtn);

        return { scene, stickman, monsters, inputMap, camera, cover, birds, fpsText, pausePanel };
    };

    // --- GESTION DES SCÈNES ---
    let currentScene = null;
    let gameData = null; // Stockera les objets du jeu (stickman, camera, etc.)
    let projectiles = []; // Liste des boules de feu
    let lastFireTime = 0; // Chronomètre pour le tir

    // Fonction pour lancer le jeu depuis le menu
    const startGame = () => {
        if (currentScene) currentScene.dispose();
        const data = createGameScene();
        currentScene = data.scene;
        gameData = data;
        isGamePaused = false;
        projectiles = [];
        lastFireTime = 0;
    };

    // Au démarrage, on lance le menu
    currentScene = createMenuScene(engine, startGame, gameSettings);

    // Variables pour la physique (saut et gravité)
    let verticalVelocity = 0;
    const gravity = -0.015;
    const jumpForce = 0.25;

    // État de l'animation d'intro
    // "waiting" -> "opening" -> "climbing" -> "closing" -> "finished"
    let spawnState = "waiting"; 
    setTimeout(() => { spawnState = "opening"; }, 1000); // Commence après 1 seconde

    // Écouteur global pour la touche Échap
    window.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape" && gameData) {
            togglePause();
            if (gameData.pausePanel) {
                gameData.pausePanel.isVisible = isGamePaused;
            }
        }
    });

    engine.runRenderLoop(function () {
        if (!currentScene) return;

        // Application dynamique de la qualité graphique (Résolution)
        // Si le scaling level a changé dans les settings, on l'applique au moteur
        if (engine.getHardwareScalingLevel() !== gameSettings.resolution) {
            engine.setHardwareScalingLevel(gameSettings.resolution);
        }

        // SI ON EST DANS LE MENU, on rend juste la scène et on quitte
        if (!gameData) {
            // Mise à jour FPS Menu (si disponible)
            if (currentScene.fpsText) {
                currentScene.fpsText.text = engine.getFps().toFixed() + " FPS";
                currentScene.fpsText.isVisible = gameSettings.showFps;
            }
            currentScene.render();
            return;
        }

        // Mise à jour FPS Jeu
        if (gameData.fpsText) {
            gameData.fpsText.text = engine.getFps().toFixed() + " FPS";
            gameData.fpsText.isVisible = gameSettings.showFps;
        }

        // SI LE JEU EST EN PAUSE
        if (isGamePaused) {
            currentScene.render();
            return; // On arrête la logique ici, mais on continue de dessiner l'image fixe
        }

        // --- LOGIQUE DU JEU (Uniquement si gameData existe) ---
        const { stickman, monsters, inputMap, camera, cover, birds, scene } = gameData;

        // Mise à jour des oiseaux
        updateBirds(birds);

        // --- GESTION DE L'INTRO (ÉGOUTS) ---
        if (spawnState !== "finished") {
            if (spawnState === "opening") {
                // Animation : La plaque glisse et tourne
                cover.position.x += 0.02;
                cover.rotation.y += 0.05;
                // Quand la plaque est assez loin, on commence à monter
                if (cover.position.x > 1.2) {
                    spawnState = "climbing";
                }
            } else if (spawnState === "climbing") {
                // Animation : Le joueur monte
                stickman.position.y += 0.03;
                // Petit mouvement de gauche à droite pour simuler l'escalade
                stickman.rotation.z = Math.sin(stickman.position.y * 5) * 0.1;

                // Une fois arrivé à la surface (y=0 pour les pieds, donc y=1.2 pour le centre du corps réduit)
                // Note: stickman.scaling est 0.6, donc le centre est plus bas.
                // Avec la correction de l'hitbox, le pivot est plus bas, donc on arrête à 0.6
                // On monte un peu plus haut (1.0) pour être sûr de retomber SUR la plaque et pas dedans
                if (stickman.position.y >= 1.0) {
                    stickman.position.y = 1.0;
                    stickman.rotation.z = 0; // Remet droit
                    spawnState = "closing"; // On passe à la fermeture
                }
            } else if (spawnState === "closing") {
                // Animation : La plaque revient
                cover.position.x -= 0.04; // Revient un peu plus vite
                cover.rotation.y -= 0.1;
                
                if (cover.position.x <= 0) {
                    cover.position.x = 0;
                    cover.rotation.y = 0;
                    spawnState = "finished";

                    // Réinitialiser la vélocité pour éviter de tomber d'un coup à la reprise
                    verticalVelocity = 0;

                    // L'intro est finie : la caméra suit le joueur et recule
                    camera.lockedTarget = stickman;
                    camera.radius = 15;
                }
            }
            // Pendant l'intro, on rend la scène mais on bloque les contrôles
            scene.render();
            return;
        }

        // --- JEU NORMAL ---
        // Vitesse : course (Shift) ou marche normale
        let speed = inputMap[gameSettings.keys.sprint] ? 0.4 : 0.15;

        // Ralentissement dans l'eau
        if (stickman.position.y < waterLevel) {
            speed *= 0.15; // On devient très lent dans l'eau (15% de la vitesse)
        }

        let moveVector = new BABYLON.Vector3(0, 0, 0);

        // Récupère la direction de la caméra
        const forward = camera.getDirection(BABYLON.Axis.Z);
        forward.y = 0;
        forward.normalize();

        const right = camera.getDirection(BABYLON.Axis.X);
        right.y = 0;
        right.normalize();

        if (inputMap[gameSettings.keys.forward]) {
            moveVector.addInPlace(forward);
        }
        if (inputMap[gameSettings.keys.backward]) {
            moveVector.subtractInPlace(forward);
        }
        if (inputMap[gameSettings.keys.left]) {
            moveVector.subtractInPlace(right);
        }
        if (inputMap[gameSettings.keys.right]) {
            moveVector.addInPlace(right);
        }
        
        // Applique le mouvement si une touche est pressée
        if (moveVector.length() > 0) {
            moveVector.normalize().scaleInPlace(speed);
            stickman.lookAt(stickman.position.add(moveVector));
        }

        // --- Gestion de la gravité et du saut (plus robuste avec Raycast) ---

        // 1. Vérifier si le joueur est au sol avec un rayon vers le bas
        // On part d'un peu plus haut (0.5) pour être sûr que le rayon ne part pas de SOUS le sol si on est un peu enfoncé
        const rayOrigin = stickman.position.add(new BABYLON.Vector3(0, 0.5, 0));
        const groundRay = new BABYLON.Ray(rayOrigin, new BABYLON.Vector3(0, -1, 0), 1.5); // Rayon plus long pour détecter le sol de plus haut
        const hit = scene.pickWithRay(groundRay, (mesh) => mesh.isPickable && mesh.checkCollisions && mesh !== stickman);
        const isGrounded = hit.hit;

        // 2. Si on est au sol, on peut sauter et on annule la vitesse de chute
        if (isGrounded && verticalVelocity <= 0) {
            verticalVelocity = 0;

            if (inputMap[" "]) {
                verticalVelocity = jumpForce;
            } else {
                // Si on ne saute pas, on applique la gravité seulement si on bouge
                // Cela évite de glisser (tomber petit à petit) quand on est à l'arrêt sur une pente
                const isMoving = inputMap[gameSettings.keys.forward] || 
                                 inputMap[gameSettings.keys.backward] || 
                                 inputMap[gameSettings.keys.left] || 
                                 inputMap[gameSettings.keys.right];
                if (isMoving) {
                    verticalVelocity = gravity;
                }
            }
        } else {
            // 3. Appliquer la gravité en continu
            verticalVelocity += gravity;
        }

        // Physique de l'eau (Viscosité et chute lente)
        if (stickman.position.y < waterLevel) {
            // On coule doucement au lieu de tomber comme une pierre (résistance de l'eau)
            // Et on ne remonte plus automatiquement à la surface
            if (verticalVelocity < -0.02) verticalVelocity = -0.02;
        }

        moveVector.y = verticalVelocity;

        // 4. Déplacer le joueur en utilisant le moteur de collision pour tous les axes
        stickman.moveWithCollisions(moveVector);

        monsters.forEach(monster => {
            const direction = stickman.position.subtract(monster.position).normalize();
            monster.position.addInPlace(direction.scale(0.05));
            monster.position.y = getHeight(monster.position.x, monster.position.z) + 0.5;
        });

        // --- SYSTÈME DE TIR AUTOMATIQUE (FLAMMES) ---
        const now = Date.now();
        if (now - lastFireTime > 1000) { 
            lastFireTime = now;

            // Chercher le monstre le plus proche
            let nearestMonster = null;
            let minDistance = 40; // Portée maximum de détection

            monsters.forEach(m => {
                const dist = BABYLON.Vector3.Distance(stickman.position, m.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestMonster = m;
                }
            });

            // Déterminer la direction (vers le monstre ou tout droit)
            let targetDir;
            if (nearestMonster) {
                // On vise le centre du monstre (y + 0.5)
                const targetPos = nearestMonster.position.clone();
                targetDir = targetPos.subtract(stickman.position).normalize();
            } else {
                targetDir = stickman.getDirection(BABYLON.Axis.Z).normalize();
            }

            // Création du projectile
            const fireball = BABYLON.MeshBuilder.CreateSphere("fireball", {diameter: 0.6}, scene);
            fireball.position = stickman.position.clone();
            fireball.position.y += 1.2; // Hauteur du torse

            const fireMat = new BABYLON.StandardMaterial("fireMat", scene);
            fireMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0); 
            fireball.material = fireMat;

            projectiles.push({ mesh: fireball, direction: targetDir, life: 60 });
        }

        // Mise à jour des projectiles
        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            p.mesh.position.addInPlace(p.direction.scale(0.4)); // Vitesse du projectile
            p.life--;

            // Vérification collision avec les monstres
            for (let j = 0; j < monsters.length; j++) {
                if (p.mesh.intersectsMesh(monsters[j], true)) {
                    // Touché !
                    monsters[j].dispose(); // Supprime le monstre
                    monsters.splice(j, 1); // Retire de la liste
                    p.life = 0; // Détruit le projectile
                    break;
                }
            }

            if (p.life <= 0) {
                p.mesh.dispose();
                projectiles.splice(i, 1);
                i--;
            }
        }

        currentScene.render();
    });

    window.addEventListener("resize", function () {
        engine.resize();
    });
});