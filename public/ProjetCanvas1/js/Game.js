import Obstacle, {
  RotatingObstacle,
  CircleObstacle,
  MovingObstacle,
} from "./Obstacle.js";
import {
  rectsOverlap,
  circRectsOverlap,
  rectTriangleOverlap,
  rectRotatedRectOverlap,
  circleRect,
} from "./collisions.js";
import { initListeners } from "./ecouteurs.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import Levels from "./levels.js";
import keypad from "./keypad.js";
import fadingDoor from "./fadingDoor.js";
import fin from "./fin.js";
import teleporter from "./teleporter.js";
import Fan from "./Fan.js";

// Constantes pour le blocage FPS
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export default class Game {
  objetsGraphiques = [];

  constructor(canvas, scoreElement) {
    this.canvas = canvas;
    this.timerElement = null; // Élément HTML pour le timer
    this.onLevelComplete = null; // Callback pour gérer la fin de niveau (score)
    this.startTime = 0; // Temps de début du niveau
    this.levelElement = null; // L'élément HTML pour afficher le niveau
    
    // --- NOUVEAU : Gestion du temps pour les FPS ---
    this.lastRenderTime = 0;

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
    this.maxLevel = null; // Si défini, le jeu s'arrête après ce niveau
    this.selectedObject = null; // Objet sélectionné dans l'éditeur

    // Compte à rebours
    this.countdownActive = false;
    this.countdownValue = 3;
    this.countdownStartTime = 0;
    this.countdownOverlay = null;
    this.countdownText = null;
    this.lives = 3; // Nombre de vies initial
  }

  async init(canvas) {
    this.ctx = this.canvas.getContext("2d");

    // niveaux
    this.levels = new Levels(this);

    // ecouteurs
    initListeners(this.inputStates, this.canvas);

    // touches
    this.keyUp = document.querySelector(".key-up kbd");
    this.keyDown = document.querySelector(".key-down kbd");
    this.keyLeft = document.querySelector(".key-left kbd");
    this.keyRight = document.querySelector(".key-right kbd");

    console.log("Game initialisé");
  }

  restartLevel() {
    console.log("Sortie de zone détectée ! Retour au spawn.");
    // reset
    this.activeSpeedBoost = 0;
    this.speedBoostEndTime = 0;
    this.levels.load(this.currentLevel);

    this.applyRotationMultiplier();
    this.startTime = Date.now();
    this.knockbackX = 0;
    this.knockbackY = 0;
  }

  start(levelNumber = 1) {
    // charge niveau
    this.activeSpeedBoost = 0;
    this.speedBoostEndTime = 0;
    this.levels.load(levelNumber);
    this.currentLevel = levelNumber;
    this.updateBackground();
    this.applyRotationMultiplier(); // rotation

    if (this.levelElement) {
      this.levelElement.innerText = levelNumber;
    }

    console.log("Game démarré niveau " + levelNumber);

    // reset recul
    this.knockbackX = 0;
    this.knockbackY = 0;

    // reset timer
    this.startTime = Date.now();

    if (!this.running) {
      this.running = true;
      // --- NOUVEAU : Initialisation du temps de rendu ---
      this.lastRenderTime = performance.now();
      requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }
  }

  startCustomLevel(levelData) {
    this.currentLevel = "custom";
    this.countdownActive = false;
    this.removeCountdownOverlay();
    // Réinitialisation des modificateurs
    this.activeSpeedBoost = 0;
    this.speedBoostEndTime = 0;
    this.levels.loadFromJSON(levelData);
    this.applyRotationMultiplier();
    if (this.levelElement) this.levelElement.innerText = "Custom";
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.startTime = Date.now();
    if (!this.running) {
      this.running = true;
      // --- NOUVEAU : Initialisation du temps de rendu ---
      this.lastRenderTime = performance.now();
      requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }
  }

  mainAnimationLoop(currentTime) {
    if (!this.running) return;

    // 1 - On demande immédiatement la prochaine frame
    requestAnimationFrame(this.mainAnimationLoop.bind(this));

    // 2 - Calcul du temps écoulé depuis le dernier rendu
    const delta = currentTime - this.lastRenderTime;

    // 3 - Si le temps écoulé est inférieur à l'intervalle cible (16.6ms), on sort
    if (delta < FRAME_INTERVAL) return;

    // 4 - On ajuste lastRenderTime pour le prochain cycle
    // (Le modulo permet de compenser les petits décalages de temps)
    this.lastRenderTime = currentTime - (delta % FRAME_INTERVAL);

    // 5 - Code de rendu habituel
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawAllObjects();

    if (this.countdownActive) {
      this.drawCountdown();
    } else {
      this.update();
    }
  }

  updateBackground() {
    if (this.currentLevel >= 11) {
      this.canvas.style.backgroundImage =
        "url('assets/images/gameBackgroundPrison.png')";
    } else {
      this.canvas.style.backgroundImage =
        "url('assets/images/gameBackground.png')";
    }
  }

  update() {
    // joueur
    this.movePlayer();

    // logique specifique niveau
    if (this.levelUpdate) this.levelUpdate();

    // update objets
    this.objetsGraphiques.forEach((obj) => {
      if (obj !== this.player && obj.move) {
        obj.move();
      }
    });

    // fin
    if (this.testCollisionFin()) {
      this.nextLevel();
    }
  }

  createCountdownOverlay() {
    this.removeCountdownOverlay();

    this.countdownOverlay = document.createElement("div");
    Object.assign(this.countdownOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      zIndex: "10000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none"
    });

    this.countdownText = document.createElement("div");
    Object.assign(this.countdownText.style, {
      fontFamily: "'Lilita One', cursive",
      fontSize: "200px",
      color: "white",
      textShadow: "8px 8px 0 #000"
    });

    this.countdownOverlay.appendChild(this.countdownText);
    document.body.appendChild(this.countdownOverlay);
  }

  removeCountdownOverlay() {
    if (this.countdownOverlay) {
      this.countdownOverlay.remove();
      this.countdownOverlay = null;
      this.countdownText = null;
    }
  }

  drawCountdown() {
    let now = Date.now();
    let elapsed = now - this.countdownStartTime;
    
    if (elapsed < 1000) {
      this.countdownValue = 3;
    } else if (elapsed < 2000) {
      this.countdownValue = 2;
    } else if (elapsed < 3000) {
      this.countdownValue = 1;
    } else if (elapsed < 4000) {
      this.countdownValue = "GO !";
    } else {
      this.countdownActive = false;
      this.startTime = Date.now(); 
      this.removeCountdownOverlay();
      return;
    }

    if (this.countdownText) {
      this.countdownText.innerText = this.countdownValue;
      let subTime = elapsed % 1000;
      let scale = 1.5 - (subTime / 1000) * 0.5; 
      if (this.countdownValue === "GO !") scale = 1 + (subTime / 1000) * 0.5;
      this.countdownText.style.transform = `scale(${scale})`;
    }
  }

  drawAllObjects() {
    this.objetsGraphiques.forEach(obj => {
      obj.draw(this.ctx);

      if (this.selectedObject === obj) {
        this.ctx.save();
        this.ctx.strokeStyle = "cyan";
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = "cyan";
        this.ctx.shadowBlur = 10;

        const hSize = 10;
        const drawHandle = (x, y) => this.ctx.fillRect(x - hSize/2, y - hSize/2, hSize, hSize);
        this.ctx.fillStyle = "cyan";

        if (obj instanceof RotatingObstacle) {
          this.ctx.translate(obj.x, obj.y);
          this.ctx.rotate(obj.angle);
          this.ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
          drawHandle(obj.w/2, 0); 
          drawHandle(0, obj.h/2); 
          drawHandle(obj.w/2, obj.h/2); 
        } else if (obj === this.player) {
          this.ctx.translate(obj.x, obj.y);
          this.ctx.rotate(obj.angle);
          this.ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
          drawHandle(obj.w/2, 0);
          drawHandle(0, obj.h/2);
          drawHandle(obj.w/2, obj.h/2);
        } else if (obj.angle) {
          this.ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
          this.ctx.rotate(obj.angle);
          this.ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
          drawHandle(obj.w/2, 0);
          drawHandle(0, obj.h/2);
          drawHandle(obj.w/2, obj.h/2);
        } else if (obj.radius) {
          this.ctx.beginPath();
          this.ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          this.ctx.stroke();
          drawHandle(obj.x + obj.radius, obj.y); 
        } else {
          this.ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
          drawHandle(obj.x + obj.w, obj.y + obj.h/2); 
          drawHandle(obj.x + obj.w/2, obj.y + obj.h); 
          drawHandle(obj.x + obj.w, obj.y + obj.h);   
        }
        this.ctx.restore();
      }
    });
  }

  movePlayer() {
    let inputVx = 0;
    let inputVy = 0;
    let vitesse = this.playerSpeed;
    vitesse += this.activeSpeedBoost;
    if (Date.now() < this.speedBoostEndTime) {
      vitesse += this.activeSpeedBoost;
    }

    this.player.oldX = this.player.x;
    this.player.oldY = this.player.y;

    if (this.inputStates.ArrowRight) inputVx = vitesse;
    if (this.inputStates.ArrowLeft) inputVx = -vitesse;
    if (this.inputStates.ArrowUp) inputVy = -vitesse;
    if (this.inputStates.ArrowDown) inputVy = vitesse;

    let windVx = 0;
    let windVy = 0;
    
    this.objetsGraphiques.forEach(obj => {
      if (obj instanceof Fan) {
        let cx = obj.x + obj.w / 2;
        let cy = obj.y + obj.h / 2;
        let dx = (this.player.x) - cx;
        let dy = (this.player.y) - cy;
        let localX = dx * Math.cos(-obj.angle) - dy * Math.sin(-obj.angle);
        let localY = dx * Math.sin(-obj.angle) + dy * Math.cos(-obj.angle);
        if (localX > 0 && localX < obj.range && Math.abs(localY) < obj.h / 2) {
          windVx += Math.cos(obj.angle) * obj.force;
          windVy += Math.sin(obj.angle) * obj.force;
        }
      }
    });

    this.player.vitesseX = inputVx + this.knockbackX + windVx;
    this.player.vitesseY = inputVy + this.knockbackY + windVy;

    this.player.move();

    this.knockbackX *= 0.9;
    this.knockbackY *= 0.9;
    if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
    if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0;

    this.updateUI();
    this.testCollisionsPlayer();
  }

  testCollisionsPlayer() {
    this.testCollisionPlayerBordsEcran();
    this.handleCollisionObstacle();
    this.testCollisionItems();
    this.testCollisionFin();
  }

  testCollisionPlayerBordsEcran() {
    if (
      this.player.x + this.player.w / 2 < -50 ||
      this.player.x - this.player.w / 2 > this.canvas.width + 50 ||
      this.player.y + this.player.h / 2 < -50 ||
      this.player.y - this.player.h / 2 > this.canvas.height + 50
    ) {
      this.restartLevel();
      return;
    }

    if (this.currentLevel === 9 || (this.currentLevel >= 11 && this.currentLevel <= 18)) return;

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

  handleCollisionObstacle() {
    this.objetsGraphiques.forEach((obstacle) => {
      if (obstacle instanceof Obstacle) {
        if (obstacle instanceof fadingDoor && !obstacle.visible) return;

        if (obstacle.angle && obstacle.angle !== 0) {
          let centerX = obstacle.x + obstacle.w / 2;
          let centerY = obstacle.y + obstacle.h / 2;
          let collision = rectRotatedRectOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            centerX,
            centerY,
            obstacle.w,
            obstacle.h,
            obstacle.angle,
          );

          if (collision) {
            let dx = this.player.x - centerX;
            let dy = this.player.y - centerY;
            let dot = dx * collision.axis.x + dy * collision.axis.y;
            if (dot < 0) {
              collision.axis.x *= -1;
              collision.axis.y *= -1;
            }
            this.player.x += collision.axis.x * (collision.overlap + 0.1);
            this.player.y += collision.axis.y * (collision.overlap + 0.1);
          }
        }
        else if (
          rectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obstacle.x,
            obstacle.y,
            obstacle.w,
            obstacle.h,
          )
        ) {
          let playerLeft = this.player.x - this.player.w / 2;
          let playerRight = this.player.x + this.player.w / 2;
          let playerTop = this.player.y - this.player.h / 2;
          let playerBottom = this.player.y + this.player.h / 2;
          let obstacleLeft = obstacle.x;
          let obstacleRight = obstacle.x + obstacle.w;
          let obstacleTop = obstacle.y;
          let obstacleBottom = obstacle.y + obstacle.h;
          let overlapLeft = playerRight - obstacleLeft;
          let overlapRight = obstacleRight - playerLeft;
          let overlapTop = playerBottom - obstacleTop;
          let overlapBottom = obstacleBottom - playerTop;
          let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft) {
            this.player.x = obstacleLeft - this.player.w / 2;
            this.player.vitesseX = 0;
          } else if (minOverlap === overlapRight) {
            this.player.x = obstacleRight + this.player.w / 2;
            this.player.vitesseX = 0;
          } else if (minOverlap === overlapTop) {
            this.player.y = obstacleTop - this.player.h / 2;
            this.player.vitesseY = 0;
          } else if (minOverlap === overlapBottom) {
            this.player.y = obstacleBottom + this.player.h / 2;
            this.player.vitesseY = 0;
          }
        }
      } else if (obstacle instanceof bumper) {
        if (
          rectTriangleOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obstacle.x,
            obstacle.y,
            obstacle.w,
            obstacle.h,
            obstacle.direction,
          )
        ) {
          obstacle.triggerBounce();
          this.player.x -= this.player.vitesseX;
          this.player.y -= this.player.vitesseY;
          let vx = this.player.vitesseX;
          let vy = this.player.vitesseY;
          let mag = Math.sqrt(vx * vx + vy * vy);
          let forceRebond = this.bumperForce;
          if (mag > 0.1) {
            this.knockbackX = -(vx / mag) * forceRebond;
            this.knockbackY = -(vy / mag) * forceRebond;
          } else {
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
          this.player.w,
          this.player.h,
          obstacle.x,
          obstacle.y,
          obstacle.w,
          obstacle.h,
          obstacle.angle,
        );
        if (collision) {
          let dx = this.player.x - obstacle.x;
          let dy = this.player.y - obstacle.y;
          let dot = dx * collision.axis.x + dy * collision.axis.y;
          if (dot < 0) {
            collision.axis.x *= -1;
            collision.axis.y *= -1;
          }
          this.player.x += collision.axis.x * (collision.overlap + 1);
          this.player.y += collision.axis.y * (collision.overlap + 1);
          this.knockbackX = collision.axis.x * 8;
          this.knockbackY = collision.axis.y * 8;
          this.player.vitesseX = 0;
          this.player.vitesseY = 0;
        }
      } else if (obstacle instanceof MovingObstacle) {
        if (
          rectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obstacle.x,
            obstacle.y,
            obstacle.w,
            obstacle.h,
          )
        ) {
          let dx = this.player.x - obstacle.x;
          let dy = this.player.y - obstacle.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            this.player.x += (dx / dist) * 10;
            this.player.y += (dy / dist) * 10;
          }
        }
        this.objetsGraphiques.forEach((o) => {
          if (o instanceof Obstacle && o !== obstacle) {
            if (rectsOverlap(obstacle.x, obstacle.y, obstacle.w, obstacle.h, o.x, o.y, o.w, o.h)) {
              obstacle.moveX = -obstacle.moveX;
              obstacle.moveY = -obstacle.moveY;
            }
          }
        });
        if (obstacle.x < 0 || obstacle.x + obstacle.w > this.canvas.width) obstacle.moveX = -obstacle.moveX;
        if (obstacle.y < 0 || obstacle.y + obstacle.h > this.canvas.height) obstacle.moveY = -obstacle.moveY;
      } else if (obstacle instanceof teleporter) {
        if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obstacle.x, obstacle.y, obstacle.w, obstacle.h)) {
          this.player.x = obstacle.destinationX;
          this.player.y = obstacle.destinationY;
        }
      } else if (obstacle instanceof CircleObstacle) {
        if (circleRect(obstacle.x, obstacle.y, obstacle.radius, this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h)) {
          this.player.x = this.player.oldX;
          this.player.y = this.player.oldY;
          this.player.vitesseX = 0;
          this.player.vitesseY = 0;
        }
      }
    });
  }

  testCollisionItems() {
    for (let i = this.objetsGraphiques.length - 1; i >= 0; i--) {
      let obj = this.objetsGraphiques[i];
      if (obj instanceof speedPotion) {
        if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
          this.activeSpeedBoost = obj.vitesse;
          this.speedBoostEndTime = Date.now() + obj.temps;
          this.objetsGraphiques.splice(i, 1); 
        }
      }
      if (obj instanceof sizePotion) {
        if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
          this.player.baseSize += obj.tailleW;
          this.player.updateDimensions();
          this.objetsGraphiques.splice(i, 1); 
        }
      }
      if (obj instanceof keypad) {
        if (rectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x, obj.y, obj.w, obj.h)) {
          this.objetsGraphiques.forEach((o) => {
            if (o instanceof fadingDoor && o.id === obj.id) o.visible = false;
          });
          this.objetsGraphiques.splice(i, 1); 
          setTimeout(() => {
            this.objetsGraphiques.forEach((o) => {
              if (o instanceof fadingDoor && o.id === obj.id) o.visible = true;
              if (o instanceof keypad && o.id === obj.id) o.visible = true;
            });
          }, obj.temps);
        }
      }
    }
  }

  testCollisionFin() {
    if (this.currentLevel === 0) return false;
    for (let obj of this.objetsGraphiques) {
      if (obj instanceof fin) {
        if (circRectsOverlap(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2)) {
          return true;
        }
      }
    }
    return false;
  }

  nextLevel() {
    if (this.onLevelComplete) {
      let elapsed = (Date.now() - this.startTime) / 1000;
      this.onLevelComplete(this.currentLevel, elapsed);
    }
    if (this.maxLevel && this.currentLevel >= this.maxLevel) {
      this.running = false;
      if (this.onFinish) this.onFinish();
      return;
    }
    this.currentLevel++;
    this.activeSpeedBoost = 0;
    this.speedBoostEndTime = 0;
    this.levels.load(this.currentLevel);
    if (this.objetsGraphiques.length === 0) {
      this.running = false;
      if (this.onFinish) this.onFinish();
    } else {
      this.startTime = Date.now();
      this.updateBackground();
      if (this.levelElement) this.levelElement.innerText = this.currentLevel;
    }
  }

  applyRotationMultiplier() {
    this.objetsGraphiques.forEach((obj) => {
      if (obj instanceof RotatingObstacle) {
        obj.angleSpeed = obj.initialAngleSpeed * this.rotationMultiplier;
      }
    });
  }

  updateUI() {
    if (this.timerElement && this.running) {
      let elapsed = Date.now() - this.startTime;
      let seconds = Math.floor(elapsed / 1000);
      let ms = Math.floor((elapsed % 1000) / 10);
      this.timerElement.innerText = `${seconds}.${ms.toString().padStart(2, "0")}`;
    }
    if (this.keyUp) this.keyUp.classList.toggle("active", !!this.inputStates.ArrowUp);
    if (this.keyDown) this.keyDown.classList.toggle("active", !!this.inputStates.ArrowDown);
    if (this.keyLeft) this.keyLeft.classList.toggle("active", !!this.inputStates.ArrowLeft);
    if (this.keyRight) this.keyRight.classList.toggle("active", !!this.inputStates.ArrowRight);
  }
}