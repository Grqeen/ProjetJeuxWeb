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

// Teste si le joueur a ateint la fin du niveau
function testCollisionFin(player, objetsGraphiques) {
    objetsGraphiques.forEach(obj => {
        if (obj instanceof fin) {
            // Le joueur est un rectangle, la fin est un cercle
            // On utilise la fonction de collision cercle/rectangle
            if (circRectsOverlap(
                player.x - player.w / 2, player.y - player.h / 2, player.w, player.h,
                obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2
            )) {
                console.log("fin du niveau");
            }
        }
    });
}

export { circleCollide, rectsOverlap, circRectsOverlap, testCollisionFin };