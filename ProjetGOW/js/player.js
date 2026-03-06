export function createPlayer(scene) {
    // Remplacer TransformNode par un Mesh invisible qui servira de "hitbox" racine.
    const playerRoot = BABYLON.MeshBuilder.CreateBox("stickman", {size: 0.5, height: 2}, scene);
    playerRoot.isVisible = false; // La boîte de collision est invisible

    // Corps
    const body = BABYLON.MeshBuilder.CreateCylinder("body", {height: 2, diameter: 0.5}, scene);
    body.position.y = 3; // Remonté pour aligner les pieds à 0
    body.parent = playerRoot;

    // Tête
    const head = BABYLON.MeshBuilder.CreateSphere("head", {diameter: 0.8}, scene);
    head.position.y = 4.5;
    head.parent = playerRoot;

    // Bras gauche
    const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", {height: 1.5, diameter: 0.3}, scene);
    leftArm.position = new BABYLON.Vector3(-0.4, 3.5, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.parent = playerRoot;

    // Bras droit avec épée
    const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", {height: 1.5, diameter: 0.3}, scene);
    rightArm.position = new BABYLON.Vector3(0.4, 3.5, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.parent = playerRoot;

    // Épée
    const sword = BABYLON.MeshBuilder.CreateBox("sword", {width: 0.1, height: 2, depth: 0.1}, scene);
    sword.position = new BABYLON.Vector3(0.8, 3.5, 0);
    sword.rotation.z = -Math.PI / 4;
    sword.parent = playerRoot;
    sword.material = new BABYLON.StandardMaterial("swordMat", scene);
    sword.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gris pour l'épée

    // Jambes
    const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", {height: 2, diameter: 0.4}, scene);
    leftLeg.position = new BABYLON.Vector3(-0.2, 1, 0); // Pieds à 0 (Centre à 1)
    leftLeg.parent = playerRoot;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", {height: 2, diameter: 0.4}, scene);
    rightLeg.position = new BABYLON.Vector3(0.2, 1, 0);
    rightLeg.parent = playerRoot;

    // Redimensionner le personnage (plus petit, 60% de la taille originale)
    playerRoot.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6);

    return playerRoot;
}