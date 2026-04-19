import { createAmalgame } from "./monsters.js";

// Gère le comportement de combat et l'intelligence artificielle spécifique à chaque boss.
export function updateBossAI(monster, stickman, scene, gameData, dt, nowMs, distToPlayer, engine, waterLevel, bonusState, projectiles, getHeight, monsters) {
            if (monster._type === 'amalgame') {
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
                if (gameData._amalgameHpBarUI) {
                    let totalHp = 0;
                    let totalMaxHp = 1000;
                    monsters.forEach(m => { if (m._type === 'amalgame') totalHp += m._hp; });
                    gameData._amalgameHpBarUI.bar.width = Math.max(0, (totalHp / totalMaxHp) * 100) + "%";
                    
                    let anyAlive = monsters.some(m => m._type === 'amalgame');
                    if (!anyAlive) {
                        try { gameData._amalgameHpBarUI.root.dispose(); } catch(e){}
                        gameData._amalgameHpBarUI = null;
                    }
                }
                monster._pulsePhase += 3 * dt;
                const scale = 1 + Math.sin(monster._pulsePhase) * 0.1;
                monster.scaling.set(scale, scale, scale);
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("amalgameHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true;
                        hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5;
                        hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(0.6, 0.1, 0.9));
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1;
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                    } catch(e){}
                }

                const dir = stickman.position.subtract(monster.position);
                dir.y = 0;
                if (dir.length() > 0.1) {
                    dir.normalize();
                    monster.position.addInPlace(dir.scale(monster.ai.speed * dt));
                }
                monster.position.y = getHeight(monster.position.x, monster.position.z) + (monster._baseDiameter / 2) * scale;

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
                        setTimeout(() => {
                            try { monster.dispose(); } catch(e){}
                            const idx = monsters.indexOf(monster);
                            if (idx > -1) monsters.splice(idx, 1);
                        }, 0);
                        return true;
                    }
                }

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
                                    return true;
                                }
                            } else {
                                monster._mergeTimer = 0;
                            }
                        }
                    }
                }

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

                return true;
            }

            if (monster._type === 'kraken') {
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

                monster.position.y = getHeight(monster.position.x, monster.position.z) + 1;

                if (monster._tentacles) {
                    monster._tentacles.forEach((t, i) => {
                        t.rotation.y = Math.sin(nowMs * 0.002 + i * 1.5) * 0.3;
                    });
                }

                if (nowMs - monster._lastFloodTime > 15000) {
                    monster._lastFloodTime = nowMs;
                    monster._isFlooding = true;
                    if (!gameData.currentWaterLevel) gameData.currentWaterLevel = waterLevel;
                    const targetWL = waterLevel + 5;
                    const floodInterval = setInterval(() => {
                        if (monster.isDisposed()) { clearInterval(floodInterval); return true; }
                        gameData.currentWaterLevel = Math.min(targetWL, gameData.currentWaterLevel + 0.15);
                        try { if (scene.getMeshByName("water")) scene.getMeshByName("water").position.y = gameData.currentWaterLevel; } catch(e){}
                    }, 100);
                    setTimeout(() => {
                        clearInterval(floodInterval);
                        const drainInterval = setInterval(() => {
                            if (monster.isDisposed()) { clearInterval(drainInterval); gameData.currentWaterLevel = waterLevel; return true; }
                            gameData.currentWaterLevel = Math.max(waterLevel, gameData.currentWaterLevel - 0.1);
                            try { if (scene.getMeshByName("water")) scene.getMeshByName("water").position.y = gameData.currentWaterLevel; } catch(e){}
                            if (gameData.currentWaterLevel <= waterLevel) clearInterval(drainInterval);
                        }, 100);
                        monster._isFlooding = false;
                    }, 8000);
                }

                if (nowMs - monster._lastTentacleSwipe > 6000) {
                    monster._lastTentacleSwipe = nowMs;
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
                        try {
                            const kb = stickman.position.subtract(monster.position).normalize().scale(15);
                            kb.y = 5;
                            stickman.physicsBody.setLinearVelocity(kb);
                        } catch(e){}
                    }
                }

                if (nowMs - monster._lastMudShot > 10000) {
                    monster._lastMudShot = nowMs;
                    monster._isVulnerable = true;
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            if (monster.isDisposed()) return true;
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
                                    if (mud.isDisposed()) { scene.onBeforeRenderObservable.removeCallback(updateMud); return true; }
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

                return true;
            }

            if (monster._type === 'nuee') {
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

                if (monster._vortex) monster._vortex.rotation.y += 4 * dt;

                if (monster._isStunned) {
                    if (nowMs > monster._stunEndTime) {
                        monster._isStunned = false;
                        monster._lastDiveTime = nowMs;
                    }
                    monster.position.y = getHeight(monster.position.x, monster.position.z) + 2;
                } else if (monster._isDiving) {
                    const diveDir = monster._diveTarget.subtract(monster.position).normalize();
                    monster.position.addInPlace(diveDir.scale(35 * dt));
                    monster.position.y -= 20 * dt;
                    
                    if (monster.position.y <= getHeight(monster.position.x, monster.position.z) + 2) {
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 2;
                        monster._isDiving = false;
                        
                        if (distToPlayer < 5) {
                            gameData.health = Math.max(0, gameData.health - 35);
                            if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                            try { if (gameData.shakeCamera) gameData.shakeCamera(0.8, 500); } catch(e){}
                        } else {
                            monster._isStunned = true;
                            monster._stunEndTime = nowMs + 4000;
                        }
                    }
                } else {
                    if (!monster._isPreparingDive) {
                        monster._orbitAngle += 0.8 * dt;
                        const orbitRadius = 25;
                        const targetX = stickman.position.x + Math.cos(monster._orbitAngle) * orbitRadius;
                        const targetZ = stickman.position.z + Math.sin(monster._orbitAngle) * orbitRadius;
                        monster.position.x += (targetX - monster.position.x) * 2 * dt;
                        monster.position.z += (targetZ - monster.position.z) * 2 * dt;
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 15;
                    } else {
                        monster.position.y += (getHeight(monster.position.x, monster.position.z) + 18 - monster.position.y) * 2 * dt;
                    }

                    try {
                        const windDir = stickman.position.subtract(new BABYLON.Vector3(0, stickman.position.y, 0)).normalize();
                        const windForce = 3;
                        const cv = stickman.physicsBody.getLinearVelocity();
                        stickman.physicsBody.setLinearVelocity(new BABYLON.Vector3(
                            cv.x + windDir.x * windForce * dt, cv.y, cv.z + windDir.z * windForce * dt
                        ));
                    } catch(e){}

                    if (nowMs - monster._lastDiveTime > 10000 && !monster._isPreparingDive) {
                        monster._isPreparingDive = true;
                        monster._diveTarget = stickman.position.clone();
                        
                        try {
                            const indicator = BABYLON.MeshBuilder.CreateTorus("diveIndicator", { diameter: 10, thickness: 0.3 }, scene);
                            indicator.position = monster._diveTarget.clone();
                            indicator.position.y = getHeight(indicator.position.x, indicator.position.z) + 0.5;
                            
                            const indMat = new BABYLON.StandardMaterial("indMat", scene);
                            indMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
                            indMat.alpha = 0.8;
                            indicator.material = indMat;

                            setTimeout(() => { try { indicator.dispose(); } catch(e){} }, 1000);
                        } catch(e) {}

                        setTimeout(() => {
                            if (!monster.isDisposed()) {
                                monster._isPreparingDive = false;
                                monster._isDiving = true;
                                monster._lastDiveTime = Date.now();
                            }
                        }, 1000);
                    }

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

                if (distToPlayer < 4 && !monster._isStunned) {
                    if (!monster.lastHitTime || nowMs - monster.lastHitTime > 1000) {
                        monster.lastHitTime = nowMs;
                        gameData.health = Math.max(0, gameData.health - 15);
                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                    }
                }

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

                return true;
            }

            if (monster._type === 'mimic') {
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

                if (monster._isJumping) {
                    monster.position.y -= 30 * dt;
                    if (monster.position.y <= getHeight(monster.position.x, monster.position.z) + 1.5) {
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 1.5;
                        monster._isJumping = false;
                        monster._lastJumpTime = nowMs;
                        try { if (gameData.shakeCamera) gameData.shakeCamera(0.5, 400); } catch(e){}
                        if (distToPlayer < 8) {
                            let playerGroundH = getHeight(stickman.position.x, stickman.position.z);
                            if (stickman.position.y - playerGroundH < 2.5) {
                                gameData.health = Math.max(0, gameData.health - 25);
                                if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                                if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                            }
                        }
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
                    monster._zigzagPhase += 4 * dt;
                    const dir = stickman.position.subtract(monster.position);
                    dir.y = 0;
                    if (dir.length() > 0.1) {
                        dir.normalize();
                        const perp = new BABYLON.Vector3(-dir.z, 0, dir.x);
                        const zigzag = perp.scale(Math.sin(monster._zigzagPhase) * 3);
                        monster.position.addInPlace(dir.scale(monster.ai.speed * dt).add(zigzag.scale(dt)));
                    }
                    monster.position.y = getHeight(monster.position.x, monster.position.z) + 1.5;

                    if (nowMs - monster._lastJumpTime > 6000) {
                        monster._isJumping = true;
                        monster.position.y += 15;
                    }
                }

                if (bonusState.auraLevel > 0) {
                    if (!monster._auraMesh) {
                        monster._auraMesh = BABYLON.MeshBuilder.CreateTorus("mimicAura", { diameter: 8, thickness: 0.3, tessellation: 40 }, scene);
                        const mat = new BABYLON.StandardMaterial("mAuraMat", scene);
                        mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0.5);
                        mat.alpha = 0.6;
                        monster._auraMesh.material = mat;
                        monster._auraMesh.parent = monster;
                        monster._auraMesh.position.y = -0.5;
                        monster._auraMesh.checkCollisions = false;
                    }
                    const newScale = 1 + (bonusState.auraLevel - 1) * 0.3;
                    monster._auraMesh.scaling.set(newScale, 1, newScale);
                    monster._auraMesh.rotation.y -= 2 * dt;
                    
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

                if (bonusState.sawsLevel > 0) {
                    if (!monster._sawsMeshes || monster._sawsMeshes.length !== bonusState.sawsLevel) {
                        if (monster._sawsMeshes) monster._sawsMeshes.forEach(s => s.dispose());
                        monster._sawsMeshes = [];
                        monster._sawsAngle = 0;
                        for (let i = 0; i < bonusState.sawsLevel; i++) {
                            const saw = BABYLON.MeshBuilder.CreateCylinder("msaw" + i, { diameter: 2, height: 0.1, tessellation: 24 }, scene);
                            const mat = new BABYLON.StandardMaterial("msawMat", scene);
                            mat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                            mat.emissiveColor = new BABYLON.Color3(0.8, 0, 0);
                            saw.material = mat;
                            saw.checkCollisions = false;
                            monster._sawsMeshes.push(saw);
                        }
                    }
                    monster._sawsAngle -= 3 * dt;
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

                if (bonusState.lightningLevel > 0) {
                    const lightningCooldown = Math.max(1000, 4000 - bonusState.lightningLevel * 500);
                    if (!monster._lastLightningTime) monster._lastLightningTime = nowMs;
                    if (nowMs - monster._lastLightningTime > lightningCooldown && !monster._isJumping) {
                        monster._lastLightningTime = nowMs;
                        let numStrikes = 1 + Math.floor((bonusState.lightningLevel - 1) / 2);
                        for (let i = 0; i < numStrikes; i++) {
                            setTimeout(() => {
                                if (monster.isDisposed()) return true;
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
                        mat.emissiveColor = new BABYLON.Color3(0.6, 0, 0);
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
                                gameData.health = Math.max(0, gameData.health - 0.5);
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

                if (distToPlayer < 3 && !monster._isJumping) {
                    if (!monster.lastHitTime || nowMs - monster.lastHitTime > 800) {
                        monster.lastHitTime = nowMs;
                        gameData.health = Math.max(0, gameData.health - 12);
                        if (gameData.hpBar) gameData.hpBar.width = (gameData.health / gameData.maxHealth * 100) + "%";
                        if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
                    }
                }

                const mimicScale = 1 + Math.sin(nowMs * 0.003) * 0.15;
                monster.scaling.set(mimicScale, mimicScale, mimicScale);

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

                return true;
            }

            if (monster._type === 'boss') {
                if (!monster._bossHighlight) {
                    try {
                        const hl = new BABYLON.HighlightLayer("goliathHL_" + monster.uniqueId, scene);
                        hl.innerGlow = true;
                        hl.outerGlow = true;
                        hl.blurHorizontalSize = 0.5;
                        hl.blurVerticalSize = 0.5;
                        hl.addMesh(monster, new BABYLON.Color3(1, 0.15, 0.1));
                        monster._bossHighlight = hl;
                        monster.renderingGroupId = 1;
                        monster.onDisposeObservable.add(() => { try { hl.dispose(); } catch(e){} });
                        monster.getChildMeshes().forEach(child => {
                            hl.addMesh(child, new BABYLON.Color3(1, 0.15, 0.1));
                            child.renderingGroupId = 1;
                        });
                    } catch(e){}
                }
                if (monster._isJumping) {
                    monster.position.y -= 25 * dt;
                    const dir = stickman.position.subtract(monster.position);
                    dir.y = 0;
                    if (dir.length() > 0.1) {
                        dir.normalize();
                        monster.position.addInPlace(dir.scale(8 * dt));
                    }
                    if (monster.position.y <= getHeight(monster.position.x, monster.position.z) + 3) {
                        monster.position.y = getHeight(monster.position.x, monster.position.z) + 3;
                        monster._isJumping = false;
                        monster._lastJumpTime = nowMs;
                        
                        monster._stunnedUntil = nowMs + 4000;
                        
                        try { if (gameData.shakeCamera) gameData.shakeCamera(0.6, 600); } catch(e){}
                        try { if (gameData.explosionSound) gameData.explosionSound.play(); } catch(e){}
                        
                        for(let w = 0; w < 3; w++) {
                            setTimeout(() => {
                                if (monster.isDisposed()) return true;
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
                                    sw.scaling.scaleInPlace(1 + 4.5 * sdt);
                                    sw.material.alpha -= 0.5 * sdt;
                                    
                                    if (!sw._hitPlayer && BABYLON.Vector3.Distance(stickman.position, sw.position) < (sw.scaling.x * (3 + w))) {
                                        sw._hitPlayer = true;
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
                            }, w * 650);
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
                    
                    const isRaging = monster._hp < monster.maxHp * 0.3;
                    const jumpCooldown = isRaging ? 4000 : 8000;
                    
                    if (!isRecovering && nowMs - monster._lastJumpTime > jumpCooldown) {
                        monster._isJumping = true;
                        monster.position.y += 20; 
                    }
                    
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
                                    return true;
                                }
                                if (!debris._hasHitPlayer && BABYLON.Vector3.Distance(debris.position, stickman.position) < 2.0) {
                                    debris._hasHitPlayer = true;
                                    gameData.health = Math.max(0, gameData.health - 30);
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
                        setTimeout(() => { monster._isAttracting = false; }, 3000); 
                    }
                    
                    if (monster._isAttracting) {
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
                        hpBar.background = "#c0392b"; 
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
                
                return true;
            }
    return false;
}
