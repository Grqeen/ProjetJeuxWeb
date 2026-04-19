import { mapSize, getHeight } from "./utils.js";

// Modifie la géométrie d'un plan fondamental pour bâtir les reliefs et teintes de la zone explorable.
export function createTerrain(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: mapSize, 
        height: mapSize, 
        subdivisions: 120,
        updatable: true
    }, scene);
    
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        positions[i + 1] = getHeight(x, z);
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, ground.getIndices(), normals);
    ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

    const colors = [];
    for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        const ny = normals[i + 1];
        
        const noise = (Math.random() * 0.08) - 0.04;

        if (ny < 0.78 && y > 2) {
            const c = 0.35 + noise;
            colors.push(c, c * 0.9, c * 0.8, 1);
        } else if (y < 1.0) {
            colors.push(0.76 + noise, 0.7 + noise, 0.5 + noise, 1);
        } else if (y < 12) {
            colors.push(0.15 + noise, 0.65 + noise, 0.15 + noise, 1);
        } else if (y < 45) {
            colors.push(0.35 + noise, 0.55 + noise, 0.2 + noise, 1);
        } else if (y < 85) {
            const c = 0.4 + noise;
            colors.push(c, c, c, 1);
        } else {
            const c = 0.95 + noise;
            colors.push(c, c, c + 0.05, 1);
        }
    }
    ground.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

    ground.refreshBoundingInfo();

    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    groundMat.useVertexColors = true;
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.checkCollisions = true;
    ground.freezeWorldMatrix();

    new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.8, restitution: 0 }, scene);

    return ground;
}