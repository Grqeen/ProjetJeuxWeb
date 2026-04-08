export const bonusState = {
    auraLevel: 0, auraMesh: null,
    sawsLevel: 0, sawsMeshes: [], sawsAngle: 0,
    fireRateLevel: 0,
    missileLevel: 0, lastMissileTime: 0, missiles: [], explosions: [],
    zoneLevel: 0, lastZoneTime: 0, activeZones: [],
    lightningLevel: 0, lastLightningTime: 0,
    extraProjectilesLevel: 0
};

const availableUpgrades = [
    { id: "aura", name: "Aura de Feu" },
    { id: "saws", name: "Scies Orbitantes" },
    { id: "fireRate", name: "Vitesse Tir Principal" },
    { id: "missile", name: "Missiles Explosifs (AoE)" },
    { id: "zone", name: "Zone de Frappe Aléatoire" },
    { id: "lightning", name: "Foudre Aléatoire" },
    { id: "extraProjectiles", name: "Projectiles Supplémentaires" }
];

// Réinitialise les bonus en cas de redémarrage de partie
export function resetBonuses() {
    if (bonusState.auraMesh) {
        bonusState.auraMesh.dispose();
        bonusState.auraMesh = null;
    }
    bonusState.sawsMeshes.forEach(saw => saw.dispose());
    bonusState.missiles.forEach(m => m.mesh.dispose());
    bonusState.explosions.forEach(e => e.mesh.dispose());
    bonusState.activeZones.forEach(z => z.mesh.dispose());
    
    bonusState.auraLevel = 0;
    bonusState.sawsLevel = 0;
    bonusState.sawsMeshes = [];
    bonusState.sawsAngle = 0;
    bonusState.fireRateLevel = 0;
    bonusState.missileLevel = 0;
    bonusState.lastMissileTime = 0;
    bonusState.missiles = [];
    bonusState.explosions = [];
    bonusState.zoneLevel = 0;
    bonusState.lastZoneTime = 0;
    bonusState.activeZones = [];
    bonusState.lightningLevel = 0;
    bonusState.lastLightningTime = 0;
    bonusState.extraProjectilesLevel = 0;
}

// Affiche le menu avec 3 cartes aléatoires
export function showUpgradeMenu(gameData) {
    gameData.pauseGame();
    gameData.upgradePanel.isVisible = true;

    let shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 3);

    const cards = [gameData.card1, gameData.card2, gameData.card3];

    cards.forEach((card, index) => {
        let upg = selected[index];
        let currentLevel = bonusState[upg.id + "Level"];
        card.textBlock.text = `${upg.name}\nNiveau ${currentLevel + 1}`;
        
        card.onPointerUpObservable.clear();
        card.onPointerUpObservable.add(() => {
            applyUpgrade(upg.id, gameData);
            gameData.selectUpgrade(); // Relance le jeu et gère l'UI d'XP
        });
    });
}

// Applique visuellement et fonctionnellement le bonus choisi
function applyUpgrade(id, gameData) {
    bonusState[id + "Level"]++;
    const level = bonusState[id + "Level"];

    if (id === "aura") {
        if (!bonusState.auraMesh) {
            const aura = BABYLON.MeshBuilder.CreateTorus("aura", { diameter: 8, thickness: 0.3, tessellation: 40 }, gameData.scene);
            const mat = new BABYLON.StandardMaterial("auraMat", gameData.scene);
            mat.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
            mat.alpha = 0.6;
            aura.material = mat;
            aura.parent = gameData.stickman; 
            aura.position.y = -0.5;
            aura.checkCollisions = false;
            bonusState.auraMesh = aura;
        }
        const newScale = 1 + (level - 1) * 0.3;
        bonusState.auraMesh.scaling = new BABYLON.Vector3(newScale, 1, newScale);
    }
    else if (id === "saws") {
        const saw = BABYLON.MeshBuilder.CreateCylinder("saw" + level, { diameter: 2, height: 0.1, tessellation: 24 }, gameData.scene);
        const mat = new BABYLON.StandardMaterial("sawMat", gameData.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        saw.material = mat;
        saw.checkCollisions = false;
        bonusState.sawsMeshes.push(saw);
    }
}

// Met à jour le comportement physique des bonus en temps réel
export function updateBonuses(gameData, dt, handleMonsterKill) {
    const now = Date.now();

    if (bonusState.auraLevel > 0 && bonusState.auraMesh) {
        bonusState.auraMesh.rotation.y += 2 * dt; 
        const radius = (8 * bonusState.auraMesh.scaling.x) / 2;
        
        for (let j = 0; j < gameData.monsters.length; j++) {
            if (BABYLON.Vector3.Distance(gameData.stickman.position, gameData.monsters[j].position) < radius + 0.5) {
                handleMonsterKill(j);
                j--; // Rétablit l'index de la boucle car le tableau a rétréci
            }
        }
    }

    if (bonusState.sawsLevel > 0) {
        bonusState.sawsAngle += 3 * dt;
        
        bonusState.sawsMeshes.forEach((saw, index) => {
            const angleOffset = (Math.PI * 2 / bonusState.sawsMeshes.length) * index;
            const currentAngle = bonusState.sawsAngle + angleOffset;
            
            saw.position.x = gameData.stickman.position.x + Math.cos(currentAngle) * 5.0;
            saw.position.z = gameData.stickman.position.z + Math.sin(currentAngle) * 5.0;
            saw.position.y = gameData.stickman.position.y + 0.2; 
            
            saw.rotation.y += 15 * dt;

            for (let j = 0; j < gameData.monsters.length; j++) {
                if (BABYLON.Vector3.Distance(saw.position, gameData.monsters[j].position) < 1.5) {
                    handleMonsterKill(j);
                    j--;
                }
            }
        });
    }

    // --- 4) MISSILES EXPLOSIFS (AoE) ---
    if (bonusState.missileLevel > 0) {
        const missileCooldown = Math.max(500, 3000 - (bonusState.missileLevel * 400));
        if (now - bonusState.lastMissileTime > missileCooldown && gameData.monsters.length > 0) {
            bonusState.lastMissileTime = now;
            
            let numMissiles = 1 + (bonusState.extraProjectilesLevel || 0);
            let speedMult = 1 + (bonusState.extraProjectilesLevel || 0) * 0.2;

            for (let mIdx = 0; mIdx < numMissiles; mIdx++) {
                let target = gameData.monsters[Math.floor(Math.random() * gameData.monsters.length)];
                
                const missile = BABYLON.MeshBuilder.CreateCylinder("missile" + mIdx, { diameter: 0.4, height: 1.2 }, gameData.scene);
                missile.rotation.x = Math.PI / 2;
                missile.checkCollisions = false;
                
                const mat = new BABYLON.StandardMaterial("missileMat", gameData.scene);
                mat.emissiveColor = new BABYLON.Color3(1, 0.8, 0); // Jaune/Orange
                missile.material = mat;
                
                missile.position = gameData.stickman.position.clone();
                missile.position.y += 1.5;
                if (numMissiles > 1) {
                    missile.position.x += (Math.random() - 0.5) * 2;
                    missile.position.z += (Math.random() - 0.5) * 2;
                }
                
                bonusState.missiles.push({ mesh: missile, target: target, life: 5.0, speedMult: speedMult });
            }
        }
        
        for (let i = 0; i < bonusState.missiles.length; i++) {
            let m = bonusState.missiles[i];
            m.life -= dt;
            
            let speed = 15 * (m.speedMult || 1) * dt;
            if (m.target && !m.target.isDisposed()) {
                let dir = m.target.position.subtract(m.mesh.position).normalize();
                m.mesh.position.addInPlace(dir.scale(speed));
                m.mesh.lookAt(m.target.position);
            } else {
                m.mesh.position.addInPlace(m.mesh.forward.scale(speed));
            }
            
            let hit = false;
            for (let j = 0; j < gameData.monsters.length; j++) {
                if (BABYLON.Vector3.Distance(m.mesh.position, gameData.monsters[j].position) < 2.0) {
                    hit = true;
                    break;
                }
            }
            
            if (hit || m.life <= 0) {
                let radius = 3 + bonusState.missileLevel * 1; // Le rayon augmente avec le niveau
                
                // Visuel de l'explosion
                const exp = BABYLON.MeshBuilder.CreateSphere("exp", { diameter: radius * 2 }, gameData.scene);
                exp.position = m.mesh.position.clone();
                exp.checkCollisions = false;
                const expMat = new BABYLON.StandardMaterial("expMat", gameData.scene);
                expMat.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
                expMat.alpha = 0.8;
                exp.material = expMat;
                bonusState.explosions.push({ mesh: exp, life: 0.2 });
                
                // Dégâts de zone (AoE)
                for (let j = 0; j < gameData.monsters.length; j++) {
                    if (BABYLON.Vector3.Distance(m.mesh.position, gameData.monsters[j].position) <= radius) {
                        handleMonsterKill(j);
                        j--;
                    }
                }
                
                m.mesh.dispose();
                bonusState.missiles.splice(i, 1);
                i--;
            }
        }
    }
    
    for (let i = 0; i < bonusState.explosions.length; i++) {
        let e = bonusState.explosions[i];
        e.life -= dt;
        e.mesh.scaling.addInPlace(new BABYLON.Vector3(dt * 8, dt * 8, dt * 8));
        e.mesh.material.alpha -= dt * 4;
        if (e.life <= 0) {
            e.mesh.dispose();
            bonusState.explosions.splice(i, 1);
            i--;
        }
    }

    // --- 5) ZONE DE FRAPPE ALÉATOIRE ---
    if (bonusState.zoneLevel > 0) {
        const zoneCooldown = 10000; // 10 secondes fixes
        if (now - bonusState.lastZoneTime > zoneCooldown) {
            bonusState.lastZoneTime = now;
            
            let radius = 4 + bonusState.zoneLevel * 1.5; // Le rayon augmente avec le niveau
            let spawnPos = gameData.stickman.position.clone();
            
            // On essaie de la faire spawn directement sur un monstre aléatoire pour être utile
            if (gameData.monsters.length > 0) {
                let randMob = gameData.monsters[Math.floor(Math.random() * gameData.monsters.length)];
                spawnPos = randMob.position.clone();
                spawnPos.y -= 0.4;
            } else {
                spawnPos.y -= 1.0;
            }

            const zone = BABYLON.MeshBuilder.CreateCylinder("zone", { diameter: radius * 2, height: 0.2 }, gameData.scene);
            zone.position = spawnPos;
            zone.checkCollisions = false;
            
            const mat = new BABYLON.StandardMaterial("zoneMat", gameData.scene);
            mat.emissiveColor = new BABYLON.Color3(0.6, 0, 0.8); // Violet
            mat.alpha = 0.5;
            zone.material = mat;
            
            bonusState.activeZones.push({ mesh: zone, radius: radius, life: 3.0 }); // Dure 3 secondes
        }
        
        for (let i = 0; i < bonusState.activeZones.length; i++) {
            let z = bonusState.activeZones[i];
            z.life -= dt;
            
            // Effet visuel : la zone clignote légèrement
            z.mesh.material.alpha = 0.3 + Math.sin(now * 0.01) * 0.2;
            
            // Tente de tuer les monstres à l'intérieur de la zone à chaque frame
            for (let j = 0; j < gameData.monsters.length; j++) {
                if (BABYLON.Vector3.Distance(z.mesh.position, gameData.monsters[j].position) <= z.radius) {
                    handleMonsterKill(j);
                    j--;
                }
            }
            
            if (z.life <= 0) {
                z.mesh.dispose();
                bonusState.activeZones.splice(i, 1);
                i--;
            }
        }
    }

    // --- 6) FOUDRE ALÉATOIRE ---
    if (bonusState.lightningLevel > 0) {
        const lightningCooldown = Math.max(1000, 4000 - bonusState.lightningLevel * 500);
        if (now - bonusState.lastLightningTime > lightningCooldown && gameData.monsters.length > 0) {
            bonusState.lastLightningTime = now;

            let numStrikes = 1 + Math.floor((bonusState.lightningLevel - 1) / 2); // lvl 1,2: 1 éclair, lvl 3,4: 2 éclairs, etc.
            let stunDuration = bonusState.lightningLevel > 1 ? 2.0 : 0; // 2 secondes d'étourdissement au niveau 2+ (AoE)

            // On trie les monstres par distance par rapport au joueur
            let sortedMonsters = [...gameData.monsters].sort((a, b) => {
                return BABYLON.Vector3.DistanceSquared(gameData.stickman.position, a.position) - 
                       BABYLON.Vector3.DistanceSquared(gameData.stickman.position, b.position);
            });

            for (let i = 0; i < Math.min(numStrikes, sortedMonsters.length); i++) {
                let target = sortedMonsters[i];
                let targetIndex = gameData.monsters.indexOf(target);

                if (targetIndex !== -1) {
                    let targetPos = target.position.clone();
                    
                    // Création de l'éclair visuel
                    const lightning = BABYLON.MeshBuilder.CreateCylinder("lightning", { diameterTop: 0.5, diameterBottom: 0.1, height: 40 }, gameData.scene);
                    lightning.position = targetPos.clone();
                    lightning.position.y += 20; // Vient du ciel
                    const mat = new BABYLON.StandardMaterial("lightningMat", gameData.scene);
                    mat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
                    mat.alpha = 0.8;
                    lightning.material = mat;

                    setTimeout(() => {
                        lightning.dispose();
                    }, 200);

                    // Effet de zone (Stun des ennemis autour de la cible)
                    if (stunDuration > 0) {
                        if (!gameData.scene.stunMat) {
                            gameData.scene.stunMat = new BABYLON.StandardMaterial("stunMat", gameData.scene);
                            gameData.scene.stunMat.diffuseColor = new BABYLON.Color3(0, 0.8, 1);
                        }
                        for (let j = 0; j < gameData.monsters.length; j++) {
                            let m = gameData.monsters[j];
                            // On cherche ceux proches de la foudre, et on modifie temporairement le matériel
                            if (m !== target && BABYLON.Vector3.DistanceSquared(new BABYLON.Vector3(targetPos.x, m.position.y, targetPos.z), m.position) < 36) {
                                m.stunTime = Date.now() + stunDuration * 1000;
                                if (!m.originalMaterial) {
                                    m.originalMaterial = m.material;
                                    m.material = gameData.scene.stunMat;
                                }
                            }
                        }
                    }

                    // Tue la cible principale
                    handleMonsterKill(targetIndex);
                }
            }
        }
    }
}