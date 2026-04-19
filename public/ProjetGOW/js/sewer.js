// Crée la structure 3D des égouts et son couvercle dans la scène.
export function createSewer(scene) {
    const sewerGroup = new BABYLON.TransformNode("sewer", scene);

    const groundHeight = 0.5;

    const slab = BABYLON.MeshBuilder.CreateTorus("slab", {diameter: 3.7, thickness: 2.3, tessellation: 50}, scene);
    slab.scaling.y = 0.05;
    slab.position.y = groundHeight + 0.02;
    slab.material = new BABYLON.StandardMaterial("slabMat", scene);
    slab.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    slab.parent = sewerGroup;
    
    new BABYLON.PhysicsAggregate(slab, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.5 }, scene);

    const pipe = BABYLON.MeshBuilder.CreateCylinder("pipe", {diameter: 1.35, height: 6, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    pipe.position.y = -2.5;
    pipe.material = new BABYLON.StandardMaterial("pipeMat", scene);
    pipe.material.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    pipe.parent = sewerGroup;

    const rim = BABYLON.MeshBuilder.CreateTorus("rim", {diameter: 1.6, thickness: 0.3, tessellation: 30}, scene);
    rim.position.y = groundHeight + 0.1;
    rim.material = new BABYLON.StandardMaterial("rimMat", scene);
    rim.material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    rim.parent = sewerGroup;

    const cover = BABYLON.MeshBuilder.CreateCylinder("cover", {diameter: 1.4, height: 0.1}, scene);
    cover.position.y = groundHeight + 0.25;
    cover.material = new BABYLON.StandardMaterial("coverMat", scene);
    cover.material.diffuseColor = new BABYLON.Color3(0.25, 0.2, 0.15);
    cover.parent = sewerGroup;

    const coverAgg = new BABYLON.PhysicsAggregate(cover, BABYLON.PhysicsShapeType.CYLINDER, { mass: 0 }, scene);
    coverAgg.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);

    const ladderLeft = BABYLON.MeshBuilder.CreateCylinder("ladderL", {height: 3, diameter: 0.1}, scene);
    ladderLeft.position = new BABYLON.Vector3(-0.4, -1.5, -0.4);
    ladderLeft.parent = sewerGroup;
    
    const ladderRight = BABYLON.MeshBuilder.CreateCylinder("ladderR", {height: 3, diameter: 0.1}, scene);
    ladderRight.position = new BABYLON.Vector3(0.4, -1.5, -0.4);
    ladderRight.parent = sewerGroup;

    for(let i=0; i<5; i++) {
        const rung = BABYLON.MeshBuilder.CreateCylinder("rung"+i, {height: 0.8, diameter: 0.08}, scene);
        rung.rotation.z = Math.PI / 2;
        rung.position = new BABYLON.Vector3(0, -0.5 - (i*0.5), -0.4);
        rung.parent = sewerGroup;
    }

    return { sewerGroup, cover };
}