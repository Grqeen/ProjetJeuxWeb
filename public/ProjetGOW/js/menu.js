const translations = {
    fr: {
        title: "Blob's Revenge",
        start: "Démarrer",
        settings: "Paramètres",
        quit: "Quitter",
        back: "RETOUR",
        
        tab_video: "Vidéo",
        tab_audio: "Audio",
        tab_controls: "Contrôles",
        tab_gameplay: "Jeu",
        
        fullscreen: "Plein Écran",
        vsync: "V-Sync",
        fps: "FPS",
        resolution: "Résolution",
        fov: "FOV",
        quality: "Qualité",
        
        graphics: "Graphismes",
        specific_details: "Détails Spécifiques",
        shadows: "Ombres",
        grass: "Herbe",
        particles: "Particules",
        post_processing: "Post-Traitement",
        bloom: "Bloom",
        motion_blur: "Flou Mouvement",
        ambient_occlusion: "AO",
        
        master_volume: "Volume Principal",
        music_volume: "Musique",
        sfx_volume: "Effets Spéciaux",
        spatial_audio: "Audio Spatial 3D",
        
        keybindings: "Touches",
        forward: "Avancer",
        backward: "Reculer",
        left: "Gauche",
        right: "Droite",
        sprint: "Sprint",
        crouch: "S'accroupir",
        mouse_sensitivity: "Sensibilité Souris",
        invert_y: "Inverser Axe Y",
        gamepad_vibration: "Vibrations Manette",
        stick_deadzone: "Zone Morte Sticks",
        
        language: "Langue",
        show_hud: "Afficher HUD",
    },
    en: {
        title: "Blob's Revenge",
        start: "Start",
        settings: "Settings",
        quit: "Quit",
        back: "BACK",
        
        tab_video: "Video",
        tab_audio: "Audio",
        tab_controls: "Controls",
        tab_gameplay: "Gameplay",
        
        fullscreen: "Fullscreen",
        vsync: "V-Sync",
        fps: "FPS",
        resolution: "Resolution",
        fov: "FOV",
        quality: "Quality",
        
        graphics: "Graphics",
        specific_details: "Specific Details",
        shadows: "Shadows",
        grass: "Grass",
        particles: "Particles",
        post_processing: "Post-Processing",
        bloom: "Bloom",
        motion_blur: "Motion Blur",
        ambient_occlusion: "AO",
        
        master_volume: "Master Volume",
        music_volume: "Music",
        sfx_volume: "Sound Effects",
        spatial_audio: "Spatial Audio 3D",
        
        keybindings: "Key Bindings",
        forward: "Forward",
        backward: "Backward",
        left: "Left",
        right: "Right",
        sprint: "Sprint",
        crouch: "Crouch",
        mouse_sensitivity: "Mouse Sensitivity",
        invert_y: "Invert Y Axis",
        gamepad_vibration: "Gamepad Vibration",
        stick_deadzone: "Stick Deadzone",
        
        language: "Language",
        show_hud: "Show HUD",
    }
};

// Retourne la chaîne de caractères traduite pour la clé demandée selon la configuration linguistique.
const t = (key) => {
    const lang = window.gameSettings?.gameplay?.language || "fr";
    return translations[lang]?.[key] || translations.fr[key] || key;
};

window.getTranslation = t;
window.refreshUIText = null;

// Demande une actualisation en direct de l'affichage des textes de l'interface.
export function updateMenuTexts() {
    if (window.refreshUIText) {
        window.refreshUIText();
    }
}

// Monte et déploie la scène entière dédiée au menu d'accueil.
export function createMenuScene(engine, startGameCallback, settings) {
    window.gameSettings = settings;
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);

    const background = new BABYLON.Layer("menuBg", "assets/backgroundimg.png", scene, true);
    const camera = new BABYLON.FreeCamera("menuCam", new BABYLON.Vector3(0, 0, 0), scene);
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

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
    scene.fpsText = fpsText;
    
    window.menuFpsText = fpsText;

// Crée un bouton visuellement percutant et animé au passage de la souris.
    const createBtn = (text) => {
        const btn = BABYLON.GUI.Button.CreateSimpleButton("btn" + Math.random(), text);
        btn.width = "300px";
        btn.height = "60px";
        btn.color = "white";
        btn.thickness = 0;
        btn.background = "transparent";
        btn.hoverCursor = "pointer";
        btn.paddingBottom = "10px";
        btn.textBlock.fontSize = 35;
        btn.textBlock.fontWeight = "bold";
        btn.textBlock.outlineWidth = 4;
        btn.textBlock.outlineColor = "black";
        btn.textBlock.fontFamily = "Verdana";
        btn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        btn.textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        btn.transformCenterX = 0;
        
        let targetScale = 1.0;
        let targetLeft = 0;
        let targetRotation = 0;

        btn.onPointerEnterObservable.add(() => {
            btn.color = "#f1c40f";
            btn.textBlock.outlineColor = "#d35400";
            btn.textBlock.shadowColor = "black";
            btn.textBlock.shadowOffsetX = 3;
            btn.textBlock.shadowOffsetY = 3;
            targetScale = 1.15;
            targetLeft = 25;
            targetRotation = -0.04;
        });
        btn.onPointerOutObservable.add(() => {
            btn.color = "white";
            btn.textBlock.outlineColor = "black";
            btn.textBlock.shadowOffsetX = 0;
            btn.textBlock.shadowOffsetY = 0;
            targetScale = 1.0;
            targetLeft = 0;
            targetRotation = 0;
        });

        const animObserver = scene.onBeforeRenderObservable.add(() => {
            if (btn.isDisposed) {
                scene.onBeforeRenderObservable.remove(animObserver);
                return;
            }
            
            let currentLeft = parseFloat(btn.left) || 0;
            
            if (Math.abs(targetScale - btn.scaleX) > 0.001 || Math.abs(targetLeft - currentLeft) > 0.1) {
                btn.scaleX += (targetScale - btn.scaleX) * 0.15;
                btn.scaleY += (targetScale - btn.scaleY) * 0.15;
                btn.rotation += (targetRotation - btn.rotation) * 0.15;
                btn.left = (currentLeft + (targetLeft - currentLeft) * 0.15) + "px";
            } else if (btn.scaleX !== targetScale) {
                btn.scaleX = targetScale;
                btn.scaleY = targetScale;
                btn.rotation = targetRotation;
                btn.left = targetLeft + "px";
            }
        });
        return btn;
    };

    const mainMenuPanel = new BABYLON.GUI.StackPanel();
    mainMenuPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    mainMenuPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    mainMenuPanel.left = "10%";
    mainMenuPanel.width = "600px";
    advancedTexture.addControl(mainMenuPanel);

    const title = new BABYLON.GUI.TextBlock();
    title.text = t("title");
    title.color = "white";
    title.fontSize = 80;
    title.height = "120px";
    title.fontWeight = "bold";
    title.outlineWidth = 5;
    title.outlineColor = "black";
    title.shadowColor = "black";
    title.shadowOffsetX = 4;
    title.shadowOffsetY = 4;
    title.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    mainMenuPanel.addControl(title);

    const startBtn = createBtn(t("start"));
    startBtn.onPointerUpObservable.add(() => { startGameCallback(); });
    mainMenuPanel.addControl(startBtn);

    const settingsBtn = createBtn(t("settings"));
    settingsBtn.onPointerUpObservable.add(() => {
        mainMenuPanel.isVisible = false;
        settingsPanel.isVisible = true;
    });
    mainMenuPanel.addControl(settingsBtn);

    const settingsPanel = new BABYLON.GUI.Rectangle();
    settingsPanel.isVisible = false;
    settingsPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    settingsPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    settingsPanel.background = "#1a1a2e";
    settingsPanel.width = "900px";
    settingsPanel.height = "70%";
    settingsPanel.cornerRadius = 15;
    settingsPanel.thickness = 3;
    settingsPanel.color = "#e67e22";
    advancedTexture.addControl(settingsPanel);

    const mainContainer = new BABYLON.GUI.StackPanel();
    mainContainer.width = "100%";
    mainContainer.height = "100%";
    mainContainer.isVertical = true;
    settingsPanel.addControl(mainContainer);

    const header = new BABYLON.GUI.TextBlock();
    header.text = t("settings");
    header.color = "#FFD700";
    header.fontSize = 40;
    header.height = "60px";
    header.fontWeight = "bold";
    mainContainer.addControl(header);

    const tabsContainer = new BABYLON.GUI.StackPanel();
    tabsContainer.isVertical = false;
    tabsContainer.height = "50px";
    tabsContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainContainer.addControl(tabsContainer);

    const tabs = [
        { id: "video", label: t("tab_video"), color: "#3498db" },
        { id: "audio", label: t("tab_audio"), color: "#9b59b6" },
        { id: "controls", label: t("tab_controls"), color: "#e67e22" },
        { id: "gameplay", label: t("tab_gameplay"), color: "#1abc9c" }
    ];

    const tabButtons = {};
    let currentTab = "video";

// Génère un bouton destiné à naviguer entre les onglets du panneau des paramètres.
    const createTabButton = (tab) => {
        const btn = BABYLON.GUI.Button.CreateSimpleButton("tab_" + tab.id, tab.label);
        btn.width = "200px";
        btn.height = "40px";
        btn.color = "white";
        btn.fontSize = 16;
        btn.fontWeight = "bold";
        btn.background = currentTab === tab.id ? tab.color : "#34495e";
        btn.cornerRadius = 8;
        btn.marginRight = "5px";
        btn.marginLeft = "5px";
        btn.hoverCursor = "pointer";
        
        btn.onPointerUpObservable.add(() => {
            currentTab = tab.id;
            Object.values(tabButtons).forEach(b => b.background = "#34495e");
            btn.background = tab.color;
            updateContentPanel(tab.id);
        });
        
        tabButtons[tab.id] = btn;
        tabsContainer.addControl(btn);
    };

    tabs.forEach(createTabButton);

    const contentScroll = new BABYLON.GUI.ScrollViewer();
    contentScroll.width = "100%";
    contentScroll.height = "60%";
    contentScroll.thickness = 0;
    contentScroll.barColor = "#3498db";
    mainContainer.addControl(contentScroll);

    const contentStack = new BABYLON.GUI.StackPanel();
    contentStack.isVertical = true;
    contentStack.width = "90%";
    contentStack.paddingTop = "15px";
    contentStack.paddingBottom = "15px";
    contentStack.paddingLeft = "20px";
    contentStack.paddingRight = "20px";
    contentStack.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    contentScroll.addControl(contentStack);

// Forme un composant de type curseur qui s'actualise avec les propriétés d'état sélectionnées.
    const createSliderControl = (labelText, propCategory, prop, min, max, isPercentage, color = "#3498db") => {
        const container = new BABYLON.GUI.Rectangle();
        container.width = "100%";
        container.height = "50px";
        container.background = "#252535";
        container.cornerRadius = 5;
        container.thickness = 1;
        container.color = "#444";
        container.paddingLeft = "15px";
        container.paddingRight = "15px";
        container.marginBottom = "10px";

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "100%";
        panel.height = "40px";
        panel.isVertical = false;
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        container.addControl(panel);

        const lbl = new BABYLON.GUI.TextBlock();
        let currentValue = settings[propCategory]?.[prop] ?? settings[prop];
        lbl.text = labelText + " : " + Math.round(currentValue * (isPercentage ? 100 : 1)) + (isPercentage ? "%" : "");
        lbl.color = "white";
        lbl.width = "200px";
        lbl.height = "30px";
        lbl.fontSize = 13;
        lbl.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.addControl(lbl);

        const slider = new BABYLON.GUI.Slider();
        slider.minimum = min;
        slider.maximum = max;
        slider.value = currentValue;
        slider.width = "300px";
        slider.height = "18px";
        slider.color = color;
        slider.background = "#555";
        slider.onValueChangedObservable.add((value) => {
            if (settings[propCategory]?.[prop] !== undefined) {
                settings[propCategory][prop] = value;
            } else {
                settings[prop] = value;
            }
            lbl.text = labelText + " : " + Math.round(value * (isPercentage ? 100 : 1)) + (isPercentage ? "%" : "");
            if (propCategory === "audio" && window.gameAudioManager?.updateAudioVolumes) {
                window.gameAudioManager.updateAudioVolumes();
            }
            if (propCategory === "controls" && window.currentGameData?.camera) {
                const baseSensibility = 2000;
                if (prop === "sensitivity") {
                    window.currentGameData.camera.angularSensibilityX = baseSensibility / value;
                    window.currentGameData.camera.angularSensibilityY = (settings.controls.invertY ? -1 : 1) * (baseSensibility / value);
                }
            }
        });
        panel.addControl(slider);
        return container;
    };

// Forme une case de sélection agissant de manière réactive sur les préférences.
    const createCheckboxControl = (labelText, propCategory, prop, color = "#3498db", onChangeCallback = null) => {
        const container = new BABYLON.GUI.Rectangle();
        container.width = "100%";
        container.height = "40px";
        container.background = "#252535";
        container.cornerRadius = 5;
        container.thickness = 1;
        container.color = "#444";
        container.paddingLeft = "15px";
        container.paddingRight = "15px";
        container.marginBottom = "10px";

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "100%";
        panel.height = "45px";
        panel.isVertical = false;
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        container.addControl(panel);

        const lbl = new BABYLON.GUI.TextBlock();
        lbl.text = labelText + " : ";
        lbl.color = "white";
        lbl.width = "200px";
        lbl.height = "35px";
        lbl.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        lbl.fontSize = 13;
        panel.addControl(lbl);

        const checkbox = new BABYLON.GUI.Checkbox();
        checkbox.width = "25px";
        checkbox.height = "25px";
        let currentChecked = propCategory ? (settings[propCategory]?.[prop] ?? false) : (settings[prop] ?? false);
        checkbox.isChecked = currentChecked;
        checkbox.color = color;
        checkbox.onIsCheckedChangedObservable.add((v) => {
            if (propCategory) {
                settings[propCategory][prop] = v;
            } else {
                settings[prop] = v;
            }
            if (onChangeCallback) onChangeCallback(v);
        });
        panel.addControl(checkbox);
        return { panel: container, checkbox };
    };

// Construit un titre démarcatif structurant les zones du menu des réglages.
    const createContentSection = (sectionTitle) => {
        const title = new BABYLON.GUI.TextBlock();
        title.text = sectionTitle;
        title.color = "#FFD700";
        title.fontSize = 22;
        title.height = "50px";
        title.fontWeight = "bold";
        title.width = "100%";
        title.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        title.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        title.paddingTop = "20px";
        title.paddingBottom = "10px";
        title.marginTop = "15px";
        contentStack.addControl(title);
    };
    let currentBindingKey = null;
// Met en œuvre l'interface gérant l'interception et le remplacement d'un raccourci clavier.
    const createKeyBindingRow = (actionName, keyProperty, color, settingsObj) => {
        const container = new BABYLON.GUI.Rectangle();
        container.background = "#252535";
        container.height = "45px";
        container.width = "95%";
        container.cornerRadius = 5;
        container.paddingLeft = "12px";
        container.paddingRight = "12px";
        container.marginBottom = "10px";
        
        const stackH = new BABYLON.GUI.StackPanel();
        stackH.isVertical = false;
        stackH.spacing = 0;
        stackH.width = "100%";
        container.addControl(stackH);
        
        const currentKey = settingsObj?.keys?.[keyProperty] ? settingsObj.keys[keyProperty].toUpperCase() : "?";
        const displayText = `${t(actionName)}: ${currentKey}`;
        const keyButton = BABYLON.GUI.Button.CreateSimpleButton(`keyBtn_${keyProperty}`, displayText);
        keyButton.width = "100%";
        keyButton.height = "40px";
        keyButton.fontSize = 12;
        keyButton.fontWeight = "bold";
        keyButton.cornerRadius = 3;
        keyButton.color = "#000000";
        keyButton.background = color || "#FFFFFF";
        keyButton.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        keyButton.onPointerUpObservable.add(() => {
            currentBindingKey = keyProperty;
            keyButton.background = "#FF6B6B";
            keyButton.textBlock.text = "...";
            
            const handleKeyPress = (event) => {
                const key = event.key.toLowerCase();
                if (key !== "escape") {
                    if (settingsObj.keys) {
                        settingsObj.keys[keyProperty] = key;
                    }
                    keyButton.textBlock.text = `${t(actionName)}: ${key.toUpperCase()}`;
                    keyButton.background = color || "#FFFFFF";
                    keyButton.color = "#000000";
                    currentBindingKey = null;
                }
                window.removeEventListener("keydown", handleKeyPress);
            };
            
            window.addEventListener("keydown", handleKeyPress, { once: true });
        });
        stackH.addControl(keyButton);
        
        return container;
    };
// Fait basculer les vues paramétrables selon l'onglet activé par l'utilisateur.
    const updateContentPanel = (tabId) => {
        contentStack.children.slice().forEach(child => contentStack.removeControl(child));

        if (tabId === "video") {
            createContentSection(t("graphics"));
            contentStack.addControl(createSliderControl(t("resolution"), "", "resolution", 0.5, 2.0, false, "#3498db"));
            contentStack.addControl(createSliderControl(t("fov"), "", "fov", 60, 120, false, "#e67e22"));
            
            const { panel: fsPanel } = createCheckboxControl(t("fullscreen"), "display", "fullscreen", "#3498db", (v) => {
                if (v) engine.enterFullscreen();
                else engine.exitFullscreen();
            });
            contentStack.addControl(fsPanel);

            const { panel: vsyncPanel } = createCheckboxControl(t("vsync"), "display", "vsync", "#3498db");
            contentStack.addControl(vsyncPanel);

            const { panel: fpsPanel } = createCheckboxControl(t("fps"), "display", "fps", "#3498db", (v) => {
                if (window.menuFpsText) window.menuFpsText.isVisible = v;
            });
            contentStack.addControl(fpsPanel);
        }
        else if (tabId === "audio") {
            createContentSection(t("master_volume"));
            contentStack.addControl(createSliderControl(t("master_volume"), "audio", "master", 0, 1, true, "#9b59b6"));
            contentStack.addControl(createSliderControl(t("music_volume"), "audio", "music", 0, 1, true, "#9b59b6"));
            contentStack.addControl(createSliderControl(t("sfx_volume"), "audio", "sfx", 0, 1, true, "#9b59b6"));

            const { panel: spatialPanel, checkbox: spatialCheck } = createCheckboxControl(t("spatial_audio"), "audio", "spatial", "#9b59b6", () => {
                if (window.gameAudioManager?.updateAudioVolumes) {
                    window.gameAudioManager.updateAudioVolumes();
                }
            });
            contentStack.addControl(spatialPanel);
        }
        else if (tabId === "controls") {
            createContentSection(t("keybindings"));
            contentStack.addControl(createKeyBindingRow("forward", "forward", "#e67e22", settings));
            contentStack.addControl(createKeyBindingRow("backward", "backward", "#e67e22", settings));
            contentStack.addControl(createKeyBindingRow("left", "left", "#e67e22", settings));
            contentStack.addControl(createKeyBindingRow("right", "right", "#e67e22", settings));
            contentStack.addControl(createKeyBindingRow("sprint", "sprint", "#e67e22", settings));
            contentStack.addControl(createKeyBindingRow("crouch", "crouch", "#e67e22", settings));
            
            createContentSection(t("mouse_sensitivity"));
            contentStack.addControl(createSliderControl(t("mouse_sensitivity"), "controls", "sensitivity", 0.1, 5.0, false, "#e67e22"));

            const { panel: invertYPanel } = createCheckboxControl(t("invert_y"), "controls", "invertY", "#e67e22", (v) => {
                if (window.currentGameData?.camera) {
                    const baseSensibility = 2000;
                    window.currentGameData.camera.angularSensibilityY = (v ? -1 : 1) * (baseSensibility / settings.controls.sensitivity);
                }
            });
            contentStack.addControl(invertYPanel);

            contentStack.addControl(createSliderControl(t("stick_deadzone"), "controls", "deadzone", 0.0, 0.5, false, "#e67e22"));

            const { panel: vibrationPanel } = createCheckboxControl(t("gamepad_vibration"), "controls", "vibration", "#e67e22", (v) => {
                if (v && window.gamepadManager?.vibrate) {
                    window.gamepadManager.vibrate(0.5, 100);
                }
            });
            contentStack.addControl(vibrationPanel);
        }
        else if (tabId === "gameplay") {
            createContentSection(t("language"));
            
            const langContainer = new BABYLON.GUI.Rectangle();
            langContainer.width = "100%";
            langContainer.height = "50px";
            langContainer.background = "#252535";
            langContainer.cornerRadius = 5;
            langContainer.thickness = 1;
            langContainer.color = "#444";
            langContainer.paddingLeft = "15px";
            langContainer.paddingRight = "15px";
            langContainer.marginBottom = "15px";

            const langPanel = new BABYLON.GUI.StackPanel();
            langPanel.width = "100%";
            langPanel.height = "40px";
            langPanel.isVertical = false;
            langPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            langPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            langContainer.addControl(langPanel);
            
            const langLabel = new BABYLON.GUI.TextBlock();
            langLabel.text = t("language") + " : ";
            langLabel.color = "white";
            langLabel.width = "150px";
            langLabel.height = "35px";
            langLabel.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            langLabel.fontSize = 13;
            langPanel.addControl(langLabel);

            ["FR", "EN"].forEach(lang => {
                const btn = BABYLON.GUI.Button.CreateSimpleButton("btnLang" + lang, lang);
                btn.width = "70px";
                btn.height = "32px";
                btn.color = "white";
                btn.background = settings.gameplay.language === lang.toLowerCase() ? "#1abc9c" : "#555";
                btn.cornerRadius = 5;
                btn.marginRight = "8px";
                btn.fontSize = 12;
                btn.fontWeight = "bold";
                btn.onPointerUpObservable.add(() => {
                    settings.gameplay.language = lang.toLowerCase();
                    langPanel.children.filter(c => c instanceof BABYLON.GUI.Button).forEach(b => b.background = "#555");
                    btn.background = "#1abc9c";
                    window.fullUpdateLanguage?.();
                });
                langPanel.addControl(btn);
            });
            contentStack.addControl(langContainer);

            createContentSection(t("show_hud"));
            const { panel: hudPanel } = createCheckboxControl(t("show_hud"), "gameplay", "showHUD", "#1abc9c", (v) => {
                if (window.currentGameData) {
                    const { bossKillsText, hpContainer, xpContainer } = window.currentGameData;
                    if (bossKillsText) bossKillsText.isVisible = v;
                    if (hpContainer) hpContainer.isVisible = v;
                    if (xpContainer) xpContainer.isVisible = v;
                }
            });
            contentStack.addControl(hudPanel);
        }
    };

    updateContentPanel("video");

    const backBtn = BABYLON.GUI.Button.CreateSimpleButton("backBtn", t("back"));
    backBtn.width = "200px";
    backBtn.height = "50px";
    backBtn.color = "white";
    backBtn.background = "#c0392b";
    backBtn.thickness = 0;
    backBtn.cornerRadius = 10;
    backBtn.fontSize = 20;
    backBtn.fontWeight = "bold";
    backBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    backBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    backBtn.top = "-15px";
    backBtn.hoverCursor = "pointer";
    
    backBtn.onPointerEnterObservable.add(() => {
        backBtn.background = "#e74c3c";
        backBtn.scaleX = 1.05;
        backBtn.scaleY = 1.05;
    });
    
    backBtn.onPointerOutObservable.add(() => {
        backBtn.background = "#c0392b";
        backBtn.scaleX = 1.0;
        backBtn.scaleY = 1.0;
    });
    
    backBtn.onPointerUpObservable.add(() => {
        settingsPanel.isVisible = false;
        mainMenuPanel.isVisible = true;
    });
    settingsPanel.addControl(backBtn);

    window.refreshUIText = () => {
        settingsBtn.textBlock.text = t("settings");
        startBtn.textBlock.text = t("start");
        title.text = t("title");
        header.text = t("settings");
        backBtn.textBlock.text = t("back");
        tabs.forEach(tab => {
            if (tabButtons[tab.id]) {
                tabButtons[tab.id].textBlock.text = t("tab_" + tab.id);
            }
        });
    };

    window.fullUpdateLanguage = () => {
        try {
            window.refreshUIText?.();
            updateContentPanel(currentTab);
            tabs.forEach((tab, index) => {
                const button = tabButtons[tab.id];
                if (button) {
                    button.textBlock.text = t("tab_" + tab.id);
                }
            });
        } catch (e) {
        }
    };

    return scene;
}
