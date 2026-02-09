import Player from "./Player.js";
import Obstacle, { RotatingObstacle } from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";

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

            // Potion de vitesse
            this.speedPotion1 = new speedPotion(250, 100, 25, 25, "cyan", 5, 3000);
            this.game.objetsGraphiques.push(this.speedPotion1);


            // Sortie
            this.game.fin = new fin(1100, 50, 100, 100, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 2) {
            // --- NIVEAU 2 : Version simplifiée et compacte ---
            // On place le joueur au début (à gauche)
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);

            // Obstacles de type "Croix" (simplifiés comme le niveau 1)
            // Croix 1
            this.game.objetsGraphiques.push(new RotatingObstacle(400, 300, 250, 20, "black", 0.02, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(400, 300, 250, 20, "black", 0.02, Math.PI / 2));

            // Croix 2
            this.game.objetsGraphiques.push(new RotatingObstacle(800, 600, 250, 20, "black", -0.02, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(800, 600, 250, 20, "black", -0.02, Math.PI / 2));

            // Mur central (Le "U" simplifié)
            this.game.objetsGraphiques.push(new Obstacle(550, 0, 30, 400, "black")); // Mur haut
            this.game.objetsGraphiques.push(new Obstacle(550, 600, 30, 400, "black")); // Mur bas

            // Obstacle de fin (Mur de protection avant la sortie)
            let wallRightX = 1100;
            this.game.objetsGraphiques.push(new Obstacle(wallRightX, 400, 30, 600, "black"));
            this.game.objetsGraphiques.push(new Obstacle(900, 920, 230, 35, "black"));

            // Sortie (Cercle rouge) - Placée à 1250 pour être visible sur tous les écrans
            this.game.fin = new fin(1250, 850, 100, 100, "red", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}