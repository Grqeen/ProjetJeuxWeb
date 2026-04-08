import { limitRadius, getHeight, waterLevel } from "./utils.js";

export function createTrees(scene, count) {
    BABYLON.SceneLoader.ImportMesh("", "assets/modele3D/Arbre/", "Meshy_AI_arbre_0309132215_texture.glb", scene, function (meshes) {
        const treeModel = meshes[0];
        treeModel.name = "treeModel";
        
        treeModel.setEnabled(false);
        treeModel.position.y = -1000;

        for (let i = 0; i < count; i++) {
            const r = limitRadius * Math.sqrt(Math.random()) * 0.9;
            
            if (r < 30) {
                i--; 
                continue;
            }

            const theta = Math.random() * 2 * Math.PI;
            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);
            const y = getHeight(x, z);

            if (y < waterLevel + 1.0) continue;

            const instance = treeModel.instantiateHierarchy();
            
            instance.setEnabled(true);
            
            if (scene.shadowGenerator) {
                scene.shadowGenerator.addShadowCaster(instance, true); // L'arbre projette une ombre
            }

            const scale = 4.0 + Math.random() * 3.0;
            instance.scaling = new BABYLON.Vector3(scale, scale, scale);

            instance.position = new BABYLON.Vector3(x, y + (scale * 0.5) + 1.0, z);
            
            const hx = getHeight(x + 1, z);
            const hz = getHeight(x, z + 1);
            
            instance.rotation.x = (hz - y) * 0.5;
            instance.rotation.z = -(hx - y) * 0.5;
            instance.rotation.y = Math.random() * Math.PI * 2;
            
            instance.freezeWorldMatrix();
            
            // --- AJOUT DES COLLISIONS POUR L'ARBRE (Hitbox cylindrique invisible sur le tronc) ---
            const trunkCollider = BABYLON.MeshBuilder.CreateCylinder("trunkCollider" + i, { height: scale * 2.5, diameter: scale * 0.35 }, scene);
            trunkCollider.position = new BABYLON.Vector3(x, y + (scale * 1.25), z);
            trunkCollider.isVisible = false;
            new BABYLON.PhysicsAggregate(trunkCollider, BABYLON.PhysicsShapeType.CYLINDER, { mass: 0, friction: 0.8 }, scene);
        }
    });
}