import Player from "./Player.js";
import Obstacle, { RotatingObstacle } from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";

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

            // Potion de taille
            this.sizePotion1 = new sizePotion(250, 200, 25, 25, "magenta", -40, 50);
            this.game.objetsGraphiques.push(this.sizePotion1);


            // Sortie
            this.game.fin = new fin(1100, 50, 50, 50, "green");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 2) {
            // --- NIVEAU 2 : DESIGN EXACT + AJUSTEMENTS ---
            this.game.player = new Player(350, 50);
            this.game.objetsGraphiques.push(this.game.player);

            const addRotatingCross = (x, y, size, speed) => {
                this.game.objetsGraphiques.push(new RotatingObstacle(x, y, size, 20, "black", speed, 0));
                this.game.objetsGraphiques.push(new RotatingObstacle(x, y, size, 20, "black", speed, Math.PI / 2));
            };

            // 1. Les deux premières croix : descendues et agrandies (Size 300)
            // Elles bloquent presque tout l'écran, forçant le passage au centre
            addRotatingCross(180, 300, 250, 0.02); 
            addRotatingCross(450, 300, 250, -0.02);

            // 2. La structure en "U" au centre
            let uX = 650;
            let uY = 0;
            let uW = 300;
            let uH = 450;
            let thick = 30;
            this.game.objetsGraphiques.push(new Obstacle(uX, uY, thick, uH, "black")); // Gauche
            this.game.objetsGraphiques.push(new Obstacle(uX + uW - thick, uY, thick, uH, "black")); // Droite
            this.game.objetsGraphiques.push(new Obstacle(uX, uY + uH - thick, uW, thick, "black")); // Fond du U

            // 3. La croix du milieu agrandie (Size 300)
            addRotatingCross(uX + uW/2, 700, 400, -0.015);

            // 4. La dernière croix agrandie pour bloquer l'espace (Size 400)
            // Placée pour qu'elle frôle le mur du U et le bord de l'écran
            addRotatingCross(1100, 250, 290, -0.01);

            // 5. Mur vertical de droite
            let wallRightX = 1250;
            let wallRightY = 400;
            let wallRightH = 550;
            this.game.objetsGraphiques.push(new Obstacle(wallRightX, wallRightY, 35, wallRightH, "black"));

            // 6. Barre horizontale du bas reliée au mur vertical (Y ajusté à 950)
            let wallBottomX = 700;
            let wallBottomY = 920; 
            let wallBottomW = wallRightX - wallBottomX + 35; // Calcule la largeur pour toucher le mur de droite
            this.game.objetsGraphiques.push(new Obstacle(wallBottomX, wallBottomY, wallBottomW, 35, "black"));

            // 7. La petite barre "pied" qui relie la barre du bas à la terre (le bas du canvas)
            this.game.objetsGraphiques.push(new Obstacle(wallBottomX, wallBottomY + 35, 35, 200, "black"));

            // 8. La sortie (Cercle rouge)
            this.game.fin = new fin(wallRightX + 100, wallBottomY - 70, 60, 60, "red");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}