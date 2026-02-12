import ObjectGraphique from "./ObjectGraphique.js";
import { drawCircleImmediat } from "./utils.js";   

export default class Player extends ObjectGraphique {
    constructor(x, y) {
        super(x, y, 100, 100); // La taille sera mise à jour dynamiquement
        this.vitesseX = 0;
        this.vitesseY = 0;
        this.couleur = "green";
        this.angle = 0;
        this.baseSize = 100; // Dimension maximale (largeur ou hauteur)

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

        // Met à jour les dimensions une fois que l'image de départ est chargée
        this.imageIdle.onload = () => {
            this.updateDimensions();
        }
    }

    updateDimensions() {
        if (!this.currentImage || !this.currentImage.complete || this.currentImage.naturalHeight === 0) {
            return; // Ne fait rien si l'image n'est pas chargée
        }

        const ratio = this.currentImage.naturalWidth / this.currentImage.naturalHeight;

        if (ratio > 1) {
            // Image plus large que haute
            this.w = this.baseSize;
            this.h = this.baseSize / ratio;
        } else {
            // Image plus haute que large ou carrée
            this.h = this.baseSize;
            this.w = this.baseSize * ratio;
        }
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
            // La hitbox (w, h) a maintenant le bon ratio, on peut dessiner directement
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
                // Si on monte OU qu'on vient de monter, on ancre le HAUT pour éviter le décalage
                this.y -= (previousHeight - this.h) / 2;
            } else {
                // Sinon (descend, idle, coté), on ancre le BAS pour éviter de rentrer dans le sol
                this.y += (previousHeight - this.h) / 2;
            }
        }
    }
}