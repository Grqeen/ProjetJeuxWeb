export function createSewer(scene) {
    const sewerGroup = new BABYLON.TransformNode("sewer", scene);

    // 0. Dalle de béton autour du trou (Anneau plat)
    // On utilise un Torus aplati pour faire un disque avec un trou
    const slab = BABYLON.MeshBuilder.CreateTorus("slab", {diameter: 3.7, thickness: 2.3, tessellation: 50}, scene);
    slab.scaling.y = 0.05; // Aplatir pour faire une dalle
    slab.position.y = 0.02; // Juste au-dessus du sol théorique
    slab.material = new BABYLON.StandardMaterial("slabMat", scene);
    slab.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Gris béton
    slab.parent = sewerGroup;
    slab.checkCollisions = true; // Solide

    // 0.5. Le tuyau noir (Parois de l'égout)
    // sideOrientation: DOUBLESIDE permet de voir l'intérieur du tuyau
    const pipe = BABYLON.MeshBuilder.CreateCylinder("pipe", {diameter: 1.35, height: 6, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    pipe.position.y = -3;
    pipe.material = new BABYLON.StandardMaterial("pipeMat", scene);
    pipe.material.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Noir presque total
    pipe.parent = sewerGroup;

    // 1. Le rebord en béton (Torus)
    const rim = BABYLON.MeshBuilder.CreateTorus("rim", {diameter: 1.6, thickness: 0.3, tessellation: 30}, scene);
    rim.position.y = 0.1;
    rim.material = new BABYLON.StandardMaterial("rimMat", scene);
    rim.material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Gris béton
    rim.parent = sewerGroup;

    // 2. La plaque d'égout (Cylindre aplati)
    const cover = BABYLON.MeshBuilder.CreateCylinder("cover", {diameter: 1.4, height: 0.1}, scene);
    cover.position.y = 0.25;
    cover.material = new BABYLON.StandardMaterial("coverMat", scene);
    cover.material.diffuseColor = new BABYLON.Color3(0.25, 0.2, 0.15); // Métal rouillé
    cover.parent = sewerGroup;
    cover.checkCollisions = true; // Solide une fois fermé

    // 4. L'échelle (simple représentation visuelle qui sort du sol)
    const ladderLeft = BABYLON.MeshBuilder.CreateCylinder("ladderL", {height: 3, diameter: 0.1}, scene);
    ladderLeft.position = new BABYLON.Vector3(-0.4, -1.5, -0.4);
    ladderLeft.parent = sewerGroup;
    
    const ladderRight = BABYLON.MeshBuilder.CreateCylinder("ladderR", {height: 3, diameter: 0.1}, scene);
    ladderRight.position = new BABYLON.Vector3(0.4, -1.5, -0.4);
    ladderRight.parent = sewerGroup;

    // Barreaux de l'échelle
    for(let i=0; i<5; i++) {
        const rung = BABYLON.MeshBuilder.CreateCylinder("rung"+i, {height: 0.8, diameter: 0.08}, scene);
        rung.rotation.z = Math.PI / 2;
        rung.position = new BABYLON.Vector3(0, -0.5 - (i*0.5), -0.4);
        rung.parent = sewerGroup;
    }

    return { sewerGroup, cover };
}