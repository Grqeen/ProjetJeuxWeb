import { mapSize, getHeight } from "./utils.js";

export function createMonsters(scene, count) {
    const monsters = [];

    const monsterMat = new BABYLON.StandardMaterial("monsterMat", scene);
    monsterMat.diffuseColor = new BABYLON.Color3(1, 0, 0);

    // Create templates (hidden) of different shapes for instancing
    let template = scene.getMeshByName("_monsterTemplate");
    if (!template) {
        template = BABYLON.MeshBuilder.CreateBox("_monsterTemplate", {size: 1}, scene);
        template.isVisible = false;
    }
    template.material = monsterMat;

    let tankTemplate = scene.getMeshByName("_monsterTankTemplate");
    if (!tankTemplate) {
        tankTemplate = BABYLON.MeshBuilder.CreateBox("_monsterTankTemplate", {width: 2.2, height: 2.2, depth: 2.2}, scene);
        tankTemplate.isVisible = false;
    }
    tankTemplate.material = monsterMat;

    let stalkerTemplate = scene.getMeshByName("_monsterStalkerTemplate");
    if (!stalkerTemplate) {
        // low-profile rectangle close to the ground
        stalkerTemplate = BABYLON.MeshBuilder.CreateBox("_monsterStalkerTemplate", {width: 0.9, height: 0.45, depth: 1.2}, scene);
        stalkerTemplate.isVisible = false;
    }
    stalkerTemplate.material = monsterMat;

    let rangedTemplate = scene.getMeshByName("_monsterRangedTemplate");
    if (!rangedTemplate) {
        // archers are circular (sphere)
        rangedTemplate = BABYLON.MeshBuilder.CreateSphere("_monsterRangedTemplate", {diameter: 0.9}, scene);
        rangedTemplate.isVisible = false;
    }
    rangedTemplate.material = monsterMat;

    // flying template (small sphere with slight elevation)
    let flyingTemplate = scene.getMeshByName("_monsterFlyingTemplate");
    if (!flyingTemplate) {
        flyingTemplate = BABYLON.MeshBuilder.CreateSphere("_monsterFlyingTemplate", {diameter: 0.8}, scene);
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
        // Choose a type first: 0=standard, 1=tank, 2=stalker (fast fragile), 3=ranged
        const r = Math.random();
        let type = 'standard';
        if (r < 0.08) type = 'tank';
        else if (r < 0.28) type = 'stalker';
        else if (r < 0.42) type = 'ranged';
        else if (r < 0.55) type = 'flying';

        // choose template by type
        let templateRef = template;
        if (type === 'tank') templateRef = tankTemplate;
        else if (type === 'stalker') templateRef = stalkerTemplate;
        else if (type === 'ranged') templateRef = rangedTemplate;
        else if (type === 'flying') templateRef = flyingTemplate;

        const instance = templateRef.createInstance("monster" + i);
        instance.isVisible = true;
        instance.position = new BABYLON.Vector3(x, y, z);

        instance._type = type;

        // set AI stats & HP based on type (visual shape comes from template)
        if (type === 'tank') {
            instance.ai = { speed: 1.2 };
            instance._hp = 4; // requires multiple hits
        } else if (type === 'stalker') {
            instance.ai = { speed: 4.5 };
            instance._hp = 1; // fragile
        } else if (type === 'ranged') {
            instance.ai = { speed: 2.0 };
            instance._hp = 1;
            instance._shotCooldown = 1300 + Math.floor(Math.random() * 900); // ms
            instance._lastShotTime = 0;
            instance._preferredRange = 10; // meters
        } else {
            instance.ai = { speed: 2.5 + Math.random() * 1.5 };
            instance._hp = 1;
        }

        // Avoid adding all monsters as shadow casters: we'll manage dynamically in main loop
        instance._castsShadow = false;
        instance.physicsAgg = null; // store PhysicsAggregate when created dynamically
        instance.physicsBody = null; // legacy field some code checks
        monsters.push(instance);
    }

    // keep a registry for shadow management
    if (!scene._registeredMonsters) scene._registeredMonsters = [];
    scene._registeredMonsters.push(...monsters);

    return monsters;
}