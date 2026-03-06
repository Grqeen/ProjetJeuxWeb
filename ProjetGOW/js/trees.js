import { limitRadius, getHeight, waterLevel } from "./utils.js";

export function createTrees(scene, count) {
    // 1. Création du modèle d'arbre de base (invisible)
    // Tronc
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 4, diameter: 1}, scene);
    trunk.material = new BABYLON.StandardMaterial("trunkMat", scene);
    trunk.material.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2); // Marron
    
    // Feuillage (Cône)
    const leaves = BABYLON.MeshBuilder.CreateCylinder("leaves", {diameterTop: 0, diameterBottom: 5, height: 6}, scene);
    leaves.position.y = 3;
    leaves.material = new BABYLON.StandardMaterial("leavesMat", scene);
    leaves.material.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.1); // Vert foncé

    // Fusionner les meshes pour optimiser (un seul objet par arbre)
    const treeModel = BABYLON.Mesh.MergeMeshes([trunk, leaves], true, true, undefined, false, true);
    treeModel.name = "treeModel";
    
    // On cache le modèle original, on ne verra que les copies
    treeModel.setEnabled(false); // Désactive complètement le mesh original
    treeModel.position.y = -1000; // On l'enterre très loin pour être sûr

    // 2. Création des instances (copies légères)
    for (let i = 0; i < count; i++) {
        // Position aléatoire dans l'arène
        // On utilise la racine carrée pour une distribution uniforme dans le cercle
        const r = limitRadius * Math.sqrt(Math.random()) * 0.9; // 0.9 pour ne pas coller aux montagnes
        
        // Zone d'exclusion autour de l'égout (rayon de 30 pour être sûr)
        if (r < 30) {
            i--; // On réessaie une autre position
            continue;
        }

        const theta = Math.random() * 2 * Math.PI;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // Créer une instance
        const instance = treeModel.createInstance("tree" + i);
        
        // Positionner l'arbre sur le sol
        const y = getHeight(x, z);

        // Si l'arbre est dans l'eau (ou trop près du bord), on ne le crée pas
        if (y < waterLevel + 1.0) continue;

        instance.position = new BABYLON.Vector3(x, y + 2, z); // +2 car l'origine de l'arbre est au centre du tronc
        instance.checkCollisions = true; // (Optionnel) pour plus tard
    }
}