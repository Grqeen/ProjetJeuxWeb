import Items from "./Items.js";

export default class sizePotion extends Items {
    constructor(x, y, w, h, couleur, tailleW, tailleH) {
        super(x, y, w, h, couleur);
        this.tailleW = tailleW;
        this.tailleH = tailleH;
    }
}