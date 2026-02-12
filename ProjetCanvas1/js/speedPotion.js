import Items from "./Items.js";

export default class speedPotion extends Items {
    constructor(x, y, w, h, couleur, vitesse, temps) {
        super(x, y, w, h, couleur);
        this.vitesse = vitesse;
        this.temps = temps;
        this.image = new Image();
        this.image.src = "assets/images/citron.png";

        this.image.onload = () => {
            if (this.image.naturalWidth > 0) {
                const ratio = this.image.naturalWidth / this.image.naturalHeight;
                this.h = this.w / ratio;
            }
        };
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalHeight !== 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
            ctx.restore();
        } else {
            super.draw(ctx);
        }
    }
}
