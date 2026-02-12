import ObjectGraphique from "./ObjectGraphique.js";

export default class teleporter extends ObjectGraphique {
    constructor(x, y, w, h, couleur, destinationX, destinationY) {
        super(x, y, w, h, couleur);
        this.destinationX = destinationX;
        this.destinationY = destinationY;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.couleur;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}
