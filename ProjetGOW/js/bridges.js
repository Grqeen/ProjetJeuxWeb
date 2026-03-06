import { limitRadius, getHeight, waterLevel } from "./utils.js";

export function createBridges(scene, count) {
    const woodMat = new BABYLON.StandardMaterial("woodMat", scene);
    woodMat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1);

    let bridgesCreated = 0;
    let attempts = 0;

    // On essaie de créer le nombre demandé de ponts, mais on limite les tentatives pour ne pas planter le navigateur
    while (bridgesCreated < count && attempts < 500) {
        attempts++;

        // 1. Choisir un point aléatoire
        const r = limitRadius * Math.sqrt(Math.random()) * 0.8;
        // Zone de sécurité égout
        if (r < 35) continue;

        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // 2. Vérifier si ce point est DANS l'eau (c'est notre point de départ pour chercher les rives)
        if (getHeight(x, z) >= waterLevel) continue;

        // 3. Choisir une direction aléatoire pour le pont
        const angle = Math.random() * Math.PI; // Entre 0 et 180 (le pont est une ligne droite)
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);

        // 4. "Marcher" dans les deux sens pour trouver la terre ferme
        let startPoint = null;
        let endPoint = null;

        // Recherche vers l'arrière (Start)
        for (let d = 0; d < 40; d += 1) { // Max 40 unités de recherche
            const testX = x - dirX * d;
            const testZ = z - dirZ * d;
            if (getHeight(testX, testZ) >= waterLevel) {
                startPoint = new BABYLON.Vector3(testX, waterLevel + 0.5, testZ); // Un peu au dessus de l'eau
                break;
            }
        }

        // Recherche vers l'avant (End)
        for (let d = 0; d < 40; d += 1) {
            const testX = x + dirX * d;
            const testZ = z + dirZ * d;
            if (getHeight(testX, testZ) >= waterLevel) {
                endPoint = new BABYLON.Vector3(testX, waterLevel + 0.5, testZ);
                break;
            }
        }

        // Si on a trouvé les deux rives et que le pont n'est pas trop petit ni trop grand
        if (startPoint && endPoint) {
            const distance = BABYLON.Vector3.Distance(startPoint, endPoint);
            
            if (distance > 5 && distance < 50) {
                // Création du pont
                const bridgeGroup = new BABYLON.TransformNode("bridge" + bridgesCreated, scene);
                
                // Position au centre du pont
                const midPoint = startPoint.add(endPoint).scale(0.5);
                bridgeGroup.position = midPoint;
                
                // Orientation
                bridgeGroup.lookAt(endPoint);

                // Planches du pont (Box étirée)
                const bridge = BABYLON.MeshBuilder.CreateBox("planks", {width: 2, height: 0.2, depth: distance}, scene);
                bridge.material = woodMat;
                bridge.checkCollisions = true;
                bridge.parent = bridgeGroup;

                // Piliers aux extrémités (pour faire joli)
                const p1 = BABYLON.MeshBuilder.CreateCylinder("p1", {height: 3, diameter: 0.3}, scene);
                p1.position.z = -distance / 2;
                p1.position.y = -1;
                p1.material = woodMat;
                p1.parent = bridgeGroup;

                const p2 = BABYLON.MeshBuilder.CreateCylinder("p2", {height: 3, diameter: 0.3}, scene);
                p2.position.z = distance / 2;
                p2.position.y = -1;
                p2.material = woodMat;
                p2.parent = bridgeGroup;

                bridgesCreated++;
            }
        }
    }
}