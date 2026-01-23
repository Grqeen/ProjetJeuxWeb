import Game from "./Game.js";

// Bonne pratique : avoir une fonction appelée une fois
// que la page est prête, que le DOM est chargé, etc.
window.onload = init;

async function init() {
   // On recupère le canvas
   let canvas = document.querySelector("#myCanvas");
   let miniCanvas = document.querySelector("#miniCanvas");

   // On gère le redimensionnement pour que le canvas prenne tout l'écran
   function resizeCanvas() {
       let sidebarWidth = 450; // Largeur du petit canvas à droite

       canvas.width = window.innerWidth - sidebarWidth;
       canvas.height = window.innerHeight;

       miniCanvas.width = sidebarWidth;
       miniCanvas.height = window.innerHeight;
   }
   // Appel initial
   resizeCanvas();
   // Appel quand la fenêtre change de taille
   window.addEventListener('resize', resizeCanvas);

   // On cree une instance du jeu
    let game = new Game(canvas);
    // ici on utilise await car la méthode init est asynchrone
    // typiquement dans init on charge des images, des sons, etc.
    await game.init();

    // on peut démarrer le jeu
    game.start();
}
