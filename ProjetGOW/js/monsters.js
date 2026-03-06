import { mapSize, getHeight } from "./utils.js";

export function createMonsters(scene, count) {
    const monsters = [];
    for (let i = 0; i < count; i++) {
        const monster = BABYLON.MeshBuilder.CreateSphere("monster" + i, {diameter: 1}, scene);
        const x = Math.random() * mapSize - mapSize / 2;
        const z = Math.random() * mapSize - mapSize / 2;

        // Vérifier la distance avec le centre (0,0)
        const dist = Math.sqrt(x * x + z * z);
        if (dist < 15) { // Si trop près du départ
            i--; // On réessaie
            continue;
        }

        const y = getHeight(x, z) + 0.5;
        monster.position = new BABYLON.Vector3(x, y, z);
        monster.material = new BABYLON.StandardMaterial("monsterMat", scene);
        monster.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Rouge pour les monstres
        monsters.push(monster);
    }
    return monsters;
}