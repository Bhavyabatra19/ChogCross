function CInterface(iBestScore) {
    var _oAudioToggle;
    var _bWalletVisible = true; // Wallet panel görünürlük durumu
    
    // Wallet toggle handler'ları için referanslar
    var _walletToggleHandler = null;
    
    var _pStartPosAudio;
    var _pStartPosRestart;
    var _pStartPosFullscreen;
    var _oScoreText;
    var _iBestScore;
    var _oBestScoreText;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    var _oHitArea;
    var _oEndPanel;
    var _oHandPanel;
    var _oScoreOutline;
    var _oBestScoreOutline;
    var _oJumpsLeftText; // Kalan atlama sayısı text'i
    var _oJumpsLeftOutline; // Kalan atlama sayısı outline'ı
    
    // Canvas-native UI mode flag
    var USE_CREATEJS_CANVAS_UI = true;
    
    // CreateJS-based Canvas UIs
    var _oCanvasBetUIContainer = null;
    var _oCanvasGameUIContainer = null;
    // Bet UI elements
    var _betBg, _betLabelText, _betValueText, _betMinusBtn, _betPlusBtn;
    var _modeLabelText, _easyBtn, _hardBtn;
    var _playModeLabelText, _manualBtn, _autoBtn;
    var _startBtn, _homeBtn, _recoveryBtn;
    // Game UI elements
    var _gameBg, _gBetLabel, _gBetValue, _gModeLabel, _gModeValue;
    var _gMultLabel, _gMultValue, _gWinLabel, _gWinValue, _gJumpsLabel, _gJumpsValue;
    var _cashoutBtn, _homeGameBtn;
    
    // Betting UI elements
    var _oBettingPanel;
    var _oBetAmountText;
    var _oBetAmountOutline;
    var _oWinningsText;
    var _oWinningsOutline;
    var _oBetMinusButton;
    var _oBetPlusButton;
    var _oStartGameButton;
    var _bBettingUIVisible = false;
    var _sCurrentDifficulty = "easy"; // Track current difficulty
    var _bAutoMode = false; // Auto mode status
    var _oCurrentSelectionText; // Reference to current selection display
    
    // Canvas Bet UI visibility flag
    var _bCanvasBettingUIVisible = false;
    
    this._init = function (iBestScore) {
        _iBestScore = iBestScore;
        // Exit butonu kaldırıldı
        
        // Initialize auto mode listeners
        this._addAutoModeListeners();
        
        // HitArea - oyun alanı için dokunma algılama
        _oHitArea = new createjs.Shape();
        _oHitArea.graphics.beginFill("red").drawRect(0, 10, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oHitArea.alpha = 0.01;
        s_oStage.addChild(_oHitArea);

        _oHitArea.on("mousedown", function () { 
            console.log("🎯 HIT AREA CLICKED - Calling tapScreen()");
            if (s_oGame && s_oGame.tapScreen) {
                s_oGame.tapScreen();
            } else {
                console.error("❌ s_oGame not available or tapScreen missing");
            }
        });
        _oHitArea.on("pressup", function () { 
            console.log("🎯 HIT AREA RELEASED - Calling releaseScreen()");
            if (s_oGame && s_oGame.releaseScreen) {
                s_oGame.releaseScreen();
            }
        });
        
        // Audio and Fullscreen buttons disabled - using SVG menu system instead
        // if (DISABLE_SOUND_MOBILE === false || s_bMobile === false){
        //     var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
        //     
        //     // Audio buton pozisyonu - sağ üst köşeden 50px sola ve 30px aşağı kaydırıldı
        //     _pStartPosAudio = {x: CANVAS_WIDTH - 130 - oSprite.width/2, y: 80 + oSprite.height/2}; // 30px aşağı kaydırıldı
        //     // Audio button positioned 50px left from top right and 30px down
        //     _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive, s_oStage);
        //     _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
        //     
        //     // CToggle sınıfı otomatik olarak doğru hitArea'yı ayarlıyor
        //     
        //     // Fullscreen buton pozisyonu - Audio butonundan 80px sol
        //     _pStartPosFullscreen = {x: _pStartPosAudio.x - 80, y: _pStartPosAudio.y};
        //     // Fullscreen button positioned 80px left of audio button
        // }else{
        //     // Audio olmadığında fullscreen buton pozisyonu - sağ üst köşe ve 30px aşağı
        //     _pStartPosFullscreen = {x: CANVAS_WIDTH - 50, y: 80}; // 30px aşağı kaydırıldı
        //     // Fullscreen button positioned at top right and 30px down
        // }

        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        
        if(ENABLE_FULLSCREEN === false){
            _fRequestFullScreen = false;
        }
        
        // Fullscreen button disabled - using SVG menu system instead
        // if (_fRequestFullScreen && screenfull.enabled){
        //     var oSpriteFullscreen = s_oSpriteLibrary.getSprite('but_fullscreen');
        //     // Fullscreen button pozisyonu
        //     _oButFullscreen = new CToggle(_pStartPosFullscreen.x, _pStartPosFullscreen.y, oSpriteFullscreen, s_bFullscreen, s_oStage);
        //     _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
        //     
        //     // CToggle sınıfı otomatik olarak doğru hitArea'yı ayarlıyor
        //     
        //     _pStartPosRestart = {x: _pStartPosFullscreen.x - oSpriteFullscreen.width, y: _pStartPosFullscreen.y};
        // }else{
        //     _pStartPosRestart = {x: _pStartPosFullscreen.x, y: _pStartPosFullscreen.y};
        // }
        // Score, Best Score ve Jumps Left text'leri kaldırıldı

        _oEndPanel = new CEndPanel();
        
        // Help panel kaldırıldı - gambling modunda gerekli değil
        // if(s_bFirstPlay){
        //     s_bFirstPlay = false;
        //     _oHandPanel = new CHelpPanel();
        // }
        
        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
        
        // Add cashout completed event listener for UI reset
        window.addEventListener('cashoutCompleted', this._onCashoutCompleted.bind(this));
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        // Exit button kaldırıldı
        
        // Audio and Fullscreen buttons disabled - using SVG menu system instead
        // if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
        //     var oSpriteAudio = s_oSpriteLibrary.getSprite('audio_icon');
        //     _oAudioToggle.setPosition(CANVAS_WIDTH - 130 - oSpriteAudio.width/2, 80 + oSpriteAudio.height/2);
        // }
        
        // if (_fRequestFullScreen && screenfull.enabled){
        //     var oSpriteFullscreen = s_oSpriteLibrary.getSprite('but_fullscreen');
        //     _oButFullscreen.setPosition(CANVAS_WIDTH - 210 - oSpriteFullscreen.width/2, 80 + oSpriteFullscreen.height/2);
        // }
    };

   this.refreshScore = function(iScore){
       // Score güncelleme fonksiyonu boş bırakıldı
    };
    
    this.updateJumpsLeft = function(iJumpsLeft){
        // Jumps left güncelleme fonksiyonu boş bırakıldı
    };
    
    // Canvas Betting UI functions - Move HTML UI to canvas area
    this.showCanvasBettingUI = function(iBetAmount, iLevel) {
        if (USE_CREATEJS_CANVAS_UI) {
            _bCanvasBettingUIVisible = true;
            this._showCanvasBetUI(iBetAmount);
            return;
        }
        console.log("=== showCanvasBettingUI called ===");
        console.log("Bet amount:", iBetAmount, "Level:", iLevel);
        console.log("Already visible:", _bCanvasBettingUIVisible);
        
        // Force hide game UI first if it's showing
        if (_bGameUIVisible) {
            console.log("Game UI is visible, hiding it first...");
            this.hideGameUI();
        }
        
        // Force show UI regardless of flag state
        _bCanvasBettingUIVisible = true;
        
        // Get the existing HTML betting UI
        var bettingUI = document.getElementById('betting-ui');
        if (!bettingUI) {
            console.error("Betting UI element not found!");
            return;
        }
        
        // Apply 100px right shift to betting UI sections
        setTimeout(function() {
            var betSection = bettingUI.querySelector('.bet-section');
            var difficultySection = bettingUI.querySelector('.difficulty-section');
            if (betSection) {
                betSection.style.marginLeft = '100px';
            }
            if (difficultySection) {
                difficultySection.style.marginLeft = '100px';
            }
        }, 100);

        // Ensure betting UI is inside center panel so the border wraps it together with canvas
        try {
            var centerPanelContent = document.querySelector('#center-panel .panel-content');
            if (centerPanelContent && bettingUI.parentElement !== centerPanelContent) {
                centerPanelContent.appendChild(bettingUI);
            }
        } catch (e) { console.log('Move betting-ui into center-panel failed:', e && e.message ? e.message : e); }
        
        // Position the HTML UI at the bottom of the canvas (only in game state)
        if (typeof s_oMain !== 'undefined' && s_oMain && s_oMain.getState && s_oMain.getState() === STATE_GAME) {
            bettingUI.classList.add('canvas-positioned');
            bettingUI.style.display = 'flex';
            bettingUI.style.visibility = 'visible';
        } else {
            // If not in game, ensure hidden (safety)
            bettingUI.classList.remove('canvas-positioned');
            bettingUI.style.display = 'none';
            bettingUI.style.visibility = 'hidden';
            bettingUI.style.pointerEvents = 'none';
            _bCanvasBettingUIVisible = false;
            // Retry once shortly in case state flips to GAME right after Play
            try {
                var self = this;
                setTimeout(function(){
                    if (typeof s_oMain !== 'undefined' && s_oMain && s_oMain.getState && s_oMain.getState() === STATE_GAME) {
                        self.showCanvasBettingUI(iBetAmount, iLevel);
                    }
                }, 150);
            } catch(_) {}
            return;
        }
        
        // Force CSS to ensure visibility
        bettingUI.style.opacity = '1';
        bettingUI.style.pointerEvents = 'auto';
        
        // Update bet amount display
        this.updateBetAmount(iBetAmount);
        
        // Update difficulty buttons to show initial state
        this.updateDifficultyButtons();
        
        // Add event listeners
        console.log("🔧 About to call _addBettingEventListeners...");
        this._addBettingEventListeners();
        
        // Add auto mode listeners for betting UI
        this._addAutoModeListeners();
        console.log("🔧 _addBettingEventListeners called");
        
        
        
        // Update risk display for current difficulty
        this.updateRiskDisplay();
        
        // Show side panels
        if (window.sidePanels) {
            window.sidePanels.setVisible(true);
            window.sidePanels.setDifficulty(_sCurrentDifficulty);
            window.sidePanels.setBetAmount(iBetAmount);
            console.log(`💰 Bet amount ${iBetAmount} set in SidePanels`);
        }
        
        console.log("=== Canvas Betting UI setup complete ===");
        
        // Final check - ensure UI is actually visible
        console.log("Final UI state check:");
        console.log("- Classes:", bettingUI.className);
        console.log("- Display:", bettingUI.style.display);
        console.log("- Visibility:", bettingUI.style.visibility);
        console.log("- Opacity:", bettingUI.style.opacity);
        console.log("- Computed display:", window.getComputedStyle(bettingUI).display);
    };
    
    this.hideCanvasBettingUI = function() {
        if (USE_CREATEJS_CANVAS_UI) {
            this._hideCanvasBetUI();
            _bCanvasBettingUIVisible = false;
            return;
        }
        if (!_bCanvasBettingUIVisible) return;
        
        _bCanvasBettingUIVisible = false;
        
        // Hide betting UI
        var bettingUI = document.getElementById('betting-ui');
        if (bettingUI) {
            bettingUI.classList.remove('canvas-positioned');
            bettingUI.style.display = 'none';
        }
        
        // Remove event listeners
        this._removeBettingEventListeners();
        
        
        // Hide side panels
        if (window.sidePanels) {
            window.sidePanels.setVisible(false);
        }
        
        console.log("Canvas Betting UI hidden");
    };
    
    // Canvas bet UI helper functions
    this.updateCanvasBetAmount = function(iBetAmount) {
        // Not needed for HTML UI
        console.log("updateCanvasBetAmount called with:", iBetAmount);
    };
    
    this.updateCanvasDifficultyButtons = function() {
        // Not needed for HTML UI
        console.log("updateCanvasDifficultyButtons called");
    };

    // Betting UI functions - Now using HTML elements
    this.showBettingUI = function(iBetAmount, iLevel) {
        console.log("=== showBettingUI called ===");
        console.log("Bet amount:", iBetAmount, "Level:", iLevel);
        console.log("Already visible:", _bBettingUIVisible);
        
        if (_bBettingUIVisible) {
            console.log("Betting UI already visible, returning");
            return;
        }
        
        _bBettingUIVisible = true;
        
        // Show UI container and betting UI
        var uiContainer = document.getElementById('ui-container');
        var bettingUI = document.getElementById('betting-ui');
        var gameUI = document.getElementById('game-ui');
        
        console.log("UI Container element:", uiContainer);
        console.log("Betting UI element:", bettingUI);
        console.log("Game UI element:", gameUI);
        
        // Show UI container
        if (uiContainer) {
            uiContainer.classList.add('game-active');
            console.log("UI container made visible");
        }
        
        if (bettingUI) {
            bettingUI.style.display = 'flex';
            bettingUI.style.visibility = 'visible';
            console.log("Betting UI shown and made visible");
        } else {
            console.error("Betting UI element not found!");
        }
        
        if (gameUI) {
            gameUI.style.display = 'none';
            console.log("Game UI hidden");
        }
        
        // Update bet amount display
        this.updateBetAmount(iBetAmount);
        
        // Update difficulty buttons to show initial state
        this.updateDifficultyButtons();
        
        // Add event listeners
        this._addBettingEventListeners();
        
        
        // Recovery button removed from betting UI - now handled in start game dialog only
        // this._checkForActiveRound(); // REMOVED
        
        
        // Update risk display for current difficulty
        this.updateRiskDisplay();
        
        // Show side panels
        if (window.sidePanels) {
            window.sidePanels.setVisible(true);
            window.sidePanels.setDifficulty(_sCurrentDifficulty);
            window.sidePanels.setBetAmount(iBetAmount);
            console.log(`💰 Bet amount ${iBetAmount} set in SidePanels`);
        }
        
        // Show betting UI in frame
        if (window.gameFrameManager) {
            window.gameFrameManager.showBettingUI();
        }
        
        console.log("=== Betting UI setup complete ===");
    };
    
    this.hideBettingUI = function() {
        if (!_bBettingUIVisible) return;
        
        _bBettingUIVisible = false;
        
        // Hide betting UI
        var bettingUI = document.getElementById('betting-ui');
        if (bettingUI) {
            bettingUI.style.display = 'none';
        }
        
        // Remove event listeners
        this._removeBettingEventListeners();
        
        
        // Hide side panels
        if (window.sidePanels) {
            window.sidePanels.setVisible(false);
        }
        
        // Hide betting UI in frame
        if (window.gameFrameManager) {
            window.gameFrameManager.hideAllUIs();
        }
        
        console.log("Betting UI hidden");
    };
    
    // Event handler functions - defined as properties so they can be removed
    this._betMinusHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("=== BET MINUS CLICKED ===");
        console.log("Event target:", e.target);
        console.log("s_oGame exists:", !!s_oGame);
        console.log("s_oGame.decreaseBet exists:", !!(s_oGame && s_oGame.decreaseBet));
        if (s_oGame && s_oGame.decreaseBet) {
            console.log("Calling s_oGame.decreaseBet()");
            s_oGame.decreaseBet();
            s_oInterface.updateCurrentSelection(); // UI'yi güncelle
        } else {
            console.log("s_oGame.decreaseBet not available");
        }
    };
    
    this._betPlusHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("=== BET PLUS CLICKED ===");
        console.log("Event target:", e.target);
        console.log("s_oGame exists:", !!s_oGame);
        console.log("s_oGame.increaseBet exists:", !!(s_oGame && s_oGame.increaseBet));
        if (s_oGame && s_oGame.increaseBet) {
            console.log("Calling s_oGame.increaseBet()");
            s_oGame.increaseBet();
            s_oInterface.updateCurrentSelection(); // UI'yi güncelle
        } else {
            console.log("s_oGame.increaseBet not available");
        }
    };
    
    this._easyModeHandler = function(e) {
        e.preventDefault();
        console.log("🎯 Easy mode selected");
        _sCurrentDifficulty = 'easy';
        
        // Update game difficulty
        if (s_oGame && s_oGame.setDifficulty) {
            s_oGame.setDifficulty('easy');
        }
        
        // Update difficulty buttons
        s_oInterface.updateDifficultyButtons();
        
        // Update risk display
        s_oInterface.updateRiskDisplay();
        
        // Update side panels
        if (window.sidePanels) {
            window.sidePanels.setDifficulty('easy');
        }
    };
    
    this._hardModeHandler = function(e) {
        e.preventDefault();
        console.log("🎯 Hard mode selected");
        _sCurrentDifficulty = 'hard';
        
        // Update game difficulty
        if (s_oGame && s_oGame.setDifficulty) {
            s_oGame.setDifficulty('hard');
        }
        
        // Update difficulty buttons
        s_oInterface.updateDifficultyButtons();
        
        // Update risk display
        s_oInterface.updateRiskDisplay();
        
        // Update side panels
        if (window.sidePanels) {
            window.sidePanels.setDifficulty('hard');
        }
    };
    
    this._startGameHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent multiple clicks
        if (this.disabled) {
            console.log("Start game button already clicked, ignoring...");
            return;
        }
        
        console.log("=== START GAME CLICKED ===");
        console.log("Event target:", e.target);
        console.log("s_oGame exists:", !!s_oGame);
        
        // Stop any existing music and start fresh
        console.log("🎵 Stopping existing music and starting fresh...");
        if (typeof stopSound === 'function') {
            stopSound("soundtrack"); // Stop any existing soundtrack
        }
        
        // Start background music when game starts
        console.log("🎵 Starting background music on Start Game button click...");
        if (typeof playSound === 'function') {
            playSound("soundtrack", 0.2, true); // Play soundtrack with 20% volume, looped
        } else {
            console.log("⚠️ playSound function not available");
        }
        
        // WalletManager durumunu kontrol et
        console.log("🔍 WalletManager status:", {
            exists: !!window.walletManager,
            balance: window.walletManager ? window.walletManager.getBalance() : 'N/A',
            connected: window.walletManager ? window.walletManager.isConnected() : 'N/A',
            address: window.walletManager ? window.walletManager.getAddress() : 'N/A'
        });
        
        // Bakiye kontrolü (minimum 1 MON)
        var betAmount = s_oGame ? s_oGame.getBetAmount() : 1.0;
        console.log("🔍 Bet amount:", betAmount);
        
        if (window.walletManager && !window.walletManager.canPlaceBet(betAmount)) {
            console.log("❌ Insufficient balance - cannot start game");
            if (window.errorLogger) {
                window.errorLogger.showErrorToUser('You need at least 1 MON balance to start playing.');
            }
            return;
        }
        
        this.disabled = true; // Disable button temporarily
        
        // Hide wallet during gameplay but keep betting panel visible
        // if (s_oInterface.hideWalletForGameplay) {
        //     s_oInterface.hideWalletForGameplay();
        //     console.log("🎮 Wallet hidden for gameplay - betting panel stays visible with toggle button");
        // }
        
        if (s_oGame && s_oGame.startGameplay) {
            s_oGame.startGameplay();
        }
        
        // Re-enable button after a short delay
        setTimeout(function() {
            var startBtn = document.getElementById('start-game');
            if (startBtn) startBtn.disabled = false;
        }, 1000);
    };
    
    this._backMenuHandler = function(e) {
        e.preventDefault();
        console.log("Home button clicked!");
        
        // Bet UI'yi gizle
        s_oInterface.hideBettingUI();
        
        // Oyunu temizle (güvenli şekilde) - ÖNCE oyunu temizle
        if (s_oGame && typeof s_oGame.unload === 'function') {
            try {
                console.log("Unloading game before going to menu...");
                s_oGame.unload();
                s_oGame = null; // Clear reference
            } catch (error) {
                console.log("Game unload error:", error);
            }
        }
        
        // Canvas'ı temizle
        if (s_oStage) {
            try {
                console.log("Clearing stage...");
                s_oStage.removeAllChildren();
                s_oStage.update();
            } catch (error) {
                console.log("Stage clear error:", error);
            }
        }
        
        // Ana sayfaya dön - SONRA menüye git
        if (s_oMain && s_oMain.gotoMenu) {
            console.log("Going to main menu...");
            s_oMain.gotoMenu();
        }
        
        // Iframe içindeyse parent'a mesaj gönder
        if (window.parent && window.parent !== window) {
            console.log("Sending message to parent window...");
            window.parent.postMessage({
                type: 'goToMainMenu',
                action: 'exit'
            }, '*');
        }
    };

    // Event handlers for betting UI
    this._betMinusHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (s_oGame && s_oGame.decreaseBet) {
            s_oGame.decreaseBet();
            s_oInterface.updateCurrentSelection();
        }
    };
    
    this._betPlusHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (s_oGame && s_oGame.increaseBet) {
            s_oGame.increaseBet();
            s_oInterface.updateCurrentSelection();
        }
    };
    
    this._startGameHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (s_oGame && s_oGame.startGameplay) {
            s_oGame.startGameplay();
        }
    };
    
    this._easyModeHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        _sCurrentDifficulty = 'easy';
        if (s_oGame && s_oGame.setDifficulty) {
            s_oGame.setDifficulty('easy');
        }
        // Update betting UI visuals
        s_oInterface.updateDifficultyButtons();
        s_oInterface.updateRiskDisplay();
        // Update left panel live stats risk
        if (window.sidePanels && typeof window.sidePanels.setDifficulty === 'function') {
            window.sidePanels.setDifficulty('easy');
        }
    };
    
    this._hardModeHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        _sCurrentDifficulty = 'hard';
        if (s_oGame && s_oGame.setDifficulty) {
            s_oGame.setDifficulty('hard');
        }
        // Update betting UI visuals
        s_oInterface.updateDifficultyButtons();
        s_oInterface.updateRiskDisplay();
        // Update left panel live stats risk
        if (window.sidePanels && typeof window.sidePanels.setDifficulty === 'function') {
            window.sidePanels.setDifficulty('hard');
        }
    };
    
    this._backMenuHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Hide both UIs proactively
        if (s_oInterface) {
            try { s_oInterface.hideGameUI(); } catch(_) {}
            try { s_oInterface.hideCanvasBettingUI(); } catch(_) {}
        }
        if (s_oMain && s_oMain.gotoMenu) {
            s_oMain.gotoMenu();
        }
    };

    // Add event listeners for HTML betting UI
    this._addBettingEventListeners = function() {
        var self = this;
        
        // Bet amount controls
        var betMinusBtn = document.getElementById('bet-minus');
        if (betMinusBtn) {
            betMinusBtn.addEventListener('click', this._betMinusHandler);
        }
        
        var betPlusBtn = document.getElementById('bet-plus');
        if (betPlusBtn) {
            betPlusBtn.addEventListener('click', this._betPlusHandler);
        }
        
        // Difficulty controls
        var easyModeBtn = document.getElementById('easy-mode');
        if (easyModeBtn) {
            easyModeBtn.addEventListener('click', this._easyModeHandler);
        }
        
        var hardModeBtn = document.getElementById('hard-mode');
        if (hardModeBtn) {
            hardModeBtn.addEventListener('click', this._hardModeHandler);
        }
        
        // Action buttons
        var startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', this._startGameHandler);
        }
        
        var backMenuBtn = document.getElementById('back-menu');
        if (backMenuBtn) {
            backMenuBtn.addEventListener('click', this._backMenuHandler);
        }
        
        // Game UI home button
        var backMenuGameBtn = document.getElementById('back-menu-game');
        if (backMenuGameBtn) {
            backMenuGameBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Home button (game) clicked!");
                
                // Game UI'yi gizle
                self.hideGameUI();
                
                // Ana sayfaya dön
                if (s_oMain && s_oMain.gotoMenu) {
                    s_oMain.gotoMenu();
                }
                
                // Oyunu temizle (güvenli şekilde)
                if (s_oGame && typeof s_oGame.unload === 'function') {
                    try {
                        s_oGame.unload();
                    } catch (error) {
                        console.log("Game unload error:", error);
                    }
                }
                
                // Iframe içindeyse parent'a mesaj gönder
                if (window.parent && window.parent !== window) {
                    console.log("Sending message to parent window...");
                    window.parent.postMessage({
                        type: 'goToMainMenu',
                        action: 'exit'
                    }, '*');
                }
            });
        }
        
        // Bet display - sadece gösterim için
        // Input alanı kaldırıldı, sadece +/- butonları kullanılıyor
        
        // Add keyboard support
        this._addBettingKeyboardEvents();
        
        console.log("=== All betting event listeners added successfully! ===");
        console.log("Total buttons found and configured:");
        console.log("- bet-minus:", document.getElementById('bet-minus') ? "✓" : "✗");
        console.log("- bet-plus:", document.getElementById('bet-plus') ? "✓" : "✗");
        console.log("- easy-mode:", document.getElementById('easy-mode') ? "✓" : "✗");
        console.log("- hard-mode:", document.getElementById('hard-mode') ? "✓" : "✗");
        console.log("- start-game:", document.getElementById('start-game') ? "✓" : "✗");
        console.log("- back-menu:", document.getElementById('back-menu') ? "✓" : "✗");
    };
    
    // Remove event listeners
    this._removeBettingEventListeners = function() {
        console.log("=== Removing betting event listeners ===");
        
        // Remove HTML event listeners
        var betMinusBtn = document.getElementById('bet-minus');
        if (betMinusBtn) {
            betMinusBtn.removeEventListener('click', this._betMinusHandler);
        }
        
        var betPlusBtn = document.getElementById('bet-plus');
        if (betPlusBtn) {
            betPlusBtn.removeEventListener('click', this._betPlusHandler);
        }
        
        var easyModeBtn = document.getElementById('easy-mode');
        if (easyModeBtn) {
            easyModeBtn.removeEventListener('click', this._easyModeHandler);
        }
        
        var hardModeBtn = document.getElementById('hard-mode');
        if (hardModeBtn) {
            hardModeBtn.removeEventListener('click', this._hardModeHandler);
        }
        
        var startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.removeEventListener('click', this._startGameHandler);
        }
        
        var backMenuBtn = document.getElementById('back-menu');
        if (backMenuBtn) {
            backMenuBtn.removeEventListener('click', this._backMenuHandler);
        }
        
        // Remove keyboard events
        this._removeBettingKeyboardEvents();
        
        console.log("=== All betting event listeners removed ===");
    };

    // Hide ALL UIs when navigating to menu (no restore)
    this.hideAllUIForMenu = function() {
        try {
            // Hide game UI without restoring betting UI
            _bGameUIVisible = false;
            // Hide betting UI hard
            var bettingUI = document.getElementById('betting-ui');
            if (bettingUI) {
                bettingUI.classList.remove('canvas-positioned');
                bettingUI.style.display = 'none';
                bettingUI.style.visibility = 'hidden';
                bettingUI.style.pointerEvents = 'none';
            }
            _bCanvasBettingUIVisible = false;
            // Clean listeners to avoid re-adding on menu
            this._removeBettingEventListeners();
            this._removeWalletToggleListeners && this._removeWalletToggleListeners();
            console.log('Canvas Betting UI hidden (menu)');
        } catch (e) {
            console.log('hideAllUIForMenu error:', e && e.message ? e.message : e);
        }
    };
    
    // Update difficulty button states
    // Update difficulty button states
    this.updateDifficultyButtons = function() {
        var easyBtn = document.getElementById('easy-mode');
        var hardBtn = document.getElementById('hard-mode');
        
        if (easyBtn && hardBtn) {
            // Önce tüm active class'ları kaldır
            easyBtn.classList.remove('active');
            hardBtn.classList.remove('active');
            
            // Sonra seçili olana active class ekle
            if (_sCurrentDifficulty === 'easy') {
                easyBtn.classList.add('active');
                console.log("Easy mode button activated");
            } else if (_sCurrentDifficulty === 'hard') {
                hardBtn.classList.add('active');
                console.log("Hard mode button activated");
            }
        }
    };
    // Add keyboard event listener for betting UI
    this._addBettingKeyboardEvents = function() {
        var self = this;
        
        $(document).on('keydown.betting', function(e) {
            if (!_bBettingUIVisible) return;
            
            // Enter key to start game
            if (e.keyCode === 13) { // Enter key
                s_oGame.startGameplay();
            }
            // E key for Easy mode
            else if (e.keyCode === 69) { // E key
                _sCurrentDifficulty = "easy";
                s_oGame.setDifficulty("easy");
                self.updateCurrentSelection();
            }
            // H key for Hard mode
            else if (e.keyCode === 72) { // H key
                _sCurrentDifficulty = "hard";
                s_oGame.setDifficulty("hard");
                self.updateCurrentSelection();
            }
        });
    };
    
    // Remove keyboard event listener for betting UI
    this._removeBettingKeyboardEvents = function() {
        $(document).off('keydown.betting');
    };
    this.updateWinnings = function(fWinnings) {
        if (_oWinningsText) {
            _oWinningsText.text = "Potential Winnings: " + fWinnings.toFixed(2) + " MON";
            _oWinningsOutline.text = "Potential Winnings: " + fWinnings.toFixed(2) + " MON";
        }
    };
    
    this.updateBetAmount = function(iBetAmount) {
        _iBetAmount = iBetAmount; // Store current bet amount
        var betDisplay = document.getElementById('bet-display');
        if (betDisplay) {
            betDisplay.textContent = iBetAmount.toFixed(1) + " MON";
        }
        
        // Update canvas bet amount too (not needed for HTML UI)
        // this.updateCanvasBetAmount(iBetAmount);
        
        this.updateCurrentSelection();
    };
    
    // Game UI elements
    var _oGamePanel;
    var _oMultiplierText;
    var _oWinningsDisplayText;
    var _oJumpsText;
    var _oCashoutButton;
    var _bGameUIVisible = false;
    
    // Auto mode event listeners
    var _autoModeListeners = [];
    
    // Show game UI during gameplay - Now using HTML elements
    this.showGameUI = function(iBetAmount, sDifficulty, fMultiplier) {
        if (USE_CREATEJS_CANVAS_UI) {
            this._showCanvasGameUI(iBetAmount, sDifficulty, fMultiplier);
            return;
        }
        console.log("showGameUI called with:", iBetAmount, sDifficulty, fMultiplier);
        
        // Transform canvas betting UI to game UI instead of showing separate UI
        var bettingUI = document.getElementById('betting-ui');
        if (!bettingUI) {
            console.error("Betting UI not found!");
            return;
        }
        
        // Hide betting controls and show game info
        var betSection = bettingUI.querySelector('.bet-section');
        var difficultySection = bettingUI.querySelector('.difficulty-section');
        var actionButtons = bettingUI.querySelector('.action-buttons');
        
        if (betSection) betSection.style.display = 'none';
        if (difficultySection) difficultySection.style.display = 'none';
        
        // Create or update game info section
        var gameInfoSection = bettingUI.querySelector('.game-info-section');
        if (!gameInfoSection) {
            gameInfoSection = document.createElement('div');
            gameInfoSection.className = 'game-info-section';
            gameInfoSection.innerHTML = `
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">Bet:</span>
                        <span id="canvas-game-bet">${iBetAmount} MON</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mode:</span>
                        <span id="canvas-game-mode">${sDifficulty.toUpperCase()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Multiplier:</span>
                        <span id="canvas-game-multiplier">${fMultiplier.toFixed(2)}x</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Winnings:</span>
                        <span id="canvas-game-winnings">${(iBetAmount * fMultiplier).toFixed(2)} MON</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Jumps:</span>
                        <span id="canvas-game-jumps">0</span>
                    </div>
                </div>
            `;
            bettingUI.querySelector('.ui-content').insertBefore(gameInfoSection, actionButtons);
            
            // Apply 100px right shift to game info section
            gameInfoSection.style.marginLeft = '100px';
            
            // Also apply to individual stat items
            setTimeout(function() {
                var statItems = gameInfoSection.querySelectorAll('.stat-item');
                statItems.forEach(function(item) {
                    item.style.marginLeft = '100px';
                });
            }, 50);
        } else {
            // Update existing game info
            document.getElementById('canvas-game-bet').textContent = iBetAmount + " MON";
            document.getElementById('canvas-game-mode').textContent = sDifficulty.toUpperCase();
            document.getElementById('canvas-game-multiplier').textContent = fMultiplier.toFixed(2) + "x";
            document.getElementById('canvas-game-winnings').textContent = (iBetAmount * fMultiplier).toFixed(2) + " MON";
            document.getElementById('canvas-game-jumps').textContent = "0";
        }
        
        // Update action buttons for game mode
        if (actionButtons) {
            actionButtons.innerHTML = `
                <button id="cashout-btn" class="action-btn primary">CASHOUT</button>
                <button id="back-menu-game" class="action-btn secondary">HOME</button>
            `;
        }
        
        // Add event listeners for new buttons
        var self = this;
        
        // Cashout button
        var cashoutBtn = document.getElementById('cashout-btn');
        if (cashoutBtn) {
            // Remove existing listeners to prevent duplicates
            cashoutBtn.removeEventListener('click', self._cashoutHandler);
            
            // Create new handler
            self._cashoutHandler = function(e) {
                e.preventDefault();
                console.log("Cashout button clicked!");
                
                // Check if game is active before allowing cashout
                if (s_oGame && s_oGame.cashout) {
                    // Check game state more thoroughly
                    const isGameStarted = s_oGame.isGameStarted && s_oGame.isGameStarted();
                    const isGameOver = s_oGame.isGameOver && s_oGame.isGameOver();
                    const isGameActive = isGameStarted && !isGameOver;
                    
                    console.log("Cashout check - Game started:", isGameStarted, "Game over:", isGameOver, "Game active:", isGameActive);
                    
                    if (isGameActive) {
                        s_oGame.cashout();
                    } else {
                        // Show user-friendly message
                        if (window.errorLogger) {
                            window.errorLogger.showErrorToUser('Game has not started yet or has ended. Please start the game first.');
                        }
                        console.log("Cashout blocked - game not active. Game started:", isGameStarted, "Game over:", isGameOver);
                    }
                } else {
                    console.log("Cashout blocked - game instance not available");
                }
            };
            
            cashoutBtn.addEventListener('click', self._cashoutHandler);
            
            // Initially disable cashout button
            cashoutBtn.disabled = true;
            cashoutBtn.style.opacity = '0.5';
            cashoutBtn.style.cursor = 'not-allowed';
        }
        
        // HOME button
        var backMenuGameBtn = document.getElementById('back-menu-game');
        if (backMenuGameBtn) {
            backMenuGameBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (s_oInterface) {
                    s_oInterface.hideGameUI();
                    s_oInterface.hideCanvasBettingUI();
                }
                if (s_oMain && s_oMain.gotoMenu) {
                    s_oMain.gotoMenu();
                }
            });
        }
        
        // Add keyboard support
        this._addGameKeyboardEvents();
        
        // Add canvas-positioned class for centering
        bettingUI.classList.add('canvas-positioned');
        
        // Apply 100px right shift to game UI sections
        setTimeout(function() {
            var gameInfoSection = bettingUI.querySelector('.game-info-section');
            if (gameInfoSection) {
                gameInfoSection.style.marginLeft = '100px';
                
                // Also apply to individual stat items
                var statItems = gameInfoSection.querySelectorAll('.stat-item');
                statItems.forEach(function(item) {
                    item.style.marginLeft = '100px';
                });
            }
            
            // Also apply to static game UI
            var staticGameUI = document.getElementById('game-ui');
            if (staticGameUI) {
                var gameInfo = staticGameUI.querySelector('.game-info');
                var infoItems = staticGameUI.querySelectorAll('.info-item');
                if (gameInfo) {
                    gameInfo.style.marginLeft = '100px';
                }
                infoItems.forEach(function(item) {
                    item.style.marginLeft = '100px';
                });
            }
        }, 100);
        
        _bGameUIVisible = true;
        console.log("Game UI should now be visible with working cashout button");
    };
    
    // Hide game UI and restore betting UI
    this.hideGameUI = function() {
        if (USE_CREATEJS_CANVAS_UI) {
            // Guard: do not hide during active gameplay (e.g., on jump)
            try {
                var inMenu = (typeof s_oMain !== 'undefined' && s_oMain && s_oMain.getState && s_oMain.getState() === STATE_MENU);
                var isOver = (typeof s_oGame !== 'undefined' && s_oGame && s_oGame.isGameOver && s_oGame.isGameOver());
                if (!inMenu && !isOver) {
                    return;
                }
            } catch(_) {}

            this._hideCanvasGameUI();
            // Return to betting bar when exiting game UI
            if (_bCanvasBettingUIVisible) {
                this._showCanvasBetUI(_iBetAmount || 1);
            }
            return;
        }
        console.log("hideGameUI called - restoring betting UI");
        console.log("Current _bGameUIVisible:", _bGameUIVisible);
        // If game UI is not visible, do not restore betting UI to avoid unwanted show on menu
        if (!_bGameUIVisible) {
            return;
        }
        
        var bettingUI = document.getElementById('betting-ui');
        if (!bettingUI) {
            console.error("Betting UI not found!");
            return;
        }
        
        // Show betting controls and hide game info
        var betSection = bettingUI.querySelector('.bet-section');
        var difficultySection = bettingUI.querySelector('.difficulty-section');
        var actionButtons = bettingUI.querySelector('.action-buttons');
        var gameInfoSection = bettingUI.querySelector('.game-info-section');
        
        if (betSection) {
            betSection.style.display = 'flex';
            betSection.style.marginLeft = '100px';
        }
        if (difficultySection) {
            difficultySection.style.display = 'flex';
            difficultySection.style.marginLeft = '100px';
        }
        if (gameInfoSection) gameInfoSection.remove();
        
        // Restore original action buttons
        if (actionButtons) {
            actionButtons.innerHTML = `
                <button id="recovery-funds" class="action-btn recovery" style="display: none;">🚨 RECOVER FUNDS</button>
                <button id="start-game" class="action-btn primary">START GAME</button>
                <button id="back-menu" class="action-btn secondary">HOME</button>
            `;
        }
        
        // Re-add betting event listeners
        this._addBettingEventListeners();
        
        // Ensure canvas betting UI is visible
        bettingUI.classList.add('canvas-positioned');
        bettingUI.style.display = 'flex';
        bettingUI.style.visibility = 'visible';
        
        _bGameUIVisible = false;
        _bCanvasBettingUIVisible = true;
        console.log("Betting UI restored and canvas UI shown");
    };
    // Update game UI during gameplay
    this.updateGameUI = function(fMultiplier, fWinnings, iJumps) {
        if (USE_CREATEJS_CANVAS_UI) {
            if (_oCanvasGameUIContainer && _oCanvasGameUIContainer.visible) {
                if (_gMultValue) _gMultValue.text = fMultiplier.toFixed(2) + "x";
                if (_gWinValue) _gWinValue.text = fWinnings.toFixed(2) + " MON";
                if (_gJumpsValue) _gJumpsValue.text = String(iJumps);
                s_oStage.update();
            }
            return;
        }
        if (_bGameUIVisible) {
            // Update canvas game UI elements
            var multiplierEl = document.getElementById('canvas-game-multiplier');
            var winningsEl = document.getElementById('canvas-game-winnings');
            var jumpsEl = document.getElementById('canvas-game-jumps');
            
            if (multiplierEl) multiplierEl.textContent = fMultiplier.toFixed(2) + "x";
            if (winningsEl) winningsEl.textContent = fWinnings.toFixed(2) + " MON";
            if (jumpsEl) jumpsEl.textContent = iJumps;
            
            // Enable cashout button when game is active
            var cashoutBtn = document.getElementById('cashout-btn');
            if (cashoutBtn && s_oGame) {
                const isGameStarted = s_oGame.isGameStarted && s_oGame.isGameStarted();
                const isGameOver = s_oGame.isGameOver && s_oGame.isGameOver();
                
                console.log("updateGameUI - Game started:", isGameStarted, "Game over:", isGameOver);
                
                if (isGameStarted && !isGameOver) {
                    cashoutBtn.disabled = false;
                    cashoutBtn.style.opacity = '1';
                    cashoutBtn.style.cursor = 'pointer';
                    
                    if (window.errorLogger) {
                        window.errorLogger.debug('Cashout button enabled in updateGameUI', {
                            isGameStarted: isGameStarted,
                            isGameOver: isGameOver
                        });
                    }
                } else {
                    // Disable button if game is not active
                    cashoutBtn.disabled = true;
                    cashoutBtn.style.opacity = '0.5';
                    cashoutBtn.style.cursor = 'not-allowed';
                }
            }
        }
    };

    // ===== CreateJS Canvas-native UI implementation =====
    this._showCanvasBetUI = function(iBetAmount) {
        // Lazy create container
        if (!_oCanvasBetUIContainer) {
            _oCanvasBetUIContainer = new createjs.Container();
            _oCanvasBetUIContainer.name = "CanvasBetUI";
            s_oStage.addChild(_oCanvasBetUIContainer);

            // Background bar
            var barHeight = 60;
            // Align the top of the bar to the bottom of the sea sprite (CRiverAnimation height is 130, positioned at y = PLATFORM_Y - 30)
            // Sea bottom = _iRiverY + _iRiverHeight = (PLATFORM_Y - 30) + 130 = PLATFORM_Y + 100
            // We align bar top to that value. Bar top Y = CANVAS_HEIGHT - barHeight + bottomOffset
            var seaBottomY = PLATFORM_Y + 100;
            // Clamp so the bar stays fully inside the canvas
            var topY = Math.min(seaBottomY, CANVAS_HEIGHT - barHeight);
            var bottomOffset = topY - (CANVAS_HEIGHT - barHeight);
            var bg = new createjs.Shape();
            bg.graphics.beginFill("rgba(0,0,0,0.9)").drawRoundRect(0, CANVAS_HEIGHT - barHeight + bottomOffset, CANVAS_WIDTH, barHeight, 10);
            bg.graphics.setStrokeStyle(2).beginStroke("#FFD700").drawRoundRect(0, CANVAS_HEIGHT - barHeight + bottomOffset, CANVAS_WIDTH, barHeight, 10);
            _oCanvasBetUIContainer.addChild(bg);
            _betBg = bg;

            // Fonts
            var labelColor = "#FFD700"; // gold
            var valueColor = "#00FF00"; // green

            // Bet label and controls
            _betLabelText = new createjs.Text("BET:", "bold 18px Orbitron", labelColor);
            _betLabelText.x = 20; _betLabelText.y = CANVAS_HEIGHT - barHeight + bottomOffset + 20;
            _oCanvasBetUIContainer.addChild(_betLabelText);

            _betMinusBtn = this._createCjsButton(90, CANVAS_HEIGHT - barHeight + bottomOffset + 14, 32, 32, "-");
            _betPlusBtn = this._createCjsButton(230, CANVAS_HEIGHT - barHeight + bottomOffset + 14, 32, 32, "+");
            _oCanvasBetUIContainer.addChild(_betMinusBtn.container, _betPlusBtn.container);

            _betValueText = new createjs.Text((iBetAmount || 1).toFixed(1) + " MON", "bold 18px Orbitron", valueColor);
            _betValueText.textAlign = "center";
            _betValueText.x = 170; _betValueText.y = CANVAS_HEIGHT - barHeight + bottomOffset + 20;
            _oCanvasBetUIContainer.addChild(_betValueText);

            // Mode label and buttons
            _modeLabelText = new createjs.Text("MODE:", "bold 18px Orbitron", labelColor);
            _modeLabelText.x = 320; _modeLabelText.y = CANVAS_HEIGHT - barHeight + bottomOffset + 20;
            _oCanvasBetUIContainer.addChild(_modeLabelText);

            _easyBtn = this._createCjsPill(400, CANVAS_HEIGHT - barHeight + bottomOffset + 12, 70, 36, "EASY", true);
            _hardBtn = this._createCjsPill(480, CANVAS_HEIGHT - barHeight + bottomOffset + 12, 70, 36, "HARD", false);
            _oCanvasBetUIContainer.addChild(_easyBtn.container, _hardBtn.container);

            // Play mode label and buttons
            _playModeLabelText = new createjs.Text("PLAY:", "bold 18px Orbitron", labelColor);
            _playModeLabelText.x = 580; _playModeLabelText.y = CANVAS_HEIGHT - barHeight + bottomOffset + 20;
            _oCanvasBetUIContainer.addChild(_playModeLabelText);

            _manualBtn = this._createCjsPill(650, CANVAS_HEIGHT - barHeight + bottomOffset + 12, 80, 36, "MANUAL", true);
            _autoBtn = this._createCjsPill(740, CANVAS_HEIGHT - barHeight + bottomOffset + 12, 80, 36, "AUTO", false);
            _manualBtn.container.name = "MANUAL";
            _autoBtn.container.name = "AUTO";
            _oCanvasBetUIContainer.addChild(_manualBtn.container, _autoBtn.container);

            // Action buttons (right side)
            _startBtn  = this._createCjsPrimary(CANVAS_WIDTH - 230, CANVAS_HEIGHT - barHeight + bottomOffset + 12, 120, 36, "START");
            _homeBtn   = this._createCjsButton(CANVAS_WIDTH - 100, CANVAS_HEIGHT - barHeight + bottomOffset + 12, 90, 36, "HOME");
            _oCanvasBetUIContainer.addChild(_startBtn.container, _homeBtn.container);

            // Handlers
            var self = this;
            _betMinusBtn.onClick(function(){ if (s_oGame && s_oGame.decreaseBet){ s_oGame.decreaseBet(); self._syncBetFromGame(); } });
            _betPlusBtn.onClick(function(){ if (s_oGame && s_oGame.increaseBet){ s_oGame.increaseBet(); self._syncBetFromGame(); } });
            _easyBtn.onClick(function(){ 
                _sCurrentDifficulty = 'easy'; 
                if (s_oGame && s_oGame.setDifficulty) s_oGame.setDifficulty('easy'); 
                self._setModeActive('easy'); 
                self.updateRiskDisplay(); 
                if (window.sidePanels) window.sidePanels.setDifficulty('easy');
                // Dispatch difficulty change event for AutoModeManager
                window.dispatchEvent(new CustomEvent("difficultyChanged", {
                    detail: { difficulty: 'easy' }
                }));
            });
            _hardBtn.onClick(function(){ 
                _sCurrentDifficulty = 'hard'; 
                if (s_oGame && s_oGame.setDifficulty) s_oGame.setDifficulty('hard'); 
                self._setModeActive('hard'); 
                self.updateRiskDisplay(); 
                if (window.sidePanels) window.sidePanels.setDifficulty('hard');
                // Dispatch difficulty change event for AutoModeManager
                window.dispatchEvent(new CustomEvent("difficultyChanged", {
                    detail: { difficulty: 'hard' }
                }));
            });
            
            // Auto/Manual mode handlers
            _manualBtn.onClick(function(){ 
                _bAutoMode = false; 
                self._setPlayModeActive('manual'); 
                if (window.autoModeManager) window.autoModeManager.setAutoMode(false);
                console.log("🤖 Manual mode selected");
            });
            _autoBtn.onClick(function(){ 
                _bAutoMode = true; 
                self._setPlayModeActive('auto'); 
                if (window.autoModeManager) window.autoModeManager.setAutoMode(true);
                console.log("🤖 Auto mode selected");
            });
            
            _startBtn.onClick(function(){ if (s_oGame && s_oGame.startGameplay) s_oGame.startGameplay(); });
            _homeBtn.onClick(function(){ if (s_oMain && s_oMain.gotoMenu) s_oMain.gotoMenu(); });
        }

        // Update bet value
        if (_betValueText) {
            _betValueText.text = (iBetAmount || 1).toFixed(1) + " MON";
        }

        // Toggle visibility
        if (_oCanvasBetUIContainer) {
            _oCanvasBetUIContainer.visible = true;
        }
        if (_oCanvasGameUIContainer) {
            _oCanvasGameUIContainer.visible = false;
        }
        s_oStage.update();
    };

    this._hideCanvasBetUI = function() {
        if (_oCanvasBetUIContainer) {
            _oCanvasBetUIContainer.visible = false;
            s_oStage.update();
        }
    };

    this._showCanvasGameUI = function(iBetAmount, sDifficulty, fMultiplier) {
        if (_oCanvasGameUIContainer == null) {
            _oCanvasGameUIContainer = new createjs.Container();
            _oCanvasGameUIContainer.name = "CanvasGameUI";
            s_oStage.addChild(_oCanvasGameUIContainer);

            var barHeight = 60;
            var seaBottomY = PLATFORM_Y + 100;
            var topY = Math.min(seaBottomY, CANVAS_HEIGHT - barHeight);
            var bottomOffset = topY - (CANVAS_HEIGHT - barHeight);
            var gbg = new createjs.Shape();
            gbg.graphics.beginFill("rgba(0,0,0,0.9)").drawRoundRect(0, CANVAS_HEIGHT - barHeight + bottomOffset, CANVAS_WIDTH, barHeight, 10);
            gbg.graphics.setStrokeStyle(2).beginStroke("#FFD700").drawRoundRect(0, CANVAS_HEIGHT - barHeight + bottomOffset, CANVAS_WIDTH, barHeight, 10);
            _oCanvasGameUIContainer.addChild(gbg);
            _gameBg = gbg;

            var labelColor = "#FFD700";
            var valueColor = "#00FF00";

            var baseY = CANVAS_HEIGHT - barHeight + bottomOffset + 10;
            var x = 20;
            var colW = 150;
            // Bet (stacked)
            _gBetLabel = new createjs.Text("Bet:", "bold 16px Orbitron", labelColor); _gBetLabel.x = x; _gBetLabel.y = baseY; _oCanvasGameUIContainer.addChild(_gBetLabel);
            _gBetValue = new createjs.Text("", "bold 18px Orbitron", valueColor); _gBetValue.x = x; _gBetValue.y = baseY + 20; _oCanvasGameUIContainer.addChild(_gBetValue);
            x += colW;
            // Mode (stacked)
            _gModeLabel = new createjs.Text("Mode:", "bold 16px Orbitron", labelColor); _gModeLabel.x = x; _gModeLabel.y = baseY; _oCanvasGameUIContainer.addChild(_gModeLabel);
            _gModeValue = new createjs.Text("", "bold 18px Orbitron", valueColor); _gModeValue.x = x; _gModeValue.y = baseY + 20; _oCanvasGameUIContainer.addChild(_gModeValue);
            x += colW;
            // Multiplier (stacked)
            _gMultLabel = new createjs.Text("Multiplier:", "bold 16px Orbitron", labelColor); _gMultLabel.x = x; _gMultLabel.y = baseY; _oCanvasGameUIContainer.addChild(_gMultLabel);
            _gMultValue = new createjs.Text("", "bold 18px Orbitron", valueColor); _gMultValue.x = x; _gMultValue.y = baseY + 20; _oCanvasGameUIContainer.addChild(_gMultValue);
            x += colW;
            // Winnings (stacked)
            _gWinLabel  = new createjs.Text("Winnings:", "bold 16px Orbitron", labelColor); _gWinLabel.x = x; _gWinLabel.y = baseY; _oCanvasGameUIContainer.addChild(_gWinLabel);
            _gWinValue  = new createjs.Text("", "bold 18px Orbitron", valueColor); _gWinValue.x = x; _gWinValue.y = baseY + 20; _oCanvasGameUIContainer.addChild(_gWinValue);
            x += colW;
            // Jumps (stacked)
            _gJumpsLabel= new createjs.Text("Jumps:", "bold 16px Orbitron", labelColor); _gJumpsLabel.x = x; _gJumpsLabel.y = baseY; _oCanvasGameUIContainer.addChild(_gJumpsLabel);
            _gJumpsValue= new createjs.Text("0", "bold 18px Orbitron", valueColor); _gJumpsValue.x = x; _gJumpsValue.y = baseY + 20; _oCanvasGameUIContainer.addChild(_gJumpsValue);

            // Buttons (right)
            _cashoutBtn    = this._createCjsPrimary(CANVAS_WIDTH - 230, baseY, 120, 36, "CASHOUT");
            _homeGameBtn   = this._createCjsButton(CANVAS_WIDTH - 100, baseY, 90, 36, "HOME");
            _oCanvasGameUIContainer.addChild(_cashoutBtn.container, _homeGameBtn.container);

            var self = this;
            _cashoutBtn.onClick(function(){ if (s_oGame && s_oGame.cashout) s_oGame.cashout(); });
            _homeGameBtn.onClick(function(){ if (s_oMain && s_oMain.gotoMenu) s_oMain.gotoMenu(); });
        }

        if (_gBetValue) _gBetValue.text = (iBetAmount || 1).toFixed(1) + " MON";
        if (_gModeValue) _gModeValue.text = (sDifficulty || 'easy').toUpperCase();
        if (_gMultValue) _gMultValue.text = (fMultiplier || 1).toFixed(2) + "x";
        if (_gWinValue) _gWinValue.text = ((iBetAmount || 1) * (fMultiplier || 1)).toFixed(2) + " MON";

        if (_oCanvasBetUIContainer) _oCanvasBetUIContainer.visible = false;
        if (_oCanvasGameUIContainer) _oCanvasGameUIContainer.visible = true;
        s_oStage.update();
    };

    this._hideCanvasGameUI = function() {
        if (_oCanvasGameUIContainer) {
            _oCanvasGameUIContainer.visible = false;
            s_oStage.update();
        }
    };

    this._setModeActive = function(mode) {
        if (_easyBtn && _hardBtn) {
            _easyBtn.setActive(mode === 'easy');
            _hardBtn.setActive(mode === 'hard');
            s_oStage.update();
        }
    };
    
    this._setPlayModeActive = function(mode) {
        console.log("🎯 Setting play mode:", mode, "Manual button:", !!_manualBtn, "Auto button:", !!_autoBtn);
        
        if (_manualBtn && _autoBtn) {
            _manualBtn.setActive(mode === 'manual');
            _autoBtn.setActive(mode === 'auto');
            s_oStage.update();
            console.log("✅ Play mode buttons updated");
        } else {
            console.warn("⚠️ Play mode buttons not found");
        }
    };

    this._syncBetFromGame = function() {
        if (s_oGame && s_oGame.getBetAmount && _betValueText) {
            _betValueText.text = s_oGame.getBetAmount().toFixed(1) + " MON";
            s_oStage.update();
        }
    };

    // Helpers to build CreateJS buttons
    this._createCjsButton = function(x, y, w, h, text) {
        var cont = new createjs.Container();
        var bg = new createjs.Shape();
        bg.graphics.beginFill("rgba(255,255,255,0.08)").setStrokeStyle(1).beginStroke("#FFD700").drawRoundRect(0, 0, w, h, 6);
        cont.addChild(bg);
        var t = new createjs.Text(text, "bold 14px Orbitron", "#FFD700");
        t.textAlign = "center"; t.textBaseline = "middle"; t.x = w/2; t.y = h/2;
        cont.addChild(t);
        cont.x = x; cont.y = y;
        cont.cursor = "pointer";
        var handler = null;
        cont.on("mousedown", function(){ bg.alpha = 0.8; });
        cont.on("pressup", function(){ bg.alpha = 1; if (handler) handler(); });
        return {
            container: cont,
            onClick: function(cb){ handler = cb; }
        };
    };

    this._createCjsPrimary = function(x, y, w, h, text) {
        var cont = new createjs.Container();
        var bg = new createjs.Shape();
        bg.graphics.beginLinearGradientFill(["#66ff66", "#00ff00"],[0,1],0,0,w,h).setStrokeStyle(1).beginStroke("#00CC00").drawRoundRect(0, 0, w, h, 6);
        cont.addChild(bg);
        var t = new createjs.Text(text, "bold 14px Orbitron", "#003300");
        t.textAlign = "center"; t.textBaseline = "middle"; t.x = w/2; t.y = h/2;
        cont.addChild(t);
        cont.x = x; cont.y = y;
        cont.cursor = "pointer";
        var handler = null;
        cont.on("mousedown", function(){ bg.alpha = 0.9; });
        cont.on("pressup", function(){ bg.alpha = 1; if (handler) handler(); });
        return {
            container: cont,
            onClick: function(cb){ handler = cb; }
        };
    };

    this._createCjsPill = function(x, y, w, h, text, active) {
        var cont = new createjs.Container();
        var bg = new createjs.Shape();
        function redraw() {
            bg.graphics.clear();
            if (active) {
                bg.graphics.beginLinearGradientFill(["#66ff66", "#00ff00"],[0,1],0,0,w,h).setStrokeStyle(1).beginStroke("#00CC00").drawRoundRect(0, 0, w, h, h/2);
            } else {
                bg.graphics.beginFill("rgba(255,255,255,0.08)").setStrokeStyle(1).beginStroke("#FFD700").drawRoundRect(0, 0, w, h, h/2);
            }
        }
        redraw();
        cont.addChild(bg);
        var t = new createjs.Text(text, "bold 12px Orbitron", active ? "#003300" : "#FFD700");
        t.textAlign = "center"; t.textBaseline = "middle"; t.x = w/2; t.y = h/2;
        cont.addChild(t);
        cont.x = x; cont.y = y;
        cont.cursor = "pointer";
        var handler = null;
        cont.on("mousedown", function(){ bg.alpha = 0.9; });
        cont.on("pressup", function(){ bg.alpha = 1; if (handler) handler(); });
        return {
            container: cont,
            onClick: function(cb){ handler = function(){ active = true; redraw(); t.color = "#003300"; cb(); }; },
            setActive: function(a){ active = a; redraw(); t.color = a?"#003300":"#FFD700"; }
        };
    };
    
    // Enable cashout button when game starts (but only after first jump)
    this.enableCashoutButton = function() {
        var cashoutBtn = document.getElementById('cashout-btn');
        if (cashoutBtn) {
            // İlk jump kontrolü - sadece ilk jump tamamlandıysa enable et
            if (s_oGame && s_oGame._bFirstJumpCompleted) {
                cashoutBtn.disabled = false;
                cashoutBtn.style.opacity = '1';
                cashoutBtn.style.cursor = 'pointer';
                console.log("✅ Cashout button enabled - first jump completed");
            } else {
                cashoutBtn.disabled = true;
                cashoutBtn.style.opacity = '0.5';
                cashoutBtn.style.cursor = 'not-allowed';
                console.log("⏳ Cashout button disabled - waiting for first jump");
            }
            
            if (window.errorLogger) {
                window.errorLogger.debug('Cashout button state updated');
            }
        }
    };
    
    // Disable cashout button
    this.disableCashoutButton = function() {
        var cashoutBtn = document.getElementById('cashout-btn');
        if (cashoutBtn) {
            cashoutBtn.disabled = true;
            cashoutBtn.style.opacity = '0.5';
            cashoutBtn.style.cursor = 'not-allowed';
            
            if (window.errorLogger) {
                window.errorLogger.debug('Cashout button disabled');
            }
        }
    };
    
    // Hide game UI
    // Hide game UI
    this._hideGameUILegacy = function() {
        if (!_bGameUIVisible) return;
        
        _bGameUIVisible = false;
        
        // Hide game UI
        document.getElementById('game-ui').style.display = 'none';
        
        // Hide UI container when no UI is active
        var uiContainer = document.getElementById('ui-container');
        if (uiContainer && !_bBettingUIVisible) {
            uiContainer.classList.remove('game-active');
        }
        
        // Remove keyboard event listener
        this._removeGameKeyboardEvents();
    };
    // Show cashout result
    this.showCashoutResult = function(fWinnings) {
        this.hideGameUI();
        
        // Cashout result panel
        var oResultPanel = new createjs.Shape();
        oResultPanel.graphics.beginFill("rgba(0,0,0,0.9)").drawRoundRect(CANVAS_WIDTH/2 - 200, CANVAS_HEIGHT/2 - 100, 400, 200, 20);
        s_oStage.addChild(oResultPanel);
        
        var oResultOutline = new createjs.Text("CASHOUT SUCCESSFUL!", "32px " + PRIMARY_FONT, "#000");
        oResultOutline.x = CANVAS_WIDTH/2;
        oResultOutline.y = CANVAS_HEIGHT/2 - 50;
        oResultOutline.textAlign = "center";
        oResultOutline.outline = 3;
        s_oStage.addChild(oResultOutline);
        
        var oResultText = new createjs.Text("CASHOUT SUCCESSFUL!", "32px " + PRIMARY_FONT, "#00FF00");
        oResultText.x = CANVAS_WIDTH/2;
        oResultText.y = CANVAS_HEIGHT/2 - 50;
        oResultText.textAlign = "center";
        s_oStage.addChild(oResultText);
        
        var oWinningsOutline = new createjs.Text("You won: " + fWinnings.toFixed(2) + " MON", "28px " + PRIMARY_FONT, "#000");
        oWinningsOutline.x = CANVAS_WIDTH/2;
        oWinningsOutline.y = CANVAS_HEIGHT/2;
        oWinningsOutline.textAlign = "center";
        oWinningsOutline.outline = 3;
        s_oStage.addChild(oWinningsOutline);
        
        var oWinningsText = new createjs.Text("You won: " + fWinnings.toFixed(2) + " MON", "28px " + PRIMARY_FONT, "#FFD700");
        oWinningsText.x = CANVAS_WIDTH/2;
        oWinningsText.y = CANVAS_HEIGHT/2;
        oWinningsText.textAlign = "center";
        s_oStage.addChild(oWinningsText);
        
        var oRestartText = new createjs.Text("Starting new game...", "20px " + PRIMARY_FONT, "#FFFFFF");
        oRestartText.x = CANVAS_WIDTH/2;
        oRestartText.y = CANVAS_HEIGHT/2 + 50;
        oRestartText.textAlign = "center";
        s_oStage.addChild(oRestartText);
    };
    
    // Game keyboard events
    this._addGameKeyboardEvents = function() {
        var self = this;
        $(document).on('keydown.game', function(e) {
            if (!_bGameUIVisible) return;
            
            // C key for cashout
            if (e.keyCode === 67) { // C key
                s_oGame.cashout();
            }
        });
    };
    
    this._removeGameKeyboardEvents = function() {
        $(document).off('keydown.game');
    };
    
    // Butonları her zaman en üstte tutmak için fonksiyon
    this.bringButtonsToFront = function() {
        try {
            // Exit butonu kaldırıldı
            
            // Audio butonunu en üste taşı
            if (_oAudioToggle && _oAudioToggle._oButton) {
                s_oStage.setChildIndex(_oAudioToggle._oButton, s_oStage.children.length - 1);
            }
            
            // Fullscreen butonunu en üste taşı
            if (_oButFullscreen && _oButFullscreen._oButton) {
                s_oStage.setChildIndex(_oButFullscreen._oButton, s_oStage.children.length - 1);
            }
            
            console.log("Buttons brought to front");
        } catch (e) {
            console.log("Error bringing buttons to front:", e);
        }
    };
    
    this.unload = function () {
        this._removeAutoModeListeners();
        
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            if (_oAudioToggle && typeof _oAudioToggle.unload === 'function') {
                _oAudioToggle.unload();
            }
            _oAudioToggle = null;
        }
        
        if (_fRequestFullScreen && screenfull.enabled){
            if (_oButFullscreen && typeof _oButFullscreen.unload === 'function') {
                _oButFullscreen.unload();
            }
        }

        // Exit butonu kaldırıldı
        s_oInterface = null;
    };
    
    // Auto mode event listeners
    this._addAutoModeListeners = function() {
        // Remove existing listeners first to prevent duplicates
        this._removeAutoModeListeners();
        
        // Manual mode button
        var manualModeBtn = document.getElementById('manual-mode');
        if (manualModeBtn) {
            var manualHandler = function() {
                this.setAutoMode(false);
            }.bind(this);
            manualModeBtn.addEventListener('click', manualHandler);
            _autoModeListeners.push({element: manualModeBtn, event: 'click', handler: manualHandler});
            console.log("🤖 Manual mode button listener added");
        }
        
        // Auto mode button
        var autoModeBtn = document.getElementById('auto-mode');
        if (autoModeBtn) {
            var autoHandler = function() {
                this.setAutoMode(true);
            }.bind(this);
            autoModeBtn.addEventListener('click', autoHandler);
            _autoModeListeners.push({element: autoModeBtn, event: 'click', handler: autoHandler});
            console.log("🤖 Auto mode button listener added");
        }
        
        // Platform minus button
        var platformMinusBtn = document.getElementById('platform-minus');
        if (platformMinusBtn) {
            var minusHandler = function() {
                if (window.autoModeManager) {
                    window.autoModeManager.decreaseTargetPlatform();
                }
            };
            platformMinusBtn.addEventListener('click', minusHandler);
            _autoModeListeners.push({element: platformMinusBtn, event: 'click', handler: minusHandler});
        }
        
        // Platform plus button
        var platformPlusBtn = document.getElementById('platform-plus');
        if (platformPlusBtn) {
            var plusHandler = function() {
                if (window.autoModeManager) {
                    window.autoModeManager.increaseTargetPlatform();
                }
            };
            platformPlusBtn.addEventListener('click', plusHandler);
            _autoModeListeners.push({element: platformPlusBtn, event: 'click', handler: plusHandler});
        }
        
        // Confirm auto settings button
        var confirmBtn = document.getElementById('confirm-auto-settings');
        if (confirmBtn) {
            var confirmHandler = function() {
                if (window.autoModeManager) {
                    window.autoModeManager.confirmAutoSettings();
                }
            };
            confirmBtn.addEventListener('click', confirmHandler);
            _autoModeListeners.push({element: confirmBtn, event: 'click', handler: confirmHandler});
        }
        
        // Cancel auto settings button
        var cancelBtn = document.getElementById('cancel-auto-settings');
        if (cancelBtn) {
            var cancelHandler = function() {
                if (window.autoModeManager) {
                    window.autoModeManager.cancelAutoSettings();
                }
            };
            cancelBtn.addEventListener('click', cancelHandler);
            _autoModeListeners.push({element: cancelBtn, event: 'click', handler: cancelHandler});
        }
        
        // Close auto settings button
        var closeBtn = document.getElementById('close-auto-settings');
        if (closeBtn) {
            var closeHandler = function() {
                if (window.autoModeManager) {
                    window.autoModeManager.cancelAutoSettings();
                }
            };
            closeBtn.addEventListener('click', closeHandler);
            _autoModeListeners.push({element: closeBtn, event: 'click', handler: closeHandler});
        }
        
        console.log("🤖 Auto mode listeners added");
    };
    
    this._removeAutoModeListeners = function() {
        _autoModeListeners.forEach(function(listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        _autoModeListeners = [];
        console.log("🤖 Auto mode listeners removed");
    };
    
    this.setAutoMode = function(bEnabled) {
        _bAutoMode = bEnabled;
        
        // Update UI
        var manualBtn = document.getElementById('manual-mode');
        var autoBtn = document.getElementById('auto-mode');
        
        if (manualBtn && autoBtn) {
            if (_bAutoMode) {
                manualBtn.classList.remove('active');
                autoBtn.classList.add('active');
            } else {
                manualBtn.classList.add('active');
                autoBtn.classList.remove('active');
            }
        }
        
        // Update auto mode manager
        if (window.autoModeManager) {
            window.autoModeManager.setAutoMode(_bAutoMode);
        }
        
        console.log("🤖 Auto mode:", _bAutoMode ? "ENABLED" : "DISABLED");
    };
    
    
    // Pause/Continue state
    var _bGamePaused = false;
    
    this._onPauseContinue = function ()
    {
        if (_bGamePaused) {
            // Resume game
            console.log("Resuming game...");
            _bGamePaused = false;
            s_oGame.resumeGame();
            // Hide betting UI if visible
            this.hideBettingUI();
        } else {
            // Pause game
            console.log("Pausing game...");
            _bGamePaused = true;
            s_oGame.pauseGame();
            // Show canvas betting UI for new bet
            this.showCanvasBettingUI(s_oGame.getCurrentBetAmount(), s_oGame.getCurrentDifficulty());
        }
    };
    
    this._onExit = function ()
    {
        s_oGame.unload();
        s_oMain.gotoMenu();
    };

    this.gameOver = function ()
    {
      _oEndPanel.show();  
    };
    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };
    
    this.resetFullscreenBut = function(){
	if (_oButFullscreen){
		_oButFullscreen.setActive(s_bFullscreen);
	}
    };

    this._onFullscreenRelease = function(){
        try {
            if(s_bFullscreen) { 
                _fCancelFullScreen.call(window.document);
                s_bFullscreen = false;
            }else{
                _fRequestFullScreen.call(window.document.documentElement);
                s_bFullscreen = true;
            }
        } catch (error) {
            console.log("Fullscreen error:", error);
        }
	
	sizeHandler();
	};
	
	// Button event handlers for betting UI - REMOVED
	// Artık HTML event listener'ları kullanıyoruz, bu fonksiyonlar gereksiz
	
	this._onEasyMode = function() {
	    _sCurrentDifficulty = "easy";
	    s_oGame.setDifficulty("easy");
	    this.updateCurrentSelection();
	    console.log("Easy mode selected");
	};
	
	this._onHardMode = function() {
	    _sCurrentDifficulty = "hard";
	    s_oGame.setDifficulty("hard");
	    this.updateCurrentSelection();
	    console.log("Hard mode selected");
	};
	
	// Update current selection display
	this.updateCurrentSelection = function() {
	    if (_bBettingUIVisible) {
	        // Bu fonksiyon artık gerekli değil çünkü HTML'de ayrı elementler var
	        console.log("Current selection: " + _iBetAmount + " MON, " + _sCurrentDifficulty.toUpperCase() + " mode");
	    }
	};
	
	this._onStartGame = function() {
	    this.hideBettingUI();
	    s_oGame.startGameplay();
	};
	// Add missing _onBackToMenu function
	this._onBackToMenu = function() {
	    this.hideBettingUI();
	    s_oGame.unload();
	    s_oMain.gotoMenu();
	};
	
	
	this._updateWalletVisibility = function() {
	    var walletContainer = document.querySelector('.privy-wallet-container');
	    
	    if (walletContainer) {
	        console.log("🔍 Current classes:", walletContainer.className);
	        console.log("🔍 Current style:", walletContainer.style.cssText);
	        
        if (_bWalletVisible) {
            walletContainer.classList.remove('wallet-hidden');
            walletContainer.classList.add('wallet-visible');
            
            // For left panel wallet, use relative positioning
            walletContainer.style.position = 'relative';
            walletContainer.style.top = 'auto';
            walletContainer.style.left = 'auto';
            walletContainer.style.opacity = '1';
            walletContainer.style.visibility = 'visible';
            walletContainer.style.pointerEvents = 'auto';
            walletContainer.style.transform = 'none';
            walletContainer.style.display = 'flex';
            
            console.log("👁️ Wallet panel shown in left panel - Classes:", walletContainer.className);
        } else {
            walletContainer.classList.remove('wallet-visible');
            walletContainer.classList.add('wallet-hidden');
            
            // For left panel wallet, use display none
            walletContainer.style.position = 'relative';
            walletContainer.style.top = 'auto';
            walletContainer.style.left = 'auto';
            walletContainer.style.opacity = '0';
            walletContainer.style.visibility = 'hidden';
            walletContainer.style.pointerEvents = 'none';
            walletContainer.style.transform = 'none';
            walletContainer.style.display = 'none';
            
            console.log("🙈 Wallet panel hidden in left panel - Classes:", walletContainer.className);
        }
	    } else {
	        console.error("❌ Wallet container not found");
	    }
	};
	
	
	// Public method to show wallet (called when game starts)
	this.showWallet = function() {
	    _bWalletVisible = true;
	    this._updateWalletVisibility();
	};
	
	// Public method to hide wallet (called when game starts)
	this.hideWallet = function() {
	    _bWalletVisible = false;
	    this._updateWalletVisibility();
	};
	
	// Public method to hide wallet for gameplay
	this.hideWalletForGameplay = function() {
	    _bWalletVisible = false;
	    this._updateWalletVisibility();
	    console.log("🎮 Wallet hidden for gameplay");
	};

// NEW: Check for active round and show recovery button
this._checkForActiveRound = async function() {
    try {
        if (!window.walletManager || !window.walletManager.isConnected()) {
            console.log("💡 Wallet not connected - no recovery check needed");
            return;
        }
        
        const contract = window.walletManager.getContract();
        const address = window.walletManager.getAddress();
        
        if (contract && address) {
            console.log("🔍 Checking for active round...");
            const hasActive = await contract.hasActiveRound(address);
            
            const recoveryBtn = document.getElementById('recovery-funds');
            if (hasActive && recoveryBtn) {
                console.log("⚠️ Active round detected - showing recovery button");
                recoveryBtn.style.display = 'inline-block';
                
                // Add click event listener
                recoveryBtn.addEventListener('click', this._onRecoveryFunds.bind(this));
            } else {
                console.log("✅ No active round - hiding recovery button");
                if (recoveryBtn) {
                    recoveryBtn.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.log("⚠️ Error checking active round:", error.message);
    }
};

// NEW: Recovery funds button handler
this._onRecoveryFunds = async function() {
    try {
        console.log("🚨 Recovery funds requested by user");
        
        const recoveryBtn = document.getElementById('recovery-funds');
        if (recoveryBtn) {
            recoveryBtn.disabled = true;
            recoveryBtn.textContent = 'RECOVERING...';
        }
        
        // Try recovery via WalletManager
        const result = await window.walletManager.recoverStuckRound();
        
        if (result.success) {
            console.log("✅ Recovery successful:", result.method);
            
            // Show success notification
            this._showRecoveryNotification(
                "✅ Funds Recovered!", 
                `Recovery completed via ${result.method}. Transaction: ${result.txHash.slice(0, 10)}...`,
                "success"
            );
            
            // Hide recovery button and refresh betting UI
            if (recoveryBtn) {
                recoveryBtn.style.display = 'none';
            }
            
            // Recovery button logic removed from betting UI
            // No refresh needed anymore
            
        } else {
            console.log("❌ Recovery failed:", result.error);
            this._showRecoveryNotification(
                "❌ Recovery Failed", 
                result.error || "Could not recover funds. Please try again.",
                "error"
            );
        }
        
    } catch (error) {
        console.error("❌ Recovery error:", error);
        this._showRecoveryNotification(
            "❌ Recovery Error", 
            error.message || "Unexpected error during recovery",
            "error"
        );
    } finally {
        // Reset button
        const recoveryBtn = document.getElementById('recovery-funds');
        if (recoveryBtn) {
            recoveryBtn.disabled = false;
            recoveryBtn.textContent = '🚨 RECOVER FUNDS';
        }
    }
};

// NEW: Show recovery notification
this._showRecoveryNotification = function(title, message, type) {
    // Create notification overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#4CAF50' : '#F44336';
    notification.style.cssText = `
        background: ${bgColor}; color: white; padding: 30px; border-radius: 15px;
        text-align: center; max-width: 400px; margin: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    notification.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 20px;">${title}</h3>
        <p style="margin: 0 0 20px 0; line-height: 1.4;">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: rgba(255,255,255,0.2); color: white; border: none; 
                       padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            OK
        </button>
    `;
    
    overlay.appendChild(notification);
    document.body.appendChild(overlay);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 10000);
    };
    
    // Cashout completed event handler
    this._onCashoutCompleted = function(event) {
        console.log("🎉 Cashout completed event received, ensuring UI is visible");
        
        // Hide game UI first
        if (this.hideGameUI) {
            this.hideGameUI();
            console.log("✅ Game UI hidden after cashout");
        }
        
        // Force show canvas betting UI and wallet after a short delay
        setTimeout(() => {
            // Show canvas betting UI with default values
            if (this.showCanvasBettingUI) {
                this.showCanvasBettingUI(1, 1); // Default bet amount and level
                console.log("✅ Canvas Betting UI shown after cashout event");
            }
            
            // Show wallet
            if (this.showWallet) {
                this.showWallet();
                console.log("✅ Wallet shown after cashout event");
            }
            
            // Force CSS display properties
            const bettingUI = document.getElementById('betting-ui');
            const walletContainer = document.querySelector('.privy-wallet-container');
            
            if (bettingUI) {
                bettingUI.style.display = 'block';
                console.log("✅ Betting UI CSS display forced to block");
            }
            
            if (walletContainer) {
                walletContainer.style.display = 'block';
                walletContainer.classList.remove('wallet-hidden');
                console.log("✅ Wallet container CSS display forced to block");
            }
        }, 1000); // 1 second delay to ensure all animations are complete
    };


    // Update risk display based on current difficulty
    this.updateRiskDisplay = function() {
        var riskValueElement = document.getElementById('risk-value');
        if (riskValueElement) {
            if (_sCurrentDifficulty === 'easy') {
                riskValueElement.textContent = '25% per platform';
            } else if (_sCurrentDifficulty === 'hard') {
                riskValueElement.textContent = '40% per platform';
            }
            console.log("Risk display updated for difficulty:", _sCurrentDifficulty);
        }
    };

s_oInterface = this;

this._init(iBestScore);

	return this;
}

var s_oInterface = null;
var s_bFirstPlay = true;
var s_bFirstPlay = true;