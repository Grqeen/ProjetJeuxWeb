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

export class movingObstacle extends ObjectGraphique {
    constructor(x, y, w, h, couleur, moveX, moveY) {
        super(x, y, w, h, couleur);
        this.moveX = moveX;
        this.moveY = moveY;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.couleur;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }

    move() {
        this.x += this.moveX;
        this.y += this.moveY;
        
    }
}