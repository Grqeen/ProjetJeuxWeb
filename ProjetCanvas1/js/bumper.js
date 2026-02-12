import ObjectGraphique from "./ObjectGraphique.js";

export default class bumper extends ObjectGraphique {
    constructor(x, y, w, h, couleur) {
        super(x, y, w, h, couleur);
        this.image = new Image();
        this.image.src = "assets/images/bumper.png";

        this.scale = 1;
        this.image.onload = () => {
            if (this.image.naturalWidth > 0) {
                const ratio = this.image.naturalWidth / this.image.naturalHeight;
                this.h = this.w / ratio;
            }
        };
    }

    triggerBounce() {
        this.scale = 1.5;
    }

    draw(ctx) {
        if (this.scale > 1) {
            this.scale -= 0.05;
        }
        if (this.scale < 1) this.scale = 1;

        if (this.image.complete && this.image.naturalHeight !== 0) {
            ctx.save();
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.scale(this.scale, this.scale);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-(this.x + this.w / 2), -(this.y + this.h / 2));
            ctx.fillStyle = this.couleur;
            ctx.beginPath();
            ctx.moveTo(this.x + this.w / 2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h);
            ctx.lineTo(this.x, this.y + this.h);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}