import ObjectGraphique from "./ObjectGraphique.js";

export default class bumper extends ObjectGraphique {
    constructor(x, y, w, h, couleur, direction = "up") {
        super(x, y, w, h, couleur);
        this.direction = direction;
        this.image = new Image();
        this.image.src = "assets/images/bumper.png";
        this.scale = 1;
    }

    triggerBounce() {
        this.scale = 1.2;
        setTimeout(() => {
            this.scale = 1;
        }, 100);
    }

    draw(ctx) {
        ctx.save();
        
        if (this.image.complete && this.image.naturalHeight !== 0) {
            // Dessin de l'image (Champignon)
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.scale(this.scale, this.scale);
            let angle = 0;
            if (this.direction === "right") angle = Math.PI / 2;
            else if (this.direction === "down") angle = Math.PI;
            else if (this.direction === "left") angle = -Math.PI / 2;
            
            ctx.rotate(angle);
            ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            // Fallback : Triangle
            ctx.fillStyle = this.couleur;
            ctx.beginPath();
            if (this.direction === "up") {
                ctx.moveTo(this.x + this.w / 2, this.y);
                ctx.lineTo(this.x + this.w, this.y + this.h);
                ctx.lineTo(this.x, this.y + this.h);
            } else if (this.direction === "left") {
                ctx.moveTo(this.x, this.y + this.h / 2);
                ctx.lineTo(this.x + this.w, this.y);
                ctx.lineTo(this.x + this.w, this.y + this.h);
            } else if (this.direction === "right") {
                ctx.moveTo(this.x + this.w, this.y + this.h / 2);
                ctx.lineTo(this.x, this.y + this.h);
                ctx.lineTo(this.x, this.y);
            } else {
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.w, this.y);
                ctx.lineTo(this.x + this.w / 2, this.y + this.h);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}