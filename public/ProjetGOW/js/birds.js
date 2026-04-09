import { limitRadius } from "./utils.js";

export function createBirds(scene, count) {
    const birds = [];

    // Modèle simple d'oiseau (forme de V)
    const birdMesh = BABYLON.MeshBuilder.CreatePlane("bird", {size: 1}, scene);
    birdMesh.scaling.x = 2; // Plus large
    birdMesh.scaling.y = 0.5;
    birdMesh.material = new BABYLON.StandardMaterial("birdMat", scene);
    birdMesh.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Noir
    birdMesh.material.backFaceCulling = false;
    birdMesh.setEnabled(false);
    birdMesh.position.y = -1000;

    for (let i = 0; i < count; i++) {
        const bird = birdMesh.createInstance("bird" + i);
        
        // Propriétés de vol personnalisées stockées sur l'objet
        bird.flightData = {
            angle: Math.random() * Math.PI * 2,
            radius: 50 + Math.random() * (limitRadius - 50),
            speed: 0.005 + Math.random() * 0.01,
            height: 20 + Math.random() * 30,
            offset: Math.random() * 10
        };

        bird.position.y = bird.flightData.height;
        birds.push(bird);
    }

    return birds;
}

export function updateBirds(birds) {
    birds.forEach(bird => {
        const data = bird.flightData;
        data.angle += data.speed;

        // Mouvement circulaire avec une petite oscillation verticale
        bird.position.x = Math.cos(data.angle) * data.radius;
        bird.position.z = Math.sin(data.angle) * data.radius;
        bird.position.y = data.height + Math.sin(data.angle * 5 + data.offset) * 2;

        // L'oiseau regarde vers l'avant (tangente au cercle)
        bird.lookAt(new BABYLON.Vector3(
            Math.cos(data.angle + 0.1) * data.radius,
            bird.position.y,
            Math.sin(data.angle + 0.1) * data.radius
        ));
    });
}