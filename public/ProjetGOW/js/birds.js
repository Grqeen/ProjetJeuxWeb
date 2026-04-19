import { limitRadius } from "./utils.js";

// Instancie une nuée d'oiseaux dans le ciel en s'appuyant sur des modèles virtuels optimisés.
export function createBirds(scene, count) {
    const birds = [];

    const birdMesh = BABYLON.MeshBuilder.CreatePlane("bird", {size: 1}, scene);
    birdMesh.scaling.x = 2;
    birdMesh.scaling.y = 0.5;
    birdMesh.material = new BABYLON.StandardMaterial("birdMat", scene);
    birdMesh.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    birdMesh.material.backFaceCulling = false;
    birdMesh.setEnabled(false);
    birdMesh.position.y = -1000;

    for (let i = 0; i < count; i++) {
        const bird = birdMesh.createInstance("bird" + i);
        
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

// Réajuste en permanence les trajectoires des oiseaux, y compris les réactions de dispersion au joueur.
export function updateBirds(birds, playerPosition = null) {
    birds.forEach(bird => {
        const data = bird.flightData;

        if (playerPosition) {
            const d = BABYLON.Vector3.Distance(bird.position, playerPosition);
            if (d < 20) {
                const away = bird.position.subtract(playerPosition).normalize();
                data.angle = Math.atan2(away.z, away.x);
                data.speed = 0.05 + Math.random() * 0.04;
                data.radius = Math.min(limitRadius, data.radius + 0.8);
                data.height = Math.min(80, data.height + 0.5);
            } else {
                data.speed = Math.max(0.005, data.speed * 0.98);
                data.height = Math.max(20, data.height - 0.01);
            }
        }

        data.angle += data.speed;

        bird.position.x = Math.cos(data.angle) * data.radius;
        bird.position.z = Math.sin(data.angle) * data.radius;
        bird.position.y = data.height + Math.sin(data.angle * 5 + data.offset) * 2;

        bird.lookAt(new BABYLON.Vector3(
            Math.cos(data.angle + 0.1) * data.radius,
            bird.position.y,
            Math.sin(data.angle + 0.1) * data.radius
        ));
    });
}