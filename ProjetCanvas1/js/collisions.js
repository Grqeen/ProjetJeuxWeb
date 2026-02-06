import fin from "./fin.js";

// Collisions between two circles
function circleCollide(x1, y1, r1, x2, y2, r2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return ((dx * dx + dy * dy) < (r1 + r2) * (r1 + r2));
}

// Collisions between two rectangles aligned with the axes
function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {

    if ((x1 > (x2 + w2)) || ((x1 + w1) < x2))
        return false; // No horizontal axis projection overlap
    if ((y1 > (y2 + h2)) || ((y1 + h1) < y2))
        return false; // No vertical axis projection overlap
    return true;    // If previous tests failed, then both axis projections
    // overlap and the rectangles intersect
}

// Collisions between rectangle and circle
function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
    var testX = cx;
    var testY = cy;
    if (testX < x0) testX = x0;
    if (testX > (x0 + w0)) testX = (x0 + w0);
    if (testY < y0) testY = y0;
    if (testY > (y0 + h0)) testY = (y0 + h0);
    return (((cx - testX) * (cx - testX) + (cy - testY) * (cy - testY)) < r * r);
}

//Collision between square and triangle
function rectTriangleOverlap(rx, ry, rw, rh, tx, ty, tw, th) {
    // 1. Test AABB (Bounding Box) pour une sortie rapide
    if (!rectsOverlap(rx, ry, rw, rh, tx, ty, tw, th)) {
        return false;
    }

    // 2. SAT (Separating Axis Theorem)
    // On vérifie si un espace sépare les deux formes sur les axes perpendiculaires aux côtés du triangle.
    
    // Sommets du triangle
    let t1 = { x: tx + tw / 2, y: ty };      // Haut
    let t2 = { x: tx + tw, y: ty + th };     // Bas Droite
    let t3 = { x: tx, y: ty + th };          // Bas Gauche

    // Sommets du rectangle
    let rPoints = [
        { x: rx, y: ry },
        { x: rx + rw, y: ry },
        { x: rx + rw, y: ry + rh },
        { x: rx, y: ry + rh }
    ];

    let tPoints = [t1, t2, t3];

    // Axes à tester : Normales des côtés inclinés du triangle.
    // (Les axes X et Y sont déjà couverts par le test AABB)
    
    // Axe 1 : Normale du côté droit (t1 -> t2)
    // Vecteur côté : (tw/2, th) -> Normale : (-th, tw/2)
    let axis1 = { x: -th, y: tw / 2 };

    // Axe 2 : Normale du côté gauche (t3 -> t1)
    // Vecteur côté : (tw/2, -th) -> Normale : (th, tw/2)
    let axis2 = { x: th, y: tw / 2 };

    let axes = [axis1, axis2];

    for (let axis of axes) {
        // Projection du triangle
        let minT = Infinity, maxT = -Infinity;
        for (let p of tPoints) {
            let proj = p.x * axis.x + p.y * axis.y;
            minT = Math.min(minT, proj);
            maxT = Math.max(maxT, proj);
        }

        // Projection du rectangle
        let minR = Infinity, maxR = -Infinity;
        for (let p of rPoints) {
            let proj = p.x * axis.x + p.y * axis.y;
            minR = Math.min(minR, proj);
            maxR = Math.max(maxR, proj);
        }

        // S'il y a un espace entre les projections, il n'y a pas de collision
        if (maxT < minR || maxR < minT) {
            return false;
        }
    }

    return true;
}


// Teste si le joueur a ateint la fin du niveau
function testCollisionFin(player, objetsGraphiques) {
    for (let obj of objetsGraphiques) {
        if (obj instanceof fin) {
            // Le joueur est un rectangle, la fin est un cercle
            // On utilise la fonction de collision cercle/rectangle
            if (circRectsOverlap(
                player.x - player.w / 2, player.y - player.h / 2, player.w, player.h,
                obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2
            )) {
                return true;
            }
        }
    }
    return false;
}

// Collision entre un rectangle aligné (AABB - Joueur) et un rectangle rotatif (OBB)
function rectRotatedRectOverlap(rx, ry, rw, rh, ox, oy, ow, oh, angle) {
    // rx, ry : coin haut-gauche du joueur
    // ox, oy : centre de l'obstacle rotatif
    // ow, oh : dimensions de l'obstacle
    // angle : rotation en radians

    // 1. Points du joueur (AABB)
    let rPoints = [
        { x: rx, y: ry },
        { x: rx + rw, y: ry },
        { x: rx + rw, y: ry + rh },
        { x: rx, y: ry + rh }
    ];

    // 2. Points de l'obstacle (OBB)
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    let hw = ow / 2;
    let hh = oh / 2;

    // Calcul des 4 coins de l'obstacle après rotation et translation
    let oPoints = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
    ].map(p => ({
        x: ox + (p.x * cos - p.y * sin),
        y: oy + (p.x * sin + p.y * cos)
    }));

    // 3. Axes à tester (SAT - Separating Axis Theorem)
    // Axes du joueur (AABB) : (1,0), (0,1)
    // Axes de l'obstacle : vecteurs unitaires de ses côtés (cos, sin) et (-sin, cos)
    let axes = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: cos, y: sin },
        { x: -sin, y: cos }
    ];

    for (let axis of axes) {
        // Projection du joueur
        let minR = Infinity, maxR = -Infinity;
        for (let p of rPoints) {
            let proj = p.x * axis.x + p.y * axis.y;
            minR = Math.min(minR, proj);
            maxR = Math.max(maxR, proj);
        }

        // Projection de l'obstacle
        let minO = Infinity, maxO = -Infinity;
        for (let p of oPoints) {
            let proj = p.x * axis.x + p.y * axis.y;
            minO = Math.min(minO, proj);
            maxO = Math.max(maxO, proj);
        }

        // Si un espace est trouvé entre les projections, pas de collision
        if (maxR < minO || maxO < minR) {
            return false;
        }
    }

    return true;
}

export { circleCollide, rectsOverlap, circRectsOverlap, testCollisionFin, rectTriangleOverlap, rectRotatedRectOverlap };