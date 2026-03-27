import { mapSize, getHeight } from "./utils.js";

export function createTerrain(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: mapSize, 
        height: mapSize, 
        subdivisions: 200,
        updatable: true
    }, scene);
    
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const colors = [];

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const y = getHeight(x, z);
        positions[i + 1] = y;

        if (y < 10) {
            colors.push(0.1, 0.6, 0.1, 1);
        } else if (y < 80) {
            colors.push(0.35, 0.3, 0.3, 1);
        } else {
            colors.push(0.95, 0.95, 1, 1);
        }
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    ground.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, ground.getIndices(), normals);
    ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

    ground.refreshBoundingInfo();

    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
    groundMat.useVertexColors = true;
    ground.material = groundMat;
    ground.freezeWorldMatrix();

    new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.5, restitution: 0 }, scene);

    return ground;
}