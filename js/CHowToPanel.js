function CHowToPanel(){
    
    var _oBg;
    var _oButExit;
    var _oFade;
    var _oHitArea;
    var _oContainer;
    var _oScrollContainer;
    var _oScrollMask;
    var _pStartPosExit;
    var _fScrollY = 0;
    var _fMaxScroll = 0;
    var _aInstructions = []; // Instructions array'i global olarak tanımla
    var _bTouchScrolling = false;
    var _fTouchStartY = 0;
    var _fTouchStartScroll = 0;
    
    this._init = function(){
        // Fade background - full screen hit area to block clicks behind panel
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        _oFade.alpha = 0;
        _oFade.mouseEnabled = true; // Enable mouse events to block clicks
        s_oStage.addChild(_oFade);
        new createjs.Tween.get(_oFade).to({alpha:0.8},500);
        _oFade.addEventListener("click", function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        // Main container
        _oContainer = new createjs.Container();
        _oContainer.y = CANVAS_HEIGHT + 100; 
        _oContainer.mouseEnabled = true;
        s_oStage.addChild(_oContainer);
        _oContainer.addEventListener("click", function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        // Background panel
        _oBg = new createjs.Shape();
        _oBg.graphics.beginLinearGradientFill([
            "#4A0E4E", "#2D1B69", "#1A0B3D"],
            [0, 0.5, 1],
            0, 0, 0, 400
        ).drawRoundRect(0, 0, 500, 400, 20);
        _oBg.x = (CANVAS_WIDTH - 500) / 2;
        _oBg.y = (CANVAS_HEIGHT - 400) / 2;
        _oBg.mouseEnabled = true;
        _oContainer.addChild(_oBg);
        _oBg.addEventListener("click", function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        // Golden border
        var panelBorder = new createjs.Shape();
        panelBorder.graphics.beginStroke("#FFD700").setStrokeStyle(4).drawRoundRect(0, 0, 500, 400, 20);
        panelBorder.x = (CANVAS_WIDTH - 500) / 2;
        panelBorder.y = (CANVAS_HEIGHT - 400) / 2;
        panelBorder.mouseEnabled = true;
        _oContainer.addChild(panelBorder);
        panelBorder.addEventListener("click", function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        // Exit button
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = {x: (CANVAS_WIDTH - 500) / 2 + 500 - 40, y: (CANVAS_HEIGHT - 400) / 2 + 20};
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, _oContainer);
        _oButExit.addEventListener(ON_MOUSE_UP, this.unload, this);

        // Title
        var titleText = new createjs.Text("HOW TO PLAY", "bold 26px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.textBaseline = "middle";
        titleText.x = CANVAS_WIDTH / 2;
        titleText.y = (CANVAS_HEIGHT - 400) / 2 + 50;
        titleText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        titleText.mouseEnabled = false;
        _oContainer.addChild(titleText);

        // Sadeleştirilmiş ve aralıklı, emojisiz metin (tek createjs.Text ile, panelin ortasında)
        var howToText =
            "1. Set your bet and pick a difficulty (Easy/Hard).\n\n" +
            "2. Press Start Game to start your adventure.\n\n" +
            "3. Jump on platforms to increase your multiplier.\n\n" +
            "4. Each jump is riskier than the last.\n\n" +
            "5. Cash out anytime to secure your winnings.\n\n" +
            "6. If you fail, the shark attacks and you lose your bet!\n\n" +
            "TIPS\n" +
            "• Start with small bets to learn the game.\n" +
            "• Watch the multiplier and don't get greedy!\n" +
            "• Cash out early for safer profits.\n\n" +
            "Good luck and have fun!";

        var instructionText = new createjs.Text(howToText, "bold 17px Arial", "#FFD700");
        instructionText.textAlign = "center";
        instructionText.textBaseline = "top";
        instructionText.lineWidth = 440;
        instructionText.x = CANVAS_WIDTH / 2;
        instructionText.y = (CANVAS_HEIGHT - 400) / 2 + 75; // Başlığa daha yakın
        instructionText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        instructionText.mouseEnabled = false;
        _oContainer.addChild(instructionText);

        // Panel animasyonu
        new createjs.Tween.get(_oContainer).to({y:0},1000, createjs.Ease.backOut);
    };

    this.unload = function(){
        _oButExit.unload(); 
        _oButExit = null;
        s_oStage.removeChild(_oFade);
        s_oStage.removeChild(_oContainer);
        s_oMenu.exitFromHowTo();
    };

    this._init();
}
