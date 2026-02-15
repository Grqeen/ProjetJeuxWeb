import ObjectGraphique from "./ObjectGraphique.js";

export default class teleporter extends ObjectGraphique {
  constructor(x, y, w, h, couleur, destinationX, destinationY) {
    super(x, y, w, h, couleur);
    this.destinationX = destinationX;
    this.destinationY = destinationY;
    this.image = new Image();
    this.image.src = "assets/images/teleporter.png";
    this.image.onload = () => {
      if (this.image.naturalWidth > 0) {
        const ratio = this.image.naturalWidth / this.image.naturalHeight;
        this.h = this.w / ratio;
      }
    };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.image.complete && this.image.naturalHeight !== 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.image, 0, 0, this.w, this.h);
    } else {
      ctx.fillStyle = this.couleur;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    ctx.restore();
  }
}
