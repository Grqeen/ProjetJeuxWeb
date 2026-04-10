// collision cercles
function circleCollide(x1, y1, r1, x2, y2, r2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}

// collision rects
function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  if (x1 > x2 + w2 || x1 + w1 < x2) return false; // pas overlap x
  if (y1 > y2 + h2 || y1 + h1 < y2) return false; // pas overlap y
  return true; // overlap
}

// collision rect cercle
function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
  var testX = cx;
  var testY = cy;
  if (testX < x0) testX = x0;
  if (testX > x0 + w0) testX = x0 + w0;
  if (testY < y0) testY = y0;
  if (testY > y0 + h0) testY = y0 + h0;
  return (cx - testX) * (cx - testX) + (cy - testY) * (cy - testY) < r * r;
}

// collision carre triangle
function rectTriangleOverlap(rx, ry, rw, rh, tx, ty, tw, th, direction = "up") {
  // test rapide
  if (!rectsOverlap(rx, ry, rw, rh, tx, ty, tw, th)) {
    return false;
  }

  // SAT
  // axes separateurs

  // sommets triangle
  let t1, t2, t3;
  if (direction === "up") {
    t1 = { x: tx + tw / 2, y: ty }; // haut
    t2 = { x: tx + tw, y: ty + th }; // bas droite
    t3 = { x: tx, y: ty + th }; // bas gauche
  } else if (direction === "left") {
    t1 = { x: tx, y: ty + th / 2 }; // pointe gauche
    t2 = { x: tx + tw, y: ty }; // haut droite
    t3 = { x: tx + tw, y: ty + th }; // bas droite
  } else if (direction === "right") {
    t1 = { x: tx + tw, y: ty + th / 2 }; // pointe droite
    t2 = { x: tx, y: ty + th }; // bas gauche
    t3 = { x: tx, y: ty }; // haut gauche
  } else {
    // Down
    t1 = { x: tx, y: ty }; // haut gauche
    t2 = { x: tx + tw, y: ty }; // haut droite
    t3 = { x: tx + tw / 2, y: ty + th }; // bas
  }

  // sommets rect
  let rPoints = [
    { x: rx, y: ry },
    { x: rx + rw, y: ry },
    { x: rx + rw, y: ry + rh },
    { x: rx, y: ry + rh },
  ];

  let tPoints = [t1, t2, t3];

  // axes
  // normales
  let axes = [
    { x: t2.x - t1.x, y: t2.y - t1.y },
    { x: t3.x - t2.x, y: t3.y - t2.y },
    { x: t1.x - t3.x, y: t1.y - t3.y },
  ].map((v) => ({ x: -v.y, y: v.x })); // rotation 90

  for (let axis of axes) {
    // proj triangle
    let minT = Infinity,
      maxT = -Infinity;
    for (let p of tPoints) {
      let proj = p.x * axis.x + p.y * axis.y;
      minT = Math.min(minT, proj);
      maxT = Math.max(maxT, proj);
    }

    // proj rect
    let minR = Infinity,
      maxR = -Infinity;
    for (let p of rPoints) {
      let proj = p.x * axis.x + p.y * axis.y;
      minR = Math.min(minR, proj);
      maxR = Math.max(maxR, proj);
    }

    // espace = pas collision
    if (maxT < minR || maxR < minT) {
      return false;
    }
  }

  return true;
}

// collision OBB
function rectRotatedRectOverlap(rx, ry, rw, rh, ox, oy, ow, oh, angle) {
  let rPoints = [
    { x: rx, y: ry },
    { x: rx + rw, y: ry },
    { x: rx + rw, y: ry + rh },
    { x: rx, y: ry + rh },
  ];

  let cos = Math.cos(angle);
  let sin = Math.sin(angle);
  let hw = ow / 2;
  let hh = oh / 2;

  let oPoints = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({
    x: ox + (p.x * cos - p.y * sin),
    y: oy + (p.x * sin + p.y * cos),
  }));

  let axes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: cos, y: sin },
    { x: -sin, y: cos },
  ];

  let minOverlap = Infinity;
  let shortestAxis = null;

  for (let axis of axes) {
    let minR = Infinity,
      maxR = -Infinity;
    for (let p of rPoints) {
      let proj = p.x * axis.x + p.y * axis.y;
      minR = Math.min(minR, proj);
      maxR = Math.max(maxR, proj);
    }

    let minO = Infinity,
      maxO = -Infinity;
    for (let p of oPoints) {
      let proj = p.x * axis.x + p.y * axis.y;
      minO = Math.min(minO, proj);
      maxO = Math.max(maxO, proj);
    }

    if (maxR < minO || maxO < minR) return null; // pas collision

    // overlap
    let overlap = Math.min(maxR, maxO) - Math.max(minR, minO);
    if (overlap < minOverlap) {
      minOverlap = overlap;
      shortestAxis = axis;
    }
  }

  // correction
  return { axis: shortestAxis, overlap: minOverlap };
}

export function circleRect(cx, cy, radius, rx, ry, rw, rh) {
  // point proche
  let testX = cx;
  let testY = cy;

  if (cx < rx)
    testX = rx; // gauche
  else if (cx > rx + rw) testX = rx + rw; // droit
  if (cy < ry)
    testY = ry; // haut
  else if (cy > ry + rh) testY = ry + rh; // bas

  // distance
  let distX = cx - testX;
  let distY = cy - testY;
  let distance = Math.sqrt(distX * distX + distY * distY);

  // collision
  return distance <= radius;
}
export {
  circleCollide,
  rectsOverlap,
  circRectsOverlap,
  rectTriangleOverlap,
  rectRotatedRectOverlap,
};
