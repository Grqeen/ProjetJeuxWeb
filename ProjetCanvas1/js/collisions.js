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
function rectTriangleOverlap(rx, ry, rw, rh, tx, ty, tw, th, direction = "up") {
    // 1. Test AABB (Bounding Box) pour une sortie rapide
    if (!rectsOverlap(rx, ry, rw, rh, tx, ty, tw, th)) {
        return false;
    }

    // 2. SAT (Separating Axis Theorem)
    // On vérifie si un espace sépare les deux formes sur les axes perpendiculaires aux côtés du triangle.
    
    // Sommets du triangle
    let t1, t2, t3;
    if (direction === "up") {
        t1 = { x: tx + tw / 2, y: ty };      // Haut
        t2 = { x: tx + tw, y: ty + th };     // Bas Droite
        t3 = { x: tx, y: ty + th };          // Bas Gauche
    } else {
        t1 = { x: tx, y: ty };                   // Haut Gauche
        t2 = { x: tx + tw, y: ty };              // Haut Droite
        t3 = { x: tx + tw / 2, y: ty + th };     // Bas (Pointe)
    }

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

// Collision entre un rectangle aligné (AABB - Joueur) et un rectangle rotatif (OBB)
function rectRotatedRectOverlap(rx, ry, rw, rh, ox, oy, ow, oh, angle) {
    let rPoints = [
        { x: rx, y: ry }, { x: rx + rw, y: ry },
        { x: rx + rw, y: ry + rh }, { x: rx, y: ry + rh }
    ];

    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    let hw = ow / 2;
    let hh = oh / 2;

    let oPoints = [
        { x: -hw, y: -hh }, { x: hw, y: -hh },
        { x: hw, y: hh }, { x: -hw, y: hh }
    ].map(p => ({
        x: ox + (p.x * cos - p.y * sin),
        y: oy + (p.x * sin + p.y * cos)
    }));

    let axes = [
        { x: 1, y: 0 }, { x: 0, y: 1 },
        { x: cos, y: sin }, { x: -sin, y: cos }
    ];

    let minOverlap = Infinity;
    let shortestAxis = null;

    for (let axis of axes) {
        let minR = Infinity, maxR = -Infinity;
        for (let p of rPoints) {
            let proj = p.x * axis.x + p.y * axis.y;
            minR = Math.min(minR, proj);
            maxR = Math.max(maxR, proj);
        }

        let minO = Infinity, maxO = -Infinity;
        for (let p of oPoints) {
            let proj = p.x * axis.x + p.y * axis.y;
            minO = Math.min(minO, proj);
            maxO = Math.max(maxO, proj);
        }

        if (maxR < minO || maxO < minR) return null; // Pas de collision

        // Calcul de l'overlap sur cet axe
        let overlap = Math.min(maxR, maxO) - Math.max(minR, minO);
        if (overlap < minOverlap) {
            minOverlap = overlap;
            shortestAxis = axis;
        }
    }

    // Retourne l'axe et la profondeur pour corriger la position
    return { axis: shortestAxis, overlap: minOverlap };
}

export { circleCollide, rectsOverlap, circRectsOverlap, rectTriangleOverlap, rectRotatedRectOverlap };