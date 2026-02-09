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
            let obstacle3 = new Obstacle(900, 300, 40, 700, "yellow");
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
            this.game.fin = new fin(1100, 50, 50, 50, "green");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 2) {
            // --- NIVEAU 2 : Version simplifiée et compacte ---
            // On place le joueur au début (à gauche)
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);

            // Obstacles de type "Croix" (simplifiés comme le niveau 1)
            // Croix 1
            this.game.objetsGraphiques.push(new RotatingObstacle(320, 470, 250, 20, "black", 0.02, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(320, 470, 250, 20, "black", 0.02, Math.PI / 2));

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
            this.game.fin = new fin(1250, 850, 60, 60, "red");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 3) {
            // --- NIVEAU 3 : L'Arène Finale (Coins Nettoyés) ---
            this.game.player = new Player(50, 500);
            this.game.objetsGraphiques.push(this.game.player);

            // 1. Remplissage des coins de la map (Murs noirs solides)
            this.game.objetsGraphiques.push(new Obstacle(0, 0, 330, 280, "black"));
            this.game.objetsGraphiques.push(new Obstacle(0, 750, 330, 250, "black"));

            // 2. Murs restants de l'arène
            this.game.objetsGraphiques.push(new Obstacle(300, 0, 1000, 30, "black"));
            this.game.objetsGraphiques.push(new Obstacle(300, 970, 1000, 30, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1300, 0, 30, 1000, "black"));
            this.game.objetsGraphiques.push(new Obstacle(650, 350, 300, 300, "black"));

            // 3. Croix rotative
            this.game.objetsGraphiques.push(new RotatingObstacle(250, 500, 140, 15, "red", 0.04, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(250, 500, 140, 15, "red", 0.04, Math.PI / 2));

            // 4. BUMPERS DES MURS (Ajustés pour ne pas toucher les coins)
            // Mur Haut : on commence après le mur gauche et on finit avant le mur droite
            for (let x = 380; x < 1250; x += 50) {
                this.game.objetsGraphiques.push(new bumper(x, 30, 50, 50, "orange"));
            }
            // Mur Bas : idem
            for (let x = 380; x < 1250; x += 50) {
                this.game.objetsGraphiques.push(new bumper(x, 920, 50, 50, "orange"));
            }
            // Mur Droite : on commence après le coin haut et on finit avant le coin bas
            for (let y = 80; y < 920; y += 50) {
                this.game.objetsGraphiques.push(new bumper(1250, y, 50, 50, "orange"));
            }
            // Mur Gauche Haut
            for (let y = 80; y < 250; y += 50) {
                this.game.objetsGraphiques.push(new bumper(330, y, 50, 50, "orange"));
            }
            // Mur Gauche Bas
            for (let y = 780; y < 920; y += 50) {
                this.game.objetsGraphiques.push(new bumper(330, y, 50, 50, "orange"));
            }

            // 5. BUMPERS DU CARRÉ CENTRAL (Même logique pour éviter les chevauchements)
            for (let x = 700; x < 900; x += 50) { // Haut et Bas (raccourcis)
                this.game.objetsGraphiques.push(new bumper(x, 300, 50, 50, "orange"));
                this.game.objetsGraphiques.push(new bumper(x, 650, 50, 50, "orange"));
            }
            for (let y = 350; y < 650; y += 50) { // Gauche et Droite
                this.game.objetsGraphiques.push(new bumper(600, y, 50, 50, "orange"));
                this.game.objetsGraphiques.push(new bumper(950, y, 50, 50, "orange"));
            }

            // 6. Sortie
            this.game.fin = new fin(1150, 475, 80, 80, "red");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}