import { limitRadius, getHeight, waterLevel } from "./utils.js";

// Génère des ponts en bois de manière procédurale au-dessus des zones basses.
export function createBridges(scene, count) {
    const woodMat = new BABYLON.StandardMaterial("woodMat", scene);
    woodMat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1);

    let bridgesCreated = 0;
    let attempts = 0;
    const allBridgeParts = [];

    while (bridgesCreated < count && attempts < 500) {
        attempts++;

        const r = limitRadius * Math.sqrt(Math.random()) * 0.8;
        if (r < 35) continue;

        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        if (getHeight(x, z) >= waterLevel) continue;

        const angle = Math.random() * Math.PI;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);

        let startPoint = null;
        let endPoint = null;

        for (let d = 0; d < 40; d += 1) {
            const testX = x - dirX * d;
            const testZ = z - dirZ * d;
            if (getHeight(testX, testZ) >= waterLevel) {
                startPoint = new BABYLON.Vector3(testX, waterLevel + 0.5, testZ);
                break;
            }
        }

        for (let d = 0; d < 40; d += 1) {
            const testX = x + dirX * d;
            const testZ = z + dirZ * d;
            if (getHeight(testX, testZ) >= waterLevel) {
                endPoint = new BABYLON.Vector3(testX, waterLevel + 0.5, testZ);
                break;
            }
        }

        if (startPoint && endPoint) {
            const distance = BABYLON.Vector3.Distance(startPoint, endPoint);
            
            if (distance > 5 && distance < 50) {
                const midPoint = startPoint.add(endPoint).scale(0.5);
                
                const bridge = BABYLON.MeshBuilder.CreateBox("planks", {width: 2, height: 0.2, depth: distance}, scene);
                bridge.position = midPoint;
                bridge.lookAt(endPoint);
                bridge.material = woodMat;
                allBridgeParts.push(bridge);

                const p1 = BABYLON.MeshBuilder.CreateCylinder("p1", {height: 3, diameter: 0.3}, scene);
                p1.position = midPoint.add(endPoint.subtract(startPoint).normalize().scale(-distance / 2));
                p1.position.y -= 1;
                p1.material = woodMat;
                allBridgeParts.push(p1);

                const p2 = BABYLON.MeshBuilder.CreateCylinder("p2", {height: 3, diameter: 0.3}, scene);
                p2.position = midPoint.add(endPoint.subtract(startPoint).normalize().scale(distance / 2));
                p2.position.y -= 1;
                p2.material = woodMat;
                allBridgeParts.push(p2);

                bridgesCreated++;
            }
        }
    }

    if (allBridgeParts.length > 0) {
        const mergedBridges = BABYLON.Mesh.MergeMeshes(allBridgeParts, true, true, undefined, false, true);
        mergedBridges.freezeWorldMatrix();
        new BABYLON.PhysicsAggregate(mergedBridges, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.5, restitution: 0 }, scene);
    }
}