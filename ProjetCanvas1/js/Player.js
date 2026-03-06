import ObjectGraphique from "./ObjectGraphique.js";
import { drawCircleImmediat } from "./utils.js";

export default class Player extends ObjectGraphique {
  constructor(x, y) {
    super(x, y, 100, 100); // taille dynamique
    this.vitesseX = 0;
    this.vitesseY = 0;
    this.couleur = "green";
    this.angle = 0;
    this.baseSize = 100; // max dim

    // images
    this.imageDroit = new Image();
    this.imageDroit.src = "assets/images/blobDroit.png";
    this.imageGauche = new Image();
    this.imageGauche.src = "assets/images/blobGauche.png";
    this.imageIdle = new Image();
    this.imageIdle.src = "assets/images/blobIdle.png";
    this.imageDescend = new Image();
    this.imageDescend.src = "assets/images/blobDescend.png";
    this.imageMonte = new Image();
    this.imageMonte.src = "assets/images/blobMonte.png";
    this.currentImage = this.imageIdle;

    // update dim
    this.imageIdle.onload = () => {
      this.updateDimensions();
    };
  }

  updateDimensions() {
    if (
      !this.currentImage ||
      !this.currentImage.complete ||
      this.currentImage.naturalHeight === 0
    ) {
      return; // check image
    }

    const ratio =
      this.currentImage.naturalWidth / this.currentImage.naturalHeight;

    if (ratio > 1) {
      // large
      this.w = this.baseSize;
      this.h = this.baseSize / ratio;
    } else {
      // haut
      this.h = this.baseSize;
      this.w = this.baseSize * ratio;
    }
  }

  draw(ctx) {
    // dessine monstre
    ctx.save();

    // translate
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // centre
    ctx.translate(-this.w / 2, -this.h / 2);
    //this.ctx.scale(0.5, 0.5);

    // pixel art
    ctx.imageSmoothingEnabled = false;

    if (
      this.currentImage &&
      this.currentImage.complete &&
      this.currentImage.naturalHeight !== 0
    ) {
      // dessin
      ctx.drawImage(this.currentImage, 0, 0, this.w, this.h);
    } else {
      // tete
      ctx.fillStyle = "green";
      ctx.fillRect(0, 0, this.w, this.h);
      // yeux
      drawCircleImmediat(ctx, 20, 20, 10, "white");
      drawCircleImmediat(ctx, 60, 20, 10, "white");
      drawCircleImmediat(ctx, 20, 20, 5, "black");
      drawCircleImmediat(ctx, 60, 20, 5, "black");
      // bouche
      ctx.fillStyle = "black";
      ctx.fillRect(20, 60, 40, 10);
    }

    // bras
    //this.drawBrasGauche();

    // restore
    ctx.restore();

    // debug
    super.draw(ctx);
  }

  move() {
    this.x += this.vitesseX;
    this.y += this.vitesseY;

    let nextImage = this.currentImage;

    if (this.vitesseX > 0) {
      nextImage = this.imageDroit;
    } else if (this.vitesseX < 0) {
      nextImage = this.imageGauche;
    } else if (this.vitesseY > 0) {
      nextImage = this.imageDescend;
    } else if (this.vitesseY < 0) {
      nextImage = this.imageMonte;
    } else {
      nextImage = this.imageIdle;
    }

    if (this.currentImage !== nextImage) {
      let previousHeight = this.h;
      let previousImage = this.currentImage;
      this.currentImage = nextImage;
      this.updateDimensions();

      if (previousImage === this.imageMonte || nextImage === this.imageMonte) {
        // ancre haut
        this.y -= (previousHeight - this.h) / 2;
      } else {
        // ancre bas
        this.y += (previousHeight - this.h) / 2;
      }
    }
  }
}
