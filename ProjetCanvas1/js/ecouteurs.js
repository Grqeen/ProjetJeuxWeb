function initListeners(inputStates, canvas, speedInputElement) {
    window.onkeydown = (event) => {
        console.log("Touche pressée : " + event.key);
        if(event.key === "ArrowRight") {
            inputStates.ArrowRight = true;
        }
        if(event.key === "ArrowLeft") {
            inputStates.ArrowLeft = true;
        }
        if(event.key === "ArrowUp") {
            inputStates.ArrowUp = true;
        }
        if(event.key === "ArrowDown") {
            inputStates.ArrowDown = true;
        }
    }

    window.onkeyup = (event) => {
        console.log("Touche relachée : " + event.key);
        if(event.key === "ArrowRight") {
            inputStates.ArrowRight = false;
        }
        if(event.key === "ArrowLeft") {
            inputStates.ArrowLeft = false;
        }
        if(event.key === "ArrowUp") {
            inputStates.ArrowUp = false;
        }
        if(event.key === "ArrowDown") {
            inputStates.ArrowDown = false;
        }
    }

    window.onmousemove = (event) => {
        let rect = canvas.getBoundingClientRect();
        
        // On calcule le ratio d'échelle
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;

        // On ajuste les coordonnées
        inputStates.mouseX = (event.clientX - rect.left) * scaleX;
        inputStates.mouseY = (event.clientY - rect.top) * scaleY;
    }

    // Gestion du conflit slider / flèches
    if (speedInputElement) {
        speedInputElement.addEventListener("keydown", (e) => {
            if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault(); 
                speedInputElement.blur(); 
            }
        });
    }
}

export { initListeners };