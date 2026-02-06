import Items from "./Items.js";

export default class speedPotion extends Items {
    constructor(x, y, w, h, couleur, vitesse, temps) {
        super(x, y, w, h, couleur);
        this.vitesse = vitesse;
        this.temps = temps;
    }
}
