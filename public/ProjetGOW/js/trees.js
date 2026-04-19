import { limitRadius, getHeight, waterLevel } from "./utils.js";

// Positionne les décors arborés en tenant compte de l'élévation et des spécificités du LOD retenu.
export function createTrees(scene, count, quality = "high") {
    if (scene._treeObjects) {
        scene._treeObjects.forEach(obj => {
            if (obj.mesh) obj.mesh.dispose();
            if (obj.collider) obj.collider.dispose();
            if (obj.agg && obj.agg.dispose) obj.agg.dispose();
            if (obj.highMesh) obj.highMesh.dispose();
            if (obj.lowMesh) obj.lowMesh.dispose();
        });
    }
    scene._treeObjects = [];
    scene._swayTrees = [];
    scene._treeCreationId = (scene._treeCreationId || 0) + 1;
    const currentCreationId = scene._treeCreationId;

    if (!scene._treeData) {
        scene._treeData = [];
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

            const randomScale = Math.random();
            const randomRotY = Math.random() * Math.PI * 2;
            
            const hx = getHeight(x + 1, z);
            const hz = getHeight(x, z + 1);
            const rotX = (hz - y) * 0.5;
            const rotZ = -(hx - y) * 0.5;
            
            const swayData = {
                phase: Math.random() * Math.PI * 2,
                speed: 0.0005 + Math.random() * 0.001,
                amount: 0.02 + Math.random() * 0.04
            };

            scene._treeData.push({ x, y, z, randomScale, randomRotY, rotX, rotZ, swayData });
        }
    }

    const trunkMat = new BABYLON.StandardMaterial("trunkMat", scene);
    trunkMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.0);
    
    const leavesMat = new BABYLON.StandardMaterial("leavesMat", scene);
    leavesMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);

    const simpleTreeModel = new BABYLON.Mesh("simpleTreeModel", scene);

    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", { height: 0.8, diameter: 0.1, tessellation: 6 }, scene);
    trunk.position.y = 0.4;
    trunk.material = trunkMat;
    trunk.parent = simpleTreeModel;
    
    const leaves = BABYLON.MeshBuilder.CreateCylinder("leaves", { height: 1.5, diameterTop: 0, diameterBottom: 1.0, tessellation: 4 }, scene);
    leaves.position.y = 0.9;
    leaves.material = leavesMat;
    leaves.parent = simpleTreeModel;

    simpleTreeModel.setEnabled(false);
    simpleTreeModel.position.y = -1000;

    if (quality === "low") {
        scene._treeData.forEach((data, i) => {
            const instance = simpleTreeModel.instantiateHierarchy();
            
            instance.setEnabled(true);
            
            const scale = 4.0 + data.randomScale * 3.0;
            instance.scaling = new BABYLON.Vector3(scale, scale, scale);

            instance.position = new BABYLON.Vector3(data.x, data.y, data.z);
            
            instance.rotation.x = data.rotX;
            instance.rotation.z = data.rotZ;
            instance.rotation.y = data.randomRotY;
            
            instance.swayData = {
                phase: data.swayData.phase,
                speed: data.swayData.speed,
                amount: data.swayData.amount,
                baseRotZ: data.rotZ
            };
            if (!scene._swayTrees) scene._swayTrees = [];
            scene._swayTrees.push(instance);
            
            const trunkCollider = BABYLON.MeshBuilder.CreateCylinder("trunkCollider" + i, { height: scale * 2.5, diameter: scale * 0.35 }, scene);
            trunkCollider.position = new BABYLON.Vector3(data.x, data.y + (scale * 1.25), data.z);
            trunkCollider.isVisible = false;
            const agg = new BABYLON.PhysicsAggregate(trunkCollider, BABYLON.PhysicsShapeType.CYLINDER, { mass: 0, friction: 0.8 }, scene);
            
            if (scene.shadowGenerator) {
                scene.shadowGenerator.addShadowCaster(instance, true);
            }

            scene._treeObjects.push({ mesh: instance, collider: trunkCollider, agg: agg, baseScale: scale });
        });
    } else {
        BABYLON.SceneLoader.ImportMesh("", "assets/modele3D/Arbre/", "Meshy_AI_arbre_0309132215_texture.glb", scene, function (meshes) {
            if (scene._treeCreationId !== currentCreationId) {
                meshes.forEach(m => m.dispose());
                return;
            }

            const treeModel = meshes[0];
            treeModel.name = "treeModel";
            
            treeModel.setEnabled(false);
            treeModel.position.y = -1000;

            scene._treeData.forEach((data, i) => {
                const instance = treeModel.instantiateHierarchy();
                
                instance.setEnabled(true);

                const scale = 4.0 + data.randomScale * 3.0;
                instance.scaling = new BABYLON.Vector3(scale, scale, scale);

                instance.position = new BABYLON.Vector3(data.x, data.y + (scale * 0.5) + 1.0, data.z);
                
                instance.rotation.x = data.rotX;
                instance.rotation.z = data.rotZ;
                instance.rotation.y = data.randomRotY;
                
                instance.swayData = {
                    phase: data.swayData.phase,
                    speed: data.swayData.speed,
                    amount: data.swayData.amount,
                    baseRotZ: data.rotZ
                };
                if (!scene._swayTrees) scene._swayTrees = [];
                scene._swayTrees.push(instance);
                
                const lowInstance = simpleTreeModel.instantiateHierarchy();
                lowInstance.scaling = new BABYLON.Vector3(scale, scale, scale);
                lowInstance.position = new BABYLON.Vector3(data.x, data.y, data.z);
                lowInstance.rotation.x = data.rotX;
                lowInstance.rotation.z = data.rotZ;
                lowInstance.rotation.y = data.randomRotY;
                lowInstance.swayData = {
                    phase: data.swayData.phase, speed: data.swayData.speed, amount: data.swayData.amount, baseRotZ: data.rotZ
                };
                scene._swayTrees.push(lowInstance);

                instance.addLODLevel(150, lowInstance);
                instance.addLODLevel(300, null);

                const trunkCollider = BABYLON.MeshBuilder.CreateCylinder("trunkCollider" + i, { height: scale * 2.5, diameter: scale * 0.35 }, scene);
                trunkCollider.position = new BABYLON.Vector3(data.x, data.y + (scale * 1.25), data.z);
                trunkCollider.isVisible = false;
                const agg = new BABYLON.PhysicsAggregate(trunkCollider, BABYLON.PhysicsShapeType.CYLINDER, { mass: 0, friction: 0.8 }, scene);

                if (scene.shadowGenerator) {
                    scene.shadowGenerator.addShadowCaster(instance, true);
                }

                scene._treeObjects.push({ highMesh: instance, lowMesh: lowInstance, collider: trunkCollider, agg: agg, baseScale: scale });
            });
        });
    }
}
