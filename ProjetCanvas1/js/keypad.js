import Items from "./Items.js";

export default class keypad extends Items {
    constructor(x, y, w, h, temps, id) {
        super(x, y, w, h, "red");
        this.temps = temps;
        this.id = id;
        this.visible = true;
        this.image = new Image();
        this.image.src = "assets/images/fadingdoor.png";

        this.image.onload = () => {
            if (this.image.naturalWidth > 0) {
                const ratio = this.image.naturalWidth / this.image.naturalHeight;
                this.h = this.w / ratio;
            }
        };
    }

    draw(ctx) {
        if (this.visible) {
            if (this.image.complete && this.image.naturalHeight !== 0) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
                ctx.restore();
            } else {
                super.draw(ctx);
            }
        }
    }
}
