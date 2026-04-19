import { limitRadius, getHeight, waterLevel } from "./utils.js";

// Distribue les maillages architecturaux d'arrière-plan et opère leur concaténation (optimisation).
export function createBuildings(scene, count) {
    const buildingMat = new BABYLON.StandardMaterial("buildingMat", scene);
    buildingMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);

    const buildings = [];

    for (let i = 0; i < count; i++) {
        const r = limitRadius * Math.sqrt(Math.random()) * 0.8;
        if (r < 35) {
            i--;
            continue; 
        }

        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = getHeight(x, z);

        if (y < waterLevel + 0.5) continue;

        const width = 5 + Math.random() * 8;
        const depth = 5 + Math.random() * 8;
        const height = 10 + Math.random() * 25;

        const building = BABYLON.MeshBuilder.CreateBox("building" + i, {width: width, height: height, depth: depth}, scene);
        
        building.position = new BABYLON.Vector3(x, y + height / 2 - 1.5, z);
        building.material = buildingMat;
        
        buildings.push(building);
    }

    if (buildings.length > 0) {
        const mergedBuildings = BABYLON.Mesh.MergeMeshes(buildings, true, true, undefined, false, true);
        mergedBuildings.freezeWorldMatrix();
        mergedBuildings.receiveShadows = true;
        if (scene.shadowGenerator) {
            scene.shadowGenerator.addShadowCaster(mergedBuildings);
        }
        new BABYLON.PhysicsAggregate(mergedBuildings, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.5, restitution: 0 }, scene);
    }
}