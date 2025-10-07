function CGamblingSetup() {
    var _oContainer;
    var _oBackground;
    var _oBetAmountText;
    var _oDifficultyText;
    var _oCurrentWinningsText;
    var _oRiskText;
    
    // Gambling ayarları
    var _iBetAmount = 1; // 1-5 MON
    var _sDifficulty = "easy"; // "easy" veya "hard"
    var _bSetupComplete = false;
    
    // Butonlar
    var _oButBetMinus;
    var _oButBetPlus;
    var _oButEasyMode;
    var _oButHardMode;
    var _oButStartGame;
    var _oButBack;
    
    // Multiplier tabloları - EXACT CONTRACT VALUES
    var _aEasyMultipliers = [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19, 7.19]; // 8 platforms (7th is celebration)
    var _aHardMultipliers = [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30, 34.30]; // 8 platforms (7th is celebration)
    
    this._init = function() {
        _oContainer = new createjs.Container();
        s_oStage.addChild(_oContainer);
        
        // Arka plan
        _oBackground = createBitmap(s_oSpriteLibrary.getSprite("msg_box"));
        _oBackground.x = CANVAS_WIDTH/2;
        _oBackground.y = CANVAS_HEIGHT/2;
        _oBackground.regX = _oBackground.getBounds().width/2;
        _oBackground.regY = _oBackground.getBounds().height/2;
        _oContainer.addChild(_oBackground);
        
        // Başlık
        var oTitle = new createjs.Text("CHOG CROSS GAMBLING", "bold 48px " + PRIMARY_FONT, "#FFD700");
        oTitle.x = CANVAS_WIDTH/2;
        oTitle.y = 100;
        oTitle.textAlign = "center";
        oTitle.shadow = new createjs.Shadow("#000000", 2, 2, 2);
        _oContainer.addChild(oTitle);
        
        // Bahis miktarı bölümü
        var oBetLabel = new createjs.Text("BET AMOUNT:", "bold 32px " + PRIMARY_FONT, "#FFFFFF");
        oBetLabel.x = CANVAS_WIDTH/2 - 150;
        oBetLabel.y = 180;
        oBetLabel.textAlign = "center";
        _oContainer.addChild(oBetLabel);
        
        // Bahis azaltma butonu
        _oButBetMinus = new CGfxButton(CANVAS_WIDTH/2 - 100, 220, s_oSpriteLibrary.getSprite("but_no"));
        _oButBetMinus.addEventListener(ON_MOUSE_UP, this._onBetMinus, this);
        _oContainer.addChild(_oButBetMinus);
        
        // Bahis miktarı text
        _oBetAmountText = new createjs.Text(_iBetAmount + " MON", "bold 36px " + PRIMARY_FONT, "#00FF00");
        _oBetAmountText.x = CANVAS_WIDTH/2;
        _oBetAmountText.y = 230;
        _oBetAmountText.textAlign = "center";
        _oContainer.addChild(_oBetAmountText);
        
        // Bahis artırma butonu
        _oButBetPlus = new CGfxButton(CANVAS_WIDTH/2 + 100, 220, s_oSpriteLibrary.getSprite("but_yes"));
        _oButBetPlus.addEventListener(ON_MOUSE_UP, this._onBetPlus, this);
        _oContainer.addChild(_oButBetPlus);
        
        // Zorluk seçimi bölümü
        var oDiffLabel = new createjs.Text("DIFFICULTY:", "bold 32px " + PRIMARY_FONT, "#FFFFFF");
        oDiffLabel.x = CANVAS_WIDTH/2;
        oDiffLabel.y = 300;
        oDiffLabel.textAlign = "center";
        _oContainer.addChild(oDiffLabel);
        
        // Easy mode butonu
        _oButEasyMode = new CGfxButton(CANVAS_WIDTH/2 - 120, 340, s_oSpriteLibrary.getSprite("but_play"));
        _oButEasyMode.addEventListener(ON_MOUSE_UP, this._onEasyMode, this);
        _oContainer.addChild(_oButEasyMode);
        
        // Easy mode text
        var oEasyText = new createjs.Text("EASY\n25% Risk", "bold 22px " + PRIMARY_FONT, "#00FF00");
        oEasyText.x = CANVAS_WIDTH/2 - 120;
        oEasyText.y = 380;
        oEasyText.textAlign = "center";
        oEasyText.lineHeight = 26;
        _oContainer.addChild(oEasyText);
        
        // Hard mode butonu
        _oButHardMode = new CGfxButton(CANVAS_WIDTH/2 + 120, 340, s_oSpriteLibrary.getSprite("but_play"));
        _oButHardMode.addEventListener(ON_MOUSE_UP, this._onHardMode, this);
        _oContainer.addChild(_oButHardMode);
        
        // Hard mode text
        var oHardText = new createjs.Text("HARD\n40% Risk", "bold 22px " + PRIMARY_FONT, "#FF4444");
        oHardText.x = CANVAS_WIDTH/2 + 120;
        oHardText.y = 380;
        oHardText.textAlign = "center";
        oHardText.lineHeight = 26;
        _oContainer.addChild(oHardText);
        
        // Mevcut seçim gösterimi
        _oDifficultyText = new createjs.Text("Selected: EASY MODE", "bold 26px " + PRIMARY_FONT, "#FFD700");
        _oDifficultyText.x = CANVAS_WIDTH/2;
        _oDifficultyText.y = 430;
        _oDifficultyText.textAlign = "center";
        _oContainer.addChild(_oDifficultyText);
        
        // Potansiyel kazanç gösterimi
        _oCurrentWinningsText = new createjs.Text("Max Potential: " + this._calculateMaxWinnings() + " MON", "bold 24px " + PRIMARY_FONT, "#FFFF00");
        _oCurrentWinningsText.x = CANVAS_WIDTH/2;
        _oCurrentWinningsText.y = 460;
        _oCurrentWinningsText.textAlign = "center";
        _oContainer.addChild(_oCurrentWinningsText);
        
        // Risk açıklaması
        _oRiskText = new createjs.Text("Each platform has 25% chance of failure", "20px " + PRIMARY_FONT, "#CCCCCC");
        _oRiskText.x = CANVAS_WIDTH/2;
        _oRiskText.y = 490;
        _oRiskText.textAlign = "center";
        _oContainer.addChild(_oRiskText);
        
        // Start Game butonu
        _oButStartGame = new CGfxButton(CANVAS_WIDTH/2, 540, s_oSpriteLibrary.getSprite("but_play"));
        _oButStartGame.addEventListener(ON_MOUSE_UP, this._onStartGame, this);
        _oContainer.addChild(_oButStartGame);
        
        var oStartText = new createjs.Text("START GAMBLING", "bold 24px " + PRIMARY_FONT, "#FFFFFF");
        oStartText.x = CANVAS_WIDTH/2;
        oStartText.y = 580;
        oStartText.textAlign = "center";
        _oContainer.addChild(oStartText);
        
        // Back butonu
        _oButBack = new CGfxButton(50, 50, s_oSpriteLibrary.getSprite("but_exit"));
        _oButBack.addEventListener(ON_MOUSE_UP, this._onBack, this);
        _oContainer.addChild(_oButBack);
        
        this._updateDisplay();
    };
    
    this._calculateMaxWinnings = function() {
        var multipliers = (_sDifficulty === "easy") ? _aEasyMultipliers : _aHardMultipliers;
        var maxMultiplier = multipliers[multipliers.length - 1];
        var maxWinnings = _iBetAmount * maxMultiplier;
        return Math.min(maxWinnings, 100); // 100 MON limit
    };
    
    this._updateDisplay = function() {
        _oBetAmountText.text = _iBetAmount + " MON";
        _oDifficultyText.text = "Selected: " + (_sDifficulty === "easy" ? "EASY MODE" : "HARD MODE");
        _oCurrentWinningsText.text = "Max Potential: " + this._calculateMaxWinnings() + " MON";
        _oRiskText.text = "Each platform has " + (_sDifficulty === "easy" ? "25%" : "40%") + " chance of failure";
    };
    
    this._onBetMinus = function() {
        if (_iBetAmount > 1) {
            _iBetAmount--;
            this._updateDisplay();
        }
    };
    
    this._onBetPlus = function() {
        if (_iBetAmount < 5) {
            _iBetAmount++;
            this._updateDisplay();
        }
    };
    
    this._onEasyMode = function() {
        _sDifficulty = "easy";
        this._updateDisplay();
    };
    
    this._onHardMode = function() {
        _sDifficulty = "hard";
        this._updateDisplay();
    };
    
    this._onStartGame = function() {
        _bSetupComplete = true;
        this.unload();
        
        // Gambling oyununu başlat
        s_oMain.startGamblingGame(_iBetAmount, _sDifficulty);
    };
    
    this._onBack = function() {
        this.unload();
        s_oMain.gotoMenu();
    };
    
    this.unload = function() {
        if (_oButBetMinus) _oButBetMinus.unload();
        if (_oButBetPlus) _oButBetPlus.unload();
        if (_oButEasyMode) _oButEasyMode.unload();
        if (_oButHardMode) _oButHardMode.unload();
        if (_oButStartGame) _oButStartGame.unload();
        if (_oButBack) _oButBack.unload();
        
        if (_oContainer) {
            s_oStage.removeChild(_oContainer);
            _oContainer = null;
        }
    };
    
    // Getter fonksiyonları
    this.getBetAmount = function() { return _iBetAmount; };
    this.getDifficulty = function() { return _sDifficulty; };
    this.getEasyMultipliers = function() { return _aEasyMultipliers; };
    this.getHardMultipliers = function() { return _aHardMultipliers; };
    
    this._init();
}