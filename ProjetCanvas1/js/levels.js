import Player from "./Player.js";
import Obstacle, { RotatingObstacle, IntermittentRotatingObstacle, MovingObstacle, CircleObstacle } from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import fadingDoor from "./fadingDoor.js";
import keypad from "./keypad.js";
import teleporter from "./teleporter.js";
import { movingObstacle } from "./Obstacle.js";

export default class Levels {
    constructor(game) {
        this.game = game;
        this.customLevels = new Map();
    }

    registerCustomLevel(id, data) {
        this.customLevels.set(id, data);
    }

    loadFromJSON(data) {
        this.game.objetsGraphiques = [];
        this.game.playerSpeed = 5;

        data.forEach(objData => {
            let newObj;
            switch(objData.type) {
                case "player":
                    this.game.player = new Player(objData.x, objData.y);
                    this.game.player.w = objData.w;
                    this.game.player.h = objData.h;
                    newObj = this.game.player;
                    break;
                case "rect":
                    newObj = new Obstacle(objData.x, objData.y, objData.w, objData.h, objData.couleur);
                    break;
                case "circle":
                    newObj = new CircleObstacle(objData.x, objData.y, objData.r || (objData.w/2), objData.couleur);
                    break;
                case "rotating":
                    newObj = new RotatingObstacle(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.angleSpeed, objData.angle);
                    break;
                case "bumper":
                    newObj = new bumper(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.direction);
                    break;
                case "fin":
                    newObj = new fin(objData.x, objData.y, objData.w, objData.h, objData.couleur, "assets/images/portal.png");
                    break;
                case "speed":
                    newObj = new speedPotion(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.vitesse, objData.temps);
                    break;
                case "size":
                    newObj = new sizePotion(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.tailleW, objData.tailleH);
                    break;
                case "door":
                    newObj = new fadingDoor(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.timer, objData.id);
                    break;
                case "keypad":
                    newObj = new keypad(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.temps, objData.id);
                    break;
                case "moving":
                    newObj = new MovingObstacle(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.distX, objData.distY, objData.speed);
                    break;
                case "teleporter":
                    newObj = new teleporter(objData.x, objData.y, objData.w, objData.h, objData.couleur, objData.destinationX, objData.destinationY);
                    break;
            }
            if (newObj) {
                if (objData.angle && !(newObj instanceof RotatingObstacle)) newObj.angle = objData.angle;
                this.game.objetsGraphiques.push(newObj);
            }
        });

        // Sécurité : si pas de joueur dans le JSON, on en crée un
        if (!this.game.player) {
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);
        }
    }

    load(levelNumber) {
        // On vide le tableau d'objets graphiques avant de charger le niveau
        this.game.objetsGraphiques = [];

        // Réinitialisation de la vitesse par défaut pour tous les niveaux
        this.game.playerSpeed = 5;

        // --- GESTION DES NIVEAUX IMPORTÉS ---
        if (this.customLevels.has(levelNumber)) {
            this.loadFromJSON(this.customLevels.get(levelNumber));
            return;
        }

        // --- AJOUT : NIVEAU ÉDITEUR (VIDE) ---
        if (levelNumber === 0) {
            // On place le joueur au centre (700, 500 pour un canvas de 1400x1000)
            this.game.player = new Player(700, 500);
            this.game.objetsGraphiques.push(this.game.player);
            
            // On change le texte du niveau pour indiquer qu'on est dans l'éditeur
            if (this.game.levelElement) this.game.levelElement.innerText = "Editeur";
            return; // On arrête ici pour ne pas charger d'autres objets
        }

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
            this.game.keypad1 = new keypad(250, 200, 60, 60, "pink", 3000, 1);
            this.game.objetsGraphiques.push(this.game.keypad1);
            this.game.keypad2 = new keypad(350, 400, 60, 60, "pink", 3000, 2);
            this.game.objetsGraphiques.push(this.game.keypad2);

            // Carrés
            let obstacle2 = new Obstacle(500, 500, 100, 100, "blue");
            this.game.objetsGraphiques.push(obstacle2);
            let obstacle4 = new Obstacle(750, 500, 100, 100, "purple");
            this.game.objetsGraphiques.push(obstacle4);

            // Bumper
            this.game.bumper1 = new bumper(550, 340, 75, 75, "orange");
            this.game.objetsGraphiques.push(this.game.bumper1);

            // Potion de vitesse 
            this.speedPotion1 = new speedPotion(250, 100, 50, 50, "cyan", 5, 3000);
            this.game.objetsGraphiques.push(this.speedPotion1);

            // Potion de taille
            this.sizePotion1 = new sizePotion(650, 50, 25, 25, "magenta", -40, 50);
            this.game.objetsGraphiques.push(this.sizePotion1);

            // Téléporteur
            this.teleporter1 = new teleporter(250, 50, 25, 25, "purple", 1100, 250);
            this.game.objetsGraphiques.push(this.teleporter1);

            // Obstacle mobile
            let movingObstacle1 = new movingObstacle(400, 200, 50, 50, "brown", 2, 0);
            this.game.objetsGraphiques.push(movingObstacle1);
            let movingObstacle2 = new movingObstacle(500, 200, 50, 50, "brown", 2, 0);
            this.game.objetsGraphiques.push(movingObstacle2);

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
            for (let x = 420; x < 1150; x += 75) {
                this.game.objetsGraphiques.push(new bumper(x, 30, 75, 75, "orange", "down"));
            }
            // Mur Bas : idem
            for (let x = 420; x < 1150; x += 75) {
                this.game.objetsGraphiques.push(new bumper(x, 895, 75, 75, "orange", "up"));
            }
            // Mur Droite : on commence après le coin haut et on finit avant le coin bas
            for (let y = 80; y < 920; y += 75) {
                this.game.objetsGraphiques.push(new bumper(1225, y, 75, 75, "orange", "left"));
            }
            // Mur Gauche Haut
            for (let y = 80; y < 230; y += 75) {
                this.game.objetsGraphiques.push(new bumper(330, y, 75, 75, "orange", "right"));
            }
            // Mur Gauche Bas
            for (let y = 780; y < 920; y += 75) {
                this.game.objetsGraphiques.push(new bumper(330, y, 75, 75, "orange", "right"));
            }

            // 5. BUMPERS DU CARRÉ CENTRAL (Même logique pour éviter les chevauchements)
            for (let x = 700; x < 900; x += 75) { // Haut et Bas (raccourcis)
                this.game.objetsGraphiques.push(new bumper(x, 275, 75, 75, "orange", "up"));
                this.game.objetsGraphiques.push(new bumper(x, 650, 75, 75, "orange", "down"));
            }
            for (let y = 350; y < 650; y += 75) { // Gauche et Droite
                this.game.objetsGraphiques.push(new bumper(575, y, 75, 75, "orange", "left"));
                this.game.objetsGraphiques.push(new bumper(950, y, 75, 75, "orange", "right"));
            }

            // 6. Sortie
            this.game.fin = new fin(1150, 475, 80, 80, "red", "assets/images/portal.png");
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
            for (let x = 0; x < 1340; x += 60) {
                this.game.objetsGraphiques.push(new bumper(x, 0, 60, 60, "orange", "down"));
                this.game.objetsGraphiques.push(new bumper(x, 940, 60, 60, "orange", "up"));
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

            // 4. LE VIRAGE : Petits carrés gênants
            this.game.objetsGraphiques.push(new Obstacle(90, 810, 30, 30, "purple"));
            this.game.objetsGraphiques.push(new Obstacle(180, 860, 30, 30, "purple"));
            this.game.objetsGraphiques.push(new Obstacle(110, 910, 30, 30, "purple"));

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
        } else if (levelNumber === 10) {
            // --- NIVEAU 10 : Le Gardien Fugitif ---
            // 1. POSITION DU JOUEUR (Le petit point vert en haut à gauche)
            this.game.player = new Player(50, 50);
            this.game.objetsGraphiques.push(this.game.player);

            // 2. LES YEUX (Rectangles noirs creux)
            // Œil Gauche
            this.game.objetsGraphiques.push(new Obstacle(150, 100, 350, 250, "black"));
            this.game.objetsGraphiques.push(new Obstacle(225, 175, 200, 100, "white"));

            // Œil Droit
            this.game.objetsGraphiques.push(new Obstacle(850, 100, 400, 250, "black"));
            this.game.objetsGraphiques.push(new Obstacle(925, 175, 250, 100, "white"));

            // 3. LA CROIX CENTRALE (Obstacle rotatif rouge et vert)
            const cx = 700, cy = 380;
            this.game.objetsGraphiques.push(new RotatingObstacle(cx, cy, 180, 15, "red", 0.04, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(cx, cy, 180, 15, "green", 0.04, Math.PI / 2));

            // 4. LA BOUCHE ET LA DENT
            this.game.objetsGraphiques.push(new Obstacle(400, 500, 550, 200, "black"));
            this.game.objetsGraphiques.push(new Obstacle(430, 530, 490, 140, "white"));
            this.game.objetsGraphiques.push(new Obstacle(400, 700, 70, 150, "black")); // La dent

            // 5. LES PETITS ESCALIERS VERTS (Comme sur l'image)
            const steps = [
                { x: 800, y: 730 }, { x: 880, y: 780 }, { x: 980, y: 830 },
                { x: 1080, y: 880 }, { x: 1160, y: 920 }, { x: 1260, y: 950 }
            ];
            steps.forEach(s => {
                this.game.objetsGraphiques.push(new Obstacle(s.x, s.y, 60, 30, "green"));
            });

            // 6. LE PORTAIL DE FIN (Position initiale : Tout en haut à droite)
            this.game.finPortal = new fin(1300, 80, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.finPortal);

            // Initialisation de l'étape du portail
            this.game.portalStage = 0;
        }else if (levelNumber === 11) {
            // --- NIVEAU 11 : Le Labyrinthe en S (Basé sur l'image) ---
            
            // 1. Position de départ du joueur (en bas à gauche comme sur l'image)
            this.game.player = new Player(120, 500); //
            this.game.objetsGraphiques.push(this.game.player); //

            // 2. Murs extérieurs (Bordures noires - Obstacles)
            this.game.objetsGraphiques.push(new Obstacle(0, 50, 1320, 20, "black"));        // Plafond
            this.game.objetsGraphiques.push(new Obstacle(0, 800, 1320, 20, "black"));      // Sol
            this.game.objetsGraphiques.push(new Obstacle(0, 70, 20, 730, "black"));        // Mur Gauche
            this.game.objetsGraphiques.push(new Obstacle(780, 200, 20, 600, "black"));      // Mur Droit
            this.game.objetsGraphiques.push(new Obstacle(200, 400, 20, 250, "black"));      
            this.game.objetsGraphiques.push(new Obstacle(500, 550, 20, 250, "black"));      
            this.game.objetsGraphiques.push(new Obstacle(1300, 50, 20, 750, "black"));      
            this.game.objetsGraphiques.push(new Obstacle(800, 200, 300, 20, "black"));      
            this.game.objetsGraphiques.push(new Obstacle(900, 500, 250, 20, "black"));      


            // 3. Murs intérieurs (Chicanes pour créer le "S")
            // Premier mur : part de la gauche et s'arrête pour laisser un passage à droite
            this.game.objetsGraphiques.push(new Obstacle(0, 400, 600, 20, "black")); 
            // Deuxième mur : part de la droite et s'arrête pour laisser un passage à gauche
            this.game.objetsGraphiques.push(new Obstacle(200, 200, 600, 20, "black"));

            // ajout de potion de vitesse
            this.game.objetsGraphiques.push(new speedPotion(400, 100, 30, 30, "cyan", 6, 5000));

            // ajout d'un obstacle mobile
            this.game.objetsGraphiques.push(new movingObstacle(1000, 300, 50, 50, "brown", 2, 0));

            // 4. Bumpers (Triangles orange) - Placés aux points stratégiques du schéma
            // On utilise la classe bumper(x, y, w, h, couleur)
            this.game.objetsGraphiques.push(new bumper(250, 450, 60, 60, "orange")); // Tournant bas-droit
            this.game.objetsGraphiques.push(new bumper(20, 350, 60, 60, "orange")); // Tournant milieu-gauche
            this.game.objetsGraphiques.push(new bumper(400, 300, 50, 50, "orange")); // Obstacle dans le couloir central
            this.game.objetsGraphiques.push(new bumper(20, 70, 60, 60, "orange"));   // Coin haut-gauche
            this.game.objetsGraphiques.push(new bumper(1240, 70, 60, 60, "orange"));   // Coin haut-droit
            this.game.objetsGraphiques.push(new bumper(1240, 750, 60, 60, "orange"));   // Coin bas-droit
            this.game.objetsGraphiques.push(new bumper(940, 750, 60, 60, "orange"));
            this.game.objetsGraphiques.push(new bumper(100, 750, 60, 60, "orange"));
            this.game.objetsGraphiques.push(new bumper(540, 750, 60, 60, "orange"));
            this.game.objetsGraphiques.push(new bumper(540, 150, 60, 60, "orange"));




            // 5. Sortie (Cercle vert) - En haut à droite
            // Utilisation de la classe fin avec son image de portail
            this.game.fin = new fin(800, 700, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        }else if (levelNumber === 12) {
            // --- NIVEAU 12 : Les Chambres de Téléportation ---
            
            // 1. Position de départ (Pièce du bas)
            this.game.player = new Player(485, 460); // Centré dans la salle de départ pour éviter les TP
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Murs extérieurs et séparations horizontales (Noirs)
            this.game.objetsGraphiques.push(new Obstacle(0, 50, 1320, 20, "black"));        // Plafond
            this.game.objetsGraphiques.push(new Obstacle(0, 850, 1320, 20, "black"));      // Sol
            this.game.objetsGraphiques.push(new Obstacle(0, 70, 20, 780, "black"));        // Mur Gauche
            this.game.objetsGraphiques.push(new Obstacle(1300, 70, 20, 780, "black"));      // Mur droite
            this.game.objetsGraphiques.push(new Obstacle(300, 70, 20, 780, "black"));    
            this.game.objetsGraphiques.push(new Obstacle(650, 70, 20, 780, "black"));    
            this.game.objetsGraphiques.push(new Obstacle(1000, 70, 20, 780, "black"));  
            this.game.objetsGraphiques.push(new Obstacle(0, 300, 1320, 20, "black"));  
            this.game.objetsGraphiques.push(new Obstacle(0, 600, 1320, 20, "black"));    
      
            // 3. Téléporteurs (4 par salle, destination le centre d'une autre salle)
            const cols = [
                { start: 20, end: 300, center: 160 },
                { start: 320, end: 650, center: 485 },
                { start: 670, end: 1000, center: 835 },
                { start: 1020, end: 1300, center: 1160 }
            ];
            const rows = [
                { start: 70, end: 300, center: 185 },
                { start: 320, end: 600, center: 460 },
                { start: 620, end: 850, center: 735 }
            ];

            // On génère les 4 téléporteurs pour chaque "boite" (salle)
            for (let r = 0; r < rows.length; r++) {
                for (let c = 0; c < cols.length; c++) {
                    let roomX = cols[c].start;
                    let roomY = rows[r].start;
                    let roomW = cols[c].end - cols[c].start;
                    let roomH = rows[r].end - rows[r].start;

                    // Positions des 4 coins (avec marge)
                    let margin = 30;
                    let tSize = 30;
                    let corners = [
                        { x: roomX + margin, y: roomY + margin }, // Haut Gauche
                        { x: roomX + roomW - margin - tSize, y: roomY + margin }, // Haut Droite
                        { x: roomX + margin, y: roomY + roomH - margin - tSize }, // Bas Gauche
                        { x: roomX + roomW - margin - tSize, y: roomY + roomH - margin - tSize } // Bas Droite
                    ];

                    corners.forEach((pos, index) => {
                        // Logique de destination : on mélange les indices pour changer de salle
                        let destC = (c + 1 + index) % cols.length;
                        let destR = (r + 1 + index) % rows.length;
                        
                        // On évite de se téléporter dans la même salle
                        if(destC === c && destR === r) destC = (destC + 1) % cols.length;

                        this.game.objetsGraphiques.push(new teleporter(
                            pos.x, pos.y, tSize, tSize, "purple",
                            cols[destC].center, rows[destR].center
                        ));
                    });
                }
            }

            // 5. Sortie (Cercle vert - Portail)
            this.game.fin = new fin(800, 60, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 13) {
            // --- NIVEAU 13 : Le Slalom des Gardiens Rouges (Agrandi) ---
            
            // 1. Position de départ du joueur (bas-gauche)
            this.game.player = new Player(100, 800);
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Murs extérieurs (Bordures noires)
            this.game.objetsGraphiques.push(new Obstacle(0, 50, 1300, 20, "black"));        // Plafond
            this.game.objetsGraphiques.push(new Obstacle(0, 950, 1300, 20, "black"));      // Sol
            this.game.objetsGraphiques.push(new Obstacle(0, 50, 20, 920, "black"));        // Mur Gauche
            this.game.objetsGraphiques.push(new Obstacle(1280, 50, 20, 920, "black"));      // Mur Droit

            // 3. Murs de séparation (Parcours en S)
            // Mur du bas (laisse un passage à droite)
            this.game.objetsGraphiques.push(new Obstacle(0, 650, 1100, 20, "black")); 
            // Mur du haut (laisse un passage à gauche)
            this.game.objetsGraphiques.push(new Obstacle(200, 350, 1100, 20, "black"));

            // 4. MovingObstacles (Carrés rouges - Mouvement Haut/Bas)
            // Couloir Bas
            this.game.objetsGraphiques.push(new MovingObstacle(400, 800, 60, 60, "red", 0, 100, 0.05));
            this.game.objetsGraphiques.push(new MovingObstacle(800, 800, 60, 60, "red", 0, 100, 0.06));
            
            // Couloir Milieu
            this.game.objetsGraphiques.push(new MovingObstacle(500, 500, 60, 60, "red", 0, 100, 0.07));
            this.game.objetsGraphiques.push(new MovingObstacle(900, 500, 60, 60, "red", 0, 100, 0.05));

            // Couloir Haut
            this.game.objetsGraphiques.push(new MovingObstacle(400, 200, 60, 60, "red", 0, 80, 0.04));
            this.game.objetsGraphiques.push(new MovingObstacle(800, 200, 60, 60, "red", 0, 80, 0.06));

            // 5. Bumpers (Triangles orange) pour ajouter du chaos
            this.game.objetsGraphiques.push(new bumper(1150, 800, 70, 70, "orange")); // Coin bas-droit
            this.game.objetsGraphiques.push(new bumper(80, 500, 70, 70, "orange"));  // Coin milieu-gauche
            this.game.objetsGraphiques.push(new bumper(600, 100, 70, 70, "orange"));  // Dans le couloir final

            // 6. Sortie (Portail vert)
            this.game.fin = new fin(1150, 150, 100, 100, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 14) {
            // --- NIVEAU 14 : Le Passage de la Croix ---
            
            // 1. Position de départ du joueur (en bas à gauche)
            this.game.player = new Player(60, 500);
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Murs extérieurs (Bordures noires)
            this.game.objetsGraphiques.push(new Obstacle(0, 0, 800, 20, "black"));        // Plafond
            this.game.objetsGraphiques.push(new Obstacle(0, 580, 800, 20, "black"));      // Sol
            this.game.objetsGraphiques.push(new Obstacle(0, 0, 20, 600, "black"));        // Mur Gauche
            this.game.objetsGraphiques.push(new Obstacle(780, 0, 20, 600, "black"));      // Mur Droit

            // 3. Murs de séparation (Parcours en S)
            // Mur inférieur (ouverture à droite)
            this.game.objetsGraphiques.push(new Obstacle(0, 400, 650, 20, "black")); 
            // Mur supérieur (ouverture à gauche)
            this.game.objetsGraphiques.push(new Obstacle(150, 200, 650, 20, "black"));

            // 4. CROIX ROUGE (RotatingObstacle)
            // On crée une croix en superposant deux obstacles rotatifs à 90 degrés
            const centerX = 400;
            const centerY = 300;
            const rotationSpeed = 0.03;

            this.game.objetsGraphiques.push(new RotatingObstacle(centerX, centerY, 200, 20, "red", rotationSpeed, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(centerX, centerY, 200, 20, "red", rotationSpeed, Math.PI / 2));

            // 5. Bumpers (Triangles orange) pour ajouter du rebond dans les coins
            this.game.objetsGraphiques.push(new bumper(710, 510, 50, 50, "orange")); // Coin bas-droit
            this.game.objetsGraphiques.push(new bumper(40, 310, 50, 50, "orange"));  // Coin milieu-gauche

            // 6. Sortie (Portail vert)
            this.game.fin = new fin(700, 60, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}