import Obstacle from "./Obstacle.js";

export default class fadingDoor extends Obstacle {
    constructor(x, y, w, h, couleur, timer, id) {
        super(x, y, w, h, couleur);
        this.visible = true;
        this.timer = timer;
        this.id = id;
    }

    draw(ctx) {
        if (this.visible) {
            super.draw(ctx);
        }
    }
}