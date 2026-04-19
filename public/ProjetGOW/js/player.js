// Confectionne le pantin 3D incarnant le joueur et ses membres articulés de base.
export function createPlayer(scene) {
    const playerRoot = BABYLON.MeshBuilder.CreateCapsule("stickman", { radius: 0.35, height: 2.2 }, scene);
    playerRoot.isVisible = false;

    const visualRoot = new BABYLON.TransformNode("visualRoot", scene);
    visualRoot.parent = playerRoot;
    visualRoot.rotation.y = Math.PI;

    const mat = new BABYLON.StandardMaterial("stickmanMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);

    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: 0.5 }, scene);
    head.position.y = 0.85;
    head.material = mat;
    head.parent = visualRoot;

    const torso = BABYLON.MeshBuilder.CreateCylinder("torso", { height: 0.9, diameterTop: 0.3, diameterBottom: 0.25 }, scene);
    torso.position.y = 0.15;
    torso.setPivotPoint(new BABYLON.Vector3(0, -0.45, 0));
    torso.material = mat;
    torso.parent = visualRoot;

    const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", { height: 0.8, diameter: 0.12 }, scene);
    leftArm.position = new BABYLON.Vector3(-0.25, 0.2, 0);
    leftArm.setPivotPoint(new BABYLON.Vector3(0, 0.35, 0));
    leftArm.rotation.z = Math.PI / 8;
    leftArm.material = mat;
    leftArm.parent = visualRoot;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", { height: 0.8, diameter: 0.12 }, scene);
    rightArm.position = new BABYLON.Vector3(0.25, 0.2, 0);
    rightArm.setPivotPoint(new BABYLON.Vector3(0, 0.35, 0));
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.material = mat;
    rightArm.parent = visualRoot;

    const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", { height: 0.9, diameter: 0.15 }, scene);
    leftLeg.position = new BABYLON.Vector3(-0.12, -0.65, 0);
    leftLeg.setPivotPoint(new BABYLON.Vector3(0, 0.4, 0));
    leftLeg.material = mat;
    leftLeg.parent = visualRoot;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", { height: 0.9, diameter: 0.15 }, scene);
    rightLeg.position = new BABYLON.Vector3(0.12, -0.65, 0);
    rightLeg.setPivotPoint(new BABYLON.Vector3(0, 0.4, 0));
    rightLeg.material = mat;
    rightLeg.parent = visualRoot;

    playerRoot.limbs = { head, torso, leftArm, rightArm, leftLeg, rightLeg };

    playerRoot.animationGroups = [];

    if (scene.shadowGenerator) {
        scene.shadowGenerator.addShadowCaster(playerRoot, true);
    }

    return playerRoot;
}