import Player from "./Player.js";
import Obstacle, {
  RotatingObstacle,
  MovingObstacle,
  CircleObstacle,
  TexturedObstacle,
  PipeObstacle,
  ImageObstacle,
  PipeCorner,
} from "./Obstacle.js";
import fin from "./fin.js";
import bumper from "./bumper.js";
import speedPotion from "./speedPotion.js";
import sizePotion from "./sizepotion.js";
import fadingDoor from "./fadingDoor.js";
import keypad from "./keypad.js";
import teleporter from "./teleporter.js";
import { rectsOverlap } from "./collisions.js";

export default class Levels {
  constructor(game) {
    this.game = game;
    this.customLevels = new Map();
  }

  registerCustomLevel(id, data) {
    this.customLevels.set(id, data);
  }

  loadFromJSON(data) {
    this.game.objetsGraphiques = [];
    this.game.playerSpeed = 5;

    data.forEach((objData) => {
      let newObj;
      switch (objData.type) {
        case "player":
          this.game.player = new Player(objData.x, objData.y);
          this.game.player.w = objData.w;
          this.game.player.h = objData.h;
          newObj = this.game.player;
          break;
        case "rect":
          newObj = new Obstacle(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
          );
          break;
        case "textured":
          newObj = new TexturedObstacle(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.imageSrc,
          );
          break;
        case "circle":
          newObj = new CircleObstacle(
            objData.x,
            objData.y,
            objData.r || objData.w / 2,
            objData.couleur,
          );
          break;
        case "rotating":
          newObj = new RotatingObstacle(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            objData.angleSpeed,
            objData.angle,
          );
          break;
        case "bumper":
          newObj = new bumper(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            objData.direction,
          );
          break;
        case "fin":
          newObj = new fin(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            "assets/images/portal.png",
          );
          break;
        case "speed":
          newObj = new speedPotion(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            objData.vitesse,
            objData.temps,
          );
          break;
        case "size":
          newObj = new sizePotion(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            objData.tailleW,
            objData.tailleH,
          );
          break;
        case "door":
          newObj = new fadingDoor(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.timer,
            objData.id,
          );
          break;
        case "keypad":
          newObj = new keypad(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.temps,
            objData.id,
          );
          break;
        case "moving":
          newObj = new MovingObstacle(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            objData.distX,
            objData.distY,
            objData.speed,
          );
          break;
        case "teleporter":
          newObj = new teleporter(
            objData.x,
            objData.y,
            objData.w,
            objData.h,
            objData.couleur,
            objData.destinationX,
            objData.destinationY,
          );
          break;
      }
      if (newObj) {
        if (objData.angle && !(newObj instanceof RotatingObstacle))
          newObj.angle = objData.angle;
        this.game.objetsGraphiques.push(newObj);
      }
    });

    if (!this.game.player) {
      this.game.player = new Player(100, 100);
      this.game.objetsGraphiques.push(this.game.player);
    }
  }

  load(levelNumber) {
    this.game.objetsGraphiques = [];
    this.game.playerSpeed = 5;
    this.game.levelUpdate = null; // reset logique niveau

    if (this.customLevels.has(levelNumber)) {
      this.loadFromJSON(this.customLevels.get(levelNumber));
      return;
    }

    if (levelNumber === 0) {
      this.game.player = new Player(700, 500);
      this.game.objetsGraphiques.push(this.game.player);
      if (this.game.levelElement) this.game.levelElement.innerText = "Editeur";
      return;
    }

    if (levelNumber === 1) {
      this.game.player = new Player(100, 100);
      this.game.objetsGraphiques.push(this.game.player);
      let obstacle1 = new PipeObstacle(285, 0, 70, 600);
      this.game.objetsGraphiques.push(obstacle1);
      let obstacle3 = new PipeObstacle(885, 300, 70, 700);
      this.game.objetsGraphiques.push(obstacle3);
      this.game.fin = new fin(
        1100,
        50,
        100,
        100,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 2) {
      this.game.player = new Player(100, 100);
      this.game.objetsGraphiques.push(this.game.player);
      this.game.objetsGraphiques.push(
        new RotatingObstacle(320, 470, 250, 20, "black", 0.02, 0),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(320, 470, 250, 20, "black", 0.02, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(800, 600, 250, 20, "black", -0.02, 0),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(800, 600, 250, 20, "black", -0.02, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(new PipeObstacle(530, 0, 70, 400));
      this.game.objetsGraphiques.push(new PipeObstacle(530, 600, 70, 400));
      let wallRightX = 1080;
      this.game.objetsGraphiques.push(
        new PipeObstacle(wallRightX, 400, 70, 600),
      );
      this.game.fin = new fin(
        1250,
        850,
        100,
        100,
        "red",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 3) {
      // niveau 3
      this.game.player = new Player(50, 500);
      this.game.objetsGraphiques.push(this.game.player);

      // coins map
      // coin haut gauche
      this.game.objetsGraphiques.push(
        new PipeCorner(265, 214, 55, 55, -Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(120, 115, 40, 275, Math.PI / 2, false, true),
      ); // horizontal
      this.game.objetsGraphiques.push(
        new PipeObstacle(282.5, 47, 40, 180, 0, false, false),
      ); // vertical

      // coin bas gauche
      this.game.objetsGraphiques.push(
        new PipeCorner(265, 761, 55, 55, Math.PI),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(120, 640, 40, 275, Math.PI / 2, false, true),
      ); // horizontal
      this.game.objetsGraphiques.push(
        new PipeObstacle(282.5, 800, 40, 150, 0, false, false),
      ); // vertical

      // murs arene
      this.game.objetsGraphiques.push(
        new PipeCorner(286, 5, 55, 55, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(863, -532, 30, 1100, Math.PI / 2, false, false),
      ); // mur haut
      this.game.objetsGraphiques.push(new PipeCorner(286, 937, 55, 55));
      this.game.objetsGraphiques.push(
        new PipeObstacle(863, 429, 30, 1100, Math.PI / 2, false, false),
      ); // mur bas
      this.game.objetsGraphiques.push(new PipeObstacle(1300, 0, 100, 1000));
      this.game.objetsGraphiques.push(
        new ImageObstacle(650, 350, 300, 300, "assets/images/metalblock.png"),
      );

      // croix
      this.game.objetsGraphiques.push(
        new RotatingObstacle(250, 500, 140, 15, "red", 0.04, 0),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(250, 500, 140, 15, "red", 0.04, Math.PI / 2),
      );

      // bumpers murs
      // mur haut
      for (let x = 420; x < 1150; x += 75) {
        this.game.objetsGraphiques.push(
          new bumper(x, 30, 75, 75, "orange", "down"),
        );
      }
      // mur bas
      for (let x = 420; x < 1150; x += 75) {
        this.game.objetsGraphiques.push(
          new bumper(x, 895, 75, 75, "orange", "up"),
        );
      }
      // mur droite
      for (let y = 80; y < 920; y += 75) {
        this.game.objetsGraphiques.push(
          new bumper(1225, y, 75, 75, "orange", "left"),
        );
      }
      // mur gauche haut
      for (let y = 80; y < 230; y += 75) {
        this.game.objetsGraphiques.push(
          new bumper(330, y, 75, 75, "orange", "right"),
        );
      }
      // mur gauche bas
      for (let y = 780; y < 920; y += 75) {
        this.game.objetsGraphiques.push(
          new bumper(330, y, 75, 75, "orange", "right"),
        );
      }

      // bumpers centre
      for (let x = 700; x < 900; x += 75) {
        // haut bas
        this.game.objetsGraphiques.push(
          new bumper(x, 275, 75, 75, "orange", "up"),
        );
        this.game.objetsGraphiques.push(
          new bumper(x, 650, 75, 75, "orange", "down"),
        );
      }
      for (let y = 350; y < 650; y += 75) {
        // gauche droite
        this.game.objetsGraphiques.push(
          new bumper(575, y, 75, 75, "orange", "left"),
        );
        this.game.objetsGraphiques.push(
          new bumper(950, y, 75, 75, "orange", "right"),
        );
      }

      // sortie
      this.game.fin = new fin(
        1150,
        475,
        80,
        80,
        "red",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 4) {
      this.game.player = new Player(50, 50);
      this.game.objetsGraphiques.push(this.game.player);
      this.game.objetsGraphiques.push(
        new speedPotion(430, 700, 30, 30, "cyan", 6, 5000),
      );
      for (let i = 0; i < 4; i++) {
        let x = 300 + i * 250;
        let y = i % 2 === 0 ? 0 : 400;
        this.game.objetsGraphiques.push(new PipeObstacle(x, y, 50, 600));
        let dir = i % 2 === 0 ? "down" : "up";
        let bumperY = i % 2 === 0 ? 600 : 350;
        this.game.objetsGraphiques.push(
          new bumper(x + 5, bumperY, 40, 50, "orange", dir),
        );
      }
      this.game.fin = new fin(
        1300,
        800,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 5) {
      this.game.player = new Player(150, 150);
      this.game.objetsGraphiques.push(this.game.player);
      this.game.objetsGraphiques.push(
        new PipeObstacle(180, 220, 40, 400, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1230, 270, 40, 300, Math.PI / 2),
      );
      for (let x = 0; x < 1340; x += 60) {
        this.game.objetsGraphiques.push(
          new bumper(x, 0, 60, 60, "orange", "down"),
        );
        this.game.objetsGraphiques.push(
          new bumper(x, 940, 60, 60, "orange", "up"),
        );
      }
      const centers = [600, 900];
      centers.forEach((cx, i) => {
        this.game.objetsGraphiques.push(
          new RotatingObstacle(cx, 500, 300, 20, "purple", 0.04, 0),
        );
        this.game.objetsGraphiques.push(
          new RotatingObstacle(cx, 500, 300, 20, "purple", 0.04, Math.PI / 2),
        );
      });
      this.game.finPortal = new fin(
        1300,
        200,
        100,
        100,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.finPortal);
      this.game.portalStage = 0;

      // logique niveau 5
      this.game.levelUpdate = () => {
        if (this.game.finPortal) {
          let dx = this.game.player.x - this.game.finPortal.x;
          let dy = this.game.player.y - this.game.finPortal.y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 250) {
            if (this.game.portalStage === 0) {
              this.game.finPortal.x = 1250;
              this.game.finPortal.y = 850;
              this.game.portalStage = 1;
              console.log("Portal : 'Nope ! Attrape-moi en bas !'");
            } else if (this.game.portalStage === 1) {
              this.game.finPortal.x = 150;
              this.game.finPortal.y = 650;
              this.game.portalStage = 2;
              console.log(
                "Portal : 'Plus vite ! Je suis caché sous la barre !'",
              );
            }
          }
        }
      };
    } else if (levelNumber === 6) {
      // niveau 6
      // pos joueur

      this.game.player = new Player(80, 500);
      this.game.objetsGraphiques.push(this.game.player);

      // potion
      this.game.objetsGraphiques.push(
        new sizePotion(220, 480, 40, 40, "magenta", -70, -70),
      );

      // piliers
      // mur 1
      this.game.objetsGraphiques.push(new PipeObstacle(400, 0, 50, 800));

      // carres 1
      for (let i = 0; i < 5; i++) {
        this.game.objetsGraphiques.push(
          new ImageObstacle(
            500,
            100 + i * 150,
            30,
            30,
            "assets/images/metalblock.png",
          ),
        );
        this.game.objetsGraphiques.push(
          new ImageObstacle(
            600,
            50 + i * 150,
            30,
            30,
            "assets/images/metalblock.png",
          ),
        );
      }

      // mur 2
      this.game.objetsGraphiques.push(new PipeObstacle(700, 80, 50, 920));

      // carres 2
      for (let i = 0; i < 4; i++) {
        this.game.objetsGraphiques.push(
          new ImageObstacle(
            850,
            150 + i * 180,
            35,
            35,
            "assets/images/metalblock.png",
          ),
        );
      }

      // mur 3
      this.game.objetsGraphiques.push(new PipeObstacle(1000, 0, 50, 450));
      this.game.objetsGraphiques.push(new PipeObstacle(1000, 550, 50, 450));

      // obstacle rotatif
      this.game.objetsGraphiques.push(
        new RotatingObstacle(1150, 500, 180, 15, "purple", 0.08),
      );

      // potions malus
      this.game.objetsGraphiques.push(
        new sizePotion(550, 850, 35, 35, "red", 70, 70),
      );
      this.game.objetsGraphiques.push(
        new sizePotion(850, 20, 35, 35, "red", 70, 70),
      );

      // sortie
      this.game.fin = new fin(
        1300,
        500,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 7) {
      this.game.player = new Player(700, 50);
      this.game.player.w = 40;
      this.game.player.h = 40;
      this.game.objetsGraphiques.push(this.game.player);
      const colors = ["pink", "cyan", "yellow", "orange", "purple"];
      const rowY = [250, 450, 650, 850];
      const doorWidth = 280;
      rowY.forEach((y, rowIndex) => {
        let mapping = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
        for (let i = 0; i < 5; i++) {
          let doorId = rowIndex * 10 + i;
          this.game.objetsGraphiques.push(
            new fadingDoor(
              i * doorWidth,
              y,
              doorWidth,
              70,
              5000,
              doorId,
              Math.PI / 2,
            ),
          );
          let targetDoorId = rowIndex * 10 + mapping[i];
          this.game.objetsGraphiques.push(
            new keypad(150 + i * 270, y - 120, 35, 35, 5000, targetDoorId),
          );
        }
      });
      this.game.fin = new fin(
        700,
        920,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 8) {
      // niveau 8
      this.game.player = new Player(200, 500);
      this.game.objetsGraphiques.push(this.game.player);

      // dimensions
      const roomLeft = 335;
      const roomRight = 1035;
      const roomTop = 185;
      const roomBottom = 785;
      const pipeThickness = 40;

      // spawn

      // coin hg
      this.game.objetsGraphiques.push(
        new PipeCorner(88.1, 400, 55, 55, Math.PI / 2),
      );

      // coin bg
      this.game.objetsGraphiques.push(new PipeCorner(88.1, 584, 55, 55, 0));

      // mur arriere
      this.game.objetsGraphiques.push(
        new PipeObstacle(85, 440, 40, 160, 0, false, false),
      );

      // tuyau haut
      this.game.objetsGraphiques.push(
        new PipeObstacle(210, 311.7, 40, 210, Math.PI / 2, false, false),
      );

      // tuyau bas
      this.game.objetsGraphiques.push(
        new PipeObstacle(210, 517.3, 40, 210, Math.PI / 2, false, false, true),
      );

      // murs gauche

      // mur haut
      this.game.objetsGraphiques.push(
        new PipeObstacle(roomLeft + 3, 225, 40, 175, 0, false, false),
      );

      this.game.objetsGraphiques.push(
        new PipeCorner(320, 378, 55, 55, -Math.PI / 2),
      ); // coin haut

      // mur bas
      this.game.objetsGraphiques.push(
        new PipeObstacle(roomLeft - 3.5, 640, 40, 140, 0, false, false),
      );

      // coins salle
      this.game.objetsGraphiques.push(
        new PipeCorner(roomLeft + 6.2, roomTop, 55, 55, Math.PI / 2),
      ); // hg
      this.game.objetsGraphiques.push(
        new PipeCorner(roomLeft, roomBottom - 18, 55, 55, 0),
      ); // bg

      // murs horizontaux

      // haut
      this.game.objetsGraphiques.push(
        new PipeObstacle(685, -129.8, 40, 660, Math.PI / 2, false, false),
      );

      // bas
      this.game.objetsGraphiques.push(
        new PipeObstacle(685, 475, 40, 660, Math.PI / 2, false, false),
      );
      this.game.objetsGraphiques.push(
        new PipeCorner(313, 606, 55, 55, Math.PI),
      );

      // mur droite

      // obstacles fin
      const speed = 0.02;
      this.game.objetsGraphiques.push(
        new RotatingObstacle(700, 500, 700, 20, "purple", speed, 0),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(700, 500, 700, 20, "purple", speed, Math.PI / 2),
      );
      // bumpers
      this.game.objetsGraphiques.push(
        new bumper(380, 230, 50, 50, "yellow", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(980, 230, 50, 50, "yellow", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(380, 700, 50, 50, "yellow", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(980, 700, 50, 50, "yellow", "up"),
      );

      // porte fin
      this.game.objetsGraphiques.push(new keypad(700, 740, 25, 25, 10000, 88));
      this.game.objetsGraphiques.push(
        new fadingDoor(roomRight, 200, 100, 610, 10000, 88),
      ); // porte droite
      this.game.fin = new fin(
        1250,
        500,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 9) {
      this.game.player = new Player(150, 150);
      this.game.player.w = 80;
      this.game.player.h = 80;
      this.game.playerSpeed = 8;
      this.game.objetsGraphiques.push(this.game.player);

      // tuyaux
      // coin hg
      this.game.objetsGraphiques.push(
        new PipeCorner(46, 48, 55, 55, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(145, -20, 45, 170, Math.PI / 2, false, false),
      ); // mur haut
      // coin hd
      this.game.objetsGraphiques.push(new PipeCorner(240, 48, 55, 55, Math.PI));

      this.game.objetsGraphiques.push(
        new PipeObstacle(257.5, 90, 40, 655, 0, false, false),
      ); // mur droite
      this.game.objetsGraphiques.push(
        new PipeObstacle(42.5, 90, 40, 862, 0, false, false),
      ); // mur gauche

      // coin bg
      this.game.objetsGraphiques.push(new PipeCorner(46, 939, 55, 55, 0));
      // coin md
      this.game.objetsGraphiques.push(new PipeCorner(261, 725, 55, 55, 0));

      const vSpeed = 0.05;
      this.game.objetsGraphiques.push(
        new MovingObstacle(150, 280, 40, 160, "purple", 70, 0, vSpeed),
      );
      let bar2 = new MovingObstacle(150, 560, 40, 160, "purple", 70, 0, vSpeed);
      bar2.timer = Math.PI;
      this.game.objetsGraphiques.push(bar2);
      this.game.objetsGraphiques.push(
        new ImageObstacle(90, 810, 30, 30, "assets/images/metalblock.png"),
      );
      this.game.objetsGraphiques.push(
        new ImageObstacle(180, 860, 30, 30, "assets/images/metalblock.png"),
      );
      this.game.objetsGraphiques.push(
        new ImageObstacle(110, 910, 30, 30, "assets/images/metalblock.png"),
      );

      this.game.objetsGraphiques.push(
        new PipeObstacle(807.5, 237, 40, 1050, Math.PI / 2, false, false),
      ); // mur haut couloir
      this.game.objetsGraphiques.push(
        new PipeObstacle(703, 342, 40, 1270, Math.PI / 2, false, false),
      ); // mur bas couloir

      // fin couloir
      this.game.objetsGraphiques.push(
        new PipeCorner(1340, 746, 55, 55, Math.PI),
      ); // coin haut
      this.game.objetsGraphiques.push(
        new PipeCorner(1340, 939, 55, 55, -Math.PI / 2),
      ); // coin bas
      this.game.objetsGraphiques.push(
        new PipeObstacle(1357.5, 785, 40, 167, 0, false, false),
      ); // mur fin

      this.game.objetsGraphiques.push(
        new MovingObstacle(600, 850, 180, 60, "purple", 0, 70, vSpeed),
      );
      let bar4 = new MovingObstacle(950, 850, 180, 60, "purple", 0, 70, vSpeed);
      bar4.timer = Math.PI;
      this.game.objetsGraphiques.push(bar4);
      this.game.fin = new fin(
        1250,
        850,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);

      // logique niveau 9
      this.game.levelUpdate = () => {
        let p = this.game.player;
        // zones
        let inVerticalCorridor = p.x > 90 && p.x < 250 && p.y > 90 && p.y < 950;
        let inHorizontalCorridor =
          p.x > 90 && p.x < 1350 && p.y > 790 && p.y < 950;

        if (!inVerticalCorridor && !inHorizontalCorridor) {
          this.game.restartLevel();
          return;
        }

        // ecrasement
        const margin = 2;
        for (let obj of this.game.objetsGraphiques) {
          if (obj instanceof MovingObstacle) {
            if (
              rectsOverlap(
                p.x - p.w / 2 + margin,
                p.y - p.h / 2 + margin,
                p.w - margin * 2,
                p.h - margin * 2,
                obj.x,
                obj.y,
                obj.w,
                obj.h,
              )
            ) {
              this.game.restartLevel();
              return;
            }
          }
        }
      };
    } else if (levelNumber === 10) {
      this.game.player = new Player(50, 50);
      this.game.objetsGraphiques.push(this.game.player);
      this.game.objetsGraphiques.push(
        new Obstacle(150, 100, 350, 250, "black"),
      );
      this.game.objetsGraphiques.push(
        new Obstacle(225, 175, 200, 100, "white"),
      );
      this.game.objetsGraphiques.push(
        new Obstacle(850, 100, 400, 250, "black"),
      );
      this.game.objetsGraphiques.push(
        new Obstacle(925, 175, 250, 100, "white"),
      );
      const cx = 700,
        cy = 380;
      this.game.objetsGraphiques.push(
        new RotatingObstacle(cx, cy, 180, 15, "red", 0.04, 0),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(cx, cy, 180, 15, "green", 0.04, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new Obstacle(400, 500, 550, 200, "black"),
      );
      this.game.objetsGraphiques.push(
        new Obstacle(430, 530, 490, 140, "white"),
      );
      this.game.objetsGraphiques.push(new Obstacle(400, 700, 70, 150, "black"));
      const steps = [
        { x: 800, y: 730 },
        { x: 880, y: 780 },
        { x: 980, y: 830 },
        { x: 1080, y: 880 },
        { x: 1160, y: 920 },
        { x: 1260, y: 950 },
      ];
      steps.forEach((s) => {
        this.game.objetsGraphiques.push(
          new Obstacle(s.x, s.y, 60, 30, "green"),
        );
      });
      this.game.finPortal = new fin(
        1300,
        80,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.finPortal);
      this.game.portalStage = 0;

      // logique niveau 10
      this.game.levelUpdate = () => {
        if (this.game.finPortal) {
          let dx = this.game.player.x - this.game.finPortal.x;
          let dy = this.game.player.y - this.game.finPortal.y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 250) {
            if (this.game.portalStage === 0) {
              this.game.finPortal.x = 1050;
              this.game.finPortal.y = 450;
              this.game.portalStage = 1;
            } else if (this.game.portalStage === 1) {
              this.game.finPortal.x = 1300;
              this.game.finPortal.y = 850;
              this.game.portalStage = 2;
            } else if (this.game.portalStage === 2) {
              this.game.finPortal.x = 675;
              this.game.finPortal.y = 850;
              this.game.portalStage = 3;
            } else if (this.game.portalStage === 3) {
              this.game.finPortal.x = 70;
              this.game.finPortal.y = 70;
              this.game.portalStage = 4;
            }
          }
        }
      };
    } else if (levelNumber === 11) {
      // niveau 11

      // depart
      this.game.player = new Player(120, 500); //
      this.game.objetsGraphiques.push(this.game.player); //

      // murs exterieurs
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, -600, 20, 1320, Math.PI / 2),
      ); // plafond
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, 150, 20, 1320, Math.PI / 2),
      ); // sol
      this.game.objetsGraphiques.push(new PipeObstacle(0, 70, 20, 730)); // mur gauche
      this.game.objetsGraphiques.push(new PipeObstacle(780, 215, 20, 590)); // mur droit
      this.game.objetsGraphiques.push(new PipeObstacle(200, 405, 20, 250));
      this.game.objetsGraphiques.push(new PipeObstacle(500, 555, 20, 250));
      this.game.objetsGraphiques.push(new PipeObstacle(1300, 50, 20, 750)); // mur droite
      this.game.objetsGraphiques.push(
        new PipeObstacle(1015, 385, 20, 250, Math.PI / 2),
      );

      // murs interieurs
      // mur 1
      this.game.objetsGraphiques.push(
        new PipeObstacle(305, 110, 20, 600, Math.PI / 2),
      );
      // mur 2
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, -240, 20, 900, Math.PI / 2),
      );

      // potion vitesse
      this.game.objetsGraphiques.push(
        new speedPotion(400, 100, 30, 30, "cyan", 6, 5000),
      );

      // obstacle mobile
      this.game.objetsGraphiques.push(
        new MovingObstacle(1000, 300, 50, 50, "purple", 150, 0, 0.05),
      );

      // bumpers

      this.game.objetsGraphiques.push(new bumper(250, 450, 60, 60, "orange")); // bas droit
      this.game.objetsGraphiques.push(new bumper(20, 350, 60, 60, "orange")); // milieu gauche
      this.game.objetsGraphiques.push(new bumper(400, 300, 50, 50, "orange")); // centre
      this.game.objetsGraphiques.push(new bumper(20, 70, 60, 60, "orange")); // haut gauche
      this.game.objetsGraphiques.push(new bumper(1240, 70, 60, 60, "orange")); // haut droit
      this.game.objetsGraphiques.push(new bumper(1240, 750, 60, 60, "orange")); // bas droit
      this.game.objetsGraphiques.push(new bumper(940, 750, 60, 60, "orange"));
      this.game.objetsGraphiques.push(new bumper(100, 750, 60, 60, "orange"));
      this.game.objetsGraphiques.push(new bumper(540, 750, 60, 60, "orange"));
      this.game.objetsGraphiques.push(new bumper(540, 150, 60, 60, "orange"));

      // sortie

      this.game.fin = new fin(
        800,
        700,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 12) {
      // niveau 12

      // depart
      this.game.player = new Player(485, 460); // centre
      this.game.objetsGraphiques.push(this.game.player);

      // murs
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, -600, 20, 1320, Math.PI / 2),
      ); // plafond
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, 200, 20, 1320, Math.PI / 2),
      ); // sol
      this.game.objetsGraphiques.push(new PipeObstacle(0, 70, 20, 780)); // mur gauche
      this.game.objetsGraphiques.push(new PipeObstacle(1300, 70, 20, 780)); // mur droite
      this.game.objetsGraphiques.push(new PipeObstacle(300, 70, 20, 780));
      this.game.objetsGraphiques.push(new PipeObstacle(650, 70, 20, 780));
      this.game.objetsGraphiques.push(new PipeObstacle(1000, 70, 20, 780));
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, -350, 20, 1320, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(650, -50, 20, 1320, Math.PI / 2),
      );

      // teleporteurs
      const cols = [
        { start: 20, end: 300, center: 160 },
        { start: 320, end: 650, center: 485 },
        { start: 670, end: 1000, center: 835 },
        { start: 1020, end: 1300, center: 1160 },
      ];
      const rows = [
        { start: 70, end: 300, center: 185 },
        { start: 320, end: 600, center: 460 },
        { start: 620, end: 850, center: 735 },
      ];

      // On génère les 4 téléporteurs pour chaque "boite" (salle)
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols.length; c++) {
          let roomX = cols[c].start;
          let roomY = rows[r].start;
          let roomW = cols[c].end - cols[c].start;
          let roomH = rows[r].end - rows[r].start;

          // coins
          let margin = 30;
          let tSize = 30;
          let corners = [
            { x: roomX + margin, y: roomY + margin }, // hg
            { x: roomX + roomW - margin - tSize, y: roomY + margin }, // hd
            { x: roomX + margin, y: roomY + roomH - margin - tSize }, // bg
            {
              x: roomX + roomW - margin - tSize,
              y: roomY + roomH - margin - tSize,
            }, // bd
          ];

          corners.forEach((pos, index) => {
            // destination
            let destC = (c + 1 + index) % cols.length;
            let destR = (r + 1 + index) % rows.length;

            // pas meme salle
            if (destC === c && destR === r) destC = (destC + 1) % cols.length;

            this.game.objetsGraphiques.push(
              new teleporter(
                pos.x,
                pos.y,
                tSize,
                tSize,
                "purple",
                cols[destC].center,
                rows[destR].center,
              ),
            );
          });
        }
      }

      // sortie
      this.game.fin = new fin(
        800,
        60,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 13) {
      // niveau 13

      // depart
      this.game.player = new Player(100, 800);
      this.game.objetsGraphiques.push(this.game.player);

      // murs
      this.game.objetsGraphiques.push(
        new PipeObstacle(640, -590, 20, 1300, Math.PI / 2),
      ); // plafond
      this.game.objetsGraphiques.push(
        new PipeObstacle(640, 310, 20, 1300, Math.PI / 2),
      ); // sol
      this.game.objetsGraphiques.push(new PipeObstacle(0, 50, 20, 920)); // mur gauche
      this.game.objetsGraphiques.push(new PipeObstacle(1280, 50, 20, 920)); // mur droit

      // separation
      // bas
      this.game.objetsGraphiques.push(
        new PipeObstacle(540, 110, 20, 1100, Math.PI / 2),
      );
      // haut
      this.game.objetsGraphiques.push(
        new PipeObstacle(740, -190, 20, 1100, Math.PI / 2),
      );

      // obstacles mobiles
      // bas
      this.game.objetsGraphiques.push(
        new MovingObstacle(400, 800, 60, 60, "red", 0, 100, 0.05),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(800, 800, 60, 60, "red", 0, 100, 0.06),
      );

      // milieu
      this.game.objetsGraphiques.push(
        new MovingObstacle(500, 500, 60, 60, "red", 0, 100, 0.07),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(900, 500, 60, 60, "red", 0, 100, 0.05),
      );

      // haut
      this.game.objetsGraphiques.push(
        new MovingObstacle(400, 200, 60, 60, "red", 0, 80, 0.04),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(800, 200, 60, 60, "red", 0, 80, 0.06),
      );

      // bumpers
      this.game.objetsGraphiques.push(new bumper(1150, 800, 70, 70, "orange")); // bas droit
      this.game.objetsGraphiques.push(new bumper(80, 500, 70, 70, "orange")); // milieu gauche
      this.game.objetsGraphiques.push(new bumper(600, 100, 70, 70, "orange")); // final

      // sortie
      this.game.fin = new fin(
        1150,
        150,
        100,
        100,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 14) {
      // niveau 14

      // joueur
      this.game.player = new Player(130, 200);
      this.game.objetsGraphiques.push(this.game.player);

      // obstacles
      this.game.objetsGraphiques.push(
        new PipeObstacle(336.02, -245.98, 18.39, 642.15, Math.PI / 2),
      ); // plafond g
      this.game.objetsGraphiques.push(
        new PipeObstacle(23.37, 74.33, 21.46, 252.87),
      ); // mur g h
      this.game.objetsGraphiques.push(
        new PipeObstacle(333.03, -3.76, 18.39, 642.15, Math.PI / 2),
      ); // plafond 1
      this.game.objetsGraphiques.push(
        new PipeObstacle(333.03, 297.39, 18.39, 642.15, Math.PI / 2),
      ); // sol 1
      this.game.objetsGraphiques.push(
        new PipeObstacle(24.52, 308.43, 21.15, 309.27),
      ); // mur g b
      this.game.objetsGraphiques.push(
        new PipeObstacle(203.91, 323.98, 21.15, 186.36),
      ); // obstacle g
      this.game.objetsGraphiques.push(
        new PipeObstacle(442.3, 435.94, 21.15, 186.36),
      ); // obstacle d
      this.game.objetsGraphiques.push(
        new PipeObstacle(654.33, 27.89, 24.21, 787.43),
      ); // mur central
      this.game.objetsGraphiques.push(
        new PipeObstacle(932.64, 34.87, 30.19, 787.43),
      ); // mur d int
      this.game.objetsGraphiques.push(
        new PipeObstacle(969.12, -284.91, 18.39, 642.15, Math.PI / 2),
      ); // plafond d
      this.game.objetsGraphiques.push(
        new PipeObstacle(1277.47, 28.81, 18.08, 787.43),
      ); // mur d ext
      this.game.objetsGraphiques.push(
        new PipeObstacle(966.9, 492.18, 18.39, 642.15, Math.PI / 2),
      ); // sol d
      this.game.objetsGraphiques.push(
        new PipeObstacle(714.87, 636.33, 21.15, 110.04, Math.PI / 2),
      ); // mur bas
      this.game.objetsGraphiques.push(
        new PipeObstacle(1093.87, 236.02, 52.87, 154.02),
      ); // bloc d h
      this.game.objetsGraphiques.push(
        new PipeObstacle(1019.18, 613.95, 21.15, 195.25),
      ); // bloc d b 1
      this.game.objetsGraphiques.push(
        new PipeObstacle(1198.74, 613.95, 21.15, 195.25),
      ); // bloc d b 2

      // teleporteurs
      this.game.objetsGraphiques.push(
        new teleporter(562.76, 100.31, 40, 40, "purple", 100, 350),
      );
      this.game.objetsGraphiques.push(
        new teleporter(565.9, 234.48, 40, 40, "purple", 800, 100),
      );
      this.game.objetsGraphiques.push(
        new teleporter(579.0, 553.33, 40, 40, "purple", 1100, 100),
      );
      this.game.objetsGraphiques.push(
        new teleporter(706.21, 737.24, 40, 40, "purple", 1100, 100),
      );
      this.game.objetsGraphiques.push(
        new teleporter(1106.9, 376.67, 25.29, 26.4, "purple", 100, 100),
      );

      // bumpers
      this.game.objetsGraphiques.push(
        new bumper(44.83, 570.88, 42.91, 38.31, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(235.63, 327.2, 44.44, 36.78, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(463.22, 583.14, 33.72, 27.59, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(607.28, 324.9, 30.65, 30.65, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(389.94, 556.61, 50, 50, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(682.66, 630.17, 50, 50, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(903.83, 777.01, 32.18, 27.59, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(677.3, 444.73, 50, 50, "orange", "right"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1242.53, 512.64, 35.25, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1214.25, 545.67, 35.25, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1192.8, 580.92, 35.25, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(962.15, 512.64, 35.25, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(989.81, 545.67, 35.25, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1012.87, 580.92, 35.25, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(961.59, 44.73, 50, 50, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1229.1, 43.28, 50, 50, "orange", "down"),
      );

      // rotation
      this.game.objetsGraphiques.push(
        new RotatingObstacle(799.62, 380.08, 300, 18.1, "black", 0.02, 1776.16),
      );

      // fin
      this.game.fin = new fin(
        1096.31,
        731.65,
        50,
        50,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 15) {
      // niveau 15

      // joueur
      this.game.player = new Player(693.75, 218.39);
      this.game.player.w = 100;
      this.game.player.h = 53.33;
      this.game.objetsGraphiques.push(this.game.player);

      // murs
      this.game.objetsGraphiques.push(
        new PipeObstacle(678.55, -420.69, 30.65, 1046.74, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(172.03, 85.9, 29.12, 688.12),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1184.37, 85.9, 29.12, 688.12),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(491.65, 286.74, 29.12, 231.26),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(679.39, 98.24, 30.65, 390.98, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(679.39, 249.89, 30.65, 1046.74, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(871.8, 286.05, 29.12, 231.26),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1024.29, 332.1, 30.65, 300.07, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(271.96, 603.38, 25.75, 179.0, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1057.61, 490.59, 20, 108.51),
      );

      // portes et cles
      this.game.objetsGraphiques.push(
        new fadingDoor(860.18, 512.64, 50, 249.81, 3000, 1),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(480.18, 513.49, 50, 249.81, 5000, 2),
      );
      this.game.objetsGraphiques.push(
        new keypad(1084.67, 429.12, 42.91, 35.25, 3000, 2),
      );
      this.game.objetsGraphiques.push(
        new keypad(299.23, 713.41, 44.44, 36.78, 3000, 1),
      );

      // bumpers
      this.game.objetsGraphiques.push(
        new bumper(1136.3, 124.43, 50, 50, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(203.74, 120.59, 50, 50, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(441.28, 438.6, 50, 50, "orange", "left"),
      );
      this.game.objetsGraphiques.push(
        new bumper(824.9, 247.51, 36.78, 38.31, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1012.16, 555.84, 50, 50, "orange", "left"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1157.62, 725.06, 28.97, 30.5, "orange", "up"),
      );

      // potions
      this.game.objetsGraphiques.push(
        new speedPotion(208.37, 712.2, 30, 38.18, "cyan", 5, 3000),
      );
      this.game.objetsGraphiques.push(
        new speedPotion(927.22, 326.07, 30, 38.18, "cyan", 5, 3000),
      );
      this.game.objetsGraphiques.push(
        new sizePotion(676.57, 384.23, 30, 30, "magenta", -40, -40),
      );

      // mobile
      this.game.objetsGraphiques.push(
        new MovingObstacle(644.37, 478.89, 60, 60, "purple", 100, 0, 0.05),
      );

      // sortie
      this.game.fin = new fin(
        1084.52,
        517.09,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 16) {
      // niveau 16

      // joueur
      this.game.player = new Player(322.41, 152.58);
      this.game.player.w = 100;
      this.game.player.h = 53.33;
      this.game.objetsGraphiques.push(this.game.player);

      // murs
      this.game.objetsGraphiques.push(
        new PipeObstacle(124.52, 76.63, 22.99, 800),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(416.48, -208.43, 21.46, 596.17, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(569.89, 89.81, 16.7, 268.38, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(706.28, 79.85, 21.3, 594.48),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(873.26, 489.89, 18.54, 349.27, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(585.9, 399.4, 21.46, 930.11, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1037.47, 657.78, 22.68, 215.79),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(890.42, 771.34, 22.68, 91.49),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(501.54, 660.53, 26.05, 122.61, Math.PI / 2),
      );

      // portes cles
      this.game.objetsGraphiques.push(
        new fadingDoor(450.19, 95.85, 30, 124, 3000, 1),
      );
      this.game.objetsGraphiques.push(
        new keypad(955.17, 814.56, 42.91, 38.31, 3000, 1),
      );

      // mobiles
      this.game.objetsGraphiques.push(
        new MovingObstacle(380, 314.14, 60, 40, "purple", 200, 0, 0.05),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(380, 403.79, 60, 40, "purple", 200, 0, 0.037),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(380, 547.09, 60, 40, "purple", 200, 0, 0.07),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(718.28, 750, 60, 40, "purple", 0, 70, 0.02),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(809.46, 750, 60, 40, "purple", 0, 70, 0.01),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(380, 477.36, 60, 40, "purple", 200, 0, 0.02),
      );

      // rotatif
      this.game.objetsGraphiques.push(
        new RotatingObstacle(254.79, 747.89, 200, 20, "purple", 0.02, 1366.08),
      );

      // bumpers
      this.game.objetsGraphiques.push(
        new bumper(1010.34, 672.03, 27.59, 24.52, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(146.74, 101.15, 36.78, 33.72, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(655.08, 230.94, 50, 50, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(147.51, 817.62, 38.31, 38.31, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(459.39, 675.1, 36.78, 36.78, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(529.89, 732.57, 27.59, 27.59, "orange", "down"),
      );

      // fin
      this.game.fin = new fin(
        601.76,
        107.89,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 17) {
      // niveau 17

      // joueur
      this.game.player = new Player(320.88, 85.67);
      this.game.player.w = 100;
      this.game.player.h = 53.33;
      this.game.objetsGraphiques.push(this.game.player);

      // murs
      this.game.objetsGraphiques.push(
        new PipeObstacle(454.87, 182.45, 21.46, 485.82),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(224.14, -25.28, 22.99, 438.31, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(947.66, 176.4, 21.46, 485.82),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(670, 180, 25.9, 1368.38, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(221.23, 284.45, 13.64, 151.57, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1358.47, -0.31, 21.46, 851.65),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(0, -0.31, 21.46, 851.65),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1254.33, 280.01, 15.02, 197.39, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1037.79, 101.61, 17.93, 166.59, Math.PI / 2),
      );

      // 3. Obstacles Rotatifs (RotatingObstacles)
      this.game.objetsGraphiques.push(
        new RotatingObstacle(707.66, 447.51, 500, 20, "black", 0.02, 2487.66),
      );
      this.game.objetsGraphiques.push(
        new RotatingObstacle(231.03, 516.48, 200, 20, "black", 0.02, 635.02),
      );

      // 4. Portes et Claviers (FadingDoors & Keypads)
      this.game.objetsGraphiques.push(
        new fadingDoor(163.56, -7.66, 40, 190.04, 3000, 1),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(947.51, -0.77, 40, 174.71, 7000, 2),
      );
      this.game.objetsGraphiques.push(
        new keypad(1290.8, 70.5, 41.38, 42.91, 3000, 1),
      );
      this.game.objetsGraphiques.push(
        new keypad(198.08, 250, 44.44, 44.44, 7000, 2),
      );

      // 5. Obstacles Mobiles (Violets)
      this.game.objetsGraphiques.push(
        new MovingObstacle(1130, 521.03, 60, 40, "purple", 100, 0, 0.05),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(690, 439.04, 50, 40, "purple", 200, 0, 0.05),
      );
      this.game.objetsGraphiques.push(
        new MovingObstacle(669.23, 70, 60, 40, "purple", 0, 50, 0.05),
      );

      // 6. Bumpers (Orange)
      this.game.objetsGraphiques.push(
        new bumper(11.4, 202.59, 50, 50, "orange", "down"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1107.66, 818.39, 35.25, 32.18, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(964.66, 581.9, 50, 50, "orange", "right"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1308.72, 384.96, 50, 50, "orange", "left"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1096.17, 145.59, 27.59, 29.12, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1198.85, 345.59, 29.12, 29.12, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(440.23, 147.89, 36.78, 33.72, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(912.26, 615.33, 38.31, 32.18, "orange", "left"),
      );
      this.game.objetsGraphiques.push(
        new bumper(56.61, 806.42, 50, 50, "orange", "up"),
      );
      this.game.objetsGraphiques.push(
        new bumper(1331.49, 3.14, 27.59, 29.12, "orange", "down"),
      );

      // tp et potion
      this.game.objetsGraphiques.push(
        new teleporter(979.69, 206.13, 29.12, 26.05, "#ae00ff", 300, 500),
      );
      this.game.objetsGraphiques.push(
        new speedPotion(234.87, 796.69, 33.72, 42.39, "cyan", 5, 3000),
      );

      // fin
      this.game.fin = new fin(
        42.38,
        50.42,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    } else if (levelNumber === 18) {
      // niveau 18

      // joueur
      this.game.player = new Player(210.61, 406.48);
      this.game.player.w = 100;
      this.game.player.h = 53.33;
      this.game.objetsGraphiques.push(this.game.player);

      // murs
      this.game.objetsGraphiques.push(
        new PipeObstacle(721.46, -422.23, 15.33, 1187.74, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(724.6, 125.75, 15.33, 1187.74, Math.PI / 2),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(1306.13, 164.75, 24.52, 557.85),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(136.09, 162.53, 24.52, 557.85),
      );
      this.game.objetsGraphiques.push(
        new PipeObstacle(708.59, 43.07, 22.84, 782.99, Math.PI / 2),
      );

      // portes
      this.game.objetsGraphiques.push(
        new fadingDoor(429.5, 180.84, 60, 240, 5000, 4),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(641.07, 180.84, 60, 240, 3000, 5),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(871.72, 180.84, 60, 240, 3000, 5),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(1073.26, 180.84, 60, 240, 3000, 6),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(429.5, 445.29, 60, 270.38, 5000, 1),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(641.07, 445.29, 60, 270.38, 3000, 2),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(871.72, 445.29, 60, 270.38, 3000, 2),
      );
      this.game.objetsGraphiques.push(
        new fadingDoor(1073.26, 445.29, 60, 270.38, 3000, 3),
      );

      // claviers
      this.game.objetsGraphiques.push(
        new keypad(751.57, 564.21, 35.25, 35.25, 5000, 4),
      );
      this.game.objetsGraphiques.push(
        new keypad(974.56, 560.38, 35.25, 35.25, 3000, 6),
      );
      this.game.objetsGraphiques.push(
        new keypad(976.09, 279.16, 35.25, 35.25, 3000, 3),
      );
      this.game.objetsGraphiques.push(
        new keypad(753.87, 284.52, 35.25, 35.25, 3000, 1),
      );
      this.game.objetsGraphiques.push(
        new keypad(317.09, 281.46, 35.25, 35.25, 5000, 1),
      );
      this.game.objetsGraphiques.push(
        new keypad(537.01, 286.05, 35.25, 35.25, 3000, 2),
      );
      this.game.objetsGraphiques.push(
        new keypad(318.54, 563.37, 35.25, 35.25, 3000, 4),
      );
      this.game.objetsGraphiques.push(
        new keypad(533.18, 563.45, 35.25, 35.25, 3000, 5),
      );

      // potions
      this.game.objetsGraphiques.push(
        new speedPotion(796.88, 650.33, 30, 40.86, "cyan", 5, 3000),
      );
      this.game.objetsGraphiques.push(
        new speedPotion(803.08, 189.1, 30, 38.18, "cyan", 5, 3000),
      );

      // fin
      this.game.fin = new fin(
        1186.44,
        389.12,
        80,
        80,
        "green",
        "assets/images/portal.png",
      );
      this.game.objetsGraphiques.push(this.game.fin);
    }
  }
}
