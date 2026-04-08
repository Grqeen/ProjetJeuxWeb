export function createPlayer(scene) {
    // Amélioration des collisions : on utilise une Capsule comme base au lieu d'une Box.
    // La capsule glisse beaucoup mieux sur les reliefs et les pentes du terrain.
    // On supprime également le '.scaling' qui désynchronisait le moteur physique (Havok) avec le visuel.
    const playerRoot = BABYLON.MeshBuilder.CreateCapsule("stickman", { radius: 0.35, height: 2.2 }, scene);
    playerRoot.isVisible = false; // La hitbox devient invisible

    const visualRoot = new BABYLON.TransformNode("visualRoot", scene);
    visualRoot.parent = playerRoot;
    visualRoot.rotation.y = Math.PI; // Rotation de 180 degrés pour tourner le dos à la caméra

    // --- Création du Stickman (formes basiques) ---
    const mat = new BABYLON.StandardMaterial("stickmanMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0); // Bleu clair

    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: 0.5 }, scene);
    head.position.y = 0.85;
    head.material = mat;
    head.parent = visualRoot;

    const torso = BABYLON.MeshBuilder.CreateCylinder("torso", { height: 0.9, diameterTop: 0.3, diameterBottom: 0.25 }, scene);
    torso.position.y = 0.15;
    torso.setPivotPoint(new BABYLON.Vector3(0, -0.45, 0)); // Pivot à la taille pour pouvoir se pencher
    torso.material = mat;
    torso.parent = visualRoot;

    const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", { height: 0.8, diameter: 0.12 }, scene);
    leftArm.position = new BABYLON.Vector3(-0.25, 0.2, 0);
    leftArm.setPivotPoint(new BABYLON.Vector3(0, 0.35, 0)); // Pivot à l'épaule
    leftArm.rotation.z = Math.PI / 8;
    leftArm.material = mat;
    leftArm.parent = visualRoot;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", { height: 0.8, diameter: 0.12 }, scene);
    rightArm.position = new BABYLON.Vector3(0.25, 0.2, 0);
    rightArm.setPivotPoint(new BABYLON.Vector3(0, 0.35, 0)); // Pivot à l'épaule
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.material = mat;
    rightArm.parent = visualRoot;

    const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", { height: 0.9, diameter: 0.15 }, scene);
    leftLeg.position = new BABYLON.Vector3(-0.12, -0.65, 0);
    leftLeg.setPivotPoint(new BABYLON.Vector3(0, 0.4, 0)); // Pivot à la hanche
    leftLeg.material = mat;
    leftLeg.parent = visualRoot;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", { height: 0.9, diameter: 0.15 }, scene);
    rightLeg.position = new BABYLON.Vector3(0.12, -0.65, 0);
    rightLeg.setPivotPoint(new BABYLON.Vector3(0, 0.4, 0)); // Pivot à la hanche
    rightLeg.material = mat;
    rightLeg.parent = visualRoot;

    // On expose les membres pour les animer dynamiquement dans main.js
    playerRoot.limbs = { head, torso, leftArm, rightArm, leftLeg, rightLeg };

    // Tableau vide pour éviter les plantages du main.js qui cherche des animations
    playerRoot.animationGroups = [];

    // Ombres sur le joueur
    if (scene.shadowGenerator) {
        scene.shadowGenerator.addShadowCaster(playerRoot, true);
    }

    return playerRoot;
}