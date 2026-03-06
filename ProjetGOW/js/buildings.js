import { limitRadius, getHeight, waterLevel } from "./utils.js";

export function createBuildings(scene, count) {
    // Création de bâtiments (cubes gris)
    const buildingMat = new BABYLON.StandardMaterial("buildingMat", scene);
    buildingMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45); // Gris béton

    for (let i = 0; i < count; i++) {
        // Position aléatoire
        const r = limitRadius * Math.sqrt(Math.random()) * 0.8;
        if (r < 35) { // Zone de sécurité élargie
            i--;
            continue; 
        }

        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = getHeight(x, z);

        // Ne pas construire dans l'eau profonde
        if (y < waterLevel + 0.5) continue;

        // Dimensions du bâtiment
        const width = 5 + Math.random() * 8;
        const depth = 5 + Math.random() * 8;
        const height = 10 + Math.random() * 25;

        const building = BABYLON.MeshBuilder.CreateBox("building" + i, {width: width, height: height, depth: depth}, scene);
        building.position = new BABYLON.Vector3(x, y + height / 2, z);
        building.material = buildingMat;
        building.checkCollisions = true;
    }
}