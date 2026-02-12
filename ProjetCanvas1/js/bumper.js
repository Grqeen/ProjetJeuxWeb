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
        } else if (this.direction === "left") {
            ctx.moveTo(this.x, this.y + this.h / 2); // Pointe gauche
            ctx.lineTo(this.x + this.w, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h);
        } else if (this.direction === "right") {
            ctx.moveTo(this.x + this.w, this.y + this.h / 2); // Pointe droite
            ctx.lineTo(this.x, this.y + this.h);
            ctx.lineTo(this.x, this.y);
        } else {
            // Down (par défaut si autre chose que up/left/right)
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.w, this.y);
            ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}