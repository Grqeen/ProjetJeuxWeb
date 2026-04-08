import { mapSize, getHeight } from "./utils.js";

export function createMonsters(scene, count) {
    const monsters = [];
    
    const monsterMat = new BABYLON.StandardMaterial("monsterMat", scene);
    monsterMat.diffuseColor = new BABYLON.Color3(1, 0, 0);

    for (let i = 0; i < count; i++) {
        const monster = BABYLON.MeshBuilder.CreateSphere("monster" + i, {diameter: 1}, scene);
        const x = Math.random() * mapSize - mapSize / 2;
        const z = Math.random() * mapSize - mapSize / 2;

        const dist = Math.sqrt(x * x + z * z);
        if (dist < 15) {
            i--;
            continue;
        }

        const y = getHeight(x, z) + 0.5;
        monster.position = new BABYLON.Vector3(x, y, z);
        monster.material = monsterMat;
        
        if (scene.shadowGenerator) {
            scene.shadowGenerator.addShadowCaster(monster);
        }
        
        const monsterAgg = new BABYLON.PhysicsAggregate(monster, BABYLON.PhysicsShapeType.SPHERE, { mass: 1, friction: 0.1 }, scene);
        monsterAgg.body.setMassProperties({ inertia: new BABYLON.Vector3(0, 0, 0) });
        monsterAgg.body.disablePreStep = false;
        monsters.push(monster);
    }
    return monsters;
}