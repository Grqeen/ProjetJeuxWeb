import Player from "./Player.js";
import Obstacle from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";

export default class Levels {
    constructor(game) {
        this.game = game;
    }

    load(levelNumber) {
        // On vide le tableau d'objets graphiques avant de charger le niveau
        this.game.objetsGraphiques = [];

        if (levelNumber === 1) {
            // --- NIVEAU 1 ---
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);

            // Obstacles
            let obstacle1 = new Obstacle(300, 0, 40, 600, "red");
            this.game.objetsGraphiques.push(obstacle1);
            let obstacle3 = new Obstacle(900, 300, 40, 600, "yellow");
            this.game.objetsGraphiques.push(obstacle3);

            // Carrés
            let obstacle2 = new Obstacle(500, 500, 100, 100, "blue");
            this.game.objetsGraphiques.push(obstacle2);
            let obstacle4 = new Obstacle(750, 500, 100, 100, "purple");
            this.game.objetsGraphiques.push(obstacle4);

            // Bumper
            this.game.bumper1 = new bumper(550, 340, 50, 50, "orange");
            this.game.objetsGraphiques.push(this.game.bumper1);

            // Sortie
            this.game.fin = new fin(1100, 50, 50, 50, "green");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 2) {
            // --- NIVEAU 2 ---
            this.game.player = new Player(50, 50);
            this.game.objetsGraphiques.push(this.game.player);

            // Exemple d'obstacles pour le niveau 2
            this.game.objetsGraphiques.push(new Obstacle(200, 100, 50, 400, "brown"));
            this.game.objetsGraphiques.push(new Obstacle(500, 300, 300, 50, "black"));
            
            // Sortie
            this.game.fin = new fin(800, 500, 50, 50, "red");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}