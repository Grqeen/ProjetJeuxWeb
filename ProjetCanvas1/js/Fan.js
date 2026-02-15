import Obstacle from "./Obstacle.js";

export default class Fan extends Obstacle {
    constructor(x, y, w, h, couleur, force = 1) {
        super(x, y, w, h, couleur);
        this.force = force;
        this.range = 350; // Portée du vent
        this.angleBlade = 0;
        this.angle = 0; // 0 = Souffle vers la droite par défaut
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.angle);

        // Caisson du ventilateur
        ctx.fillStyle = "#555";
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        
        // Grille de protection
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

        // Pales (Animation)
        ctx.save();
        ctx.rotate(this.angleBlade);
        ctx.fillStyle = this.couleur; 
        // Pale Horizontale
        ctx.fillRect(-this.w/2 + 2, -4, this.w - 4, 8);
        // Pale Verticale
        ctx.fillRect(-4, -this.h/2 + 2, 8, this.h - 4);
        ctx.restore();

        this.angleBlade += 0.3; // Vitesse de rotation visuelle

        // Visualisation du vent (Particules simples)
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for(let i=0; i<3; i++) {
             // Animation cyclique des particules
             let d = (Date.now() / 5 + i * 100) % this.range;
             // Oscillation légère
             let yOff = Math.sin(d * 0.05 + i) * (this.h/3);
             // On dessine la particule devant le ventilateur
             ctx.fillRect(this.w/2 + d, yOff, 10, 2);
        }

        ctx.restore();
    }
}
