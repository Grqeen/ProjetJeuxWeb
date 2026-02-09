import Items from "./Items.js";

export default class keypad extends Items {
    constructor(x, y, w, h, couleur, temps, id) {
        super(x, y, w, h, couleur);
        this.temps = temps;
        this.id = id;
    }
}
