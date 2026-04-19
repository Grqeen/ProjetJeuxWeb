export const bonusState = {
    auraLevel: 0, auraMesh: null,
    sawsLevel: 0, sawsMeshes: [], sawsAngle: 0,
    fireRateLevel: 0,
    missileLevel: 0, lastMissileTime: 0, missiles: [], explosions: [],
    zoneLevel: 0, lastZoneTime: 0, activeZones: [],
    lightningLevel: 0, lastLightningTime: 0,
    extraProjectilesLevel: 0
};

import { getHeight } from "./utils.js";

bonusState.armorLevel = 0;
bonusState.armorReflectLevel = 0;
bonusState.regenLevel = 0; bonusState._lastRegenTime = 0;
bonusState.shieldLevel = 0; bonusState._shieldActive = false; bonusState._shieldHits = 0; bonusState._lastShieldTime = 0;
bonusState.speedBootsLevel = 0;
bonusState.maxHpLevel = 0;
bonusState.reviveLevel = 0; bonusState._reviveUsed = false;

bonusState.magnetLevel = 0;
bonusState.xpBoostLevel = 0;
bonusState.cooldownReductionLevel = 0;
bonusState.aoeSizeLevel = 0;

const availableUpgrades = [
    { id: "aura", name: "Aura de Feu" },
    { id: "saws", name: "Scies Orbitantes" },
    { id: "fireRate", name: "Vitesse Tir Principal" },
    { id: "missile", name: "Missiles Explosifs (AoE)" },
    { id: "zone", name: "Météorite Aléatoire" },
    { id: "lightning", name: "Foudre Aléatoire" },
    { id: "extraProjectiles", name: "Projectiles Supplémentaires" }
];

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

// Convertit un code couleur hexadécimal en objet Color3.
function hexToColor3(hex) {
    if (!hex) return new BABYLON.Color3(1, 1, 1);
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2),16)/255;
    const g = parseInt(h.substring(2,4),16)/255;
    const b = parseInt(h.substring(4,6),16)/255;
    return new BABYLON.Color3(r,g,b);
}

// Convertit un code couleur hexadécimal en objet Color4.
function hexToColor4(hex, a=1) {
    const c = hexToColor3(hex);
    return new BABYLON.Color4(c.r, c.g, c.b, a);
}

// Éclaircit une couleur hexadécimale d'un pourcentage donné.
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

// Réinitialise l'état de tous les bonus et objets 3D associés.
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

// Met le jeu en pause et affiche l'interface de choix d'amélioration.
export function showUpgradeMenu(gameData) {
    gameData.pauseGame();
    gameData.upgradePanel.isVisible = true;

    try {
        if (gameData && gameData.stickman) {
            const body = gameData.stickman.physicsBody || gameData.stickman.physicsAgg && gameData.stickman.physicsAgg.body;
            if (body && body.setLinearVelocity) {
                try { body.setLinearVelocity(new BABYLON.Vector3(0, 0, 0)); } catch(e) {}
            }
            try { if (gameData.stickman.physicsProxy) gameData.stickman.physicsProxy.setLinearVelocity && gameData.stickman.physicsProxy.setLinearVelocity(new BABYLON.Vector3(0,0,0)); } catch(e) {}
        }
    } catch(e) {}
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
            try { card._baseBackground = style.bg; card._hoverBackground = lightenHex(style.bg, 0.12); } catch(e) {}
        card.thickness = 4;
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
            gameData.selectUpgrade();
        });
    });
}

// Applique l'amélioration sélectionnée au personnage joueur.
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
        const aoeMultiplier = 1 + (bonusState.aoeSizeLevel || 0) * 0.25;
        const newScale = (1 + (level - 1) * 0.3) * aoeMultiplier;
        bonusState.auraMesh.scaling = new BABYLON.Vector3(newScale, 1, newScale);
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
    }
    else if (id === "armorReflect") {
    }
    else if (id === "regen") {
        bonusState._lastRegenTime = Date.now();
    }
    else if (id === "shield") {
        bonusState._shieldHits = 1 + (level - 1);
        bonusState._shieldActive = true;
        bonusState._lastShieldTime = Date.now();
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
    }
    else if (id === "maxHp") {
        if (gameData) {
            const add = 20 * level;
            gameData.maxHealth += add;
            gameData.health = Math.min(gameData.maxHealth, gameData.health + add);
            if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
        }
    }
    else if (id === "magnet") {
    }
    else if (id === "xpBoost") {
    }
    else if (id === "cooldown") {
    }
    else if (id === "aoeSize") {
        if (bonusState.auraMesh) {
            const baseScale = 1 + (bonusState.auraLevel - 1) * 0.3;
            const aoeMultiplier = 1 + (level * 0.25);
            const finalScale = baseScale * aoeMultiplier;
            bonusState.auraMesh.scaling.set(finalScale, 1, finalScale);
        }
    }
    else if (id === "revive") {
        bonusState._reviveUsed = false;
    }
}

// Met à jour le comportement et les effets des bonus actifs à chaque frame.
export function updateBonuses(gameData, dt, handleMonsterKill) {
    const now = Date.now();

    if (!bonusState._passiveKillWindowStart) bonusState._passiveKillWindowStart = now;
    if (!bonusState._passiveKillsInWindow) bonusState._passiveKillsInWindow = 0;
    const passiveWindowMs = 1000;
    const passiveLimit = 3;
// Gère l'application de dégâts ou l'élimination liés à une compétence passive.
    function tryPassiveKill(m, damage = 10, cooldownId = null) {
        if (!m || m.isDisposed()) return false;
        const tnow = Date.now();

        if (cooldownId) {
            if (!m._passiveCooldowns) m._passiveCooldowns = {};
            if (m._passiveCooldowns[cooldownId] && tnow < m._passiveCooldowns[cooldownId]) {
                return false;
            }
            m._passiveCooldowns[cooldownId] = tnow + 500;
        }

        if (m._type === 'boss' || m._type === 'amalgame' || m._type === 'kraken' || m._type === 'nuee' || m._type === 'mimic') {
            m._hp -= damage;
            if (m._hp <= 0) {
                handleMonsterKill(m);
                return true;
            }
            try { if (gameData && gameData.showHitMarker) gameData.showHitMarker(); } catch(e){}
            return false;
        }

        if (tnow - bonusState._passiveKillWindowStart > passiveWindowMs) {
            bonusState._passiveKillWindowStart = tnow;
            bonusState._passiveKillsInWindow = 0;
        }
        if (bonusState._passiveKillsInWindow < passiveLimit) {
            bonusState._passiveKillsInWindow++;
            handleMonsterKill(m);
            return true;
        }
        return false;
    }

    if (bonusState.regenLevel > 0 && gameData && typeof gameData.health === 'number') {
        const baseInterval = 5000;
        const interval = Math.max(1000, baseInterval - (bonusState.regenLevel - 1) * 500);
        if (!bonusState._lastRegenTime) bonusState._lastRegenTime = now;
        if (now - bonusState._lastRegenTime >= interval) {
            bonusState._lastRegenTime = now;
            const healAmount = 3 + bonusState.regenLevel * 2;
            gameData.health = Math.min(gameData.maxHealth, gameData.health + healAmount);
            if (gameData.hpBar) gameData.hpBar.width = Math.max(0, (gameData.health / gameData.maxHealth) * 100) + "%";
            if (gameData.hpText) gameData.hpText.text = `HP: ${Math.floor(gameData.health)}/${gameData.maxHealth}`;
        }
    }

    if (bonusState.auraLevel > 0 && bonusState.auraMesh) {
        const baseScale = 1 + (bonusState.auraLevel - 1) * 0.3;
        const aoeMultiplier = 1 + (bonusState.aoeSizeLevel || 0) * 0.25;
        const finalScale = baseScale * aoeMultiplier;
        bonusState.auraMesh.scaling.set(finalScale, 1, finalScale);

        bonusState.auraMesh.rotation.y += 2 * dt; 
        const radius = (8 * finalScale) / 2;
        
        for (let j = 0; j < gameData.monsters.length; j++) {
            if (BABYLON.Vector3.Distance(gameData.stickman.position, gameData.monsters[j].position) < radius + 0.5) {
                if (tryPassiveKill(gameData.monsters[j], 10, 'aura')) { j--; }
            }
        }
    }

    if (bonusState.sawsLevel > 0) {
        bonusState.sawsAngle += 3 * dt;
        
        const aoeMultiplier = 1 + (bonusState.aoeSizeLevel || 0) * 0.25;
        const orbitRadius = 5.0 * aoeMultiplier;
        const sawRadius = 1.5 * aoeMultiplier;
        
        bonusState.sawsMeshes.forEach((saw, index) => {
            const angleOffset = (Math.PI * 2 / bonusState.sawsMeshes.length) * index;
            const currentAngle = bonusState.sawsAngle + angleOffset;
            
            saw.position.x = gameData.stickman.position.x + Math.cos(currentAngle) * orbitRadius;
            saw.position.z = gameData.stickman.position.z + Math.sin(currentAngle) * orbitRadius;
            saw.position.y = gameData.stickman.position.y + 0.2; 
            
            saw.scaling.set(aoeMultiplier, aoeMultiplier, aoeMultiplier);
            saw.rotation.y += 15 * dt;

            for (let j = 0; j < gameData.monsters.length; j++) {
                if (BABYLON.Vector3.Distance(saw.position, gameData.monsters[j].position) < sawRadius) {
                    if (tryPassiveKill(gameData.monsters[j], 10, 'saws')) { j--; }
                }
            }
        });
    }

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
                mat.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
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
                const aoeMultiplier = 1 + (bonusState.aoeSizeLevel || 0) * 0.25;
                let radius = (3 + bonusState.missileLevel * 1) * aoeMultiplier;
                
                try {
                    const style = upgradeStyles.missile || { color: '#ff8a00' };
                    const ps = new BABYLON.ParticleSystem("missileExp", 500, gameData.scene);
                    ps.particleTexture = new BABYLON.Texture("assets/particles/fire.png", gameData.scene);
                    ps.emitter = m.mesh.position.clone();
                    ps.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
                    ps.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
                    ps.color1 = hexToColor4(style.color || '#ff8a00', 1.0);
                    ps.color2 = hexToColor4(style.accent || style.color || '#ff8a00', 0.9);
                    ps.minSize = 1.5 * aoeMultiplier; ps.maxSize = 4.5 * aoeMultiplier;
                    ps.minLifeTime = 0.4; ps.maxLifeTime = 1.2;
                    ps.emitRate = 2500;
                    ps.direction1 = new BABYLON.Vector3(-1, -1, -1);
                    ps.direction2 = new BABYLON.Vector3(1, 1, 1);
                    ps.gravity = new BABYLON.Vector3(0, -2, 0);
                    ps.disposeOnStop = true;
                    ps.start();
                    setTimeout(() => ps.stop(), 250);
                } catch (e) {}

                try { if (gameData && gameData.shakeCamera) gameData.shakeCamera(0.35, 400); } catch(e) {}
                try { if (gameData && gameData.explosionSound) gameData.explosionSound.play(); } catch(e) {}
                
                for (let j = 0; j < gameData.monsters.length; j++) {
                    if (BABYLON.Vector3.Distance(m.mesh.position, gameData.monsters[j].position) <= radius) {
                        if (tryPassiveKill(gameData.monsters[j])) { j--; }
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

    if (bonusState.zoneLevel > 0) {
        const meteorCooldown = Math.max(1000, 6000 - bonusState.zoneLevel * 800);
        const cooldownMultiplier = Math.max(0.25, 1 - 0.08 * (bonusState.cooldownReductionLevel || 0));
        
        if (!bonusState.lastZoneTime) bonusState.lastZoneTime = 0;

        if (now - bonusState.lastZoneTime > (meteorCooldown * cooldownMultiplier)) {
            bonusState.lastZoneTime = now;

            let numMeteors = 1 + Math.floor(bonusState.zoneLevel / 2);
            let meteorRadius = 25;

            for (let i = 0; i < numMeteors; i++) {
                setTimeout(() => {
                    if (!gameData.stickman || !gameData.scene) return;

                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * meteorRadius;
                    const targetX = gameData.stickman.position.x + Math.cos(angle) * distance;
                    const targetZ = gameData.stickman.position.z + Math.sin(angle) * distance;
                    const targetY = getHeight(targetX, targetZ);
                    const targetPos = new BABYLON.Vector3(targetX, targetY, targetZ);

                    const meteor = BABYLON.MeshBuilder.CreateBox("meteor", { size: 2.5 }, gameData.scene);
                    meteor.position = new BABYLON.Vector3(targetX, targetY + 40, targetZ);
                    
                    const metMat = new BABYLON.StandardMaterial("metMat", gameData.scene);
                    metMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                    metMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
                    meteor.material = metMat;
                    
                    meteor.rotation = new BABYLON.Vector3(Math.random(), Math.random(), Math.random());

                    const aoeMultiplier = 1 + (bonusState.aoeSizeLevel || 0) * 0.25;
                    const explosionRadius = (5 + bonusState.zoneLevel * 1.2) * aoeMultiplier;
                    
                    const shadow = BABYLON.MeshBuilder.CreateDisc("impactZone", { radius: explosionRadius }, gameData.scene);
                    shadow.position = new BABYLON.Vector3(targetX, targetY + 0.15, targetZ);
                    shadow.rotation.x = Math.PI / 2;
                    const shadMat = new BABYLON.StandardMaterial("shadMat", gameData.scene);
                    shadMat.diffuseColor = new BABYLON.Color3(0.8, 0, 0);
                    shadMat.alpha = 0.4;
                    shadow.material = shadMat;

                    let fallProgress = 0;
                    const fallSpeed = 0.008;
                    
                    const observer = gameData.scene.onBeforeRenderObservable.add(() => {
                        fallProgress += fallSpeed;
                        
                        if (meteor && !meteor.isDisposed()) {
                            meteor.position.y = BABYLON.Scalar.Lerp(targetY + 40, targetY, fallProgress);
                            meteor.rotation.x += 0.02;
                        }
                        
                        if (fallProgress >= 1) {
                            gameData.scene.onBeforeRenderObservable.remove(observer);
                            
                            try {
                                if (gameData.explosionSound) gameData.explosionSound.play();
                                if (gameData.shakeCamera) gameData.shakeCamera(0.5, 400);
                            } catch(e) {}

                            const damage = 60 + bonusState.zoneLevel * 30;
                            for (let j = 0; j < gameData.monsters.length; j++) {
                                const m = gameData.monsters[j];
                                if (!m || m.isDisposed()) continue;
                                
                                const dist = BABYLON.Vector3.Distance(new BABYLON.Vector3(targetX, targetY, targetZ), m.position);
                                if (dist <= explosionRadius) {
                                    const bossTypes = ['boss', 'amalgame', 'kraken', 'nuee', 'mimic'];
                                    if (m._type && bossTypes.includes(m._type)) {
                                        m._hp -= damage;
                                        if (gameData.showHitMarker) gameData.showHitMarker();
                                        if (m._hp <= 0) handleMonsterKill(m);
                                    } else {
                                        handleMonsterKill(m);
                                    }
                                }
                            }

                            if (meteor) meteor.dispose();
                            if (shadow) shadow.dispose();
                        }
                    });
                }, i * 500);
            }
        }
    }

    if (bonusState.lightningLevel > 0) {
        const lightningCooldown = Math.max(1000, 4000 - bonusState.lightningLevel * 500);
        if (now - bonusState.lastLightningTime > lightningCooldown && gameData.monsters.length > 0) {
            bonusState.lastLightningTime = now;

            let numStrikes = 1 + Math.floor((bonusState.lightningLevel - 1) / 2);
            let stunDuration = bonusState.lightningLevel > 1 ? 2.0 : 0;

            let lightningDamage = 25 + (bonusState.lightningLevel * 25);

            let sortedMonsters = [...gameData.monsters].sort((a, b) => {
                return BABYLON.Vector3.DistanceSquared(gameData.stickman.position, a.position) - 
                    BABYLON.Vector3.DistanceSquared(gameData.stickman.position, b.position);
            });

            for (let i = 0; i < Math.min(numStrikes, sortedMonsters.length); i++) {
                let target = sortedMonsters[i];
                
                if (target && !target.isDisposed()) {
                    let targetPos = target.position.clone();
                    
                    const lightning = BABYLON.MeshBuilder.CreateCylinder("lightning", { diameterTop: 0.5, diameterBottom: 0.1, height: 40 }, gameData.scene);
                    lightning.position = targetPos.clone();
                    lightning.position.y += 20;
                    const mat = new BABYLON.StandardMaterial("lightningMat", gameData.scene);
                    mat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
                    mat.alpha = 0.8;
                    lightning.material = mat;

                    setTimeout(() => { if(lightning) lightning.dispose(); }, 200);

                    if (stunDuration > 0) {
                        if (!gameData.scene.stunMat) {
                            gameData.scene.stunMat = new BABYLON.StandardMaterial("stunMat", gameData.scene);
                            gameData.scene.stunMat.diffuseColor = new BABYLON.Color3(0, 0.8, 1);
                        }
                        for (let j = 0; j < gameData.monsters.length; j++) {
                            let m = gameData.monsters[j];
                            if (m !== target && BABYLON.Vector3.DistanceSquared(new BABYLON.Vector3(targetPos.x, m.position.y, targetPos.z), m.position) < 36) {
                                m.stunTime = Date.now() + stunDuration * 1000;
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

                    try {
                        const bossTypes = ['boss', 'amalgame', 'kraken', 'nuee', 'mimic'];
                        if (target._type && bossTypes.includes(target._type)) {
                            target._hp -= lightningDamage;
                            if (gameData.showHitMarker) gameData.showHitMarker();
                            if (target._hp <= 0) handleMonsterKill(target);
                        } else {
                            handleMonsterKill(target);
                        }
                    } catch(e) {
                        try { handleMonsterKill(target); } catch(err) {}
                    }
                }
            }
        }
    }
}