import { mapSize, waterLevel } from "./utils.js";

export function createWater(scene) {
    // Création d'un grand plan pour l'eau
    const waterMesh = BABYLON.MeshBuilder.CreateGround("water", {width: mapSize, height: mapSize}, scene);
    waterMesh.position.y = waterLevel;
    
    const waterMat = new BABYLON.StandardMaterial("waterMat", scene);
    waterMat.diffuseColor = new BABYLON.Color3(0, 0.1, 0.6); // Bleu profond
    waterMat.alpha = 0.6; // Transparence
    waterMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Reflets
    waterMat.backFaceCulling = false; // Visible par dessous aussi
    waterMesh.material = waterMat;
}