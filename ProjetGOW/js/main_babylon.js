// Attend que le DOM (la structure de la page HTML) soit entièrement chargé
window.addEventListener('DOMContentLoaded', function(){
    // Récupère l'élément <canvas> depuis le document HTML en utilisant son id
    const canvas = document.getElementById("myCanvas");

    // Crée le moteur de rendu Babylon.js
    const engine = new BABYLON.Engine(canvas, true);

    // Fonction pour créer la scène 3D
    const createScene = function () {
        // Crée un objet Scene de base
        const scene = new BABYLON.Scene(engine);

        // Crée une caméra "libre" (FreeCamera) et définit sa position dans l'espace 3D
        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // Fait en sorte que la caméra regarde vers l'origine de la scène (le point 0,0,0)
        camera.setTarget(BABYLON.Vector3.Zero());

        // Attache la caméra au canvas pour permettre les contrôles (souris pour tourner, clavier pour bouger)
        camera.attachControl(canvas, true);

        // Crée une lumière hémisphérique, qui simule la lumière ambiante du ciel
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        
        // Diminue un peu l'intensité de la lumière pour un rendu plus doux
        light.intensity = 0.7;

        // Crée une forme de "sol" intégrée.
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);

        // Créer le stickman
        const stickman = createStickman(scene);

        // Créer des monstres
        const monsters = [];
        for (let i = 0; i < 5; i++) {
            const monster = BABYLON.MeshBuilder.CreateSphere("monster" + i, {diameter: 1}, scene);
            monster.position = new BABYLON.Vector3(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
            monster.material = new BABYLON.StandardMaterial("monsterMat", scene);
            monster.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Rouge pour les monstres
            monsters.push(monster);
        }

        // Contrôles clavier pour le stickman
        const inputMap = {};
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        // Fonction pour créer le stickman
        function createStickman(scene) {
            const stickmanGroup = new BABYLON.TransformNode("stickman", scene);

            // Corps
            const body = BABYLON.MeshBuilder.CreateCylinder("body", {height: 2, diameter: 0.5}, scene);
            body.position.y = 1;
            body.parent = stickmanGroup;

            // Tête
            const head = BABYLON.MeshBuilder.CreateSphere("head", {diameter: 0.8}, scene);
            head.position.y = 2.5;
            head.parent = stickmanGroup;

            // Bras gauche
            const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", {height: 1.5, diameter: 0.3}, scene);
            leftArm.position = new BABYLON.Vector3(-0.4, 1.5, 0);
            leftArm.rotation.z = Math.PI / 4;
            leftArm.parent = stickmanGroup;

            // Bras droit avec épée
            const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", {height: 1.5, diameter: 0.3}, scene);
            rightArm.position = new BABYLON.Vector3(0.4, 1.5, 0);
            rightArm.rotation.z = -Math.PI / 4;
            rightArm.parent = stickmanGroup;

            // Épée
            const sword = BABYLON.MeshBuilder.CreateBox("sword", {width: 0.1, height: 2, depth: 0.1}, scene);
            sword.position = new BABYLON.Vector3(0.8, 1.5, 0);
            sword.rotation.z = -Math.PI / 4;
            sword.parent = stickmanGroup;
            sword.material = new BABYLON.StandardMaterial("swordMat", scene);
            sword.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gris pour l'épée

            // Jambes
            const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", {height: 2, diameter: 0.4}, scene);
            leftLeg.position = new BABYLON.Vector3(-0.2, -1, 0);
            leftLeg.parent = stickmanGroup;

            const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", {height: 2, diameter: 0.4}, scene);
            rightLeg.position = new BABYLON.Vector3(0.2, -1, 0);
            rightLeg.parent = stickmanGroup;

            return stickmanGroup;
        }

        // Retourne la scène et les objets pour la boucle de rendu
        return { scene, stickman, monsters, inputMap };
    };

    // Appelle la fonction de création de scène pour obtenir notre scène et objets
    const { scene, stickman, monsters, inputMap } = createScene();

    // Démarre la boucle de rendu : le moteur va dessiner la scène en continu (environ 60 fois par seconde)
    engine.runRenderLoop(function () {
        // Mouvement du stickman
        const speed = 0.1;
        if (inputMap["w"] || inputMap["W"]) {
            stickman.position.z += speed;
        }
        if (inputMap["s"] || inputMap["S"]) {
            stickman.position.z -= speed;
        }
        if (inputMap["a"] || inputMap["A"]) {
            stickman.position.x -= speed;
        }
        if (inputMap["d"] || inputMap["D"]) {
            stickman.position.x += speed;
        }

        // Mouvement des monstres vers le stickman
        monsters.forEach(monster => {
            const direction = stickman.position.subtract(monster.position).normalize();
            monster.position.addInPlace(direction.scale(0.05));
        });

        scene.render();
    });

    // S'assure que la scène est redimensionnée correctement si la fenêtre du navigateur change de taille
    window.addEventListener("resize", function () {
        engine.resize();
    });
});
