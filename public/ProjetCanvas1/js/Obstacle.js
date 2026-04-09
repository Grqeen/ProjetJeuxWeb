import ObjectGraphique from "./ObjectGraphique.js";

export default class Obstacle extends ObjectGraphique {
  constructor(x, y, w, h, couleur) {
    super(x, y, w, h, couleur);
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.couleur;

    if (this.angle) {
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.rotate(this.angle);
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.translate(this.x, this.y);
      ctx.fillRect(0, 0, this.w, this.h);
    }
    ctx.restore();
  }
}

export class TexturedObstacle extends Obstacle {
  constructor(x, y, w, h, imageSrc) {
    super(x, y, w, h, "white");
    this.imageSrc = imageSrc;
    this.image = new Image();
    this.image.src = imageSrc;
    this.isLoaded = false;

    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  draw(ctx) {
    ctx.save();
    if (this.angle) {
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.rotate(this.angle);
      ctx.translate(-this.w / 2, -this.h / 2);
    } else {
      ctx.translate(this.x, this.y);
    }

    if (this.isLoaded && this.image.naturalWidth !== 0) {
      let pattern = ctx.createPattern(this.image, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, this.w, this.h);
    } else {
      ctx.fillStyle = "gray";
      ctx.fillRect(0, 0, this.w, this.h);
    }
    ctx.restore();
  }
}

export class ImageObstacle extends Obstacle {
  constructor(x, y, w, h, imageSrc) {
    super(x, y, w, h, "gray");
    this.image = new Image();
    this.image.src = imageSrc;
  }

  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (this.angle) {
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.rotate(this.angle);
      ctx.translate(-this.w / 2, -this.h / 2);

      if (this.image.complete && this.image.naturalWidth !== 0) {
        ctx.drawImage(this.image, 0, 0, this.w, this.h);
      } else {
        ctx.fillStyle = this.couleur;
        ctx.fillRect(0, 0, this.w, this.h);
      }
    } else {
      ctx.translate(this.x, this.y);
      if (this.image.complete && this.image.naturalWidth !== 0) {
        ctx.drawImage(this.image, 0, 0, this.w, this.h);
      } else {
        ctx.fillStyle = this.couleur;
        ctx.fillRect(0, 0, this.w, this.h);
      }
    }
    ctx.restore();
  }
}

export class RotatingObstacle extends ObjectGraphique {
  constructor(x, y, w, h, couleur, angleSpeed, initialAngle = 0) {
    super(x, y, w, h, couleur);
    this.angle = initialAngle;
    this.initialAngleSpeed = angleSpeed;
    this.angleSpeed = angleSpeed;

    this.image = new Image();
    this.image.src = "assets/images/pales.png";
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (this.image.complete && this.image.naturalHeight !== 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = this.couleur;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }

  move() {
    this.angle += this.angleSpeed;
  }
}

export class IntermittentRotatingObstacle extends RotatingObstacle {
  constructor(x, y, w, h, couleur, angleSpeed, initialAngle = 0) {
    super(x, y, w, h, couleur, angleSpeed, initialAngle);
    this.rotatedAmount = 0;
    this.isPaused = false;
    this.pauseTimer = 0;
    this.maxPause = 100;
  }

  move() {
    if (!this.isPaused) {
      this.angle += this.angleSpeed;
      this.rotatedAmount += Math.abs(this.angleSpeed);

      if (this.rotatedAmount >= Math.PI) {
        this.isPaused = true;
        let overshoot = this.rotatedAmount - Math.PI;
        if (this.angleSpeed > 0) {
          this.angle -= overshoot;
        } else {
          this.angle += overshoot;
        }
        this.rotatedAmount = 0;
        this.pauseTimer = this.maxPause;
      }
    } else {
      this.pauseTimer--;
      if (this.pauseTimer <= 0) {
        this.isPaused = false;
      }
    }
  }
}

export class movingObstacle extends ObjectGraphique {
  constructor(x, y, w, h, couleur, moveX, moveY) {
    super(x, y, w, h, couleur);
    this.moveX = moveX;
    this.moveY = moveY;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.couleur;
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }

  move() {
    this.x += this.moveX;
    this.y += this.moveY;
  }
}

export class MovingObstacle extends Obstacle {
  constructor(x, y, w, h, couleur, distX, distY, speed) {
    super(x, y, w, h, couleur);
    this.startX = x;
    this.startY = y;
    this.distX = distX;
    this.distY = distY;
    this.speed = speed;
    this.timer = 0;
    this.image = new Image();
    this.image.onload = () => {
      if (this.image.naturalWidth > 0 && this.image.naturalHeight > 0) {
        const ratio = this.image.naturalWidth / this.image.naturalHeight;
        if (this.h > this.w) {
          this.h = this.w * ratio;
        } else {
          this.w = this.h * ratio;
        }
      }
    };
    this.image.src = "assets/images/movingspikes.png";
  }

  move() {
    this.timer += this.speed;
    this.x = this.startX + Math.sin(this.timer) * this.distX;
    this.y = this.startY + Math.sin(this.timer) * this.distY;
  }

  draw(ctx) {
    if (this.image.complete && this.image.naturalWidth !== 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // centre
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

      if (this.h > this.w) {
        // vertical
        ctx.rotate(Math.PI / 2);
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

export class CircleObstacle extends ObjectGraphique {
  constructor(x, y, radius, couleur) {
    super(x, y, radius * 2, radius * 2, couleur);
    this.radius = radius;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.couleur;
    ctx.beginPath();
    ctx.translate(this.x, this.y);
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class PipeObstacle extends Obstacle {
  constructor(
    x,
    y,
    w,
    h,
    angle = 0,
    topCap = true,
    bottomCap = true,
    flipped = false,
  ) {
    super(x, y, w, h, "gray");
    this.angle = angle;
    this.topCap = topCap;
    this.bottomCap = bottomCap;
    this.flipped = flipped;
    this.bodyImg = new Image();
    this.bodyImg.src = "assets/images/pipe_texture.png";
    this.capImg = new Image();
    this.capImg.src = "assets/images/pipe_end.png";
  }

  draw(ctx) {
    if (
      !this.bodyImg.complete ||
      !this.capImg.complete ||
      this.bodyImg.naturalWidth === 0
    ) {
      super.draw(ctx);
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    let drawX = 0;
    let drawY = 0;

    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate(this.angle);
    if (this.flipped) {
      ctx.scale(-1, 1);
    }
    drawX = -this.w / 2;
    drawY = -this.h / 2;

    const capRatio = 3 / 8;
    const capHeight = this.w * capRatio;
    const bodyWidthRatio = 5 / 8;
    const bodyWidth = this.w * bodyWidthRatio;
    const bodyX = drawX + (this.w - bodyWidth) / 2;

    let currentY = drawY;
    let currentH = this.h;

    // bouchons
    if (this.topCap) {
      ctx.drawImage(this.capImg, drawX, drawY, this.w, capHeight);
      currentY += capHeight;
      currentH -= capHeight;
    }

    if (this.bottomCap) {
      currentH -= capHeight;
      ctx.save();
      ctx.translate(drawX, drawY + this.h);
      ctx.scale(1, -1);
      ctx.drawImage(this.capImg, 0, 0, this.w, capHeight);
      ctx.restore();
    }

    // corps
    if (currentH > 0) {
      ctx.drawImage(this.bodyImg, bodyX, currentY, bodyWidth, currentH);
    }

    ctx.restore();
  }
}

export class PipeCorner extends Obstacle {
  constructor(x, y, w, h, angle = 0) {
    super(x, y, w, h, "gray");
    this.angle = angle;
    this.image = new Image();
    this.image.src = "assets/images/pipeangle.png";
  }

  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate(this.angle);

    if (this.image.complete && this.image.naturalWidth !== 0) {
      ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = this.couleur;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}
