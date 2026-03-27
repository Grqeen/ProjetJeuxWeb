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
    const togglePause = () => { isGamePaused = !isGamePaused; };

    const createGameScene = function () {
        const scene = new BABYLON.Scene(engine);
        
        const hk = new BABYLON.HavokPlugin(true, havokInstance);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);
        
        scene.skipPointerMovePicking = true;

        const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, 1.0, 8, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        
        camera.upperBetaLimit = Math.PI / 2 - 0.05;

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

        createTerrain(scene);

        const stickman = createPlayer(scene);
        
        const playerAgg = new BABYLON.PhysicsAggregate(stickman, BABYLON.PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
        playerAgg.body.setMassProperties({ inertia: new BABYLON.Vector3(0, 0, 0) });
        playerAgg.body.disablePreStep = false;
        playerAgg.body.disable(); // On désactive la physique pendant l'animation d'apparition
        
        stickman.position = new BABYLON.Vector3(0, -5, 0);
        

        const monsters = createMonsters(scene, 15);

        createTrees(scene, 200);

        const { cover } = createSewer(scene);

        createGrass(scene, 1000);

        const birds = createBirds(scene, 50);

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
        fpsCheckbox.onIsCheckedChangedObservable.add(v => gameSettings.showFps = v);
        videoRow.addControl(fpsCheckbox);

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
            });
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
        });
        pausePanel.addControl(resumeBtn);

        return { scene, stickman, monsters, inputMap, camera, cover, birds, fpsText, pausePanel };
    };

    let currentScene = null;
    let gameData = null;
    let projectiles = [];
    let lastFireTime = 0;

    const startGame = () => {
        if (currentScene) currentScene.dispose();
        const data = createGameScene();
        currentScene = data.scene;
        gameData = data;
        isGamePaused = false;
        projectiles = [];
        lastFireTime = 0;
    };

    currentScene = createMenuScene(engine, startGame, gameSettings);

    let spawnState = "waiting"; 
    setTimeout(() => { spawnState = "opening"; }, 1000);

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

        const { stickman, monsters, inputMap, camera, cover, birds, scene } = gameData;

        updateBirds(birds);

        if (spawnState !== "finished") {
            if (spawnState === "opening") {
                cover.position.x += 0.02;
                cover.rotation.y += 0.05;
                if (cover.position.x > 1.2) {
                    spawnState = "climbing";
                }
            } else if (spawnState === "climbing") {
                stickman.position.y += 0.03;
                stickman.rotation.z = Math.sin(stickman.position.y * 5) * 0.1;

                const climbGroup = stickman.animationGroups.find(ag => ag.name === "Ladder_Climb" || ag.name.toLowerCase().includes("climb"));
                if (climbGroup && !climbGroup.isPlaying) {
                    stickman.animationGroups.forEach(ag => ag.stop());
                    climbGroup.start(true);
                }

                if (stickman.position.y >= 3.0) {
                    stickman.position.y = 3.0;
                    stickman.rotation.z = 0;
                    spawnState = "closing";
                }
            } else if (spawnState === "closing") {
                cover.position.x -= 0.04;
                cover.rotation.y -= 0.1;
                
                if (cover.position.x <= 0) {
                    cover.position.x = 0;
                    cover.rotation.y = 0;
                    spawnState = "finished";

                    stickman.physicsBody.enable(); // Activation de la physique une fois apparu
                    camera.lockedTarget = stickman;
                    camera.radius = 15;
                }
            }
            scene.render();
            return;
        }

        let speed = 8.0; // Vitesse réajustée pour les vélocités physiques
        if (stickman.isCrouched) {
            speed = 3.0;
        } else if (inputMap[gameSettings.keys.sprint]) {
            speed = 14.0;
        }

        if (stickman.position.y < waterLevel) {
            speed *= 0.3;
        }

        let moveVector = new BABYLON.Vector3(0, 0, 0);

        const forward = new BABYLON.Vector3(-Math.cos(camera.alpha), 0, -Math.sin(camera.alpha));
        const right = new BABYLON.Vector3(-Math.sin(camera.alpha), 0, Math.cos(camera.alpha));

        stickman.rotationQuaternion = null;
        stickman.rotation.y = Math.atan2(forward.x, forward.z);
        stickman.rotation.x = 0;
        stickman.rotation.z = 0;

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
        const hit = scene.pickWithRay(groundRay, (mesh) => mesh.isPickable && mesh !== stickman);
        const isGrounded = hit.hit;

        const currentVel = stickman.physicsBody.getLinearVelocity();

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
        if (isGrounded && inputMap[" "]) {
            velY = 8;
            inputMap[" "] = false;
        }

        if (stickman.position.y < waterLevel && velY < -2) {
            velY = -2;
        }

        stickman.physicsBody.setLinearVelocity(new BABYLON.Vector3(moveVector.x, velY, moveVector.z));

        const currentRadius = Math.sqrt(stickman.position.x * stickman.position.x + stickman.position.z * stickman.position.z);
        if (currentRadius > limitRadius) {
            const ratio = limitRadius / currentRadius;
            stickman.position.x *= ratio;
            stickman.position.z *= ratio;
        }

        monsters.forEach(monster => {
            if (!monster.physicsBody) return;
            const direction = stickman.position.subtract(monster.position).normalize();
            const mVel = monster.physicsBody.getLinearVelocity();
            monster.physicsBody.setLinearVelocity(new BABYLON.Vector3(direction.x * 2.5, mVel.y, direction.z * 2.5));
        });

        const now = Date.now();
        if (now - lastFireTime > 1000) { 
            lastFireTime = now;

            let nearestMonster = null;
            let minDistance = 40;

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
                targetDir = targetPos.subtract(stickman.position).normalize();
            } else {
                targetDir = stickman.getDirection(BABYLON.Axis.Z).normalize();
            }

            const fireball = BABYLON.MeshBuilder.CreateSphere("fireball", {diameter: 0.6}, scene);
            fireball.position = stickman.position.clone();
            fireball.position.y += 1.2;

            const fireMat = new BABYLON.StandardMaterial("fireMat", scene);
            fireMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0); 
            fireball.material = fireMat;

            const fireballAgg = new BABYLON.PhysicsAggregate(fireball, BABYLON.PhysicsShapeType.SPHERE, { mass: 0.1, restitution: 0 }, scene);
            fireballAgg.body.setLinearVelocity(targetDir.scale(25));
            projectiles.push({ mesh: fireball, life: 60 });
        }

        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            p.life--;

            for (let j = 0; j < monsters.length; j++) {
                if (BABYLON.Vector3.Distance(p.mesh.position, monsters[j].position) < 1.5) {
                    monsters[j].dispose();
                    monsters.splice(j, 1);
                    p.life = 0;
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