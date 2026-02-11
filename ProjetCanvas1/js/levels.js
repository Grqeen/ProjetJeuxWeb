import Player from "./Player.js";
import Obstacle, { RotatingObstacle, IntermittentRotatingObstacle, MovingObstacle } from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import fadingDoor from "./fadingDoor.js";
import keypad from "./keypad.js";

export default class Levels {
    constructor(game) {
        this.game = game;
    }

    load(levelNumber) {
        // On vide le tableau d'objets graphiques avant de charger le niveau
        this.game.objetsGraphiques = [];
        
        // Réinitialisation de la vitesse par défaut pour tous les niveaux
        this.game.playerSpeed = 5;

        if (levelNumber === 1) {
            // --- NIVEAU 1 ---
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);

            // Obstacles
            let obstacle1 = new Obstacle(300, 0, 40, 600, "red");
            this.game.objetsGraphiques.push(obstacle1);
            let obstacle3 = new Obstacle(900, 300, 40, 700, "yellow");
            this.game.objetsGraphiques.push(obstacle3);

            //fadding door + keypad
            let fadingDoor1 = new fadingDoor(700, 0, 40, 600, "Pink", 3000, 1);
            this.game.objetsGraphiques.push(fadingDoor1);
            let fadingDoor2 = new fadingDoor(900, 0, 40, 600, "Pink", 3000, 2);
            this.game.objetsGraphiques.push(fadingDoor2);
            this.game.keypad1 = new keypad(250, 200, 25, 25, "pink", 3000, 1);
            this.game.objetsGraphiques.push(this.game.keypad1);
            this.game.keypad2 = new keypad(350, 400, 25, 25, "pink", 3000, 2);
            this.game.objetsGraphiques.push(this.game.keypad2);

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
            this.sizePotion1 = new sizePotion(650, 50, 25, 25, "magenta", -40, 50);
            this.game.objetsGraphiques.push(this.sizePotion1);


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
            this.game.fin = new fin(1250, 850, 100, 100, "red", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 3) {
            // --- NIVEAU 3 : L'Arène Finale (Coins Nettoyés) ---
            this.game.player = new Player(50, 500);
            this.game.objetsGraphiques.push(this.game.player);

            // 1. Remplissage des coins de la map (Murs noirs solides)
            this.game.objetsGraphiques.push(new Obstacle(0, 0, 330, 280, "black"));
            this.game.objetsGraphiques.push(new Obstacle(0, 750, 330, 250, "black"));

            // 2. Murs restants de l'arène
            this.game.objetsGraphiques.push(new Obstacle(300, 0, 1100, 30, "black"));
            this.game.objetsGraphiques.push(new Obstacle(300, 970, 1100, 30, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1300, 0, 100, 1000, "black"));
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
            for (let y = 80; y < 230; y += 50) {
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
        } else if (levelNumber === 4) {
            // --- NIVEAU 4 : Le Slalom (Vitesse et Précision) ---
            this.game.player = new Player(50, 50);
            this.game.objetsGraphiques.push(this.game.player);

            // Déplacement de la potion au niveau du premier virage (cercle rouge)
            this.game.objetsGraphiques.push(new speedPotion(430, 700, 30, 30, "cyan", 6, 5000));

            // Murs en zigzag
            for (let i = 0; i < 4; i++) {
                let x = 300 + (i * 250);
                let y = (i % 2 === 0) ? 0 : 400;
                this.game.objetsGraphiques.push(new Obstacle(x, y, 50, 600, "white"));

                let dir = (i % 2 === 0) ? "down" : "up";
                let bumperY = (i % 2 === 0) ? 600 : 350;
                this.game.objetsGraphiques.push(new bumper(x + 5, bumperY, 40, 50, "orange", dir));
            }

            this.game.fin = new fin(1300, 800, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);

        } else if (levelNumber === 5) {
            // --- NIVEAU 5 : L'Horlogerie (Version Expert avec Mur et Téléportation) ---
            // Le joueur commence en haut à gauche, au-dessus du mur
            this.game.player = new Player(150, 150);
            this.game.objetsGraphiques.push(this.game.player);

            // 1. LE MUR PLEIN (Milieu à gauche)
            // Ce mur oblige le joueur à contourner par la droite
            this.game.objetsGraphiques.push(new Obstacle(0, 400, 400, 40, "red"));
            this.game.objetsGraphiques.push(new Obstacle(1100, 400, 300, 40, "red"));

            // 2. BUMPERS (Plafond et Sol)
            for (let x = 0; x < 1400; x += 60) {
                this.game.objetsGraphiques.push(new bumper(x, 0, 60, 60, "orange"));
                this.game.objetsGraphiques.push(new bumper(x, 940, 60, 60, "orange"));
            }

            // 3. CROIX ROTATIVES (Difficulté accrue)
            const centers = [600, 900];
            centers.forEach((cx, i) => {
                this.game.objetsGraphiques.push(new RotatingObstacle(cx, 500, 300, 20, "purple", 0.04, 0));
                this.game.objetsGraphiques.push(new RotatingObstacle(cx, 500, 300, 20, "purple", 0.04, Math.PI / 2));
            });

            // 4. LE PORTAIL DE FIN (Position initiale en haut à droite)
            this.game.finPortal = new fin(1300, 200, 100, 100, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.finPortal);

            // Initialisation des variables de contrôle pour le mouvement du portail
            this.game.portalStage = 0;

        } else if (levelNumber === 6) {
            // --- NIVEAU 6 : Le Labyrinthe du Petit Blob (Ajusté) ---
            // 1. POSITION DU JOUEUR (Ajustée pour ne pas être dans le mur ni sur le buff)
            // On place le joueur à y=500 pour être exactement dans le couloir de sortie
            this.game.player = new Player(80, 500);
            this.game.objetsGraphiques.push(this.game.player);

            // Murs de la chambre de départ (y=0 à 400 et y=600 à 1000)
            this.game.objetsGraphiques.push(new Obstacle(0, 0, 300, 400, "gray"));
            this.game.objetsGraphiques.push(new Obstacle(0, 600, 300, 400, "gray"));

            // Potion Magenta décalée à droite pour ne pas spawn dessus (x=220)
            this.game.objetsGraphiques.push(new sizePotion(220, 480, 40, 40, "magenta", -70, -70));

            // 2. LES PILIERS ET LES PETITS CARRÉS
            // Premier mur (Pilier gauche)
            this.game.objetsGraphiques.push(new Obstacle(400, 0, 50, 920, "gray"));

            // Ajout de petits carrés entre le pilier 1 et 2 pour ralentir le joueur
            for (let i = 0; i < 5; i++) {
                this.game.objetsGraphiques.push(new Obstacle(500, 100 + (i * 150), 30, 30, "gray"));
                this.game.objetsGraphiques.push(new Obstacle(600, 50 + (i * 150), 30, 30, "gray"));
            }

            // Deuxième mur (Pilier milieu)
            this.game.objetsGraphiques.push(new Obstacle(700, 80, 50, 920, "gray"));

            // Ajout de petits carrés entre le pilier 2 et 3
            for (let i = 0; i < 4; i++) {
                this.game.objetsGraphiques.push(new Obstacle(850, 150 + (i * 180), 35, 35, "gray"));
            }

            // Troisième mur (Pilier droit)
            this.game.objetsGraphiques.push(new Obstacle(1000, 0, 50, 450, "gray"));
            this.game.objetsGraphiques.push(new Obstacle(1000, 550, 50, 450, "gray"));

            // 3. OBSTACLE ROTATIF (Décalé à x=1150 pour ne pas toucher les piliers à x=1000)
            this.game.objetsGraphiques.push(new RotatingObstacle(1150, 500, 180, 15, "purple", 0.08));

            // Potions de malus (Redevenir grand) cachées parmi les petits carrés
            this.game.objetsGraphiques.push(new sizePotion(550, 850, 35, 35, "red", 70, 70));
            this.game.objetsGraphiques.push(new sizePotion(850, 20, 35, 35, "red", 70, 70));

            // 4. LA SORTIE
            this.game.fin = new fin(1300, 500, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);

        } else if (levelNumber === 7) {
            // --- NIVEAU 7 : Le Labyrinthe de Mémoire Aléatoire ---

            // 1. JOUEUR : Spawn en haut au milieu et taille réduite
            this.game.player = new Player(700, 50);
            this.game.player.w = 40; // Joueur plus petit
            this.game.player.h = 40;
            this.game.objetsGraphiques.push(this.game.player);

            const colors = ["pink", "cyan", "yellow", "orange", "purple"];
            const rowY = [250, 450, 650, 850];
            const doorWidth = 280; // Largeur pour 5 portes sur 1400px

            // 2. GÉNÉRATION DES ÉTAGES
            rowY.forEach((y, rowIndex) => {
                // Création d'un tableau d'indices mélangés pour l'aléatoire
                // Cela définit quelle porte (0-4) chaque bouton (0-4) va ouvrir
                let mapping = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);

                for (let i = 0; i < 5; i++) {
                    // On crée la PORTE à l'index i
                    let doorId = (rowIndex * 10) + i;
                    this.game.objetsGraphiques.push(new fadingDoor(
                        i * doorWidth, y, doorWidth, 40, colors[i], 5000, doorId
                    ));

                    // On crée le BOUTON à l'index i
                    // Mais son ID correspond à une porte aléatoire via le 'mapping'
                    let targetDoorId = (rowIndex * 10) + mapping[i];
                    this.game.objetsGraphiques.push(new keypad(
                        150 + (i * 270),
                        y - 120,
                        35, 35,
                        colors[i],
                        5000, // Temps d'ouverture
                        targetDoorId
                    ));
                }

                // Murs de bordure pour empêcher de sortir du niveau
                this.game.objetsGraphiques.push(new Obstacle(0, y, 5, 40, "black"));
                this.game.objetsGraphiques.push(new Obstacle(1395, y, 5, 40, "black"));
            });

            // 3. SORTIE : Portail remonté pour être bien visible
            this.game.fin = new fin(700, 920, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);

        } else if (levelNumber === 8) {
            // 1. JOUEUR : Spawn dans la zone de départ fortifiée
            this.game.player = new Player(200, 500);
            this.game.objetsGraphiques.push(this.game.player);

            const roomX = 350, roomY = 200, roomW = 700, roomH = 600;

            // 2. ZONE DE SPAWN (Murs de protection, pas de zone verte)
            this.game.objetsGraphiques.push(new Obstacle(100, 400, 250, 10, "black")); // Haut
            this.game.objetsGraphiques.push(new Obstacle(100, 600, 250, 10, "black")); // Bas
            this.game.objetsGraphiques.push(new Obstacle(100, 400, 10, 210, "black")); // Gauche

            // 3. STRUCTURE DE LA SALLE (Le mur de droite est supprimé car remplacé par la porte)
            this.game.objetsGraphiques.push(new Obstacle(roomX, roomY, roomW, 10, "black")); // Haut
            this.game.objetsGraphiques.push(new Obstacle(roomX, roomY + roomH, roomW, 10, "black")); // Bas
            this.game.objetsGraphiques.push(new Obstacle(roomX, roomY, 10, 200, "black")); // Entrée haut
            this.game.objetsGraphiques.push(new Obstacle(roomX, roomY + 400, 10, 200, "black")); // Entrée bas

            // 4. OBSTACLE ROTATIF GÉANT (Rotation continue)
            const speed = 0.02;
            this.game.objetsGraphiques.push(new RotatingObstacle(700, 500, 700, 20, "purple", speed, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(700, 500, 700, 20, "purple", speed, Math.PI / 2));

            // 5. BUMPERS DANS LES COINS
            this.game.objetsGraphiques.push(new bumper(roomX + 10, roomY + 10, 50, 50, "yellow", "down"));
            this.game.objetsGraphiques.push(new bumper(roomX + roomW - 60, roomY + 10, 50, 50, "yellow", "down"));
            this.game.objetsGraphiques.push(new bumper(roomX + 10, roomY + roomH - 60, 50, 50, "yellow", "up"));
            this.game.objetsGraphiques.push(new bumper(roomX + roomW - 60, roomY + roomH - 60, 50, 50, "yellow", "up"));

            // 6. FADING DOOR (REMPLACE LE MUR DE DROITE)
            // Elle prend la place exacte du mur (roomX + roomW) et les mêmes dimensions (10x610)
            this.game.objetsGraphiques.push(new keypad(700, 750, 25, 25, "orange", 3000, 88));
            this.game.objetsGraphiques.push(new fadingDoor(roomX + roomW, roomY, 10, 610, "orange", 3000, 88));

            // 7. SORTIE ACCESSIBLE APRÈS OUVERTURE
            this.game.fin = new fin(1250, 500, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 9) {
            // 1. JOUEUR : Spawn dans la boîte du haut (Taille 100x100)
            this.game.player = new Player(150, 150);
            
            // --- MODIFICATIONS SPÉCIFIQUES NIVEAU 9 ---
            this.game.player.w = 80;
            this.game.player.h = 80;
            this.game.playerSpeed = 8;
            
            this.game.objetsGraphiques.push(this.game.player);

            // 2. MURS DU SPAWN (Avec ouverture de 120px pour laisser passer le joueur)
            this.game.objetsGraphiques.push(new Obstacle(50, 50, 210, 10, "black"));  // Haut
            this.game.objetsGraphiques.push(new Obstacle(50, 50, 10, 210, "black"));   // Gauche
            this.game.objetsGraphiques.push(new Obstacle(250, 50, 10, 710, "black"));  // Droite longue

            // Mur du bas du spawn avec un trou (Ouverture entre x=100 et x=220)
            this.game.objetsGraphiques.push(new Obstacle(50, 250, 50, 10, "black"));   // Segment gauche
            this.game.objetsGraphiques.push(new Obstacle(220, 250, 30, 10, "black"));  // Segment droit

            // 3. COULOIR VERTICAL (Fermé à gauche)
            this.game.objetsGraphiques.push(new Obstacle(50, 250, 10, 710, "black"));  // Mur Gauche long

            // PREMIERS OBSTACLES : 2 Grosses Barres VERTICALES (Mouvement Gauche/Droite)
            const vSpeed = 0.05;

            // Premier obstacle : Remonté à y=280 (juste après la sortie du spawn à y=250)
            // On réduit légèrement la hauteur à 160 pour créer de l'espace
            this.game.objetsGraphiques.push(new MovingObstacle(150, 280, 40, 160, "purple", 70, 0, vSpeed));

            // Deuxième obstacle : Placé à y=560 pour laisser un couloir de sécurité entre les deux
            // Le premier finit à 280+160=440, ce qui laisse 120px de vide (ton joueur fait 100px)
            let bar2 = new MovingObstacle(150, 560, 40, 160, "purple", 70, 0, vSpeed);
            bar2.timer = Math.PI; // En déphasage
            this.game.objetsGraphiques.push(bar2);

            // 4. LE VIRAGE : Obstacle rotatif central (positionné à y=850)
            // Cette herse finit à 560+160=720. 
            // L'obstacle rotatif à y=850 a une portée haute de 760 (850 - 180/2).
            // Il reste donc 40px de marge de sécurité pour éviter tout contact visuel.
            this.game.objetsGraphiques.push(new RotatingObstacle(150, 850, 180, 20, "purple", 0.02));

            // 5. COULOIR HORIZONTAL (Entièrement fermé)
            this.game.objetsGraphiques.push(new Obstacle(250, 750, 1110, 10, "black")); // Plafond
            this.game.objetsGraphiques.push(new Obstacle(50, 950, 1310, 10, "black"));  // Sol
            this.game.objetsGraphiques.push(new Obstacle(1350, 750, 10, 210, "black")); // Mur de fin

            // DERNIERS OBSTACLES : 2 Grosses Barres HORIZONTALES (Mouvement Haut/Bas)
            // Ces barres sont plus larges que hautes pour bloquer le passage horizontal
            this.game.objetsGraphiques.push(new MovingObstacle(600, 850, 180, 60, "purple", 0, 70, vSpeed));
            let bar4 = new MovingObstacle(950, 850, 180, 60, "purple", 0, 70, vSpeed);
            bar4.timer = Math.PI;
            this.game.objetsGraphiques.push(bar4);

            // 6. LA SORTIE
            this.game.fin = new fin(1250, 850, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}