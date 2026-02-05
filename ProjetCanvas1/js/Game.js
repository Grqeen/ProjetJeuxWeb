import Obstacle from "./Obstacle.js";
//import ObjetSouris from "./ObjetSouris.js";
import { rectsOverlap, testCollisionFin, rectTriangleOverlap } from "./collisions.js";
import { initListeners } from "./ecouteurs.js";
import bumper from "./bumper.js";
import Levels from "./levels.js";

export default class Game {
    objetsGraphiques = [];

    constructor(canvas, scoreElement, speedInputElement) {
        this.canvas = canvas;
        this.scoreElement = scoreElement; // L'élément HTML pour afficher le score
        this.speedInputElement = speedInputElement; // L'input range pour la vitesse
        this.score = 0; // Le score actuel
        this.levelElement = null; // L'élément HTML pour afficher le niveau
        // etat du clavier
        this.inputStates = {
            mouseX: 0,
            mouseY: 0,
        };
        this.running = false;
        this.onFinish = null; // Callback appelé quand le jeu est fini
    }

    async init(canvas) {
        this.ctx = this.canvas.getContext("2d");

        // Initialisation du gestionnaire de niveaux
        this.levels = new Levels(this);

        // On initialise les écouteurs de touches, souris, etc.
        initListeners(this.inputStates, this.canvas, this.speedInputElement);

        console.log("Game initialisé");
    }

    start(levelNumber = 1) {
        // Charge le niveau demandé
        this.levels.load(levelNumber);
        this.currentLevel = levelNumber;

        if (this.levelElement) {
            this.levelElement.innerText = levelNumber;
        }
        
        console.log("Game démarré niveau " + levelNumber);
        this.running = true;

        // On démarre une animation à 60 images par seconde
        requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }

    mainAnimationLoop() {
        if (!this.running) return;
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
        if (testCollisionFin(this.player, this.objetsGraphiques)) {
            this.nextLevel();
        }

        // Mise à jour du score dans le HTML
        // (On pourrait optimiser en ne le faisant que si le score change)
        if(this.scoreElement) {
            this.scoreElement.innerText = this.score;
        }
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
        //this.testCollisionPlayerObstacles();

        // Gestion améliorée des collisions avec les obstacles
        this.handleCollisionObstacle();
       
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

    handleCollisionObstacle() {
        this.objetsGraphiques.forEach(obstacle => {
            if (obstacle instanceof Obstacle) {
                if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h)) {
                    // Calcul des coordonnées des bords du joueur (x, y sont au centre)
                    let playerLeft = this.player.x - this.player.w / 2;
                    let playerRight = this.player.x + this.player.w / 2;
                    let playerTop = this.player.y - this.player.h / 2;
                    let playerBottom = this.player.y + this.player.h / 2;

                    // Calcul des coordonnées des bords de l'obstacle (x, y sont en haut à gauche)
                    let obstacleLeft = obstacle.x;
                    let obstacleRight = obstacle.x + obstacle.w;
                    let obstacleTop = obstacle.y;
                    let obstacleBottom = obstacle.y + obstacle.h;

                    // Calcul de l'enfoncement (overlap) sur chaque côté
                    let overlapLeft = playerRight - obstacleLeft;
                    let overlapRight = obstacleRight - playerLeft;
                    let overlapTop = playerBottom - obstacleTop;
                    let overlapBottom = obstacleBottom - playerTop;

                    // On cherche le plus petit enfoncement pour savoir de quel côté corriger
                    // (C'est le côté par lequel on est entré le moins profondément)
                    let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    if (minOverlap === overlapLeft) {
                        // Collision par la gauche de l'obstacle (le joueur allait vers la droite)
                        this.player.x = obstacleLeft - this.player.w / 2;
                        this.player.vitesseX = 0;
                    } else if (minOverlap === overlapRight) {
                        // Collision par la droite de l'obstacle
                        this.player.x = obstacleRight + this.player.w / 2;
                        this.player.vitesseX = 0;
                    } else if (minOverlap === overlapTop) {
                        // Collision par le haut de l'obstacle
                        this.player.y = obstacleTop - this.player.h / 2;
                        this.player.vitesseY = 0;
                    } else if (minOverlap === overlapBottom) {
                        // Collision par le bas de l'obstacle
                        this.player.y = obstacleBottom + this.player.h / 2;
                        this.player.vitesseY = 0;
                    }
                }
            } else if (obstacle instanceof bumper) {
                // Test collision Rectangle (Joueur) vs Triangle (Bumper)
                if (rectTriangleOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h)) {
                    console.log("Collision avec bumper");
                    // Effet de rebond basique
                    this.player.vitesseX = -this.player.vitesseX;
                    this.player.vitesseY = -this.player.vitesseY;
                    // On déplace légèrement le joueur pour éviter qu'il ne reste collé
                    this.player.x += this.player.vitesseX * 25;
                    this.player.y += this.player.vitesseY * 25;
                }
            }
        });
    }

    nextLevel() {
        // On incrémente le niveau
        this.currentLevel++;
        // On essaie de charger le niveau suivant
        this.levels.load(this.currentLevel);

        // Si le tableau d'objets est vide, c'est que le niveau n'existe pas
        if (this.objetsGraphiques.length === 0) {
            this.running = false; // On arrête la boucle de jeu
            if (this.onFinish) this.onFinish(); // On appelle le callback de fin
        } else {
            if (this.levelElement) this.levelElement.innerText = this.currentLevel;
        }
    }
}