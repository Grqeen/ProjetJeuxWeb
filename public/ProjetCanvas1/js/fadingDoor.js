import Obstacle from "./Obstacle.js";

export default class fadingDoor extends Obstacle {
  constructor(x, y, w, h, timer, id, textureAngle = 0) {
    super(x, y, w, h, "red");
    this.visible = true;
    this.timer = timer;
    this.id = id;
    this.textureAngle = textureAngle;
    this.image = new Image();
    this.image.src = "assets/images/laser.png";
  }

  draw(ctx) {
    if (this.visible) {
      if (this.image.complete && this.image.naturalHeight !== 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // centre
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        if (this.angle) ctx.rotate(this.angle);

        if (this.textureAngle) {
          ctx.rotate(this.textureAngle);
          // rotation 90
          ctx.drawImage(this.image, -this.h / 2, -this.w / 2, this.h, this.w);
        } else {
          ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
        }
        ctx.restore();
      } else {
        super.draw(ctx);
      }
    }
  }
}
