import ObjectGraphique from "./ObjectGraphique.js";

export default class Items extends ObjectGraphique {
    constructor(x, y, w, h, couleur) {
        super(x, y, w, h, couleur);
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.couleur;
        
        if (this.angle) {
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.rotate(this.angle);
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}