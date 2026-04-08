export const bonusState = {
    auraLevel: 0, auraMesh: null,
    sawsLevel: 0, sawsMeshes: [], sawsAngle: 0,
    fireRateLevel: 0,
    missileLevel: 0, lastMissileTime: 0, missiles: [], explosions: [],
    zoneLevel: 0, lastZoneTime: 0, activeZones: [],
    lightningLevel: 0, lastLightningTime: 0,
    extraProjectilesLevel: 0
};

// Defensive and utility bonuses
bonusState.armorLevel = 0; // Plate armor: reduces fixed damage per hit (2 per level)
bonusState.armorReflectLevel = 0; // chance to reflect some damage
bonusState.regenLevel = 0; bonusState._lastRegenTime = 0; // regen every 5s base
bonusState.shieldLevel = 0; bonusState._shieldActive = false; bonusState._shieldHits = 0; bonusState._lastShieldTime = 0; // shield bubble
bonusState.speedBootsLevel = 0; // movement speed percent per level
bonusState.maxHpLevel = 0; // increases max HP
bonusState.reviveLevel = 0; bonusState._reviveUsed = false;

// Utility / economy
bonusState.magnetLevel = 0; // pickup radius
bonusState.xpBoostLevel = 0; // percent XP gain per level (0.15 per level)
bonusState.cooldownReductionLevel = 0; // reduces cooldowns
bonusState.aoeSizeLevel = 0; // increases area sizes

const availableUpgrades = [
    { id: "aura", name: "Aura de Feu" },
    { id: "saws", name: "Scies Orbitantes" },
    { id: "fireRate", name: "Vitesse Tir Principal" },
    { id: "missile", name: "Missiles Explosifs (AoE)" },
    { id: "zone", name: "Zone de Frappe Aléatoire" },
    { id: "lightning", name: "Foudre Aléatoire" },
    { id: "extraProjectiles", name: "Projectiles Supplémentaires" }
];

// Add defensive / utility upgrades
availableUpgrades.push({ id: "armor", name: "Armure de Plates" });
availableUpgrades.push({ id: "armorReflect", name: "Reflet de Dégâts" });
availableUpgrades.push({ id: "regen", name: "Régénération de Vie" });
availableUpgrades.push({ id: "shield", name: "Bouclier de Force" });
availableUpgrades.push({ id: "boots", name: "Bottes de Vitesse" });
availableUpgrades.push({ id: "maxHp", name: "Augmentation des PV Max" });
availableUpgrades.push({ id: "magnet", name: "Aimant" });
availableUpgrades.push({ id: "xpBoost", name: "Apprentissage Rapide (XP Boost)" });
availableUpgrades.push({ id: "cooldown", name: "Réduction de Cooldown" });
availableUpgrades.push({ id: "aoeSize", name: "Taille des Effets" });
availableUpgrades.push({ id: "revive", name: "Seconde Chance (Revive)" });

// --- Styles & color themes for upgrades and effects ---
const upgradeStyles = {
    aura: { bg: "#4e1f0f", text: "#fff", accent: "#ff8a50", color: "#ff6b00" },
    saws: { bg: "#2c3e50", text: "#fff", accent: "#bdc3c7", color: "#c7c7c7" },
    fireRate: { bg: "#3e1f00", text: "#fff", accent: "#ffb74d", color: "#ff8a00" },
    missile: { bg: "#442200", text: "#fff", accent: "#ffd166", color: "#ff8a00" },
    zone: { bg: "#2b0b3a", text: "#fff", accent: "#c77cff", color: "#b34bff" },
    lightning: { bg: "#081a2c", text: "#e8f7ff", accent: "#49f0ff", color: "#00e5ff" },
    extraProjectiles: { bg: "#3b0f12", text: "#fff", accent: "#ff6b81", color: "#ff3b5c" },
    armor: { bg: "#1f2629", text: "#e6eef2", accent: "#9aa6ac", color: "#9aa6ac" },
    armorReflect: { bg: "#0f1720", text: "#eaf6ff", accent: "#7fd2ff", color: "#7fd2ff" },
    regen: { bg: "#08260f", text: "#eaffef", accent: "#61ff8a", color: "#2ee06a" },
    shield: { bg: "#071a22", text: "#e8fbff", accent: "#6fe6ff", color: "#3fd1ff" },
    boots: { bg: "#2f1f00", text: "#fff7e6", accent: "#ffd36b", color: "#ffd36b" },
    maxHp: { bg: "#3a0910", text: "#ffeef0", accent: "#ff7b8a", color: "#ff596d" },
    magnet: { bg: "#1a0930", text: "#f2eaff", accent: "#b98bff", color: "#b06bff" },
    xpBoost: { bg: "#072026", text: "#e8fbf8", accent: "#39ffdb", color: "#2fe0c9" },
    cooldown: { bg: "#09132a", text: "#eaf0ff", accent: "#9fb8ff", color: "#6fa8ff" },
    aoeSize: { bg: "#2a0a1f", text: "#fff0f7", accent: "#ff8adf", color: "#ff5fbf" },
    revive: { bg: "#17221f", text: "#f7fff6", accent: "#9effb6", color: "#6ff08a" }
};

function hexToColor3(hex) {
    if (!hex) return new BABYLON.Color3(1, 1, 1);
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2),16)/255;
    const g = parseInt(h.substring(2,4),16)/255;
    const b = parseInt(h.substring(4,6),16)/255;
    return new BABYLON.Color3(r,g,b);
}

function hexToColor4(hex, a=1) {
    const c = hexToColor3(hex);
    return new BABYLON.Color4(c.r, c.g, c.b, a);
}

function lightenHex(hex, amount) {
    try {
        const h = hex.replace('#','');
        const r = parseInt(h.substring(0,2),16);
        const g = parseInt(h.substring(2,4),16);
        const b = parseInt(h.substring(4,6),16);
        const mix = (v) => Math.min(255, Math.round(v + (255 - v) * amount));
        const nr = mix(r).toString(16).padStart(2,'0');
        const ng = mix(g).toString(16).padStart(2,'0');
        const nb = mix(b).toString(16).padStart(2,'0');
        return `#${nr}${ng}${nb}`;
    } catch(e) { return hex; }
}

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

    // Stop player movement immediately to avoid sliding while menu is open
    try {
        if (gameData && gameData.stickman) {
            const body = gameData.stickman.physicsBody || gameData.stickman.physicsAgg && gameData.stickman.physicsAgg.body;
            if (body && body.setLinearVelocity) {
                try { body.setLinearVelocity(new BABYLON.Vector3(0, 0, 0)); } catch(e) {}
            }
            // As extra precaution, zero position velocity on the mesh as well
            try { if (gameData.stickman.physicsProxy) gameData.stickman.physicsProxy.setLinearVelocity && gameData.stickman.physicsProxy.setLinearVelocity(new BABYLON.Vector3(0,0,0)); } catch(e) {}
        }
    } catch(e) {}
    // mark player frozen so main loop skips applying physics/controls
    try { gameData._playerFrozen = true; } catch(e) {}

    let shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 3);

    const cards = [gameData.card1, gameData.card2, gameData.card3];

    cards.forEach((card, index) => {
        let upg = selected[index];
        let currentLevel = bonusState[upg.id + "Level"];
        const style = upgradeStyles[upg.id] || { bg: '#2c3e50', text: '#fff', accent: '#fff' };
        card.textBlock.text = `${upg.name}\nNiveau ${currentLevel + 1}`;
            card.background = style.bg;
            card.color = style.text;
            // store base/hover so createUpgradeCard's hover doesn't override chosen color
            try { card._baseBackground = style.bg; card._hoverBackground = lightenHex(style.bg, 0.12); } catch(e) {}
        card.thickness = 4;
        // highlight cards for higher levels
            if (currentLevel + 1 >= 2) {
                card.shadowBlur = 20;
                card.shadowColor = style.accent || '#ffffff';
            } else {
                card.shadowBlur = 0;
                card.shadowColor = '#000000';
            }
        
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
        // color
        try { bonusState.auraMesh.material.emissiveColor = hexToColor3(upgradeStyles.aura.color); } catch(e) {}
    }
    else if (id === "saws") {
        const saw = BABYLON.MeshBuilder.CreateCylinder("saw" + level, { diameter: 2, height: 0.1, tessellation: 24 }, gameData.scene);
        const mat = new BABYLON.StandardMaterial("sawMat", gameData.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        saw.material = mat;
        try { mat.diffuseColor = hexToColor3(upgradeStyles.saws.color); mat.emissiveColor = hexToColor3(upgradeStyles.saws.accent || upgradeStyles.saws.color); } catch(e) {}
        saw.checkCollisions = false;
        bonusState.sawsMeshes.push(saw);
    }

    else if (id === "armor") {
        // Plate armor: reduces fixed damage per hit (2 per level)
        // No immediate visual, handled during damage application in main.js
    }
    else if (id === "armorReflect") {
        // Chance to reflect some damage back (handled in main.js on hit)
    }
    else if (id === "regen") {
        // Increase regen frequency / amount
        bonusState._lastRegenTime = Date.now();
    }
    else if (id === "shield") {
        // Create initial shield if none
        bonusState._shieldHits = 1 + (level - 1); // each level adds one hit
        bonusState._shieldActive = true;
        bonusState._lastShieldTime = Date.now();
        // visual
        if (gameData && gameData.stickman) {
            try {
                if (!gameData.scene._shieldMesh) {
                    const sh = BABYLON.MeshBuilder.CreateSphere("playerShield", { diameter: 4 }, gameData.scene);
                    const mat = new BABYLON.StandardMaterial("shieldMat", gameData.scene);
                    mat.emissiveColor = hexToColor3(upgradeStyles.shield.color);
                    mat.alpha = 0.28 + Math.min(0.4, 0.06 * level);
                    sh.material = mat;
                    sh.isPickable = false;
                    sh.parent = gameData.stickman;
                    sh.position.y = 1.0;
                    gameData.scene._shieldMesh = sh;
                }
            } catch (e) {}
        }
    }
    else if (id === "boots") {
        // Increase movement speed multiplicatively in main.js
    }
    else if (id === "maxHp") {
        if (gameData) {
            const add = 20 * level; // each level +20 HP
            gameData.maxHealth += add;
            gameData.health = Math.min(gameData.maxHealth, gameData.health + Math.floor(add * 0.5));
        }
    }
    else if (id === "magnet") {
        // Increase pickup radius: handled elsewhere
    }
    else if (id === "xpBoost") {
        // XP boost applies automatically in main.js kill handler
    }
    else if (id === "cooldown") {
        // Reduces cooldowns globally; used where cooldowns are computed
    }
    else if (id === "aoeSize") {
        // Affects explosion/radius sizes in bonuses
    }
    else if (id === "revive") {
        bonusState._reviveUsed = false; // allow revive when acquired
    }
}

// Met à jour le comportement physique des bonus en temps réel
export function updateBonuses(gameData, dt, handleMonsterKill) {
    const now = Date.now();

    // --- Passive-kill throttle: avoid too many automatic kills from passives
    if (!bonusState._passiveKillWindowStart) bonusState._passiveKillWindowStart = now;
    if (!bonusState._passiveKillsInWindow) bonusState._passiveKillsInWindow = 0;
    const passiveWindowMs = 1000; // 1 second window
    const passiveLimit = 3; // max passive kills per second
    function tryPassiveKill(idx) {
        const tnow = Date.now();
        if (tnow - bonusState._passiveKillWindowStart > passiveWindowMs) {
            bonusState._passiveKillWindowStart = tnow;
            bonusState._passiveKillsInWindow = 0;
        }
        if (bonusState._passiveKillsInWindow < passiveLimit) {
            bonusState._passiveKillsInWindow++;
            handleMonsterKill(idx);
            return true;
        }
        return false;
    }

    // --- Regeneration passive ---
    if (bonusState.regenLevel > 0 && gameData && typeof gameData.health === 'number') {
        const baseInterval = 5000; // 5s
        const interval = Math.max(1000, baseInterval - (bonusState.regenLevel - 1) * 500); // faster with levels
        if (!bonusState._lastRegenTime) bonusState._lastRegenTime = now;
        if (now - bonusState._lastRegenTime >= interval) {
            bonusState._lastRegenTime = now;
            const healAmount = 3 + bonusState.regenLevel * 2; // heal amount per tick
            gameData.health = Math.min(gameData.maxHealth, gameData.health + healAmount);
            if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
            if (gameData.hpText) gameData.hpText.text = `HP: ${gameData.health}/${gameData.maxHealth}`;
        }
    }

    if (bonusState.auraLevel > 0 && bonusState.auraMesh) {
        bonusState.auraMesh.rotation.y += 2 * dt; 
        const radius = (8 * bonusState.auraMesh.scaling.x) / 2;
        
        for (let j = 0; j < gameData.monsters.length; j++) {
            if (BABYLON.Vector3.Distance(gameData.stickman.position, gameData.monsters[j].position) < radius + 0.5) {
                if (tryPassiveKill(j)) { j--; }
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
                    if (tryPassiveKill(j)) { j--; }
                }
            }
        });
    }

    // --- 4) MISSILES EXPLOSIFS (AoE) ---
    if (bonusState.missileLevel > 0) {
        const baseMissileCooldown = Math.max(500, 3000 - (bonusState.missileLevel * 400));
        const cooldownMultiplier = Math.max(0.25, 1 - 0.08 * (bonusState.cooldownReductionLevel || 0));
        const missileCooldown = Math.floor(baseMissileCooldown * cooldownMultiplier);
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
            
            // Ralenti des missiles téléguidés pour être moins rapides
            let speed = 6 * (m.speedMult || 1) * dt;
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
                let radius = (3 + bonusState.missileLevel * 1) * (1 + (bonusState.aoeSizeLevel || 0) * 0.2); // scale with aoeSize
                
                // Visuel de l'explosion via ParticleSystem, colorisé selon le style missile
                try {
                    const style = upgradeStyles.missile || { color: '#ff8a00' };
                    const ps = new BABYLON.ParticleSystem("missileExp", 500, gameData.scene);
                    ps.particleTexture = new BABYLON.Texture("assets/particles/fire.png", gameData.scene);
                    ps.emitter = m.mesh.position.clone();
                    ps.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
                    ps.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
                    ps.color1 = hexToColor4(style.color || '#ff8a00', 1.0);
                    ps.color2 = hexToColor4(style.accent || style.color || '#ff8a00', 0.9);
                    ps.minSize = 0.2; ps.maxSize = 1.0;
                    ps.minLifeTime = 0.3; ps.maxLifeTime = 1.0;
                    ps.emitRate = 800;
                    ps.direction1 = new BABYLON.Vector3(-1, -1, -1);
                    ps.direction2 = new BABYLON.Vector3(1, 1, 1);
                    ps.gravity = new BABYLON.Vector3(0, -6, 0);
                    ps.disposeOnStop = true;
                    ps.start();
                    setTimeout(() => ps.stop(), 150);
                } catch (e) {}

                // small camera shake on explosion if available
                try { if (gameData && gameData.shakeCamera) gameData.shakeCamera(0.35, 400); } catch(e) {}
                try { if (gameData && gameData.explosionSound) gameData.explosionSound.play(); } catch(e) {}
                
                // Dégâts de zone (AoE)
                for (let j = 0; j < gameData.monsters.length; j++) {
                    if (BABYLON.Vector3.Distance(m.mesh.position, gameData.monsters[j].position) <= radius) {
                        if (tryPassiveKill(j)) { j--; }
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
                            // On cherche ceux proches de la foudre, et on marque comme étourdi
                            if (m !== target && BABYLON.Vector3.DistanceSquared(new BABYLON.Vector3(targetPos.x, m.position.y, targetPos.z), m.position) < 36) {
                                m.stunTime = Date.now() + stunDuration * 1000;
                                // Create a small glow mesh to indicate stun (avoids changing instance.material)
                                if (!m._stunGlow) {
                                    try {
                                        const glow = BABYLON.MeshBuilder.CreateSphere("stunGlow_" + j, { diameter: 1.2 }, gameData.scene);
                                        glow.isPickable = false;
                                        glow.position = m.position.clone();
                                        glow.scaling.y = 0.3;
                                        glow.material = gameData.scene.stunMat;
                                        glow.renderingGroupId = 1;
                                        m._stunGlow = glow;
                                    } catch (e) {}
                                }
                            }
                        }
                    }

                    // Tue la cible principale (sous la contrainte du throttle de passives)
                    try {
                        if (typeof tryPassiveKill === 'function') {
                            tryPassiveKill(targetIndex);
                        } else {
                            handleMonsterKill(targetIndex);
                        }
                    } catch(e) {
                        try { handleMonsterKill(targetIndex); } catch(e) {}
                    }
                }
            }
        }
    }
}