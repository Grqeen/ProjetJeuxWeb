import Player from "./Player.js";
import Obstacle from "./Obstacle.js";
//import ObjetSouris from "./ObjetSouris.js";
import { rectsOverlap, testCollisionFin } from "./collisions.js";
import { initListeners } from "./ecouteurs.js";
import fin from "./fin.js";

export default class Game {
    objetsGraphiques = [];

    constructor(canvas, scoreElement, speedInputElement) {
        this.canvas = canvas;
        this.scoreElement = scoreElement; // L'élément HTML pour afficher le score
        this.speedInputElement = speedInputElement; // L'input range pour la vitesse
        this.score = 0; // Le score actuel
        // etat du clavier
        this.inputStates = {
            mouseX: 0,
            mouseY: 0,
        };
    }

    async init(canvas) {
        this.ctx = this.canvas.getContext("2d");

        this.player = new Player(100, 100);
        this.objetsGraphiques.push(this.player);

        // Un objert qui suite la souris, juste pour tester
        //this.objetSouris = new ObjetSouris(200, 200, 25, 25, "orange");
        //this.objetsGraphiques.push(this.objetSouris);


        // On cree deux obstacles
        let obstacle1 = new Obstacle(300, 0, 40, 600, "red");
        this.objetsGraphiques.push(obstacle1);
        let obstacle2 = new Obstacle(500, 500, 100, 100, "blue");
        this.objetsGraphiques.push(obstacle2);
        let obstacle3 = new Obstacle(900, 300, 40, 600, "yellow");
        this.objetsGraphiques.push(obstacle3);
        let obstacle4 = new Obstacle(750, 500, 100, 100, "purple");
        this.objetsGraphiques.push(obstacle4);

        this.fin = new fin(1100, 50, 50, 50, "green");
        this.objetsGraphiques.push(this.fin);

        // On ajoute la sortie
        // TODO

        // On initialise les écouteurs de touches, souris, etc.
        initListeners(this.inputStates, this.canvas, this.speedInputElement);

        console.log("Game initialisé");
    }

    start() {
        console.log("Game démarré");

        // On démarre une animation à 60 images par seconde
        requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }

    mainAnimationLoop() {
        // 1 - on efface le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 2 - on dessine les objets à animer dans le jeu
        // ici on dessine le monstre
        this.drawAllObjects();

        // 3 - On regarde l'état du clavier, manette, souris et on met à jour
        // l'état des objets du jeu en conséquence
        this.update();

        // 4 - on demande au navigateur d'appeler la fonction mainAnimationLoop
        // à nouveau dans 1/60 de seconde
        requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }

    drawAllObjects() {
        // Dessine tous les objets du jeu
        this.objetsGraphiques.forEach(obj => {
            obj.draw(this.ctx);
        });
    }

    update() {
        // Appelée par mainAnimationLoop
        // donc tous les 1/60 de seconde
        
        // Déplacement du joueur. 
        this.movePlayer();

        // on met à jouer la position de objetSouris avec la position de la souris
        // Pour un objet qui "suit" la souris mais avec un temps de retard, voir l'exemple
        // du projet "charQuiTire" dans le dossier COURS
        // this.objetSouris.x = this.inputStates.mouseX;
        // this.objetSouris.y = this.inputStates.mouseY;

        // On regarde si le joueur a atteint la sortie
        // TODO

        // Mise à jour du score dans le HTML
        // (On pourrait optimiser en ne le faisant que si le score change)
        if(this.scoreElement) {
            this.scoreElement.innerText = this.score;
        }
        testCollisionFin(this.player, this.objetsGraphiques);
    }

    movePlayer() {
        this.player.vitesseX = 0;
        this.player.vitesseY = 0;

        // On récupère la vitesse depuis l'input HTML
        // On convertit en nombre avec Number() car .value renvoie une chaîne de caractères
        // Valeur par défaut 3 si l'input n'existe pas
        let vitesse = this.speedInputElement ? Number(this.speedInputElement.value) : 3;
        
        if(this.inputStates.ArrowRight) {
            this.player.vitesseX = vitesse;
        } 
        if(this.inputStates.ArrowLeft) {
            this.player.vitesseX = -vitesse;
        } 

        if(this.inputStates.ArrowUp) {
            this.player.vitesseY = -vitesse;
        } 

        if(this.inputStates.ArrowDown) {
            this.player.vitesseY = vitesse;
        } 

        this.player.move();

        this.testCollisionsPlayer();
    }

    testCollisionsPlayer() {
        // Teste collision avec les bords du canvas
        this.testCollisionPlayerBordsEcran();

        // Teste collision avec les obstacles
        this.testCollisionPlayerObstacles();
       
    }

    testCollisionPlayerBordsEcran() {
        // Raoppel : le x, y du joueur est en son centre, pas dans le coin en haut à gauche!
        if(this.player.x - this.player.w/2 < 0) {
            // On stoppe le joueur
            this.player.vitesseX = 0;
            // on le remet au point de contaxct
            this.player.x = this.player.w/2;
        }
        if(this.player.x + this.player.w/2 > this.canvas.width) {
            this.player.vitesseX = 0;
            // on le remet au point de contact
            this.player.x = this.canvas.width - this.player.w/2;
        }

        if(this.player.y - this.player.h/2 < 0) {
            this.player.y = this.player.h/2;
            this.player.vitesseY = 0;

        }
       
        if(this.player.y + this.player.h/2 > this.canvas.height) {
            this.player.vitesseY = 0;
            this.player.y = this.canvas.height - this.player.h/2;
        }
    }

    testCollisionPlayerObstacles() {
        this.objetsGraphiques.forEach(obj => {
            if(obj instanceof Obstacle) {
                if(rectsOverlap(this.player.x-this.player.w/2, this.player.y - this.player.h/2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
                    // collision

                    // ICI TEST BASIQUE QUI ARRETE LE JOUEUR EN CAS DE COLLIION.
                    // SI ON VOULAIT FAIRE MIEUX, ON POURRAIT PAR EXEMPLE REGARDER OU EST LE JOUEUR
                    // PAR RAPPORT A L'obstacle courant : il est à droite si son x est plus grand que le x de l'obstacle + la largeur de l'obstacle
                    // il est à gauche si son x + sa largeur est plus petit que le x de l'obstacle
                    // etc.
                    // Dans ce cas on pourrait savoir comment le joueur est entré en collision avec l'obstacle et réagir en conséquence
                    // par exemple en le repoussant dans la direction opposée à celle de l'obstacle...
                    // Là par défaut on le renvoie en x=10 y=10 et on l'arrête
                    console.log("Collision avec obstacle");
                    // Exemple : on perd des points ou on reset le score
                    this.score = 0;
                    this.player.x = 10;
                    this.player.y = 10;
                    this.player.vitesseX = 0;
                    this.player.vitesseY = 0;
                }
            }
        });
    }
}