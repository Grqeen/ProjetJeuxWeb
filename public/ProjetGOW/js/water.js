import { mapSize, waterLevel } from "./utils.js";

// Génère la surface d'eau de la carte.
export function createWater(scene) {
    const waterMesh = BABYLON.MeshBuilder.CreateGround("water", {width: mapSize, height: mapSize}, scene);
    waterMesh.position.y = waterLevel;
    
    const waterMat = new BABYLON.StandardMaterial("waterMat", scene);
    waterMat.diffuseColor = new BABYLON.Color3(0, 0.1, 0.6);
    waterMat.alpha = 0.6;
    waterMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    waterMat.backFaceCulling = false;
    waterMesh.material = waterMat;
}