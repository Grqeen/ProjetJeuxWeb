import ObjectGraphique from "./ObjectGraphique.js";
import { drawCircleImmediat } from "./utils.js";   

export default class Player extends ObjectGraphique {
    constructor(x, y) {
        super(x, y, 100, 100);
        this.vitesseX = 0;
        this.vitesseY = 0;
        this.couleur = "green";
        this.angle = 0;

        // Chargement des images
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
    }

    draw(ctx) {
        // Ici on dessine un monstre
        ctx.save();

        // on déplace le systeme de coordonnées pour placer
        // le monstre en x, y.Tous les ordres de dessin
        // dans cette fonction seront par rapport à ce repère
        // translaté
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        // on recentre le monstre. Par défaut le centre de rotation est dans le coin en haut à gauche
        // du rectangle, on décale de la demi largeur et de la demi hauteur pour 
        // que le centre de rotation soit au centre du rectangle.
        // Les coordonnées x, y du monstre sont donc au centre du rectangle....
        ctx.translate(-this.w / 2, -this.h / 2);
        //this.ctx.scale(0.5, 0.5);

        // Désactive le lissage pour éviter le flou (Pixel Art)
        ctx.imageSmoothingEnabled = false;

        if (this.currentImage && this.currentImage.complete && this.currentImage.naturalHeight !== 0) {
            ctx.drawImage(this.currentImage, 0, 0, this.w, this.h);
        } else {
            // tete du monstre
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
        
        // Les bras
        //this.drawBrasGauche();

        // restore
        ctx.restore();

        // super.draw() dessine une croix à la position x, y
        // pour debug
        super.draw(ctx);
    }

    move() {
        this.x += this.vitesseX;
        this.y += this.vitesseY;

        if (this.vitesseX > 0) {
            this.currentImage = this.imageDroit;
        } else if (this.vitesseX < 0) {
            this.currentImage = this.imageGauche;
        } else if (this.vitesseY > 0) {
            this.currentImage = this.imageDescend;
        } else if (this.vitesseY < 0) {
            this.currentImage = this.imageMonte;
        } else {
            this.currentImage = this.imageIdle;
        }
    }
}