function drawCircleImmediat(ctx, x, y, r, color) {
  // save ctx
  ctx.save();

  // dessin 0,0
  ctx.fillStyle = color;
  ctx.beginPath();

  // translate
  ctx.translate(x, y);
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // restore
  ctx.restore();
}

function drawGrid(ctx, canvas, nbLignes, nbColonnes, couleur, largeurLignes) {
  // grille
  ctx.save();

  ctx.strokeStyle = couleur;
  ctx.lineWidth = largeurLignes;

  let largeurColonnes = canvas.width / nbColonnes;
  let hauteurLignes = canvas.height / nbLignes;

  ctx.beginPath();

  // verticales
  for (let i = 1; i < nbColonnes; i++) {
    ctx.moveTo(i * largeurColonnes, 0);
    ctx.lineTo(i * largeurColonnes, canvas.height);
  }

  // horizontales
  for (let i = 1; i < nbLignes; i++) {
    ctx.moveTo(0, i * hauteurLignes);
    ctx.lineTo(canvas.width, i * hauteurLignes);
  }

  // draw
  ctx.stroke();

  ctx.restore();
}

function getMousePos(canvas, evt) {
  let rect = canvas.getBoundingClientRect();

  // ratio contenu
  let contentRatio = canvas.width / canvas.height;
  // ratio element
  let elementRatio = rect.width / rect.height;

  let offsetX = 0;
  let offsetY = 0;
  let actualWidth = rect.width;
  let actualHeight = rect.height;

  if (elementRatio > contentRatio) {
    // bandes cotes
    actualWidth = rect.height * contentRatio;
    offsetX = (rect.width - actualWidth) / 2;
  } else {
    // bandes haut bas
    actualHeight = rect.width / contentRatio;
    offsetY = (rect.height - actualHeight) / 2;
  }

  let scaleX = canvas.width / actualWidth;
  let scaleY = canvas.height / actualHeight;

  return {
    x: (evt.clientX - rect.left - offsetX) * scaleX,
    y: (evt.clientY - rect.top - offsetY) * scaleY,
  };
}

export { drawCircleImmediat, drawGrid, getMousePos };
