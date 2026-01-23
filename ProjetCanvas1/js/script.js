import Game from "./Game.js";

// Bonne pratique : avoir une fonction appelée une fois
// que la page est prête, que le DOM est chargé, etc.
window.onload = init;

async function init() {
   // On recupère le canvas
   let canvas = document.querySelector("#myCanvas");

   // On gère le redimensionnement pour que le canvas prenne tout l'écran
   function resizeCanvas() {
       let sidebarWidth = 450; // Largeur du petit canvas à droite

       canvas.width = window.innerWidth - sidebarWidth;
       canvas.height = window.innerHeight;
   }
   // Appel initial
   resizeCanvas();
   // Appel quand la fenêtre change de taille
   window.addEventListener('resize', resizeCanvas);

   // On récupère l'élément HTML du score
   let scoreElement = document.querySelector("#score");
   // On récupère l'élément input de vitesse
   let speedInputElement = document.querySelector("#playerSpeedRange");

   // On cree une instance du jeu
    let game = new Game(canvas, scoreElement, speedInputElement);
    // ici on utilise await car la méthode init est asynchrone
    // typiquement dans init on charge des images, des sons, etc.
    await game.init();

    // on peut démarrer le jeu
    game.start();
}
