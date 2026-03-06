import { limitRadius, getHeight, waterLevel } from "./utils.js";

export function createGrass(scene, count) {
    // Modèle de base d'une touffe d'herbe (3 plans croisés)
    const grassBlade = BABYLON.MeshBuilder.CreatePlane("grassBlade", {width: 1, height: 1}, scene);
    grassBlade.material = new BABYLON.StandardMaterial("grassMat", scene);
    grassBlade.material.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    grassBlade.material.backFaceCulling = false; // Visible des deux côtés
    
    const grass2 = grassBlade.clone();
    grass2.rotation.y = Math.PI / 3;
    const grass3 = grassBlade.clone();
    grass3.rotation.y = 2 * Math.PI / 3;

    const grassTuft = BABYLON.Mesh.MergeMeshes([grassBlade, grass2, grass3], true, true, undefined, false, true);
    grassTuft.name = "grassTuft";
    grassTuft.setEnabled(false);
    grassTuft.position.y = -1000;

    // Création des instances
    for (let i = 0; i < count; i++) {
        const r = limitRadius * Math.sqrt(Math.random()) * 0.95;
        // On évite la zone de l'égout (rayon < 20 pour être large)
        if (r < 20) {
            i--;
            continue;
        }

        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = getHeight(x, z);

        // Pas d'herbe sous l'eau
        if (y < waterLevel + 0.2) continue;

        const instance = grassTuft.createInstance("grass" + i);
        instance.position = new BABYLON.Vector3(x, y + 0.5, z);
        // Variation de taille aléatoire
        const scale = 0.5 + Math.random() * 0.5;
        instance.scaling = new BABYLON.Vector3(scale, scale, scale);
    }
}