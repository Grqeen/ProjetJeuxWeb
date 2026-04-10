import ObjectGraphique from "./ObjectGraphique.js";

export default class fin extends ObjectGraphique {
  constructor(x, y, w, h, couleur, imageSrc) {
    super(x, y, w, h, couleur);
    this.image = null;
    if (imageSrc) {
      this.image = new Image();
      this.image.src = imageSrc;
    }
    this.angle = 0;
  }

  draw(ctx) {
    ctx.save();
    // centre
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate(this.angle);

    if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
      // dessin
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = this.couleur;
      ctx.beginPath();
      ctx.arc(0, 0, this.w / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  move() {
    this.angle += 0.02; // vitesse
  }
}
