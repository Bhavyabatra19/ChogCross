function CToggle(iXPos, iYPos, oSprite, bActive, oParentContainer) {
    var _bActive;
    var _aCbCompleted;
    var _aCbOwner;
    var _oButton;
    var _oParentContainer;

    this._init = function (iXPos, iYPos, oSprite, bActive, oParentContainer) {
        if (oParentContainer !== undefined) {
            _oParentContainer = oParentContainer;
        } else {
            _oParentContainer = s_oStage;
        }

        _aCbCompleted = new Array();
        _aCbOwner = new Array();

        var oData = {
            images: [oSprite],
            // width, height & registration point of each sprite
            frames: {width: oSprite.width / 2, height: oSprite.height, regX: (oSprite.width / 2) / 2, regY: oSprite.height / 2},
            animations: {state_true: [0], state_false: [1]} // Frame'ler düzeltildi: true=0 (ses açık), false=1 (ses kapalı)
        };


        var oSpriteSheet = new createjs.SpriteSheet(oData);

        _bActive = bActive;

        _oButton = createSprite(oSpriteSheet, "state_" + _bActive, (oSprite.width / 2) / 2, oSprite.height / 2, oSprite.width / 2, oSprite.height);

        _oButton.x = iXPos;
        _oButton.y = iYPos;
        _oButton.stop();

        // CToggle için doğru hitArea ayarla - sprite sheet'in tek frame'i için
        _oButton.hitArea = new createjs.Shape();
        var hitWidth = oSprite.width / 2; // CToggle sprite sheet'in yarı genişliği (tek frame)
        var hitHeight = oSprite.height;
        var multiplier = s_bMobile ? 3 : 2; // Mobilde 3 kat, masaüstünde 2 kat
        
        // Fullscreen butonu için özel offset (50px sola kaydırma)
        var offsetX = 0;
        if (oSprite === s_oSpriteLibrary.getSprite('but_fullscreen')) {
            offsetX = -80; // Fullscreen butonu için 50px sola kaydır
        }
        
        // Registration point'e göre hitArea'yı ayarla
        _oButton.hitArea.graphics.beginFill("#000").drawRect(-hitWidth * multiplier/2 + offsetX, -hitHeight * multiplier/2, hitWidth * multiplier, hitHeight * multiplier);

        if (!s_bMobile)
            _oButton.cursor = "pointer";

        _oParentContainer.addChild(_oButton);

        this._initListener();
    };

    this.unload = function () {
        _oButton.off("mousedown");
        _oButton.off("pressup");

        _oParentContainer.removeChild(_oButton);
    };

    this._initListener = function () {
        var _oParent = this;
        _oButton.on("mousedown", function() { _oParent.buttonDown(); });
        _oButton.on("pressup", function() { _oParent.buttonRelease(); });
    };

    this.addEventListener = function (iEvent, cbCompleted, cbOwner) {
        _aCbCompleted[iEvent] = cbCompleted;
        _aCbOwner[iEvent] = cbOwner;
    };

    this.setCursorType = function (szValue) {
        _oButton.cursor = szValue;
    };

    this.setActive = function (bActive) {
        _bActive = bActive;
        _oButton.gotoAndStop("state_" + _bActive);
    };

    this.buttonRelease = function () {
        _oButton.scaleX = 1;
        _oButton.scaleY = 1;

        playSound("click", 1, false);

        _bActive = !_bActive;
        _oButton.gotoAndStop("state_" + _bActive);

        if (_aCbCompleted[ON_MOUSE_UP]) {
            _aCbCompleted[ON_MOUSE_UP].call(_aCbOwner[ON_MOUSE_UP], _bActive);
        }
    };

    this.buttonDown = function () {
        _oButton.scaleX = 0.9;
        _oButton.scaleY = 0.9;

        if (_aCbCompleted[ON_MOUSE_DOWN]) {
            _aCbCompleted[ON_MOUSE_DOWN].call(_aCbOwner[ON_MOUSE_DOWN]);
        }
    };

    this.setPosition = function (iX, iY) {
        _oButton.x = iX;
        _oButton.y = iY;
    };

    this._init(iXPos, iYPos, oSprite, bActive, oParentContainer);
}