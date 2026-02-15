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

export default class Game {
  objetsGraphiques = [];

  constructor(canvas, scoreElement) {
    this.canvas = canvas;
    this.timerElement = null; // timer
    this.onLevelComplete = null; // score
    this.startTime = 0; // debut
    this.levelElement = null; // affichage niveau
    // clavier
    this.inputStates = {
      mouseX: 0,
      mouseY: 0,
      ArrowRight: false,
      ArrowLeft: false,
      ArrowUp: false,
      ArrowDown: false,
    };

    // options
    this.playerSpeed = 5;
    this.rotationMultiplier = 1;
    this.bumperForce = 25;

    // recul
    this.knockbackX = 0;
    this.knockbackY = 0;

    // boost
    this.speedBoostTimeout = null;
    this.speedBoostEndTime = 0;
    this.activeSpeedBoost = 0;
    this.running = false;
    this.onFinish = null; // fin jeu
    this.selectedObject = null; // selection
    this.levelUpdate = null; // logique specifique niveau
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
    // reset
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
      requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }
  }

  startCustomLevel(levelData) {
    this.currentLevel = "custom";
    // reset
    this.activeSpeedBoost = 0;
    this.speedBoostEndTime = 0;
    this.levelUpdate = null;
    this.levels.loadFromJSON(levelData);
    this.updateBackground();
    this.applyRotationMultiplier();
    if (this.levelElement) this.levelElement.innerText = "Custom";
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.startTime = Date.now();
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.mainAnimationLoop.bind(this));
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

  mainAnimationLoop() {
    if (!this.running) return;
    // efface
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // dessine
    this.drawAllObjects();

    // update
    this.update();

    // boucle
    requestAnimationFrame(this.mainAnimationLoop.bind(this));
  }

  drawAllObjects() {
    // dessine tout
    this.objetsGraphiques.forEach((obj) => {
      obj.draw(this.ctx);

      // selection
      if (this.selectedObject === obj) {
        this.ctx.save();
        this.ctx.strokeStyle = "cyan";
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = "cyan";
        this.ctx.shadowBlur = 10;

        // poignee
        const hSize = 10;
        const drawHandle = (x, y) =>
          this.ctx.fillRect(x - hSize / 2, y - hSize / 2, hSize, hSize);
        this.ctx.fillStyle = "cyan";

        if (obj instanceof RotatingObstacle) {
          // centre
          this.ctx.translate(obj.x, obj.y);
          this.ctx.rotate(obj.angle);
          this.ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
          // poignees
          drawHandle(obj.w / 2, 0); // Droite
          drawHandle(0, obj.h / 2); // Bas
          drawHandle(obj.w / 2, obj.h / 2); // Coin
        } else if (obj === this.player) {
          // joueur centre
          this.ctx.translate(obj.x, obj.y);
          this.ctx.rotate(obj.angle);
          this.ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
          drawHandle(obj.w / 2, 0);
          drawHandle(0, obj.h / 2);
          drawHandle(obj.w / 2, obj.h / 2);
        } else if (obj.angle) {
          // autres objets
          this.ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
          this.ctx.rotate(obj.angle);
          this.ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
          drawHandle(obj.w / 2, 0);
          drawHandle(0, obj.h / 2);
          drawHandle(obj.w / 2, obj.h / 2);
        } else if (obj.radius) {
          this.ctx.beginPath();
          this.ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          this.ctx.stroke();
          drawHandle(obj.x + obj.radius, obj.y); // poignee rayon
        } else {
          // translate
          this.ctx.translate(obj.x, obj.y);
          this.ctx.strokeRect(0, 0, obj.w, obj.h);
          // poignees locales
          drawHandle(obj.w, obj.h / 2); // Droite
          drawHandle(obj.w / 2, obj.h); // Bas
          drawHandle(obj.w, obj.h); // Coin
        }
        this.ctx.restore();
      }
    });
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

    // timer
    if (this.timerElement && this.running) {
      let elapsed = Date.now() - this.startTime;
      let seconds = Math.floor(elapsed / 1000);
      let ms = Math.floor((elapsed % 1000) / 10);
      this.timerElement.innerText = `${seconds}.${ms.toString().padStart(2, "0")}`;
    }

    // clavier virtuel
    if (this.keyUp)
      this.keyUp.classList.toggle("active", !!this.inputStates.ArrowUp);
    if (this.keyDown)
      this.keyDown.classList.toggle("active", !!this.inputStates.ArrowDown);
    if (this.keyLeft)
      this.keyLeft.classList.toggle("active", !!this.inputStates.ArrowLeft);
    if (this.keyRight)
      this.keyRight.classList.toggle("active", !!this.inputStates.ArrowRight);
  }

  movePlayer() {
    let inputVx = 0;
    let inputVy = 0;

    // vitesse
    let vitesse = this.playerSpeed;

    // boost
    vitesse += this.activeSpeedBoost;
    // temps boost
    if (Date.now() < this.speedBoostEndTime) {
      vitesse += this.activeSpeedBoost;
    }

    // save pos
    this.player.oldX = this.player.x;
    this.player.oldY = this.player.y;

    if (this.inputStates.ArrowRight) inputVx = vitesse;
    if (this.inputStates.ArrowLeft) inputVx = -vitesse;
    if (this.inputStates.ArrowUp) inputVy = -vitesse;
    if (this.inputStates.ArrowDown) inputVy = vitesse;

    // recul
    this.player.vitesseX = inputVx + this.knockbackX;
    this.player.vitesseY = inputVy + this.knockbackY;

    this.player.move();

    // friction
    this.knockbackX *= 0.9;
    this.knockbackY *= 0.9;
    if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
    if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0;

    this.testCollisionsPlayer();
  }

  testCollisionsPlayer() {
    // bords
    this.testCollisionPlayerBordsEcran();

    // obstacles
    //this.testCollisionPlayerObstacles();

    // collisions
    this.handleCollisionObstacle();

    this.testCollisionItems();

    this.testCollisionFin();
  }

  testCollisionPlayerBordsEcran() {
    // mort
    // limites
    if (
      this.player.x + this.player.w / 2 < -50 ||
      this.player.x - this.player.w / 2 > this.canvas.width + 50 ||
      this.player.y + this.player.h / 2 < -50 ||
      this.player.y - this.player.h / 2 > this.canvas.height + 50
    ) {
      this.restartLevel();
      return;
    }

    // niveau 9
    if (this.currentLevel === 9) return;

    // murs
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
    this.objetsGraphiques.forEach((obj) => {
      if (obj instanceof Obstacle) {
        if (
          rectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obj.x,
            obj.y,
            obj.w,
            obj.h,
          )
        ) {
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
    this.objetsGraphiques.forEach((obstacle) => {
      if (obstacle instanceof Obstacle) {
        // porte invisible
        if (obstacle instanceof fadingDoor && !obstacle.visible) return;

        // rotation
        if (obstacle.angle && obstacle.angle !== 0) {
          // OBB
          // centre
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
            // repousse
            let dx = this.player.x - centerX;
            let dy = this.player.y - centerY;
            let dot = dx * collision.axis.x + dy * collision.axis.y;

            if (dot < 0) {
              collision.axis.x *= -1;
              collision.axis.y *= -1;
            }
            this.player.x += collision.axis.x * (collision.overlap + 0.1);
            this.player.y += collision.axis.y * (collision.overlap + 0.1);
            // stop vitesse
            // this.player.vitesseX = 0; this.player.vitesseY = 0;
          }
        }
        // AABB
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
          // bords joueur
          let playerLeft = this.player.x - this.player.w / 2;
          let playerRight = this.player.x + this.player.w / 2;
          let playerTop = this.player.y - this.player.h / 2;
          let playerBottom = this.player.y + this.player.h / 2;

          // bords obstacle
          let obstacleLeft = obstacle.x;
          let obstacleRight = obstacle.x + obstacle.w;
          let obstacleTop = obstacle.y;
          let obstacleBottom = obstacle.y + obstacle.h;

          // overlap
          let overlapLeft = playerRight - obstacleLeft;
          let overlapRight = obstacleRight - playerLeft;
          let overlapTop = playerBottom - obstacleTop;
          let overlapBottom = obstacleBottom - playerTop;

          // min overlap
          let minOverlap = Math.min(
            overlapLeft,
            overlapRight,
            overlapTop,
            overlapBottom,
          );

          if (minOverlap === overlapLeft) {
            // gauche
            this.player.x = obstacleLeft - this.player.w / 2;
            this.player.vitesseX = 0;
          } else if (minOverlap === overlapRight) {
            // droite
            this.player.x = obstacleRight + this.player.w / 2;
            this.player.vitesseX = 0;
          } else if (minOverlap === overlapTop) {
            // haut
            this.player.y = obstacleTop - this.player.h / 2;
            this.player.vitesseY = 0;
          } else if (minOverlap === overlapBottom) {
            // bas
            this.player.y = obstacleBottom + this.player.h / 2;
            this.player.vitesseY = 0;
          }
        }
      } else if (obstacle instanceof bumper) {
        // bumper
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
          console.log("Collision avec bumper");

          obstacle.triggerBounce();
          // annule
          this.player.x -= this.player.vitesseX;
          this.player.y -= this.player.vitesseY;

          // rebond
          let vx = this.player.vitesseX;
          let vy = this.player.vitesseY;
          let mag = Math.sqrt(vx * vx + vy * vy);
          let forceRebond = this.bumperForce;

          if (mag > 0.1) {
            this.knockbackX = -(vx / mag) * forceRebond;
            this.knockbackY = -(vy / mag) * forceRebond;
          } else {
            // centre
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
          // repousse
          let dx = this.player.x - obstacle.x;
          let dy = this.player.y - obstacle.y;
          let dot = dx * collision.axis.x + dy * collision.axis.y;

          if (dot < 0) {
            collision.axis.x *= -1;
            collision.axis.y *= -1;
          }

          // deplace
          this.player.x += collision.axis.x * (collision.overlap + 1);
          this.player.y += collision.axis.y * (collision.overlap + 1);

          // choc
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
          console.log("Collision avec obstacle mobile");
          // exterieur
          let dx = this.player.x - obstacle.x;
          let dy = this.player.y - obstacle.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            this.player.x += (dx / dist) * 10;
            this.player.y += (dy / dist) * 10;
          }
        }
        // rebond obstacle
        this.objetsGraphiques.forEach((o) => {
          if (o instanceof Obstacle && o !== obstacle) {
            if (
              rectsOverlap(
                obstacle.x,
                obstacle.y,
                obstacle.w,
                obstacle.h,
                o.x,
                o.y,
                o.w,
                o.h,
              )
            ) {
              // inverse
              obstacle.moveX = -obstacle.moveX;
              obstacle.moveY = -obstacle.moveY;
            }
          }
        });
        // rebond bords
        if (obstacle.x < 0 || obstacle.x + obstacle.w > this.canvas.width) {
          obstacle.moveX = -obstacle.moveX;
        }
        if (obstacle.y < 0 || obstacle.y + obstacle.h > this.canvas.height) {
          obstacle.moveY = -obstacle.moveY;
        }
        // rebond mobiles
        this.objetsGraphiques.forEach((o) => {
          if (o instanceof MovingObstacle && o !== obstacle) {
            if (
              rectsOverlap(
                obstacle.x,
                obstacle.y,
                obstacle.w,
                obstacle.h,
                o.x,
                o.y,
                o.w,
                o.h,
              )
            ) {
              // inverse
              obstacle.moveX = -obstacle.moveX;
              obstacle.moveY = -obstacle.moveY;
            }
          }
        });
        // rebond bumpers
        this.objetsGraphiques.forEach((o) => {
          if (o instanceof bumper) {
            if (
              rectTriangleOverlap(
                obstacle.x,
                obstacle.y,
                obstacle.w,
                obstacle.h,
                o.x,
                o.y,
                o.w,
                o.h,
              )
            ) {
              // inverse
              obstacle.moveX = -obstacle.moveX;
              obstacle.moveY = -obstacle.moveY;
            }
          }
        });
        // rebond portes
        this.objetsGraphiques.forEach((o) => {
          if (o instanceof fadingDoor) {
            if (
              rectsOverlap(
                obstacle.x,
                obstacle.y,
                obstacle.w,
                obstacle.h,
                o.x,
                o.y,
                o.w,
                o.h,
              )
            ) {
              if (!o.visible) {
                // inverse
                obstacle.moveX = -obstacle.moveX;
                obstacle.moveY = -obstacle.moveY;
              }
            }
          }
        });
      } else if (obstacle instanceof teleporter) {
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
          console.log("Collision avec téléporteur : Téléportation !");
          // destination
          this.player.x = obstacle.destinationX;
          this.player.y = obstacle.destinationY;
        }
      } else if (obstacle instanceof CircleObstacle) {
        if (
          circleRect(
            obstacle.x,
            obstacle.y,
            obstacle.radius,
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
          )
        ) {
          // collision
          this.player.x = this.player.oldX;
          this.player.y = this.player.oldY;
          this.player.vitesseX = 0;
          this.player.vitesseY = 0;
        }
      }
    });
  }

  testCollisionItems() {
    // boucle envers
    for (let i = this.objetsGraphiques.length - 1; i >= 0; i--) {
      let obj = this.objetsGraphiques[i];
      if (obj instanceof speedPotion) {
        if (
          rectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obj.x,
            obj.y,
            obj.w,
            obj.h,
          )
        ) {
          console.log("Collision avec SpeedPotion : Vitesse augmentée !");

          // boost
          this.activeSpeedBoost = obj.vitesse;
          this.speedBoostEndTime = Date.now() + obj.temps;

          this.objetsGraphiques.splice(i, 1); // supprime
        }
      }
      if (obj instanceof sizePotion) {
        if (
          rectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obj.x,
            obj.y,
            obj.w,
            obj.h,
          )
        ) {
          console.log("Collision avec SizePotion : Taille modifiée!");

          // taille
          this.player.baseSize += obj.tailleW;
          this.player.updateDimensions();
          this.objetsGraphiques.splice(i, 1); // supprime
        }
      }
      if (obj instanceof keypad) {
        if (
          rectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obj.x,
            obj.y,
            obj.w,
            obj.h,
          )
        ) {
          console.log(
            "Collision avec keypad : Porte associée " + obj.id + " activée !",
          );
          // porte
          this.objetsGraphiques.forEach((o) => {
            if (o instanceof fadingDoor && o.id === obj.id) {
              o.visible = false; // invisible
              console.log("Porte " + o.id + " désactivée !");
            }
          });
          this.objetsGraphiques.splice(i, 1); // supprime
          // respawn
          setTimeout(() => {
            // active porte
            this.objetsGraphiques.forEach((o) => {
              if (o instanceof fadingDoor && o.id === obj.id) {
                o.visible = true;
                console.log("Porte " + o.id + " réactivée !");
                o;
              }
            });
            // active keypad
            this.objetsGraphiques.forEach((o) => {
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

  // fin niveau
  testCollisionFin() {
    // editeur
    if (this.currentLevel === 0) return false;

    for (let obj of this.objetsGraphiques) {
      if (obj instanceof fin) {
        if (
          circRectsOverlap(
            this.player.x - this.player.w / 2,
            this.player.y - this.player.h / 2,
            this.player.w,
            this.player.h,
            obj.x + obj.w / 2,
            obj.y + obj.h / 2,
            obj.w / 2,
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  nextLevel() {
    // temps
    if (this.onLevelComplete) {
      let elapsed = (Date.now() - this.startTime) / 1000;
      this.onLevelComplete(this.currentLevel, elapsed);
    }

    // niveau +1
    this.currentLevel++;
    this.activeSpeedBoost = 0;
    this.speedBoostEndTime = 0;
    // charge
    this.levels.load(this.currentLevel);

    // fin jeu
    if (this.objetsGraphiques.length === 0) {
      this.running = false; // stop
      if (this.onFinish) this.onFinish(); // callback
    } else {
      // reset timer
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
}
