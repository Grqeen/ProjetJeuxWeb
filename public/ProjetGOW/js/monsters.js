import { mapSize, getHeight } from "./utils.js";

// Invoque une quantité d'instances d'ennemis hétérogènes réparties sur le décor.
export function createMonsters(scene, count) {
    count = Math.floor(count * 1.5);

    const monsters = [];

    const monsterMat = new BABYLON.StandardMaterial("monsterMat", scene);
    monsterMat.diffuseColor = new BABYLON.Color3(1, 0, 0);

    let template = scene.getMeshByName("_monsterTemplate");
    if (!template) {
        template = BABYLON.MeshBuilder.CreateBox("_monsterTemplate", { size: 1 }, scene);
        template.isVisible = false;
    }
    template.material = monsterMat;

    let tankTemplate = scene.getMeshByName("_monsterTankTemplate");
    if (!tankTemplate) {
        tankTemplate = BABYLON.MeshBuilder.CreateBox("_monsterTankTemplate", { width: 2.2, height: 2.2, depth: 2.2 }, scene);
        tankTemplate.isVisible = false;
    }
    tankTemplate.material = monsterMat;

    let stalkerTemplate = scene.getMeshByName("_monsterStalkerTemplate");
    if (!stalkerTemplate) {
        stalkerTemplate = BABYLON.MeshBuilder.CreateBox("_monsterStalkerTemplate", { width: 0.9, height: 0.45, depth: 1.2 }, scene);
        stalkerTemplate.isVisible = false;
    }
    stalkerTemplate.material = monsterMat;

    let rangedTemplate = scene.getMeshByName("_monsterRangedTemplate");
    if (!rangedTemplate) {
        rangedTemplate = BABYLON.MeshBuilder.CreateSphere("_monsterRangedTemplate", { diameter: 0.9 }, scene);
        rangedTemplate.isVisible = false;
    }
    rangedTemplate.material = monsterMat;

    let flyingTemplate = scene.getMeshByName("_monsterFlyingTemplate");
    if (!flyingTemplate) {
        flyingTemplate = BABYLON.MeshBuilder.CreateSphere("_monsterFlyingTemplate", { diameter: 0.8 }, scene);
        flyingTemplate.isVisible = false;
    }
    flyingTemplate.material = monsterMat;

    for (let i = 0; i < count; i++) {
        const x = Math.random() * mapSize - mapSize / 2;
        const z = Math.random() * mapSize - mapSize / 2;

        const dist = Math.sqrt(x * x + z * z);
        if (dist < 15) {
            i--;
            continue;
        }

        const y = getHeight(x, z) + 0.5;
        const r = Math.random();
        let type = 'standard';
        if (r < 0.03) type = 'tank';
        else if (r < 0.43) type = 'stalker';
        else if (r < 0.53) type = 'ranged';
        else if (r < 0.63) type = 'flying';

        let templateRef = template;
        if (type === 'tank') templateRef = tankTemplate;
        else if (type === 'stalker') templateRef = stalkerTemplate;
        else if (type === 'ranged') templateRef = rangedTemplate;
        else if (type === 'flying') templateRef = flyingTemplate;

        const instance = templateRef.createInstance("monster" + i);
        instance.isVisible = true;
        instance.position = new BABYLON.Vector3(x, y, z);

        instance._type = type;

        if (type === 'tank') {
            instance.ai = { speed: 1.2 };
            instance._hp = 6;
        } else if (type === 'stalker') {
            instance.ai = { speed: 8.5 };
            instance._hp = 1;
        } else if (type === 'ranged') {
            instance.ai = { speed: 2.0 };
            instance._hp = 1;
            instance._shotCooldown = 1300 + Math.floor(Math.random() * 900);
            instance._lastShotTime = 0;
            instance._preferredRange = 10;
        } else {
            instance.ai = { speed: 2.5 + Math.random() * 1.5 };
            instance._hp = 1;
        }

        instance._castsShadow = false;
        instance.physicsAgg = null;
        instance.physicsBody = null;
        monsters.push(instance);
    }

    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(...monsters);

    return monsters;
}

// Initialise la structure et la mécanique de boss pour le "Goliath des Ruines".
export function createBoss(scene) {
    const bossMat = new BABYLON.StandardMaterial("bossMat", scene);
    bossMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    bossMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.05);

    const boss = BABYLON.MeshBuilder.CreateBox("boss_torso", { height: 4, width: 3.5, depth: 3 }, scene);
    boss.material = bossMat;
    boss.isVisible = true;

    const head = BABYLON.MeshBuilder.CreateBox("boss_head", { size: 1.5 }, scene);
    head.parent = boss;
    head.position.y = 2.75;
    head.material = bossMat;

    const leftArm = BABYLON.MeshBuilder.CreateBox("boss_lArm", { height: 3, width: 1.2, depth: 1.2 }, scene);
    leftArm.parent = boss;
    leftArm.position.x = -2.35;
    leftArm.position.y = 0.5;
    leftArm.material = bossMat;

    const rightArm = BABYLON.MeshBuilder.CreateBox("boss_rArm", { height: 4.5, width: 1.8, depth: 1.5 }, scene);
    rightArm.parent = boss;
    rightArm.position.x = 2.65;
    rightArm.position.y = 0.25;
    rightArm.material = bossMat;

    boss._type = 'boss';
    boss._hp = 500;
    boss.maxHp = 500;
    boss.ai = { speed: 1.0 };
    boss._castsShadow = false;

    boss._lastJumpTime = 0;
    boss._isJumping = false;
    boss._shockwaveStep = 0;

    boss._lastThrowTime = 0;
    boss._isAttracting = false;
    boss._lastAttractTime = 0;

    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(boss);

    return boss;
}

// Initialise l'apparition du boss "Amalgame" et gère son mode proportionnel.
export function createAmalgame(scene, sizeMode = 1) {
    let diameter = 6;
    let hp = 1000;
    let speed = 2.5;

    if (sizeMode === 2) {
        diameter = 4;
        hp = 333;
        speed = 3.5;
    } else if (sizeMode === 4) {
        diameter = 2.5;
        hp = 83;
        speed = 5.0;
    }

    const mat = new BABYLON.StandardMaterial("amalgameMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.9);
    mat.emissiveColor = new BABYLON.Color3(0.3, 0.0, 0.5);
    mat.alpha = 0.8;

    const amalgame = BABYLON.MeshBuilder.CreateSphere("amalgame_" + sizeMode + "_" + Date.now(), { diameter: diameter, segments: 16 }, scene);
    amalgame.material = mat;
    amalgame.position.y = diameter / 2;

    amalgame._type = 'amalgame';
    amalgame._sizeMode = sizeMode;
    amalgame._hp = hp;
    amalgame.maxHp = hp;
    amalgame.ai = { speed: speed };
    amalgame._castsShadow = false;

    amalgame._pulsePhase = Math.random() * Math.PI * 2;
    amalgame._baseDiameter = diameter;

    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(amalgame);

    return amalgame;
}

// Définit le boss stationnaire "Kraken des Terres", incluant son animation organique basique.
export function createKraken(scene) {
    const krakenMat = new BABYLON.StandardMaterial("krakenMat", scene);
    krakenMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.35);
    krakenMat.emissiveColor = new BABYLON.Color3(0.0, 0.15, 0.2);

    const body = BABYLON.MeshBuilder.CreateSphere("kraken_body", { diameterX: 8, diameterY: 4, diameterZ: 8, segments: 12 }, scene);
    body.material = krakenMat;
    body.isVisible = true;

    const tentacleMat = new BABYLON.StandardMaterial("tentacleMat", scene);
    tentacleMat.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.3);
    tentacleMat.emissiveColor = new BABYLON.Color3(0.0, 0.1, 0.15);

    const tentacles = [];
    for (let i = 0; i < 4; i++) {
        const t = BABYLON.MeshBuilder.CreateCylinder("kraken_tentacle_" + i, { height: 12, diameterTop: 0.4, diameterBottom: 1.5, tessellation: 8 }, scene);
        t.material = tentacleMat;
        t.parent = body;
        const angle = (Math.PI * 2 / 4) * i;
        t.position.x = Math.cos(angle) * 4;
        t.position.z = Math.sin(angle) * 4;
        t.position.y = 4;
        t.rotation.z = Math.cos(angle) * 0.5;
        t.rotation.x = Math.sin(angle) * 0.5;
        tentacles.push(t);
    }

    body._type = 'kraken';
    body._hp = 1500;
    body.maxHp = 1500;
    body.ai = { speed: 0 };
    body._castsShadow = false;
    body._tentacles = tentacles;
    body._isVulnerable = false;
    body._lastFloodTime = 0;
    body._isFlooding = false;
    body._lastTentacleSwipe = 0;
    body._lastMudShot = 0;
    body._tentacleBaseAngles = tentacles.map((t, i) => (Math.PI * 2 / 4) * i);

    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(body);
    return body;
}

// Compose le Seigneur de la Nuée et matérialise le vortex atmosphérique qui l'entoure.
export function createNuee(scene) {
    const nueeMat = new BABYLON.StandardMaterial("nueeMat", scene);
    nueeMat.diffuseColor = new BABYLON.Color3(0.6, 0.7, 0.8);
    nueeMat.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.6);
    nueeMat.alpha = 0.9;

    const body = BABYLON.MeshBuilder.CreateSphere("nuee_body", { diameter: 4, segments: 12 }, scene);
    body.material = nueeMat;

    const vortexMat = new BABYLON.StandardMaterial("vortexMat", scene);
    vortexMat.diffuseColor = new BABYLON.Color3(0.4, 0.5, 0.6);
    vortexMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
    vortexMat.alpha = 0.6;
    vortexMat.wireframe = true;

    const vortex = BABYLON.MeshBuilder.CreateTorus("nuee_vortex", { diameter: 8, thickness: 1.5, tessellation: 20 }, scene);
    vortex.material = vortexMat;
    vortex.parent = body;

    body._type = 'nuee';
    body._hp = 1000;
    body.maxHp = 1000;
    body.ai = { speed: 3.0 };
    body._castsShadow = false;
    body._vortex = vortex;
    body._orbitAngle = 0;
    body._isDiving = false;
    body._isStunned = false;
    body._stunEndTime = 0;
    body._lastWindTime = 0;
    body._lastDiveTime = 0;
    body._lastSummonTime = 0;
    body._diveTarget = null;

    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(body);
    return body;
}

// Forme le boss "Mimic", configuré pour imiter les propres compétences du joueur.
export function createMimic(scene) {
    const mimicMat = new BABYLON.StandardMaterial("mimicMat", scene);
    mimicMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.08);
    mimicMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    mimicMat.alpha = 0.85;

    const body = BABYLON.MeshBuilder.CreateSphere("mimic_body", { diameter: 3, segments: 12 }, scene);
    body.material = mimicMat;

    body._type = 'mimic';
    body._hp = 1200;
    body.maxHp = 1200;
    body.ai = { speed: 4.0 };
    body._castsShadow = false;
    body._currentAbility = null;
    body._lastAbilitySwitch = 0;
    body._isJumping = false;
    body._lastJumpTime = 0;
    body._lastMissileTime = 0;
    body._zigzagPhase = Math.random() * Math.PI * 2;
    body._abilityColor = new BABYLON.Color3(0.1, 0.1, 0.15);

    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(body);
    return body;
}