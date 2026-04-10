import { getHeight, limitRadius, waterLevel } from "./utils.js";
import { createTerrain } from "./terrain.js";
import { createPlayer } from "./player.js";
import { createMonsters, createBoss, createAmalgame, createKraken, createNuee, createMimic } from "./monsters.js";
import { createTrees } from "./trees.js";
import { createSewer } from "./sewer.js";
import { createGrass } from "./grass.js";
import { createBirds, updateBirds } from "./birds.js";
import { createWater } from "./water.js";
import { createBuildings } from "./buildings.js";
import { createBridges } from "./bridges.js";
import { createMenuScene } from "./menu.js";
import { bonusState, showUpgradeMenu, updateBonuses, resetBonuses } from "./bonus.js";

export const gameSettings = {
    fullscreen: false,
    quality: "high",
    resolution: 1.0,
    keys: {
        forward: "z",
        backward: "s",
        left: "q",
        right: "d",
        sprint: "shift",
        crouch: "c",
        showFps: true
    }
};

window.addEventListener('DOMContentLoaded', async function () {
    if (!BABYLON.GUI) {
        alert("Erreur critique : La librairie Babylon.js GUI est manquante.\nVeuillez ajouter <script src='https://cdn.babylonjs.com/gui/babylon.gui.min.js'></script> dans votre fichier HTML.");
        throw new Error("Babylon.js GUI not found");
    }

    if (!BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
        alert("Erreur critique : Le plugin de chargement GLTF/GLB est manquant.\nVeuillez ajouter <script src='https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js'></script> dans votre fichier HTML.");
        throw new Error("Babylon.js Loaders not found");
    }

    if (typeof HavokPhysics === "undefined") {
        alert("Erreur critique : Havok est manquant.\nVeuillez ajouter <script src='https://cdn.babylonjs.com/havok/HavokPhysics_umd.js'></script> dans votre fichier HTML.");
        throw new Error("Havok not found");
    }
    const havokInstance = await HavokPhysics();

    const canvas = document.getElementById("myCanvas");
    const engine = new BABYLON.Engine(canvas, true);

    let isGamePaused = false;
    let renderLoop = null;

    // Freeze/unfreeze helpers: pause animations, particles and physics stepping
    const freezeScene = (s) => {
        try {
            if (!s) return;
            try { s._pausedAnimationGroups = s.animationGroups ? [...s.animationGroups] : []; s.animationGroups.forEach(ag=>{ try { ag.pause(); } catch(e){} }); } catch(e) {}
            try { s._pausedParticleSystems = s.particleSystems ? [...s.particleSystems] : []; s.particleSystems.forEach(ps=>{ try { ps.stop(); ps._wasRunning = true; } catch(e){} }); } catch(e) {}
            try { const pe = s.getPhysicsEngine && s.getPhysicsEngine(); if (pe && pe.setTimeStep) pe.setTimeStep(0); } catch(e) {}
        } catch(e) {}
    };

    const unfreezeScene = (s) => {
        try {
            if (!s) return;
            try { if (s._pausedAnimationGroups) s._pausedAnimationGroups.forEach(ag=>{ try { ag.play(); } catch(e){} }); s._pausedAnimationGroups = null; } catch(e) {}
            try { if (s._pausedParticleSystems) { s._pausedParticleSystems.forEach(ps=>{ try { if (ps._wasRunning) ps.start(); ps._wasRunning = false; } catch(e){} }); s._pausedParticleSystems = null; } } catch(e) {}
            try { const pe = s.getPhysicsEngine && s.getPhysicsEngine(); if (pe && pe.setTimeStep) pe.setTimeStep(1/60); } catch(e) {}
        } catch(e) {}
    };

    const togglePause = () => {
        isGamePaused = !isGamePaused;
        try {
            if (isGamePaused) freezeScene(currentScene);
            else unfreezeScene(currentScene);
        } catch(e) {}
    };

    const createGameScene = function () {
        const scene = new BABYLON.Scene(engine);
        
        // Active les collisions globales pour la caméra
        scene.collisionsEnabled = true;
        
        const hk = new BABYLON.HavokPlugin(true, havokInstance);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);
        
        scene.skipPointerMovePicking = true;

        const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, 1.0, 8, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        
        camera.checkCollisions = true; // Empêche la caméra de traverser le sol
        camera.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5); // Taille de la "boîte" de la caméra
        camera.upperBetaLimit = Math.PI / 2 - 0.05;
        camera.maxZ = 2000; // On augmente la distance de vue pour voir toute la map sans coupure

        const gameUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene);
        const fpsText = new BABYLON.GUI.TextBlock();
        fpsText.text = "0 FPS";
        fpsText.color = "yellow";
        fpsText.fontSize = 24;
        fpsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        // Show FPS upper-left just below hp enabled
        fpsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        fpsText.left = "10px";
        fpsText.top = "42px";
        fpsText.bottom = null;
        fpsText.isVisible = gameSettings.showFps;
        gameUI.addControl(fpsText);

        // --- UI : KILLS AVANT LE BOSS ---
        const bossKillsText = new BABYLON.GUI.TextBlock();
        bossKillsText.text = "Kills : 150";
        bossKillsText.color = "yellow"; // Rouge
        bossKillsText.fontSize = 26;
        bossKillsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        bossKillsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        bossKillsText.left = "-20px";
        bossKillsText.top = "10px";
        gameUI.addControl(bossKillsText);

        // --- UI : BARRE D'XP ---
        const xpContainer = new BABYLON.GUI.Rectangle();
        xpContainer.width = "60%";
        xpContainer.height = "26px";
        xpContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        xpContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        xpContainer.paddingBottom = "12px";
        xpContainer.background = "rgba(0, 0, 0, 0.6)";
        xpContainer.thickness = 2;
        xpContainer.color = "#bdc3c7";
        xpContainer.cornerRadius = 12;
        xpContainer.zIndex = 50;
        gameUI.addControl(xpContainer);

        const xpBar = new BABYLON.GUI.Rectangle();
        xpBar.width = "0%"; 
        xpBar.height = "100%";
        xpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        xpBar.background = "#2980b9"; // Bleu
        xpBar.thickness = 0;
        xpBar.cornerRadius = 10;
        xpContainer.addControl(xpBar);

        // --- UI : BARRE DE VIE (TOP-LEFT) ---
        const hpContainer = new BABYLON.GUI.Rectangle();
        hpContainer.width = "220px";
        hpContainer.height = "28px";
        hpContainer.background = "rgba(0,0,0,0.5)";
        hpContainer.thickness = 2;
        hpContainer.color = "#7f8c8d";
        hpContainer.cornerRadius = 6;
        hpContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hpContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        hpContainer.left = "10px";
        hpContainer.top = "10px";
        gameUI.addControl(hpContainer);

        const hpBar = new BABYLON.GUI.Rectangle();
        hpBar.width = "100%"; // updated as percentage string when HP changes
        hpBar.height = "100%";
        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hpBar.background = "red";
        hpBar.thickness = 0;
        hpBar.cornerRadius = 6;
        hpContainer.addControl(hpBar);

        const hpText = new BABYLON.GUI.TextBlock();
        hpText.text = "HP: 100/100";
        hpText.color = "white";
        hpText.fontSize = 14;
        hpText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        hpText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        hpContainer.addControl(hpText);

        // --- EFFET DE DÉGÂT SUR LES BORDS ÉCRAN ---
        const damageVignette = new BABYLON.GUI.Rectangle("damageVignette");
        damageVignette.width = "100%";
        damageVignette.height = "100%";
        damageVignette.thickness = 30; // Bordure rouge
        damageVignette.color = "red";
        damageVignette.alpha = 0; // invisible au début
        damageVignette.isPointerBlocker = false;
        gameUI.addControl(damageVignette);

        // --- UI : BOUTON DEBUG XP (Pour tester les niveaux) ---
        const debugXpBtn = BABYLON.GUI.Button.CreateSimpleButton("debugXpBtn", "+10 XP");
        debugXpBtn.width = "100px";
        debugXpBtn.height = "50px";
        debugXpBtn.color = "white";
        debugXpBtn.background = "purple";
        debugXpBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugXpBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        debugXpBtn.left = "20px";
        debugXpBtn.thickness = 2;
        debugXpBtn.cornerRadius = 10;
        debugXpBtn.onPointerUpObservable.add(() => {
            if (!gameData || isGamePaused) return; // Désactivé si le jeu est en pause

            gameData.kills += 10; // Donne 10 kills d'un coup
            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 150;
            let killsLeft = Math.max(0, gameData.nextBossThreshold - gameData.kills);
            gameData.bossKillsText.text = "Kills : " + killsLeft;

            let currentLevelKills = gameData.kills - gameData.prevUpgradeKillCount;
            let baseRequired = gameData.nextUpgradeKillCount - gameData.prevUpgradeKillCount;
            // Plus il y a de mobs, plus le palier est difficile (chaque mob ajoute +2%)
            let difficultyMultiplier = 1 + (gameData.monsters ? gameData.monsters.length * 0.02 : 0);
            let dynamicRequired = Math.max(1, Math.floor(baseRequired * difficultyMultiplier));

            let progress = Math.min(100, (currentLevelKills / dynamicRequired) * 100);
            gameData.xpBar.width = progress + "%";

            if (currentLevelKills >= dynamicRequired) {
                showUpgradeMenu(gameData);
            }
        });
        gameUI.addControl(debugXpBtn);

        // --- BOUTONS DEBUG BOSS ---
        const bossFactories = {
            goliath: (sc) => createBoss(sc),
            amalgame: (sc) => createAmalgame(sc, 1),
            kraken: (sc) => createKraken(sc),
            nuee: (sc) => createNuee(sc),
            mimic: (sc) => createMimic(sc)
        };
        // Ordre de rotation naturelle des boss (tous les 150 kills)
        const bossRotation = ['goliath', 'amalgame', 'kraken', 'nuee', 'mimic'];

        const spawnBossLogic = (bossType) => {
            if (!gameData || isGamePaused || gameData.bossSpawned) return;
            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 150;
            gameData.kills = gameData.nextBossThreshold;
            gameData.bossKillsText.text = "Kills : 0";
            gameData.bossSpawned = true;
            
            setTimeout(() => {
                if(gameData.monsters) {
                    gameData.monsters.forEach(m => {
                        try { m.dispose(); } catch(e){}
                        if (m.physicsAgg) { try { m.physicsAgg.body.dispose(); m.physicsAgg.dispose(); } catch(e){} }
                        if (m.physicsProxy) { try { m.physicsProxy.dispose(); } catch(e){} }
                    });
                    gameData.monsters.length = 0;
                    
                    let boss = bossFactories[bossType](gameData.scene);
                    const bx = gameData.stickman.position.x + (Math.random() > 0.5 ? 30 : -30);
                    const bz = gameData.stickman.position.z + (Math.random() > 0.5 ? 30 : -30);
                    boss.position = new BABYLON.Vector3(bx, 20, bz);
                    gameData.monsters.push(boss);
                }
            }, 50);
        };

        const bossButtons = [
            { label: "Goliath", type: "goliath", color: "darkred" },
            { label: "Amalgame", type: "amalgame", color: "purple" },
            { label: "Kraken", type: "kraken", color: "teal" },
            { label: "Nuée", type: "nuee", color: "#2980b9" },
            { label: "Mimic", type: "mimic", color: "#2c3e50" }
        ];
        bossButtons.forEach((cfg, i) => {
            const btn = BABYLON.GUI.Button.CreateSimpleButton("debug_" + cfg.type, cfg.label);
            btn.width = "90px"; btn.height = "30px";
            btn.color = "white"; btn.background = cfg.color;
            btn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            btn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            btn.left = "20px"; btn.top = (50 + i * 35) + "px";
            btn.thickness = 2; btn.cornerRadius = 8; btn.fontSize = 11;
            btn.onPointerUpObservable.add(() => spawnBossLogic(cfg.type));
            gameUI.addControl(btn);
        });

        // --- UI : MENU D'AMÉLIORATION (LEVEL UP) ---
        const upgradePanel = new BABYLON.GUI.Rectangle();
        upgradePanel.width = 1;
        upgradePanel.height = 1;
        upgradePanel.background = "rgba(0, 0, 0, 0.4)"; // Plus transparent pour voir le jeu
        upgradePanel.isVisible = false;
        upgradePanel.zIndex = 100;
        gameUI.addControl(upgradePanel);

        const upgradeGrid = new BABYLON.GUI.Grid();
        upgradeGrid.addColumnDefinition(1/3);
        upgradeGrid.addColumnDefinition(1/3);
        upgradeGrid.addColumnDefinition(1/3);
        upgradeGrid.height = "50%";
        upgradePanel.addControl(upgradeGrid);

        const createUpgradeCard = (titleText, col) => {
            const card = BABYLON.GUI.Button.CreateSimpleButton("card" + col, titleText);
            card.width = "250px"; // Forme rectangulaire (style carte)
            card.height = "380px"; // Hauteur plus importante
            card.color = "white";
            card.background = "#2c3e50";
            card.cornerRadius = 20;
            card.thickness = 4;
            card.textBlock.textWrapping = true;
            card.textBlock.fontSize = 24;

            // Animation au survol (utilise des valeurs dynamiques définies par showUpgradeMenu)
            card._baseBackground = "#2c3e50";
            card._hoverBackground = "#34495e";
            card.onPointerEnterObservable.add(() => { card.background = card._hoverBackground || card._baseBackground; card.scaleX = 1.05; card.scaleY = 1.05; });
            card.onPointerOutObservable.add(() => { card.background = card._baseBackground || "#2c3e50"; card.scaleX = 1.0; card.scaleY = 1.0; });

            upgradeGrid.addControl(card, 0, col);
            return card;
        };

        const card1 = createUpgradeCard("Bonus 1\n(À venir)", 0);
        const card2 = createUpgradeCard("Bonus 2\n(À venir)", 1);
        const card3 = createUpgradeCard("Bonus 3\n(À venir)", 2);

        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.4; // Baissée pour donner plus d'impact aux ombres du soleil

        // --- Audio (files must exist in assets/sounds/) ---
        let fireSound = null, explosionSound = null, hitSound = null;
        try {
            fireSound = new BABYLON.Sound("fire", "assets/sounds/fireball.wav", scene, null, { volume: 0.6 });
            explosionSound = new BABYLON.Sound("explosion", "assets/sounds/explosion.wav", scene, null, { volume: 0.7 });
            hitSound = new BABYLON.Sound("hit", "assets/sounds/hit.wav", scene, null, { volume: 0.5 });
        } catch (e) {}

        // --- AJOUT DE LA LUMIÈRE DIRECTIONNELLE ET DES OMBRES ---
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -0.5), scene);
        dirLight.position = new BABYLON.Vector3(100, 100, 50);
        dirLight.intensity = 0.8;
        scene.dirLight = dirLight; // Stocké pour pouvoir réactiver les ombres plus tard

        if (gameSettings.quality === "high") {
            // Optimisation dynamique des ombres (Cascades) : 
            // HD de près, basse qualité de loin, ignoré derrière la caméra
            const shadowGenerator = new BABYLON.CascadedShadowGenerator(512, dirLight);
            shadowGenerator.lambda = 0.7; // Priorité à la zone proche du joueur
            shadowGenerator.shadowMaxZ = 120; // Ne calcule plus les ombres au-delà de 120m
            shadowGenerator.usePercentageCloserFiltering = true; // Flou performant
            scene.shadowGenerator = shadowGenerator; // Expose globalement au niveau de la scène
        }

        // --- POST-PROCESSING: Bloom + FXAA ---
        try {
            const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
            pipeline.bloomEnabled = true;
            pipeline.bloomThreshold = 0.7;
            pipeline.bloomWeight = 0.35;
            pipeline.fxaaEnabled = true;
            pipeline.imageProcessingEnabled = true;
            pipeline.imageProcessing.vignetteEnabled = true;
            pipeline.imageProcessing.vignetteWeight = 0.3;
        } catch (e) {
            // DefaultRenderingPipeline may be unavailable depending on included scripts
            console.warn("DefaultRenderingPipeline unavailable:", e);
        }

        // --- Fog for depth ---
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.0015;
        scene.fogColor = new BABYLON.Color3(0.08, 0.09, 0.12);

        createTerrain(scene);

        const stickman = createPlayer(scene);
        stickman.position = new BABYLON.Vector3(0, 3.0, 0); // Positionne le joueur directement au-dessus de l'égout
        
        const playerAgg = new BABYLON.PhysicsAggregate(stickman, BABYLON.PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
        playerAgg.body.setMassProperties({ inertia: new BABYLON.Vector3(0, 0, 0) });
        stickman.physicsBody = playerAgg.body;

        camera.lockedTarget = stickman;
        camera.radius = 15; // Ajuste le rayon de la caméra
        // store base radius and sprint zoom params for dynamic camera effects
        camera._baseRadius = camera.radius;
        camera._sprintZoom = 0.0; // how much the camera zooms in when sprinting (désactivé)
        camera._sprintLerp = 0.12; // smoothing
        
        // --- INITIALISATION DES VAGUES DE MONSTRES ---
        const monsters = createMonsters(scene, 10); // Vague 1 initiale

        const waveData = {
            elapsedTime: 0,
            nextWaveIndex: 1,
            waves: [
                { time: 0, count: 20 },
                { time: 10, count: 30 },   // 10 sec
                { time: 25, count: 45 },   // 25 sec
                { time: 50, count: 70 }    // 50 sec
            ],
            last2MinTick: 120,
            last5MinTick: 120,
            currentBaseCount: 70
        };

        createTrees(scene, 300, gameSettings.quality); // Augmentation massive du nombre d'arbres

        const { cover } = createSewer(scene);

        createGrass(scene, 1000, gameSettings.quality);

        let birds = [];
        if (gameSettings.quality !== "low") {
            birds = createBirds(scene, 50);
        }

        createWater(scene);

        createBuildings(scene, 30);

        createBridges(scene, 10);

        const inputMap = {};
        window.addEventListener("keydown", (evt) => {
            const key = evt.key.toLowerCase();
            if (key === gameSettings.keys.crouch && !inputMap[key]) {
                if (gameData && gameData.stickman) {
                    gameData.stickman.isCrouched = !gameData.stickman.isCrouched;
                }
            }
            inputMap[key] = true;
        });
        window.addEventListener("keyup", (evt) => {
            inputMap[evt.key.toLowerCase()] = false;
        });
        window.addEventListener("blur", () => {
            for (const key in inputMap) inputMap[key] = false;
        });

        const pauseTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("PauseUI", true, scene);

        const pausePanel = new BABYLON.GUI.StackPanel();
        pausePanel.width = "450px";
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
        fpsCheckbox.onIsCheckedChangedObservable.add(v => {
            gameSettings.showFps = v;
            if (fpsText) {
                fpsText.isVisible = v;
                if (v) {
                    fpsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                    fpsText.bottom = null;
                    fpsText.top = "42px";
                    fpsText.left = "10px";
                }
            }
        });
        videoRow.addControl(fpsCheckbox);

        pausePanel.addControl(createHeader("QUALITÉ"));
        const qRow = new BABYLON.GUI.StackPanel();
        qRow.isVertical = false; qRow.height = "40px";
        pausePanel.addControl(qRow);

        const qualityBtns = [];
        ["Low", "Medium", "High"].forEach(q => {
            const btn = BABYLON.GUI.Button.CreateSimpleButton("q"+q, q);
            btn.width = "80px"; btn.height = "30px"; btn.color = "white";
            btn.background = gameSettings.quality.toLowerCase() === q.toLowerCase() ? "#3498db" : "#7f8c8d";
            btn.onPointerUpObservable.add(() => {
                const newQuality = q.toLowerCase();
                if (gameSettings.quality === newQuality) return;

                gameSettings.quality = newQuality;
                gameSettings.resolution = 1.0; // On conserve toujours la résolution native

                // Mise à jour visuelle
                qualityBtns.forEach(b => b.background = "#7f8c8d");
                btn.background = "#3498db";

                // --- HOT-SWAP DES PARAMÈTRES GRAPHIQUES ---
                
                // 1. Ombres
                if (newQuality === "high") {
                    if (!scene.shadowGenerator && scene.dirLight) {
                        const shadowGenerator = new BABYLON.CascadedShadowGenerator(512, scene.dirLight);
                        shadowGenerator.lambda = 0.7;
                        shadowGenerator.shadowMaxZ = 120; // Ne calcule plus les ombres au-delà de 120m
                        shadowGenerator.usePercentageCloserFiltering = true;
                        scene.shadowGenerator = shadowGenerator;

                        // Rétablir les ombres sur les éléments principaux de la carte
                        scene.meshes.forEach(m => {
                            if (m.name === "stickman" || m.name.includes("building") || m.name.includes("bridge")) {
                                shadowGenerator.addShadowCaster(m, true);
                            }
                        });
                    }
                } else {
                    if (scene.shadowGenerator) {
                        scene.shadowGenerator.dispose();
                        scene.shadowGenerator = null;
                    }
                }

                // 2. Oiseaux
                if (newQuality === "low") {
                    if (gameData && gameData.birds) {
                        gameData.birds.forEach(b => b.dispose());
                        gameData.birds = [];
                    }
                } else {
                    if (gameData && (!gameData.birds || gameData.birds.length === 0)) {
                        gameData.birds = createBirds(scene, 50);
                    }
                }

                // 3. Arbres (Rechargement dynamique)
                createTrees(scene, 600, newQuality); // Augmentation massive du nombre d'arbres

                // 4. Herbe (Désactivée en Low)
                createGrass(scene, 1000, newQuality);
            });
            qualityBtns.push(btn);
            qRow.addControl(btn);
        });

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
        addKeySetting("S'accroupir", "crouch");

        const resumeBtn = BABYLON.GUI.Button.CreateSimpleButton("resume", "REPRENDRE");
        resumeBtn.height = "40px"; resumeBtn.width = "200px"; resumeBtn.color = "white";
        resumeBtn.background = "#27ae60"; resumeBtn.marginTop = "10px";
        resumeBtn.onPointerUpObservable.add(() => {
            isGamePaused = false;
            pausePanel.isVisible = false;
            try { unfreezeScene(currentScene); } catch(e) {}
        });
        pausePanel.addControl(resumeBtn);

        // --- UI : ECRAN DE FIN (MASQUÉ PAR DÉFAUT) ---
        const endPanel = new BABYLON.GUI.Rectangle();
        endPanel.width = 0.6;
        endPanel.height = 0.5;
        endPanel.background = "rgba(0,0,0,0.7)";
        endPanel.cornerRadius = 12;
        endPanel.thickness = 2;
        endPanel.color = "#e74c3c";
        endPanel.isVisible = false;
        endPanel.zIndex = 200;
        gameUI.addControl(endPanel);

        const endStack = new BABYLON.GUI.StackPanel();
        endPanel.addControl(endStack);

        const endTitle = new BABYLON.GUI.TextBlock();
        endTitle.text = "Vous êtes mort";
        endTitle.color = "white";
        endTitle.fontSize = 36;
        endTitle.height = "80px";
        endStack.addControl(endTitle);

        const endMsg = new BABYLON.GUI.TextBlock();
        endMsg.text = "Retour au lobby ou recommencer";
        endMsg.color = "#dddddd";
        endMsg.fontSize = 20;
        endMsg.height = "40px";
        endStack.addControl(endMsg);

        const btnRow = new BABYLON.GUI.StackPanel();
        btnRow.isVertical = false;
        btnRow.height = "80px";
        endStack.addControl(btnRow);

        const toLobbyBtn = BABYLON.GUI.Button.CreateSimpleButton("toLobby", "Retour au Lobby");
        toLobbyBtn.width = "200px";
        toLobbyBtn.height = "50px";
        toLobbyBtn.color = "white";
        toLobbyBtn.background = "#2ecc71";
        toLobbyBtn.onPointerUpObservable.add(() => {
            try {
                if (currentScene) currentScene.dispose();
            } catch (e) {}
            currentScene = createMenuScene(engine, startGame, gameSettings);
            gameData = null;
            isGamePaused = false;
        });
        btnRow.addControl(toLobbyBtn);

        const restartBtn = BABYLON.GUI.Button.CreateSimpleButton("restart", "Recommencer");
        restartBtn.width = "200px";
        restartBtn.height = "50px";
        restartBtn.color = "white";
        restartBtn.background = "#e67e22";
        restartBtn.left = "20px";
        restartBtn.onPointerUpObservable.add(() => {
            // Redémarre la partie
            startGame();
        });
        btnRow.addControl(restartBtn);


        // --- Utility: screen shake (exposed on sceneData below)
        const shakeCamera = (intensity = 0.3, duration = 300) => {
            const cam = camera;
            const start = Date.now();
            const originalPos = cam.position.clone();
            const shake = () => {
                const now = Date.now();
                const t = (now - start) / duration;
                if (t >= 1) {
                    cam.position.copyFrom(originalPos);
                    return;
                }
                const decay = 1 - t;
                cam.position.x = originalPos.x + (Math.random() * 2 - 1) * intensity * decay;
                cam.position.y = originalPos.y + (Math.random() * 2 - 1) * intensity * decay;
                cam.position.z = originalPos.z + (Math.random() * 2 - 1) * intensity * decay;
                requestAnimationFrame(shake);
            };
            shake();
        };

        // Center hit marker (brief UI feedback when player damages a monster)
        let hitMarker = null;
        try {
            hitMarker = new BABYLON.GUI.TextBlock();
            hitMarker.text = "+";
            hitMarker.color = "white";
            hitMarker.fontSize = 44;
            hitMarker.isVisible = false;
            hitMarker.alpha = 0;
            hitMarker.zIndex = 250;
            hitMarker.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            hitMarker.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            gameUI.addControl(hitMarker);
        } catch(e) {}

        const showHitMarker = () => {
            try {
                if (!hitMarker) return;
                hitMarker.isVisible = true;
                hitMarker.alpha = 1;
                hitMarker.scaleX = hitMarker.scaleY = 1.6;
                const start = Date.now();
                const duration = 160;
                const anim = () => {
                    const t = (Date.now() - start) / duration;
                    if (t >= 1) {
                        try { hitMarker.isVisible = false; hitMarker.alpha = 0; } catch(e) {}
                        return;
                    }
                    const s = 1.6 - 0.6 * t;
                    try { hitMarker.scaleX = hitMarker.scaleY = s; hitMarker.alpha = 1 - t; } catch(e) {}
                    requestAnimationFrame(anim);
                };
                anim();
            } catch(e) {}
        };

        const sceneData = { scene, stickman, monsters, inputMap, camera, cover, birds, fpsText, bossKillsText, pausePanel, upgradePanel, xpBar, waveData, card1, card2, card3, kills: 0, prevUpgradeKillCount: 0, nextUpgradeKillCount: 20, health: 100, maxHealth: 100, hpBar: hpBar, hpText: hpText, fireSound, explosionSound, hitSound, pickups: [], timeScale: 1, showHitMarker, damageVignette };

        // attach shake function to sceneData so caller gets it
        sceneData.shakeCamera = shakeCamera;

        // Fast-forward button next to debug XP for accelerating game time (waves, projectiles, pickups...)
        try {
            const fastForwardBtn = BABYLON.GUI.Button.CreateSimpleButton("fastFwdBtn", "x1");
            fastForwardBtn.width = "100px"; fastForwardBtn.height = "50px"; fastForwardBtn.color = "white";
            fastForwardBtn.background = "purple";
            fastForwardBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            fastForwardBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            fastForwardBtn.left = "140px";
            fastForwardBtn.thickness = 2;
            fastForwardBtn.cornerRadius = 10;
            let ffActive = false;
            fastForwardBtn.onPointerUpObservable.add(() => {
                ffActive = !ffActive;
                sceneData.timeScale = ffActive ? 4 : 1;
                fastForwardBtn.textBlock.text = ffActive ? "x4" : "x1";
                fastForwardBtn.background = ffActive ? "#e67e22" : "purple";
            });
            gameUI.addControl(fastForwardBtn);
        } catch (e) {}

        // Méthode pour afficher l'écran de fin depuis l'extérieur
        sceneData.isDead = false;
        sceneData.showDeathScreen = () => {
            if (sceneData.isDead) return;
            sceneData.isDead = true;
            endPanel.isVisible = true;
            isGamePaused = true;
            try { freezeScene(scene); } catch(e) {}
        };

        sceneData.pauseGame = () => { 
            isGamePaused = true; 
            try { freezeScene(scene); } catch(e) {}
        };

        sceneData.selectUpgrade = () => {
            sceneData.upgradePanel.isVisible = false;
            isGamePaused = false;
            // unfreeze player when leaving upgrade menu
            try { sceneData._playerFrozen = false; } catch(e) {}
            try { unfreezeScene(currentScene); } catch(e) {}
            
            sceneData.prevUpgradeKillCount = sceneData.nextUpgradeKillCount;

            // Augmentation incrémentale du palier requis pour la prochaine amélioration
            if (sceneData.nextUpgradeKillCount < 100) sceneData.nextUpgradeKillCount += 30; // 20, 50, 80...
            else if (sceneData.nextUpgradeKillCount < 500) sceneData.nextUpgradeKillCount += 100; // 180, 280...
            else sceneData.nextUpgradeKillCount += 200; // 680, 880...
            
            sceneData.xpBar.width = "0%";
        };

        // expose shake for other modules (assigned after function declaration)
        return sceneData;
    };

    let currentScene = null;
    let gameData = null;
    let projectiles = [];
    let lastFireTime = 0;

    const startGame = () => {
        if (currentScene) currentScene.dispose();
        
        resetBonuses();
        const data = createGameScene();
        currentScene = data.scene;
        gameData = data;
        isGamePaused = false;
        projectiles = [];
        lastFireTime = 0;
    };

    currentScene = createMenuScene(engine, startGame, gameSettings); // Initialise la scène du menu

    window.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape" && gameData) {
            if (gameData.upgradePanel && gameData.upgradePanel.isVisible) return; // Empêche de quitter le menu d'amélioration avec Echap
            togglePause();
            if (gameData.pausePanel) {
                gameData.pausePanel.isVisible = isGamePaused;
            }
        }
    });

    renderLoop = function () {
        try {
            if (!currentScene) return;

            if (engine.getHardwareScalingLevel() !== gameSettings.resolution) {
                engine.setHardwareScalingLevel(gameSettings.resolution);
            }

            if (!gameData) {
                if (currentScene.fpsText) {
                    currentScene.fpsText.text = engine.getFps().toFixed() + " FPS";
                    currentScene.fpsText.isVisible = gameSettings.showFps;
                }
                currentScene.render();
                return;
            }

            if (gameData.fpsText) {
                gameData.fpsText.text = engine.getFps().toFixed() + " FPS";
                gameData.fpsText.isVisible = gameSettings.showFps;
            }

            if (isGamePaused) {
                currentScene.render();
                return;
            }
        } catch(e) {
            // continue to main loop body
        }

        // main loop body
        if (!currentScene) return;

        if (engine.getHardwareScalingLevel() !== gameSettings.resolution) {
            engine.setHardwareScalingLevel(gameSettings.resolution);
        }

        if (!gameData) {
            if (currentScene.fpsText) {
                currentScene.fpsText.text = engine.getFps().toFixed() + " FPS";
                currentScene.fpsText.isVisible = gameSettings.showFps;
            }
            currentScene.render();
            return;
        }

        if (gameData.fpsText) {
            gameData.fpsText.text = engine.getFps().toFixed() + " FPS";
            gameData.fpsText.isVisible = gameSettings.showFps;
        }

        if (isGamePaused) {
            currentScene.render();
            return;
        }

        const { stickman, monsters, inputMap, camera, cover, birds, scene, waveData } = gameData;

        // ---- LOGIQUE GLOBALE DE MORT ET D'EFFET DE DÉGÂTS ----
        if (gameData.health <= 0 && !gameData.isDead) { // Vérification de mort globale
            if (bonusState && bonusState.reviveLevel > 0 && !bonusState._reviveUsed) {
                bonusState._reviveUsed = true;
                gameData.health = Math.max(1, Math.floor(gameData.maxHealth * 0.5));
                if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                // Popup visuel du revive
                try {
                    const popup = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("reviveUI");
                    const txt = new BABYLON.GUI.TextBlock();
                    txt.text = "REVIVE!"; txt.color = "lightgreen"; txt.fontSize = 40;
                    popup.addControl(txt);
                    setTimeout(() => { popup.removeControl(txt); popup.dispose(); }, 1500);
                } catch(e) {}
            } else {
                if (gameData.showDeathScreen) gameData.showDeathScreen();
            }
        }

        // Effet de sang / vignette sur les bords si HP <= 50%
        if (gameData.damageVignette && !gameData.isDead) {
            if (gameData.health <= gameData.maxHealth * 0.5 && gameData.health > 0) {
                const ratio = (gameData.maxHealth * 0.5 - gameData.health) / (gameData.maxHealth * 0.5);
                gameData.damageVignette.alpha = Math.max(0, ratio * 0.8);
            } else {
                gameData.damageVignette.alpha = 0;
            }
        }

        // Dynamic camera: slight zoom-in when sprinting for speed impression
        try {
            const sprintPressed = !!inputMap[gameSettings.keys.sprint];
            const base = (camera && camera._baseRadius !== undefined) ? camera._baseRadius : 15;
            const sprintZoom = (camera && camera._sprintZoom !== undefined) ? camera._sprintZoom : 0;
            const lerp = (camera && camera._sprintLerp !== undefined) ? camera._sprintLerp : 0.12;
            const targetRadius = sprintPressed ? (base - sprintZoom) : base;
            if (camera && sprintZoom > 0) {
                camera.radius += (targetRadius - camera.radius) * lerp;
            } else if (camera && camera.radius !== base) {
                // Reset progressif si pas de zoom sprint
                camera.radius += (base - camera.radius) * lerp;
            }
        } catch(e) {}
        if (birds && birds.length > 0) {
            updateBirds(birds, stickman.position); // Les oiseaux réagissent à la position du joueur
        }
        
        // --- GESTION DU LOD (Level Of Detail) DES ARBRES ---
        try {
            if (scene._treeObjects && stickman) {
                const lodDist = 150;
                const fadeZone = 15; // Transition douce sur 15 mètres
                const shadowDistSq = 70 * 70; // 70 mètres pour désactiver les ombres des arbres
                const maxDistSq = 300 * 300; // 300 mètres max pour désactiver totalement l'arbre
                scene._treeObjects.forEach(tree => {
                    const activeMesh = tree.lowMesh || tree.mesh;
                    if (!activeMesh) return;

                    const distSq = BABYLON.Vector3.DistanceSquared(stickman.position, activeMesh.position);
                    
                    // 1. Culling : Désactivation totale si très loin (Economise énormément de CPU)
                    if (distSq > maxDistSq) {
                        if (tree.highMesh && tree.highMesh.isEnabled()) tree.highMesh.setEnabled(false);
                        if (tree.lowMesh && tree.lowMesh.isEnabled()) tree.lowMesh.setEnabled(false);
                        if (tree.mesh && tree.mesh.isEnabled()) tree.mesh.setEnabled(false);
                        
                        // Désactiver les ombres par sécurité
                        if (scene.shadowGenerator && tree.highMesh && tree.highMesh._castsShadow) {
                            scene.shadowGenerator.removeShadowCaster(tree.highMesh, true);
                            tree.highMesh._castsShadow = false;
                        }
                        return; // On stoppe le calcul ici, on passe à l'arbre suivant !
                    }
                    
                    // Si qualité Low (pas de highMesh), on s'assure juste que l'arbre est visible
                    if (!tree.highMesh) {
                        if (!tree.mesh.isEnabled()) tree.mesh.setEnabled(true);
                        return;
                    }

                    // --- Suite : Uniquement si High/Medium Quality avec LOD ---
                    if (tree.baseScale) {
                        // 2. LOD Géométrie avec transition fluide (Cross-Scale)
                        const dist = Math.sqrt(distSq);
                        if (dist > lodDist + fadeZone) { 
                            // Complètement loin (Low uniquement)
                            if (tree.highMesh.isEnabled()) tree.highMesh.setEnabled(false);
                            if (!tree.lowMesh.isEnabled()) {
                                tree.lowMesh.setEnabled(true);
                                tree.lowMesh.scaling.x = tree.baseScale;
                                tree.lowMesh.scaling.y = tree.baseScale;
                                tree.lowMesh.scaling.z = tree.baseScale;
                            }
                        } else if (dist < lodDist - fadeZone) { 
                            // Complètement proche (High uniquement)
                            if (!tree.highMesh.isEnabled()) {
                                tree.highMesh.setEnabled(true);
                                tree.highMesh.scaling.x = tree.baseScale;
                                tree.highMesh.scaling.y = tree.baseScale;
                                tree.highMesh.scaling.z = tree.baseScale;
                            }
                            if (tree.lowMesh.isEnabled()) tree.lowMesh.setEnabled(false);
                        } else { 
                            // Zone de transition (les deux s'affichent et changent de taille)
                            if (!tree.highMesh.isEnabled()) tree.highMesh.setEnabled(true);
                            if (!tree.lowMesh.isEnabled()) tree.lowMesh.setEnabled(true);
                            
                            const ratio = (dist - (lodDist - fadeZone)) / (fadeZone * 2);
                            
                            // L'arbre low grandit quand on s'éloigne
                            const lowScale = tree.baseScale * ratio;
                            tree.lowMesh.scaling.x = lowScale;
                            tree.lowMesh.scaling.y = lowScale;
                            tree.lowMesh.scaling.z = lowScale;
                            
                            // L'arbre high rétrécit quand on s'éloigne
                            const highScale = tree.baseScale * (1.0 - ratio);
                            tree.highMesh.scaling.x = highScale;
                            tree.highMesh.scaling.y = highScale;
                            tree.highMesh.scaling.z = highScale;
                        }
                        
                        // 3. LOD Ombres (Seuls les arbres proches projettent des ombres)
                        if (scene.shadowGenerator) {
                            if (distSq > shadowDistSq) {
                                if (tree.highMesh._castsShadow) {
                                    scene.shadowGenerator.removeShadowCaster(tree.highMesh, true);
                                    tree.highMesh._castsShadow = false;
                                }
                            } else {
                                if (!tree.highMesh._castsShadow) {
                                    scene.shadowGenerator.addShadowCaster(tree.highMesh, true);
                                    tree.highMesh._castsShadow = true;
                                }
                            }
                        }
                    }
                });
            }
        } catch (e) {}

        // Wind sway for trees and grass
        try {
            const tnow = Date.now();
            if (scene._swayTrees) {
                scene._swayTrees.forEach(tr => {
                    const s = tr.swayData;
                    try { s.phase += s.speed * (engine.getDeltaTime() * (gameData && gameData.timeScale ? gameData.timeScale : 1)); } catch(e) {}
                    tr.rotation.z = (s.baseRotZ || 0) + Math.sin(s.phase) * s.amount;
                });
            }
            if (scene._swayGrass && stickman) {
                const grassMaxDistSq = 150 * 150; // 150 mètres max (l'herbe est invisible au-delà de toute façon)
                scene._swayGrass.forEach(g => {
                    const distSq = BABYLON.Vector3.DistanceSquared(stickman.position, g.position);
                    
                    // Culling : Désactivation totale de l'herbe lointaine
                    if (distSq > grassMaxDistSq) {
                        if (g.isEnabled()) g.setEnabled(false);
                        return; // On stoppe le calcul de l'animation de vent pour cette herbe !
                    } else {
                        if (!g.isEnabled()) g.setEnabled(true);
                    }

                    const s = g.swayData;
                    try { s.phase += s.speed * (engine.getDeltaTime() * (gameData && gameData.timeScale ? gameData.timeScale : 1)); } catch(e) {}
                    g.rotation.x = Math.sin(s.phase) * s.amount;
                });
            }
        } catch (e) {}

        const handleMonsterKill = (j) => {
            const m = monsters[j];
            try {
                if (m.physicsAgg) {
                    try { m.physicsAgg.body.dispose(); } catch(e) {}
                    try { m.physicsAgg.dispose && m.physicsAgg.dispose(); } catch(e) {}
                    m.physicsAgg = null;
                } else if (m.physicsBody) {
                    try { m.physicsBody.dispose(); } catch(e) {}
                    m.physicsBody = null;
                }
                if (m.physicsProxy) {
                    try { m.physicsProxy.dispose(); } catch(e) {}
                    m.physicsProxy = null;
                }
            
            // Nettoyage des bonus copiés si c'était un Mimic
            if (m._type === 'mimic') {
                try { if (m._auraMesh) m._auraMesh.dispose(); } catch(e){}
                try { if (m._sawsMeshes) m._sawsMeshes.forEach(s => s.dispose()); } catch(e){}
                try { if (m._activeMissiles) m._activeMissiles.forEach(p => p.mesh.dispose()); } catch(e){}
                try { if (m._activeZones) m._activeZones.forEach(z => z.mesh.dispose()); } catch(e){}
            }
            
            } catch(e) {}

            // Very small chance to spawn a heal pack (+10 HP) at the monster position before disposing
            try {
                const DROP_CHANCE = 0.0005; // 0.05% chance
                if (m && m.position && Math.random() < DROP_CHANCE) {
                    try {
                        const dropPos = m.position.clone();
                        const pickup = BABYLON.MeshBuilder.CreateSphere("healPack_" + Date.now(), { diameter: 0.6 }, scene);
                        pickup.position = dropPos;
                        const pMat = new BABYLON.StandardMaterial("healPackMat", scene);
                        pMat.emissiveColor = new BABYLON.Color3(0.25, 1.0, 0.4);
                        pMat.diffuseColor = new BABYLON.Color3(0.12, 0.6, 0.2);
                        pMat.alpha = 0.95;
                        pickup.material = pMat;
                        pickup.isPickable = false;
                        pickup.renderingGroupId = 1;
                        if (!gameData.pickups) gameData.pickups = [];
                        gameData.pickups.push({ mesh: pickup, life: 30.0 });
                    } catch (e) {}
                }
            } catch(e) {}
            try { monsters[j].dispose(); } catch(e) {}
            // remove from registered list if present
            try {
                if (scene._registeredMonsters) {
                    const idx = scene._registeredMonsters.indexOf(monsters[j]);
                    if (idx !== -1) scene._registeredMonsters.splice(idx, 1);
                }
            } catch(e) {}
            monsters.splice(j, 1);
            
            gameData.kills++;
            // XP boost handled as extra progress below (so it participates in dynamicRequired calc)

            // Magnet: small heal on kill if magnetLevel present
            try {
                if (bonusState.magnetLevel > 0 && typeof gameData.health === 'number') {
                    const heal = Math.floor(2 * bonusState.magnetLevel);
                    gameData.health = Math.min(gameData.maxHealth, gameData.health + heal);
                    if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                    if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                }
            } catch(e) {}

            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 150;

        const bossTypes = ['boss', 'amalgame', 'kraken', 'nuee', 'mimic'];
            const isBossType = m && bossTypes.includes(m._type);

            if (isBossType) {
                // Pour l'Amalgame, on ne valide que si c'était le DERNIER morceau
                let bossPartsLeft = 0;
                if (m._type === 'amalgame') {
                    bossPartsLeft = monsters.filter(x => x._type === 'amalgame').length;
                }
                
                if (bossPartsLeft === 0) {
                    gameData.bossSpawned = false;
                    gameData.nextBossThreshold += 150;
                    
                    // Nettoyer les effets du Kraken (remettre l'eau)
                    if (m._type === 'kraken' && gameData.currentWaterLevel !== undefined) {
                        gameData.currentWaterLevel = waterLevel;
                        try { if (scene.getMeshByName("water")) scene.getMeshByName("water").position.y = waterLevel; } catch(e){}
                    }
                    
                    if (gameData.bossKillsText) {
                        gameData.bossKillsText.text = "Kills : " + Math.max(0, gameData.nextBossThreshold - gameData.kills);
                        gameData.bossKillsText.color = "yellow";
                    }
                }
            } else {
                let killsLeft = Math.max(0, gameData.nextBossThreshold - gameData.kills);
                if(gameData.bossKillsText) gameData.bossKillsText.text = "Kills : " + killsLeft;

                if (killsLeft === 0 && !gameData.bossSpawned) {
                    gameData.bossSpawned = true;
                    setTimeout(() => {
                        monsters.forEach(m => {
                            try { m.dispose(); } catch(e){}
                            if (m.physicsAgg) { try { m.physicsAgg.body.dispose(); m.physicsAgg.dispose(); } catch(e){} }
                            if (m.physicsProxy) { try { m.physicsProxy.dispose(); } catch(e){} }
                        });
                        monsters.length = 0;
                        
                        // Rotation sur 5 boss
                        const bossRotationOrder = ['goliath', 'amalgame', 'kraken', 'nuee', 'mimic'];
                        const bossFactoriesLocal = {
                            goliath: () => createBoss(scene),
                            amalgame: () => createAmalgame(scene, 1),
                            kraken: () => createKraken(scene),
                            nuee: () => createNuee(scene),
                            mimic: () => createMimic(scene)
                        };
                        let bossIndex = (Math.floor(gameData.kills / 150) - 1) % 5;
                        if (bossIndex < 0) bossIndex = 0;
                        let boss = bossFactoriesLocal[bossRotationOrder[bossIndex]]();
                        
                        const bx = stickman.position.x + (Math.random() > 0.5 ? 30 : -30);
                        const bz = stickman.position.z + (Math.random() > 0.5 ? 30 : -30);
                        boss.position = new BABYLON.Vector3(bx, 20, bz);
                        monsters.push(boss);
                    }, 50);
                }
            }
            let currentLevelKills = gameData.kills - gameData.prevUpgradeKillCount;
            let baseRequired = gameData.nextUpgradeKillCount - gameData.prevUpgradeKillCount;
            // Apply xpBoost as additional fractional progress towards next upgrade
            if (bonusState.xpBoostLevel > 0) {
                currentLevelKills += bonusState.xpBoostLevel * 0.5;
            }
            // Ajuste la difficulté de niveau en fonction du nombre de monstres actifs
            let difficultyMultiplier = 1 + (gameData.monsters ? gameData.monsters.length * 0.02 : 0);
            let dynamicRequired = Math.max(1, Math.floor(baseRequired * difficultyMultiplier));
            let progress = Math.min(100, (currentLevelKills / dynamicRequired) * 100);
            if(gameData.xpBar) gameData.xpBar.width = progress + "%";

            if (currentLevelKills >= dynamicRequired && !gameData.upgradePanel.isVisible) {
                showUpgradeMenu(gameData);
            }
        };

        // expose shake for other modules (already attached to returned sceneData)

        // time scaling: use gameData.timeScale to accelerate dt for fast-forward
        const timeScale = (gameData && gameData.timeScale) ? gameData.timeScale : 1;
        const deltaMs = engine.getDeltaTime() * timeScale;
        const dt = deltaMs / 1000;

        updateBonuses(gameData, dt, handleMonsterKill);

        // --- GESTION DU BROUILLARD DYNAMIQUE ET DE LA NUIT (POUR LE MIMIC) ---
        const isMimicAlive = monsters.some(m => m._type === 'mimic');
        const targetFogDensity = isMimicAlive ? 0.015 : 0.0015; // Réduit pour qu'on puisse quand même voir
        const targetFogColor = isMimicAlive ? new BABYLON.Color3(0, 0, 0) : new BABYLON.Color3(0.08, 0.09, 0.12);
        const targetLightIntensity = isMimicAlive ? 0.1 : 0.8; // Baisse la lumière pour simuler la nuit profonde
        
        if (Math.abs(scene.fogDensity - targetFogDensity) > 0.00001) {
            // Transition en douceur du brouillard (opacité et couleur)
            scene.fogDensity += (targetFogDensity - scene.fogDensity) * (dt * 0.5);
            scene.fogColor = BABYLON.Color3.Lerp(scene.fogColor, targetFogColor, dt * 0.5);
            scene.clearColor = new BABYLON.Color4(scene.fogColor.r, scene.fogColor.g, scene.fogColor.b, 1.0); // Le ciel s'assombrit
            if (scene.dirLight) {
                scene.dirLight.intensity += (targetLightIntensity - scene.dirLight.intensity) * (dt * 0.5);
            }
        }

        // --- GESTION DES VAGUES ---
        waveData.elapsedTime += dt;
        const timeInSeconds = waveData.elapsedTime;

        if (!gameData.bossSpawned && waveData.nextWaveIndex < waveData.waves.length) {
            const nextWave = waveData.waves[waveData.nextWaveIndex];
            if (timeInSeconds >= nextWave.time) {
                const newMobs = createMonsters(scene, nextWave.count);
                monsters.push(...newMobs);
                waveData.nextWaveIndex++;
            }
        } else if (!gameData.bossSpawned) {
            // Cycle infini : Chaque 1 min (60s) au lieu de 2 min
            if (timeInSeconds - waveData.last2MinTick >= 60) {
                waveData.last2MinTick += 60;
                waveData.currentBaseCount += 20;
                const newMobs = createMonsters(scene, waveData.currentBaseCount);
                monsters.push(...newMobs);
            }
            // Cycle infini : Chaque 2.5 min (150s) au lieu de 5 min
            if (timeInSeconds - waveData.last5MinTick >= 150) {
                waveData.last5MinTick += 150;
                waveData.currentBaseCount += 40; // Bonus de difficulté massif
                const newMobs = createMonsters(scene, waveData.currentBaseCount);
                monsters.push(...newMobs);
            }
        }
        // --------------------------

        let speed = 8.0; // Vitesse réajustée pour les vélocités physiques
        if (stickman.isCrouched) {
            speed = 3.0;
        } else if (inputMap[gameSettings.keys.sprint]) {
            speed = 14.0;
        }

        if (stickman.position.y < waterLevel) {
            speed *= 0.3;
        }

        // Boots: increase movement speed
        if (bonusState.speedBootsLevel && bonusState.speedBootsLevel > 0) {
            speed *= 1 + 0.12 * bonusState.speedBootsLevel;
        }

        let moveVector = new BABYLON.Vector3(0, 0, 0);

        const forward = new BABYLON.Vector3(-Math.cos(camera.alpha), 0, -Math.sin(camera.alpha));
        const right = new BABYLON.Vector3(-Math.sin(camera.alpha), 0, Math.cos(camera.alpha));

        const targetYaw = Math.atan2(forward.x, forward.z);
        if (stickman.rotationQuaternion) {
            BABYLON.Quaternion.FromEulerAnglesToRef(0, targetYaw, 0, stickman.rotationQuaternion);
        } else {
            stickman.rotation.y = targetYaw;
            stickman.rotation.x = 0;
            stickman.rotation.z = 0;
        }

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
        
        if (moveVector.length() > 0) {
            moveVector.normalize().scaleInPlace(speed);
        }

        const rayOrigin = stickman.position.clone();
        const groundRay = new BABYLON.Ray(rayOrigin, new BABYLON.Vector3(0, -1, 0), 2.2);
        // Optimisation CPU : Le rayon ne scanne QUE le sol et les bâtiments, ignorant l'herbe et les arbres
        const hit = scene.pickWithRay(groundRay, (mesh) => {
            return mesh.name === "ground" || mesh.name.startsWith("building");
        });
        const isGrounded = hit.hit;

        if (!stickman.physicsBody) {
            scene.render();
            return;
        }
        const currentVel = stickman.physicsBody.getLinearVelocity();

        // --- ANIMATION DYNAMIQUE (PAS STATIQUE) ET ADAPTATION À LA CAMÉRA ---
        if (stickman.limbs) {
            // Inclinaison de la caméra (pitch)
            const targetPitch = Math.PI / 2 - camera.beta; 
            
            // Limite de l'inclinaison pour éviter que le personnage ne se retrouve la tête en bas
            // On limite le pitch entre -60° et +60° (Math.PI / 3)
            const maxPitch = Math.PI / 3;
            const clampedPitch = Math.max(-maxPitch, Math.min(maxPitch, targetPitch));

            // La tête regarde exactement là où la caméra pointe (avec la limite)
            stickman.limbs.head.rotation.x = clampedPitch; 
            
            // Le corps (torse) s'incline pour accompagner le mouvement
            if (stickman.limbs.torso) {
                stickman.limbs.torso.rotation.x = clampedPitch * 0.5; // On l'incline à moitié pour un effet naturel
            }

            // Vitesse de déplacement horizontale
            const horizSpeed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z);
            const walkCycle = Date.now() * 0.015;

            if (horizSpeed > 1) {
                // Animation de marche : balancement des jambes
                const swingAnim = Math.sin(walkCycle) * 0.8;
                stickman.limbs.leftLeg.rotation.x = swingAnim;
                stickman.limbs.rightLeg.rotation.x = -swingAnim;
                
                // Les bras pointent vers la cible (clampedPitch) MAIS se balancent aussi en marchant
                stickman.limbs.leftArm.rotation.x = -swingAnim * 0.5 + clampedPitch;
                stickman.limbs.rightArm.rotation.x = swingAnim * 0.5 + clampedPitch;
            } else {
                // Arrêt : retour amorti à la position neutre pour les jambes
                stickman.limbs.leftLeg.rotation.x *= 0.8;
                stickman.limbs.rightLeg.rotation.x *= 0.8;
                
                // Les bras pointent précisément dans l'axe de visée de la caméra (prêt à tirer)
                stickman.limbs.leftArm.rotation.x = clampedPitch;
                stickman.limbs.rightArm.rotation.x = clampedPitch;
            }
        }

        if (stickman.animationGroups && stickman.animationGroups.length > 0) {
            let targetAnimName = "Idle";
            
            if (!isGrounded || currentVel.y > 1) {
                targetAnimName = "Jump";
            } else if (stickman.isCrouched) {
                targetAnimName = "Crouch";
            } else if (moveVector.length() > 0.001) {
                if (inputMap[gameSettings.keys.sprint]) {
                    targetAnimName = "Running";
                } else {
                    targetAnimName = "Walking";
                }
            }

            if (stickman.currentAnimName !== targetAnimName) {
                const targetGroup = stickman.animationGroups.find(ag => ag.name === targetAnimName || ag.name.toLowerCase().includes(targetAnimName.toLowerCase()));
                
                if (targetGroup) {
                    if (!targetGroup.isPlaying) {
                        stickman.animationGroups.forEach(ag => {
                            if (ag.name !== targetGroup.name) ag.stop();
                        });
                        
                        targetGroup.start(true, 1.0, targetGroup.from, targetGroup.to, false);
                    }
                    stickman.currentAnimName = targetAnimName;
                } else {
                    stickman.animationGroups.forEach(ag => ag.stop());
                    const idleAnim = stickman.animationGroups.find(ag => ag.name.toLowerCase().includes("idle"));
                    if (idleAnim) {
                        if (!idleAnim.isPlaying) {
                            idleAnim.start(true);
                        }
                        stickman.currentAnimName = "Idle";
                    } else {
                        stickman.currentAnimName = "";
                    }
                }
            }
        }

        let velY = currentVel.y;
        
        if (isGrounded) {
            stickman.hasDoubleJumped = false;
        }

        if (inputMap[" "]) {
            if (isGrounded) {
                velY = 14; 
                inputMap[" "] = false;
            } else if (!stickman.hasDoubleJumped) {
                velY = 12; // Impulsion du double saut (un peu moins forte que le saut initial)
                stickman.hasDoubleJumped = true;
                inputMap[" "] = false;
                
                // Petit effet visuel pour le double saut (nuage de poussière sous les pieds)
                try {
                    const ps = new BABYLON.ParticleSystem("djSpark", 30, scene);
                    ps.particleTexture = new BABYLON.Texture("assets/particles/spark.png", scene); // Utilisation de spark car smoke n'existe peut-être pas
                    ps.emitter = stickman.position.clone();
                    ps.emitter.y -= 0.5;
                    ps.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
                    ps.maxEmitBox = new BABYLON.Vector3(0.2, 0, 0.2);
                    ps.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.8);
                    ps.color2 = new BABYLON.Color4(1, 1, 1, 0);
                    ps.minSize = 0.5; ps.maxSize = 1.0;
                    ps.minLifeTime = 0.2; ps.maxLifeTime = 0.4;
                    ps.emitRate = 100;
                    ps.direction1 = new BABYLON.Vector3(-2, -1, -2);
                    ps.direction2 = new BABYLON.Vector3(2, -0.5, 2);
                    ps.disposeOnStop = true;
                    ps.start();
                    setTimeout(() => ps.stop(), 100);
                } catch(e) {}
            }
        }

        if (!isGrounded) {
            velY -= 25 * dt; // Gravité artificielle pour annuler le flottement
        }

        if (stickman.position.y < waterLevel && velY < -2) {
            velY = -2;
        }

        try {
            if (!gameData._playerFrozen) {
                stickman.physicsBody.setLinearVelocity(new BABYLON.Vector3(moveVector.x, velY, moveVector.z));
            } else {
                try { stickman.physicsBody.setLinearVelocity(new BABYLON.Vector3(0,0,0)); } catch(e) {}
            }
        } catch(e) {}

        const currentRadius = Math.sqrt(stickman.position.x * stickman.position.x + stickman.position.z * stickman.position.z);
        if (currentRadius > limitRadius) {
            const ratio = limitRadius / currentRadius;
            stickman.position.x *= ratio;
            stickman.position.z *= ratio;
        }

        monsters.forEach(monster => {
            const nowMs = Date.now();
            const distToPlayer = BABYLON.Vector3.Distance(monster.position, stickman.position);

            if (monster._type === 'amalgame') {
                // --- Barre de vie globale en haut de l'écran (partagée entre tous les morceaux) ---
                if (!gameData._amalgameHpBarUI) {
                    try {
                        const advTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("AmalgameUI");
                        const bgRect = new BABYLON.GUI.Rectangle();
                        bgRect.width = "600px"; bgRect.height = "25px";
                        bgRect.thickness = 2; bgRect.color = "purple"; bgRect.background = "black";
                        bgRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                        bgRect.top = "20px";
                        advTex.addControl(bgRect);

                        const hpBar = new BABYLON.GUI.Rectangle();
                        hpBar.width = "100%"; hpBar.height = "100%";
                        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        hpBar.background = "#8e44ad";
                        hpBar.thickness = 0;
                        bgRect.addControl(hpBar);

                        const bossName = new BABYLON.GUI.TextBlock();
                        bossName.text = "L'Amalgame Instable";
                        bossName.color = "white";
                        bossName.fontSize = 18;
                        bossName.fontWeight = "bold";
                        bgRect.addControl(bossName);

                        gameData._amalgameHpBarUI = { root: advTex, bar: hpBar, container: bgRect };
                    } catch(e){}
                }
                // Mise à jour de la barre globale : somme des HP de tous les morceaux
                if (gameData._amalgameHpBarUI) {
                    let totalHp = 0;
                    let totalMaxHp = 1000; // HP max de référence (le boss entier)
                    monsters.forEach(m => { if (m._type === 'amalgame') totalHp += m._hp; });
                    gameData._amalgameHpBarUI.bar.width = Math.max(0, (totalHp / totalMaxHp) * 100) + "%";
                    
                    // Nettoyage si plus aucun amalgame
                    let anyAlive = monsters.some(m => m._type === 'amalgame');
                    if (!anyAlive) {
                        try { gameData._amalgameHpBarUI.root.dispose(); } catch(e){}
                        gameData._amalgameHpBarUI = null;
                    }
                }
                // Pulsation animation
                monster._pulsePhase += 3 * dt;
                const scale = 1 + Math.sin(monster._pulsePhase) * 0.1;
                monster.scaling.set(scale, scale, scale);

                // Surbrillance permanente (visible à travers les murs)
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("amalgameHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true;
                        hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5;
                        hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(0.6, 0.1, 0.9)); // Violet
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1; // Rendu au-dessus
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                    } catch(e){}
                }

                // Mouvement simple vers le joueur
                const dir = stickman.position.subtract(monster.position);
                dir.y = 0;
                if (dir.length() > 0.1) {
                    dir.normalize();
                    monster.position.addInPlace(dir.scale(monster.ai.speed * dt));
                }
                monster.position.y = getHeight(monster.position.x, monster.position.z) + (monster._baseDiameter / 2) * scale;

                // Logique de division
                if (!monster._isSplitting) {
                    let splitThreshold = 0;
                    if (monster._sizeMode === 1) splitThreshold = 666;
                    if (monster._sizeMode === 2) splitThreshold = 166;

                    if (monster._sizeMode < 4 && monster._hp <= splitThreshold) {
                        monster._isSplitting = true;
                        const newSize = monster._sizeMode === 1 ? 2 : 4;
                        for(let i=0; i<2; i++) {
                            let sub = createAmalgame(scene, newSize);
                            sub.position = monster.position.clone();
                            sub.position.x += (Math.random() - 0.5) * 4;
                            sub.position.z += (Math.random() - 0.5) * 4;
                            monsters.push(sub);
                        }
                        // Marquer pour suppression sans déclencher de kill
                        setTimeout(() => {
                            try { monster.dispose(); } catch(e){}
                            const idx = monsters.indexOf(monster);
                            if (idx > -1) monsters.splice(idx, 1);
                        }, 0);
                        return; // Stoppe l'update
                    }
                }

                // Aspiration des Pickups
                if (gameData.pickups) {
                    for (let p = gameData.pickups.length - 1; p >= 0; p--) {
                        let pu = gameData.pickups[p];
                        if (pu && pu.mesh && !pu.mesh.isDisposed()) {
                            let dToPu = BABYLON.Vector3.Distance(monster.position, pu.mesh.position);
                            if (dToPu < 15) {
                                let pDir = monster.position.subtract(pu.mesh.position).normalize();
                                pu.mesh.position.addInPlace(pDir.scale(8 * dt)); 
                                
                                if (dToPu < monster._baseDiameter / 2 + 1) {
                                    monster._hp = Math.min(monster.maxHp, monster._hp + 25);
                                    try { pu.mesh.dispose(); } catch(e){}
                                    gameData.pickups.splice(p, 1);
                                    try {
                                        const hl = new BABYLON.HighlightLayer("hl1", scene);
                                        hl.addMesh(monster, BABYLON.Color3.Green());
                                        setTimeout(() => { if(!monster.isDisposed()) hl.removeMesh(monster); hl.dispose(); }, 300);
                                    } catch(e){}
                                }
                            }
                        }
                    }
                }

                // Fusion logic (seulement pour tailles 2 et 4)
                if (Math.random() < 0.05 && monster._sizeMode > 1 && !monster._isSplitting && !monster._isMerging) { 
                    for (let m2 of monsters) {
                        if (m2 !== monster && m2._type === 'amalgame' && m2._sizeMode === monster._sizeMode && !m2._isSplitting && !m2._isMerging) {
                            if (BABYLON.Vector3.Distance(monster.position, m2.position) < 4) {
                                if (!monster._mergeTimer) monster._mergeTimer = 0;
                                monster._mergeTimer += 1;
                                if (monster._mergeTimer > 5) { 
                                    monster._isMerging = true;
                                    m2._isMerging = true;
                                    
                                    const newSize = monster._sizeMode === 4 ? 2 : 1;
                                    const newAm = createAmalgame(scene, newSize);
                                    newAm.position = monster.position.clone();
                                    newAm._hp = Math.min(newAm.maxHp, monster._hp + m2._hp);
                                    monsters.push(newAm);
                                    
                                    setTimeout(() => {
                                        try { monster.dispose(); } catch(e){}
                                        try { m2.dispose(); } catch(e){}
                                        let idx1 = monsters.indexOf(monster);
                                        if (idx1 > -1) monsters.splice(idx1, 1);
                                        let idx2 = monsters.indexOf(m2);
                                        if (idx2 > -1) monsters.splice(idx2, 1);
                                    }, 0);
                                    return;
                                }
                            } else {
                                monster._mergeTimer = 0;
                            }
                        }
                    }
                }

                // UI flottante (petite barre de vie)
                if (!monster._miniHpUI) {
                    try {
                        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("miniBossUI");
                        const bgRect = new BABYLON.GUI.Rectangle();
                        bgRect.width = "60px"; bgRect.height = "8px";
                        bgRect.thickness = 1; bgRect.color = "black"; bgRect.background = "black";
                        advancedTexture.addControl(bgRect);
                        
                        const hpBar = new BABYLON.GUI.Rectangle();
                        hpBar.width = "100%"; hpBar.height = "100%";
                        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        hpBar.background = "purple";
                        hpBar.thickness = 0;
                        bgRect.addControl(hpBar);
                        
                        bgRect.linkWithMesh(monster);
                        bgRect.linkOffsetY = - (monster._baseDiameter * 15);

                        monster._miniHpUI = { root: advancedTexture, bar: hpBar, container: bgRect };
                        monster.onDisposeObservable.add(() => advancedTexture.dispose());
                    } catch(e){}
                } else {
                    monster._miniHpUI.bar.width = Math.max(0, (monster._hp / monster.maxHp) * 100) + "%";
                }

                // Dégâts de contact de l'Amalgame
                const amalgameHitRadius = (monster._baseDiameter / 2) + 1.5;
                if (distToPlayer < amalgameHitRadius) {
                    if (!monster._lastContactHit || nowMs - monster._lastContactHit > 800) {
                        monster._lastContactHit = nowMs;
                        const contactDmg = monster._sizeMode === 1 ? 20 : (monster._sizeMode === 2 ? 15 : 10);
                        gameData.health = Math.max(0, gameData.health - contactDmg);
                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                        try { if (gameData.shakeCamera) gameData.shakeCamera(0.3, 200); } catch(e){}
                    }
                }

                return;
            }

            // ===================== KRAKEN DES TERRES =====================
            if (monster._type === 'kraken') {
                // Highlight
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("krakenHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true; hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5; hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(0, 0.8, 0.7));
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1;
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                        monster.getChildMeshes().forEach(child => {
                            hl.addMesh(child, new BABYLON.Color3(0, 0.8, 0.7));
                            child.renderingGroupId = 1;
                        });
                    } catch(e){}
                }

                // Position fixe au sol
                monster.position.y = getHeight(monster.position.x, monster.position.z) + 1;

                // Animation tentacules (ondulation)
                if (monster._tentacles) {
                    monster._tentacles.forEach((t, i) => {
                        t.rotation.y = Math.sin(nowMs * 0.002 + i * 1.5) * 0.3;
                    });
                }

                // Inondation (toutes les 15s)
                if (nowMs - monster._lastFloodTime > 15000) {
                    monster._lastFloodTime = nowMs;
                    monster._isFlooding = true;
                    if (!gameData.currentWaterLevel) gameData.currentWaterLevel = waterLevel;
                    const targetWL = waterLevel + 5;
                    const floodInterval = setInterval(() => {
                        if (monster.isDisposed()) { clearInterval(floodInterval); return; }
                        gameData.currentWaterLevel = Math.min(targetWL, gameData.currentWaterLevel + 0.15);
                        try { if (scene.getMeshByName("water")) scene.getMeshByName("water").position.y = gameData.currentWaterLevel; } catch(e){}
                    }, 100);
                    setTimeout(() => {
                        clearInterval(floodInterval);
                        // Redescente progressive
                        const drainInterval = setInterval(() => {
                            if (monster.isDisposed()) { clearInterval(drainInterval); gameData.currentWaterLevel = waterLevel; return; }
                            gameData.currentWaterLevel = Math.max(waterLevel, gameData.currentWaterLevel - 0.1);
                            try { if (scene.getMeshByName("water")) scene.getMeshByName("water").position.y = gameData.currentWaterLevel; } catch(e){}
                            if (gameData.currentWaterLevel <= waterLevel) clearInterval(drainInterval);
                        }, 100);
                        monster._isFlooding = false;
                    }, 8000);
                }

                // Balayage tentacules (toutes les 6s) — dégâts si proche
                if (nowMs - monster._lastTentacleSwipe > 6000) {
                    monster._lastTentacleSwipe = nowMs;
                    // Rotation rapide des tentacules
                    if (monster._tentacles) {
                        monster._tentacles.forEach(t => {
                            t.rotation.y += Math.PI;
                        });
                    }
                    if (distToPlayer < 14) {
                        gameData.health = Math.max(0, gameData.health - 25);
                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                        try { if (gameData.shakeCamera) gameData.shakeCamera(0.5, 400); } catch(e){}
                        // Knockback
                        try {
                            const kb = stickman.position.subtract(monster.position).normalize().scale(15);
                            kb.y = 5;
                            stickman.physicsBody.setLinearVelocity(kb);
                        } catch(e){}
                    }
                }

                // Projectiles de boue (toutes les 10s) — le boss est vulnérable pendant cette phase
                if (nowMs - monster._lastMudShot > 10000) {
                    monster._lastMudShot = nowMs;
                    monster._isVulnerable = true;
                    // Tire 3 projectiles de boue
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            if (monster.isDisposed()) return;
                            try {
                                const mud = BABYLON.MeshBuilder.CreateSphere("mud_" + i, { diameter: 1.2 }, scene);
                                mud.position = monster.position.clone();
                                mud.position.y += 4;
                                const mm = new BABYLON.StandardMaterial("mudMat", scene);
                                mm.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
                                mud.material = mm;
                                const dir = stickman.position.subtract(mud.position).normalize();
                                let mudAge = 0;
                                const updateMud = () => {
                                    if (mud.isDisposed()) { scene.onBeforeRenderObservable.removeCallback(updateMud); return; }
                                    mudAge += engine.getDeltaTime() / 1000;
                                    mud.position.addInPlace(dir.scale(20 * engine.getDeltaTime() / 1000));
                                    if (BABYLON.Vector3.Distance(mud.position, stickman.position) < 2) {
                                        gameData.health = Math.max(0, gameData.health - 20);
                                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                                        mud.dispose(); scene.onBeforeRenderObservable.removeCallback(updateMud);
                                    }
                                    if (mudAge > 4) { mud.dispose(); scene.onBeforeRenderObservable.removeCallback(updateMud); }
                                };
                                scene.onBeforeRenderObservable.add(updateMud);
                            } catch(e){}
                        }, i * 600);
                    }
                    setTimeout(() => { monster._isVulnerable = false; }, 3000);
                }

                // Barre de vie
                if (!monster._hpBarUI) {
                    try {
                        const advTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("KrakenUI");
                        const bgRect = new BABYLON.GUI.Rectangle();
                        bgRect.width = "600px"; bgRect.height = "25px";
                        bgRect.thickness = 2; bgRect.color = "teal"; bgRect.background = "black";
                        bgRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                        bgRect.top = "20px"; advTex.addControl(bgRect);
                        const hpBar = new BABYLON.GUI.Rectangle();
                        hpBar.width = "100%"; hpBar.height = "100%";
                        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        hpBar.background = "teal"; hpBar.thickness = 0; bgRect.addControl(hpBar);
                        const txt = new BABYLON.GUI.TextBlock(); txt.text = "Le Kraken des Terres";
                        txt.color = "white"; txt.fontSize = 18; txt.fontWeight = "bold"; bgRect.addControl(txt);
                        monster._hpBarUI = { root: advTex, bar: hpBar, container: bgRect };
                        monster.onDisposeObservable.add(() => advTex.dispose());
                    } catch(e){}
                } else {
                    monster._hpBarUI.bar.width = Math.max(0, (monster._hp / monster.maxHp) * 100) + "%";
                }

                return;
            }

            // ===================== SEIGNEUR DE LA NUÉE =====================
            if (monster._type === 'nuee') {
                // Highlight
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("nueeHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true; hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5; hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(0.2, 0.6, 1));
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1;
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                        monster.getChildMeshes().forEach(child => {
                            hl.addMesh(child, new BABYLON.Color3(0.2, 0.6, 1));
                            child.renderingGroupId = 1;
                        });
                    } catch(e){}
                }

                // Vortex rotation
                if (monster._vortex) monster._vortex.rotation.y += 4 * dt;

                if (monster._isStunned) {
                    // Stun : immobile au sol
                    if (nowMs > monster._stunEndTime) {
                        monster._isStunned = false;
                        monster._lastDiveTime = nowMs;
                    }
                    monster.position.y = getHeight(monster.position.x, monster.position.z) + 2;
                } else if (monster._isDiving) {
                    // Piqué vers le joueur
                    const diveDir = monster._diveTarget.subtract(monster.position).normalize();
                    monster.position.addInPlace(diveDir.scale(35 * dt));
                    monster.position.y -= 20 * dt;
                    
                    if (monster.position.y <= getHeight(monster.position.x, monster.position.z) + 2) {
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 2;
                        monster._isDiving = false;
                        
                        if (distToPlayer < 5) {
                            // Touché !
                            gameData.health = Math.max(0, gameData.health - 35);
                            if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                            try { if (gameData.shakeCamera) gameData.shakeCamera(0.8, 500); } catch(e){}
                        } else {
                            // Raté → stun
                            monster._isStunned = true;
                            monster._stunEndTime = nowMs + 4000;
                        }
                    }
                } else {
                    // Vol orbital autour du joueur
                    monster._orbitAngle += 0.8 * dt;
                    const orbitRadius = 25;
                    const targetX = stickman.position.x + Math.cos(monster._orbitAngle) * orbitRadius;
                    const targetZ = stickman.position.z + Math.sin(monster._orbitAngle) * orbitRadius;
                    monster.position.x += (targetX - monster.position.x) * 2 * dt;
                    monster.position.z += (targetZ - monster.position.z) * 2 * dt;
                    monster.position.y = getHeight(monster.position.x, monster.position.z) + 15;

                    // Vent (pousse le joueur vers le bord)
                    try {
                        const windDir = stickman.position.subtract(new BABYLON.Vector3(0, stickman.position.y, 0)).normalize();
                        const windForce = 3;
                        const cv = stickman.physicsBody.getLinearVelocity();
                        stickman.physicsBody.setLinearVelocity(new BABYLON.Vector3(
                            cv.x + windDir.x * windForce * dt, cv.y, cv.z + windDir.z * windForce * dt
                        ));
                    } catch(e){}

                    // Piqué (toutes les 10s)
                    if (nowMs - monster._lastDiveTime > 10000) {
                        monster._isDiving = true;
                        monster._diveTarget = stickman.position.clone();
                    }

                    // Invocation gardes volants (toutes les 12s)
                    if (nowMs - monster._lastSummonTime > 12000) {
                        monster._lastSummonTime = nowMs;
                        for (let g = 0; g < 4; g++) {
                            try {
                                const guard = BABYLON.MeshBuilder.CreateSphere("nuee_guard_" + g, { diameter: 0.8 }, scene);
                                const gm = new BABYLON.StandardMaterial("guardMat", scene);
                                gm.diffuseColor = new BABYLON.Color3(0.4, 0.5, 0.7);
                                gm.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
                                guard.material = gm;
                                guard.position = monster.position.clone();
                                guard.position.x += (Math.random() - 0.5) * 6;
                                guard.position.z += (Math.random() - 0.5) * 6;
                                guard._type = 'flying';
                                guard._hp = 1;
                                guard.ai = { speed: 4.0 };
                                guard._castsShadow = false;
                                monsters.push(guard);
                            } catch(e){}
                        }
                    }
                }

                // Dégâts contact
                if (distToPlayer < 4 && !monster._isStunned) {
                    if (!monster.lastHitTime || nowMs - monster.lastHitTime > 1000) {
                        monster.lastHitTime = nowMs;
                        gameData.health = Math.max(0, gameData.health - 15);
                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                    }
                }

                // Barre de vie
                if (!monster._hpBarUI) {
                    try {
                        const advTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("NueeUI");
                        const bgRect = new BABYLON.GUI.Rectangle();
                        bgRect.width = "600px"; bgRect.height = "25px";
                        bgRect.thickness = 2; bgRect.color = "#2980b9"; bgRect.background = "black";
                        bgRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                        bgRect.top = "20px"; advTex.addControl(bgRect);
                        const hpBar = new BABYLON.GUI.Rectangle();
                        hpBar.width = "100%"; hpBar.height = "100%";
                        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        hpBar.background = "#2980b9"; hpBar.thickness = 0; bgRect.addControl(hpBar);
                        const txt = new BABYLON.GUI.TextBlock(); txt.text = "Le Seigneur de la Nuée";
                        txt.color = "white"; txt.fontSize = 18; txt.fontWeight = "bold"; bgRect.addControl(txt);
                        monster._hpBarUI = { root: advTex, bar: hpBar, container: bgRect };
                        monster.onDisposeObservable.add(() => advTex.dispose());
                    } catch(e){}
                } else {
                    monster._hpBarUI.bar.width = Math.max(0, (monster._hp / monster.maxHp) * 100) + "%";
                }

                return;
            }

            // ===================== LE MIMIC =====================
            if (monster._type === 'mimic') {
                // Highlight
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("mimicHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true; hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5; hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(0.3, 0.3, 0.35));
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1;
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                    } catch(e){}
                }

                // Saut corrompu
                if (monster._isJumping) {
                    monster.position.y -= 30 * dt;
                    if (monster.position.y <= getHeight(monster.position.x, monster.position.z) + 1.5) {
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 1.5;
                        monster._isJumping = false;
                        monster._lastJumpTime = nowMs;
                        // Onde de choc à l'atterrissage
                        try { if (gameData.shakeCamera) gameData.shakeCamera(0.5, 400); } catch(e){}
                        if (distToPlayer < 8) {
                            let playerGroundH = getHeight(stickman.position.x, stickman.position.z);
                            if (stickman.position.y - playerGroundH < 2.5) {
                                gameData.health = Math.max(0, gameData.health - 25);
                                if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                            }
                        }
                        // Onde de choc visuelle
                        try {
                            const sw = BABYLON.MeshBuilder.CreateTorus("mimic_sw", { diameter: 4, thickness: 0.5 }, scene);
                            sw.position = monster.position.clone();
                            sw.position.y = getHeight(sw.position.x, sw.position.z) + 0.5;
                            const swm = new BABYLON.StandardMaterial("swm", scene);
                            swm.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.3);
                            swm.alpha = 0.8; swm.disableLighting = true;
                            sw.material = swm;
                            let swAge = 0;
                            const expandSW = () => {
                                swAge += engine.getDeltaTime() / 1000;
                                sw.scaling.scaleInPlace(1 + 5 * engine.getDeltaTime() / 1000);
                                sw.material.alpha -= 0.6 * engine.getDeltaTime() / 1000;
                                if (swAge > 1.5) { sw.dispose(); scene.onBeforeRenderObservable.removeCallback(expandSW); }
                            };
                            scene.onBeforeRenderObservable.add(expandSW);
                        } catch(e){}
                    }
                } else {
                    // Mouvement en zigzag
                    monster._zigzagPhase += 4 * dt;
                    const dir = stickman.position.subtract(monster.position);
                    dir.y = 0;
                    if (dir.length() > 0.1) {
                        dir.normalize();
                        // Zigzag perpendiculaire
                        const perp = new BABYLON.Vector3(-dir.z, 0, dir.x);
                        const zigzag = perp.scale(Math.sin(monster._zigzagPhase) * 3);
                        monster.position.addInPlace(dir.scale(monster.ai.speed * dt).add(zigzag.scale(dt)));
                    }
                    monster.position.y = getHeight(monster.position.x, monster.position.z) + 1.5;

                    // Double saut corrompu (toutes les 6s)
                    if (nowMs - monster._lastJumpTime > 6000) {
                        monster._isJumping = true;
                        monster.position.y += 15;
                    }
                }

                // ================= COPIE EXACTE DES BONUS DU JOUEUR =================
                // 1. Aura
                if (bonusState.auraLevel > 0) {
                    if (!monster._auraMesh) {
                        monster._auraMesh = BABYLON.MeshBuilder.CreateTorus("mimicAura", { diameter: 8, thickness: 0.3, tessellation: 40 }, scene);
                        const mat = new BABYLON.StandardMaterial("mAuraMat", scene);
                        mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0.5); // Aura sombre/violacée
                        mat.alpha = 0.6;
                        monster._auraMesh.material = mat;
                        monster._auraMesh.parent = monster;
                        monster._auraMesh.position.y = -0.5;
                        monster._auraMesh.checkCollisions = false;
                    }
                    const newScale = 1 + (bonusState.auraLevel - 1) * 0.3;
                    monster._auraMesh.scaling.set(newScale, 1, newScale);
                    monster._auraMesh.rotation.y -= 2 * dt; // tourne dans l'autre sens
                    
                    const radius = (8 * newScale) / 2;
                    if (distToPlayer < radius + 0.5) {
                        if (!monster._lastAuraHit || nowMs - monster._lastAuraHit > 500) {
                            monster._lastAuraHit = nowMs;
                            gameData.health = Math.max(0, gameData.health - 10);
                            if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                        }
                    }
                }

                // 2. Scies
                if (bonusState.sawsLevel > 0) {
                    if (!monster._sawsMeshes || monster._sawsMeshes.length !== bonusState.sawsLevel) {
                        if (monster._sawsMeshes) monster._sawsMeshes.forEach(s => s.dispose());
                        monster._sawsMeshes = [];
                        monster._sawsAngle = 0;
                        for (let i = 0; i < bonusState.sawsLevel; i++) {
                            const saw = BABYLON.MeshBuilder.CreateCylinder("msaw" + i, { diameter: 2, height: 0.1, tessellation: 24 }, scene);
                            const mat = new BABYLON.StandardMaterial("msawMat", scene);
                            mat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                            mat.emissiveColor = new BABYLON.Color3(0.8, 0, 0); // Scies rouges sombres
                            saw.material = mat;
                            saw.checkCollisions = false;
                            monster._sawsMeshes.push(saw);
                        }
                    }
                    monster._sawsAngle -= 3 * dt; // tourne dans l'autre sens
                    monster._sawsMeshes.forEach((saw, index) => {
                        const angleOffset = (Math.PI * 2 / monster._sawsMeshes.length) * index;
                        const currentAngle = monster._sawsAngle + angleOffset;
                        saw.position.x = monster.position.x + Math.cos(currentAngle) * 5.0;
                        saw.position.z = monster.position.z + Math.sin(currentAngle) * 5.0;
                        saw.position.y = monster.position.y + 0.2;
                        saw.rotation.y -= 15 * dt;

                        if (BABYLON.Vector3.Distance(saw.position, stickman.position) < 1.5) {
                            if (!monster._lastSawHit || nowMs - monster._lastSawHit > 500) {
                                monster._lastSawHit = nowMs;
                                gameData.health = Math.max(0, gameData.health - 15);
                                if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                            }
                        }
                    });
                }

                // 3. Missiles
                if (bonusState.missileLevel > 0) {
                    const baseMissileCooldown = Math.max(500, 3000 - (bonusState.missileLevel * 400));
                    if (!monster._lastMissileTime) monster._lastMissileTime = nowMs;
                    if (nowMs - monster._lastMissileTime > baseMissileCooldown && !monster._isJumping) {
                        monster._lastMissileTime = nowMs;
                        let numMissiles = 1 + (bonusState.extraProjectilesLevel || 0);
                        for (let mIdx = 0; mIdx < numMissiles; mIdx++) {
                            const missile = BABYLON.MeshBuilder.CreateCylinder("mmissile", { diameter: 0.4, height: 1.2 }, scene);
                            missile.rotation.x = Math.PI / 2;
                            const mat = new BABYLON.StandardMaterial("mMissileMat", scene);
                            mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0.5); 
                            missile.material = mat;
                            missile.position = monster.position.clone();
                            missile.position.y += 1.5;
                            if (numMissiles > 1) {
                                missile.position.x += (Math.random() - 0.5) * 2;
                                missile.position.z += (Math.random() - 0.5) * 2;
                            }
                            if (!monster._activeMissiles) monster._activeMissiles = [];
                            monster._activeMissiles.push({ mesh: missile, life: 5.0, speedMult: 1 + (bonusState.extraProjectilesLevel || 0) * 0.2 });
                        }
                    }
                    
                    if (monster._activeMissiles) {
                        for (let i = 0; i < monster._activeMissiles.length; i++) {
                            let m = monster._activeMissiles[i];
                            m.life -= dt;
                            let speed = 6 * (m.speedMult || 1) * dt;
                            let dir = stickman.position.subtract(m.mesh.position).normalize();
                            m.mesh.position.addInPlace(dir.scale(speed));
                            m.mesh.lookAt(stickman.position);
                            
                            if (BABYLON.Vector3.Distance(m.mesh.position, stickman.position) < 2.0 || m.life <= 0) {
                                if (m.life > 0 && BABYLON.Vector3.Distance(m.mesh.position, stickman.position) < 2.0) {
                                    gameData.health = Math.max(0, gameData.health - 20);
                                    if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                    if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                                    try { if (gameData.explosionSound) gameData.explosionSound.play(); } catch(e){}
                                }
                                m.mesh.dispose();
                                monster._activeMissiles.splice(i, 1);
                                i--;
                            }
                        }
                    }
                }

                // 4. Foudre
                if (bonusState.lightningLevel > 0) {
                    const lightningCooldown = Math.max(1000, 4000 - bonusState.lightningLevel * 500);
                    if (!monster._lastLightningTime) monster._lastLightningTime = nowMs;
                    if (nowMs - monster._lastLightningTime > lightningCooldown && !monster._isJumping) {
                        monster._lastLightningTime = nowMs;
                        let numStrikes = 1 + Math.floor((bonusState.lightningLevel - 1) / 2);
                        for (let i = 0; i < numStrikes; i++) {
                            setTimeout(() => {
                                if (monster.isDisposed()) return;
                                const targetPos = stickman.position.clone();
                                const bolt = BABYLON.MeshBuilder.CreateCylinder("darkBolt", { diameterTop: 0.5, diameterBottom: 0.1, height: 40 }, scene);
                                bolt.position = targetPos;
                                bolt.position.y += 20;
                                const bm = new BABYLON.StandardMaterial("bm", scene);
                                bm.emissiveColor = new BABYLON.Color3(0.3, 0, 0.6); bm.alpha = 0.8;
                                bolt.material = bm;
                                setTimeout(() => { bolt.dispose(); }, 300);
                                
                                if (BABYLON.Vector3.Distance(new BABYLON.Vector3(targetPos.x, stickman.position.y, targetPos.z), stickman.position) < 3) {
                                    gameData.health = Math.max(0, gameData.health - 25);
                                    if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                    if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                                    try { if (gameData.shakeCamera) gameData.shakeCamera(0.4, 300); } catch(e){}
                                }
                            }, i * 300);
                        }
                    }
                }

                // 5. Zone de frappe
                if (bonusState.zoneLevel > 0) {
                    const zoneCooldown = 10000;
                    if (!monster._lastZoneTime) monster._lastZoneTime = nowMs;
                    if (nowMs - monster._lastZoneTime > zoneCooldown && !monster._isJumping) {
                        monster._lastZoneTime = nowMs;
                        let radius = 4 + bonusState.zoneLevel * 1.5;
                        const zone = BABYLON.MeshBuilder.CreateCylinder("mzone", { diameter: radius * 2, height: 0.2 }, scene);
                        zone.position = stickman.position.clone();
                        zone.position.y -= 0.4;
                        zone.checkCollisions = false;
                        const mat = new BABYLON.StandardMaterial("mZoneMat", scene);
                        mat.emissiveColor = new BABYLON.Color3(0.6, 0, 0); // Rouge foncé
                        mat.alpha = 0.5;
                        zone.material = mat;
                        if (!monster._activeZones) monster._activeZones = [];
                        monster._activeZones.push({ mesh: zone, radius: radius, life: 3.0 });
                    }
                    
                    if (monster._activeZones) {
                        for (let i = 0; i < monster._activeZones.length; i++) {
                            let z = monster._activeZones[i];
                            z.life -= dt;
                            z.mesh.material.alpha = 0.3 + Math.sin(nowMs * 0.01) * 0.2;
                            if (BABYLON.Vector3.Distance(z.mesh.position, stickman.position) <= z.radius) {
                                gameData.health = Math.max(0, gameData.health - 0.5); // Degats continus
                                if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                            }
                            if (z.life <= 0) {
                                z.mesh.dispose();
                                monster._activeZones.splice(i, 1);
                                i--;
                            }
                        }
                    }
                }

                // Dégâts contact
                if (distToPlayer < 3 && !monster._isJumping) {
                    if (!monster.lastHitTime || nowMs - monster.lastHitTime > 800) {
                        monster.lastHitTime = nowMs;
                        gameData.health = Math.max(0, gameData.health - 12);
                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                    }
                }

                // Pulsation de taille
                const mimicScale = 1 + Math.sin(nowMs * 0.003) * 0.15;
                monster.scaling.set(mimicScale, mimicScale, mimicScale);

                // Barre de vie
                if (!monster._hpBarUI) {
                    try {
                        const advTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("MimicUI");
                        const bgRect = new BABYLON.GUI.Rectangle();
                        bgRect.width = "600px"; bgRect.height = "25px";
                        bgRect.thickness = 2; bgRect.color = "#555"; bgRect.background = "black";
                        bgRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                        bgRect.top = "20px"; advTex.addControl(bgRect);
                        const hpBar = new BABYLON.GUI.Rectangle();
                        hpBar.width = "100%"; hpBar.height = "100%";
                        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        hpBar.background = "#555"; hpBar.thickness = 0; bgRect.addControl(hpBar);
                        const txt = new BABYLON.GUI.TextBlock(); txt.text = "Le Mimic";
                        txt.color = "white"; txt.fontSize = 18; txt.fontWeight = "bold"; bgRect.addControl(txt);
                        monster._hpBarUI = { root: advTex, bar: hpBar, container: bgRect };
                        monster.onDisposeObservable.add(() => advTex.dispose());
                    } catch(e){}
                } else {
                    monster._hpBarUI.bar.width = Math.max(0, (monster._hp / monster.maxHp) * 100) + "%";
                }

                return;
            }

            if (monster._type === 'boss') {
                // Surbrillance permanente (visible à travers les murs)
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("goliathHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true;
                        hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5;
                        hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(1, 0.15, 0.1)); // Rouge
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1;
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                        // Aussi les enfants (tête, bras)
                        monster.getChildMeshes().forEach(child => {
                            hl.addMesh(child, new BABYLON.Color3(1, 0.15, 0.1));
                            child.renderingGroupId = 1;
                        });
                    } catch(e){}
                }
                if (monster._isJumping) {
                    monster.position.y -= 25 * dt; // Chute rapide
                    const dir = stickman.position.subtract(monster.position);
                    dir.y = 0;
                    if (dir.length() > 0.1) {
                        dir.normalize();
                        monster.position.addInPlace(dir.scale(8 * dt)); // Ajuste sa chute vers le joueur
                    }
                    if (monster.position.y <= getHeight(monster.position.x, monster.position.z) + 3) {
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 3;
                        monster._isJumping = false;
                        monster._lastJumpTime = nowMs;
                        
                        // Le boss s'immobilise un moment pour récupérer de son écrasement
                        monster._stunnedUntil = nowMs + 4000;
                        
                        try { if (gameData.shakeCamera) gameData.shakeCamera(0.6, 600); } catch(e){}
                        try { if (gameData.explosionSound) gameData.explosionSound.play(); } catch(e){}
                        
                        // 3 Ondes de choc
                        for(let w = 0; w < 3; w++) {
                            setTimeout(() => {
                                if (monster.isDisposed()) return;
                                const sw = BABYLON.MeshBuilder.CreateTorus("shockwave", {diameter: 6 + w * 2, thickness: 1}, scene);
                                sw.position = monster.position.clone();
                                sw.position.y = getHeight(sw.position.x, sw.position.z) + 0.5;
                                const swMat = new BABYLON.StandardMaterial("swMat", scene);
                                swMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0);
                                swMat.alpha = 0.8; 
                                swMat.disableLighting = true;
                                sw.material = swMat;
                                
                                let swAge = 0;
                                scene.onBeforeRenderObservable.add(function expandSW() {
                                    const sdt = engine.getDeltaTime() / 1000;
                                    swAge += sdt;
                                    sw.scaling.scaleInPlace(1 + 4.5 * sdt); // Expansion ralentie pour laisser le temps de sauter
                                    sw.material.alpha -= 0.5 * sdt; // Disparaît plus lentement
                                    
                                    if (!sw._hitPlayer && BABYLON.Vector3.Distance(stickman.position, sw.position) < (sw.scaling.x * (3 + w))) {
                                        sw._hitPlayer = true;
                                        // Ne fait des dégâts que si le joueur est proche du sol (hauteur relative < 2.5)
                                        let playerGroundHeight = getHeight(stickman.position.x, stickman.position.z);
                                        if (stickman.position.y - playerGroundHeight < 2.5) {
                                            gameData.health = Math.max(0, gameData.health - 20);
                                            if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                                            try { if (gameData.shakeCamera) gameData.shakeCamera(0.4, 300); } catch(e){}
                                        }
                                    }
                                    if (swAge > 2.0) {
                                        sw.dispose();
                                        scene.onBeforeRenderObservable.removeCallback(expandSW);
                                    }
                                });
                            }, w * 650); // 650ms d'intervalle entre chaque vague (plus d'espace)
                        }
                    }
                } else {
                    const isRecovering = monster._stunnedUntil && nowMs < monster._stunnedUntil;

                    if (!isRecovering) {
                        const dir = stickman.position.subtract(monster.position);
                        dir.y = 0;
                        if (dir.length() > 0.1) {
                            dir.normalize();
                            monster.position.addInPlace(dir.scale(monster.ai.speed * dt));
                        }
                    }
                    monster.position.y = getHeight(monster.position.x, monster.position.z) + 3;
                    
                    // Saut
                    if (!isRecovering && nowMs - monster._lastJumpTime > 8000) {
                        monster._isJumping = true;
                        monster.position.y += 20; 
                    }
                    
                    // Jet de Gravats
                    if (!monster._lastThrowTime) monster._lastThrowTime = nowMs;
                    if (nowMs - monster._lastThrowTime > 5000 && !monster._isJumping) {
                        monster._lastThrowTime = nowMs;
                        try {
                            const debris = BABYLON.MeshBuilder.CreateBox("debris", {size: 1.5}, scene);
                            debris.position = monster.position.clone();
                            debris.position.y += 4;
                            const dMat = new BABYLON.StandardMaterial("dMat", scene);
                            dMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
                            debris.material = dMat;
                            
                            const dAgg = new BABYLON.PhysicsAggregate(debris, BABYLON.PhysicsShapeType.BOX, { mass: 50, restitution: 0.1, friction: 0.8 }, scene);
                            const throwDir = stickman.position.subtract(debris.position).normalize();
                            dAgg.body.setLinearVelocity(new BABYLON.Vector3(throwDir.x * 25, 5, throwDir.z * 25));
                            
                            debris._hasHitPlayer = false;
                            const checkHit = () => {
                                if (!debris || debris.isDisposed()) {
                                    scene.onBeforeRenderObservable.removeCallback(checkHit);
                                    return;
                                }
                                if (!debris._hasHitPlayer && BABYLON.Vector3.Distance(debris.position, stickman.position) < 2.0) {
                                    debris._hasHitPlayer = true;
                                    gameData.health = Math.max(0, gameData.health - 30); // 30 dommages
                                    if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                    if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                                    try { if (gameData.shakeCamera) gameData.shakeCamera(0.5, 300); } catch(e){}
                                    try { if (gameData.hitSound) gameData.hitSound.play(); } catch(e){}
                                    
                                    scene.onBeforeRenderObservable.removeCallback(checkHit);
                                    try {
                                        dAgg.body.dispose();
                                        dAgg.dispose();
                                        debris.dispose();
                                    } catch(e){}
                                }
                            };
                            scene.onBeforeRenderObservable.add(checkHit);
                            
                            // Disparait après 8 secondes
                            setTimeout(() => {
                                try {
                                    scene.onBeforeRenderObservable.removeCallback(checkHit);
                                    dAgg.body.dispose();
                                    dAgg.dispose();
                                    debris.dispose();
                                } catch(e){}
                            }, 8000);
                        } catch(e){}
                    }

                    // Attraction Magnétique
                    if (!monster._lastAttractTime) monster._lastAttractTime = nowMs;
                    if (nowMs - monster._lastAttractTime > 12000) {
                        monster._isAttracting = true;
                        monster._lastAttractTime = nowMs;
                        setTimeout(() => { monster._isAttracting = false; }, 3000); // 3 sec de bouclier
                    }
                    
                    if (monster._isAttracting) {
                        // Effet visuel d'attraction
                        try {
                            if (!monster._shieldGlow) {
                                monster._shieldGlow = BABYLON.MeshBuilder.CreateSphere("bossGlow", {diameter: 6}, scene);
                                const gMat = new BABYLON.StandardMaterial("gMat", scene);
                                gMat.emissiveColor = new BABYLON.Color3(0.5, 0, 1);
                                gMat.wireframe = true;
                                monster._shieldGlow.material = gMat;
                            }
                            monster._shieldGlow.position = monster.position;
                            monster._shieldGlow.rotation.y += 2 * dt;
                        } catch(e){}
                        
                        // Attirer les projectiles
                        if (projectiles) {
                            projectiles.forEach(p => {
                                if (p.owner === 'player') {
                                    const distP = BABYLON.Vector3.Distance(p.mesh.position, monster.position);
                                    if (distP < 25) {
                                        const pullDir = monster.position.subtract(p.mesh.position).normalize();
                                        p.direction = BABYLON.Vector3.Lerp(p.direction, pullDir, 0.1).normalize();
                                    }
                                }
                            });
                        }
                    } else if (monster._shieldGlow) {
                        try { monster._shieldGlow.dispose(); monster._shieldGlow = null; } catch(e){}
                    }

                    if (distToPlayer < 4.5) {
                        if (!monster.lastHitTime || nowMs - monster.lastHitTime > 1000) {
                            monster.lastHitTime = nowMs;
                            gameData.health = Math.max(0, gameData.health - 15);
                            if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                        }
                    }
                }
                
                // Barre de vie du boss visuelle en haut de l'écran (Rouge/Noir)
                if (!monster._hpBarUI) {
                    try {
                        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("BossUI");
                        const bgRect = new BABYLON.GUI.Rectangle();
                        bgRect.width = "600px"; bgRect.height = "25px";
                        bgRect.thickness = 2; bgRect.color = "black";
                        bgRect.background = "black";
                        bgRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                        bgRect.top = "20px";
                        advancedTexture.addControl(bgRect);
                        
                        const hpBar = new BABYLON.GUI.Rectangle();
                        hpBar.width = "100%"; hpBar.height = "100%";
                        hpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        hpBar.background = "#c0392b"; // Rouge sombre
                        hpBar.thickness = 0;
                        bgRect.addControl(hpBar);
                        
                        const bossName = new BABYLON.GUI.TextBlock();
                        bossName.text = "Le Goliath des Ruines";
                        bossName.color = "white";
                        bossName.fontSize = 18;
                        bossName.fontWeight = "bold";
                        bgRect.addControl(bossName);

                        monster._hpBarUI = { root: advancedTexture, bar: hpBar, container: bgRect };
                        monster.onDisposeObservable.add(() => advancedTexture.dispose());
                    } catch(e){}
                } else {
                    monster._hpBarUI.bar.width = Math.max(0, (monster._hp / monster.maxHp) * 100) + "%";
                }
                
                return; // Skips generic AI for the boss
            }

            // Handle stun
            if (monster.stunTime && nowMs < monster.stunTime) {
                if (monster.physicsAgg && monster.physicsAgg.body) {
                    const mVel = monster.physicsAgg.body.getLinearVelocity ? monster.physicsAgg.body.getLinearVelocity() : {x:0,y:0,z:0};
                    try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(0, mVel.y, 0)); } catch(e) {}
                }
                // update stun glow position if present
                try { if (monster._stunGlow) monster._stunGlow.position.copyFrom(monster.position); } catch(e) {}
                return;
            } else if (monster.stunTime && nowMs >= monster.stunTime) {
                monster.stunTime = 0;
                // remove stun glow if present
                try { if (monster._stunGlow) { monster._stunGlow.dispose(); monster._stunGlow = null; } } catch(e) {}
            }

            // Dynamically create/dispose physics for close monsters
            try {
                const createDist = 25;
                const removeDist = 40;
                if (!monster.physicsAgg && distToPlayer <= createDist) {
                    // create invisible proxy for physics
                    const proxy = BABYLON.MeshBuilder.CreateSphere("monsterProxy_" + monster.name, {diameter: 1}, scene);
                    proxy.position = monster.position.clone();
                    proxy.isVisible = false;
                    const agg = new BABYLON.PhysicsAggregate(proxy, BABYLON.PhysicsShapeType.SPHERE, { mass: 1, friction: 0.1 }, scene);
                    agg.body.setMassProperties({ inertia: new BABYLON.Vector3(0, 0, 0) });
                    monster.physicsAgg = agg;
                    monster.physicsBody = agg.body;
                    monster.physicsProxy = proxy;
                } else if (monster.physicsAgg && distToPlayer > removeDist) {
                    try { monster.physicsAgg.body.dispose(); } catch(e) {}
                    try { monster.physicsAgg.dispose && monster.physicsAgg.dispose(); } catch(e) {}
                    try { monster.physicsProxy.dispose(); } catch(e) {}
                    monster.physicsAgg = null; monster.physicsBody = null; monster.physicsProxy = null;
                }
            } catch(e) {}

            // Movement
            if (monster.physicsAgg && monster.physicsAgg.body) {
                // use physics proxy to set velocity and sync visual
                const dir = stickman.position.subtract(monster.physicsProxy.position).normalize();
                const mVel = monster.physicsAgg.body.getLinearVelocity ? monster.physicsAgg.body.getLinearVelocity() : new BABYLON.Vector3(0,0,0);
                try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(dir.x * 5.5, mVel.y, dir.z * 5.5)); } catch(e) {}
                // sync visual to proxy
                try { monster.position.copyFrom(monster.physicsProxy.position); } catch(e) {}
            } else {
                // kinematic simple AI movement
                const dirVec = stickman.position.subtract(monster.position);
                dirVec.y = 0;
                    if (dirVec.length() > 0.1) {
                    dirVec.normalize();
                    const spd = monster.ai && monster.ai.speed ? monster.ai.speed : 3.0;
                    monster.position.addInPlace(dirVec.scale(spd * dt));
                    // follow terrain
                    try { monster.position.y = getHeight(monster.position.x, monster.position.z) + 0.5; } catch(e) {}
                }
            }

            // Ranged + Flying AI: maintain preferred range and shoot
            try {
                if (monster._type === 'ranged' || monster._type === 'flying') {
                    const preferred = monster._preferredRange || (monster._type === 'flying' ? 12 : 10);
                    const gap = 2.0;

                    // movement: handle flying vs ground ranged differently
                    if (monster._type === 'flying') {
                        // flying monsters keep an altitude and move in 3D space
                        const flightH = monster._flightHeight || 5;
                        if (monster.physicsAgg && monster.physicsAgg.body) {
                            const pv = monster.physicsProxy.position;
                            const targetPos = stickman.position.clone();
                            try { targetPos.y = getHeight(pv.x, pv.z) + flightH; } catch(e) { targetPos.y = pv.y; }
                            const toT = targetPos.subtract(pv);
                            // consider horizontal distance for range behavior
                            const horiz = Math.sqrt(toT.x * toT.x + toT.z * toT.z);
                            let vx = 0, vy = 0, vz = 0;
                            if (horiz > preferred + gap) {
                                toT.normalize();
                                vx = toT.x * monster.ai.speed;
                                vz = toT.z * monster.ai.speed;
                            } else if (horiz < preferred - gap) {
                                toT.normalize();
                                vx = -toT.x * monster.ai.speed * 0.6;
                                vz = -toT.z * monster.ai.speed * 0.6;
                            } else {
                                vx = 0; vz = 0;
                            }
                            // vertical PID-ish
                            vy = (targetPos.y - pv.y) * 0.6;
                            try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(vx, vy, vz)); } catch(e) {}
                            try { monster.position.copyFrom(monster.physicsProxy.position); } catch(e) {}
                        } else {
                            const targetPos = stickman.position.clone();
                            try { targetPos.y = getHeight(monster.position.x, monster.position.z) + flightH; } catch(e) {}
                            const toP = targetPos.subtract(monster.position);
                            const horiz = Math.sqrt(toP.x * toP.x + toP.z * toP.z);
                            if (horiz > preferred + gap) {
                                    toP.normalize();
                                    monster.position.addInPlace(toP.scale(monster.ai.speed * dt));
                                } else if (horiz < preferred - gap) {
                                    toP.normalize();
                                    monster.position.addInPlace(toP.scale(-monster.ai.speed * 0.6 * dt));
                                }
                            // float towards desired Y
                            try { monster.position.y += (targetPos.y - monster.position.y) * 0.06; } catch(e) {}
                        }
                    } else {
                        // ground ranged movement
                        if (monster.physicsAgg && monster.physicsAgg.body) {
                            const pv = monster.physicsProxy.position;
                            const toPlayer = stickman.position.subtract(pv);
                            toPlayer.y = 0;
                            const d = toPlayer.length();
                            if (d > preferred + gap) {
                                    toPlayer.normalize();
                                    try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(toPlayer.x * monster.ai.speed, 0, toPlayer.z * monster.ai.speed)); } catch(e) {}
                                } else if (d < preferred - gap) {
                                    toPlayer.normalize();
                                    try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(-toPlayer.x * monster.ai.speed * 0.6, 0, -toPlayer.z * monster.ai.speed * 0.6)); } catch(e) {}
                                } else {
                                    try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(0,0,0)); } catch(e) {}
                                }
                        } else {
                            const toP = stickman.position.subtract(monster.position);
                            toP.y = 0;
                            const d2 = toP.length();
                            if (d2 > preferred + gap) {
                                toP.normalize();
                                monster.position.addInPlace(toP.scale(monster.ai.speed * dt));
                            } else if (d2 < preferred - gap) {
                                toP.normalize();
                                monster.position.addInPlace(toP.scale(-monster.ai.speed * 0.6 * dt));
                            }
                            try { monster.position.y = getHeight(monster.position.x, monster.position.z) + 0.5; } catch(e) {}
                        }
                    }

                    // Shooting (both ranged and flying can shoot)
                    const nowShot = Date.now();
                    if (!monster._lastShotTime) monster._lastShotTime = 0;
                    if (nowShot - monster._lastShotTime > (monster._shotCooldown || (monster._type === 'flying' ? 900 : 1200))) {
                        // only shoot when roughly within range
                        if (distToPlayer <= ((monster._preferredRange || preferred) + 3)) {
                            monster._lastShotTime = nowShot;
                            try {
                                const projMesh = BABYLON.MeshBuilder.CreateSphere("mshot", {diameter: 0.35}, scene);
                                projMesh.position = monster.position.clone();
                                projMesh.position.y += (monster._type === 'flying' ? 0.8 : 1.2);
                                const mMat = new BABYLON.StandardMaterial("mshotMat", scene);
                                mMat.emissiveColor = monster._type === 'flying' ? new BABYLON.Color3(1.0,0.4,0.2) : new BABYLON.Color3(0.2, 0.7, 1.0);
                                projMesh.material = mMat;
                                let dir = stickman.position.clone(); dir.y += 1.0; dir.subtractInPlace(projMesh.position);
                                const dlen = dir.length();
                                if (dlen > 0.001) dir.normalize(); else dir = new BABYLON.Vector3(0,0,1);
                                const mproj = { mesh: projMesh, life: 120, direction: dir, speedMult: (monster._type === 'flying' ? 1.2 : 0.9), owner: 'monster', damage: (monster._type === 'flying' ? 1 : 1) };
                                projectiles.push(mproj);
                                try { if (gameData.fireSound) gameData.fireSound.play(); } catch(e) {}
                            } catch(e) {}
                        }
                    }
                }
            } catch(e) {}

            // Player contact damage (respects bonuses: shield, armor, reflect, revive)
            if (distToPlayer < 2.2) {
                if (!monster.lastHitTime || nowMs - monster.lastHitTime > 1000) {
                    monster.lastHitTime = nowMs;
                    try {
                        if (gameData && typeof gameData.health === 'number') {
                            // Shield absorbs hits first
                            if (bonusState._shieldActive && bonusState._shieldHits > 0) {
                                bonusState._shieldHits = Math.max(0, bonusState._shieldHits - 1);
                                if (gameData.scene && gameData.scene._shieldMesh) {
                                    try { gameData.scene._shieldMesh.scaling.scaleInPlace(0.9); } catch(e) {}
                                }
                                if (bonusState._shieldHits <= 0) {
                                    bonusState._shieldActive = false;
                                    try { if (gameData.scene && gameData.scene._shieldMesh) { gameData.scene._shieldMesh.dispose(); gameData.scene._shieldMesh = null; } } catch(e) {}
                                }
                            } else {
                                // Armor reduces damage by a percentage per level (with caps)
                                const baseDamage = 1;
                                const reduction = Math.min(0.6, 0.12 * (bonusState.armorLevel || 0)); // up to 60%
                                const damageFloat = baseDamage * (1 - reduction);
                                const damage = Math.max(0.25, damageFloat); // always some minimum damage so player can die
                                gameData.health = Math.max(0, gameData.health - damage);
                                if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;

                                // Armor reflect chance
                                if (bonusState.armorReflectLevel > 0) {
                                    const chance = 0.12 * bonusState.armorReflectLevel; // 12% per level
                                    if (Math.random() < chance) {
                                        // Try to reflect: damage nearest monster within 4 units
                                        try {
                                            let nearestIdx = -1; let nd = 99999;
                                            for (let mi = 0; mi < monsters.length; mi++) {
                                                const d = BABYLON.Vector3.Distance(monsters[mi].position, stickman.position);
                                                if (d < 4 && d < nd) { nd = d; nearestIdx = mi; }
                                            }
                                            if (nearestIdx !== -1) {
                                                let rMob = monsters[nearestIdx];
                                                if (rMob && rMob._type === 'boss') {
                                                    rMob._hp -= 300;
                                                    if (rMob._hp <= 0) handleMonsterKill(nearestIdx);
                                                } else {
                                                    handleMonsterKill(nearestIdx);
                                                }
                                            }
                                        } catch(e) {}
                                    }
                                }

                                try { if (gameData.shakeCamera) gameData.shakeCamera(0.18, 250); } catch(e) {}
                                // La logique de mort / revive est mainteneant gérée globalement en haut de la boucle de rendu
                            }
                        }
                    } catch(e) {}
                }
            }
        });

        // --- Dynamic shadow caster management: only nearest monsters cast shadows ---
        try {
            if (scene.shadowGenerator && scene._registeredMonsters && scene._registeredMonsters.length > 0) {
                const shadowRadius = 60; // only monsters within 60 units cast shadows
                scene._registeredMonsters.forEach(m => {
                    if (!m || m.isDisposed()) return;
                    const d = BABYLON.Vector3.DistanceSquared(m.position, stickman.position);
                    if (d <= shadowRadius * shadowRadius) {
                        if (!m._castsShadow) {
                            scene.shadowGenerator.addShadowCaster(m, true);
                            m._castsShadow = true;
                        }
                    } else {
                        if (m._castsShadow) {
                            try { scene.shadowGenerator.removeShadowCaster(m); } catch(e) {}
                            m._castsShadow = false;
                        }
                    }
                });
            }
        } catch (e) {}

        const now = Date.now();
        const cooldownMultiplier = Math.max(0.25, 1 - 0.08 * (bonusState.cooldownReductionLevel || 0));
        const fireCooldown = Math.floor(Math.max(100, 2500 - (bonusState.fireRateLevel * 600)) * cooldownMultiplier);
        
        // --- 1. CRÉATION DES TIRS ---
        if (now - lastFireTime > fireCooldown) { 
            lastFireTime = now;

            let nearestMonster = null;
            let minDistance = 30; // Visée automatique étendue à 30 mètres (360°)

            monsters.forEach(m => {
                const dist = BABYLON.Vector3.Distance(stickman.position, m.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestMonster = m;
                }
            });

            let targetDir;
            if (nearestMonster) {
                // Amélioration de la visée automatique
                const targetPos = nearestMonster.position.clone();
                targetPos.y += 1.2; // On tire à l'horizontale (à la même hauteur que le bras) pour ne plus plonger dans le sol
                
                const startPos = stickman.position.clone();
                startPos.y += 1.2; // Le point de départ réel de la boule de feu
                
                const dir = targetPos.subtract(startPos);
                if (dir.length() < 0.1) {
                    targetDir = camera.getForwardRay().direction;
                } else {
                    targetDir = dir.normalize();
                }
            } else {
                targetDir = camera.getForwardRay().direction; // Le tir prend l'angle vertical de la caméra
            }

            let numProjectiles = 1 + (bonusState.extraProjectilesLevel || 0);
            let speedMult = 1 + (bonusState.extraProjectilesLevel || 0) * 0.2;

            for (let i = 0; i < numProjectiles; i++) {
                let currentDir = targetDir;
                if (numProjectiles > 1) {
                    let angleOffset = (i - (numProjectiles - 1) / 2) * 0.2; // Écart de 0.2 radians entre chaque tir
                    let rotMat = BABYLON.Matrix.RotationY(angleOffset);
                    currentDir = BABYLON.Vector3.TransformNormal(targetDir, rotMat);
                }

                const fireball = BABYLON.MeshBuilder.CreateSphere("fireball", {diameter: 0.6}, scene);
                fireball.position = stickman.position.clone();
                fireball.position.y += 1.2;

                const fireMat = new BABYLON.StandardMaterial("fireMat", scene);
                fireMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0); 
                fireball.material = fireMat;

                // Plus de moteur physique pour la boule = 0 rebond imprévu et meilleures performances
                const proj = { mesh: fireball, life: 60, direction: currentDir, speedMult: speedMult, owner: 'player', damage: 1 };

                // Add a simple particle trail if possible
                try {
                    const trail = new BABYLON.ParticleSystem("trail", 200, scene);
                    trail.particleTexture = new BABYLON.Texture("assets/particles/smoke.png", scene);
                    trail.emitter = fireball; // attach
                    trail.minEmitBox = new BABYLON.Vector3(0, 0, 0);
                    trail.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
                    trail.color1 = new BABYLON.Color4(0.2, 0.2, 0.2, 0.6);
                    trail.color2 = new BABYLON.Color4(0.05, 0.05, 0.05, 0.2);
                    trail.minSize = 0.1; trail.maxSize = 0.4;
                    trail.minLifeTime = 0.2; trail.maxLifeTime = 0.8;
                    trail.emitRate = 80;
                    trail.direction1 = new BABYLON.Vector3(-0.5, -0.1, -0.5);
                    trail.direction2 = new BABYLON.Vector3(0.5, 0.1, 0.5);
                    trail.gravity = new BABYLON.Vector3(0, -1, 0);
                    trail.disposeOnStop = true;
                    trail.start();
                    proj._trail = trail;
                } catch (e) {}

                projectiles.push(proj);
                try { if (fireSound) fireSound.play(); } catch(e) {}
            }
        }

            // --- 2. DÉPLACEMENT ET COLLISIONS DES TIRS ---
        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            p.life--;

            // Déplacement manuel de la boule basé sur le temps et les bonus
            let speed = 20 * (p.speedMult || 1) * dt;
            p.mesh.position.addInPlace(p.direction.scale(speed));

            // Update particle trail if exists
            if (p._trail && !p._trail.isStopped) {
                p._trail.emitter = p.mesh;
            }

            // projectile from player: hit monsters; from monster: hit player
            if (p.owner === 'player') {
                for (let j = 0; j < monsters.length; j++) {
                    if (BABYLON.Vector3.Distance(p.mesh.position, monsters[j].position) < 2.8) {
                        // Apply knockback before damage
                        try {
                            const dir = monsters[j].position.subtract(p.mesh.position).normalize();
                            if (monsters[j].physicsAgg && monsters[j].physicsAgg.body) {
                                monsters[j].physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(dir.x * 8, 6, dir.z * 8));
                            } else if (monsters[j].physicsBody) {
                                monsters[j].physicsBody.setLinearVelocity(new BABYLON.Vector3(dir.x * 8, 6, dir.z * 8));
                            }
                        } catch (e) {}


                        // Small particle explosion at hit
                        try {
                            const ps = new BABYLON.ParticleSystem("hitSpark", 200, scene);
                            ps.particleTexture = new BABYLON.Texture("assets/particles/spark.png", scene);
                            ps.emitter = p.mesh.position.clone();
                            ps.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
                            ps.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
                            ps.color1 = new BABYLON.Color4(1, 0.6, 0.1, 1.0);
                            ps.color2 = new BABYLON.Color4(1, 0.3, 0.05, 1.0);
                            ps.minSize = 0.05; ps.maxSize = 0.2;
                            ps.minLifeTime = 0.2; ps.maxLifeTime = 0.6;
                            ps.emitRate = 400;
                            ps.direction1 = new BABYLON.Vector3(-1, -1, -1);
                            ps.direction2 = new BABYLON.Vector3(1, 1, 1);
                            ps.gravity = new BABYLON.Vector3(0, -9.8, 0);
                            ps.disposeOnStop = true;
                            ps.start();
                            setTimeout(() => ps.stop(), 120);
                        } catch (e) {}

                        try { if (gameData.hitSound) gameData.hitSound.play(); } catch(e) {}

                        // Flash overlay on the hit monster: a very brief white emissive mesh
                        try {
                            const m = monsters[j];
                            if (m && !m.isDisposed()) {
                                const flashSize = (m.getBoundingInfo ? Math.max(0.8, Math.min(2.5, m.getBoundingInfo().boundingBox.extendSize.length())) : 1.2);
                                const flash = BABYLON.MeshBuilder.CreateSphere("hitFlash_" + Date.now(), { diameter: flashSize * 1.05 }, scene);
                                flash.position = m.position.clone();
                                flash.position.y += 0.4;
                                const fm = new BABYLON.StandardMaterial("hitFlashMat", scene);
                                fm.emissiveColor = new BABYLON.Color3(1, 1, 1);
                                fm.alpha = 0.95;
                                fm.disableLighting = true;
                                flash.material = fm;
                                flash.isPickable = false;
                                flash.receiveShadows = false;
                                flash.renderingGroupId = 2;
                                setTimeout(() => { try { flash.dispose(); } catch (e) {} }, 90);
                            }
                        } catch (e) {}

                        // Damage monster by projectile.damage (default 1)
                        try {
                            let dmg = p.damage || 1;
                            if (monsters[j]._type === 'boss' && monsters[j]._isAttracting) dmg = 0; // Boss est invulnérable s'il attire
                            monsters[j]._hp = (monsters[j]._hp || 1) - dmg;
                            try { if (gameData && gameData.showHitMarker && dmg > 0) gameData.showHitMarker(); } catch(e) {}
                        } catch (e) {}

                        // Show small damage popup
                        try {
                            const dmgTxt = new BABYLON.GUI.TextBlock();
                            dmgTxt.text = `-${p.damage || 1}`;
                            dmgTxt.color = "#ffdd55";
                            dmgTxt.fontSize = 20;
                            dmgTxt.linkOffsetY = -30;
                            const popup = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("popupUI");
                            popup.addControl(dmgTxt);
                            dmgTxt.linkWithMesh(monsters[j]);
                            dmgTxt.linkOffsetY = -50;
                            setTimeout(()=>{ try { popup.removeControl(dmgTxt); popup.dispose(); } catch(e) {} }, 600);
                        } catch(e) {}

                        if ((monsters[j]._hp || 0) <= 0) {
                            handleMonsterKill(j);
                        }

                        p.life = 0;
                        break;
                    }
                }
            } else if (p.owner === 'monster') {
                // enemy projectile hits player
                try {
                    if (BABYLON.Vector3.Distance(p.mesh.position, stickman.position) < 1.6) {
                        // apply damage to player (simple, respects shield/armor)
                        const baseDamage = p.damage || 1;
                        try {
                            if (gameData && typeof gameData.health === 'number') {
                                // Shield absorbs hits first
                                if (bonusState._shieldActive && bonusState._shieldHits > 0) {
                                    bonusState._shieldHits = Math.max(0, bonusState._shieldHits - 1);
                                    if (gameData.scene && gameData.scene._shieldMesh) {
                                        try { gameData.scene._shieldMesh.scaling.scaleInPlace(0.9); } catch(e) {}
                                    }
                                    if (bonusState._shieldHits <= 0) {
                                        bonusState._shieldActive = false;
                                        try { if (gameData.scene && gameData.scene._shieldMesh) { gameData.scene._shieldMesh.dispose(); gameData.scene._shieldMesh = null; } } catch(e) {}
                                    }
                                } else {
                                    const reduction = Math.min(0.6, 0.12 * (bonusState.armorLevel || 0));
                                    const damageFloat = baseDamage * (1 - reduction);
                                    const damage = Math.max(0.25, damageFloat);
                                    gameData.health = Math.max(0, gameData.health - damage);
                                    if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                                    if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                                }
                            }
                        } catch(e) {}

                        try { if (gameData.hitSound) gameData.hitSound.play(); } catch(e) {}
                        p.life = 0;
                    }
                } catch(e) {}
            }

            if (p.life <= 0) {
                p.mesh.dispose();
                projectiles.splice(i, 1);
                i--;
            }
        }

        // --- Pickups (heal packs) update ---
        try {
            if (gameData.pickups && gameData.pickups.length > 0) {
            const dtSec = dt;
                for (let pi = 0; pi < gameData.pickups.length; pi++) {
                    const pk = gameData.pickups[pi];
                    pk.life -= dtSec;
                    try { if (pk.mesh && !pk.mesh.isDisposed()) pk.mesh.rotation.y += dtSec * 2.5; } catch(e) {}

                    if (pk.mesh && !pk.mesh.isDisposed()) {
                        const d = BABYLON.Vector3.Distance(pk.mesh.position, stickman.position);
                        if (d < 2.0) {
                            // pickup collected
                            try {
                                const heal = 10;
                                gameData.health = Math.min(gameData.maxHealth, gameData.health + heal);
                                if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;

                                // popup
                                try {
                                    const pop = new BABYLON.GUI.TextBlock();
                                    pop.text = "+10 HP";
                                    pop.color = "#7CFF7C";
                                    pop.fontSize = 22;
                                    const popupUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("pickupUI");
                                    popupUI.addControl(pop);
                                    pop.linkWithMesh(pk.mesh);
                                    pop.linkOffsetY = -40;
                                    setTimeout(()=>{ try { popupUI.removeControl(pop); popupUI.dispose(); } catch(e) {} }, 900);
                                } catch(e) {}
                            } catch(e) {}
                            try { pk.mesh.dispose(); } catch(e) {}
                            gameData.pickups.splice(pi, 1);
                            pi--;
                            continue;
                        }
                    }

                    if (pk.life <= 0) {
                        try { if (pk.mesh) pk.mesh.dispose(); } catch(e) {}
                        gameData.pickups.splice(pi, 1);
                        pi--;
                    }
                }
            }
        } catch(e) {}

        currentScene.render();
    };

    // start render loop
    engine.runRenderLoop(() => { try { renderLoop && renderLoop(); } catch(e) {} });

    window.addEventListener("resize", function () {
        engine.resize();
    });
});