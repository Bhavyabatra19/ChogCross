function CMain(oData) {
    var _bUpdate;
    var _iCurResource = 0;
    var RESOURCE_TO_LOAD = 0;
    var _iState = STATE_LOADING;
    var _oData;
    var _oPreloader;
    var _oMenu;
    var _oGame;
    var _oLevelMenu;

    this.initContainer = function () {
        try {
            console.log("CMain.initContainer - Starting initialization");
            s_oCanvas = document.getElementById("canvas");
            
            if (!s_oCanvas) {
                console.error("Canvas element not found!");
                return;
            }
            console.log("Canvas element found:", s_oCanvas);
            
            // Store original canvas dimensions
            const originalCanvasWidth = s_oCanvas.width;
            const originalCanvasHeight = s_oCanvas.height;
            
            // Initialize Graphics Engine for advanced rendering
            if (window.graphicsEngine) {
                console.log('🚀 Using advanced GraphicsEngine for rendering');
                // GraphicsEngine will handle canvas optimization automatically
                // But we ensure canvas dimensions are preserved
                console.log('📏 Canvas dimensions preserved:', s_oCanvas.width, 'x', s_oCanvas.height);
            } else {
                console.log('⚠️ GraphicsEngine not available, using fallback optimization');
                // Fallback optimization
                s_oCanvas.willReadFrequently = true;
                s_oCanvas.style.imageRendering = 'auto';
                s_oCanvas.style.imageRendering = 'smooth';
                
                const ctx = s_oCanvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.globalCompositeOperation = 'source-over';
                }
            }
            
            // Final check to ensure dimensions are preserved
            if (s_oCanvas.width !== originalCanvasWidth || s_oCanvas.height !== originalCanvasHeight) {
                console.warn('⚠️ Canvas dimensions changed during initialization! Restoring...');
                s_oCanvas.width = originalCanvasWidth;
                s_oCanvas.height = originalCanvasHeight;
            }
            
            console.log("Creating stage...");
            s_oStage = new createjs.Stage(s_oCanvas);
            s_oStage.preventSelection = false;
            createjs.Touch.enable(s_oStage);
            console.log("Stage created successfully");

            s_bMobile = jQuery.browser.mobile;
            if (s_bMobile === false) {
                s_oStage.enableMouseOver(20);
                $('body').on('contextmenu', '#canvas', function (e) {
                    return false;
                });
            }

            s_iPrevTime = new Date().getTime();

            createjs.Ticker.addEventListener("tick", this._update);
            createjs.Ticker.setFPS(FPS);

            if (navigator.userAgent.match(/Windows Phone/i)) {
                DISABLE_SOUND_MOBILE = true;
            }

            s_oSpriteLibrary = new CSpriteLibrary();

            // Register instances with GameManager
            if (window.gameManager) {
                window.gameManager.setMain(this);
                window.gameManager.setStage(s_oStage);
                window.gameManager.setSpriteLibrary(s_oSpriteLibrary);
                window.gameManager.setCanvas(s_oCanvas);
                window.gameManager.setMobile(s_bMobile);
            }

            // Log initialization
            if (window.errorLogger) {
                window.errorLogger.info('CMain container initialized', {
                    canvasWidth: CANVAS_WIDTH,
                    canvasHeight: CANVAS_HEIGHT,
                    mobile: s_bMobile,
                    fps: FPS
                });
            }

            //ADD PRELOADER
            _oPreloader = new CPreloader();
            
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('CMain container initialization failed', {
                    error: error.message,
                    stack: error.stack
                });
            }
            throw error;
        }
    };

    this.preloaderReady = function () {
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            this._initSounds(); // Re-enabled sound loading
        }

        this._loadImages();
        _bUpdate = true;
    };

    this.soundLoaded = function () {
        _iCurResource++;
        var iPerc = Math.floor(_iCurResource / RESOURCE_TO_LOAD * 100);
        _oPreloader.refreshLoader(iPerc);

        if (_iCurResource === RESOURCE_TO_LOAD) {
            s_oMain._onRemovePreloader();
        }
    };
    
    this._initSounds = function(){
        var aSoundsInfo = new Array();
        aSoundsInfo.push({path: './sounds/',filename:'footstep',loop:false,volume:1, ingamename: 'footstep'});
        aSoundsInfo.push({path: './sounds/',filename:'click',loop:false,volume:1, ingamename: 'click'});
        aSoundsInfo.push({path: './sounds/',filename:'jump',loop:false,volume:1, ingamename: 'jump'});
        aSoundsInfo.push({path: './sounds/',filename:'splash',loop:false,volume:1, ingamename: 'splash'});
        aSoundsInfo.push({path: './sounds/',filename:'soundtrack',loop:true,volume:1, ingamename: 'soundtrack'});
        
        RESOURCE_TO_LOAD += aSoundsInfo.length;

        s_aSounds = new Array();
        for(var i=0; i<aSoundsInfo.length; i++){
            console.log("🔊 Loading sound:", aSoundsInfo[i].ingamename, "from:", aSoundsInfo[i].path + aSoundsInfo[i].filename);
            s_aSounds[aSoundsInfo[i].ingamename] = new Howl({ 
                                                            src: [aSoundsInfo[i].path+aSoundsInfo[i].filename+'.mp3', aSoundsInfo[i].path+aSoundsInfo[i].filename+'.ogg'],
                                                            autoplay: false,
                                                            preload: true,
                                                            loop: aSoundsInfo[i].loop, 
                                                            volume: aSoundsInfo[i].volume,
                                                            onload: s_oMain.soundLoaded,
                                                            onloaderror: function(id, error) {
                                                                console.error("🚨 Sound load error:", aSoundsInfo[i].ingamename, error);
                                                            }
                                                        });
        }
        
        // AudioContext'i resume et - Chrome'un autoplay policy'si için - Updated for Howler.js v2.2.3
        if (typeof Howler !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
            console.log("🔊 Resuming AudioContext for autoplay policy compliance");
            Howler.ctx.resume().then(function() {
                console.log("✅ AudioContext resumed successfully");
            }).catch(function(error) {
                console.error("❌ Failed to resume AudioContext:", error);
            });
        }
        
        // User interaction listener for audio unlock
        this._setupAudioUnlock();
        
    };  

    this._setupAudioUnlock = function() {
        var audioUnlocked = false;
        
        function unlockAudio() {
            if (audioUnlocked) return;
            
            console.log("🔊 Attempting to unlock audio on user interaction...");
            
            // Try to resume AudioContext - Updated for Howler.js v2.2.3
            if (typeof Howler !== 'undefined' && Howler.ctx) {
                if (Howler.ctx.state === 'suspended') {
                    Howler.ctx.resume().then(function() {
                        console.log("✅ AudioContext unlocked via user interaction");
                        audioUnlocked = true;
                        
                        // Play a silent sound to ensure unlocking
                        if (s_aSounds && s_aSounds['click']) {
                            try {
                                var silentInstance = s_aSounds['click'].play();
                                s_aSounds['click'].volume(0);
                                setTimeout(function() {
                                    s_aSounds['click'].stop();
                                    s_aSounds['click'].volume(1);
                                    console.log("🔊 Silent audio test completed - audio should now work");
                                }, 100);
                            } catch (error) {
                                console.log("🔊 Silent test failed, but AudioContext resumed:", error);
                            }
                        }
                        
                        // Remove event listeners after successful unlock
                        document.removeEventListener('touchend', unlockAudio);
                        document.removeEventListener('click', unlockAudio);
                        document.removeEventListener('keydown', unlockAudio);
                    }).catch(function(error) {
                        console.error("❌ Failed to unlock AudioContext:", error);
                    });
                } else {
                    console.log("✅ AudioContext already unlocked");
                    audioUnlocked = true;
                }
            }
        }
        
        // Add multiple event listeners for different interaction types
        document.addEventListener('touchend', unlockAudio, { once: false });
        document.addEventListener('click', unlockAudio, { once: false });
        document.addEventListener('keydown', unlockAudio, { once: false });
        
        console.log("🔊 Audio unlock listeners added - waiting for user interaction");
    };
    
    this._loadImages = function () {
        s_oSpriteLibrary.init(this._onImagesLoaded, this._onAllImagesLoaded, this);

        s_oSpriteLibrary.addSprite("bg_menu", "./sprites/bg_menu2.png");
        s_oSpriteLibrary.addSprite("but_exit", "./sprites/but_exit.png");
        s_oSpriteLibrary.addSprite("audio_icon", "./sprites/audio_icon.png");
        s_oSpriteLibrary.addSprite("but_play", "./sprites/but_play.png");
        s_oSpriteLibrary.addSprite("but_restart", "./sprites/but_restart.png");
        s_oSpriteLibrary.addSprite("but_home", "./sprites/but_home.png");
        s_oSpriteLibrary.addSprite("but_continue", "./sprites/but_continue.png");
        s_oSpriteLibrary.addSprite("msg_box", "./sprites/msg_box.png");
        s_oSpriteLibrary.addSprite("but_credits", "./sprites/but_credits.png");
        s_oSpriteLibrary.addSprite("but_leaderboard", "./sprites/but_leaderboard.png");
        s_oSpriteLibrary.addSprite("logo_ctl", "./sprites/logo_ctl.png");
        s_oSpriteLibrary.addSprite("but_fullscreen", "./sprites/but_fullscreen.png");
        s_oSpriteLibrary.addSprite("but_continue", "./sprites/but_continue.png");
        // s_oSpriteLibrary.addSprite("bg_end_panel", "./sprites/bg_end_panel.png"); // Dosya bulunamadı
        // s_oSpriteLibrary.addSprite("bg_help_panel", "./sprites/bg_help_panel.png"); // Dosya bulunamadı
        s_oSpriteLibrary.addSprite("bg_game", "./sprites/bg3.png");
        s_oSpriteLibrary.addSprite("bg_game_1", "./sprites/bg3.png");
        s_oSpriteLibrary.addSprite("bg_game_2", "./sprites/bg3.png");
        s_oSpriteLibrary.addSprite("but_no", "./sprites/but_no.png");
        s_oSpriteLibrary.addSprite("but_yes", "./sprites/but_yes.png");
        s_oSpriteLibrary.addSprite("but_restart_small", "./sprites/but_restart_small.png");
        // Eski kutukno sprite'ları kaldırıldı - artık platform.png sprite sheet kullanılıyor
        s_oSpriteLibrary.addSprite("hero", "./sprites/idlesprite.png");
        s_oSpriteLibrary.addSprite("hero_jump", "./sprites/jumpsprite.png");
        s_oSpriteLibrary.addSprite("platform_spritesheet", "./sprites/platform.png");
        s_oSpriteLibrary.addSprite("first_platform", "./sprites/firstplatform.webp");
    s_oSpriteLibrary.addSprite("sea_spritesheet", "./sprites/sea_spritesheet.png");
    s_oSpriteLibrary.addSprite("sharkidle", "./sprites/sharkidle.png");
    s_oSpriteLibrary.addSprite("sharkattack", "./sprites/spritesheet.png");
    s_oSpriteLibrary.addSprite("celebration", "./sprites/celebration.png");
s_oSpriteLibrary.addSprite("sky", "./sprites/Layers/Sky.png");
s_oSpriteLibrary.addSprite("bg_decor", "./sprites/Layers/BG_Decor.png");
s_oSpriteLibrary.addSprite("middle_decor", "./sprites/Layers/Middle_Decor.png");
s_oSpriteLibrary.addSprite("foreground", "./sprites/Layers/Foreground.png");
// ground_01 kaldırıldı - denizin arkasında kalıyordu

        RESOURCE_TO_LOAD += s_oSpriteLibrary.getNumSprites();
        s_oSpriteLibrary.loadSprites();
    };

    this._onImagesLoaded = function () {
        _iCurResource++;
        var iPerc = Math.floor(_iCurResource / RESOURCE_TO_LOAD * 100);
        _oPreloader.refreshLoader(iPerc);
        
        if (_iCurResource === RESOURCE_TO_LOAD) {
            this._onRemovePreloader();
        }
    };

    this._onAllImagesLoaded = function () {
        
    };
    
    this._onRemovePreloader = function(){
        try{
            console.log("CMain._onRemovePreloader - Removing preloader");
            saveItem("ls_available","ok");
        }catch(evt){
            // localStorage not defined
            console.warn("localStorage not available:", evt);
            s_bStorageAvailable = false;
        }

        console.log("Unloading preloader...");
        _oPreloader.unload();
        console.log("Preloader unloaded");

        if (!isIOS()) {
            console.log("Playing soundtrack...");
            try {
                s_oSoundTrack = playSound("soundtrack", 0.2, true);
                console.log("Soundtrack started successfully");
            } catch(e) {
                console.error("Failed to play soundtrack:", e);
            }
        }
        
        console.log("Going to menu...");
        this.gotoMenu();
        console.log("Menu loaded");
    };
    
    this.gotoMenu = function () {
        // Hide canvas betting UI and game UI when going to menu
        if (s_oInterface) {
            // Use dedicated hard hide for menu to prevent re-show
            if (s_oInterface.hideAllUIForMenu) {
                s_oInterface.hideAllUIForMenu();
            } else {
                s_oInterface.hideCanvasBettingUI();
                s_oInterface.hideGameUI();
            }
        }

        // As an extra guard, explicitly hide betting-ui DOM if still present
        try {
            var bettingUIEl = document.getElementById('betting-ui');
            if (bettingUIEl) {
                bettingUIEl.classList.remove('canvas-positioned');
                bettingUIEl.style.display = 'none';
                bettingUIEl.style.visibility = 'hidden';
                bettingUIEl.style.pointerEvents = 'none';
            }
        } catch (e) { console.log('Force hide betting-ui failed:', e && e.message ? e.message : e); }
        
        _oMenu = new CMenu();
        _iState = STATE_MENU;
        
        // Restart background music when returning to menu
        this.restartBackgroundMusic();
        
        // Re-initialize wallet UI when returning to menu
        setTimeout(function() {
            console.log("🔄 Re-initializing wallet UI for menu...");
            
            // Check if wallet root exists
            const walletRoot = document.getElementById("privy-wallet-root");
            console.log("🔍 Wallet root element:", walletRoot);
            console.log("🔍 Wallet root innerHTML:", walletRoot ? walletRoot.innerHTML : "N/A");
            
            if (walletRoot) {
                // Check if wallet container already exists
                const existingContainer = document.querySelector('.privy-wallet-container');
                console.log("🔍 Existing wallet container:", existingContainer);
                
                if (existingContainer) {
                    console.log("✅ Wallet container already exists, making it visible");
                    // Make sure it's visible
                    existingContainer.classList.remove('wallet-hidden');
                    existingContainer.classList.add('wallet-visible');
                    existingContainer.style.top = '0px';
                    existingContainer.style.left = '0px';
                    existingContainer.style.opacity = '1';
                    existingContainer.style.visibility = 'visible';
                    existingContainer.style.pointerEvents = 'auto';
                    return;
                }
                
                // Check if wallet root has any content
                if (walletRoot.innerHTML.trim() === '') {
                    console.log("⚠️ Wallet root is empty, trying to re-mount...");
                    
                    // Try to re-mount React component
                    if (window.React && window.ReactDOM && window.createRoot) {
                        try {
                            const root = window.createRoot(walletRoot);
                            // Try to render the wallet component again
                            if (window.App) {
                                root.render(window.React.createElement(window.App, {}));
                                console.log("✅ Wallet UI re-mounted successfully!");
                            } else {
                                console.log("⚠️ App component not found");
                            }
                        } catch (error) {
                            console.log("⚠️ Failed to re-mount wallet UI:", error);
                        }
                    } else {
                        console.log("⚠️ React or ReactDOM not available");
                        console.log("🔍 window.React:", !!window.React);
                        console.log("🔍 window.ReactDOM:", !!window.ReactDOM);
                        console.log("🔍 window.createRoot:", !!window.createRoot);
                    }
                } else {
                    console.log("✅ Wallet root has content, wallet UI should be visible");
                }
            } else {
                console.log("⚠️ Wallet root element not found");
            }
        }, 100);
    };

    this.gotoGame = function (iLevel) {
        if (window.svgMenuSystem && window.svgMenuSystem.setSocialMenuVisible) {
            window.svgMenuSystem.setSocialMenuVisible(false);
        }
        // Ensure state is set BEFORE creating game so UI gating can detect STATE_GAME
        _iState = STATE_GAME;
        _oGame = new CGame(_oData, iLevel || 1);

        $(s_oMain).trigger("start_session");
    };

    // Expose current state for UI gating (used by CInterface.showCanvasBettingUI)
    this.getState = function () {
        return _iState;
    };
    
    /**
     * Restart background music
     */
    this.restartBackgroundMusic = function() {
        console.log("🎵 Restarting background music...");
        
        // Stop any existing soundtrack first
        if (typeof stopSound === 'function') {
            stopSound("soundtrack");
        }
        
        // Start background music
        if (!isIOS()) {
            try {
                s_oSoundTrack = playSound("soundtrack", 0.2, true);
                console.log("✅ Background music restarted successfully");
            } catch(e) {
                console.error("❌ Failed to restart background music:", e);
            }
        } else {
            console.log("🔇 Background music disabled for iOS");
        }
    };

    this.stopUpdate = function(){
        _bUpdate = false;
        createjs.Ticker.paused = true;
        $("#block_game").css("display","block");
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            Howler.mute(true);
        }
        
    };

    this.startUpdate = function(){
        s_iPrevTime = new Date().getTime();
        _bUpdate = true;
        createjs.Ticker.paused = false;
        $("#block_game").css("display","none");
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            if(s_bAudioActive){
                Howler.mute(false);
            }
        }
        
    };

    this._update = function (event) {
        if (_bUpdate === false) {
            return;
        }
        var iCurTime = new Date().getTime();
        s_iTimeElaps = iCurTime - s_iPrevTime;
        s_iCntTime += s_iTimeElaps;
        s_iCntFps++;
        s_iPrevTime = iCurTime;

        if (s_iCntTime >= 1000) {
            s_iCurFps = s_iCntFps;
            s_iCntTime -= 1000;
            s_iCntFps = 0;
        }

        if (_iState === STATE_GAME) {
            _oGame.update();
        }

        s_oStage.update(event);

    };

    s_oMain = this;

    _oData = oData;
    ENABLE_FULLSCREEN = oData.fullscreen;
    ENABLE_CHECK_ORIENTATION = oData.check_orientation;

    this.initContainer();
}

var s_bMobile;
var s_bAudioActive = true;
var s_bFullscreen = false;
var s_iCntTime = 0;
var s_iTimeElaps = 0;
var s_iPrevTime = 0;
var s_iCntFps = 0;
var s_iCurFps = 0;

var s_iLevelReached = 1;

var s_oDrawLayer;
var s_oStage;
var s_oMain;
var s_oSpriteLibrary;
var s_oSoundTrack = null;
var s_oCanvas;
var s_iBestScore = 0;

var s_bStorageAvailable = true;
var s_aSounds;

var CANVAS_REF_WIDTH = 1200;
var CANVAS_REF_HEIGHT = (window.gameConfig && window.gameConfig.get('canvas.height')) ? window.gameConfig.get('canvas.height') : 700;
var g_canvasScale = 1;

function resizeGameCanvas() {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Canvas'ı responsive yapmak için boyutlandır
    const centerPanel = document.querySelector('.center-panel');
    
    if (centerPanel) {
        const panelRect = centerPanel.getBoundingClientRect();
        const padding = 10; // Daha az padding
        
        // Canvas boyutlarını panel boyutlarına göre ayarla
        const maxWidth = panelRect.width - padding;
        const maxHeight = panelRect.height - padding;
        
        // Canvas'ın orijinal aspect ratio'sunu koru (config tabanlı)
        const aspectRatio = CANVAS_REF_WIDTH / CANVAS_REF_HEIGHT;
        
        let newWidth = maxWidth;
        let newHeight = maxWidth / aspectRatio;
        
        // Eğer yükseklik çok büyükse, yüksekliği sınırla
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        // Canvas boyutlarını ayarla - responsive boyutlandırma
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        canvas.style.objectFit = 'contain';
        
        console.log(`📐 Canvas resized: ${newWidth}x${newHeight} (panel: ${panelRect.width}x${panelRect.height})`);
        
        // Canvas scale'i CSS variable olarak ayarla (bet UI için)
        var canvasScale = newWidth / CANVAS_REF_WIDTH;
        document.documentElement.style.setProperty('--canvas-scale', canvasScale);
        
        // CreateJS stage'i güncelle
        if (typeof s_oStage !== 'undefined' && s_oStage) {
            s_oStage.update();
        }
    }
    
    // Use the existing sizeHandler function instead of custom resizing
    // This ensures consistency with the game's scaling system
    if (typeof sizeHandler === 'function') {
        sizeHandler();
    } else {
        // Fallback to original logic if sizeHandler is not available
        var aspect = CANVAS_REF_WIDTH / CANVAS_REF_HEIGHT;
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (w / h > aspect) {
            w = h * aspect;
        } else {
            h = w / aspect;
        }
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        g_canvasScale = w / CANVAS_REF_WIDTH;
        
        // Canvas scale'i CSS variable olarak ayarla (bet UI için)
        document.documentElement.style.setProperty('--canvas-scale', g_canvasScale);
        
        // Update CreateJS stage if available
        if (typeof s_oStage !== 'undefined' && s_oStage) {
            s_oStage.update();
        }
    }
}
// Debounced resize to avoid thrashing parallax/camera during gameplay
(function(){
    var _resizeTimer = null;
    function debouncedResize(){
        if (_resizeTimer) clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(function(){
            _resizeTimer = null;
            resizeGameCanvas();
        }, 120);
    }
    window.addEventListener('resize', debouncedResize);
})();
// Oyun başlatılırken de çağır
setTimeout(resizeGameCanvas, 100);
// Daha sık çağır
setInterval(resizeGameCanvas, 500);