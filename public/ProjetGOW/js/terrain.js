import { mapSize, getHeight } from "./utils.js";

export function createTerrain(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: mapSize, 
        height: mapSize, 
        subdivisions: 120, // Optimisé : Réduit massivement le lag physique (Havok)
        updatable: true
    }, scene);
    
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    // 1. Appliquer les hauteurs de la carte
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        positions[i + 1] = getHeight(x, z);
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    
    // 2. Calculer les normales (indispensable pour analyser la pente du relief)
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, ground.getIndices(), normals);
    ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

    // 3. Couleurs enrichies par la hauteur, la pente et un léger bruit (profondeur/texture organique)
    const colors = [];
    for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        const ny = normals[i + 1]; // Facteur de pente (1 = plat, < 0.8 = raide)
        
        // Bruit léger pour texturer et donner un rendu plus organique
        const noise = (Math.random() * 0.08) - 0.04;

        if (ny < 0.78 && y > 2) {
            const c = 0.35 + noise;
            colors.push(c, c * 0.9, c * 0.8, 1); // Falaises rocheuses abruptes (marron/gris)
        } else if (y < 1.0) {
            colors.push(0.76 + noise, 0.7 + noise, 0.5 + noise, 1); // Sable près de l'eau
        } else if (y < 12) {
            colors.push(0.15 + noise, 0.65 + noise, 0.15 + noise, 1); // Plaine verdoyante riche
        } else if (y < 45) {
            colors.push(0.35 + noise, 0.55 + noise, 0.2 + noise, 1); // Herbe sèche des collines
        } else if (y < 85) {
            const c = 0.4 + noise;
            colors.push(c, c, c, 1); // Montagnes rocheuses
        } else {
            const c = 0.95 + noise;
            colors.push(c, c, c + 0.05, 1); // Sommets enneigés
        }
    }
    ground.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

    ground.refreshBoundingInfo();

    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Reflet léger pour accentuer le relief
    groundMat.useVertexColors = true;
    ground.material = groundMat;
    ground.receiveShadows = true; // Le sol reçoit les ombres
    ground.checkCollisions = true; // Le sol repousse la caméra
    ground.freezeWorldMatrix();

    new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.8, restitution: 0 }, scene); // Plus de friction

    return ground;
}