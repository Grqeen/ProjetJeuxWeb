function drawCircleImmediat(ctx, x, y, r, color) {
    // BONNE PRATIQUE : on sauvegarde le contexte
    // des qu'une fonction ou un bout de code le modifie
    // couleur, épaisseur du trait, systeme de coordonnées etc.
    ctx.save();

    // AUTRE BONNE PRATIQUE : on dessine toujours
    // en 0, 0 !!!! et on utilise les transformations
    // géométriques pour placer le dessin, le tourner, le rescaler
    // etc.
    ctx.fillStyle = color;
    ctx.beginPath();

    // on translate le systeme de coordonnées pour placer le cercle
    // en x, y
    ctx.translate(x, y);     
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // on restore le contexte à la fin
    ctx.restore();
}

function drawGrid(ctx, canvas, nbLignes, nbColonnes, couleur, largeurLignes) {
    // dessine une grille de lignes verticales et horizontales
    // de couleur couleur
    ctx.save();

    ctx.strokeStyle = couleur;
    ctx.lineWidth = largeurLignes;

    let largeurColonnes = canvas.width / nbColonnes;
    let hauteurLignes = canvas.height / nbLignes;

    ctx.beginPath();

    // on dessine les lignes verticales
    for (let i = 1; i < nbColonnes; i++) {
        ctx.moveTo(i * largeurColonnes, 0);
        ctx.lineTo(i * largeurColonnes, canvas.height);
    }

    // on dessine les lignes horizontales
    for (let i = 1; i < nbLignes; i++) {
        ctx.moveTo(0, i * hauteurLignes);
        ctx.lineTo(canvas.width, i * hauteurLignes);
    }

    // gpu call pour dessiner d'un coup toutes les lignes
    ctx.stroke();

    ctx.restore();
}

function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    
    // Ratio du contenu (1400 / 1000 = 1.4)
    let contentRatio = canvas.width / canvas.height;
    // Ratio de l'élément HTML
    let elementRatio = rect.width / rect.height;

    let offsetX = 0;
    let offsetY = 0;
    let actualWidth = rect.width;
    let actualHeight = rect.height;

    if (elementRatio > contentRatio) {
        // L'écran est plus large que le jeu -> Bandes noires à gauche/droite
        actualWidth = rect.height * contentRatio;
        offsetX = (rect.width - actualWidth) / 2;
    } else {
        // L'écran est plus haut que le jeu -> Bandes noires en haut/bas
        actualHeight = rect.width / contentRatio;
        offsetY = (rect.height - actualHeight) / 2;
    }

    let scaleX = canvas.width / actualWidth;
    let scaleY = canvas.height / actualHeight;

    return {
        x: (evt.clientX - rect.left - offsetX) * scaleX,
        y: (evt.clientY - rect.top - offsetY) * scaleY
    };
}

export { drawCircleImmediat, drawGrid, getMousePos };