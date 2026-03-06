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

        // Crée une forme de "sphère" intégrée. C'est notre premier objet 3D.
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

        // Déplace la sphère vers le haut pour qu'elle repose sur le sol
        sphere.position.y = 1;

        // Crée une forme de "sol" intégrée.
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);

        // Retourne la scène qui vient d'être créée
        return scene;
    };

    // Appelle la fonction de création de scène pour obtenir notre scène
    const scene = createScene();

    // Démarre la boucle de rendu : le moteur va dessiner la scène en continu (environ 60 fois par seconde)
    engine.runRenderLoop(function () {
        scene.render();
    });

    // S'assure que la scène est redimensionnée correctement si la fenêtre du navigateur change de taille
    window.addEventListener("resize", function () {
        engine.resize();
    });
});
