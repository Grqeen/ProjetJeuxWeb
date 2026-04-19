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
import { buildSettingsPanel } from "./settingsPanel.js";
import { bonusState, showUpgradeMenu, updateBonuses, resetBonuses } from "./bonus.js";

export const gameSettings = {
    fullscreen: false,
    quality: "high",
    resolution: 1.0,
    vsync: true,
    shadows: true,
    grass: true,
    particles: true,
    fov: 80,
    bloom: true,
    motionBlur: false,
    ambientOcclusion: false,
    showFps: false,
    display: {
        fullscreen: false,
        vsync: true,
        fps: false
    },
    audio: {
        master: 1.0,
        music: 0.5,
        sfx: 0.8,
        spatial: true
    },
    controls: {
        sensitivity: 1.0,
        invertY: false,
        vibration: true,
        deadzone: 0.1
    },
    gameplay: {
        language: "fr",
        showHUD: true
    },
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
    let authStatusMenu = document.getElementById("authStatusMenu");
    if (!authStatusMenu) {
        authStatusMenu = document.createElement("div");
        authStatusMenu.id = "authStatusMenu";
        document.body.appendChild(authStatusMenu);
        
        const style = document.createElement("style");
        style.innerHTML = `
            body, html {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #000;
            }
            canvas {
                display: block;
                width: 100%;
                height: 100%;
            }
            #authStatusMenu {
                position: fixed;
                top: 20px;
                right: 25px;
                z-index: 50;
                font-family: 'Lilita One', 'Segoe UI', cursive, sans-serif;
                font-size: 1rem;
                color: white;
                text-shadow: 2px 2px 0 #000;
                text-align: right;
                pointer-events: auto;
            }
            #authStatusMenu span {
                color: #ffcc00;
                text-shadow: 2px 2px 0 #b8860b;
            }
            #authStatusMenu a {
                font-family: 'Lilita One', 'Segoe UI', cursive, sans-serif;
                color: #333;
                text-decoration: none;
                background: #ffcc00;
                border: 2px solid #b8860b;
                padding: 8px 18px;
                border-radius: 10px;
                display: inline-block;
                margin-top: 5px;
                text-shadow: none;
                transition: all 0.3s ease;
                font-size: 1rem;
                box-shadow: 0 4px 0 #b8860b;
            }
            #authStatusMenu a:hover {
                transform: scale(1.05) rotate(-2deg);
                box-shadow: 0 6px 0 #b8860b;
            }
            #authStatusMenu #menuLogoutBtn {
                background: #ff5252;
                border: 2px solid #c62828;
                box-shadow: 0 3px 0 #c62828;
                padding: 5px 12px;
                font-size: 0.7rem;
                color: white !important;
                text-shadow: none;
                border-radius: 8px;
            }
            #authStatusMenu #menuLogoutBtn:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 0 #c62828;
            }
        `;
        document.head.appendChild(style);
    }

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if(token && username) {
        authStatusMenu.innerHTML = `Connecté en tant que <span>${username}</span> <br><a href="#" id="menuLogoutBtn">Déconnexion</a>`;
        document.getElementById('menuLogoutBtn').onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            window.location.reload();
        };
    } else {
        authStatusMenu.innerHTML = `<a href="/login.html?redirect=/ProjetGOW/index.html">Se connecter</a>`;
    }

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

// Gèle l'état de la scène (animations, systèmes de particules, physique).
    const freezeScene = (s) => {
        try {
            if (!s) return;
            try { s._pausedAnimationGroups = s.animationGroups ? [...s.animationGroups] : []; s.animationGroups.forEach(ag=>{ try { ag.pause(); } catch(e){} }); } catch(e) {}
            try { s._pausedParticleSystems = s.particleSystems ? [...s.particleSystems] : []; s.particleSystems.forEach(ps=>{ try { ps.stop(); ps._wasRunning = true; } catch(e){} }); } catch(e) {}
            try { const pe = s.getPhysicsEngine && s.getPhysicsEngine(); if (pe && pe.setTimeStep) pe.setTimeStep(0); } catch(e) {}
        } catch(e) {}
    };

// Dégèle l'état de la scène pour reprendre son exécution dynamique.
    const unfreezeScene = (s) => {
        try {
            if (!s) return;
            try { if (s._pausedAnimationGroups) s._pausedAnimationGroups.forEach(ag=>{ try { ag.play(); } catch(e){} }); s._pausedAnimationGroups = null; } catch(e) {}
            try { if (s._pausedParticleSystems) { s._pausedParticleSystems.forEach(ps=>{ try { if (ps._wasRunning) ps.start(); ps._wasRunning = false; } catch(e){} }); s._pausedParticleSystems = null; } } catch(e) {}
            try { const pe = s.getPhysicsEngine && s.getPhysicsEngine(); if (pe && pe.setTimeStep) pe.setTimeStep(1/60); } catch(e) {}
        } catch(e) {}
    };

// Alterne l'état de pause de la partie en cours.
    const togglePause = () => {
        isGamePaused = !isGamePaused;
        try {
            if (isGamePaused) freezeScene(currentScene);
            else unfreezeScene(currentScene);
        } catch(e) {}
    };

// Initialise et configure l'intégralité de la scène de jeu (caméra, interface, physique).
    const createGameScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.collisionsEnabled = true;
        
        const hk = new BABYLON.HavokPlugin(true, havokInstance);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);
        
        scene.skipPointerMovePicking = true;

        const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, 1.0, 8, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        
        const baseSensibility = 2000;
        camera.angularSensibilityX = baseSensibility / gameSettings.controls.sensitivity;
        camera.angularSensibilityY = (gameSettings.controls.invertY ? -1 : 1) * (baseSensibility / gameSettings.controls.sensitivity);

        camera.checkCollisions = true; 
        camera.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5); 
        camera.upperBetaLimit = Math.PI / 2 - 0.05;
        camera.maxZ = 2000; 

        window.gamepadManager = {
            lastVibration: 0,
            vibrationDuration: 0,
            vibrate: function(intensity = 1.0, duration = 100) {
                if (!gameSettings.controls.vibration) return;
                
                const gamepad = navigator.getGamepads && navigator.getGamepads()[0];
                if (gamepad && gamepad.vibrationActuator) {
                    try {
                        gamepad.vibrationActuator.playEffect("dual-rumble", {
                            startDelay: 0,
                            duration: duration,
                            weakMagnitude: intensity * 0.7,
                            strongMagnitude: intensity
                        });
                    } catch(e) {}
                }
            },
            getAnalogStick: function(stickIndex = 0) {
                const gamepad = navigator.getGamepads && navigator.getGamepads()[0];
                if (!gamepad || stickIndex < 0) return { x: 0, y: 0 };
                
                const indices = stickIndex === 0 ? [0, 1] : [2, 3];
                let x = gamepad.axes[indices[0]] || 0;
                let y = gamepad.axes[indices[1]] || 0;
                
                const deadzone = gameSettings.controls.deadzone;
                const magnitude = Math.sqrt(x * x + y * y);
                
                if (magnitude < deadzone) {
                    return { x: 0, y: 0 };
                }
                
                const normalizedMagnitude = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
                return {
                    x: (x / magnitude) * normalizedMagnitude,
                    y: (y / magnitude) * normalizedMagnitude
                };
            }
        };
        
        window.gameAudioManager = window.gameAudioManager || {};
        window.gameAudioManager.gamepadManager = window.gamepadManager;

        const gameUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene);
        const fpsText = new BABYLON.GUI.TextBlock();
        fpsText.text = "0 FPS";
        fpsText.color = "yellow";
        fpsText.fontSize = 24;
        fpsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        fpsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        fpsText.left = "10px";
        fpsText.top = "42px";
        fpsText.bottom = null;
        fpsText.isVisible = gameSettings.showFps;
        gameUI.addControl(fpsText);

        const bossKillsText = new BABYLON.GUI.TextBlock();
        bossKillsText.text = "Kills : 300";
        bossKillsText.color = "yellow"; 
        bossKillsText.fontSize = 26;
        bossKillsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        bossKillsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        bossKillsText.left = "-20px";
        bossKillsText.top = "10px";
        bossKillsText.isVisible = gameSettings.gameplay.showHUD;
        gameUI.addControl(bossKillsText);

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
        xpContainer.isVisible = gameSettings.gameplay.showHUD;
        gameUI.addControl(xpContainer);

        const xpBar = new BABYLON.GUI.Rectangle();
        xpBar.width = "0%"; 
        xpBar.height = "100%";
        xpBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        xpBar.background = "#2980b9"; 
        xpBar.thickness = 0;
        xpBar.cornerRadius = 10;
        xpContainer.addControl(xpBar);

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
        hpContainer.isVisible = gameSettings.gameplay.showHUD;
        gameUI.addControl(hpContainer);

        const hpBar = new BABYLON.GUI.Rectangle();
        hpBar.width = "100%";
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

        const damageVignette = new BABYLON.GUI.Rectangle("damageVignette");
        damageVignette.width = "100%";
        damageVignette.height = "100%";
        damageVignette.thickness = 30; 
        damageVignette.color = "red";
        damageVignette.alpha = 0; 
        damageVignette.isPointerBlocker = false;
        gameUI.addControl(damageVignette);

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
            if (!gameData || isGamePaused) return; 

            gameData.kills += 10; 
            if (!gameData.nextBossThreshold) gameData.nextBossThreshold = 300;
            let killsLeft = Math.max(0, gameData.nextBossThreshold - gameData.kills);
            gameData.bossKillsText.text = "Kills : " + killsLeft;

            gameData.currentXp += 50; 

            let progress = Math.min(100, (gameData.currentXp / gameData.xpRequiredForLevel) * 100);
            gameData.xpBar.width = progress + "%";

            if (gameData.currentXp >= gameData.xpRequiredForLevel) {
                showUpgradeMenu(gameData);
            }
        });
        gameUI.addControl(debugXpBtn);

        const bossFactories = {
            goliath: (sc) => createBoss(sc),
            amalgame: (sc) => createAmalgame(sc, 1),
            kraken: (sc) => createKraken(sc),
            nuee: (sc) => createNuee(sc),
            mimic: (sc) => createMimic(sc)
        };
        const bossRotation = ['goliath', 'amalgame', 'kraken', 'nuee', 'mimic'];

// Force l'apparition d'un boss de manière ciblée.
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

        const upgradePanel = new BABYLON.GUI.Rectangle();
        upgradePanel.width = 1;
        upgradePanel.height = 1;
        upgradePanel.background = "rgba(0, 0, 0, 0.4)";
        upgradePanel.isVisible = false;
        upgradePanel.zIndex = 100;
        gameUI.addControl(upgradePanel);

        const upgradeGrid = new BABYLON.GUI.Grid();
        upgradeGrid.addColumnDefinition(1/3);
        upgradeGrid.addColumnDefinition(1/3);
        upgradeGrid.addColumnDefinition(1/3);
        upgradeGrid.height = "50%";
        upgradePanel.addControl(upgradeGrid);

// Construit l'interface et le comportement d'une carte d'amélioration au gain de niveau.
        const createUpgradeCard = (titleText, col) => {
            const card = BABYLON.GUI.Button.CreateSimpleButton("card" + col, titleText);
            card.width = "250px";
            card.height = "380px";
            card.color = "white";
            card.background = "#2c3e50";
            card.cornerRadius = 20;
            card.thickness = 4;
            card.textBlock.textWrapping = true;
            card.textBlock.fontSize = 24;

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
        light.intensity = 0.4; 

        let fireSound = null, explosionSound = null, hitSound = null;
        const soundReferences = []; 
        try {
            fireSound = new BABYLON.Sound("fire", "assets/sounds/fireball.wav", scene, null, { volume: 0.6, spatialSound: gameSettings.audio.spatial });
            explosionSound = new BABYLON.Sound("explosion", "assets/sounds/explosion.wav", scene, null, { volume: 0.7, spatialSound: gameSettings.audio.spatial });
            hitSound = new BABYLON.Sound("hit", "assets/sounds/hit.wav", scene, null, { volume: 0.5, spatialSound: gameSettings.audio.spatial });
            soundReferences.push(fireSound, explosionSound, hitSound);
        } catch (e) {}

// Ajuste dynamiquement le volume et la spatialisation des effets sonores.
        const updateAudioVolumes = () => {
            const master = gameSettings.audio.master;
            const musicVol = gameSettings.audio.music;
            const sfxVol = gameSettings.audio.sfx;
            const spatial = gameSettings.audio.spatial;
            
            if (fireSound) fireSound.setVolume(0.6 * master * sfxVol);
            if (explosionSound) explosionSound.setVolume(0.7 * master * sfxVol);
            if (hitSound) hitSound.setVolume(0.5 * master * sfxVol);
            
            soundReferences.forEach(sound => {
                if (sound) {
                    sound.spatialSound = spatial;
                    if (spatial && camera) {
                        sound.setLocalDirectionToMesh(camera.getDirection(BABYLON.Axis.Z));
                    }
                }
            });
        };

        updateAudioVolumes();
        
        window.gameAudioManager = { fireSound, explosionSound, hitSound, soundReferences, updateAudioVolumes };

        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -0.5), scene);
        dirLight.position = new BABYLON.Vector3(100, 100, 50);
        dirLight.intensity = 0.8;
        scene.dirLight = dirLight; 

        if (gameSettings.shadows) {
            const shadowGenerator = new BABYLON.CascadedShadowGenerator(512, dirLight);
            shadowGenerator.lambda = 0.7;
            shadowGenerator.shadowMaxZ = 120;
            shadowGenerator.usePercentageCloserFiltering = true;
            scene.shadowGenerator = shadowGenerator;
        }

        try {
            const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
            pipeline.bloomEnabled = gameSettings.bloom;
            pipeline.bloomThreshold = 0.7;
            pipeline.bloomWeight = 0.35;
            pipeline.fxaaEnabled = true;
            pipeline.imageProcessingEnabled = true;
            pipeline.imageProcessing.vignetteEnabled = true;
            pipeline.imageProcessing.vignetteWeight = 0.3;

            if (gameSettings.motionBlur) {
                const mb = new BABYLON.MotionBlurPostProcess("mb", scene, 1.0, camera);
                mb.isObjectBased = true;
            }

            if (gameSettings.ambientOcclusion) {
                const ssao = new BABYLON.SSAORenderingPipeline("ssao", scene, { ssaoRatio: 0.5, combineRatio: 1.0 }, [camera]);
            }
        } catch (e) {
            console.warn("DefaultRenderingPipeline unavailable:", e);
        }

        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.0015;
        scene.fogColor = new BABYLON.Color3(0.08, 0.09, 0.12);

        createTerrain(scene);

        const stickman = createPlayer(scene);
        stickman.position = new BABYLON.Vector3(0, 3.0, 0);
        
        const playerAgg = new BABYLON.PhysicsAggregate(stickman, BABYLON.PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
        playerAgg.body.setMassProperties({ inertia: new BABYLON.Vector3(0, 0, 0) });
        stickman.physicsBody = playerAgg.body;

        camera.lockedTarget = stickman;
        camera.radius = 15; 
        camera.fov = gameSettings.fov * (Math.PI / 180);
        camera._baseRadius = camera.radius;
        camera._sprintZoom = 0.0; 
        camera._sprintLerp = 0.12; 
        
        const monsters = createMonsters(scene, 25);

        const waveData = {
            elapsedTime: 0,
            nextWaveIndex: 1,
            wavesSurvived: 0,
            waves: [
                { time: 0, count: 20 },
                { time: 10, count: 30 },   
                { time: 25, count: 45 },   
                { time: 50, count: 70 }   
            ],
            last2MinTick: 120,
            last5MinTick: 120,
            currentBaseCount: 70
        };

        createTrees(scene, 300, gameSettings.quality); 

        const { cover } = createSewer(scene);

        if (gameSettings.grass) {
            createGrass(scene, 1000, gameSettings.quality);
        }

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

        const settingsPanelData = buildSettingsPanel(pauseTexture, engine, gameSettings, (panel) => {
            isGamePaused = false;
            if (panel) panel.isVisible = false;
            if (gameData && gameData.pausePanel) gameData.pausePanel.isVisible = false;
            if (gameData && gameData.quitButton) gameData.quitButton.isVisible = false;
            try { unfreezeScene(currentScene); } catch(e) {}
            const authMenu = document.getElementById("authStatusMenu");
            if (authMenu) authMenu.style.display = "none";
        });
        const pausePanel = settingsPanelData.panel;

        const t = window.getTranslation || ((k) => k);
        const quitButton = BABYLON.GUI.Button.CreateSimpleButton("quitBtn", t("quit") || "Quitter la partie");
        quitButton.width = "200px";
        quitButton.height = "50px";
        quitButton.color = "white";
        quitButton.background = "#c0392b";
        quitButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        quitButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        quitButton.left = "-20px";
        quitButton.top = "-20px";
        quitButton.thickness = 0;
        quitButton.cornerRadius = 10;
        quitButton.fontSize = 18;
        quitButton.fontWeight = "bold";
        quitButton.hoverCursor = "pointer";
        quitButton.isVisible = false;
        
        quitButton.onPointerEnterObservable.add(() => {
            quitButton.background = "#e74c3c";
            quitButton.scaleX = 1.05;
            quitButton.scaleY = 1.05;
        });
        
        quitButton.onPointerOutObservable.add(() => {
            quitButton.background = "#c0392b";
            quitButton.scaleX = 1.0;
            quitButton.scaleY = 1.0;
        });

        quitButton.onPointerUpObservable.add(() => {
            try { if (currentScene) currentScene.dispose(); } catch (e) {}
            currentScene = createMenuScene(engine, startGame, gameSettings);
            gameData = null;
            isGamePaused = false;
            const authMenu = document.getElementById("authStatusMenu");
            if (authMenu) authMenu.style.display = "block";
        });
        pauseTexture.addControl(quitButton);

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
        toLobbyBtn.background = "#27ae60";
        toLobbyBtn.thickness = 0;
        toLobbyBtn.cornerRadius = 10;
        toLobbyBtn.fontSize = 18;
        toLobbyBtn.fontWeight = "bold";
        toLobbyBtn.hoverCursor = "pointer";
        toLobbyBtn.onPointerEnterObservable.add(() => {
            toLobbyBtn.background = "#2ecc71";
            toLobbyBtn.scaleX = 1.05;
            toLobbyBtn.scaleY = 1.05;
        });
        toLobbyBtn.onPointerOutObservable.add(() => {
            toLobbyBtn.background = "#27ae60";
            toLobbyBtn.scaleX = 1.0;
            toLobbyBtn.scaleY = 1.0;
        });
        toLobbyBtn.onPointerUpObservable.add(() => {
            try {
                if (currentScene) currentScene.dispose();
            } catch (e) {}
            currentScene = createMenuScene(engine, startGame, gameSettings);
            gameData = null;
            isGamePaused = false;
            const authMenu = document.getElementById("authStatusMenu");
            if (authMenu) authMenu.style.display = "block";
        });
        btnRow.addControl(toLobbyBtn);

        const restartBtn = BABYLON.GUI.Button.CreateSimpleButton("restart", "Recommencer");
        restartBtn.width = "200px";
        restartBtn.height = "50px";
        restartBtn.color = "white";
        restartBtn.background = "#d35400";
        restartBtn.thickness = 0;
        restartBtn.cornerRadius = 10;
        restartBtn.fontSize = 18;
        restartBtn.fontWeight = "bold";
        restartBtn.hoverCursor = "pointer";
        restartBtn.left = "20px";
        restartBtn.onPointerEnterObservable.add(() => {
            restartBtn.background = "#e67e22";
            restartBtn.scaleX = 1.05;
            restartBtn.scaleY = 1.05;
        });
        restartBtn.onPointerOutObservable.add(() => {
            restartBtn.background = "#d35400";
            restartBtn.scaleX = 1.0;
            restartBtn.scaleY = 1.0;
        });
        restartBtn.onPointerUpObservable.add(() => {
            startGame();
        });
        btnRow.addControl(restartBtn);


// Exécute un effet de secousse (shake) sur la caméra pour appuyer un impact.
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

// Affiche brièvement à l'écran un indicateur de dégâts causés.
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
                trail.emitRate = gameSettings.particles ? 80 : 0;
                trail.direction1 = new BABYLON.Vector3(-0.5, -0.1, -0.5);
                trail.direction2 = new BABYLON.Vector3(0.5, 0.1, 0.5);
                trail.gravity = new BABYLON.Vector3(0, -1, 0);
                trail.disposeOnStop = false;
                
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
                ps.emitRate = gameSettings.particles ? 400 : 0;
                ps.direction1 = new BABYLON.Vector3(-1, -1, -1);
                ps.direction2 = new BABYLON.Vector3(1, 1, 1);
                ps.gravity = new BABYLON.Vector3(0, -9.8, 0);
                ps.disposeOnStop = false; 
                
                hitSparkPool.push({ ps: ps, inUse: false });
            }
        } catch(e) {}

// Récupère un projectile inactif dans la réserve d'objets pour éviter une nouvelle instanciation.
        const getFireball = () => fireballPool.find(p => !p.inUse) || null;
// Récupère un système de particules d'impact inactif dans la réserve.
        const getHitSpark = () => hitSparkPool.find(p => !p.inUse) || null;

        const sceneData = { scene, stickman, monsters, inputMap, camera, cover, birds, fpsText, bossKillsText, pausePanel, quitButton, upgradePanel, xpBar, xpContainer, hpBar, hpContainer, waveData, card1, card2, card3, kills: 0, currentXp: 0, xpRequiredForLevel: 100, prevUpgradeKillCount: 0, nextUpgradeKillCount: 20, bossCount: 0, health: 100, maxHealth: 100, hpText, fireSound, explosionSound, hitSound, pickups: [], timeScale: 1, showHitMarker, damageVignette, getFireball, getHitSpark };

        sceneData.shakeCamera = shakeCamera;

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

        sceneData.isDead = false;
// Affiche l'écran de fin et prend en charge l'enregistrement éventuel du score de survie.
        sceneData.showDeathScreen = async () => {
            if (sceneData.isDead) return;
            sceneData.isDead = true;
            endPanel.isVisible = true;
            isGamePaused = true;
            try { freezeScene(scene); } catch(e) {}
            const authMenu = document.getElementById("authStatusMenu");
            if (authMenu) authMenu.style.display = "block";

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

// Place artificiellement la scène de jeu en pause.
        sceneData.pauseGame = () => { 
            isGamePaused = true; 
            try { freezeScene(scene); } catch(e) {}
        };

// Résout le choix du joueur, déduit l'expérience correspondante et reprend la partie.
        sceneData.selectUpgrade = () => {
            sceneData.upgradePanel.isVisible = false;
            isGamePaused = false;
            try { sceneData._playerFrozen = false; } catch(e) {}
            try { unfreezeScene(currentScene); } catch(e) {}
            
            sceneData.currentXp = Math.max(0, sceneData.currentXp - sceneData.xpRequiredForLevel);
            sceneData.xpRequiredForLevel = Math.floor(sceneData.xpRequiredForLevel * 1.8);
            
            let progress = Math.min(100, (sceneData.currentXp / sceneData.xpRequiredForLevel) * 100);
            sceneData.xpBar.width = progress + "%";
        };

        return sceneData;
    };

    let currentScene = null;
    let gameData = null;
    let projectiles = [];
    let lastFireTime = 0;

// Lance la partie après nettoyage de l'ancienne scène.
    const startGame = () => {
        if (currentScene) currentScene.dispose();
        
        resetBonuses();
        const data = createGameScene();
        currentScene = data.scene;
        gameData = data;
        window.currentGameData = data;
        isGamePaused = false;
        projectiles = [];
        lastFireTime = 0;
            const authMenu = document.getElementById("authStatusMenu");
            if (authMenu) authMenu.style.display = "none";
    };

    currentScene = createMenuScene(engine, startGame, gameSettings);

    window.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape" && gameData) {
            if (gameData.isDead) return; 
            if (gameData.upgradePanel && gameData.upgradePanel.isVisible) return;
            togglePause();
            if (gameData.pausePanel) {
                gameData.pausePanel.isVisible = isGamePaused;
            }
            if (gameData.quitButton) {
                gameData.quitButton.isVisible = isGamePaused;
            }
                const authMenu = document.getElementById("authStatusMenu");
                if (authMenu) authMenu.style.display = isGamePaused ? "block" : "none";
        }
    });

// Boucle de traitement principale mise à jour à la vitesse d'affichage du moniteur.
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
        }

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

        try {
            if (gameSettings.audio.spatial && window.gameAudioManager && window.gameAudioManager.soundReferences) {
                const camera = gameData?.camera;
                window.gameAudioManager.soundReferences.forEach(sound => {
                    if (sound && camera) {
                        sound.spatialSound = true;
                        const camDirection = camera.getDirection(BABYLON.Axis.Z);
                        const camPosition = camera.position.clone();
                        sound.setLocalDirectionToMesh(camDirection);
                    }
                });
            }
        } catch (e) {}

        const { stickman, monsters, inputMap, camera, cover, birds, scene, waveData } = gameData;

        if (gameData.health <= 0 && !gameData.isDead) {
            if (bonusState && bonusState.reviveLevel > 0 && !bonusState._reviveUsed) {
                bonusState._reviveUsed = true;
                gameData.health = Math.max(1, Math.floor(gameData.maxHealth * 0.5));
                if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
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

        if (gameData.damageVignette && !gameData.isDead) {
            if (gameData.health <= gameData.maxHealth * 0.5 && gameData.health > 0) {
                const ratio = (gameData.maxHealth * 0.5 - gameData.health) / (gameData.maxHealth * 0.5);
                gameData.damageVignette.alpha = Math.max(0, ratio * 0.8);
            } else {
                gameData.damageVignette.alpha = 0;
            }
        }

        try {
            const sprintPressed = !!inputMap[gameSettings.keys.sprint];
            const base = (camera && camera._baseRadius !== undefined) ? camera._baseRadius : 15;
            const sprintZoom = (camera && camera._sprintZoom !== undefined) ? camera._sprintZoom : 0;
            const lerp = (camera && camera._sprintLerp !== undefined) ? camera._sprintLerp : 0.12;
            const targetRadius = sprintPressed ? (base - sprintZoom) : base;
            if (camera && sprintZoom > 0) {
                camera.radius += (targetRadius - camera.radius) * lerp;
            } else if (camera && camera.radius !== base) {
                camera.radius += (base - camera.radius) * lerp;
            }
        } catch(e) {}
        if (birds && birds.length > 0) {
            updateBirds(birds, stickman.position);
        }
        
        try {
            if (scene._swayGrass && stickman) {
                const grassMaxDistSq = 150 * 150; 
                scene._swayGrass.forEach(g => {
                    const distSq = BABYLON.Vector3.DistanceSquared(stickman.position, g.position);
                    
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
            if (m._type === 'mimic') {
                try { if (m._auraMesh) m._auraMesh.dispose(); } catch(e){}
                try { if (m._sawsMeshes) m._sawsMeshes.forEach(s => s.dispose()); } catch(e){}
                try { if (m._activeMissiles) m._activeMissiles.forEach(p => p.mesh.dispose()); } catch(e){}
                try { if (m._activeZones) m._activeZones.forEach(z => z.mesh.dispose()); } catch(e){}
            }
            
            } catch(e) {}

            try {
                const DROP_CHANCE = 0.0005;
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
            try {
                if (scene._registeredMonsters) {
                    const idx = scene._registeredMonsters.indexOf(monsters[j]);
                    if (idx !== -1) scene._registeredMonsters.splice(idx, 1);
                }
            } catch(e) {}
            monsters.splice(j, 1);
            
            gameData.kills++;
            
            let xpGain = 10;
            if (m._type === 'tank' || m._type === 'ranged') {
                xpGain = 25;
            } else if (['boss', 'amalgame', 'kraken', 'nuee', 'mimic'].includes(m._type)) {
                xpGain = 500;
            }
            
            if (bonusState.xpBoostLevel > 0) {
                xpGain += xpGain * (bonusState.xpBoostLevel * 0.15);
            }
            
            gameData.currentXp += Math.floor(xpGain);
            
            let progress = Math.min(100, (gameData.currentXp / gameData.xpRequiredForLevel) * 100);
            if(gameData.xpBar) gameData.xpBar.width = progress + "%";

            if (gameData.currentXp >= gameData.xpRequiredForLevel && !gameData.upgradePanel.isVisible) {
                showUpgradeMenu(gameData);
            }

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
                let bossPartsLeft = 0;
                if (m._type === 'amalgame') {
                    bossPartsLeft = monsters.filter(x => x._type === 'amalgame').length;
                }
                
                if (bossPartsLeft === 0) {
                    gameData.bossSpawned = false;
                    gameData.bossCount++;
                    
                    let nextStep = 300;
                    if (gameData.bossCount >= 2) {
                        nextStep = 300 + (gameData.bossCount - 1) * 100;
                    }
                    gameData.nextBossThreshold += nextStep;
                    
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

        const timeScale = (gameData && gameData.timeScale) ? gameData.timeScale : 1;
        const deltaMs = engine.getDeltaTime() * timeScale;
        const dt = deltaMs / 1000;

        updateBonuses(gameData, dt, handleMonsterKill);

        const isMimicAlive = monsters.some(m => m._type === 'mimic');
        const targetFogDensity = isMimicAlive ? 0.015 : 0.0015; 
        const targetFogColor = isMimicAlive ? new BABYLON.Color3(0, 0, 0) : new BABYLON.Color3(0.08, 0.09, 0.12);
        const targetLightIntensity = isMimicAlive ? 0.1 : 0.8; 
        
        if (Math.abs(scene.fogDensity - targetFogDensity) > 0.00001) {
            scene.fogDensity += (targetFogDensity - scene.fogDensity) * (dt * 0.5);
            scene.fogColor = BABYLON.Color3.Lerp(scene.fogColor, targetFogColor, dt * 0.5);
            scene.clearColor = new BABYLON.Color4(scene.fogColor.r, scene.fogColor.g, scene.fogColor.b, 1.0); 
            if (scene.dirLight) {
                scene.dirLight.intensity += (targetLightIntensity - scene.dirLight.intensity) * (dt * 0.5);
            }
        }

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
            if (timeInSeconds - waveData.last2MinTick >= 60) {
                waveData.last2MinTick += 60;
                waveData.wavesSurvived++;
                waveData.currentBaseCount += 20;
                const newMobs = createMonsters(scene, waveData.currentBaseCount);
                monsters.push(...newMobs);
            }
            if (timeInSeconds - waveData.last5MinTick >= 150) {
                waveData.last5MinTick += 150;
                waveData.wavesSurvived++;
                waveData.currentBaseCount += 40;
                const newMobs = createMonsters(scene, waveData.currentBaseCount);
                monsters.push(...newMobs);
            }
        }

        let speed = 8.0;
        if (stickman.isCrouched) {
            speed = 3.0;
        } else if (inputMap[gameSettings.keys.sprint]) {
            speed = 14.0;
        }

        if (stickman.position.y < waterLevel) {
            speed *= 0.3;
        }

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

        const terrainHeight = getHeight(stickman.position.x, stickman.position.z);
        const isGrounded = stickman.position.y <= terrainHeight + 1.3;

        if (!stickman.physicsBody) {
            scene.render();
            return;
        }
        const currentVel = stickman.physicsBody.getLinearVelocity();

        if (stickman.limbs) {
            const targetPitch = Math.PI / 2 - camera.beta; 
            
            const maxPitch = Math.PI / 3;
            const clampedPitch = Math.max(-maxPitch, Math.min(maxPitch, targetPitch));

            stickman.limbs.head.rotation.x = clampedPitch; 
            
            if (stickman.limbs.torso) {
                stickman.limbs.torso.rotation.x = clampedPitch * 0.5;
            }

            const horizSpeed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z);
            const walkCycle = Date.now() * 0.015;

            if (horizSpeed > 1) {
                const swingAnim = Math.sin(walkCycle) * 0.8;
                stickman.limbs.leftLeg.rotation.x = swingAnim;
                stickman.limbs.rightLeg.rotation.x = -swingAnim;
                
                stickman.limbs.leftArm.rotation.x = -swingAnim * 0.5 + clampedPitch;
                stickman.limbs.rightArm.rotation.x = swingAnim * 0.5 + clampedPitch;
            } else {
                stickman.limbs.leftLeg.rotation.x *= 0.8;
                stickman.limbs.rightLeg.rotation.x *= 0.8;
                
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
                velY = 12;
                stickman.hasDoubleJumped = true;
                inputMap[" "] = false;
                
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
                    ps.emitRate = gameSettings.particles ? 100 : 0;
                    ps.direction1 = new BABYLON.Vector3(-2, -1, -2);
                    ps.direction2 = new BABYLON.Vector3(2, -0.5, 2);
                    ps.disposeOnStop = true;
                    ps.start();
                    setTimeout(() => ps.stop(), 100);
                } catch(e) {}
            }
        }

        if (!isGrounded) {
            velY -= 25 * dt;
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

            if (monster.stunTime && nowMs < monster.stunTime) {
                if (monster.physicsAgg && monster.physicsAgg.body) {
                    const mVel = monster.physicsAgg.body.getLinearVelocity ? monster.physicsAgg.body.getLinearVelocity() : {x:0,y:0,z:0};
                    try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(0, mVel.y, 0)); } catch(e) {}
                }
                try { if (monster._stunGlow) monster._stunGlow.position.copyFrom(monster.position); } catch(e) {}
                return;
            } else if (monster.stunTime && nowMs >= monster.stunTime) {
                monster.stunTime = 0;
                try { if (monster._stunGlow) { monster._stunGlow.dispose(); monster._stunGlow = null; } } catch(e) {}
            }

            try {
                const createDist = 25;
                const removeDist = 40;
                if (!monster.physicsAgg && distToPlayer <= createDist) {
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

            if (monster.physicsAgg && monster.physicsAgg.body) {
                const dir = stickman.position.subtract(monster.physicsProxy.position).normalize();
                const mVel = monster.physicsAgg.body.getLinearVelocity ? monster.physicsAgg.body.getLinearVelocity() : new BABYLON.Vector3(0,0,0);
                try { monster.physicsAgg.body.setLinearVelocity(new BABYLON.Vector3(dir.x * 5.5, mVel.y, dir.z * 5.5)); } catch(e) {}
                try { monster.position.copyFrom(monster.physicsProxy.position); } catch(e) {}
            } else {
                const dirVec = stickman.position.subtract(monster.position);
                dirVec.y = 0;
                    if (dirVec.length() > 0.1) {
                    dirVec.normalize();
                    const spd = monster.ai && monster.ai.speed ? monster.ai.speed : 3.0;
                    monster.position.addInPlace(dirVec.scale(spd * dt));
                    try { monster.position.y = getHeight(monster.position.x, monster.position.z) + 0.5; } catch(e) {}
                }
            }

            try {
                if (monster._type === 'ranged' || monster._type === 'flying') {
                    const preferred = monster._preferredRange || (monster._type === 'flying' ? 12 : 10);
                    const gap = 2.0;

                    if (monster._type === 'flying') {
                        const flightH = monster._flightHeight || 5;
                        if (monster.physicsAgg && monster.physicsAgg.body) {
                            const pv = monster.physicsProxy.position;
                            const targetPos = stickman.position.clone();
                            try { targetPos.y = getHeight(pv.x, pv.z) + flightH; } catch(e) { targetPos.y = pv.y; }
                            const toT = targetPos.subtract(pv);
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
                            try { monster.position.y += (targetPos.y - monster.position.y) * 0.06; } catch(e) {}
                        }
                    } else {
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

                    const nowShot = Date.now();
                    if (!monster._lastShotTime) monster._lastShotTime = 0;
                    if (nowShot - monster._lastShotTime > (monster._shotCooldown || (monster._type === 'flying' ? 900 : 1200))) {
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

            if (distToPlayer < 2.2) {
                if (!monster.lastHitTime || nowMs - monster.lastHitTime > 1000) {
                    monster.lastHitTime = nowMs;
                    try {
                        if (gameData && typeof gameData.health === 'number') {
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
                                const baseDamage = 1;
                                const reduction = 0.75 * (1 - Math.exp(-0.2 * (bonusState.armorLevel || 0)));
                                const damageFloat = baseDamage * (1 - reduction);
                                const damage = Math.max(0.25, damageFloat);
                                gameData.health = Math.max(0, gameData.health - damage);
                                if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;

                                if (bonusState.armorReflectLevel > 0) {
                                    const chance = 0.12 * bonusState.armorReflectLevel;
                                    if (Math.random() < chance) {
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
                            }
                        }
                    } catch(e) {}
                }
            }
        });

        try {
            if (scene.shadowGenerator && scene._registeredMonsters && scene._registeredMonsters.length > 0) {
                const shadowRadius = 60;
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
        
        if (now - lastFireTime > fireCooldown) { 
            lastFireTime = now;

            let nearestMonster = null;
            let minDistance = 30;

            monsters.forEach(m => {
                const dist = BABYLON.Vector3.Distance(stickman.position, m.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestMonster = m;
                }
            });

            let targetDir;
            if (nearestMonster) {
                const targetPos = nearestMonster.position.clone();
                targetPos.y += 1.2;
                
                const startPos = stickman.position.clone();
                startPos.y += 1.2;
                
                const dir = targetPos.subtract(startPos);
                if (dir.length() < 0.1) {
                    targetDir = camera.getForwardRay().direction;
                } else {
                    targetDir = dir.normalize();
                }
            } else {
                targetDir = camera.getForwardRay().direction;
            }

            let numProjectiles = 1 + (bonusState.extraProjectilesLevel || 0);
            let speedMult = 1 + (bonusState.extraProjectilesLevel || 0) * 0.2;

            for (let i = 0; i < numProjectiles; i++) {
                let currentDir = targetDir;
                if (numProjectiles > 1) {
                    let angleOffset = (i - (numProjectiles - 1) / 2) * 0.2;
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
                        trail.emitRate = gameSettings.particles ? 80 : 0;
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

        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            p.life--;

            let speed = 20 * (p.speedMult || 1) * dt;
            p.mesh.position.addInPlace(p.direction.scale(speed));

            if (p._trail && !p._trail.isStopped) {
                p._trail.emitter = p.mesh;
            }

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

                        try {
                            let dmg = p.damage || 1;
                            if (monsters[j]._type === 'boss' && monsters[j]._isAttracting) dmg = 0;
                            monsters[j]._hp = (monsters[j]._hp || 1) - dmg;
                            try { if (gameData && gameData.showHitMarker && dmg > 0) gameData.showHitMarker(); } catch(e) {}
                        } catch (e) {}

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
                try {
                    if (BABYLON.Vector3.Distance(p.mesh.position, stickman.position) < 1.6) {
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
                                    const reduction = 0.75 * (1 - Math.exp(-0.2 * (bonusState.armorLevel || 0)));
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
                    p.mesh.dispose();
                }
                projectiles.splice(i, 1);
                i--;
            }
        }

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
                            try {
                                const heal = 10;
                                gameData.health = Math.min(gameData.maxHealth, gameData.health + heal);
                                if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;

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

    engine.runRenderLoop(() => { try { renderLoop && renderLoop(); } catch(e) {} });

    window.addEventListener("resize", function () {
        engine.resize();
    });

    document.addEventListener("fullscreenchange", () => {
        const isFullscreen = !!document.fullscreenElement;
        if (gameSettings && gameSettings.display) {
            gameSettings.display.fullscreen = isFullscreen;
            if (window.fullUpdateLanguage) {
                window.fullUpdateLanguage();
            }
        }
        setTimeout(() => engine.resize(), 100);
    });
});