import { limitRadius, getHeight, waterLevel } from "./utils.js";

export function createGrass(scene, count) {
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
    grassTuft.setEnabled(false);
    grassTuft.position.y = -1000;

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

        const instance = grassTuft.createInstance("grass" + i);
        instance.position = new BABYLON.Vector3(x, y + 0.5, z);
        const scale = 0.5 + Math.random() * 0.5;
        instance.scaling = new BABYLON.Vector3(scale, scale, scale);
        instance.swayData = {
            phase: Math.random() * Math.PI * 2,
            speed: 0.001 + Math.random() * 0.002,
            amount: 0.02 + Math.random() * 0.03
        };
        if (!scene._swayGrass) scene._swayGrass = [];
        scene._swayGrass.push(instance);
    }
}