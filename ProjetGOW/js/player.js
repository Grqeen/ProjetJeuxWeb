export function createPlayer(scene) {
    const playerRoot = BABYLON.MeshBuilder.CreateBox("stickman", {size: 0.5, height: 2}, scene);
    playerRoot.isVisible = false;

    BABYLON.SceneLoader.ImportMesh("", "assets/modele3D/blob/", "Meshy_AI_Meshy_Merged_Animations.glb", scene, function (meshes, particleSystems, skeletons, animationGroups) {
        const visualRoot = new BABYLON.TransformNode("visualRoot", scene);
        visualRoot.parent = playerRoot;
        visualRoot.rotation.y = 0;

        const character = meshes[0];
        character.parent = visualRoot;
        character.position.y = -1;
        
        playerRoot.animationGroups = animationGroups;
        
        playerRoot.animationGroups.forEach(ag => ag.stop());
        
        const idleAnim = playerRoot.animationGroups.find(ag => ag.name.toLowerCase().includes("idle"));
        if (idleAnim) idleAnim.start(true);
    });

    playerRoot.scaling = new BABYLON.Vector3(1.6, 1.6, 1.6);

    return playerRoot;
}