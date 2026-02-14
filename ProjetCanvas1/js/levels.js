import Player from "./Player.js";
import Obstacle, { RotatingObstacle, IntermittentRotatingObstacle, MovingObstacle, CircleObstacle, TexturedObstacle, PipeObstacle, ImageObstacle, PipeCorner } from "./Obstacle.js";
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
                case "textured":
                    newObj = new TexturedObstacle(objData.x, objData.y, objData.w, objData.h, objData.imageSrc);
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

        if (!this.game.player) {
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);
        }
    }

    load(levelNumber) {
        this.game.objetsGraphiques = [];
        this.game.playerSpeed = 5;

        if (this.customLevels.has(levelNumber)) {
            this.loadFromJSON(this.customLevels.get(levelNumber));
            return;
        }

        if (levelNumber === 0) {
            this.game.player = new Player(700, 500);
            this.game.objetsGraphiques.push(this.game.player);
            if (this.game.levelElement) this.game.levelElement.innerText = "Editeur";
            return;
        }

        if (levelNumber === 1) {
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);
            let obstacle1 = new PipeObstacle(285, 0, 70, 600);
            this.game.objetsGraphiques.push(obstacle1);
            let obstacle3 = new PipeObstacle(885, 300, 70, 700);
            this.game.objetsGraphiques.push(obstacle3);
            this.game.fin = new fin(1100, 50, 100, 100, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 2) {
            this.game.player = new Player(100, 100);
            this.game.objetsGraphiques.push(this.game.player);
            this.game.objetsGraphiques.push(new RotatingObstacle(320, 470, 250, 20, "black", 0.02, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(320, 470, 250, 20, "black", 0.02, Math.PI / 2));
            this.game.objetsGraphiques.push(new RotatingObstacle(800, 600, 250, 20, "black", -0.02, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(800, 600, 250, 20, "black", -0.02, Math.PI / 2));
            this.game.objetsGraphiques.push(new PipeObstacle(530, 0, 70, 400));
            this.game.objetsGraphiques.push(new PipeObstacle(530, 600, 70, 400));
            let wallRightX = 1080;
            this.game.objetsGraphiques.push(new PipeObstacle(wallRightX, 400, 70, 600));
            this.game.fin = new fin(1250, 850, 100, 100, "red", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 3) {
                    // --- NIVEAU 3 : L'Arène Finale (Coins Nettoyés) ---
                    this.game.player = new Player(50, 500);
                    this.game.objetsGraphiques.push(this.game.player);
        
                    // 1. Remplissage des coins de la map (Murs noirs solides)
                    // Coin Haut-Gauche (Remplace le bloc 0,0,330,280)
                    this.game.objetsGraphiques.push(new PipeCorner(265, 214, 55, 55, -Math.PI / 2));
                    this.game.objetsGraphiques.push(new PipeObstacle(120, 115, 40, 275, Math.PI / 2, false, true)); // Horizontal (x=0 à 275)
                    this.game.objetsGraphiques.push(new PipeObstacle(282.5, 47, 40, 180, 0, false, false)); // Vertical (y=0 à 225)
        
                    // Coin Bas-Gauche (Remplace le bloc 0,750,330,250)
                    this.game.objetsGraphiques.push(new PipeCorner(265, 761, 55, 55, Math.PI));
                    this.game.objetsGraphiques.push(new PipeObstacle(120, 640, 40, 275, Math.PI / 2, false, true)); // Horizontal (x=0 à 275)
                    this.game.objetsGraphiques.push(new PipeObstacle(282.5, 800, 40, 150, 0, false, false)); // Vertical (y=805 à 1000)
        
                    // 2. Murs restants de l'arène
                    this.game.objetsGraphiques.push(new PipeCorner(286, 5, 55, 55, Math.PI / 2));
                    this.game.objetsGraphiques.push(new PipeObstacle(863, -532, 30, 1100, Math.PI / 2, false, false)); // Mur haut (rotaté pour aspect tuyau)
                    this.game.objetsGraphiques.push(new PipeCorner(286, 937, 55, 55));
                    this.game.objetsGraphiques.push(new PipeObstacle(863, 429, 30, 1100, Math.PI / 2, false, false));  // Mur bas (rotaté pour aspect tuyau)
                    this.game.objetsGraphiques.push(new PipeObstacle(1300, 0, 100, 1000));
                    this.game.objetsGraphiques.push(new ImageObstacle(650, 350, 300, 300, "assets/images/metalblock.png"));
        
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
            this.game.player = new Player(50, 50);
            this.game.objetsGraphiques.push(this.game.player);
            this.game.objetsGraphiques.push(new speedPotion(430, 700, 30, 30, "cyan", 6, 5000));
            for (let i = 0; i < 4; i++) {
                let x = 300 + (i * 250);
                let y = (i % 2 === 0) ? 0 : 400;
                this.game.objetsGraphiques.push(new PipeObstacle(x, y, 50, 600));
                let dir = (i % 2 === 0) ? "down" : "up";
                let bumperY = (i % 2 === 0) ? 600 : 350;
                this.game.objetsGraphiques.push(new bumper(x + 5, bumperY, 40, 50, "orange", dir));
            }
            this.game.fin = new fin(1300, 800, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 5) {
            this.game.player = new Player(150, 150);
            this.game.objetsGraphiques.push(this.game.player);
            this.game.objetsGraphiques.push(new PipeObstacle(180, 220, 40, 400, Math.PI / 2));
            this.game.objetsGraphiques.push(new PipeObstacle(1230, 270, 40, 300, Math.PI / 2));
            for (let x = 0; x < 1340; x += 60) {
                this.game.objetsGraphiques.push(new bumper(x, 0, 60, 60, "orange", "down"));
                this.game.objetsGraphiques.push(new bumper(x, 940, 60, 60, "orange", "up"));
            }
            const centers = [600, 900];
            centers.forEach((cx, i) => {
                this.game.objetsGraphiques.push(new RotatingObstacle(cx, 500, 300, 20, "purple", 0.04, 0));
                this.game.objetsGraphiques.push(new RotatingObstacle(cx, 500, 300, 20, "purple", 0.04, Math.PI / 2));
            });
            this.game.finPortal = new fin(1300, 200, 100, 100, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.finPortal);
            this.game.portalStage = 0;
        } else if (levelNumber === 6) {
                    // --- NIVEAU 6 : Le Labyrinthe du Petit Blob (Ajusté) ---
                    // 1. POSITION DU JOUEUR (Ajustée pour ne pas être dans le mur ni sur le buff)
                    // On place le joueur à y=500 pour être exactement dans le couloir de sortie
                    this.game.player = new Player(80, 500);
                    this.game.objetsGraphiques.push(this.game.player);
        
        
                    // Potion Magenta décalée à droite pour ne pas spawn dessus (x=220)
                    this.game.objetsGraphiques.push(new sizePotion(220, 480, 40, 40, "magenta", -70, -70));
        
                    // 2. LES PILIERS ET LES PETITS CARRÉS
                    // Premier mur (Pilier gauche)
                    this.game.objetsGraphiques.push(new PipeObstacle(400, 0, 50, 800));
        
                    // Ajout de petits carrés entre le pilier 1 et 2 pour ralentir le joueur
                    for (let i = 0; i < 5; i++) {
                        this.game.objetsGraphiques.push(new ImageObstacle(500, 100 + (i * 150), 30, 30, "assets/images/metalblock.png"));
                        this.game.objetsGraphiques.push(new ImageObstacle(600, 50 + (i * 150), 30, 30, "assets/images/metalblock.png"));
                    }
        
                    // Deuxième mur (Pilier milieu)
                    this.game.objetsGraphiques.push(new PipeObstacle(700, 80, 50, 920));
        
                    // Ajout de petits carrés entre le pilier 2 et 3
                    for (let i = 0; i < 4; i++) {
                        this.game.objetsGraphiques.push(new ImageObstacle(850, 150 + (i * 180), 35, 35, "assets/images/metalblock.png"));
                    }
        
                    // Troisième mur (Pilier droit)
                    this.game.objetsGraphiques.push(new PipeObstacle(1000, 0, 50, 450));
                    this.game.objetsGraphiques.push(new PipeObstacle(1000, 550, 50, 450));
        
                    // 3. OBSTACLE ROTATIF (Décalé à x=1150 pour ne pas toucher les piliers à x=1000)
                    this.game.objetsGraphiques.push(new RotatingObstacle(1150, 500, 180, 15, "purple", 0.08));
        
                    // Potions de malus (Redevenir grand) cachées parmi les petits carrés
                    this.game.objetsGraphiques.push(new sizePotion(550, 850, 35, 35, "red", 70, 70));
                    this.game.objetsGraphiques.push(new sizePotion(850, 20, 35, 35, "red", 70, 70));
        
                    // 4. LA SORTIE
                    this.game.fin = new fin(1300, 500, 80, 80, "green", "assets/images/portal.png");
                    this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 7) {
            this.game.player = new Player(700, 50);
            this.game.player.w = 40;
            this.game.player.h = 40;
            this.game.objetsGraphiques.push(this.game.player);
            const colors = ["pink", "cyan", "yellow", "orange", "purple"];
            const rowY = [250, 450, 650, 850];
            const doorWidth = 280;
            rowY.forEach((y, rowIndex) => {
                let mapping = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
                for (let i = 0; i < 5; i++) {
                    let doorId = (rowIndex * 10) + i;
                    this.game.objetsGraphiques.push(new fadingDoor(i * doorWidth, y, doorWidth, 40, colors[i], 5000, doorId));
                    let targetDoorId = (rowIndex * 10) + mapping[i];
                    this.game.objetsGraphiques.push(new keypad(150 + (i * 270), y - 120, 35, 35, colors[i], 5000, targetDoorId));
                }
                this.game.objetsGraphiques.push(new Obstacle(0, y, 5, 40, "black"));
                this.game.objetsGraphiques.push(new Obstacle(1395, y, 5, 40, "black"));
            });
            this.game.fin = new fin(700, 920, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);

        } else if (levelNumber === 8) {
            // --- NIVEAU 8 : Alignement Parfait (Corrigé) ---
            this.game.player = new Player(200, 500);
            this.game.objetsGraphiques.push(this.game.player);

            // Dimensions de la salle
            const roomLeft = 335;
            const roomRight = 1035;
            const roomTop = 185;
            const roomBottom = 785;
            const pipeThickness = 40;

            // --- 1. ZONE DE SPAWN (Le "U" à gauche) ---
            
            // Coin Haut-Gauche (Début du U)
            // Visuellement en y=400 pour s'aligner avec le trou du mur
            this.game.objetsGraphiques.push(new PipeCorner(88.1, 400, 55, 55, Math.PI / 2));
            
            // Coin Bas-Gauche (Bas du U)
            // Visuellement en y=600
            this.game.objetsGraphiques.push(new PipeCorner(88.1, 584, 55, 55, 0));

            // Mur Vertical Arrière (Connecte les deux coins)
            // De y=440 à y=600 (Hauteur 160)
            this.game.objetsGraphiques.push(new PipeObstacle(85, 440, 40, 160, 0, false, false));

            // Tuyau Horizontal HAUT (Connecte Coin Spawn -> Mur Salle)
            // Visuellement : x=125, y=400, Longueur=210.
            // CALCUL DE COMPENSATION POUR ROTATION 90° :
            // ObjX = VisX + (Length/2) - (Thickness/2) = 125 + 105 - 20 = 210
            // ObjY = VisY - (Length/2) + (Thickness/2) = 400 - 105 + 20 = 315
            this.game.objetsGraphiques.push(new PipeObstacle(210, 311.7, 40, 210, Math.PI / 2, false, false));

            // Tuyau Horizontal BAS
            // Visuellement : x=125, y=600, Longueur=210.
            // ObjX = 210 (Même X)
            // ObjY = 600 - 105 + 20 = 515
            this.game.objetsGraphiques.push(new PipeObstacle(210, 517.3, 40, 210, Math.PI /2, false, false, true));


            // --- 2. MURS DE GAUCHE DE LA SALLE (Avec le trou) ---
            
            // Mur Haut (Coin Room -> Tuyau Horizontal Haut)
            // Visuellement : x=335. De y=225 à y=400. Hauteur 175.
            this.game.objetsGraphiques.push(new PipeObstacle(roomLeft+3, 225, 40, 175, 0, false, false)); 

            this.game.objetsGraphiques.push(new PipeCorner(320, 378, 55, 55, -Math.PI / 2)); // Coin Haut (Tuyau Horizontal Haut -> Coin Room)

   

            // Mur Bas (Tuyau Horizontal Bas -> Coin Room)
            // Visuellement : x=335. De y=640 (40px sous le tuyau) à y=785. Hauteur 145.
            // Note : On ajuste pour que ça touche le tuyau du bas (y=600 + 40 = 640 départ ?)
            // Correction : Le tuyau bas est à y=600 (top edge). Donc le mur doit partir de 600 ou 640 ? 
            // Pour faire un T, il part de 600.
            this.game.objetsGraphiques.push(new PipeObstacle(roomLeft-3.5, 640, 40, 140, 0, false, false));


            // --- 3. COINS DE LA GRANDE SALLE ---
            this.game.objetsGraphiques.push(new PipeCorner(roomLeft+6.2, roomTop, 55, 55, Math.PI / 2));     // TL
            this.game.objetsGraphiques.push(new PipeCorner(roomLeft, roomBottom-18, 55, 55, 0));            // BL


            // --- 4. MURS HORIZONTAUX DE LA SALLE ---
            
            // Mur du HAUT
            // Visuellement : x=375, y=185, Longueur=660.
            // ObjX = 375 + 330 - 20 = 685
            // ObjY = 185 - 330 + 20 = -125
            this.game.objetsGraphiques.push(new PipeObstacle(685, -129.8, 40, 660, Math.PI / 2, false, false));
     
            // Mur du BAS
            // Visuellement : x=375, y=785, Longueur=660.
            // ObjX = 685
            // ObjY = 785 - 330 + 20 = 475
            this.game.objetsGraphiques.push(new PipeObstacle(685, 475, 40, 660, Math.PI / 2, false, false));
                this.game.objetsGraphiques.push(new PipeCorner(313, 606, 55, 55, Math.PI));


            // --- 5. MUR VERTICAL DROITE ---



            // --- 6. OBSTACLES & FIN ---
            const speed = 0.02;
            this.game.objetsGraphiques.push(new RotatingObstacle(700, 500, 700, 20, "purple", speed, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(700, 500, 700, 20, "purple", speed, Math.PI / 2));

            // Bumpers
            this.game.objetsGraphiques.push(new bumper(380, 230, 50, 50, "yellow", "down"));
            this.game.objetsGraphiques.push(new bumper(980, 230, 50, 50, "yellow", "down"));
            this.game.objetsGraphiques.push(new bumper(380, 700, 50, 50, "yellow", "up"));
            this.game.objetsGraphiques.push(new bumper(980, 700, 50, 50, "yellow", "up"));

            // Porte et Fin
            this.game.objetsGraphiques.push(new keypad(700, 740, 25, 25, "orange", 10000, 88));
            this.game.objetsGraphiques.push(new fadingDoor(roomRight, 200, 10, 610, "orange", 10000, 88)); // Porte sur le mur de droite
            this.game.fin = new fin(1250, 500, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 9) {
            this.game.player = new Player(150, 150);
            this.game.player.w = 80;
            this.game.player.h = 80;
            this.game.playerSpeed = 8;
            this.game.objetsGraphiques.push(this.game.player);
            
            // --- STRUCTURE TUYAUX ---
            // Coin Haut-Gauche
            this.game.objetsGraphiques.push(new PipeCorner(46, 48, 55, 55, Math.PI / 2));
            this.game.objetsGraphiques.push(new PipeObstacle(145, -20, 45, 170, Math.PI / 2, false, false)); // Mur Haut
            // Coin Haut-Droite
            this.game.objetsGraphiques.push(new PipeCorner(240, 48, 55, 55, Math.PI));
            

            this.game.objetsGraphiques.push(new PipeObstacle(257.5, 90, 40, 655, 0, false, false)); // Mur Droite Vertical
            this.game.objetsGraphiques.push(new PipeObstacle(42.5, 90, 40, 862, 0, false, false)); // Mur Gauche Bas
            
            // Coin Bas-Gauche
            this.game.objetsGraphiques.push(new PipeCorner(46, 939, 55, 55, 0));
            // Coin Milieu-Droite (Junction)
            this.game.objetsGraphiques.push(new PipeCorner(261, 725, 55, 55, 0));

            const vSpeed = 0.05;
            this.game.objetsGraphiques.push(new MovingObstacle(150, 280, 40, 160, "purple", 70, 0, vSpeed));
            let bar2 = new MovingObstacle(150, 560, 40, 160, "purple", 70, 0, vSpeed);
            bar2.timer = Math.PI;
            this.game.objetsGraphiques.push(bar2);
            this.game.objetsGraphiques.push(new ImageObstacle(90, 810, 30, 30, "assets/images/metalblock.png"));
            this.game.objetsGraphiques.push(new ImageObstacle(180, 860, 30, 30, "assets/images/metalblock.png"));
            this.game.objetsGraphiques.push(new ImageObstacle(110, 910, 30, 30, "assets/images/metalblock.png"));
            
            this.game.objetsGraphiques.push(new PipeObstacle(807.5, 237, 40, 1050, Math.PI / 2, false, false)); // Mur Haut Couloir Bas
            this.game.objetsGraphiques.push(new PipeObstacle(703, 342, 40, 1270, Math.PI / 2, false, false)); // Mur Bas Couloir Bas
            
            // Fin du couloir
            this.game.objetsGraphiques.push(new PipeCorner(1340, 746, 55, 55, Math.PI)); // Coin Haut Fin
            this.game.objetsGraphiques.push(new PipeCorner(1340, 939, 55, 55, -Math.PI / 2)); // Coin Bas Fin
            this.game.objetsGraphiques.push(new PipeObstacle(1357.5, 785, 40, 167, 0, false, false)); // Mur Fin Droite
            
            this.game.objetsGraphiques.push(new MovingObstacle(600, 850, 180, 60, "purple", 0, 70, vSpeed));
            let bar4 = new MovingObstacle(950, 850, 180, 60, "purple", 0, 70, vSpeed);
            bar4.timer = Math.PI;
            this.game.objetsGraphiques.push(bar4);
            this.game.fin = new fin(1250, 850, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 10) {
            this.game.player = new Player(50, 50);
            this.game.objetsGraphiques.push(this.game.player);
            this.game.objetsGraphiques.push(new Obstacle(150, 100, 350, 250, "black"));
            this.game.objetsGraphiques.push(new Obstacle(225, 175, 200, 100, "white"));
            this.game.objetsGraphiques.push(new Obstacle(850, 100, 400, 250, "black"));
            this.game.objetsGraphiques.push(new Obstacle(925, 175, 250, 100, "white"));
            const cx = 700, cy = 380;
            this.game.objetsGraphiques.push(new RotatingObstacle(cx, cy, 180, 15, "red", 0.04, 0));
            this.game.objetsGraphiques.push(new RotatingObstacle(cx, cy, 180, 15, "green", 0.04, Math.PI / 2));
            this.game.objetsGraphiques.push(new Obstacle(400, 500, 550, 200, "black"));
            this.game.objetsGraphiques.push(new Obstacle(430, 530, 490, 140, "white"));
            this.game.objetsGraphiques.push(new Obstacle(400, 700, 70, 150, "black"));
            const steps = [{ x: 800, y: 730 }, { x: 880, y: 780 }, { x: 980, y: 830 }, { x: 1080, y: 880 }, { x: 1160, y: 920 }, { x: 1260, y: 950 }];
            steps.forEach(s => {
                this.game.objetsGraphiques.push(new Obstacle(s.x, s.y, 60, 30, "green"));
            });
            this.game.finPortal = new fin(1300, 80, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.finPortal);
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
            // --- NIVEAU 14 : Le Labyrinthe Complexe (Import JSON) ---

            // 1. POSITION DU JOUEUR
            this.game.player = new Player(130, 200);
            this.game.objetsGraphiques.push(this.game.player);

            // 2. OBSTACLES (RECTANGLES)
            this.game.objetsGraphiques.push(new Obstacle(24.14, 65.90, 642.15, 18.39, "black"));
            this.game.objetsGraphiques.push(new Obstacle(23.37, 74.33, 21.46, 252.87, "black"));
            this.game.objetsGraphiques.push(new Obstacle(21.15, 308.12, 642.15, 18.39, "black"));
            this.game.objetsGraphiques.push(new Obstacle(641.07, 65.21, 21.46, 252.87, "black"));
            this.game.objetsGraphiques.push(new Obstacle(21.15, 609.27, 642.15, 18.39, "black"));
            this.game.objetsGraphiques.push(new Obstacle(639.77, 317.55, 21.15, 309.27, "black"));
            this.game.objetsGraphiques.push(new Obstacle(24.52, 308.43, 21.15, 309.27, "black"));
            this.game.objetsGraphiques.push(new Obstacle(203.91, 323.98, 21.15, 186.36, "black"));
            this.game.objetsGraphiques.push(new Obstacle(442.30, 435.94, 21.15, 186.36, "black"));
            this.game.objetsGraphiques.push(new Obstacle(654.33, 27.89, 24.21, 787.43, "black"));
            this.game.objetsGraphiques.push(new Obstacle(932.64, 34.87, 30.19, 787.43, "black"));
            this.game.objetsGraphiques.push(new Obstacle(657.24, 26.97, 642.15, 18.39, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1277.47, 28.81, 18.08, 787.43, "black"));
            this.game.objetsGraphiques.push(new Obstacle(655.02, 804.06, 642.15, 18.39, "black"));
            this.game.objetsGraphiques.push(new Obstacle(670.42, 680.77, 110.04, 21.15, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1093.87, 236.02, 52.87, 154.02, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1033.18, 613.95, 21.15, 195.25, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1186.74, 620.08, 22.07, 204.44, "black"));

            // 3. TELEPORTEURS (VIOLETS)
            this.game.objetsGraphiques.push(new teleporter(562.76, 100.31, 40, 40, "purple", 100, 350));
            this.game.objetsGraphiques.push(new teleporter(565.90, 234.48, 40, 40, "purple", 800, 100));
            this.game.objetsGraphiques.push(new teleporter(579.00, 553.33, 40, 40, "purple", 1100, 100));
            this.game.objetsGraphiques.push(new teleporter(706.21, 737.24, 40, 40, "purple", 1100, 100));
            this.game.objetsGraphiques.push(new teleporter(1106.90, 376.67, 25.29, 26.40, "purple", 100, 100));

            // 4. BUMPERS (ORANGE)
            this.game.objetsGraphiques.push(new bumper(44.83, 570.88, 42.91, 38.31, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(235.63, 327.20, 44.44, 36.78, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(463.22, 583.14, 33.72, 27.59, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(607.28, 324.90, 30.65, 30.65, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(389.94, 556.61, 50, 50, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(682.66, 630.17, 50, 50, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(903.83, 777.01, 32.18, 27.59, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(677.30, 444.73, 50, 50, "orange", "right"));
            this.game.objetsGraphiques.push(new bumper(1242.53, 512.64, 35.25, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(1214.25, 545.67, 35.25, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(1192.80, 580.92, 35.25, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(962.15, 508.12, 35.25, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(989.81, 534.25, 35.25, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(1012.87, 571.88, 35.25, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(961.59, 44.73, 50, 50, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(1229.10, 43.28, 50, 50, "orange", "down"));

            // 5. OBSTACLE ROTATIF
            this.game.objetsGraphiques.push(new RotatingObstacle(799.62, 380.08, 300, 18.10, "black", 0.02, 1776.16));

            // 6. SORTIE (FIN)
            this.game.fin = new fin(1096.31, 731.65, 50, 50, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 15) {
            // --- NIVEAU 15 : Le Complexe des Portes Roses ---
            
            // 1. Joueur
            this.game.player = new Player(693.75, 218.39);
            this.game.player.w = 100;
            this.game.player.h = 53.33;
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Obstacles (Murs noirs)
            this.game.objetsGraphiques.push(new Obstacle(170.50, 87.36, 1046.74, 30.65, "black"));
            this.game.objetsGraphiques.push(new Obstacle(172.03, 104.21, 29.12, 688.12, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1184.37, 85.90, 29.12, 688.12, "black"));
            this.game.objetsGraphiques.push(new Obstacle(491.65, 286.74, 29.12, 231.26, "black"));
            this.game.objetsGraphiques.push(new Obstacle(491.72, 285.90, 405.98, 30.65, "black"));
            this.game.objetsGraphiques.push(new Obstacle(171.34, 757.93, 1046.74, 30.65, "black"));
            this.game.objetsGraphiques.push(new Obstacle(871.80, 286.05, 29.12, 231.26, "black"));
            this.game.objetsGraphiques.push(new Obstacle(878.08, 478.31, 323.07, 30.65, "black"));
            this.game.objetsGraphiques.push(new Obstacle(195.33, 680.00, 179.00, 25.75, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1057.61, 507.59, 10, 108.51, "black"));

            // 3. Portes à évanouissement et Claviers (FadingDoors & Keypads)
            this.game.objetsGraphiques.push(new fadingDoor(873.18, 512.64, 24.52, 249.81, "pink", 3000, 1));
            this.game.objetsGraphiques.push(new fadingDoor(493.18, 513.49, 24.52, 249.81, "pink", 5000, 2));
            this.game.objetsGraphiques.push(new keypad(1084.67, 429.12, 42.91, 35.25, "pink", 3000, 2));
            this.game.objetsGraphiques.push(new keypad(299.23, 713.41, 44.44, 36.78, "pink", 3000, 1));

            // 4. Bumpers (Orange)
            this.game.objetsGraphiques.push(new bumper(1136.30, 124.43, 50, 50, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(203.74, 120.59, 50, 50, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(441.28, 438.60, 50, 50, "orange", "left"));
            this.game.objetsGraphiques.push(new bumper(824.90, 247.51, 36.78, 38.31, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(1012.16, 555.84, 50, 50, "orange", "left"));
            this.game.objetsGraphiques.push(new bumper(1157.62, 725.06, 28.97, 30.50, "orange", "up"));

            // 5. Potions (Vitesse et Taille)
            this.game.objetsGraphiques.push(new speedPotion(208.37, 712.20, 30, 38.18, "cyan", 5, 3000));
            this.game.objetsGraphiques.push(new speedPotion(927.22, 326.07, 30, 38.18, "cyan", 5, 3000));
            this.game.objetsGraphiques.push(new sizePotion(676.57, 384.23, 30, 30, "magenta", -40, -40));

            // 6. Obstacle Mobile (Violet)
            this.game.objetsGraphiques.push(new MovingObstacle(644.37, 478.89, 60, 20, "purple", 100, 0, 0.05));

            // 7. Sortie
            this.game.fin = new fin(1084.52, 517.09, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 16) {
            // --- NIVEAU 16 : Le Labyrinthe des Plateformes Mobiles ---
            
            // 1. Position du Joueur
            this.game.player = new Player(322.41, 152.58);
            this.game.player.w = 100;
            this.game.player.h = 53.33;
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Obstacles Fixes (Murs noirs)
            this.game.objetsGraphiques.push(new Obstacle(124.52, 76.63, 22.99, 800, "black"));
            this.game.objetsGraphiques.push(new Obstacle(129.12, 78.93, 596.17, 21.46, "black"));
            this.game.objetsGraphiques.push(new Obstacle(448.05, 211.65, 260.38, 16.70, "black"));
            this.game.objetsGraphiques.push(new Obstacle(706.28, 79.85, 21.30, 594.48, "black"));
            this.game.objetsGraphiques.push(new Obstacle(707.89, 655.25, 349.27, 18.54, "black"));
            this.game.objetsGraphiques.push(new Obstacle(131.57, 853.72, 930.11, 21.46, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1037.47, 657.78, 22.68, 215.79, "black"));
            this.game.objetsGraphiques.push(new Obstacle(890.42, 771.34, 22.68, 91.49, "black"));
            this.game.objetsGraphiques.push(new Obstacle(453.26, 708.81, 122.61, 26.05, "black"));

            // 3. Portes et Claviers (FadingDoor & Keypad)
            this.game.objetsGraphiques.push(new fadingDoor(450.19, 98.85, 18.39, 116.48, "pink", 3000, 1));
            this.game.objetsGraphiques.push(new keypad(955.17, 814.56, 42.91, 38.31, "pink", 3000, 1));

            // 4. Obstacles Mobiles (Violets)
            this.game.objetsGraphiques.push(new MovingObstacle(380, 314.14, 60, 20, "purple", 200, 0, 0.05));
            this.game.objetsGraphiques.push(new MovingObstacle(380, 403.79, 60, 20, "purple", 200, 0, 0.037));
            this.game.objetsGraphiques.push(new MovingObstacle(380, 547.09, 60, 20, "purple", 200, 0, 0.07));
            this.game.objetsGraphiques.push(new MovingObstacle(718.28, 750, 60, 20, "purple", 0, 70, 0.02));
            this.game.objetsGraphiques.push(new MovingObstacle(809.46, 750, 60, 18.18, "purple", 0, 70, 0.01));
            this.game.objetsGraphiques.push(new MovingObstacle(380, 477.36, 60, 20, "purple", 200, 0, 0.02));

            // 5. Obstacle Rotatif (Rouge)
            this.game.objetsGraphiques.push(new RotatingObstacle(254.79, 747.89, 200, 20, "purple", 0.02, 1366.08));

            // 6. Bumpers (Orange)
            this.game.objetsGraphiques.push(new bumper(1010.34, 672.03, 27.59, 24.52, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(146.74, 101.15, 36.78, 33.72, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(655.08, 230.94, 50, 50, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(147.51, 817.62, 38.31, 38.31, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(459.39, 675.10, 36.78, 36.78, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(529.89, 732.57, 27.59, 27.59, "orange", "down"));

            // 7. Sortie (Fin)
            this.game.fin = new fin(601.76, 107.89, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 17) {
            // --- NIVEAU 17 : Le Labyrinthe des Portes et Rotations ---
            
            // 1. Position du Joueur
            this.game.player = new Player(320.88, 85.67);
            this.game.player.w = 100;
            this.game.player.h = 53.33;
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Obstacles Fixes (Murs noirs)
            this.game.objetsGraphiques.push(new Obstacle(454.87, 182.45, 21.46, 485.82, "black"));
            this.game.objetsGraphiques.push(new Obstacle(16.48, 182.38, 438.31, 22.99, "black"));
            this.game.objetsGraphiques.push(new Obstacle(947.66, 176.40, 21.46, 485.82, "black"));
            this.game.objetsGraphiques.push(new Obstacle(38.85, 850.73, 1342.38, 25.90, "black"));
            this.game.objetsGraphiques.push(new Obstacle(152.26, 353.41, 151.57, 13.64, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1358.47, -0.31, 21.46, 851.65, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1163.14, 371.19, 197.39, 15.02, "black"));
            this.game.objetsGraphiques.push(new Obstacle(959.46, 175.94, 166.59, 17.93, "black"));

            // 3. Obstacles Rotatifs (RotatingObstacles)
            this.game.objetsGraphiques.push(new RotatingObstacle(707.66, 447.51, 500, 20, "black", 0.02, 2487.66));
            this.game.objetsGraphiques.push(new RotatingObstacle(231.03, 516.48, 200, 20, "black", 0.02, 635.02));

            // 4. Portes et Claviers (FadingDoors & Keypads)
            this.game.objetsGraphiques.push(new fadingDoor(163.56, -7.66, 20, 190.04, "pink", 3000, 1));
            this.game.objetsGraphiques.push(new fadingDoor(947.51, -0.77, 21.46, 174.71, "pink", 7000, 2));
            this.game.objetsGraphiques.push(new keypad(1290.80, 70.50, 41.38, 42.91, "pink", 3000, 1));
            this.game.objetsGraphiques.push(new keypad(198.08, 311.11, 44.44, 44.44, "pink", 7000, 2));

            // 5. Obstacles Mobiles (Violets)
            this.game.objetsGraphiques.push(new MovingObstacle(1130, 521.03, 60, 20, "purple", 100, 0, 0.05));
            this.game.objetsGraphiques.push(new MovingObstacle(690, 439.04, 50, 20, "purple", 200, 0, 0.05));
            this.game.objetsGraphiques.push(new MovingObstacle(669.23, 70, 60, 20, "purple", 0, 50, 0.05));

            // 6. Bumpers (Orange)
            this.game.objetsGraphiques.push(new bumper(11.40, 202.59, 50, 50, "orange", "down"));
            this.game.objetsGraphiques.push(new bumper(1107.66, 818.39, 35.25, 32.18, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(964.66, 581.90, 50, 50, "orange", "right"));
            this.game.objetsGraphiques.push(new bumper(1308.72, 384.96, 50, 50, "orange", "left"));
            this.game.objetsGraphiques.push(new bumper(1096.17, 145.59, 27.59, 29.12, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(1198.85, 345.59, 29.12, 29.12, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(440.23, 147.89, 36.78, 33.72, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(912.26, 615.33, 38.31, 32.18, "orange", "left"));
            this.game.objetsGraphiques.push(new bumper(56.61, 806.42, 50, 50, "orange", "up"));
            this.game.objetsGraphiques.push(new bumper(1331.49, 3.14, 27.59, 29.12, "orange", "down"));

            // 7. Téléporteur et Potion
            this.game.objetsGraphiques.push(new teleporter(979.69, 206.13, 29.12, 26.05, "#ae00ff", 300, 500));
            this.game.objetsGraphiques.push(new speedPotion(234.87, 796.69, 33.72, 42.39, "cyan", 5, 3000));

            // 8. Sortie (Fin)
            this.game.fin = new fin(42.38, 50.42, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        } else if (levelNumber === 18) {
            // --- NIVEAU 18 : La Prison des Claviers ---
            
            // 1. Joueur
            this.game.player = new Player(210.61, 406.48);
            this.game.player.w = 100;
            this.game.player.h = 53.33;
            this.game.objetsGraphiques.push(this.game.player);

            // 2. Obstacles Fixes (Murs noirs)
            this.game.objetsGraphiques.push(new Obstacle(135.25, 163.98, 1187.74, 15.33, "black"));
            this.game.objetsGraphiques.push(new Obstacle(138.39, 711.95, 1187.74, 15.33, "black"));
            this.game.objetsGraphiques.push(new Obstacle(1306.13, 164.75, 24.52, 557.85, "black"));
            this.game.objetsGraphiques.push(new Obstacle(136.09, 162.53, 24.52, 557.85, "black"));
            this.game.objetsGraphiques.push(new Obstacle(328.51, 423.14, 782.99, 22.84, "black"));

            // 3. Portes à évanouissement (FadingDoors)
            this.game.objetsGraphiques.push(new fadingDoor(429.50, 180.84, 32.18, 237.55, "red", 5000, 4));
            this.game.objetsGraphiques.push(new fadingDoor(641.07, 181.69, 32.18, 237.55, "pink", 3000, 5));
            this.game.objetsGraphiques.push(new fadingDoor(871.72, 181.69, 32.18, 237.55, "pink", 3000, 5));
            this.game.objetsGraphiques.push(new fadingDoor(1073.26, 183.98, 32.18, 237.55, "pink", 3000, 6));
            this.game.objetsGraphiques.push(new fadingDoor(429.58, 448.43, 32.18, 260.38, "red", 5000, 1));
            this.game.objetsGraphiques.push(new fadingDoor(643.37, 449.20, 32.18, 258.85, "pink", 3000, 2));
            this.game.objetsGraphiques.push(new fadingDoor(873.26, 448.43, 32.18, 257.32, "pink", 3000, 2));
            this.game.objetsGraphiques.push(new fadingDoor(1073.26, 446.13, 32.18, 258.85, "pink", 3000, 3));

            // 4. Claviers (Keypads)
            this.game.objetsGraphiques.push(new keypad(751.57, 564.21, 35.25, 35.25, "pink", 5000, 4));
            this.game.objetsGraphiques.push(new keypad(974.56, 560.38, 35.25, 35.25, "pink", 3000, 6));
            this.game.objetsGraphiques.push(new keypad(976.09, 279.16, 35.25, 35.25, "pink", 3000, 3));
            this.game.objetsGraphiques.push(new keypad(753.87, 284.52, 35.25, 35.25, "pink", 3000, 1));
            this.game.objetsGraphiques.push(new keypad(317.09, 281.46, 35.25, 35.25, "pink", 5000, 1));
            this.game.objetsGraphiques.push(new keypad(537.01, 286.05, 35.25, 35.25, "pink", 3000, 2));
            this.game.objetsGraphiques.push(new keypad(318.54, 563.37, 35.25, 35.25, "pink", 3000, 4));
            this.game.objetsGraphiques.push(new keypad(533.18, 563.45, 35.25, 35.25, "pink", 3000, 5));

            // 5. Potions de vitesse (SpeedPotions)
            this.game.objetsGraphiques.push(new speedPotion(796.88, 650.33, 30, 40.86, "cyan", 5, 3000));
            this.game.objetsGraphiques.push(new speedPotion(803.08, 189.10, 30, 38.18, "cyan", 5, 3000));

            // 6. Sortie (Fin)
            this.game.fin = new fin(1186.44, 389.12, 80, 80, "green", "assets/images/portal.png");
            this.game.objetsGraphiques.push(this.game.fin);
        }
    }
}