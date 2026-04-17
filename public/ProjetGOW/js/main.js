import { getHeight, limitRadius, waterLevel } from "./utils.js";
import { createTerrain } from "./terrain.js";
import { createPlayer } from "./player.js";
import { updateBossAI } from "./bossAI.js";
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
        bossKillsText.text = "Kills : 300";
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
            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 300;
            let killsLeft = Math.max(0, gameData.nextBossThreshold - gameData.kills);
            gameData.bossKillsText.text = "Kills : " + killsLeft;

            gameData.currentXp += 50; // Donne 50 XP pour le test

            let progress = Math.min(100, (gameData.currentXp / gameData.xpRequiredForLevel) * 100);
            gameData.xpBar.width = progress + "%";

            if (gameData.currentXp >= gameData.xpRequiredForLevel) {
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
        // Ordre de rotation naturelle des boss (progressif)
        const bossRotation = ['goliath', 'amalgame', 'kraken', 'nuee', 'mimic'];

        const spawnBossLogic = (bossType) => {
            if (!gameData || isGamePaused || gameData.bossSpawned) return;
            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 300;
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
        const monsters = createMonsters(scene, 25); // Vague 1 initiale plus nerveuse

        const waveData = {
            elapsedTime: 0,
            nextWaveIndex: 1,
            wavesSurvived: 0,
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

        const endScoreMsg = new BABYLON.GUI.TextBlock();
        endScoreMsg.text = "Calcul du score...";
        endScoreMsg.color = "yellow";
        endScoreMsg.fontSize = 24;
        endScoreMsg.height = "40px";
        endStack.addControl(endScoreMsg);

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

        // --- OBJECT POOLING ---
        const fireballPool = [];
        try {
            const fireMat = new BABYLON.StandardMaterial("fireMat", scene);
            fireMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0);
            for (let i = 0; i < 50; i++) {
                const fireball = BABYLON.MeshBuilder.CreateSphere("fireball_" + i, {diameter: 0.6}, scene);
                fireball.material = fireMat;
                fireball.isVisible = false;
                
                const trail = new BABYLON.ParticleSystem("trail_" + i, 200, scene);
                trail.particleTexture = new BABYLON.Texture("assets/particles/smoke.png", scene);
                trail.emitter = fireball;
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
                trail.disposeOnStop = false; // Important : pas de destruction automatique
                
                fireballPool.push({ mesh: fireball, trail: trail, inUse: false });
            }
        } catch(e) {}

        const hitSparkPool = [];
        try {
            for (let i = 0; i < 20; i++) {
                const ps = new BABYLON.ParticleSystem("hitSpark_" + i, 200, scene);
                ps.particleTexture = new BABYLON.Texture("assets/particles/spark.png", scene);
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
                ps.disposeOnStop = false; // Important
                
                hitSparkPool.push({ ps: ps, inUse: false });
            }
        } catch(e) {}

        const getFireball = () => fireballPool.find(p => !p.inUse) || null;
        const getHitSpark = () => hitSparkPool.find(p => !p.inUse) || null;

        const sceneData = { scene, stickman, monsters, inputMap, camera, cover, birds, fpsText, bossKillsText, pausePanel, upgradePanel, xpBar, waveData, card1, card2, card3, kills: 0, currentXp: 0, xpRequiredForLevel: 100, health: 100, maxHealth: 100, hpBar: hpBar, hpText: hpText, fireSound, explosionSound, hitSound, pickups: [], timeScale: 1, showHitMarker, damageVignette, getFireball, getHitSpark, bossCount: 0 };

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
        sceneData.showDeathScreen = async () => {
            if (sceneData.isDead) return;
            sceneData.isDead = true;
            endPanel.isVisible = true;
            isGamePaused = true;
            try { freezeScene(scene); } catch(e) {}

            const vagues = sceneData.waveData.wavesSurvived;
            endScoreMsg.text = `Vagues survécues : ${vagues} | Sauvegarde...`;
            const token = localStorage.getItem("token");

            if (token) {
                try {
                    const res = await fetch('/api/scores', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ gameId: 'revenge', score: vagues })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        if (data.message && data.message.includes("meilleur")) {
                            endScoreMsg.text = `Vagues : ${vagues} | Ton record est meilleur.`;
                        } else {
                            endScoreMsg.text = `Vagues : ${vagues} | Score sauvegardé !`;
                        }
                    } else {
                        endScoreMsg.text = `Vagues : ${vagues} | Erreur de sauvegarde.`;
                    }
                } catch (e) {
                    endScoreMsg.text = `Vagues : ${vagues} | Serveur injoignable.`;
                }
            } else {
                endScoreMsg.text = `Vagues : ${vagues} | Connecte-toi pour sauvegarder`;
            }
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
            
            // Conserve le surplus d'XP et augmente le palier de 20%
            sceneData.currentXp = Math.max(0, sceneData.currentXp - sceneData.xpRequiredForLevel);
            sceneData.xpRequiredForLevel = Math.floor(sceneData.xpRequiredForLevel * 1.8);
            
            let progress = Math.min(100, (sceneData.currentXp / sceneData.xpRequiredForLevel) * 100);
            sceneData.xpBar.width = progress + "%";
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
        
        // Culling pour l'herbe (l'animation de vent est maintenant gérée sur le GPU via les Custom Shaders)
        try {
            if (scene._swayGrass && stickman) {
                const grassMaxDistSq = 150 * 150; // 150 mètres max (l'herbe est invisible au-delà de toute façon)
                scene._swayGrass.forEach(g => {
                    const distSq = BABYLON.Vector3.DistanceSquared(stickman.position, g.position);
                    
                    // Culling : Désactivation totale de l'herbe lointaine
                    if (distSq > grassMaxDistSq) {
                        if (g.isEnabled()) g.setEnabled(false);
                    } else {
                        if (!g.isEnabled()) g.setEnabled(true);
                    }
                });
            }
        } catch (e) {}

        const handleMonsterKill = (m) => {
            const j = monsters.indexOf(m);
            if (j === -1) return;
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
            
            // --- SYSTÈME D'XP ---
            let xpGain = 10;
            if (m._type === 'tank' || m._type === 'ranged') {
                xpGain = 25;
            } else if (['boss', 'amalgame', 'kraken', 'nuee', 'mimic'].includes(m._type)) {
                xpGain = 500;
            }
            
            if (bonusState.xpBoostLevel > 0) {
                xpGain += xpGain * (bonusState.xpBoostLevel * 0.15); // +15% d'XP par niveau
            }
            
            gameData.currentXp += Math.floor(xpGain);
            
            let progress = Math.min(100, (gameData.currentXp / gameData.xpRequiredForLevel) * 100);
            if(gameData.xpBar) gameData.xpBar.width = progress + "%";

            if (gameData.currentXp >= gameData.xpRequiredForLevel && !gameData.upgradePanel.isVisible) {
                showUpgradeMenu(gameData);
            }

            // Magnet: small heal on kill if magnetLevel present
            try {
                if (bonusState.magnetLevel > 0 && typeof gameData.health === 'number') {
                    const heal = Math.floor(2 * bonusState.magnetLevel);
                    gameData.health = Math.min(gameData.maxHealth, gameData.health + heal);
                    if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                    if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                }
            } catch(e) {}

            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 300;

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
                    gameData.bossCount++;
                    
                    let nextStep = 300;
                    if (gameData.bossCount >= 2) {
                        nextStep = 300 + (gameData.bossCount - 1) * 100; // +400 pour le 3ème, +500 pour le 4ème, etc.
                    }
                    gameData.nextBossThreshold += nextStep;
                    
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
                        let bossIndex = (gameData.bossCount || 0) % 5;
                        let boss = bossFactoriesLocal[bossRotationOrder[bossIndex]]();
                        
                        const bx = stickman.position.x + (Math.random() > 0.5 ? 30 : -30);
                        const bz = stickman.position.z + (Math.random() > 0.5 ? 30 : -30);
                        boss.position = new BABYLON.Vector3(bx, 20, bz);
                        monsters.push(boss);
                    }, 50);
                }
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
                waveData.wavesSurvived++;
                const newMobs = createMonsters(scene, nextWave.count);
                monsters.push(...newMobs);
                waveData.nextWaveIndex++;
            }
        } else if (!gameData.bossSpawned) {
            // Cycle infini : Chaque 1 min (60s) au lieu de 2 min
            if (timeInSeconds - waveData.last2MinTick >= 60) {
                waveData.last2MinTick += 60;
                waveData.wavesSurvived++;
                waveData.currentBaseCount += 20;
                const newMobs = createMonsters(scene, waveData.currentBaseCount);
                monsters.push(...newMobs);
            }
            // Cycle infini : Chaque 2.5 min (150s) au lieu de 5 min
            if (timeInSeconds - waveData.last5MinTick >= 150) {
                waveData.last5MinTick += 150;
                waveData.wavesSurvived++;
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

        // Remplacement du Raycast par une vérification mathématique pure
        const terrainHeight = getHeight(stickman.position.x, stickman.position.z);
        const isGrounded = stickman.position.y <= terrainHeight + 1.3; // 1.1 (centre de la capsule) + 0.2 de tolérance

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

            if (updateBossAI(monster, stickman, scene, gameData, dt, nowMs, distToPlayer, engine, waterLevel, bonusState, projectiles, getHeight, monsters)) {
                return;
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
                                const reduction = 0.75 * (1 - Math.exp(-0.2 * (bonusState.armorLevel || 0))); // Rendement dégressif, max 75%
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
                                                    if (rMob._hp <= 0) handleMonsterKill(rMob);
                                                } else {
                                                    handleMonsterKill(rMob);
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

                let pooledObj = gameData.getFireball && gameData.getFireball();
                if (pooledObj) {
                    pooledObj.inUse = true;
                    pooledObj.mesh.position = stickman.position.clone();
                    pooledObj.mesh.position.y += 1.2;
                    pooledObj.mesh.isVisible = true;

                    const proj = { 
                        mesh: pooledObj.mesh, 
                        life: 60, 
                        direction: currentDir, 
                        speedMult: speedMult, 
                        owner: 'player', 
                        damage: 1,
                        pooledObj: pooledObj
                    };

                    if (pooledObj.trail) {
                        pooledObj.trail.start();
                        proj._trail = pooledObj.trail;
                    }

                    projectiles.push(proj);
                    try { if (fireSound) fireSound.play(); } catch(e) {}
                } else {
                    // Fallback de sécurité si le pool est vide
                    const fireball = BABYLON.MeshBuilder.CreateSphere("fireball", {diameter: 0.6}, scene);
                    fireball.position = stickman.position.clone();
                    fireball.position.y += 1.2;
                    const fireMat = new BABYLON.StandardMaterial("fireMat", scene);
                    fireMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0); 
                    fireball.material = fireMat;
                    const proj = { mesh: fireball, life: 60, direction: currentDir, speedMult: speedMult, owner: 'player', damage: 1 };
                    try {
                        const trail = new BABYLON.ParticleSystem("trail", 200, scene);
                        trail.particleTexture = new BABYLON.Texture("assets/particles/smoke.png", scene);
                        trail.emitter = fireball;
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
                            let pooledSpark = gameData.getHitSpark && gameData.getHitSpark();
                            if (pooledSpark) {
                                pooledSpark.inUse = true;
                                pooledSpark.ps.emitter = p.mesh.position.clone();
                                pooledSpark.ps.start();
                                setTimeout(() => { pooledSpark.ps.stop(); pooledSpark.inUse = false; }, 120);
                            }
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
                            handleMonsterKill(monsters[j]);
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
                                    const reduction = 0.75 * (1 - Math.exp(-0.2 * (bonusState.armorLevel || 0))); // Rendement dégressif, max 75%
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
                if (p.pooledObj) {
                    p.pooledObj.mesh.isVisible = false;
                    p.pooledObj.inUse = false;
                    if (p.pooledObj.trail) {
                        p.pooledObj.trail.stop();
                    }
                } else {
                    p.mesh.dispose(); // S'applique toujours pour les tirs ennemis / fallback
                }
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