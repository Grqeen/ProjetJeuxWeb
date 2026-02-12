import Obstacle, { RotatingObstacle } from "./Obstacle.js";
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
        this.speedBoostEndTime = 0;
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

    restartLevel() {
        console.log("Sortie de zone détectée ! Retour au spawn.");
        this.levels.load(this.currentLevel);
        this.applyRotationMultiplier();
        this.startTime = Date.now();
        this.knockbackX = 0;
        this.knockbackY = 0;
    }

    checkLevel9Bounds() {
        if (this.currentLevel !== 9) return;

        let p = this.player;
        // Les zones valides définies dans ton levels.js pour le Niveau 9 sont :
        // - Couloir vertical : x entre 50 et 250, y entre 50 et 950
        // - Couloir horizontal : x entre 50 et 1350, y entre 750 et 950

        let inVerticalCorridor = (p.x >= 50 && p.x <= 250 && p.y >= 50 && p.y <= 950);
        let inHorizontalCorridor = (p.x >= 50 && p.x <= 1350 && p.y >= 750 && p.y <= 950);

        // Si le joueur n'est dans AUCUNE de ces deux zones, il a traversé un mur
        if (!inVerticalCorridor && !inHorizontalCorridor) {
            this.restartLevel();
        }
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

        // Détection de sortie de mur pour le Niveau 9
        this.checkLevel9Bounds();

        // --- LOGIQUE NIVEAU 5 : Portail à triple téléportation ---
        if (this.currentLevel === 5 && this.finPortal) {
            let dx = this.player.x - this.finPortal.x;
            let dy = this.player.y - this.finPortal.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Si le joueur s'approche à moins de 250 pixels
            if (distance < 250) {
                if (this.portalStage === 0) {
                    // Premier saut : vers le bas à droite
                    this.finPortal.x = 1250;
                    this.finPortal.y = 850;
                    this.portalStage = 1;
                    console.log("Portal : 'Nope ! Attrape-moi en bas !'");
                } else if (this.portalStage === 1) {
                    // DEUXIÈME saut (3ème position) : Sous la barre rouge à gauche
                    this.finPortal.x = 150;
                    this.finPortal.y = 650;
                    this.portalStage = 2;
                    console.log("Portal : 'Plus vite ! Je suis caché sous la barre !'");
                }
            }
        }

        // --- LOGIQUE NIVEAU 10 : Déplacement du Portail ---
        if (this.currentLevel === 10 && this.finPortal) {
            let dx = this.player.x - this.finPortal.x;
            let dy = this.player.y - this.finPortal.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // DÉTECTION PLUS LOIN : Changé de 150 à 250 pixels
            if (distance < 250) {
                if (this.portalStage === 0) {
                    // Étape 2 : En dessous de l'œil droit
                    this.finPortal.x = 1050;
                    this.finPortal.y = 450;
                    this.portalStage = 1;
                } else if (this.portalStage === 1) {
                    // Étape 3 : Tout en bas à droite
                    this.finPortal.x = 1300;
                    this.finPortal.y = 850;
                    this.portalStage = 2;
                } else if (this.portalStage === 2) {
                    // Étape 4 : En dessous de la bouche au milieu
                    this.finPortal.x = 675;
                    this.finPortal.y = 850;
                    this.portalStage = 3;
                } else if (this.portalStage === 3) {
                    // Étape 5 : Position finale (Ajustée pour ne pas être dans le mur)
                    // On le place à x=70, y=70 (proche du spawn) pour éviter le bloc noir à x=150
                    this.finPortal.x = 70;
                    this.finPortal.y = 70;
                    this.portalStage = 4;
                }
            }
        }

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
        // Si le boost est actif (temps actuel < temps de fin du boost)
        if (Date.now() < this.speedBoostEndTime) {
            vitesse += this.activeSpeedBoost;
        }

        if (this.inputStates.ArrowRight) inputVx = vitesse;
        if (this.inputStates.ArrowLeft) inputVx = -vitesse;
        if (this.inputStates.ArrowUp) inputVy = -vitesse;
        if (this.inputStates.ArrowDown) inputVy = vitesse;

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
        // 1. Détection de sortie de map (Mort)
        // Si le joueur est poussé au-delà des limites du canvas (1400x1000)
        if (this.player.x + this.player.w / 2 < -50 ||
            this.player.x - this.player.w / 2 > this.canvas.width + 50 ||
            this.player.y + this.player.h / 2 < -50 ||
            this.player.y - this.player.h / 2 > this.canvas.height + 50) {

            this.restartLevel();
            return;
        }

        // 2. Comportement normal (Murs invisibles des bords)
        // On garde le clamping pour les déplacements classiques au clavier
        if (this.player.x - this.player.w / 2 < 0) {
            this.player.x = this.player.w / 2;
            this.player.vitesseX = 0;
        }
        if (this.player.x + this.player.w / 2 > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.w / 2;
            this.player.vitesseX = 0;
        }
        if (this.player.y - this.player.h / 2 < 0) {
            this.player.y = this.player.h / 2;
            this.player.vitesseY = 0;
        }
        if (this.player.y + this.player.h / 2 > this.canvas.height) {
            this.player.y = this.canvas.height - this.player.h / 2;
            this.player.vitesseY = 0;
        }
    }

    testCollisionPlayerObstacles() {
        this.objetsGraphiques.forEach(obj => {
            if (obj instanceof Obstacle) {
                if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
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
                if (rectTriangleOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.direction)) {
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
                        let dx = this.player.x - (obstacle.x + obstacle.w / 2);
                        let dy = this.player.y - (obstacle.y + obstacle.h / 2);
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            this.knockbackX = (dx / dist) * forceRebond;
                            this.knockbackY = (dy / dist) * forceRebond;
                        }
                    }
                }
            } else if (obstacle instanceof RotatingObstacle) {
                let collision = rectRotatedRectOverlap(
                    this.player.x - this.player.w / 2,
                    this.player.y - this.player.h / 2,
                    this.player.w, this.player.h,
                    obstacle.x, obstacle.y,
                    obstacle.w, obstacle.h,
                    obstacle.angle
                );

                if (collision) {
                    // Calcul de la direction pour repousser le joueur
                    let dx = this.player.x - obstacle.x;
                    let dy = this.player.y - obstacle.y;
                    let dot = dx * collision.axis.x + dy * collision.axis.y;

                    if (dot < 0) {
                        collision.axis.x *= -1;
                        collision.axis.y *= -1;
                    }

                    // On déplace juste le joueur sans le tuer
                    this.player.x += collision.axis.x * (collision.overlap + 1);
                    this.player.y += collision.axis.y * (collision.overlap + 1);

                    // On garde un petit effet de choc
                    this.knockbackX = collision.axis.x * 8;
                    this.knockbackY = collision.axis.y * 8;

                    this.player.vitesseX = 0;
                    this.player.vitesseY = 0;
                }
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
                    this.activeSpeedBoost = obj.vitesse;
                    this.speedBoostEndTime = Date.now() + obj.temps;

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