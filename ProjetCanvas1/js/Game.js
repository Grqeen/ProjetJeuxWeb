import Obstacle, { movingObstacle, RotatingObstacle } from "./Obstacle.js";
//import ObjetSouris from "./ObjetSouris.js";
import { rectsOverlap, circRectsOverlap, rectTriangleOverlap, rectRotatedRectOverlap } from "./collisions.js";
import { initListeners } from "./ecouteurs.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import Levels from "./levels.js";
import keypad from "./keypad.js";
import fadingDoor from "./fadingDoor.js";
import fin from "./fin.js";
import teleporter from "./teleporter.js";

export default class Game {
    objetsGraphiques = [];

    constructor(canvas, scoreElement) {
        this.canvas = canvas;
        this.timerElement = null; // Élément HTML pour le timer
        this.onLevelComplete = null; // Callback pour gérer la fin de niveau (score)
        this.startTime = 0; // Temps de début du niveau
        this.levelElement = null; // L'élément HTML pour afficher le niveau
        // etat du clavier
        this.inputStates = {
            mouseX: 0,
            mouseY: 0,
            ArrowRight: false,
            ArrowLeft: false,
            ArrowUp: false,
            ArrowDown: false
        };

        // Modificateurs de jeu
        this.playerSpeed = 5;
        this.rotationMultiplier = 1;
        this.bumperForce = 25;
        
        // Gestion du recul (Knockback)
        this.knockbackX = 0;
        this.knockbackY = 0;

        // Gestion du boost de vitesse
        this.speedBoostTimeout = null;
        this.activeSpeedBoost = 0;
        this.running = false;
        this.onFinish = null; // Callback appelé quand le jeu est fini
    }

    async init(canvas) {
        this.ctx = this.canvas.getContext("2d");

        // Initialisation du gestionnaire de niveaux
        this.levels = new Levels(this);

        // On initialise les écouteurs de touches, souris, etc.
        initListeners(this.inputStates, this.canvas);

        // Récupération des éléments du DOM pour les touches virtuelles
        this.keyUp = document.querySelector(".key-up kbd");
        this.keyDown = document.querySelector(".key-down kbd");
        this.keyLeft = document.querySelector(".key-left kbd");
        this.keyRight = document.querySelector(".key-right kbd");

        console.log("Game initialisé");
    }

    start(levelNumber = 1) {
        // Charge le niveau demandé
        this.levels.load(levelNumber);
        this.currentLevel = levelNumber;
        this.applyRotationMultiplier(); // Applique le multiplicateur aux nouveaux obstacles

        if (this.levelElement) {
            this.levelElement.innerText = levelNumber;
        }
        
        console.log("Game démarré niveau " + levelNumber);
        
        // Reset du knockback
        this.knockbackX = 0;
        this.knockbackY = 0;

        // Reset du timer au lancement du niveau
        this.startTime = Date.now();

        if (!this.running) {
            this.running = true;
            requestAnimationFrame(this.mainAnimationLoop.bind(this));
        }
    }

    mainAnimationLoop() {
        if (!this.running) return;
        // 1 - on efface le canvas avec une couleur de fond (gris clair) pour délimiter le niveau
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

        // Mise à jour des objets animés (sauf le joueur qui est géré par movePlayer)
        this.objetsGraphiques.forEach(obj => {
            if (obj !== this.player && obj.move) {
                obj.move();
            }
        });

        // on met à jouer la position de objetSouris avec la position de la souris
        // Pour un objet qui "suit" la souris mais avec un temps de retard, voir l'exemple
        // du projet "charQuiTire" dans le dossier COURS
        // this.objetSouris.x = this.inputStates.mouseX;
        // this.objetSouris.y = this.inputStates.mouseY;

        // On regarde si le joueur a atteint la sortie
        if (this.testCollisionFin()) {
            this.nextLevel();
        }

        // Mise à jour du Timer
        if (this.timerElement && this.running) {
            let elapsed = Date.now() - this.startTime;
            let seconds = Math.floor(elapsed / 1000);
            let ms = Math.floor((elapsed % 1000) / 10);
            this.timerElement.innerText = `${seconds}.${ms.toString().padStart(2, '0')}`;
        }

        // Mise à jour visuelle des touches du clavier virtuel
        // On ajoute ou enlève la classe "active" en fonction de l'état des touches
        // Le toggle(classe, condition) ajoute la classe si condition est vraie, l'enlève sinon
        if (this.keyUp) this.keyUp.classList.toggle("active", !!this.inputStates.ArrowUp);
        if (this.keyDown) this.keyDown.classList.toggle("active", !!this.inputStates.ArrowDown);
        if (this.keyLeft) this.keyLeft.classList.toggle("active", !!this.inputStates.ArrowLeft);
        if (this.keyRight) this.keyRight.classList.toggle("active", !!this.inputStates.ArrowRight);
    }

    movePlayer() {
        let inputVx = 0;
        let inputVy = 0;

        // Vitesse de base du joueur
        let vitesse = this.playerSpeed;
        
        // Si le boost est actif
        vitesse += this.activeSpeedBoost;

        if(this.inputStates.ArrowRight) inputVx = vitesse;
        if(this.inputStates.ArrowLeft) inputVx = -vitesse;
        if(this.inputStates.ArrowUp) inputVy = -vitesse;
        if(this.inputStates.ArrowDown) inputVy = vitesse;

        // On ajoute le knockback à la vitesse
        this.player.vitesseX = inputVx + this.knockbackX;
        this.player.vitesseY = inputVy + this.knockbackY;

        this.player.move();

        // Friction sur le knockback
        this.knockbackX *= 0.9;
        this.knockbackY *= 0.9;
        if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
        if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0;

        this.testCollisionsPlayer();
    }

    testCollisionsPlayer() {
        // Teste collision avec les bords du canvas
        this.testCollisionPlayerBordsEcran();

        // Teste collision avec les obstacles
        //this.testCollisionPlayerObstacles();

        // Gestion améliorée des collisions avec les obstacles
        this.handleCollisionObstacle();

        this.testCollisionItems();

        this.testCollisionFin();

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
                    console.log("Collision avec obstacle");
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
                // Si l'obstacle est une porte invisible, on ne gère pas la collision
                if (obstacle instanceof fadingDoor && !obstacle.visible) return;

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

                    // 1. On annule le mouvement pour sortir du bumper (éviter de rester coincé)
                    this.player.x -= this.player.vitesseX;
                    this.player.y -= this.player.vitesseY;

                    // 2. Calcul de la direction du rebond
                    let vx = this.player.vitesseX;
                    let vy = this.player.vitesseY;
                    let mag = Math.sqrt(vx * vx + vy * vy);
                    let forceRebond = this.bumperForce;

                    if (mag > 0.1) {
                        this.knockbackX = -(vx / mag) * forceRebond;
                        this.knockbackY = -(vy / mag) * forceRebond;
                    } else {
                        // Si immobile, on repousse depuis le centre du bumper
                        let dx = this.player.x - (obstacle.x + obstacle.w/2);
                        let dy = this.player.y - (obstacle.y + obstacle.h/2);
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if(dist > 0) {
                            this.knockbackX = (dx/dist) * forceRebond;
                            this.knockbackY = (dy/dist) * forceRebond;
                        }
                    }
                }
            } else if (obstacle instanceof RotatingObstacle) {
                if (rectRotatedRectOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.angle)) {
                    console.log("Collision avec obstacle rotatif");
                    // On repousse le joueur vers l'extérieur du centre de rotation
                    let dx = this.player.x - obstacle.x;
                    let dy = this.player.y - obstacle.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        this.player.x += (dx / dist) * 10;
                        this.player.y += (dy / dist) * 10;
                    }
                }
            }else if (obstacle instanceof movingObstacle) {
                if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h)) {
                    console.log("Collision avec obstacle mobile");
                    // On repousse le joueur vers l'extérieur du centre de rotation
                    let dx = this.player.x - obstacle.x;
                    let dy = this.player.y - obstacle.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        this.player.x += (dx / dist) * 10;
                        this.player.y += (dy / dist) * 10;
                    }
                }
                // on gère la collision de l'obstacle mobile avec un obstacle fixe pour qu'il puisse rebondir dessus
                this.objetsGraphiques.forEach(o => {
                    if (o instanceof Obstacle && o !== obstacle) {
                        if (rectsOverlap(obstacle.x, obstacle.y, obstacle.w, obstacle.h, o.x, o.y, o.w, o.h)) {
                            // Inverse la direction de l'obstacle mobile
                            obstacle.moveX = -obstacle.moveX;
                            obstacle.moveY = -obstacle.moveY;
                        }
                    }
                });
                // on gère aussi la collision de l'obstacle mobile avec les bords du canvas pour qu'il puisse rebondir dessus
                if (obstacle.x < 0 || obstacle.x + obstacle.w > this.canvas.width) {
                    obstacle.moveX = -obstacle.moveX;
                }
                if (obstacle.y < 0 || obstacle.y + obstacle.h > this.canvas.height) {
                    obstacle.moveY = -obstacle.moveY;
                }
                // on gère aussi la collision de l'obstacle mobile avec les autres obstacles mobiles pour qu'ils puissent rebondir dessus
                this.objetsGraphiques.forEach(o => {
                    if (o instanceof movingObstacle && o !== obstacle) {
                        if (rectsOverlap(obstacle.x, obstacle.y, obstacle.w, obstacle.h, o.x, o.y, o.w, o.h)) {
                            // Inverse la direction de l'obstacle mobile
                            obstacle.moveX = -obstacle.moveX;
                            obstacle.moveY = -obstacle.moveY;
                        }
                    }
                });
                // on gère aussi la collision de l'obstacle mobile avec les bumpers pour qu'il puisse rebondir dessus
                this.objetsGraphiques.forEach(o => {
                    if (o instanceof bumper) {
                        if (rectTriangleOverlap(obstacle.x, obstacle.y, obstacle.w, obstacle.h, o.x, o.y, o.w, o.h)) {
                            // Inverse la direction de l'obstacle mobile
                            obstacle.moveX = -obstacle.moveX;
                            obstacle.moveY = -obstacle.moveY;
                        }
                    }
                });
                // on gère aussi la collision de l'obstacle mobile avec les portes qui quand elles deviennent invisibles ne gèrent plus la collision et on repousse l'obstacle mobile quand la devient visible à nouveau pour éviter qu'il reste coincé dedans
                this.objetsGraphiques.forEach(o => {
                    if (o instanceof fadingDoor) {
                        if (rectsOverlap(obstacle.x, obstacle.y, obstacle.w, obstacle.h, o.x, o.y, o.w, o.h)) {
                            if (!o.visible) {
                                // Inverse la direction de l'obstacle mobile
                                obstacle.moveX = -obstacle.moveX;
                                obstacle.moveY = -obstacle.moveY;
                            }
                        }
                    }
                });
            }else if (obstacle instanceof teleporter) {
                if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h)) {
                    console.log("Collision avec téléporteur : Téléportation !");
                    // On téléporte le joueur à la destination du téléporteur
                    this.player.x = obstacle.destinationX;
                    this.player.y = obstacle.destinationY;
                }
            }
        });
    }

    testCollisionItems() {
    // On parcourt le tableau à l'envers pour pouvoir supprimer des éléments sans casser la boucle
    for (let i = this.objetsGraphiques.length - 1; i >= 0; i--) {
        let obj = this.objetsGraphiques[i];
        if (obj instanceof speedPotion) {
            if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
                console.log("Collision avec SpeedPotion : Vitesse augmentée !");
                
                // On active le boost
                if (this.speedBoostTimeout) clearTimeout(this.speedBoostTimeout);
                this.activeSpeedBoost = obj.vitesse;
                this.speedBoostTimeout = setTimeout(() => {
                    this.activeSpeedBoost = 0;
                }, obj.temps);

                this.objetsGraphiques.splice(i, 1);  // On retire l'objet ramassé
            }
        }
        if (obj instanceof sizePotion) {
            if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
                console.log("Collision avec SizePotion : Taille modifier !");

                // on change la taille du joueur
                this.player.w += obj.tailleW;
                this.player.h += obj.tailleH;
                this.objetsGraphiques.splice(i, 1);  // On retire l'objet ramassé
            }
        }
        if (obj instanceof keypad) {
            if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
                console.log("Collision avec keypad : Porte associée " + obj.id + " activée !");
                // On cherche la porte associée à ce keypad
                this.objetsGraphiques.forEach(o => {
                    if (o instanceof fadingDoor && o.id === obj.id) {
                        o.visible = false; // On rend la porte invisible (on pourrait aussi la retirer du tableau)
                        console.log("Porte " + o.id + " désactivée !");
                    }
                });
                this.objetsGraphiques.splice(i, 1);  // On retire le keypad ramassé
                // faire en sorte que le bouton et la porte reaparaissent après un certain temps
                setTimeout(() => {
                    // On réactive la porte
                    this.objetsGraphiques.forEach(o => {
                        if (o instanceof fadingDoor && o.id === obj.id) {
                            o.visible = true;
                            console.log("Porte " + o.id + " réactivée !");
                        }
                    });
                    // On remet les keypads
                    this.objetsGraphiques.forEach(o => {
                        if (o instanceof keypad && o.id === obj.id) {
                            o.visible = true;
                            console.log("Keypad " + o.id + " réactivé !");
                        }
                    });
                }, obj.temps);
            }
        }
    }
}

// Teste si le joueur a ateint la fin du niveau
testCollisionFin() {
    for (let obj of this.objetsGraphiques) {
        if (obj instanceof fin) {
            // Le joueur est un rectangle, la fin est un cercle
            // On utilise la fonction de collision cercle/rectangle
            if (circRectsOverlap(
                    this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h,
                obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2
            )) {
                return true;
            }
        }
    }
    return false;
}

    nextLevel() {
        // Enregistrement du temps dans le leaderboard
        if (this.onLevelComplete) {
            let elapsed = (Date.now() - this.startTime) / 1000;
            this.onLevelComplete(this.currentLevel, elapsed);
        }

        // On incrémente le niveau
        this.currentLevel++;
        // On essaie de charger le niveau suivant
        this.levels.load(this.currentLevel);

        // Si le tableau d'objets est vide, c'est que le niveau n'existe pas
        if (this.objetsGraphiques.length === 0) {
            this.running = false; // On arrête la boucle de jeu
            if (this.onFinish) this.onFinish(); // On appelle le callback de fin
        } else {
            // On reset le timer pour le nouveau niveau
            this.startTime = Date.now();

            if (this.levelElement) this.levelElement.innerText = this.currentLevel;
        }
    }

    applyRotationMultiplier() {
        this.objetsGraphiques.forEach(obj => {
            if (obj instanceof RotatingObstacle) {
                obj.angleSpeed = obj.initialAngleSpeed * this.rotationMultiplier;
            }
        });
    }
}
