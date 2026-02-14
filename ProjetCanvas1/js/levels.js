import Player from "./Player.js";
import Obstacle, { RotatingObstacle, IntermittentRotatingObstacle, MovingObstacle, CircleObstacle, TexturedObstacle, PipeObstacle, ImageObstacle, PipeCorner } from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import fadingDoor from "./fadingDoor.js";
import keypad from "./keypad.js";
import teleporter from "./teleporter.js";

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
            this.game.objetsGraphiques.push(new keypad(700, 740, 25, 25, "orange", 3000, 88));
            this.game.objetsGraphiques.push(new fadingDoor(roomRight, 200, 10, 610, "orange", 3000, 88)); // Porte sur le mur de droite
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
        }
    }
}