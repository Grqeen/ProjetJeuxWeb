import { mapSize, getHeight } from "./utils.js";

export function createTerrain(scene) {
    // Crée un sol avec plus de subdivisions pour le relief
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: mapSize, 
        height: mapSize, 
        subdivisions: 400, // Augmenté pour la taille 1000
        updatable: true
    }, scene);
    
    // Appliquer la hauteur aux vertices du sol
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const colors = [];

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const y = getHeight(x, z);
        positions[i + 1] = y;

        // Calcul de la couleur en fonction de la hauteur
        if (y < 10) {
            // Herbe (Vert)
            colors.push(0.1, 0.6, 0.1, 1); 
        } else if (y < 80) {
            // Roche (Gris foncé / Marron)
            colors.push(0.35, 0.3, 0.3, 1); 
        } else {
            // Neige (Blanc)
            colors.push(0.95, 0.95, 1, 1); 
        }
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    ground.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    
    // Recalculer les normales pour l'éclairage
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, ground.getIndices(), normals);
    ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

    // IMPORTANT : Recalculer la boîte de collision pour qu'elle colle aux montagnes
    ground.refreshBoundingInfo();

    // Matériau du sol
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1); // La couleur de base est blanche pour laisser voir les Vertex Colors
    groundMat.specularColor = new BABYLON.Color3(0, 0, 0); // Pas de brillance plastique
    groundMat.useVertexColors = true; // IMPORTANT : Active les couleurs définies plus haut
    ground.material = groundMat;
    ground.checkCollisions = true; // IMPORTANT : Permet au joueur de marcher dessus

    return ground;
}