export function createMenuScene(engine, startGameCallback, settings) {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1); // Fond sombre bleuté

    // Caméra basique pour afficher l'UI
    const camera = new BABYLON.FreeCamera("menuCam", new BABYLON.Vector3(0, 0, 0), scene);

    // Création de l'interface
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Compteur FPS pour le menu
    const fpsText = new BABYLON.GUI.TextBlock();
    fpsText.text = "0 FPS";
    fpsText.color = "yellow";
    fpsText.fontSize = 24;
    fpsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    fpsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    fpsText.left = "10px";
    fpsText.top = "10px";
    fpsText.isVisible = settings.showFps;
    advancedTexture.addControl(fpsText);
    scene.fpsText = fpsText; // On l'attache à la scène pour que main.js puisse le mettre à jour

    // --- STYLES ---
    const createBtn = (text) => {
        const btn = BABYLON.GUI.Button.CreateSimpleButton("btn" + text, text);
        btn.width = "250px";
        btn.height = "50px";
        btn.color = "white";
        btn.cornerRadius = 10;
        btn.background = "#404040";
        btn.hoverCursor = "pointer";
        btn.paddingBottom = "10px";
        return btn;
    };

    const createHeader = (text) => {
        const header = new BABYLON.GUI.TextBlock();
        header.text = text;
        header.color = "white";
        header.fontSize = 30;
        header.height = "60px";
        header.fontWeight = "bold";
        return header;
    };

    // --- ECRAN PRINCIPAL ---
    const mainMenuPanel = new BABYLON.GUI.StackPanel();
    mainMenuPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(mainMenuPanel);

    const title = new BABYLON.GUI.TextBlock();
    title.text = "Blob's Revenge";
    title.color = "#3498db";
    title.fontSize = 60;
    title.height = "100px";
    title.fontWeight = "bold";
    title.shadowColor = "black";
    title.shadowBlur = 5;
    mainMenuPanel.addControl(title);

    const startBtn = createBtn("JOUER");
    startBtn.background = "#27ae60";
    startBtn.onPointerUpObservable.add(() => {
        startGameCallback();
    });
    mainMenuPanel.addControl(startBtn);

    const settingsBtn = createBtn("PARAMÈTRES");
    settingsBtn.onPointerUpObservable.add(() => {
        mainMenuPanel.isVisible = false;
        settingsPanel.isVisible = true;
    });
    mainMenuPanel.addControl(settingsBtn);

    // --- ECRAN PARAMÈTRES ---
    const settingsPanel = new BABYLON.GUI.StackPanel();
    settingsPanel.isVisible = false;
    settingsPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    settingsPanel.background = "#2c3e50";
    settingsPanel.width = "500px";
    settingsPanel.paddingTop = "20px";
    settingsPanel.paddingBottom = "20px";
    settingsPanel.cornerRadius = 20;
    advancedTexture.addControl(settingsPanel);

    settingsPanel.addControl(createHeader("PARAMÈTRES"));

    // 1. VIDEO (Plein écran)
    const videoPanel = new BABYLON.GUI.StackPanel();
    videoPanel.height = "60px";
    videoPanel.isVertical = false;
    videoPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    settingsPanel.addControl(videoPanel);

    const fsLabel = new BABYLON.GUI.TextBlock();
    fsLabel.text = "Plein Écran : ";
    fsLabel.color = "white";
    fsLabel.width = "150px";
    videoPanel.addControl(fsLabel);

    const fsCheckbox = new BABYLON.GUI.Checkbox();
    fsCheckbox.width = "30px";
    fsCheckbox.height = "30px";
    fsCheckbox.isChecked = settings.fullscreen;
    fsCheckbox.color = "#3498db";
    fsCheckbox.onIsCheckedChangedObservable.add((value) => {
        settings.fullscreen = value;
        if (value) {
            engine.enterFullscreen();
        } else {
            engine.exitFullscreen();
        }
    });
    videoPanel.addControl(fsCheckbox);

    // Option FPS (Ajouté à côté du plein écran)
    const fpsLabel = new BABYLON.GUI.TextBlock();
    fpsLabel.text = "Afficher FPS : ";
    fpsLabel.color = "white";
    fpsLabel.width = "150px";
    fpsLabel.paddingLeft = "20px"; // Espacement
    videoPanel.addControl(fpsLabel);

    const fpsCheckbox = new BABYLON.GUI.Checkbox();
    fpsCheckbox.width = "30px";
    fpsCheckbox.height = "30px";
    fpsCheckbox.isChecked = settings.showFps;
    fpsCheckbox.color = "#3498db";
    fpsCheckbox.onIsCheckedChangedObservable.add((value) => {
        settings.showFps = value;
    });
    videoPanel.addControl(fpsCheckbox);

    // 2. GRAPHISMES
    settingsPanel.addControl(createHeader("GRAPHISMES"));
    
    const qualityPanel = new BABYLON.GUI.StackPanel();
    qualityPanel.isVertical = false;
    qualityPanel.height = "50px";
    settingsPanel.addControl(qualityPanel);

    const qualities = ["Low", "Medium", "High", "Custom"];
    const qualityBtns = [];

    qualities.forEach(q => {
        const btn = BABYLON.GUI.Button.CreateSimpleButton("btn" + q, q);
        btn.width = "80px";
        btn.height = "30px";
        btn.color = "white";
        btn.fontSize = 14;
        btn.background = settings.quality.toLowerCase() === q.toLowerCase() ? "#3498db" : "#7f8c8d";
        btn.cornerRadius = 5;
        btn.marginRight = "5px";
        
        btn.onPointerUpObservable.add(() => {
            settings.quality = q.toLowerCase();
            
            // Mise à jour visuelle des boutons
            qualityBtns.forEach(b => b.background = "#7f8c8d");
            btn.background = "#3498db";

            // Application des presets
            if (q === "Low") settings.resolution = 2.0; // 50% res
            if (q === "Medium") settings.resolution = 1.5; // 66% res
            if (q === "High") settings.resolution = 1.0; // 100% res
        });

        qualityBtns.push(btn);
        qualityPanel.addControl(btn);
    });

    // 3. TOUCHES
    settingsPanel.addControl(createHeader("TOUCHES"));

    const keysContainer = new BABYLON.GUI.ScrollViewer();
    keysContainer.width = "450px";
    keysContainer.height = "250px";
    keysContainer.background = "#34495e";
    keysContainer.cornerRadius = 10;
    settingsPanel.addControl(keysContainer);

    const keysPanel = new BABYLON.GUI.StackPanel();
    keysContainer.addControl(keysPanel);

    const createKeyRow = (label, keyProp) => {
        const row = new BABYLON.GUI.StackPanel();
        row.isVertical = false;
        row.height = "40px";
        row.paddingTop = "5px";
        
        const txt = new BABYLON.GUI.TextBlock();
        txt.text = label;
        txt.color = "white";
        txt.width = "200px";
        txt.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txt.paddingLeft = "20px";
        row.addControl(txt);

        const keyBtn = BABYLON.GUI.Button.CreateSimpleButton("kbtn" + label, settings.keys[keyProp].toUpperCase());
        keyBtn.width = "100px";
        keyBtn.height = "30px";
        keyBtn.color = "white";
        keyBtn.background = "#95a5a6";
        keyBtn.cornerRadius = 5;
        
        keyBtn.onPointerUpObservable.add(() => {
            keyBtn.textBlock.text = "...";
            keyBtn.background = "#e74c3c"; // Rouge pendant l'écoute
            
            const onKeyDown = (evt) => {
                let key = evt.key.toLowerCase();
                if (key === " ") key = " "; 
                
                settings.keys[keyProp] = key;
                keyBtn.textBlock.text = key === " " ? "SPACE" : key.toUpperCase();
                keyBtn.background = "#95a5a6";
                
                window.removeEventListener("keydown", onKeyDown);
            };
            window.addEventListener("keydown", onKeyDown);
        });

        row.addControl(keyBtn);
        keysPanel.addControl(row);
    };

    createKeyRow("Avancer", "forward");
    createKeyRow("Reculer", "backward");
    createKeyRow("Gauche", "left");
    createKeyRow("Droite", "right");
    createKeyRow("Sprint", "sprint");

    // BOUTON RETOUR
    const backBtn = createBtn("RETOUR");
    backBtn.width = "150px";
    backBtn.height = "40px";
    backBtn.background = "#c0392b";
    backBtn.marginTop = "20px";
    backBtn.onPointerUpObservable.add(() => {
        settingsPanel.isVisible = false;
        mainMenuPanel.isVisible = true;
    });
    settingsPanel.addControl(backBtn);

    return scene;
}