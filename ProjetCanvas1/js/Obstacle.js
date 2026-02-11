import ObjectGraphique from "./ObjectGraphique.js";

export default class Obstacle extends ObjectGraphique {
    constructor(x, y, w, h, couleur) {
        super(x, y, w, h, couleur);
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.couleur;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

export class RotatingObstacle extends ObjectGraphique {
    constructor(x, y, w, h, couleur, angleSpeed, initialAngle = 0) {
        super(x, y, w, h, couleur);
        this.angle = initialAngle;
        this.initialAngleSpeed = angleSpeed;
        this.angleSpeed = angleSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.couleur;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }

    move() {
        this.angle += this.angleSpeed;
    }
}

export class IntermittentRotatingObstacle extends RotatingObstacle {
    constructor(x, y, w, h, couleur, angleSpeed, initialAngle = 0) {
        super(x, y, w, h, couleur, angleSpeed, initialAngle);
        this.rotatedAmount = 0;
        this.isPaused = false;
        this.pauseTimer = 0;
        this.maxPause = 100; // Temps d'arrêt plus long (environ 1.6 secondes)
    }

    move() {
        if (!this.isPaused) {
            this.angle += this.angleSpeed;
            this.rotatedAmount += Math.abs(this.angleSpeed);

            // Si on a tourné de 180 degrés (Math.PI)
            if (this.rotatedAmount >= Math.PI) {
                this.isPaused = true;

                // Correction pour s'arrêter exactement aux mêmes coordonnées (anti-dérive)
                let overshoot = this.rotatedAmount - Math.PI;
                if (this.angleSpeed > 0) {
                    this.angle -= overshoot;
                } else {
                    this.angle += overshoot;
                }

                this.rotatedAmount = 0;
                this.pauseTimer = this.maxPause;
            }
        } else {
            this.pauseTimer--;
            if (this.pauseTimer <= 0) {
                this.isPaused = false;
            }
        }
    }
}

export class MovingObstacle extends Obstacle {
    constructor(x, y, w, h, couleur, distX, distY, speed) {
        super(x, y, w, h, couleur);
        this.startX = x;
        this.startY = y;
        this.distX = distX; // Distance max de déplacement en X
        this.distY = distY; // Distance max de déplacement en Y
        this.speed = speed;
        this.timer = 0;
    }

    move() {
        this.timer += this.speed;
        // Oscillation sinusoïdale
        this.x = this.startX + Math.sin(this.timer) * this.distX;
        this.y = this.startY + Math.sin(this.timer) * this.distY;
    }
}