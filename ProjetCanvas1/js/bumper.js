import ObjectGraphique from "./ObjectGraphique.js";

export default class bumper extends ObjectGraphique {
    constructor(x, y, w, h, couleur, direction = "up") {
        super(x, y, w, h, couleur);
        this.direction = direction;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        if (this.direction === "up") {
            ctx.moveTo(this.x + this.w / 2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h);
            ctx.lineTo(this.x, this.y + this.h);
        } else {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.w, this.y);
            ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}