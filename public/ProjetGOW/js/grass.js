import { limitRadius, getHeight, waterLevel } from "./utils.js";

// Gère l'instanciation de grands volumes d'herbe à la surface non immergée de la scène.
export function createGrass(scene, count, quality = "high") {
    if (scene._swayGrass) {
        scene._swayGrass.forEach(g => g.dispose());
    }
    scene._swayGrass = [];
    
    if (scene._grassTuftBase) {
        scene._grassTuftBase.dispose();
        scene._grassTuftBase = null;
    }

    if (quality === "low") return;

    const grassBlade = BABYLON.MeshBuilder.CreatePlane("grassBlade", {width: 1, height: 1}, scene);
    grassBlade.material = new BABYLON.StandardMaterial("grassMat", scene);
    grassBlade.material.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    grassBlade.material.backFaceCulling = false;
    
    const grass2 = grassBlade.clone();
    grass2.rotation.y = Math.PI / 3;
    const grass3 = grassBlade.clone();
    grass3.rotation.y = 2 * Math.PI / 3;

    const grassTuft = BABYLON.Mesh.MergeMeshes([grassBlade, grass2, grass3], true, true, undefined, false, true);
    grassTuft.name = "grassTuft";
    grassTuft.position = BABYLON.Vector3.Zero();
    scene._grassTuftBase = grassTuft;

    const buffer = new Float32Array(count * 16);
    let validCount = 0;

    const scaleVec = new BABYLON.Vector3();
    const posVec = new BABYLON.Vector3();
    const rotQuat = BABYLON.Quaternion.Identity();
    const matrix = new BABYLON.Matrix();

    for (let i = 0; i < count; i++) {
        const r = limitRadius * Math.sqrt(Math.random()) * 0.95;
        if (r < 20) {
            i--;
            continue;
        }

        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = getHeight(x, z);

        if (y < waterLevel + 0.2) continue;

        const scale = 0.5 + Math.random() * 0.5;
        
        scaleVec.setAll(scale);
        posVec.set(x, y + 0.5, z);
        
        BABYLON.Matrix.ComposeToRef(scaleVec, rotQuat, posVec, matrix);
        matrix.copyToArray(buffer, validCount * 16);
        
        validCount++;
    }

    const finalBuffer = buffer.subarray(0, validCount * 16);
    grassTuft.thinInstanceSetBuffer('matrix', finalBuffer);
    
    grassTuft.thinInstanceRefreshBoundingInfo(true);
}