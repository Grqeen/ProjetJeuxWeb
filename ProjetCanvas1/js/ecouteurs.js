import { getMousePos } from "./utils.js";

function initListeners(inputStates, canvas, speedInputElement) {
    window.addEventListener('keydown', (event) => {
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
    });

    window.addEventListener('keyup', (event) => {
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
    });

    window.addEventListener('mousemove', (event) => {
        let pos = getMousePos(canvas, event);
        inputStates.mouseX = pos.x;
        inputStates.mouseY = pos.y;
    });

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